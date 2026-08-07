import json
import httpx
from typing import AsyncGenerator, Dict, Any, List
from app.llm.provider import LLMProvider
from app.core.config import settings

class OpenRouterProvider(LLMProvider):
    """
    Implementation of LLMProvider using OpenRouter.
    """
    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.base_url = "https://openrouter.ai/api/v1"
        self.default_model = "openai/gpt-4o-mini"
        
    async def generate_stream(self, messages: List[Dict[str, Any]], **kwargs) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "Error: OPENROUTER_API_KEY is not configured."
            return

        model = kwargs.get("model", self.default_model)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "http://localhost:8000", # Required by OpenRouter
            "X-Title": "Vayu",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            **{k:v for k,v in kwargs.items() if k not in ["model"]}
        }

        async with httpx.AsyncClient() as client:
            async with client.stream("POST", f"{self.base_url}/chat/completions", headers=headers, json=payload) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    yield f"Error from OpenRouter: {response.status_code} - {error_text.decode('utf-8')}"
                    return
                    
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta and delta["content"]:
                                    yield delta["content"]
                        except json.JSONDecodeError:
                            continue

    async def generate(self, messages: List[Dict[str, Any]], **kwargs) -> str:
        if not self.api_key:
            return "Error: OPENROUTER_API_KEY is not configured."

        model = kwargs.get("model", self.default_model)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Vayu",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            **{k:v for k,v in kwargs.items() if k not in ["model"]}
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
