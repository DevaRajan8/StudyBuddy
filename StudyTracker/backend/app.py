from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from uuid import uuid4
from datetime import datetime, timedelta
from GraphAgent import WorkFlow
from typing import Dict, List
import random
from langchain_core.messages import HumanMessage
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins="*")
app.config['CORS_HEADERS'] = 'Content-Type'

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/studytracker'))
db = client.studytracker
chats_collection = db.chats

# Create a single global workflow instance
global_workflow = WorkFlow()

class ChatStorage:
    @staticmethod
    def create_chat(title: str) -> dict:
        chat_id = str(uuid4())
        chat = {
            'id': chat_id,
            'title': title,
            'messages': [],
            'created_at': datetime.now()
        }
        chats_collection.insert_one(chat)
        return chat

    @staticmethod
    def get_chat(chat_id: str) -> dict:
        return chats_collection.find_one({'id': chat_id}, {'_id': 0})

    @staticmethod
    def get_all_chats() -> List[dict]:
        return list(chats_collection.find({}, {'_id': 0}))

    @staticmethod
    def add_message(chat_id: str, message: dict) -> None:
        chats_collection.update_one(
            {'id': chat_id},
            {'$push': {'messages': message}}
        )

    @staticmethod
    def clear_chat(chat_id: str) -> None:
        chats_collection.update_one(
            {'id': chat_id},
            {'$set': {'messages': []}}
        )
        global_workflow.clear()  # Clear the workflow state

    @staticmethod
    def delete_chat(chat_id: str) -> bool:
        result = chats_collection.delete_one({'id': chat_id})
        return result.deleted_count > 0

    @staticmethod
    def update_chat_title(chat_id: str, new_title: str) -> dict:
        chats_collection.update_one(
            {'id': chat_id},
            {'$set': {'title': new_title}}
        )
        return ChatStorage.get_chat(chat_id)

# Update route handlers to use the new MongoDB-based ChatStorage
@app.route('/chats', methods=['GET'])
def get_chats():
    """Get all chats"""
    return jsonify(ChatStorage.get_all_chats())


@app.route('/chats', methods=['POST'])
def create_chat():
    """Create a new chat"""
    data = request.get_json()
    title = data.get('title', 'New Chat')
    chat = ChatStorage.create_chat(title)
    return jsonify(chat)


@app.route('/chats/<chat_id>', methods=['GET'])
def get_chat(chat_id):
    """Get a specific chat"""
    chat = ChatStorage.get_chat(chat_id)
    if chat is None:
        return jsonify({'error': 'Chat not found'}), 404
    print('Return Chat:', chat)
    return jsonify(chat)


@app.route('/chats/<chat_id>/messages', methods=['POST'])
def send_message(chat_id):
    """Send a message in a specific chat"""
    chat = ChatStorage.get_chat(chat_id)
    if chat is None:
        return jsonify({'error': 'Chat not found'}), 404

    data = request.get_json()
    print(data)
    user_message = data.get('content')

    if not user_message:
        return jsonify({'error': 'Message content is required'}), 400

    # Handle special commands
    if user_message.startswith('/'):
        if user_message == '/clear':
            ChatStorage.clear_chat(chat_id)
            return jsonify({
                'id': str(uuid4()),
                'role': 'assistant',
                'content': 'Chat history cleared.'
            })
        return jsonify({
            'id': str(uuid4()),
            'role': 'assistant',
            'content': 'Command not recognized.'
        })

    # Set the chat history for the global workflow
    global_workflow.set_chat_history(chat.get('messages', []))

    try:
        # Process message using the global workflow
        user_message_obj = HumanMessage(content=user_message)
        response = global_workflow.invoke(user_message_obj)
        
        ai_message = {
            'id': str(uuid4()),
            'role': 'assistant',
            'content': response['messages'][-1].content
        }
        
        # Store messages in MongoDB
        ChatStorage.add_message(chat_id, {
            'id': str(uuid4()),
            'role': 'user',
            'content': user_message
        })
        ChatStorage.add_message(chat_id, ai_message)
        
        return jsonify(ai_message)
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        return jsonify({'error': f'Error processing message: {str(e)}'}), 500


@app.route('/chats/<chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    """Delete a specific chat"""
    if ChatStorage.delete_chat(chat_id):
        return jsonify({'message': 'Chat deleted successfully'})
    return jsonify({'error': 'Chat not found'}), 404


@app.route('/chats/<chat_id>/title', methods=['PATCH'])
def update_chat_title(chat_id):
    """Update chat title"""
    chat = ChatStorage.get_chat(chat_id)
    if chat is None:
        return jsonify({'error': 'Chat not found'}), 404

    data = request.get_json()
    new_title = data.get('title')
    if not new_title:
        return jsonify({'error': 'Title is required'}), 400

    chat = ChatStorage.update_chat_title(chat_id, new_title)
    return jsonify(chat)


@app.route('/performance', methods=['GET'])
def get_performance():
    # Generate mock data for demonstration
    performance_data = {
        'overallProgress': random.randint(60, 95),
        'studyHours': random.randint(20, 40),
        'tasksCompleted': random.randint(10, 30),
        'averageGrade': round(random.uniform(70, 95), 2),
        'streak': random.randint(1, 14),
        'focusScore': random.randint(60, 100),
        'upcomingDeadlines': [
            {'task': 'Math Assignment', 'date': (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')},
            {'task': 'History Essay', 'date': (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d')},
            {'task': 'Science Project', 'date': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')},
        ],
        'recentAchievements': [
            'Completed 7-day study streak',
            'Improved average grade by 5%',
            'Finished all tasks for the week',
        ],
        'subjectPerformance': [
            {'subject': 'Math', 'score': random.randint(70, 100)},
            {'subject': 'Science', 'score': random.randint(70, 100)},
            {'subject': 'History', 'score': random.randint(70, 100)},
            {'subject': 'English', 'score': random.randint(70, 100)},
            {'subject': 'Art', 'score': random.randint(70, 100)},
        ],
        'weeklyStudyHours': [
            {'day': 'Mon', 'hours': random.randint(1, 6)},
            {'day': 'Tue', 'hours': random.randint(1, 6)},
            {'day': 'Wed', 'hours': random.randint(1, 6)},
            {'day': 'Thu', 'hours': random.randint(1, 6)},
            {'day': 'Fri', 'hours': random.randint(1, 6)},
            {'day': 'Sat', 'hours': random.randint(1, 6)},
            {'day': 'Sun', 'hours': random.randint(1, 6)},
        ],
    }
    return jsonify(performance_data)


if __name__ == '__main__':
    app.run(debug=True)
