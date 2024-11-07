from crewai_tools import BaseTool
from pymongo import MongoClient
from typing import List, Dict, Optional, Any
from bson.objectid import ObjectId
from datetime import datetime
import re
# Load environment variables
from dotenv import load_dotenv
import os

__all__ = ['CustomCalenderTool', 'AddTaskTool', 'QueryTasksTool', 'UpdateTaskTool', 'DeleteTaskTool', 'GetAllTasksTool']

load_dotenv()
# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/studytracker'))
db = client.studytracker
tasks_collection = db.taskEntries

def validate_date_format(date_str: str) -> tuple[bool, str]:
    """Validate and normalize date string format."""
    try:
        # First try parsing with seconds
        datetime.strptime(date_str, '%Y-%m-%dT%H:%M:%S')
        return True, f"{date_str}.000Z"
    except ValueError:
        try:
            # Try parsing without seconds
            parsed_date = datetime.strptime(date_str, '%Y-%m-%dT%H:%M')
            return True, f"{parsed_date.strftime('%Y-%m-%dT%H:%M:00')}.000Z"
        except ValueError:
            try:
                # Try parsing just date
                parsed_date = datetime.strptime(date_str, '%Y-%m-%d')
                return True, f"{parsed_date.strftime('%Y-%m-%dT23:59:00')}.000Z"
            except ValueError:
                return False, "Invalid date format. Use 'YYYY-MM-DDTHH:MM:SS', 'YYYY-MM-DDTHH:MM', or 'YYYY-MM-DD'"

def validate_search_params(params: dict) -> tuple[bool, str]:
    """Validate search parameters."""
    if not isinstance(params, dict):
        return False, "Search parameters must be a dictionary"
    
    valid_fields = {'title', 'description', 'status', 'type', 'priority','progress'}
    if not any(field in valid_fields for field in params.keys()):
        return False, f"At least one valid search field required: {', '.join(valid_fields)}"
    
    if 'status' in params:
        valid_statuses = {'completed', 'pending', 'overdue'}
        if params['status'].lower() not in valid_statuses:
            return False, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            
    return True, "Valid parameters"

def validate_task_data(data: dict) -> tuple[bool, str, dict]:
    """Validate task data for creation/update."""
    if not isinstance(data, dict):
        try:
            eval_input = eval(data)
            if isinstance(eval_input, bool):
                data = eval_input
        except:
            pass
        return False, "Task data must be a dictionary", {}

    required_fields = {'title', 'description', 'type', 'dueDate'}
    missing = [f for f in required_fields if f not in data]
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}", {}

    # Validate string fields
    string_fields = {'title', 'description', 'type', 'priority'}
    for field in string_fields & data.keys():
        if not isinstance(data[field], str) or not data[field].strip():
            return False, f"Invalid {field}: must be non-empty string", {}

    # Validate dueDate
    if 'dueDate' in data:
        is_valid, result = validate_date_format(data['dueDate'])
        if not is_valid:
            return False, result, {}
        data['dueDate'] = result

    # Validate priority if present
    if 'priority' in data:
        valid_priorities = {'High', 'Medium', 'Low'}
        if data['priority'] not in valid_priorities:
            return False, f"Invalid priority. Must be one of: {', '.join(valid_priorities)}", {}

    # Validate progress if present
    if 'progress' in data:
        try:
            progress = int(data['progress'])
            if not 0 <= progress <= 100:
                return False, "Progress must be between 0 and 100", {}
            data['progress'] = progress
        except ValueError:
            return False, "Progress must be an integer", {}

    # Validate completed if present
    if 'completed' in data:
        if not isinstance(data['completed'], bool):
            try:
                eval_status = eval(data['completed'].capitalize())
                if isinstance(eval_status, bool):
                    data['completed'] = eval_status
            except:
                pass

            return False, "Completed must be a boolean", {}

    return True, "Valid task data", data


