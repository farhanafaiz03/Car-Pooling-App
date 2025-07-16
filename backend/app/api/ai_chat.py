from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.api.auth import get_current_user
from app.services.openai_service import openai_service
from app.db.crud.messages import create_message, get_conversation
from app.schema.message import MessageCreate

router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = None
    context: Optional[str] = "rideshare"


class ChatResponse(BaseModel):
    response: str
    message_id: Optional[int] = None


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    chat_request: ChatMessage,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat with AI assistant
    
    This endpoint allows users to interact with the AI chatbot.
    The AI provides helpful responses related to rideshare and general queries.
    """
    try:
        # Check if OpenAI service is available
        if not openai_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="AI service is currently unavailable. Please check your OpenAI API configuration."
            )
        
        # Generate AI response
        ai_response = await openai_service.generate_response(
            user_message=chat_request.message,
            conversation_history=chat_request.conversation_history,
            context=chat_request.context
        )
        
        return ChatResponse(response=ai_response)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating AI response: {str(e)}"
        )


@router.get("/chat/status")
async def get_ai_status():
    """
    Get AI service status
    
    Returns whether the AI service is available and configured properly.
    """
    return {
        "available": openai_service.is_available(),
        "model": "gpt-3.5-turbo" if openai_service.is_available() else None,
        "status": "online" if openai_service.is_available() else "offline"
    }


@router.post("/chat/save-conversation")
async def save_ai_conversation(
    user_message: str,
    ai_response: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save AI conversation to database (optional feature)
    
    This can be used to persist AI conversations for user reference.
    """
    try:
        # Create a system user ID for AI messages (you might want to create a dedicated AI user)
        AI_USER_ID = 1  # This should be a dedicated AI user in your system
        
        # Save user message
        user_msg = create_message(
            db, 
            MessageCreate(receiver_id=AI_USER_ID, content=user_message), 
            current_user.id
        )
        
        # Save AI response
        ai_msg = create_message(
            db,
            MessageCreate(receiver_id=current_user.id, content=ai_response),
            AI_USER_ID
        )
        
        return {
            "message": "Conversation saved successfully",
            "user_message_id": user_msg.id,
            "ai_message_id": ai_msg.id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving conversation: {str(e)}"
        )