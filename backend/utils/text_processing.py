# backend/utils/text_processing.py
import re
import string
import nltk
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class TextProcessor:
    def __init__(self):
        """Initialize text processing utilities"""
        self.setup_nltk()
    
    def setup_nltk(self):
        """Download required NLTK data"""
        try:
            import ssl
            try:
                _create_unverified_https_context = ssl._create_unverified_context
            except AttributeError:
                pass
            else:
                ssl._create_default_https_context = _create_unverified_https_context
            
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('wordnet', quiet=True)
            logger.info("NLTK data downloaded successfully")
        except Exception as e:
            logger.warning(f"Failed to download NLTK data: {str(e)}")
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text or not isinstance(text, str):
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\-\(\)\/]', '', text)
        
        # Remove multiple consecutive punctuation
        text = re.sub(r'([.!?]){2,}', r'\1', text)
        
        return text
    
    def extract_keywords(self, text: str, num_keywords: int = 10) -> List[str]:
        """Extract keywords from text"""
        try:
            from nltk.corpus import stopwords
            from nltk.tokenize import word_tokenize
            from collections import Counter
            
            # Clean and tokenize
            clean_text = self.clean_text(text.lower())
            tokens = word_tokenize(clean_text)
            
            # Remove stopwords and short words
            stop_words = set(stopwords.words('english'))
            keywords = [word for word in tokens 
                       if word not in stop_words 
                       and len(word) > 2 
                       and word not in string.punctuation]
            
            # Get most common keywords
            keyword_freq = Counter(keywords)
            return [word for word, count in keyword_freq.most_common(num_keywords)]
            
        except Exception as e:
            logger.error(f"Error extracting keywords: {str(e)}")
            return []
    
    def summarize_text(self, text: str, max_sentences: int = 3) -> str:
        """Create a simple extractive summary"""
        try:
            from nltk.tokenize import sent_tokenize
            
            sentences = sent_tokenize(text)
            
            if len(sentences) <= max_sentences:
                return text
            
            # Simple scoring based on sentence length and keyword presence
            keywords = self.extract_keywords(text, 20)
            keyword_set = set(keywords)
            
            sentence_scores = []
            for sentence in sentences:
                score = 0
                words = sentence.lower().split()
                
                # Score based on keyword presence
                for word in words:
                    if word in keyword_set:
                        score += 1
                
                # Normalize by sentence length
                if len(words) > 0:
                    score = score / len(words)
                
                sentence_scores.append((sentence, score))
            
            # Sort by score and take top sentences
            top_sentences = sorted(sentence_scores, key=lambda x: x[1], reverse=True)[:max_sentences]
            
            # Maintain original order
            result_sentences = []
            for sentence in sentences:
                if any(sentence == s[0] for s in top_sentences):
                    result_sentences.append(sentence)
            
            return ' '.join(result_sentences)
            
        except Exception as e:
            logger.error(f"Error summarizing text: {str(e)}")
            return text[:500] + "..." if len(text) > 500 else text
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract named entities from text"""
        try:
            # Simple regex-based entity extraction
            entities = {
                'organizations': [],
                'technologies': [],
                'locations': [],
                'dates': []
            }
            
            # Technology patterns
            tech_patterns = [
                r'\b(Python|JavaScript|Java|C\+\+|React|Angular|Vue|Node\.js|Django|Flask|Docker|Kubernetes|AWS|Azure|GCP|TensorFlow|PyTorch|scikit-learn|pandas|numpy)\b',
                r'\b(SQL|NoSQL|MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch)\b',
                r'\b(Git|GitHub|GitLab|Jenkins|CI/CD|DevOps|Agile|Scrum)\b'
            ]
            
            for pattern in tech_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                entities['technologies'].extend(matches)
            
            # Organization patterns (common company suffixes)
            org_pattern = r'\b([A-Z][a-zA-Z\s]+(?:Inc|Corp|LLC|Ltd|Company|Technologies|Systems|Solutions))\b'
            entities['organizations'] = re.findall(org_pattern, text)
            
            # Date patterns
            date_patterns = [
                r'\b\d{4}\b',  # Years
                r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b',  # Month Year
                r'\b\d{1,2}/\d{4}\b'  # MM/YYYY
            ]
            
            for pattern in date_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                entities['dates'].extend(matches)
            
            # Remove duplicates
            for key in entities:
                entities[key] = list(set(entities[key]))
            
            return entities
            
        except Exception as e:
            logger.error(f"Error extracting entities: {str(e)}")
            return {'organizations': [], 'technologies': [], 'locations': [], 'dates': []}
    
    def format_for_ai(self, text: str, context_type: str = "general") -> str:
        """Format text for AI processing"""
        clean_text = self.clean_text(text)
        
        if context_type == "resume":
            # Add context markers for resume content
            return f"[RESUME_CONTENT] {clean_text} [/RESUME_CONTENT]"
        elif context_type == "experience":
            return f"[WORK_EXPERIENCE] {clean_text} [/WORK_EXPERIENCE]"
        elif context_type == "project":
            return f"[PROJECT_DETAILS] {clean_text} [/PROJECT_DETAILS]"
        elif context_type == "skill":
            return f"[SKILL_INFORMATION] {clean_text} [/SKILL_INFORMATION]"
        else:
            return clean_text
    
    def process_chat_input(self, user_input: str) -> Dict[str, Any]:
        """Process user chat input for better AI understanding"""
        clean_input = self.clean_text(user_input)
        keywords = self.extract_keywords(clean_input, 5)
        entities = self.extract_entities(clean_input)
        
        # Detect question type
        question_patterns = {
            'experience': r'\b(experience|work|job|role|position|career)\b',
            'skills': r'\b(skill|technology|tool|framework|language|tech)\b',
            'education': r'\b(education|degree|university|college|study|school)\b',
            'projects': r'\b(project|build|create|develop|portfolio)\b',
            'personal': r'\b(about|personality|hobby|interest|personal)\b',
            'achievement': r'\b(achievement|accomplish|award|recognition|success)\b'
        }
        
        question_type = "general"
        for q_type, pattern in question_patterns.items():
            if re.search(pattern, clean_input, re.IGNORECASE):
                question_type = q_type
                break
        
        return {
            'original_input': user_input,
            'cleaned_input': clean_input,
            'keywords': keywords,
            'entities': entities,
            'question_type': question_type,
            'word_count': len(clean_input.split()),
            'has_question_words': bool(re.search(r'\b(what|how|why|when|where|who|which)\b', clean_input, re.IGNORECASE))
        }
    
    def generate_search_queries(self, user_input: str) -> List[str]:
        """Generate multiple search queries for RAG retrieval"""
        processed = self.process_chat_input(user_input)
        base_query = processed['cleaned_input']
        keywords = processed['keywords']
        question_type = processed['question_type']
        
        queries = [base_query]
        
        # Add keyword-based queries
        if keywords:
            queries.append(' '.join(keywords[:3]))
        
        # Add type-specific queries
        type_terms = {
            'experience': ['work experience', 'professional background', 'career history'],
            'skills': ['technical skills', 'programming languages', 'technologies'],
            'education': ['education background', 'academic qualifications', 'degrees'],
            'projects': ['projects portfolio', 'technical projects', 'development work'],
            'personal': ['personal information', 'background', 'about'],
            'achievement': ['achievements', 'accomplishments', 'awards']
        }
        
        if question_type in type_terms:
            for term in type_terms[question_type]:
                queries.append(term)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_queries = []
        for query in queries:
            if query.lower() not in seen:
                seen.add(query.lower())
                unique_queries.append(query)
        
        return unique_queries[:5]  # Limit to top 5 queries