from typing import List, Dict, Any, AsyncGenerator
from app.llm.provider import LLMProvider, MockLLMProvider
from app.llm.providers.openrouter import OpenRouterProvider
from app.llm.providers.runpod import RunpodProvider
from app.core.config import settings
from app.core.tracing import trace_stage

class LLMRouter:
    """
    Routes prompt to the designated LLM provider (OpenRouter, RunPod, Mock) and handles streaming.
    """
    
    def __init__(self):
        self.providers: Dict[str, LLMProvider] = {
            "openrouter": OpenRouterProvider(),
            "runpod": RunpodProvider(),
            "mock": MockLLMProvider()
        }
        
    @trace_stage("llm.route_stream")
    async def route_stream(self, messages: List[Dict[str, Any]], provider: str = None, **kwargs) -> AsyncGenerator[str, None]:
        """
        Streams the response from the designated LLM provider.
        """
        target_name = (provider or kwargs.get("provider") or settings.default_provider).lower()
        provider_impl = self.providers.get(target_name, self.providers["openrouter"])
        
        async for chunk in provider_impl.generate_stream(messages, **kwargs):
            yield chunk

    @trace_stage("llm.route")
    async def route(self, messages: List[Dict[str, Any]], provider: str = None, **kwargs) -> str:
        """
        Generates the full response from the designated LLM provider.
        """
        target_name = (provider or kwargs.get("provider") or settings.default_provider).lower()
        provider_impl = self.providers.get(target_name, self.providers["openrouter"])
        return await provider_impl.generate(messages, **kwargs)

