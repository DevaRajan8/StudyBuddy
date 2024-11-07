import time
start_import_time = time.time()

from GraphAgent import WorkFlow  # Updated import
import_duration = time.time() - start_import_time

from langchain_core.messages import HumanMessage
from typing import Any, Dict
import json
from datetime import datetime

# Debug configuration flags
DEBUG_CONFIG = {
    'SHOW_STATE_CHANGES': True,        # Show state changes between nodes
    'SHOW_TIMING': True,               # Show execution time for each step
    'SHOW_DECISION_PROCESS': True,     # Show the task decision process
    'SHOW_CREWAI_DETAILS': True,       # Show CrewAI interaction details
    'SAVE_LOGS': True,                 # Save debug logs to file
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

def log_state(state: Dict[str, Any], step: str) -> None:
    """Log the current state of the graph"""
    if DEBUG_CONFIG['SHOW_STATE_CHANGES']:
        print(f"\n{Colors.HEADER}=== State at {step} ==={Colors.ENDC}")
        for key, value in state.items():
            print(f"{Colors.BLUE}{key}:{Colors.ENDC} {value}")

def create_debug_log_filename() -> str:
    """Create a log filename for the current test session"""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    return f"debugLogs/debug_session_{timestamp}.txt"

def save_debug_log(message: str, log_file: str) -> None:
    """Save debug information to a log file"""
    if DEBUG_CONFIG['SAVE_LOGS']:
        with open(log_file, "a") as f:
            f.write(f"[{datetime.now().strftime('%H:%M:%S')}] {message}\n")

def test_workflow(query: str, log_file: str) -> None:
    """Test the workflow with detailed debugging"""
    print(f"\n{Colors.HEADER}Starting test with query: {query}{Colors.ENDC}")
    save_debug_log(f"Test query: {query}", log_file)

    # Initialize workflow
    start_time = time.time()
    wf = WorkFlow()
    
    if DEBUG_CONFIG['SHOW_TIMING']:
        print(f"{Colors.YELLOW}Workflow initialization time: {time.time() - start_time:.2f}s{Colors.ENDC}")

    # Create message
    message = HumanMessage(content=query)
    
    # Process message with timing
    step_start = time.time()
    try:
        result = wf.invoke(message)
        
        if DEBUG_CONFIG['SHOW_STATE_CHANGES']:
            log_state(result, "Final Result")
            
        if DEBUG_CONFIG['SHOW_TIMING']:
            print(f"{Colors.GREEN}Processing time: {time.time() - step_start:.2f}s{Colors.ENDC}")
            
        # Show the final response
        print(f"\n{Colors.GREEN}Final Response:{Colors.ENDC}")
        print(result['messages'][-1].content)
        
        # Save debug information
        if DEBUG_CONFIG['SAVE_LOGS']:
            save_debug_log(f"Result: {json.dumps(str(result))}", log_file)
            
    except Exception as e:
        print(f"{Colors.RED}Error during processing: {str(e)}{Colors.ENDC}")
        save_debug_log(f"Error: {str(e)}", log_file)

def run_test_scenarios():
    """Run multiple test scenarios"""
    log_file = create_debug_log_filename()
    save_debug_log("Starting test scenarios", log_file)
    
    test_cases = [
        "What is the capital of France?",
        "Can you help me understand quantum physics?",
        "What's 2+2?",
        "Tell me about the latest developments in AI?",
        "I need to remember to complete my math homework by tomorrow",
        "Show me all my pending tasks",
        "Update the math homework task, I've completed 50% of it",
        "Delete the task about science project",
        "What tasks are due this week?",
    ]

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{Colors.HEADER}Test Case {i}/{len(test_cases)}{Colors.ENDC}")
        print(f"{Colors.BLUE}{'='*50}{Colors.ENDC}")
        test_workflow(test_case, log_file)
        time.sleep(1)  # Pause between tests

def format_state(workflow: WorkFlow) -> str:
    """Format the current workflow state for display"""
    try:
        state_parts = []
        
        # Get messages history
        if hasattr(workflow, 'messages'):
            state_parts.append("Messages History:")
            for msg in workflow.messages:
                state_parts.append(f"  - {msg.type}: {msg.content[:100]}...")
        
        # Get chat history
        if hasattr(workflow, 'chat_history'):
            state_parts.append("\nChat History:")
            for msg in workflow.chat_history:
                state_parts.append(f"  - {msg.type}: {msg.content[:100]}...")
        
        return "\n".join(state_parts)
    except Exception as e:
        return f"Error formatting state: {str(e)}"

def start_conversation(log_file: str) -> None:
    """Start an interactive conversation with the workflow"""
    print(f"\n{Colors.HEADER}Starting conversation mode{Colors.ENDC}")
    print(f"{Colors.BLUE}Commands:{Colors.ENDC}")
    print("  /state - Show current workflow state")
    print("  /clear - Clear chat history")
    print("  /exit - End conversation")
    save_debug_log("Starting conversation mode", log_file)
    
    wf = WorkFlow()  # Create single workflow instance for the conversation
    
    while True:
        query = input(f"\n{Colors.YELLOW}You:{Colors.ENDC} ")
        
        # Handle commands
        if query.strip().lower() in ['/exit', '/quit', 'exit', 'quit', 'q']:
            print(f"{Colors.GREEN}Ending conversation{Colors.ENDC}")
            save_debug_log("Ending conversation", log_file)
            break
            
        if query.strip() == '':
            continue
            
        if query.strip().lower() == '/state':
            state_info = format_state(wf)
            print(f"\n{Colors.HEADER}Current Workflow State:{Colors.ENDC}")
            print(f"{Colors.BLUE}{state_info}{Colors.ENDC}")
            save_debug_log("State inspection requested", log_file)
            save_debug_log(state_info, log_file)
            continue
        
        if query.strip().lower() == '/clear':
            print(f"{Colors.GREEN}Chat history cleared{Colors.ENDC}")
            save_debug_log("Chat history cleared", log_file)
            wf.clear()
            continue

        save_debug_log(f"User query: {query}", log_file)
        
        try:
            message = HumanMessage(content=query)
            result = wf.invoke(message)
            
            print(f"{Colors.GREEN}Assistant:{Colors.ENDC} {result['messages'][-1].content}")
            save_debug_log(f"Assistant response: {result['messages'][-1].content}", log_file)
            
        except Exception as e:
            print(f"{Colors.RED}Error: {str(e)}{Colors.ENDC}")
            save_debug_log(f"Error: {str(e)}", log_file)

if __name__ == "__main__":
    # Add import timing information at startup
    print(f"{Colors.YELLOW}WorkFlow import time: {import_duration:.2f}s{Colors.ENDC}")
    
    log_file = create_debug_log_filename()
    save_debug_log(f"WorkFlow import time: {import_duration:.2f}s", log_file)
    save_debug_log("Starting test suite", log_file)
    
    print(f"{Colors.HEADER}LangGraph Test Suite{Colors.ENDC}")
    print(f"{Colors.BLUE}Debug Configuration:{Colors.ENDC}")
    for key, value in DEBUG_CONFIG.items():
        print(f"{key}: {value}")
        save_debug_log(f"Config: {key}={value}", log_file)
    
    while True:
        print(f"\n{Colors.YELLOW}Select an option:{Colors.ENDC}")
        print("1. Run test scenarios")
        print("2. Enter custom query")
        print("3. Start conversation")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ")
        save_debug_log(f"User selected option: {choice}", log_file)
        
        if choice == '1':
            run_test_scenarios()
        elif choice == '2':
            query = input("\nEnter your query: ")
            test_workflow(query, log_file)
        elif choice == '3':
            start_conversation(log_file)
        elif choice == '4':
            save_debug_log("Exiting test suite", log_file)
            print(f"{Colors.GREEN}Exiting test suite{Colors.ENDC}")
            break
        else:
            print(f"{Colors.RED}Invalid choice. Please try again.{Colors.ENDC}")