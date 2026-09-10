from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import asyncio

from app.core.security import get_current_user
from app.core.pipeline import AIRuntimePipeline
from app.core.notifications import notification_manager

router = APIRouter()
pipeline = AIRuntimePipeline()

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default_session"
    provider: str = None
    metadata: Dict[str, Any] = {}

@router.post("/")
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    REST endpoint for chat completion.
    """
    # Just a simple non-streaming implementation for fallback
    chunks = []
    async for chunk in pipeline.run_stream(request.session_id, request.message, provider=request.provider):
        chunks.append(chunk)
    
    return {"reply": "".join(chunks)}

@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket, session_id: str = "default_session"):
    """
    WebSocket endpoint for streaming chat completion using structured protocol.
    Optionally accepts session_id in query string for immediate registration to notifications.
    """
    await websocket.accept()
    
    # Register to receive background notifications for this session right away
    await notification_manager.connect(session_id, websocket)
    
    cancel_event = None
    stream_task = None
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "chat":
                if stream_task and not stream_task.done():
                    cancel_event.set()
                    # wait for it to finish canceling
                    try:
                        await stream_task
                    except Exception:
                        pass
                
                message = data.get("message", "")
                
                # Update registration if session_id changes in the message
                msg_session_id = data.get("session_id", session_id)
                if msg_session_id != session_id:
                    notification_manager.disconnect(session_id, websocket)
                    session_id = msg_session_id
                    await notification_manager.connect(session_id, websocket)
                    
                provider = data.get("provider", None)
                cancel_event = asyncio.Event()
                
                async def stream_response(sess_id, msg, prov, ev):
                    try:
                        await websocket.send_json({"type": "start"})
                        async for chunk in pipeline.run_stream(sess_id, msg, provider=prov):
                            if ev.is_set():
                                break
                            await websocket.send_json({
                                "type": "token",
                                "content": chunk
                            })
                        if not ev.is_set():
                            await websocket.send_json({"type": "end"})
                    except Exception as e:
                        print(f"Stream error: {e}")
                        try:
                            await websocket.send_json({"type": "error", "error": str(e)})
                        except Exception:
                            pass
                        
                stream_task = asyncio.create_task(stream_response(session_id, message, provider, cancel_event))
                
            elif msg_type == "cancel":
                if cancel_event:
                    cancel_event.set()
                
    except WebSocketDisconnect:
        if cancel_event:
            cancel_event.set()
    finally:
        # Always clean up connection on disconnect
        notification_manager.disconnect(session_id, websocket)

