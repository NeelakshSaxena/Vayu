import json
from app.llm.providers.runpod import RunpodProvider

provider = RunpodProvider()

# Let's mock a Runpod response that might cause a stringified dict
test_data = {
    "status": "COMPLETED",
    "output": [
        {
            "id": "cmpl-abb851dad5d78ce0",
            "model": "Qwen/Qwen3-14B",
            "object": "text_completion",
            "usage": {
                "completion_tokens": 16,
                "prompt_tokens": 873,
                "prompt_tokens_details": None,
                "total_tokens": 889
            }
        }
    ]
}

text = provider._extract_text_from_output(test_data)
print(f"Extracted text: {repr(text)}")
