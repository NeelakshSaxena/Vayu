from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List
import asyncio

class LLMProvider(ABC):
    """
    Abstract base class for all LLM providers.
    """
    
    @abstractmethod
    async def generate_stream(self, messages: List[Dict[str, Any]], **kwargs) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response from the LLM.
        Yields text chunks.
        """
        pass
        
    @abstractmethod
    async def generate(self, messages: List[Dict[str, Any]], **kwargs) -> str:
        """
        Generate a complete response from the LLM.
        """
        pass

class MockLLMProvider(LLMProvider):
    """
    A mock provider for testing the streaming engine.
    """
    async def generate_stream(self, messages: List[Dict[str, Any]], **kwargs) -> AsyncGenerator[str, None]:
        words = ["This", " is", " a", " mock", " response", " from", " the", " AI", " runtime", " pipeline."]
        for word in words:
            await asyncio.sleep(0.01) # Simulate network delay
            yield word

    async def generate(self, messages: List[Dict[str, Any]], **kwargs) -> str:
        return "This is a mock response from the AI runtime pipeline."
