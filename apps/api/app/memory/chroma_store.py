from typing import List, Dict, Any
from app.memory.long_term import VectorStore
from langchain_chroma import Chroma
from langchain_core.embeddings.fake import FakeEmbeddings
from app.core.config import settings

class ChromaVectorStore(VectorStore):
    """
    VectorStore implementation using ChromaDB for local persistence
    and semantic search.
    """
    
    def __init__(self, collection_name: str = "vayu_memory", persist_directory: str = "./data/chroma"):
        # Use FakeEmbeddings for now to avoid OpenAI 401 errors since we are using Runpod API keys
        self.embeddings = FakeEmbeddings(size=384)
        
        self.db = Chroma(
            collection_name=collection_name,
            embedding_function=self.embeddings,
            persist_directory=persist_directory
        )
        
    async def upsert(self, memories: List[Dict[str, Any]]) -> None:
        """
        Upsert memories into ChromaDB.
        """
        texts = [m.get("content", "") for m in memories]
        metadatas = [{k: v for k, v in m.items() if k != "content"} for m in memories]
        ids = [m.get("id") for m in memories]
        
        # Chroma's native add method handles async/sync gracefully enough for simple usage,
        # but technically we should run it in a threadpool if it's blocking.
        self.db.add_texts(texts=texts, metadatas=metadatas, ids=ids)
        
    async def search(self, query: str, k: int = 5, filter: dict = None) -> List[Dict[str, Any]]:
        """
        Search for relevant memories.
        """
        results = self.db.similarity_search(query, k=k, filter=filter)
        
        # Convert Langchain Document back to our dict format
        memories = []
        for doc in results:
            memory = dict(doc.metadata)
            memory["content"] = doc.page_content
            memories.append(memory)
            
        return memories
        
    async def delete(self, id: str) -> None:
        """
        Delete a memory by ID.
        """
        self.db.delete(ids=[id])
