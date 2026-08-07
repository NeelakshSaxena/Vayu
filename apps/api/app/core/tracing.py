import time
import functools
import asyncio
from app.core.logging import logger

def trace_stage(stage_name: str):
    """
    A decorator that emits observability spans for pipeline stages.
    It logs the start, end, duration, and status of the stage.
    """
    def decorator(func):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration_ms = int((time.time() - start_time) * 1000)
                # Ensure we format it nicely for simple structlog-like standard logging
                logger.info(f"[SPAN] {stage_name} | duration_ms={duration_ms} | status=ok")
                return result
            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)
                logger.error(f"[SPAN] {stage_name} | duration_ms={duration_ms} | status=error | error={str(e)}")
                raise e

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration_ms = int((time.time() - start_time) * 1000)
                logger.info(f"[SPAN] {stage_name} | duration_ms={duration_ms} | status=ok")
                return result
            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)
                logger.error(f"[SPAN] {stage_name} | duration_ms={duration_ms} | status=error | error={str(e)}")
                raise e

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator
