# backend/app.py
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import logging
from datetime import datetime
import uuid

# Import our modules
from config import get_config, Config
from models.rag_model import RAGModel
from models.chat_model import ChatModel
from utils.analytics import AnalyticsTracker
from utils.pdf_generator import PDFGenerator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Load configuration
config = get_config()
app.config.from_object(config)

# Ensure directories exist
config.ensure_directories()

# Validate configuration
try:
    config.validate_config()
    logger.info("Configuration validated successfully")
except ValueError as e:
    logger.error(f"Configuration error: {str(e)}")
    exit(1)

# Enable CORS
CORS(app, origins=config.CORS_ORIGINS)

# Initialize components
rag_model = RAGModel()
chat_model = ChatModel()
analytics = AnalyticsTracker()
pdf_generator = PDFGenerator()

def load_json_file(filepath, default=None):
    """Load JSON file with error handling"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"File not found: {filepath}")
        return default or {}
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in file: {filepath}")
        return default or {}

def save_json_file(filepath, data):
    """Save data to JSON file with error handling"""
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Error saving file {filepath}: {str(e)}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'rag_model': rag_model.is_ready(),
            'chat_model': chat_model.is_ready()
        }
    })

@app.route('/api/resume-data', methods=['GET'])
def get_resume_data():
    """Get resume data for frontend"""
    try:
        resume_data = load_json_file(config.RESUME_DATA_FILE)
        
        # Track page view
        visitor_info = {
            'ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent'),
            'timestamp': datetime.now().isoformat()
        }
        analytics.track_visit(visitor_info)
        
        return jsonify({
            'success': True,
            'data': resume_data
        })
    except Exception as e:
        logger.error(f"Error getting resume data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to load resume data'
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """Handle chat requests with RAG"""
    try:
        data = request.json
        message = data.get('message', '').strip()
        mode = data.get('mode', 'strict')  # 'strict' or 'open'
        context = data.get('context', '')  # Selected text or current section
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message cannot be empty'
            }), 400
        
        # Get RAG context
        rag_context = rag_model.get_relevant_context(message, context)
        
        # Generate response
        response = chat_model.generate_response(
            message=message,
            mode=mode,
            context=rag_context,
            selected_text=context
        )
        
        # Save conversation
        conversation = {
            'session_id': session_id,
            'timestamp': datetime.now().isoformat(),
            'message': message,
            'response': response,
            'mode': mode,
            'context': context
        }
        
        conversations = load_json_file(config.CONVERSATIONS_FILE, [])
        conversations.append(conversation)
        save_json_file(config.CONVERSATIONS_FILE, conversations[-100:])  # Keep last 100
        
        # Track chat interaction
        analytics.track_chat_interaction(session_id, message, mode)
        
        return jsonify({
            'success': True,
            'response': response,
            'session_id': session_id,
            'suggestions': chat_model.get_follow_up_suggestions(message, response)
        })
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process chat message'
        }), 500

@app.route('/api/explain-text', methods=['POST'])
def explain_text():
    """Explain selected text using AI"""
    try:
        data = request.json
        selected_text = data.get('text', '').strip()
        section = data.get('section', '')
        
        if not selected_text:
            return jsonify({
                'success': False,
                'error': 'No text selected'
            }), 400
        
        # Get explanation using RAG
        explanation = chat_model.explain_text(selected_text, section)
        
        return jsonify({
            'success': True,
            'explanation': explanation,
            'original_text': selected_text
        })
        
    except Exception as e:
        logger.error(f"Error explaining text: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to explain text'
        }), 500

@app.route('/api/download-resume', methods=['POST'])
def download_resume():
    """Generate and download resume PDF"""
    try:
        data = request.json
        resume_type = data.get('type', 'uploaded')  # 'uploaded' or 'dynamic'
        
        if resume_type == 'uploaded':
            # Return the uploaded PDF
            pdf_path = os.path.join(config.RESUMES_DIR, 'sai_resume.pdf')
            if os.path.exists(pdf_path):
                return send_file(pdf_path, as_attachment=True, 
                               download_name='Sai_Teja_Reddy_Resume.pdf')
            else:
                return jsonify({
                    'success': False,
                    'error': 'Uploaded resume not found'
                }), 404
        
        elif resume_type == 'dynamic':
            # Generate PDF from website data
            resume_data = load_json_file(config.RESUME_DATA_FILE)
            pdf_path = pdf_generator.generate_resume_pdf(resume_data)
            
            return send_file(pdf_path, as_attachment=True,
                           download_name='Sai_Teja_Reddy_Dynamic_Resume.pdf')
        
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid resume type'
            }), 400
            
    except Exception as e:
        logger.error(f"Error downloading resume: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate resume'
        }), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data for admin dashboard"""
    try:
        # Verify admin access (simple password check)
        auth_header = request.headers.get('Authorization')
        if not auth_header or auth_header != f"Bearer {config.ADMIN_PASSWORD}":
            return jsonify({'error': 'Unauthorized'}), 401
        
        analytics_data = analytics.get_analytics_summary()
        return jsonify({
            'success': True,
            'data': analytics_data
        })
        
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to load analytics'
        }), 500

