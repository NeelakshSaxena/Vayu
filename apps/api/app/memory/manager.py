from app.memory.working import WorkingMemory, InMemoryWorkingMemory
from app.memory.long_term import VectorStore, MockVectorStore
from app.core.tracing import trace_stage

class MemoryManager:
    """
    Orchestrates memory operations across Working Memory and Long-Term Memory.
    """
    
    def __init__(self, working_memory: WorkingMemory = None, vector_store: VectorStore = None):
        self.working = working_memory or InMemoryWorkingMemory()
        self.long_term = vector_store or MockVectorStore()
        
    @trace_stage("memory.save_interaction")
    async def save_interaction(self, session_id: str, user_message: str, assistant_message: str):
        """
        Saves a single exchange to Working Memory.
        In the future, triggers Long-Term Memory storage for key facts asynchronously.
        """
        state = await self.working.get(session_id)
        if "history" not in state:
            state["history"] = []
            
        state["history"].append({"role": "user", "content": user_message})
        state["history"].append({"role": "assistant", "content": assistant_message})
        
        await self.working.save(session_id, state)
        
    @trace_stage("memory.recall")
    async def recall(self, query: str, k: int = 5):
        """
        Retrieves relevant memories from the VectorStore.
        """
        return await self.long_term.search(query, k=k)
