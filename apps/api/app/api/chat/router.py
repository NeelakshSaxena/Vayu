from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
import json

from app.core.security import get_current_user
from app.core.pipeline import AIRuntimePipeline

router = APIRouter()
pipeline = AIRuntimePipeline()

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default_session"
    metadata: Dict[str, Any] = {}

@router.post("/")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    REST endpoint for chat completion.
    """
    # Just a simple non-streaming implementation for fallback
    chunks = []
    async for chunk in pipeline.run_stream(request.session_id, request.message):
        chunks.append(chunk)
    
    return {"reply": "".join(chunks)}

@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint for streaming chat completion using structured protocol.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "chat":
                message = data.get("message", "")
                # TODO: replace with authenticated user/session
                session_id = data.get("session_id", "default_session")
                
                # Send start event
                await websocket.send_json({"type": "start"})
                
                # Stream tokens
                async for chunk in pipeline.run_stream(session_id, message):
                    await websocket.send_json({
                        "type": "token",
                        "content": chunk
                    })
                    
                # Send end event
                await websocket.send_json({"type": "end"})
                
    except WebSocketDisconnect:
        # Client disconnected
        pass

