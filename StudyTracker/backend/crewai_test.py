import time
start_import_time = time.time()

from backendcrew import backendcrewCrew
from backendcrew.tools import *
import_duration = time.time() - start_import_time

from typing import Any, Dict
import json
from datetime import datetime, timedelta

# Debug configuration flags
DEBUG_CONFIG = {
    'SHOW_TIMING': True,               # Show execution time for each test
    'SHOW_TOOL_OUTPUT': True,          # Show detailed tool outputs
    'SAVE_LOGS': True,                 # Save test logs to file
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

def create_debug_log_filename() -> str:
    """Create a log filename for the current test session"""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    return f"debugLogs/crewai_test_{timestamp}.txt"

def save_debug_log(message: str, log_file: str) -> None:
    """Save debug information to a log file"""
    if DEBUG_CONFIG['SAVE_LOGS']:
        with open(log_file, "a") as f:
            f.write(f"[{datetime.now().strftime('%H:%M:%S')}] {message}\n")

def test_tool(tool_instance, test_input: Any, expected_output: Any, log_file: str) -> bool:
    """Test a specific tool with given input and expected output"""
    tool_name = tool_instance.__class__.__name__
    print(f"\n{Colors.HEADER}Testing {tool_name}{Colors.ENDC}")
    save_debug_log(f"Testing {tool_name} with input: {test_input}", log_file)

    start_time = time.time()
    try:
        if tool_name == 'GetAllTasksTool':
            # Handle GetAllTasksTool's different argument structure
            result = tool_instance._run(
                test_input.get('query', ''),
                test_input.get('getObjectID', False)
            )

        elif tool_name == 'UpdateTaskTool':
            # Handle UpdateTaskTool's different argument structure
            result = tool_instance._run(
                test_input.get('search_params', {}),
                test_input.get('updates', {}),
                test_input.get('getObjectID', False)
            )

        else:
            result = tool_instance._run(test_input)
            
        duration = time.time() - start_time
        
        if DEBUG_CONFIG['SHOW_TIMING']:
            print(f"{Colors.YELLOW}Execution time: {duration:.2f}s{Colors.ENDC}")
        
        if DEBUG_CONFIG['SHOW_TOOL_OUTPUT']:
            print(f"{Colors.BLUE}Output:{Colors.ENDC}")
            print(json.dumps(result, indent=2))
            
        # Basic validation (can be enhanced based on specific tool requirements)
        test_passed = True
        if isinstance(expected_output, type):
            test_passed = isinstance(result, expected_output)
        else:
            test_passed = result == expected_output

        status = f"{Colors.GREEN}PASSED{Colors.ENDC}" if test_passed else f"{Colors.RED}FAILED{Colors.ENDC}"
        print(f"Test Status: {status}")
        
        save_debug_log(f"Result: {result}", log_file)
        save_debug_log(f"Test {'passed' if test_passed else 'failed'}", log_file)
        
        return test_passed
        
    except Exception as e:
        print(f"{Colors.RED}Error: {str(e)}{Colors.ENDC}")
        save_debug_log(f"Error: {str(e)}", log_file)
        return False

def run_tool_tests(log_file: str) -> None:
    """Run all tool tests"""
    tests_passed = 0
    total_tests = 0
    
    # Test data
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S')
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S')
    
    # Test cases for each tool
    valid_test_cases = [
        # Test AddTaskTool - Valid Input
        (AddTaskTool(), {
            'title': 'Test Task',
            'description': 'This is a test task',
            'type': 'Test',
            'dueDate': tomorrow,
            'priority': 'High'
        }, str),
        
        # Test QueryTasksTool - Valid Status Query
        (QueryTasksTool(), {
            'status': 'pending',
            'title': 'Test'
        }, list),
        
        # Test UpdateTaskTool - Valid Update
        (UpdateTaskTool(), {
            'search_params': {'title': 'Test Task'},
            'updates': {'progress': 50},
            'getObjectID': False
        }, str),
        
        # Test DeleteTaskTool - Valid Delete
        (DeleteTaskTool(), {
            'title': 'Test Task'
        }, str),
        
        # Test GetAllTasksTool - Valid Query
        (GetAllTasksTool(), {
            'query': 'Test',
            'getObjectID': False
        }, list),
    ]
    
    error_test_cases = [
        # Test AddTaskTool - Missing Required Fields
        (AddTaskTool(), {}, str),
        
        # Test QueryTasksTool - Invalid Search Fields
        (QueryTasksTool(), {'invalid': 'field'}, list),
        
        # Test UpdateTaskTool - Invalid Update Data
        (UpdateTaskTool(), {
            'search_params': {'title': 'Test Task'},
            'updates': {'invalid_field': 'value'},
            'getObjectID': False
        }, str),
        
        # Test AddTaskTool - Invalid Date Format
        (AddTaskTool(), {
            'title': 'Test Task',
            'description': 'Test',
            'type': 'Test',
            'dueDate': 'invalid-date'
        }, str),
        
        # Test QueryTasksTool - Invalid Status
        (QueryTasksTool(), {
            'status': 'invalid-status',
            'title': 'Test'
        }, list),
    ]
    
    # Run valid test cases first
    print(f"\n{Colors.HEADER}Running Valid Test Cases:{Colors.ENDC}")
    for tool, test_input, expected_output in valid_test_cases:
        total_tests += 1
        test_passed = test_tool(tool, test_input, expected_output, log_file)
        if test_passed:
            tests_passed += 1
    
    # Run error test cases
    print(f"\n{Colors.HEADER}Running Error Test Cases:{Colors.ENDC}")
    for tool, test_input, expected_output in error_test_cases:
        total_tests += 1
        # For error cases, we expect them to not raise exceptions but return error messages
        try:
            result = test_tool(tool, test_input, expected_output, log_file)
            # Error cases should return false but not crash
            if not result:
                tests_passed += 1
        except Exception as e:
            print(f"{Colors.RED}Test failed with unexpected exception: {str(e)}{Colors.ENDC}")

    print(f"\n{Colors.HEADER}Test Summary:{Colors.ENDC}")
    print(f"Total Tests: {total_tests}")
    print(f"Tests Passed: {tests_passed}")
    print(f"Success Rate: {(tests_passed/total_tests)*100:.1f}%")
    
    save_debug_log(f"Test Summary - Total: {total_tests}, Passed: {tests_passed}", log_file)

def test_crew_integration(log_file: str) -> None:
    """Test CrewAI integration with tools"""
    print(f"\n{Colors.HEADER}Testing CrewAI Integration{Colors.ENDC}")
    save_debug_log("Starting CrewAI integration tests", log_file)
    
    crew = backendcrewCrew()
    
    test_queries = [
        "I need to remember to complete math homework by tomorrow",
        "Show me all my pending tasks",
        "Update the math homework task to 50% complete",
        "Delete the math homework task",
        "What tasks are due this week?",
        "Add a new task to buy groceries by tomorrow",
        "Show me all completed tasks",
        "What tasks are overdue?",
    ]
    
    for query in test_queries:
        print(f"\n{Colors.BLUE}Testing Query:{Colors.ENDC} {query}")
        save_debug_log(f"Testing query: {query}", log_file)
        
        start_time = time.time()
        try:
            response = crew.process_query(query)
            duration = time.time() - start_time
            
            if DEBUG_CONFIG['SHOW_TIMING']:
                print(f"{Colors.YELLOW}Processing time: {duration:.2f}s{Colors.ENDC}")
            
            print(f"{Colors.GREEN}Response:{Colors.ENDC} {response}")
            save_debug_log(f"Response: {response}", log_file)
            
        except Exception as e:
            print(f"{Colors.RED}Error: {str(e)}{Colors.ENDC}")
            save_debug_log(f"Error: {str(e)}", log_file)

if __name__ == "__main__":
    print(f"{Colors.YELLOW}Import time: {import_duration:.2f}s{Colors.ENDC}")
    
    log_file = create_debug_log_filename()
    save_debug_log(f"Import time: {import_duration:.2f}s", log_file)
    save_debug_log("Starting test suite", log_file)
    
    print(f"{Colors.HEADER}CrewAI Tools Test Suite{Colors.ENDC}")
    print(f"{Colors.BLUE}Debug Configuration:{Colors.ENDC}")
    for key, value in DEBUG_CONFIG.items():
        print(f"{key}: {value}")
        save_debug_log(f"Config: {key}={value}", log_file)
    
    while True:
        print(f"\n{Colors.YELLOW}Select an option:{Colors.ENDC}")
        print("1. Run tool tests")
        print("2. Run CrewAI integration tests")
        print("3. Run all tests")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ")
        save_debug_log(f"User selected option: {choice}", log_file)
        
        if choice == '1':
            run_tool_tests(log_file)
        elif choice == '2':
            test_crew_integration(log_file)
        elif choice == '3':
            run_tool_tests(log_file)
            test_crew_integration(log_file)
        elif choice == '4':
            save_debug_log("Exiting test suite", log_file)
            print(f"{Colors.GREEN}Exiting test suite{Colors.ENDC}")
            break
        else:
            print(f"{Colors.RED}Invalid choice. Please try again.{Colors.ENDC}")