def validate_update_task_data(data: dict) -> tuple[bool, str, dict]:
    """Validate task data for update."""
    if not isinstance(data, dict):
        try:
            eval_input = eval(data)
            if isinstance(eval_input, bool):
                data = eval_input
        except:
            pass
        return False, "Task data must be a dictionary", {}

    # Validate string fields
    string_fields = {'title', 'description', 'type', 'priority'}
    for field in string_fields & data.keys():
        if not isinstance(data[field], str) or not data[field].strip():
            return False, f"Invalid {field}: must be non-empty string", {}

    # Validate dueDate if present
    if 'dueDate' in data:
        is_valid, result = validate_date_format(data['dueDate'])
        if not is_valid:
            return False, result, {}
        data['dueDate'] = result

    # Validate priority if present
    if 'priority' in data:
        valid_priorities = {'High', 'Medium', 'Low'}
        if data['priority'] not in valid_priorities:
            return False, f"Invalid priority. Must be one of: {', '.join(valid_priorities)}", {}

    # Validate progress if present
    if 'progress' in data:
        try:
            progress = int(data['progress'])
            if not 0 <= progress <= 100:
                return False, "Progress must be between 0 and 100", {}
            data['progress'] = progress
        except ValueError:
            return False, "Progress must be an integer", {}

    # Validate completed if present
    if 'completed' in data:
        if not isinstance(data['completed'], bool):
            return False, "Completed must be a boolean", {}

    return True, "Valid task data", data


class CustomCalenderTool(BaseTool):
    name: str = "Calendar Tool"
    description: str = (
        "This tool allows you to retrieve detailed academic calendar information for a specific date. "
        "You should provide a date in the format 'YYYY-MM-DD', and the tool will return information such as holidays, special events, or any schedule changes occurring on that day. "
        "It's particularly useful for planning study schedules, preparing for upcoming events, or knowing about any holidays that might affect your routine. "
        "Make sure the date provided is within the academic calendar range to get relevant results. "
        "For instance, if you input `{'date': '2023-10-25'}`, the tool will fetch all academic events and notes for October 25, 2023. "
        "This can help in adjusting your study plans accordingly and staying informed about important dates."
    )

    def _run(self, argument: str) -> str:
        # Stub Implementation
        # raise AssertionError("This function is called!")
        print("This function is called")
        return f"{argument} : 'Working Day' "

class AddTaskTool(BaseTool):
    name: str = "Add Task Tool"
    description: str = (
        "Use this tool to add a new task to your task management system with comprehensive details. "
        "It is essential to provide a dictionary containing at least the following keys: 'title', 'description', 'type', and 'dueDate'. "
        "The 'dueDate' should be formatted as 'YYYY-MM-DDTHH:MM:SS' to specify the exact deadline. "
        "Optionally, you can include 'priority' (choose from 'High', 'Medium', 'Low') and 'progress' (an integer between 0 and 100 representing the completion percentage). "
        "This tool helps in organizing your tasks effectively by ensuring all necessary details are captured. "
        "For example, you might input: {"
        "'title': 'Math Homework', "
        "'description': 'Complete exercises 5-10 from chapter 4', "
        "'type': 'Homework', "
        "'dueDate': '2023-10-27T14:30:00', "
        "'priority': 'High', "
        "'progress': 0"
        "}. "
        "Providing accurate and complete information ensures the task is properly tracked and managed within the system."
    )

    def _run(self, task_data: dict | List[dict]) -> str:
        # try:
            if isinstance(task_data, list):
                task_data = task_data[0]
            is_valid, message, validated_data = validate_task_data(task_data)
            if not is_valid:
                return f"Error: {message}"

            result = tasks_collection.insert_one(validated_data)
            return f"Task added successfully with ID: {result.inserted_id}"
        # except Exception as e:
            # return f"Error adding task: {str(e)}"

