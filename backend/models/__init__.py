# backend/models/__init__.py
"""
AI/ML Models package for the interactive resume website.
Contains RAG model and chat model implementations.
"""

from .rag_model import RAGModel
from .chat_model import ChatModel

__all__ = ['RAGModel', 'ChatModel']