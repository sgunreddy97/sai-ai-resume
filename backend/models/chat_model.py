# backend/models/chat_model.py
import os
import requests
import json
import logging
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class ChatModel:
    def __init__(self):
        """Initialize chat model with Together API"""
        self.api_key = os.getenv('TOGETHER_API_KEY')
        self.api_url = "https://api.together.xyz/v1/chat/completions"
        self.model_name = "meta-llama/Llama-2-7b-chat-hf"  # Free tier model
        self.ready = bool(self.api_key)
        
        if not self.ready:
            logger.error("Together API key not found!")
        else:
            logger.info("Chat model initialized successfully")
    
    def is_ready(self) -> bool:
        """Check if chat model is ready"""
        return self.ready
    
    def generate_response(self, message: str, mode: str = "strict", 
                         context: str = "", selected_text: str = "") -> str:
        """Generate AI response based on mode and context"""
        try:
            if not self.is_ready():
                return "Sorry, the AI chat system is currently unavailable. Please try again later."
            
            # Build system prompt based on mode
            system_prompt = self._get_system_prompt(mode)
            
            # Build user message with context
            user_message = self._build_user_message(message, context, selected_text)
            
            # Prepare API request
            payload = {
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.7,
                "max_tokens": 512,
                "top_p": 0.9
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Make API request
            response = requests.post(self.api_url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result['choices'][0]['message']['content'].strip()
                
                # Post-process response to ensure it's positive and relevant
                processed_response = self._process_response(ai_response, mode, message)
                return processed_response
            else:
                logger.error(f"API request failed: {response.status_code} - {response.text}")
                return self._get_fallback_response(message, mode)
                
        except requests.exceptions.Timeout:
            logger.error("API request timed out")
            return "I'm experiencing some delays. Let me give you a quick answer: " + self._get_fallback_response(message, mode)
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return self._get_fallback_response(message, mode)
    
    def _get_system_prompt(self, mode: str) -> str:
        """Get system prompt based on chat mode"""
        base_context = """
        You are Sai Teja Reddy's AI assistant, representing him on his interactive resume website. 
        You have access to his complete professional background and personal information.
        
        Key facts about Sai:
        - AI/ML Engineer with 5 years of production experience
        - Currently pursuing Master's in AI at Oklahoma Christian University
        - Worked at Ericsson Canada as ML Engineer (2022-2024)
        - Previously at Cash4You Inc. as Data Scientist (2021-2022)
        - Passionate about technology, space, mathematics, and helping others
        - Loves teaching, mentoring, and using technology to better society
        - Wants to adopt and educate 10 underprivileged children
        - Enjoys movies, camping, fishing, adventure activities
        - Expert in Python, TensorFlow, PyTorch, AWS, MLOps, and LLM fine-tuning
        """
        
        if mode == "strict":
            return base_context + """
            
            STRICT MODE RULES:
            1. ONLY answer questions related to Sai's resume, career, skills, and professional background
            2. ALWAYS highlight Sai's strengths and positive aspects
            3. If asked about weaknesses or negative topics, redirect to related strengths
            4. Keep responses professional and focused on his qualifications
            5. If asked about non-resume topics, politely redirect back to his professional profile
            6. NEVER mention any negative information or limitations
            7. Always connect answers back to why Sai would be a great hire
            8. Be enthusiastic and confident about his abilities
            """
        else:  # open mode
            return base_context + """
            
            OPEN MODE RULES:
            1. You can discuss any topic, but always try to relate it back to Sai's interests and skills
            2. Maintain a positive, helpful tone
            3. Share Sai's perspectives on technology, AI ethics, education, and social impact
            4. If discussing non-professional topics, connect them to his personality and values
            5. Show his curiosity about space, technology, and life's big questions
            6. Demonstrate his passion for helping others and making a positive impact
            7. Keep conversations engaging while subtly showcasing his expertise
            8. Always be authentic to his personality - jovial, helpful, and knowledgeable
            """
    
    def _build_user_message(self, message: str, context: str, selected_text: str) -> str:
        """Build user message with context"""
        user_msg = f"User question: {message}\n"
        
        if selected_text:
            user_msg += f"User selected this text: '{selected_text}'\n"
        
        if context:
            user_msg += f"Relevant context from Sai's resume: {context}\n"
        
        user_msg += "\nProvide a helpful, positive response that showcases Sai's qualifications and personality."
        return user_msg
    
    def _process_response(self, response: str, mode: str, original_question: str) -> str:
        """Post-process AI response to ensure quality"""
        try:
            # Remove any negative language
            negative_phrases = ["can't", "cannot", "don't know", "not sure", "weakness", "limitation"]
            
            for phrase in negative_phrases:
                if phrase in response.lower():
                    # Convert negative to positive
                    if "weakness" in response.lower():
                        response = response.replace("weakness", "area for growth that shows my commitment to improvement")
                    elif "can't" in response.lower() or "cannot" in response.lower():
                        response = response.replace("can't", "am always learning about")
                        response = response.replace("cannot", "am continuously developing skills in")
            
            # Ensure response ends positively
            positive_endings = [
                "I'd be happy to tell you more about this!",
                "This is one of the areas where I really excel.",
                "I'm always excited to discuss this topic further!",
                "Feel free to ask me anything else about my experience.",
                "This showcases exactly the kind of impact I love to make."
            ]
            
            if not any(ending.lower() in response.lower() for ending in positive_endings):
                response += f" {positive_endings[0]}"
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing response: {str(e)}")
            return response
    
    def _get_fallback_response(self, message: str, mode: str) -> str:
        """Get fallback response when API fails"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["experience", "work", "job", "career"]):
            return """I have 5+ years of hands-on AI/ML engineering experience, including 2.5 years at Ericsson Canada 
            where I built production-scale AI systems supporting 100M+ daily events. I specialize in LLM fine-tuning, 
            RAG systems, and deploying ML models in cloud environments. Would you like to know more about any specific project?"""
        
        elif any(word in message_lower for word in ["skills", "technologies", "tools"]):
            return """I'm proficient in Python, TensorFlow, PyTorch, Hugging Face, AWS, and MLOps tools. I've deployed 
            models using SageMaker, built CI/CD pipelines, and worked extensively with big data tools like Spark and Kafka. 
            My recent projects include LLM classification fine-tuning and multilingual speech recognition systems."""
        
        elif any(word in message_lower for word in ["education", "degree", "university"]):
            return """I'm currently pursuing a Master's in Computer Science with AI focus at Oklahoma Christian University. 
            I also have a PG Diploma in IT Business Analysis from Conestoga College and a B.Tech in Electronics & Communication 
            from JNTU Hyderabad. I was always a top performer in mathematics and competitive exams."""
        
        elif any(word in message_lower for word in ["project", "projects"]):
            return """I've worked on fascinating projects including LLM fine-tuning for classification, Thai speech recognition 
            with translation, telecom network diagnostics using AI, and fraud detection systems. Each project demonstrates my 
            ability to solve real-world problems using cutting-edge AI techniques. Which project interests you most?"""
        
        else:
            return """I'm Sai Teja Reddy's AI assistant! I'm here to tell you about his impressive background as an AI/ML Engineer 
            with 5 years of production experience. He's passionate about using technology to solve real problems and help others. 
            What would you like to know about his experience, skills, or projects?"""
    
    def explain_text(self, selected_text: str, section: str) -> str:
        """Explain selected text from the resume"""
        try:
            explanation_prompt = f"""
            Explain this text from Sai Teja Reddy's resume in detail: "{selected_text}"
            Section context: {section}
            
            Provide a detailed explanation that:
            1. Breaks down technical terms for non-technical readers
            2. Explains the impact and significance
            3. Shows why this demonstrates Sai's expertise
            4. Connects to his overall value as a candidate
            """
            
            # Use the same API call structure
            payload = {
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": "You are explaining Sai Teja Reddy's resume content. Be detailed, positive, and show his expertise."},
                    {"role": "user", "content": explanation_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 400
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(self.api_url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
            else:
                return self._get_text_explanation_fallback(selected_text, section)
                
        except Exception as e:
            logger.error(f"Error explaining text: {str(e)}")
            return self._get_text_explanation_fallback(selected_text, section)
    
    def _get_text_explanation_fallback(self, text: str, section: str) -> str:
        """Fallback explanation for selected text"""
        return f"""This highlights Sai's expertise in {section}. The phrase "{text}" demonstrates his 
        hands-on experience and technical depth. This kind of experience shows he can deliver real results 
        and has the practical knowledge that employers value. Would you like me to elaborate on any specific 
        aspect of this achievement?"""
    
    def get_follow_up_suggestions(self, user_message: str, ai_response: str) -> List[str]:
        """Generate follow-up question suggestions"""
        message_lower = user_message.lower()
        
        if any(word in message_lower for word in ["experience", "work"]):
            return [
                "Tell me more about the Ericsson Canada role",
                "What was his biggest achievement at work?",
                "How did he improve system performance?"
            ]
        elif any(word in message_lower for word in ["skills", "technical"]):
            return [
                "What AI/ML frameworks does he use?",
                "Tell me about his cloud experience",
                "What's his experience with LLMs?"
            ]
        elif any(word in message_lower for word in ["education", "university"]):
            return [
                "What's his academic background?",
                "Tell me about his mathematics skills",
                "What certifications does he have?"
            ]
        elif any(word in message_lower for word in ["projects", "project"]):
            return [
                "Show me his recent projects",
                "What's his most impressive project?",
                "Tell me about his Kaggle work"
            ]
        else:
            return [
                "What makes him a great AI engineer?",
                "Tell me about his leadership experience",
                "What are his career goals?"
            ]