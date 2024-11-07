from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from .state import AssistantState
from .nodes import Nodes
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
load_dotenv()

class WorkFlow:
    def __init__(self):
        self.chat_history = []
        self._nodes = None
        # Update the SystemMessage to be more verbose and explicit
        initial_message = SystemMessage(content=(
            "You are the LangGraph GraphAgent specializing in student task management and scheduling. "
            "Your responsibilities include analyzing user queries to determine if they need task management operations, "
            "routing task-related requests to appropriate CrewAI agents, managing direct responses for general queries, "
            "and maintaining conversation context and task history.\n\n"
            "Available CrewAI agents and their roles:\n"
            "- **Notebook Resource Manager**: Organizes and manages all study materials, notes, references, and resources for the student. Ensures that resources are categorized logically and are easily accessible.\n"
            "- **Schedule Manager**: Creates and maintains personalized study schedules for the student. Balances study sessions with breaks and leisure time, considering the student's availability and deadlines.\n"
            "- **Performance Analyst**: Analyzes the student's academic performance and study habits. Provides insights and recommendations to improve learning outcomes.\n"
            "- **Miscellaneous Task Manager**: Handles general queries and tasks outside the scope of study management. Provides information, performs calculations, and assists with miscellaneous requests.\n"
            "- **Task Manager**: Manages and organizes student tasks comprehensively. Dynamically handles task creation, updates, queries, and deletions based on user input and context. Ensures tasks are categorized with appropriate priorities and due dates.\n"
            "- **Query Clarification Agent**: Assists in clarifying user queries when there is insufficient context. Engages with the user to gather more information needed to proceed.\n\n"
            "When handling user queries:\n"
            "- For task-related operations (create/update/delete/query), always route to the appropriate CrewAI agent.\n"
            "- For general queries, respond directly if you have sufficient knowledge.\n"
            "- Be explicit and provide detailed responses, leveraging the capabilities of the agents and tools available.\n"
            "- Maintain the conversation context and task history to ensure continuity."
        ))
        self.chat_history.append(initial_message)
        self._app = None

    @property
    def nodes(self):
        if self._nodes is None:
            self._nodes = Nodes()
        return self._nodes

    @property
    def app(self):
        if self._app is None:
            self._initialize_workflow()
        return self._app

    def _initialize_workflow(self):
        workflow = StateGraph(AssistantState)

        # Add nodes
        workflow.add_node("respond_or_query", self.nodes.respond_or_query)
        workflow.add_node("crewai_agent_query", self.nodes.crewai_query)
        workflow.add_node("main_conversation", self.nodes.main_conversation)

        # Add edges
        workflow.set_entry_point("respond_or_query")
        workflow.add_conditional_edges(
            "respond_or_query",
            lambda x: "crewai_agent_query" if x["task_decision"] == "query" else (
                "main_conversation" if x["task_decision"] == "respond" else "respond_or_query"),
            {
                "crewai_agent_query": "crewai_agent_query",
                "main_conversation": "main_conversation",
                "respond_or_query": "respond_or_query"
            }
        )
        workflow.add_edge("crewai_agent_query", "respond_or_query")
        workflow.add_edge("main_conversation", END)

        self._app = workflow.compile(MemorySaver())

    def display_graph(self) -> str:
        return self.app.get_graph().draw_mermaid()

    def invoke(self, user_input: str,debugMode=False) -> dict:
        if isinstance(user_input, str):
            message = HumanMessage(content=user_input)
        else:
            message = user_input
        
        self.chat_history.append(message)
        
        result = self.app.invoke({
            "messages": [message],  # Only pass the current message
            "chat_history": self.chat_history,  # Pass the full history
        },config={"configurable": {"thread_id": "1"}},debug=debugMode)
        
        if "chat_history" in result:
            self.chat_history = result["chat_history"]
        
        return result

    def clear(self):
        self.chat_history = []

    def set_chat_history(self, chat_history: list) -> None:
        """Set the chat history for the workflow."""
        self.chat_history = chat_history

if __name__ == "__main__":
    wf = WorkFlow()
    while True:
        result = wf.invoke(input("You: "))
        print("\n\nFinal result:")
        print(result['messages'][-1].content)
        print("\n\n")
