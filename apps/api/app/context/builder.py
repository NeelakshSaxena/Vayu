from typing import List, Dict, Any
from app.context.injectors import ContextInjector
from app.core.tracing import trace_stage

class ContextBuilder:
    """
    Subsystem for building and managing the context required for LLM interactions.
    Coordinates various ContextInjectors to composite the final context array.
    """
    
    def __init__(self, injectors: List[ContextInjector] = None):
        self.injectors = injectors or []

    def add_injector(self, injector: ContextInjector):
        self.injectors.append(injector)

    @trace_stage("context.build")
    async def build_context(self, session_id: str, user_message: str, **kwargs) -> List[Dict[str, Any]]:
        """
        Build the prompt context array for the LLM by running all registered injectors.
        """
        context = []
        
        # Execute injectors to gather context (history, RAG, etc.)
        for injector in self.injectors:
            injected_messages = await injector.inject(session_id, user_message, **kwargs)
            context.extend(injected_messages)
            
        return context

# A global instance is no longer recommended since dependencies (like memory) need to be injected,
# but we can provide a default empty builder if needed.
context_builder = ContextBuilder()
