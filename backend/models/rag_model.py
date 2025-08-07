# backend/models/rag_model.py
import json
import os
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class RAGModel:
    def __init__(self):
        """Initialize RAG model with sentence transformer and FAISS"""
        self.embedding_model = None
        self.index = None
        self.documents = []
        self.embeddings = []
        self.ready = False
        
        try:
            # Load sentence transformer model
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Sentence transformer model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load sentence transformer: {str(e)}")
    
    def is_ready(self) -> bool:
        """Check if RAG model is ready for use"""
        return self.ready and self.embedding_model is not None and self.index is not None
    
    def process_resume_data(self, resume_data: Dict[str, Any]) -> List[str]:
        """Convert resume data into searchable text chunks"""
        documents = []
        
        try:
            # Personal information
            personal = resume_data.get('personal_info', {})
            if personal:
                doc = f"Personal Information: {personal.get('name', '')} is an {personal.get('title', '')} "
                doc += f"with {personal.get('summary', '')} "
                doc += f"Contact: {personal.get('email', '')} | {personal.get('phone', '')} | {personal.get('location', '')}"
                documents.append(doc)
            
            # Professional experience
            experiences = resume_data.get('experience', [])
            for exp in experiences:
                doc = f"Work Experience: {exp.get('title', '')} at {exp.get('company', '')} "
                doc += f"from {exp.get('start_date', '')} to {exp.get('end_date', '')}. "
                doc += f"Location: {exp.get('location', '')}. "
                
                responsibilities = exp.get('responsibilities', [])
                if responsibilities:
                    doc += "Key achievements and responsibilities: " + " ".join(responsibilities)
                
                documents.append(doc)
            
            # Education
            education = resume_data.get('education', [])
            for edu in education:
                doc = f"Education: {edu.get('degree', '')} in {edu.get('field', '')} "
                doc += f"from {edu.get('institution', '')} "
                doc += f"({edu.get('start_date', '')} - {edu.get('end_date', '')}). "
                doc += f"Location: {edu.get('location', '')}. "
                if edu.get('gpa'):
                    doc += f"GPA: {edu.get('gpa')}. "
                if edu.get('achievements'):
                    doc += f"Achievements: {' '.join(edu.get('achievements', []))}"
                documents.append(doc)
            
            # Skills
            skills = resume_data.get('skills', {})
            for category, skill_list in skills.items():
                if skill_list:
                    doc = f"Skills in {category}: {', '.join(skill_list)}"
                    documents.append(doc)
            
            # Projects
            projects = resume_data.get('projects', [])
            for project in projects:
                doc = f"Project: {project.get('title', '')}. "
                doc += f"Description: {project.get('description', '')} "
                technologies = project.get('technologies', [])
                if technologies:
                    doc += f"Technologies used: {', '.join(technologies)}. "
                if project.get('achievements'):
                    doc += f"Key achievements: {' '.join(project.get('achievements', []))}"
                documents.append(doc)
            
            # Certifications
            certifications = resume_data.get('certifications', [])
            for cert in certifications:
                doc = f"Certification: {cert.get('name', '')} "
                if cert.get('issuer'):
                    doc += f"issued by {cert.get('issuer')} "
                if cert.get('date'):
                    doc += f"on {cert.get('date')}"
                documents.append(doc)
            
            # Core competencies and achievements
            competencies = resume_data.get('core_competencies', [])
            if competencies:
                doc = f"Core Competencies: {' '.join(competencies)}"
                documents.append(doc)
            
            logger.info(f"Processed resume data into {len(documents)} text chunks")
            return documents
            
        except Exception as e:
            logger.error(f"Error processing resume data: {str(e)}")
            return []
    
    def initialize_embeddings(self, resume_data: Dict[str, Any]):
        """Initialize FAISS index with resume data embeddings"""
        try:
            if not self.embedding_model:
                raise Exception("Embedding model not initialized")
            
            # Process resume data into documents
            self.documents = self.process_resume_data(resume_data)
            
            if not self.documents:
                raise Exception("No documents generated from resume data")
            
            # Generate embeddings
            self.embeddings = self.embedding_model.encode(self.documents)
            
            # Create FAISS index
            dimension = self.embeddings.shape[1]
            self.index = faiss.IndexFlatIP(dimension)  # Inner product for similarity
            
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(self.embeddings)
            self.index.add(self.embeddings.astype('float32'))
            
            self.ready = True
            logger.info(f"FAISS index initialized with {len(self.documents)} documents")
            
        except Exception as e:
            logger.error(f"Failed to initialize embeddings: {str(e)}")
            self.ready = False
    
    def refresh_embeddings(self, resume_data: Dict[str, Any]):
        """Refresh embeddings with updated resume data"""
        try:
            self.ready = False
            self.initialize_embeddings(resume_data)
            logger.info("Embeddings refreshed successfully")
        except Exception as e:
            logger.error(f"Failed to refresh embeddings: {str(e)}")
    
    def get_relevant_context(self, query: str, additional_context: str = "") -> str:
        """Retrieve relevant context for a given query"""
        try:
            if not self.is_ready():
                return "RAG model not ready. Using basic context."
            
            # Combine query with additional context
            search_query = query
            if additional_context:
                search_query = f"{additional_context} {query}"
            
            # Generate query embedding
            query_embedding = self.embedding_model.encode([search_query])
            faiss.normalize_L2(query_embedding)
            
            # Search for similar documents
            k = min(3, len(self.documents))  # Get top 3 relevant documents
            scores, indices = self.index.search(query_embedding.astype('float32'), k)
            
            # Combine relevant documents
            relevant_docs = []
            for i, score in zip(indices[0], scores[0]):
                if score > 0.3:  # Only include documents with good similarity
                    relevant_docs.append(self.documents[i])
            
            context = " ".join(relevant_docs) if relevant_docs else ""
            
            # Add some personal context about Sai
            personal_context = """
            Sai Teja Reddy is a passionate AI/ML Engineer with 5 years of experience in machine learning, 
            data science, and artificial intelligence. He loves technology, space exploration, mathematics, 
            and helping others through education. He's currently pursuing a Master's in AI at Oklahoma Christian University.
            He has a strong track record of building production-grade ML systems, fine-tuning LLMs, and 
            developing AI solutions that solve real-world problems. He's known for his positive attitude, 
            communication skills, and ability to explain complex technical concepts to non-technical audiences.
            """
            
            full_context = personal_context + " " + context
            
            logger.info(f"Retrieved {len(relevant_docs)} relevant documents for query: {query[:50]}...")
            return full_context
            
        except Exception as e:
            logger.error(f"Error getting relevant context: {str(e)}")
            return "Error retrieving context. Please try again."
    
    def get_section_context(self, section: str) -> str:
        """Get specific context for a resume section"""
        try:
            section_keywords = {
                'experience': ['work', 'job', 'position', 'role', 'company', 'responsibilities'],
                'education': ['degree', 'university', 'college', 'school', 'academic', 'study'],
                'skills': ['skills', 'technologies', 'programming', 'tools', 'frameworks'],
                'projects': ['project', 'built', 'developed', 'created', 'implemented'],
                'certifications': ['certification', 'certified', 'credential', 'license'],
                'about': ['personal', 'summary', 'profile', 'background', 'interests']
            }
            
            if not self.is_ready():
                return f"Information about {section} section."
            
            keywords = section_keywords.get(section.lower(), [section])
            
            # Find documents related to the section
            relevant_docs = []
            for doc in self.documents:
                doc_lower = doc.lower()
                if any(keyword in doc_lower for keyword in keywords):
                    relevant_docs.append(doc)
            
            return " ".join(relevant_docs[:3]) if relevant_docs else f"No specific information found for {section}."
            
        except Exception as e:
            logger.error(f"Error getting section context: {str(e)}")
            return f"Error retrieving {section} information."
    
    def search_documents(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search documents and return results with scores"""
        try:
            if not self.is_ready():
                return []
            
            query_embedding = self.embedding_model.encode([query])
            faiss.normalize_L2(query_embedding)
            
            k = min(limit, len(self.documents))
            scores, indices = self.index.search(query_embedding.astype('float32'), k)
            
            results = []
            for i, score in zip(indices[0], scores[0]):
                results.append({
                    'document': self.documents[i],
                    'score': float(score),
                    'index': int(i)
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            return []