from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from pydantic import BaseModel
from typing import List, Dict, Any

from app.core.security import get_current_user
from app.context.builder import context_builder
from app.llm.providers.openrouter import OpenRouterProvider

router = APIRouter()
llm_provider = OpenRouterProvider()

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []

@router.post("/")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    REST endpoint for chat completion.
    """
    context = await context_builder.build_context(request.message, request.history)
    response_text = await llm_provider.generate(context)
    
    return {"reply": response_text}

@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint for streaming chat completion.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            message = data.get("message", "")
            history = data.get("history", [])
            
            context = await context_builder.build_context(message, history)
            
            async for chunk in llm_provider.generate_stream(context):
                await websocket.send_text(chunk)
                
    except WebSocketDisconnect:
        # Client disconnected
        pass
