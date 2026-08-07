from typing import List, Dict, Any

class ContextBuilder:
    """
    Subsystem for building and managing the context required for LLM interactions.
    This will be expanded to fetch history, user context, tool results, etc.
    """
    
    def __init__(self):
        pass

    async def build_context(self, user_message: str, history: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Build the prompt context array for the LLM.
        """
        context = []
        
        # Add system prompt
        context.append({
            "role": "system",
            "content": "You are Vayu, a helpful AI assistant."
        })
        
        # Add history if provided
        if history:
            context.extend(history)
            
        # Add current user message
        context.append({
            "role": "user",
            "content": user_message
        })
        
        return context

context_builder = ContextBuilder()
