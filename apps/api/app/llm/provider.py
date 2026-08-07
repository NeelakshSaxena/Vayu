from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List

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
