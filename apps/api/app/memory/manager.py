from app.memory.working import WorkingMemory, InMemoryWorkingMemory
from app.memory.long_term import VectorStore, MockVectorStore
from app.memory.chroma_store import ChromaVectorStore
from app.core.tracing import trace_stage
import logging

logger = logging.getLogger(__name__)

class MemoryManager:
    """
    Orchestrates memory operations across Working Memory and Long-Term Memory.
    """
    
    def __init__(self, working_memory: WorkingMemory = None, vector_store: VectorStore = None):
        self.working = working_memory or InMemoryWorkingMemory()
        self.long_term = vector_store or ChromaVectorStore()
        
    @trace_stage("memory.save_interaction")
    async def save_interaction(self, session_id: str, user_message: str, assistant_message: str):
        """
        Saves a single exchange to Working Memory.
        Triggers Long-Term Memory storage for key facts asynchronously via ARQ.
        """
        state = await self.working.get(session_id)
        if "history" not in state:
            state["history"] = []
            
        state["history"].append({"role": "user", "content": user_message})
        state["history"].append({"role": "assistant", "content": assistant_message})
        
        await self.working.save(session_id, state)
        
        # Enqueue background memory extraction
        try:
            from app.tasks.worker import get_redis_pool
            redis_pool = await get_redis_pool()
            await redis_pool.enqueue_job(
                "extract_episodic_memory", 
                session_id, 
                user_message, 
                assistant_message
            )
            logger.info(f"Enqueued episodic memory extraction for session {session_id}")
        except Exception as e:
            logger.error(f"Failed to enqueue memory extraction: {e}")
            
    @trace_stage("memory.recall")
    async def recall(self, query: str, k: int = 5):
        """
        Retrieves relevant memories from the VectorStore.
        """
        return await self.long_term.search(query, k=k)
