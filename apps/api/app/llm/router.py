from typing import List, Dict, Any, AsyncGenerator
from app.llm.provider import LLMProvider, MockLLMProvider
from app.core.tracing import trace_stage

class LLMRouter:
    """
    Routes prompt to the appropriate LLM provider and handles streaming.
    """
    
    def __init__(self, default_provider: LLMProvider = None):
        # Default to the mock provider for Phase 2
        self.provider = default_provider or MockLLMProvider()
        
    @trace_stage("llm.route_stream")
    async def route_stream(self, messages: List[Dict[str, Any]], **kwargs) -> AsyncGenerator[str, None]:
        """
        Streams the response from the designated LLM provider.
        """
        async for chunk in self.provider.generate_stream(messages, **kwargs):
            yield chunk

    @trace_stage("llm.route")
    async def route(self, messages: List[Dict[str, Any]], **kwargs) -> str:
        """
        Generates the full response from the designated LLM provider.
        """
        return await self.provider.generate(messages, **kwargs)
