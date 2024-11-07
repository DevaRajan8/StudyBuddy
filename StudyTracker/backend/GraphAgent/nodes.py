from .state import AssistantState
from langchain_core.messages import AIMessage
from langchain_core.prompts import MessagesPlaceholder, ChatPromptTemplate
from typing import List, Optional
from datetime import datetime
import importlib
from functools import lru_cache

# LLM_MODEL = "llama-3.2-90b-text-preview"
LLM_MODEL = "llama-3.1-70b-versatile"

RESPOND_OR_QUERY_MAX_INVALIDS = 3

# Debug configuration flags
DEBUG_CONFIG = {
    'SHOW_STATE_CHANGES': True,        # Show state changes between nodes
    'SHOW_TIMING': True,               # Show execution time for each step
    'SHOW_DECISION_PROCESS': True,     # Show the task decision process
    'SHOW_CREWAI_DETAILS': True,       # Show CrewAI interaction details
    'COLORED_OUTPUT': True,            # Use colored terminal output
}

# ANSI color codes
class Colors:
    HEADER = '\033[95m' if DEBUG_CONFIG['COLORED_OUTPUT'] else ''
    BLUE = '\033[94m' if DEBUG_CONFIG['COLORED_OUTPUT'] else ''
    GREEN = '\033[92m' if DEBUG_CONFIG['COLORED_OUTPUT'] else ''
    YELLOW = '\033[93m' if DEBUG_CONFIG['COLORED_OUTPUT'] else ''
    RED = '\033[91m' if DEBUG_CONFIG['COLORED_OUTPUT'] else ''
    ENDC = '\033[0m' if DEBUG_CONFIG['COLORED_OUTPUT'] else ''

def log_state(state: dict, step: str) -> None:
    """Log the current state of the workflow"""
    if DEBUG_CONFIG['SHOW_STATE_CHANGES']:
        print(f"\n{Colors.HEADER}=== State at {step} ==={Colors.ENDC}")
        for key, value in state.items():
            print(f"{Colors.BLUE}{key}:{Colors.ENDC} {value}")

# Lazy load expensive imports
_chat_groq = None
_backendcrew = None

def get_chat_groq():
    global _chat_groq
    if _chat_groq is None:
        from langchain_groq import ChatGroq
        if DEBUG_CONFIG['SHOW_TIMING']:
            print(f"{Colors.YELLOW}Initializing ChatGroq...{Colors.ENDC}")
        _chat_groq = ChatGroq(model=LLM_MODEL)
    return _chat_groq

def get_crew():
    global _backendcrew
    if (_backendcrew is None):
        from backendcrew import backendcrewCrew 
        if DEBUG_CONFIG['SHOW_TIMING']:
            print(f"{Colors.YELLOW}Initializing backendcrewCrew...{Colors.ENDC}")
        _backendcrew = backendcrewCrew()
    return _backendcrew

def crewai_query(query: str) -> str:
    try:
        if DEBUG_CONFIG['SHOW_CREWAI_DETAILS']:
            print(f"{Colors.BLUE}CrewAI Query:{Colors.ENDC} {query}")
        crew = get_crew()
        response = crew.process_query(query)
        if DEBUG_CONFIG['SHOW_CREWAI_DETAILS']:
            print(f"{Colors.GREEN}CrewAI Response:{Colors.ENDC} {response}")
        return response
    except Exception as e:
        print(f"{Colors.RED}Error querying CrewAI: {str(e)}{Colors.ENDC}")
        return f"Error querying CrewAI: {str(e)}"

class Nodes:
    def __init__(self):
        self._chat = None
        if DEBUG_CONFIG['SHOW_TIMING']:
            print(f"{Colors.YELLOW}Initializing Nodes...{Colors.ENDC}")

    @property
    def chat(self):
        if self._chat is None:
            self._chat = get_chat_groq()
        return self._chat

    def respond_or_query(self, state: AssistantState) -> AssistantState:
        if DEBUG_CONFIG['SHOW_STATE_CHANGES']:
            print(f"\n{Colors.HEADER}=== Entering respond_or_query ==={Colors.ENDC}")
            
        start_time = datetime.now()
        previous_responses = state.get("database_agent_responses", [])
        formatted_responses = "\n".join([f"{i+1}. {resp}" for i, resp in enumerate(previous_responses)])
        
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an AI assistant helping students with their questions.

Current Time: {current_time}

As part of your three-step process:
1. Decide whether to respond directly or query CrewAI agents.
2. If you decide to query, generate a proper contextual query to ask the CrewAI Agents.
3. Formulate the final response based on the context and agent responses.

You have access to a comprehensive task management system through CrewAI agents that can:
- Create new tasks with details (title, description, due date, priority, etc.)
- Update existing tasks (progress, status, details)
- Delete tasks when they're no longer needed
- Retrieve tasks (all tasks, pending tasks, completed tasks, or specific tasks)
- Check task status and deadlines

IMPORTANT: For ANY task-related queries (creation, updates, status checks, deletions, or listings), 
ALWAYS choose to QUERY the CrewAI agents. The task management system is maintained by CrewAI agents,
and you cannot directly access or modify tasks without their involvement.

Previous CrewAI Responses:
{database_agent_responses}

Based on the above, decide whether to:

1. RESPOND directly if:
    - The question is about basic concepts you're confident about
    - It's a simple clarification or follow-up to a previous response
    - It requires general advice without task management

