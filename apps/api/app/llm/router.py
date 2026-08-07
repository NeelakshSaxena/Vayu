from typing import List, Dict, Any, AsyncGenerator
from app.llm.provider import LLMProvider, MockLLMProvider
from app.llm.providers.openrouter import OpenRouterProvider
from app.core.tracing import trace_stage

class LLMRouter:
    """
    Routes prompt to the appropriate LLM provider and handles streaming.
    """
    
    def __init__(self, default_provider: LLMProvider = None):
        # Now using OpenRouter as the real backend
        self.provider = default_provider or OpenRouterProvider()
        
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
