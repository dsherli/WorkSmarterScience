# Work Smarter Science

## Project summary

### One-sentence description of the project

A standalone learning platform with a built-in Virtual Teaching Assistant that ingests course materials to deliver instant, context-aware answers for students, facilitate group discussions, and give privacy-respecting analytics for instructors, purpose-built for classrooms.

### Additional information about the project

The Work Smarter Science project aims to reimagine digital learning by creating an all-in-one educational ecosystem as a self-contained platform for both students and instructors. VTA provides intelligent, real-time academic assistance using assesment materials, offering students instant feedback and clarification while maintaining academic integrity.

Instructors can manage assements, view analytics, and monitor student progress through a streamlined interface. The system emphasizes inclusivity, engagement, and scalability, supporting large classrooms without sacrificing individualized learning experiences.

## Installation

### Prerequisites

Before installing and running this project, ensure you have the following installed on your system:

- **Git** - For version control and cloning the repository
- **Python 3.8+** - For the Django backend (check with `python --version`)
- **Node.js 18+** - For the React frontend (check with `node --version`)
- **npm or yarn** - Package manager for Node.js (comes with Node.js)
- **pip** - Python package installer (usually comes with Python) 

### Add-ons

This project includes the following key packages and their purposes:

**Backend (Django):**
- **Django 5.2.7** - Core web framework for the API backend
- **Django REST Framework 3.16.1** - Provides RESTful API functionality and serialization
- **django-cors-headers 4.9.0** - Enables Cross-Origin Resource Sharing for frontend-backend communication
- **OpenAI 1.54.3** - AI integration for grading and educational assistance
- **asgiref 3.10.0** - ASGI reference implementation for async support
- **sqlparse 0.5.3** - SQL parsing utilities for Django

**Frontend (React):**
- **React 19.1.1** - Core UI library for building the user interface
- **TypeScript 5.9.3** - Type-safe JavaScript for better development experience
- **Vite 7.1.7** - Fast build tool and development server
- **Tailwind CSS 4.1.14** - Utility-first CSS framework for styling
- **ESLint 9.36.0** - Code linting and formatting
- **Autoprefixer 10.4.21** - Automatic vendor prefixing for CSS

### Installation Steps

Follow these steps to set up and run the Virtual Teaching Assistant project:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dsherli/WorkSmarterScience.git
   cd WorkSmarterScience
   ```

2. **Set up the Django backend:**
   ```bash
   cd code/backend

   # Create virtual environment if it doesn't exist
   python -m venv .venv
   source .venv/bin/activate

   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```
   The backend will be available at `http://localhost:8000`

3. **Set up the React frontend (in a new terminal):**
   ```bash
   cd code/frontend
   npm install
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

4. **Build Tailwind CSS (optional, for production):**
   ```bash
   cd code/frontend
   npm run css:build
   ```

**Development Notes:**
- The backend uses SQLite database by default (no additional setup required)
- CORS is configured to allow all origins in development (will need to be tightened for production)
- Both servers need to run simultaneously for full functionality
- Frontend hot-reloads automatically when you make changes 


## Functionality

**Current Status: Foundation Complete + AI Integration Active**

The project provides a solid foundation with OpenAI-powered features for educational assessment and assistance.

### Available Now
- **Backend API Health Check**: `GET /api/health/` returns server status
- **Django Admin Interface**: Available at `http://localhost:8000/admin/` for database management
- **React Development Environment**: Hot-reloading frontend with TypeScript and Tailwind CSS
- **CORS Configuration**: Backend configured to accept requests from frontend development server
- **🆕 AI-Powered Grading**: Evaluate student work with customizable rubrics via OpenAI/Azure OpenAI
- **🆕 Educational Feedback**: Generate hints and explanations without giving away answers
- **🆕 Chat Completions**: Build interactive tutoring experiences
- **🆕 Usage Tracking**: All AI interactions logged for analytics and audit

### AI Integration Features
- **Endpoints**: `/api/grading/evaluate/`, `/api/grading/chat/`, `/api/grading/feedback/`
- **Security**: API keys server-side only, authentication required, CSRF protection
- **Flexibility**: Supports both standard OpenAI and Azure OpenAI
- **Monitoring**: Full audit trail with token usage tracking in Django admin

See [OpenAI Integration Guide](docs/OPENAI_INTEGRATION.md) for detailed setup and usage.

## Known Problems

- **Missing Key Features**: Student accounts/views and teacher dashboards need implementation
- **AI Features**: Integration complete but not yet connected to assessment UI flows 


## Contributing

TODO: Leave the steps below if you want others to contribute to your project.

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Additional Documentation

[Docs folder](docs)

**OpenAI Integration:**
- [OpenAI Integration Guide](docs/OPENAI_INTEGRATION.md) - Complete setup and usage
- [Integration Summary](docs/OPENAI_SUMMARY.md) - Quick overview of what was added

**Project Docs:**
- [Frontend README](code\frontend\README.md)
- [Backend Requirements](code/backend/requirements.txt)

## License
[View License](LICENSE.txt)

