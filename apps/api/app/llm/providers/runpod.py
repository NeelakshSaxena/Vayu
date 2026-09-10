import json
import httpx
from typing import AsyncGenerator, Dict, Any, List
from app.llm.provider import LLMProvider
from app.core.config import settings

class RunpodProvider(LLMProvider):
    """
    Implementation of LLMProvider for RunPod Serverless endpoints
    using the OpenAI API compatibility layer.
    """
    def __init__(self):
        self.api_key = settings.runpod_api_key
        self.endpoint_id = settings.runpod_serverless_endpoint
        self.base_url = "https://api.runpod.ai/v2"

    async def generate_stream(self, messages: List[Dict[str, Any]], **kwargs) -> AsyncGenerator[str, None]:
        api_key = kwargs.get("api_key") or self.api_key
        endpoint_id = kwargs.get("endpoint_id") or self.endpoint_id
        
        if not api_key or not endpoint_id:
            yield "Error: RUNPOD_API_KEY or RUNPOD_SERVERLESS_ENDPOINT is not configured."
            return

        url = f"{self.base_url}/{endpoint_id}/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Use whatever model is passed, or a fallback. 
        # vLLM expects this to match either the HF repo name or OPENAI_SERVED_MODEL_NAME_OVERRIDE
        model = kwargs.get("model", settings.model_name)
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "max_tokens": kwargs.get("max_tokens", 1024),
            "temperature": kwargs.get("temperature", 0.7)
        }

        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        yield f"\n[RunPod API Error {response.status_code}: {error_text.decode('utf-8')}]"
                        return
                        
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str.strip() == "[DONE]":
                                break
                            try:
                                data = json.loads(data_str)
                                if "choices" in data and len(data["choices"]) > 0:
                                    delta = data["choices"][0].get("delta", {})
                                    if "content" in delta and delta["content"]:
                                        yield delta["content"]
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                yield f"\n[RunPod Connection Error: {str(e)}]"

    async def generate(self, messages: List[Dict[str, Any]], **kwargs) -> str:
        api_key = kwargs.get("api_key") or self.api_key
        endpoint_id = kwargs.get("endpoint_id") or self.endpoint_id
        
        if not api_key or not endpoint_id:
            return "Error: RUNPOD_API_KEY or RUNPOD_SERVERLESS_ENDPOINT is not configured."

        url = f"{self.base_url}/{endpoint_id}/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        model = kwargs.get("model", settings.model_name)
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "max_tokens": kwargs.get("max_tokens", 1024),
            "temperature": kwargs.get("temperature", 0.7)
        }
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    return f"Error: RunPod API returned HTTP {response.status_code}: {response.text}"
                
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    return data["choices"][0].get("message", {}).get("content", "")
                return ""
            except Exception as e:
                return f"RunPod Connection Error: {str(e)}"
