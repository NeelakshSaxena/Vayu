from typing import AsyncGenerator, List, Dict, Any
from app.context.builder import ContextBuilder
from app.context.injectors import HistoryInjector, RAGInjector
from app.memory.manager import MemoryManager
from app.prompts.assembler import PromptAssembler
from app.agent.adapter import AgentAdapter
from app.core.tracing import trace_stage
import asyncio

class AIRuntimePipeline:
    """
    Coordinates the entire AI runtime flow: 
    Memory Recall -> Context Building -> Prompt Assembly -> Agent Execution -> Memory Storage
    """
    def __init__(
        self,
        memory_manager: MemoryManager = None,
        context_builder: ContextBuilder = None,
        prompt_assembler: PromptAssembler = None,
        agent_adapter: AgentAdapter = None
    ):
        # Default initialization if dependencies aren't injected
        self.memory_manager = memory_manager or MemoryManager()
        
        # Setup context builder with injectors tied to this memory manager
        if not context_builder:
            self.context_builder = ContextBuilder(injectors=[
                HistoryInjector(working_memory=self.memory_manager.working),
                RAGInjector(vector_store=self.memory_manager.long_term)
            ])
        else:
            self.context_builder = context_builder
            
        self.prompt_assembler = prompt_assembler or PromptAssembler()
        self.agent_adapter = agent_adapter or AgentAdapter()

    @trace_stage("pipeline.run_stream")
    async def run_stream(self, session_id: str, user_message: str, provider: str = None, **kwargs) -> AsyncGenerator[str, None]:
        """
        Runs the full AI pipeline asynchronously and yields chunks of the LLM response.
        """
        # 1. Build context (includes memory recall via RAGInjector and HistoryInjector)
        context = await self.context_builder.build_context(session_id, user_message, **kwargs)
        
        # 2. Assemble prompt
        messages = self.prompt_assembler.assemble(user_message, context)
        
        # 3. Stream from Agent Adapter
        full_response_chunks = []
        async for chunk in self.agent_adapter.stream_agent_events(messages):
            full_response_chunks.append(chunk)
            yield chunk
            
        # 4. Save to Memory asynchronously
        full_response = "".join(full_response_chunks)
        
        # Create a fire-and-forget task to save to memory without blocking the return
        asyncio.create_task(
            self.memory_manager.save_interaction(session_id, user_message, full_response)
        )

    @trace_stage("pipeline.process")
    async def process(self, session_id: str, user_message: str, provider: str = None, **kwargs) -> str:
        """
        Runs the full AI pipeline asynchronously and returns the full response string.
        """
        chunks = []
        async for chunk in self.run_stream(session_id, user_message, provider=provider, **kwargs):
            chunks.append(chunk)
        return "".join(chunks)
