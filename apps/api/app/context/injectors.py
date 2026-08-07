from abc import ABC, abstractmethod
from typing import List, Dict, Any

class ContextInjector(ABC):
    """
    Abstract base class for all context injectors.
    Injectors retrieve specific types of context (history, RAG, etc.)
    and format them for the LLM.
    """
    
    @abstractmethod
    async def inject(self, session_id: str, user_message: str, **kwargs) -> List[Dict[str, Any]]:
        """
        Retrieve and format context as a list of LLM messages.
        """
        pass

class HistoryInjector(ContextInjector):
    """
    Injects the recent conversation history from Working Memory.
    """
    def __init__(self, working_memory):
        self.working_memory = working_memory
        
    async def inject(self, session_id: str, user_message: str, **kwargs) -> List[Dict[str, Any]]:
        # In the future, limit the number of messages injected based on token count
        state = await self.working_memory.get(session_id)
        if state and "history" in state:
            return state["history"]
        return []

class RAGInjector(ContextInjector):
    """
    Injects relevant facts or semantic search results from Long-Term Memory.
    """
    def __init__(self, vector_store):
        self.vector_store = vector_store
        
    async def inject(self, session_id: str, user_message: str, **kwargs) -> List[Dict[str, Any]]:
        # A simple semantic search mock for now
        # We search based on the user's current message
        results = await self.vector_store.search(user_message, k=3)
        if not results:
            return []
            
        # Format the RAG results into a system message
        facts_text = "\n".join([f"- {res['content']}" for res in results])
        return [
            {
                "role": "system",
                "content": f"Relevant context from memory:\n{facts_text}"
            }
        ]
