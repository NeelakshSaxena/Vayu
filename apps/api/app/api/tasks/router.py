from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Any
from app.tasks.worker import get_redis_pool

router = APIRouter(tags=["tasks"])

class TaskRequest(BaseModel):
    session_id: str
    user_message: str

@router.post("/")
async def enqueue_agent_task(request: TaskRequest):
    """
    Enqueues a background task to process a user message.
    Returns the job ID.
    """
    try:
        redis_pool = await get_redis_pool()
        job = await redis_pool.enqueue_job(
            "run_agent_task", 
            request.session_id, 
            request.user_message
        )
        if job is None:
            raise HTTPException(status_code=500, detail="Failed to enqueue job")
            
        return {"job_id": job.job_id, "status": "enqueued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}")
async def get_task_status(job_id: str):
    """
    Gets the status of a background task.
    """
    try:
        redis_pool = await get_redis_pool()
        # To fetch job details in ARQ:
        # ARQ doesn't have a simple high-level API to get job by string ID directly from pool easily
        # without Job instance, but we can construct one.
        from arq.jobs import Job
        job = Job(job_id, redis_pool)
        
        status = await job.status()
        info = await job.info()
        
        return {
            "job_id": job_id,
            "status": status.name if status else "unknown",
            "info": info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