@app.route('/api/admin/update-resume', methods=['POST'])
def update_resume_data():
    """Update resume data (admin only)"""
    try:
        # Verify admin access
        auth_header = request.headers.get('Authorization')
        if not auth_header or auth_header != f"Bearer {config.ADMIN_PASSWORD}":
            return jsonify({'error': 'Unauthorized'}), 401
        
        new_data = request.json
        
        # Validate data structure (basic validation)
        required_sections = ['personal_info', 'experience', 'education', 'skills', 'projects']
        for section in required_sections:
            if section not in new_data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required section: {section}'
                }), 400
        
        # Save updated data
        if save_json_file(config.RESUME_DATA_FILE, new_data):
            # Refresh RAG model with new data
            rag_model.refresh_embeddings(new_data)
            
            return jsonify({
                'success': True,
                'message': 'Resume data updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to save resume data'
            }), 500
            
    except Exception as e:
        logger.error(f"Error updating resume data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update resume data'
        }), 500

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    """Get conversation history (admin only)"""
    try:
        # Verify admin access
        auth_header = request.headers.get('Authorization')
        if not auth_header or auth_header != f"Bearer {config.ADMIN_PASSWORD}":
            return jsonify({'error': 'Unauthorized'}), 401
        
        conversations = load_json_file(config.CONVERSATIONS_FILE, [])
        return jsonify({
            'success': True,
            'conversations': conversations
        })
        
    except Exception as e:
        logger.error(f"Error getting conversations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to load conversations'
        }), 500

@app.route('/api/analytics/track', methods=['POST'])
def track_analytics():
    """Track custom analytics events"""
    try:
        data = request.json
        events = data.get('events', [])
        user_info = data.get('user_info', {})
        
        for event in events:
            # Add user info to each event
            event.update({
                'ip': request.remote_addr,
                'user_agent': request.headers.get('User-Agent')
            })
            
            # Track based on event type
            if event.get('event') == 'page_view':
                analytics.track_visit(event)
            elif event.get('event') in ['click', 'navigation', 'chat_message']:
                analytics.track_chat_interaction(
                    event.get('session_id', 'unknown'),
                    event.get('message', ''),
                    event.get('mode', 'unknown')
                )
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Error tracking analytics: {str(e)}")
        return jsonify({'success': False}), 500

if __name__ == '__main__':
    # Initialize RAG model on startup
    try:
        resume_data = load_json_file(config.RESUME_DATA_FILE)
        if resume_data:
            rag_model.initialize_embeddings(resume_data)
            logger.info("RAG model initialized successfully")
        else:
            logger.warning("No resume data found for RAG initialization")
    except Exception as e:
        logger.error(f"Failed to initialize RAG model: {str(e)}")
    
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=config.DEBUG)

def load_json_file(filepath, default=None):
    """Load JSON file with error handling"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"File not found: {filepath}")
        return default or {}
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in file: {filepath}")
        return default or {}

def save_json_file(filepath, data):
    """Save data to JSON file with error handling"""
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Error saving file {filepath}: {str(e)}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'rag_model': rag_model.is_ready(),
            'chat_model': chat_model.is_ready()
        }
    })

@app.route('/api/resume-data', methods=['GET'])
def get_resume_data():
    """Get resume data for frontend"""
    try:
        resume_data = load_json_file(RESUME_DATA_FILE)
        
        # Track page view
        visitor_info = {
            'ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent'),
            'timestamp': datetime.now().isoformat()
        }
        analytics.track_visit(visitor_info)
        
        return jsonify({
            'success': True,
            'data': resume_data
        })
    except Exception as e:
        logger.error(f"Error getting resume data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to load resume data'
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """Handle chat requests with RAG"""
    try:
        data = request.json
        message = data.get('message', '').strip()
        mode = data.get('mode', 'strict')  # 'strict' or 'open'
        context = data.get('context', '')  # Selected text or current section
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message cannot be empty'
            }), 400
        
        # Get RAG context
        rag_context = rag_model.get_relevant_context(message, context)
        
        # Generate response
        response = chat_model.generate_response(
            message=message,
            mode=mode,
            context=rag_context,
            selected_text=context
        )
        
        # Save conversation
        conversation = {
            'session_id': session_id,
            'timestamp': datetime.now().isoformat(),
            'message': message,
            'response': response,
            'mode': mode,
            'context': context
        }
        
        conversations = load_json_file(CONVERSATIONS_FILE, [])
        conversations.append(conversation)
        save_json_file(CONVERSATIONS_FILE, conversations[-100:])  # Keep last 100
        
        # Track chat interaction
        analytics.track_chat_interaction(session_id, message, mode)
        
        return jsonify({
            'success': True,
            'response': response,
            'session_id': session_id,
            'suggestions': chat_model.get_follow_up_suggestions(message, response)
        })
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process chat message'
        }), 500

@app.route('/api/explain-text', methods=['POST'])
def explain_text():
    """Explain selected text using AI"""
    try:
        data = request.json
        selected_text = data.get('text', '').strip()
        section = data.get('section', '')
        
        if not selected_text:
            return jsonify({
                'success': False,
                'error': 'No text selected'
            }), 400
        
        # Get explanation using RAG
        explanation = chat_model.explain_text(selected_text, section)
        
        return jsonify({
            'success': True,
            'explanation': explanation,
            'original_text': selected_text
        })
        
    except Exception as e:
        logger.error(f"Error explaining text: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to explain text'
        }), 500

@app.route('/api/download-resume', methods=['POST'])
def download_resume():
    """Generate and download resume PDF"""
    try:
        data = request.json
        resume_type = data.get('type', 'uploaded')  # 'uploaded' or 'dynamic'
        
        if resume_type == 'uploaded':
            # Return the uploaded PDF
            pdf_path = os.path.join('..', 'frontend', 'resumes', 'sai_resume.pdf')
            if os.path.exists(pdf_path):
                return send_file(pdf_path, as_attachment=True, 
                               download_name='Sai_Teja_Reddy_Resume.pdf')
            else:
                return jsonify({
                    'success': False,
                    'error': 'Uploaded resume not found'
                }), 404
        
        elif resume_type == 'dynamic':
            # Generate PDF from website data
            resume_data = load_json_file(RESUME_DATA_FILE)
            pdf_path = pdf_generator.generate_resume_pdf(resume_data)
            
            return send_file(pdf_path, as_attachment=True,
                           download_name='Sai_Teja_Reddy_Dynamic_Resume.pdf')
        
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid resume type'
            }), 400
            
    except Exception as e:
        logger.error(f"Error downloading resume: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate resume'
        }), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data for admin dashboard"""
    try:
        # Verify admin access (simple password check)
        auth_header = request.headers.get('Authorization')
        if not auth_header or auth_header != f"Bearer {os.getenv('ADMIN_PASSWORD')}":
            return jsonify({'error': 'Unauthorized'}), 401
        
        analytics_data = analytics.get_analytics_summary()
        return jsonify({
            'success': True,
            'data': analytics_data
        })
        
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to load analytics'
        }), 500

@app.route('/api/admin/update-resume', methods=['POST'])
def update_resume_data():
    """Update resume data (admin only)"""
    try:
        # Verify admin access
        auth_header = request.headers.get('Authorization')
        if not auth_header or auth_header != f"Bearer {os.getenv('ADMIN_PASSWORD')}":
            return jsonify({'error': 'Unauthorized'}), 401
        
        new_data = request.json
        
        # Validate data structure (basic validation)
        required_sections = ['personal_info', 'experience', 'education', 'skills', 'projects']
        for section in required_sections:
            if section not in new_data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required section: {section}'
                }), 400
        
        # Save updated data
        if save_json_file(RESUME_DATA_FILE, new_data):
            # Refresh RAG model with new data
            rag_model.refresh_embeddings(new_data)
            
            return jsonify({
                'success': True,
                'message': 'Resume data updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to save resume data'
            }), 500
            
    except Exception as e:
        logger.error(f"Error updating resume data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update resume data'
        }), 500

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    """Get conversation history (admin only)"""
    try:
        # Verify admin access
        auth_header = request.headers.get('Authorization')
        if not auth_header or auth_header != f"Bearer {os.getenv('ADMIN_PASSWORD')}":
            return jsonify({'error': 'Unauthorized'}), 401
        
        conversations = load_json_file(CONVERSATIONS_FILE, [])
        return jsonify({
            'success': True,
            'conversations': conversations
        })
        
    except Exception as e:
        logger.error(f"Error getting conversations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to load conversations'
        }), 500

if __name__ == '__main__':
    # Initialize RAG model on startup
    try:
        resume_data = load_json_file(RESUME_DATA_FILE)
        if resume_data:
            rag_model.initialize_embeddings(resume_data)
            logger.info("RAG model initialized successfully")
        else:
            logger.warning("No resume data found for RAG initialization")
    except Exception as e:
        logger.error(f"Failed to initialize RAG model: {str(e)}")
    
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')