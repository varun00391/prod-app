from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class MessageContent(BaseModel):
    type: str  # "text" | "image_url" | "file"
    text: Optional[str] = None
    image_url: Optional[dict] = None
    file_id: Optional[str] = None
    file_name: Optional[str] = None
    file_data_base64: Optional[str] = None
    mime_type: Optional[str] = None


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: Any  # str or list of content parts
    attachments: Optional[list[dict]] = None  # [{name, url or base64, type}]


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    messages: list[ChatMessage]
    api_key: Optional[str] = None


class ConversationCreate(BaseModel):
    title: Optional[str] = None


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
