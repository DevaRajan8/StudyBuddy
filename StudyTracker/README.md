# Student AI Assistant

This is a React-based app for student productivity and study management. The app features a modular page layout and interactive widgets, using Shadcn for dynamic UI. The backend is connected via Flask API. In the Python backend, LangGraph and CrewAI are running, representing a group of personalized agents for the student.

---

## Features

- **Task Management**: Add tasks through the assistant, and view them in a dynamic calendar widget.
- **Interactive Widgets**: Access a modular interface with widgets for specific functionalities like scheduling, study tracking, and reminders.
- **Real-time Notifications**: Receive reminders and notifications for tasks directly within the app to stay organized.
- **Responsive Design**: User-friendly layout compatible with mobile and desktop.
  
---

## Tech Stack

- **Frontend**: React, Shadcn for UI components
- **Backend**: Flask (Python) for managing AI logic and responding to frontend requests
- **Communication**: Axios to handle API requests between React frontend and Flask backend
- **AI Integration**: LangGraph with CrewAI for routing and task management

---

## Getting Started

### Prerequisites

- Node.js
- Python 3.x
- Flask (`pip install Flask`)
- CORS package (`pip install flask-cors`)
- Axios (`npm install axios`)

### Installation

I'm working to dockerize the app for easier setup. For now, follow these steps:

1. Clone the Frontend and Backend repositories.
2. Run the Flask backend server.
3. Start the React frontend server.
4. Start MongoDB.

---

## Usage

- Open the app in your browser (typically at `http://localhost:3000`).
- Type your message in the input box, and the assistant will respond based on AI-driven logic.
- Manage and track tasks using the calendar widget, view reminders, and interact with the assistant's modular widgets.

---

## Roadmap

- **Enhanced AI Capabilities**: Implement advanced AI models for personalized study recommendations.
- **Collaboration Tools**: Add features for group study sessions and peer-to-peer interaction.
- **Mobile Application**: Develop native mobile apps for iOS and Android platforms.
- **Voice Integration**: Allow users to interact using voice commands for hands-free operation.
- **Cloud Synchronization**: Enable data sync across multiple devices using cloud services.
- **Third-party Integrations**: Integrate with tools like Google Calendar, Trello, or Evernote for seamless workflow management.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/newFeature`).
3. Commit your changes (`git commit -m 'Add a new feature'`).
4. Push to the branch (`git push origin feature/newFeature`).
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License.

---
