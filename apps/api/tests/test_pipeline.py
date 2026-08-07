import pytest
import asyncio
from app.core.pipeline import AIRuntimePipeline
from app.memory.manager import MemoryManager
from app.memory.working import InMemoryWorkingMemory
from app.memory.long_term import MockVectorStore

@pytest.mark.asyncio
async def test_ai_runtime_pipeline_e2e():
    # Setup replaceable memory layers
    working_memory = InMemoryWorkingMemory()
    vector_store = MockVectorStore()
    
    # Pre-populate long term memory for recall
    await vector_store.upsert([
        {"id": "1", "content": "The user's favorite color is blue."}
    ])
    
    memory_manager = MemoryManager(working_memory, vector_store)
    
    # Initialize Pipeline
    pipeline = AIRuntimePipeline(memory_manager=memory_manager)
    
    session_id = "test_session_1"
    user_message = "Remember my favorite color?"
    
    # Run the stream
    chunks = []
    async for chunk in pipeline.run_stream(session_id, user_message):
        chunks.append(chunk)
        
    response = "".join(chunks)
    assert response == "This is a mock response from the AI runtime pipeline."
    
    # Yield to event loop to allow the async fire-and-forget save_interaction to complete
    await asyncio.sleep(0.1)
    
    # Verify memory was updated
    state = await working_memory.get(session_id)
    assert "history" in state
    assert len(state["history"]) == 2
    assert state["history"][0]["role"] == "user"
    assert state["history"][0]["content"] == user_message
    assert state["history"][1]["role"] == "assistant"
    assert state["history"][1]["content"] == response

@pytest.mark.asyncio
async def test_context_builder_recall():
    vector_store = MockVectorStore()
    await vector_store.upsert([
        {"id": "1", "content": "I like cats."}
    ])
    
    pipeline = AIRuntimePipeline(memory_manager=MemoryManager(vector_store=vector_store))
    
    # Directly build context to inspect it
    context = await pipeline.context_builder.build_context("session_2", "Do I like cats?")
    
    # The RAGInjector should have added a system message about cats
    system_messages = [msg for msg in context if msg["role"] == "system"]
    assert len(system_messages) > 0
    assert "I like cats." in system_messages[0]["content"]
