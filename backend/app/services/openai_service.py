import openai
from typing import List, Dict, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            logger.warning("OpenAI API key not configured. AI features will be disabled.")
            self.client = None
        else:
            openai.api_key = settings.OPENAI_API_KEY
            self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def is_available(self) -> bool:
        """Check if OpenAI service is available"""
        return self.client is not None
    
    async def generate_response(
        self, 
        user_message: str, 
        conversation_history: List[Dict[str, str]] = None,
        context: str = "rideshare"
    ) -> str:
        """
        Generate AI response using OpenAI GPT
        
        Args:
            user_message: The user's input message
            conversation_history: Previous messages in the conversation
            context: Context for the AI (rideshare, general, etc.)
        
        Returns:
            AI generated response
        """
        if not self.is_available():
            return "I'm sorry, but the AI assistant is currently unavailable. Please try again later."
        
        try:
            # Build system prompt based on context
            system_prompt = self._get_system_prompt(context)
            
            # Build messages for the API
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                    messages.append({
                        "role": "user" if msg.get("sender") == "user" else "assistant",
                        "content": msg.get("text", "")
                    })
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Make API call
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return "I'm experiencing some technical difficulties. Please try again in a moment."
    
    def _get_system_prompt(self, context: str) -> str:
        """Get system prompt based on context"""
        
        rideshare_prompt = """
        You are a helpful AI assistant for Commute.io, a rideshare application. Your role is to:
        
        1. Help users with rideshare-related questions and concerns
        2. Provide information about ride booking, safety, and app features
        3. Assist with troubleshooting common issues
        4. Offer friendly and professional support
        
        Key guidelines:
        - Be concise and helpful
        - Focus on rideshare and transportation topics
        - Maintain a friendly, professional tone
        - If asked about topics outside rideshare, politely redirect to rideshare-related help
        - Never provide personal information or make commitments on behalf of the company
        - For serious safety concerns, advise users to contact emergency services or customer support
        
        Remember: You're here to make the rideshare experience better and safer for everyone.
        """
        
        general_prompt = """
        You are a helpful AI assistant. Provide clear, concise, and helpful responses to user questions.
        Be friendly and professional in your interactions.
        """
        
        return rideshare_prompt if context == "rideshare" else general_prompt

# Create a singleton instance
openai_service = OpenAIService()