2. QUERY CrewAI agents if:
    - The request involves creating, updating, checking, or deleting tasks
    - The user asks about task status, deadlines, or progress
    - The question requires accessing or modifying stored information
    - The user wants to list or search for specific tasks
    - The request involves task organization or management
    - The question requires web searches for current information.
    - It involves complex mathematical solutions.
    - It needs detailed study techniques or in-depth explanations.
    - Fact-checking or verification is necessary.
    - If you DO NOT have enough information to respond directly.

Respond ONLY with 'query' or 'respond'.

Current invalid decisions: {invalid_count}. Over {RESPOND_OR_QUERY_MAX_INVALIDS} invalids will terminate the session."""),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ])

        chain = prompt | self.chat

        history = state.get("chat_history", [])

        decision = chain.invoke(
            {"input": state["messages"][-1].content,
             "invalid_count": state.get("invalid_decision_count", 0),
             "database_agent_responses": formatted_responses if previous_responses else "None.",
             "history": history,
             "current_time": current_time,
             "RESPOND_OR_QUERY_MAX_INVALIDS": RESPOND_OR_QUERY_MAX_INVALIDS
             }  # Add current_time to the template variables
        )

        decision_content = decision.content.strip(" \n\t\'.\"\\{}()/").lower()

        invalid_decision_count = 0
        print(decision_content, f"\\Invalid Count: {state.get("invalid_decision_count", 0)}")

        if decision_content.startswith("query") or 'query' in decision_content[:20]:
            decision_content = "query"
        elif decision_content.startswith("respond") or 'respond' in decision_content[:20] or state.get("invalid_decision_count", 0) > RESPOND_OR_QUERY_MAX_INVALIDS:
            decision_content = "respond"
        else:
            decision_content = "invalid"
            invalid_decision_count = state.get("invalid_decision_count", 0) + 1

        print("Task Decision: ", decision_content)

        if DEBUG_CONFIG['SHOW_TIMING']:
            duration = (datetime.now() - start_time).total_seconds()
            print(f"{Colors.YELLOW}respond_or_query duration: {duration:.2f}s{Colors.ENDC}")
            
        if DEBUG_CONFIG['SHOW_DECISION_PROCESS']:
            print(f"{Colors.GREEN}Decision:{Colors.ENDC} {decision_content}")
            
        return {"task_decision": decision_content, "invalid_decision_count": invalid_decision_count}

    def crewai_query(self, state: AssistantState) -> AssistantState:
        if DEBUG_CONFIG['SHOW_STATE_CHANGES']:
            print(f"\n{Colors.HEADER}=== Entering crewai_query ==={Colors.ENDC}")
            
        start_time = datetime.now()
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print("CrewAI Query")
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are an AI assistant.
Current Time: {current_time}
                 
As part of your three-step process:
1. You've decided to query the CrewAI agents.
2. Generate a proper contextual query based on the student's question and conversation history.

Previous CrewAI Responses:
{database_agent_responses}

Student's Question:
{input}

Format the query for the CrewAI agents by:
1. Including relevant context from previous exchanges.
2. Specifying the type of information needed.
3. Maintaining the student's original intent.
4. Focusing on one clear question at a time.

Provide a clear, specific query with necessary context. No additional commentary."""),
            ])
            chain = prompt | self.chat
            result = chain.invoke({
                "input": state["messages"][-1].content,
                "database_agent_responses": state.get("database_agent_responses", ["No previous context"]),
             "current_time": current_time
            })
            
            responses = state.get("database_agent_responses", [])
            crew_response = crewai_query(result.content)
            responses.append(crew_response)
            if DEBUG_CONFIG['SHOW_TIMING']:
                duration = (datetime.now() - start_time).total_seconds()
                print(f"{Colors.YELLOW}crewai_query duration: {duration:.2f}s{Colors.ENDC}")
                
            return {"database_agent_responses": responses}
        except Exception as e:
            print(f"Error querying CrewAI: {str(e)}")
            return {"database_agent_responses": [f"Error: {str(e)}"]}
        


    def main_conversation(self, state: AssistantState) -> AssistantState:
        if DEBUG_CONFIG['SHOW_STATE_CHANGES']:
            print(f"\n{Colors.HEADER}=== Entering main_conversation ==={Colors.ENDC}")
            
        start_time = datetime.now()
        # Format all responses as a numbered list
        responses = state.get("database_agent_responses", [])
        formatted_responses = "\n".join([f"{i+1}. {resp}" for i, resp in enumerate(responses)])
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an AI assistant helping students with their questions.

Current Time: {current_time} (real-time same as the user's time)

As part of your three-step process:
1. You've decided whether to respond directly or after querying CrewAI agents.
2. If applicable, you've gathered information from the CrewAI agents.
3. Now, formulate the final response based on the context and agent responses.

Information from CrewAI Agents:
{database_agent_responses}

Provide a helpful and informative response to the student's question."""),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
            ("system", "Information provided CrewAI Agent: {database_agent_responses}\nResponse:"),
        ])
        
        history = state.get("chat_history", [])
        current_message = state["messages"][-1]
        
        chain = prompt | self.chat
        response = chain.invoke({
            "input": current_message.content,
            "database_agent_responses": formatted_responses if responses else "No additional information available.",
            "history": history,
            "current_time": current_time
        })

        ai_message = AIMessage(content=response.content)
        updated_history = history + [ai_message]
        
        if DEBUG_CONFIG['SHOW_TIMING']:
            duration = (datetime.now() - start_time).total_seconds()
            print(f"{Colors.YELLOW}main_conversation duration: {duration:.2f}s{Colors.ENDC}")
            
        return {
            "messages": [ai_message],
            "chat_history": updated_history
        }
