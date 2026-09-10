import asyncio
from arq import create_pool
from arq.connections import RedisSettings
from app.core.config import settings
from app.core.pipeline import AIRuntimePipeline
import logging

logger = logging.getLogger(__name__)

async def run_agent_task(ctx, session_id: str, user_message: str):
    """
    Background task to run the agent pipeline.
    """
    logger.info(f"Starting background agent task for session {session_id}")
    pipeline = AIRuntimePipeline()
    try:
        # In a real system, you might not just 'process' and throw away the return value
        # if the user isn't connected. It might save to DB, push via WebSockets, etc.
        # But this fulfills the baseline "execute task asynchronously".
        response = await pipeline.process(session_id, user_message)
        logger.info(f"Task completed. Response: {response}")
        return response
    except Exception as e:
        logger.error(f"Error in background task for session {session_id}: {e}")
        raise

class WorkerSettings:
    """
    Settings for the ARQ worker.
    Run with `arq app.tasks.worker.WorkerSettings`
    """
    functions = [run_agent_task]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    
    # You can add on_startup and on_shutdown handlers here if needed
    
async def get_redis_pool():
    """Helper to get a Redis pool for enqueueing tasks."""
    return await create_pool(RedisSettings.from_dsn(settings.redis_url))
