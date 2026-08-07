from typing import List, Dict, Any
from app.core.tracing import trace_stage

class PromptAssembler:
    """
    Responsible for constructing the final prompt sent to the LLM.
    Combines the system template, retrieved context, and the user's message.
    """
    
    def __init__(self, system_template: str = "You are Vayu, a helpful AI assistant."):
        self.system_template = system_template
        
    @trace_stage("prompt.assemble")
    def assemble(self, user_message: str, context: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Assembles the final list of messages for the LLM.
        """
        final_messages = []
        
        # 1. Base System Prompt
        final_messages.append({
            "role": "system",
            "content": self.system_template
        })
        
        # 2. Inject contextual messages (history, RAG, etc.)
        if context:
            final_messages.extend(context)
            
        # 3. Append the current user message
        final_messages.append({
            "role": "user",
            "content": user_message
        })
        
        return final_messages
