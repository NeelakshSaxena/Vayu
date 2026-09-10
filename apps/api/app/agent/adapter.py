import logging
from typing import AsyncGenerator, Dict, Any, List

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from typing_extensions import TypedDict, Annotated

from langchain_core.messages import AnyMessage, BaseMessage, HumanMessage, SystemMessage, AIMessage
from langchain_openai import ChatOpenAI

from app.tools.registry import get_available_tools
from app.core.config import settings
from app.core.tracing import trace_stage

logger = logging.getLogger(__name__)

class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

class AgentAdapter:
    """
    Adapter to bridge the Vayu Conversation Engine (AIRuntimePipeline) 
    with LangGraph's stateful execution and tool calling.
    """
    
    def __init__(self):
        self.tools = get_available_tools()
        self.tool_node = ToolNode(self.tools)
        
        api_key = settings.runpod_api_key
        endpoint_id = settings.runpod_serverless_endpoint
        model = settings.model_name
        
        # Configure ChatOpenAI to use RunPod Serverless API
        if not api_key or not endpoint_id:
            logger.warning("RunPod API key or endpoint ID not configured. LangGraph adapter might fail.")
            
        base_url = f"https://api.runpod.ai/v2/{endpoint_id}/openai/v1" if endpoint_id else "https://api.runpod.ai/v2/mock/openai/v1"
            
        self.llm = ChatOpenAI(
            base_url=base_url,
            api_key=api_key or "mock",
            model=model,
            streaming=True
        )
        
        self.llm_with_tools = self.llm.bind_tools(self.tools)
        self.graph = self._build_graph()
        
    def _build_graph(self):
        workflow = StateGraph(AgentState)
        
        # Define the nodes
        workflow.add_node("agent", self._call_model)
        workflow.add_node("tools", self.tool_node)
        
        # Define the edges
        workflow.add_edge(START, "agent")
        workflow.add_conditional_edges(
            "agent",
            tools_condition,
            {
                "tools": "tools",
                END: END
            }
        )
        workflow.add_edge("tools", "agent")
        
        # Compile
        return workflow.compile()
        
    async def _call_model(self, state: AgentState):
        messages = state["messages"]
        response = await self.llm_with_tools.ainvoke(messages)
        return {"messages": [response]}
        
    def _convert_messages(self, dict_messages: List[Dict[str, Any]]) -> List[BaseMessage]:
        """Convert Vayu dict messages to Langchain BaseMessage objects."""
        lc_messages = []
        for msg in dict_messages:
            role = msg.get("role")
            content = msg.get("content", "")
            if role == "system":
                lc_messages.append(SystemMessage(content=content))
            elif role == "user":
                lc_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))
        return lc_messages
        
    @trace_stage("agent.stream")
    async def stream_agent_events(self, dict_messages: List[Dict[str, Any]], session_id: str = None) -> AsyncGenerator[str, None]:
        """
        Runs the LangGraph workflow and yields text chunks back to the WebSocket endpoint.
        """
        inputs = {
            "messages": self._convert_messages(dict_messages)
        }
        
        config = {"configurable": {"session_id": session_id}} if session_id else None
        
        async for event in self.graph.astream_events(inputs, config=config, version="v2"):
            kind = event["event"]
            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content and isinstance(chunk.content, str):
                    yield chunk.content
            elif kind == "on_tool_start":
                tool_name = event["name"]
                yield f"\n[Agent is using tool: {tool_name}...]\n"
