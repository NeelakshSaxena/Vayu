from abc import ABC, abstractmethod
from typing import Dict, Any

class WorkingMemory(ABC):
    """
    Interface for working memory, storing short-term state and conversation history
    for active sessions.
    """
    
    @abstractmethod
    async def get(self, session_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def save(self, session_id: str, state: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    async def clear(self, session_id: str) -> None:
        pass

class InMemoryWorkingMemory(WorkingMemory):
    """
    In-memory Map implementation of WorkingMemory for Phase 2.
    Easily replaceable with Redis in the future.
    """
    
    def __init__(self):
        self._store: Dict[str, Dict[str, Any]] = {}
        
    async def get(self, session_id: str) -> Dict[str, Any]:
        return self._store.get(session_id, {})
        
    async def save(self, session_id: str, state: Dict[str, Any]) -> None:
        self._store[session_id] = state
        
    async def clear(self, session_id: str) -> None:
        if session_id in self._store:
            del self._store[session_id]
