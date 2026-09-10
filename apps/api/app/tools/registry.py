from langchain_core.tools import tool
from datetime import datetime

@tool
def get_current_time() -> str:
    """Returns the current date and time in ISO format."""
    return datetime.now().isoformat()

@tool
def get_weather(location: str) -> str:
    """Returns the mock weather for a given location."""
    return f"The weather in {location} is currently 72°F and sunny."

from langchain_core.runnables import RunnableConfig

@tool
async def search_memory(query: str, config: RunnableConfig) -> str:
    """
    Searches the user's long-term memory for relevant past interactions or facts.
    Use this when the user refers to past context that is not immediately in the conversation history.
    """
    # Extract session ID out-of-band so the LLM doesn't need to know it
    session_id = config.get("configurable", {}).get("session_id")
    
    # Lazy import to avoid circular dependencies if registry is loaded early
    from app.memory.chroma_store import ChromaVectorStore
    store = ChromaVectorStore()
    
    # Use session_id to restrict the search context automatically
    filter_dict = {"session_id": session_id} if session_id else None
    results = await store.search(query, k=3, filter=filter_dict)
    
    if not results:
        return "No relevant memories found."
        
    formatted = []
    for idx, res in enumerate(results):
        formatted.append(f"Memory {idx+1}: {res.get('content')}")
        
    return "\n".join(formatted)

@tool
async def retrieve_document(query: str, config: RunnableConfig) -> str:
    """
    Searches uploaded documents or knowledge base for information matching the query.
    Use this when the user asks questions about their files, docs, or specific knowledge domains.
    """
    # Currently a mock implementation for Phase 3/6 tools setup
    # In a real implementation, this would connect to a vector store with document embeddings
    session_id = config.get("configurable", {}).get("session_id")
    
    return f"Retrieved documents matching '{query}' for session {session_id}.\n[Document 1: Placeholder document content regarding {query}]"

def get_available_tools():
    """Returns the list of tools to bind to the LLM."""
    return [get_current_time, get_weather, search_memory, retrieve_document]
