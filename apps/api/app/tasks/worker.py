import asyncio
import json
import uuid
from arq import create_pool
from arq.connections import RedisSettings
from app.core.config import settings
from app.core.pipeline import AIRuntimePipeline
from app.memory.chroma_store import ChromaVectorStore
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import logging

logger = logging.getLogger(__name__)

async def extract_episodic_memory(ctx, session_id: str, user_message: str, assistant_message: str):
    """
    Background task to extract episodic memory.
    Stores both the raw Q&A and a lightweight LLM summary.
    """
    logger.info(f"Extracting episodic memory for session {session_id}")
    store = ChromaVectorStore()
    
    # 1. Store Raw Q&A
    raw_memory = {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "type": "raw_exchange",
        "content": f"User: {user_message}\nAssistant: {assistant_message}"
    }
    
    # 2. Generate LLM Summary
    try:
        # We use a lightweight call to summarize
        llm = ChatOpenAI(
            model=settings.model_name,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url
        )
        sys_msg = SystemMessage(content="You are a memory extraction assistant. Extract the core facts or intent from this exchange in one concise sentence.")
        hum_msg = HumanMessage(content=f"User: {user_message}\nAssistant: {assistant_message}")
        
        # We don't want to crash the worker if the LLM fails, so we wrap it
        summary_response = await llm.ainvoke([sys_msg, hum_msg])
        summary = summary_response.content
        
        summary_memory = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "type": "summary",
            "content": summary
        }
        
        await store.upsert([raw_memory, summary_memory])
        logger.info(f"Successfully extracted and stored memories for session {session_id}")
        
    except Exception as e:
        logger.warning(f"Failed to generate LLM summary for memory (saving raw only). Error: {e}")
        await store.upsert([raw_memory])


async def publish_event(redis_pool, session_id: str, event_type: str, payload: dict):
    """Helper to publish events to Redis Pub/Sub."""
    message = json.dumps({"session_id": session_id, "type": event_type, "payload": payload})
    await redis_pool.publish("vayu_events", message)

async def run_agent_task(ctx, session_id: str, user_message: str):
    """
    Background task to run the agent pipeline.
    """
    logger.info(f"Starting background agent task for session {session_id}")
    pipeline = AIRuntimePipeline()
    redis = ctx.get('redis')
    
    try:
        response = await pipeline.process(session_id, user_message)
        logger.info(f"Task completed. Response: {response}")
        
        # Publish success event
        if redis:
            await publish_event(redis, session_id, "task_completed", {"response": response, "status": "success"})
            
        return response
    except Exception as e:
        logger.error(f"Error in background task for session {session_id}: {e}")
        
        # Publish failure event
        if redis:
            await publish_event(redis, session_id, "task_failed", {"error": str(e), "status": "failed"})
            
        raise

class WorkerSettings:
    """
    Settings for the ARQ worker.
    Run with `arq app.tasks.worker.WorkerSettings`
    """
    functions = [run_agent_task, extract_episodic_memory]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    
async def get_redis_pool():
    """Helper to get a Redis pool for enqueueing tasks."""
    return await create_pool(RedisSettings.from_dsn(settings.redis_url))
