import asyncio
import json
import logging
import redis.asyncio as redis
from fastapi import WebSocket
from app.core.config import settings

logger = logging.getLogger(__name__)

class NotificationManager:
    """
    Manages WebSocket connections and listens to Redis Pub/Sub for background task notifications.
    """
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.redis_client = redis.from_url(settings.redis_url)
        self.pubsub = self.redis_client.pubsub()
        self.task = None

    async def connect(self, session_id: str, websocket: WebSocket):
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
        
        # Start listening if not already started
        if self.task is None or self.task.done():
            self.task = asyncio.create_task(self.listen())

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def listen(self):
        await self.pubsub.subscribe("vayu_events")
        logger.info("Subscribed to vayu_events Redis channel")
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    session_id = data.get("session_id")
                    
                    if session_id and session_id in self.active_connections:
                        for ws in self.active_connections[session_id]:
                            try:
                                await ws.send_json({
                                    "type": "notification",
                                    "event": data.get("type"),
                                    "payload": data.get("payload")
                                })
                            except Exception as e:
                                logger.error(f"Error sending to websocket: {e}")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Redis pubsub error: {e}")
        finally:
            await self.pubsub.unsubscribe("vayu_events")

notification_manager = NotificationManager()