class QueryTasksTool(BaseTool):
    name: str = "Query Tasks Tool"
    description: str = (
        "This tool allows you to retrieve tasks from your task management system based on various filtering criteria. "
        "You can filter tasks using fields such as 'status' (options are 'completed', 'pending', or 'overdue'), 'title', 'description', 'type', 'priority', and 'progress'. "
        "For 'title' and 'description', you can use regular expressions to perform flexible and pattern-based searches, making it easier to find tasks that contain certain keywords or match specific patterns. "
        "To use this tool, provide a dictionary with your desired search parameters. "
        "For example: `{'status': 'pending'}` will return all tasks that are currently pending, while `{'title': 'Math', 'status': 'overdue'}` will return tasks that have 'Math' in their title and are overdue. "
        "This tool is particularly useful for managing your tasks by allowing you to focus on specific subsets based on your current needs or priorities."
    )

    def _run(self, search_params: dict | List[dict], getObjectID: bool = False) -> List[dict]:
        try:
            if isinstance(search_params, list):
                search_params = search_params[0]
            is_valid, message = validate_search_params(search_params)
            if not is_valid:
                return [{"error": message}]

            query = {}
            current_time = datetime.now()
            datetime_conversion = lambda x: datetime.fromisoformat(x.replace('Z', '+00:00')).replace(tzinfo=None)

            # Status-based filtering
            if 'status' in search_params:
                status = search_params['status'].lower()
                if status == 'completed':
                    query['completed'] = True
                elif status == 'pending':
                    query['completed'] = False
                    query['dueDate'] = {'$gt': current_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')}
                elif status == 'overdue':
                    query['completed'] = False
                    query['dueDate'] = {'$lt': current_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')}

            # Title/description filtering
            if 'title' in search_params:
                query['title'] = {'$regex': search_params['title'], '$options': 'i'}
            if 'description' in search_params:
                query['description'] = {'$regex': search_params['description'], '$options': 'i'}

            # Execute query with sorting
            tasks = list(tasks_collection.find(query).sort('dueDate', 1))
            
            if not tasks:
                return [{"message": f"No tasks found matching the criteria: {search_params}"}]
                
            # Enhance task information
            for task in tasks:
                # Convert dueDate string to datetime for comparison
                task_due_date = datetime_conversion(task['dueDate'])
                
                if not task.get('completed', False):
                    if task_due_date < current_time:
                        task['status'] = 'overdue'
                    else:
                        task['status'] = 'pending'
                else:
                    task['status'] = 'completed'
                if not getObjectID:
                    task.pop('_id', None)
            
            # Add statistics
            stats = {
                "total_retrived_tasks": len(tasks),
                "completed_tasks_in_retrived": len([t for t in tasks if t.get('completed', False)]),
                "pending_tasks_in_retrived": len([t for t in tasks if not t.get('completed', False) and datetime_conversion(t['dueDate']) >= current_time]),
                "overdue_tasks_in_retrived": len([t for t in tasks if not t.get('completed', False) and datetime_conversion(t['dueDate']) < current_time])
            }

            return [stats] + tasks if tasks else [{"message": "No tasks found."}]
        except Exception as e:
            return [{"error": f"Error querying tasks: {str(e)}"}]

class UpdateTaskTool(BaseTool):
    name: str = "Update Task Tool"
    description: str = (
        "This tool enables you to update existing tasks by specifying search parameters to identify the tasks and providing the new values for the fields you want to update. "
        "You can use regular expressions in 'search_params' to match tasks based on 'title' or 'description', allowing for flexible and broad identification of tasks. "
        "The 'updates' parameter should be a dictionary containing the fields you wish to change, such as 'progress', 'dueDate', 'priority', or 'completed' status. "
        "For example, you might input: "
        "`search_params={'title': 'Math Homework'}, updates={'progress': 50, 'completed': False}`. "
        "This will find all tasks with 'Math Homework' in the title and update their progress to 50% and mark them as not completed. "
        "Ensure that the fields you're updating are valid and the new values are correctly formatted to prevent errors. "
        "This tool is essential for keeping your task information up-to-date and reflecting the current state of your tasks."
    )

    def _run(self, search_params: dict | List[dict], updates: dict, getObjectID: bool = False) -> str:
        # try:
            # Validate search parameters
            if isinstance(search_params, list):
                search_params = search_params[0]
            is_valid, message = validate_search_params(search_params)
            if not is_valid:
                return f"Error in search parameters: {message}"

            # Validate update data
            is_valid, message, validated_updates = validate_update_task_data(updates)
            if not is_valid:
                return f"Error in update data: {message}"

            # Use regex search on 'title' or 'description'
            query = {}
            if 'title' in search_params:
                query['title'] = {'$regex': search_params['title'], '$options': 'i'}
            if 'description' in search_params:
                query['description'] = {'$regex': search_params['description'], '$options': 'i'}

            tasks = list(tasks_collection.find(query))
            if not tasks:
                return "No matching tasks found."

            # Update matching tasks
            result = tasks_collection.update_many(query, {'$set': validated_updates})
            return f"Updated {result.modified_count} task(s) successfully."
        # except Exception as e:
            # return f"Error updating tasks: {str(e)}"

class DeleteTaskTool(BaseTool):
    name: str = "Delete Task Tool"
    description: str = (
        "Use this tool to permanently delete tasks from your task management system by matching titles or descriptions using regular expressions. "
        "Provide a dictionary with keys like 'title' or 'description' to specify which tasks you want to remove. "
        "For example, `{'title': 'Old Task'}` will delete all tasks whose titles match 'Old Task'. "
        "Since deletions cannot be undone, it's important to use this tool carefully and ensure that your search parameters accurately target only the tasks you intend to delete. "
        "It's advisable to double-check the list of tasks that match your criteria before proceeding with the deletion. "
        "This tool helps in maintaining your task list by removing tasks that are no longer relevant or needed, keeping your task management system organized and current."
    )

    def _run(self, search_params: dict | List[dict], getObjectID: bool = False) -> str:
        # try:
            if isinstance(search_params, list):
                search_params = search_params[0]
            is_valid, message = validate_search_params(search_params)
            if not is_valid:
                return f"Error: {message}"

            # Use regex search on 'title' or 'description'
            query = {}
            if 'title' in search_params:
                query['title'] = {'$regex': search_params['title'], '$options': 'i'}
            if 'description' in search_params:
                query['description'] = {'$regex': search_params['description'], '$options': 'i'}

            tasks = list(tasks_collection.find(query))
            if not tasks:
                return "No matching tasks found."

            # Delete matching tasks
            result = tasks_collection.delete_many(query)
            return f"Deleted {result.deleted_count} task(s) successfully."
        # except Exception as e:
            # return f"Error deleting tasks: {str(e)}"

class GetAllTasksTool(BaseTool):
    name: str = "Get All Tasks Tool"
    description: str = (
        "This tool allows you to retrieve all tasks from your task management system or to search for specific tasks using a query string. "
        "If you provide a query, the tool searches the 'title' and 'description' fields using regular expression matching to find tasks containing the query string. "
        "For example, `{'query': 'Exam'}` returns all tasks with 'Exam' in the title or description. "
        "If no input is provided, it will return all tasks currently stored in the system. "
        "In addition, the tool provides statistics such as the total number of tasks, and counts of completed, pending, and overdue tasks to give you an overview of your workload. "
        "This is particularly useful for reviewing all your tasks at once or for finding all tasks related to a specific subject or keyword. "
        "By using this tool, you can effectively manage and prioritize your tasks based on their status and relevance."
    )

    def _run(self, query: str = "", getObjectID: bool = False) -> List[dict]:
        try:
            # Validate query if provided
            if query and not isinstance(query, str):
                return [{"error": "Query must be a string"}]

            if query:
                query_filter = {
                    "$or": [
                        {"title": {"$regex": query, "$options": "i"}},
                        {"description": {"$regex": query, "$options": "i"}}
                    ]
                }
                tasks = list(tasks_collection.find(query_filter))
            else:
                tasks = list(tasks_collection.find({}))

            datetime_conversion = lambda x: datetime.fromisoformat(x.replace('Z', '+00:00')).replace(tzinfo=None)
            
            stats = {
                "total_tasks": len(tasks),
                "completed_tasks": len([t for t in tasks if t.get('completed', False)]),
                "pending_tasks": len([t for t in tasks if not t.get('completed', False) and datetime_conversion(t['dueDate']) >= datetime.now()]),
                "overdue_tasks": len([t for t in tasks if not t.get('completed', False) and datetime_conversion(t['dueDate']) < datetime.now()])
            }

            for task in tasks:
                task['dueDate'] = datetime_conversion(task['dueDate']).strftime('%Y-%m-%dT%H:%M:%S.%fZ')
                if not getObjectID:
                    task.pop('_id', None)

            return [stats] + tasks if tasks else [{"message": "No tasks found."}]
        except Exception as e:
            return [{"error": f"Error retrieving tasks: {str(e)}"}]

# Example of a custom tool
class MyCustomTool(BaseTool):
    name: str = "Name of my tool"
    description: str = (
        "Clear description for what this tool is useful for, including support for regex and dynamic input. "
        "Enables flexible operations based on varying user inputs and patterns."
    )

    def _run(self, argument: str) -> str:
        # Implementation goes here
        return "this is an example of a tool output, ignore it and move along."
