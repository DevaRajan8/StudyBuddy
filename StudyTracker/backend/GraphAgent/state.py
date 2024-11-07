from langgraph.graph import MessagesState
from typing import List, Optional, Dict
from langchain_core.messages import BaseMessage

class AssistantState(MessagesState):
    task_decision: Optional[str]
    database_agent_responses: List[str]
    invalid_decision_count: int
    chat_history: List[BaseMessage]