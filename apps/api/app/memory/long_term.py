from abc import ABC, abstractmethod
from typing import List, Dict, Any

class VectorStore(ABC):
    """
    Abstract interface for a Vector Database to support Long-Term / Recall Memory.
    """
    
    @abstractmethod
    async def upsert(self, memories: List[Dict[str, Any]]) -> None:
        pass
        
    @abstractmethod
    async def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        pass
        
    @abstractmethod
    async def delete(self, id: str) -> None:
        pass

class MockVectorStore(VectorStore):
    """
    In-memory mock VectorStore for Phase 2.
    Does simple string matching instead of actual embeddings.
    """
    
    def __init__(self):
        self._memories: List[Dict[str, Any]] = []
        
    async def upsert(self, memories: List[Dict[str, Any]]) -> None:
        for memory in memories:
            # Simple overwrite if ID exists
            existing_idx = next((i for i, m in enumerate(self._memories) if m.get("id") == memory.get("id")), None)
            if existing_idx is not None:
                self._memories[existing_idx] = memory
            else:
                self._memories.append(memory)
                
    async def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        # Mock semantic search: just return everything that shares words
        query_words = set(query.lower().split())
        
        def score(memory):
            content_words = set(memory.get("content", "").lower().split())
            return len(query_words.intersection(content_words))
            
        scored_memories = [(m, score(m)) for m in self._memories]
        # Sort by score descending
        scored_memories.sort(key=lambda x: x[1], reverse=True)
        
        # Return top k that have score > 0
        results = [m for m, s in scored_memories if s > 0][:k]
        return results
        
    async def delete(self, id: str) -> None:
        self._memories = [m for m in self._memories if m.get("id") != id]
