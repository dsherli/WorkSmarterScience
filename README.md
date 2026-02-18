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
- **asgiref 3.10.0** - ASGI reference implementation for async support
- **sqlparse 0.5.3** - SQL parsing utilities for Django

**Frontend (React):**
- **React 19.1.1** - Core UI library for building the user interface
- **TypeScript 5.9.3** - Type-safe JavaScript for better development experience
- **Vite 7.1.7** - Fast build tool and development server
- **Tailwind CSS 4.1.14** - Utility-first CSS framework for styling
- **ESLint 9.36.0** - Code linting and formatting
- **Autoprefixer 10.4.21** - Automatic vendor prefixing for CSS

## Installation Steps

### With Docker

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dsherli/WorkSmarterScience.git
   cd WorkSmarterScience
   ```

2. **Build with Docker**
   ```bash
   docker compose build
   docker compose up
   ```


### Without Docker

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
- We are using a Neon DB for our configuiration
- CORS is configured to allow all origins in development (will need to be tightened for production)
- Both servers need to run simultaneously for full functionality
- Frontend hot-reloads automatically when you make changes


## Functionality

**Current Status: Core Features Implemented (Sprint 4)**

The platform now delivers a fully functional learning environment with AI-powered features for both teachers and students.

### Teacher Features
- **Classroom Management** — Create, edit, and delete classrooms; share join codes; view enrolled students
- **Activity Library** — Browse and assign NGSS-aligned science activities to classrooms
- **AI-Powered Grading** — Rubric-based automated grading with OpenAI integration; teachers can review, edit, and finalize AI-generated scores and feedback
- **Rubric Builder** — Create, import, and map rubrics to activities for consistent evaluation
- **Announcements** — Create, edit, and delete announcements with file attachments within classrooms
- **Group Discussion System** — Organize students into table groups, generate AI-driven discussion questions, review/edit questions for quality control, and release them to students
- **AI Assistant** — Contextual AI-powered chat for teacher guidance on the dashboard
- **AI Insight** — AI-generated analytics and observations on student performance
- **Student Management** — View enrolled students, monitor roster status, and manage classroom membership

### Student Features
- **Dashboard** — View assigned activities, class membership, and progress summaries
- **Class Join Flow** — Join classrooms via invite codes
- **Activity Submission** — Preview full task context with reference media and submit responses
- **Group Discussion** — View AI-generated discussion prompts and respond within assigned groups
- **Notification System** — Badge indicators for new activity and announcements

### Infrastructure
- **JWT Authentication** — Role-aware login and registration for teachers and students
- **REST API** — Django REST Framework backend with full CRUD endpoints
- **Docker Support** — Docker Compose stack for the full development environment
- **Django Admin Interface** — Available at `http://localhost:8000/admin/` for database management
- **Hot-Reloading Frontend** — React + TypeScript + Tailwind CSS with Vite dev server


## Known Problems

- **Multi-agent discussion system** — Experimental branch exploring heterogeneous and cognitive conflict approaches; not yet merged into main
- **Deployment** — Trusted origins configured, but full production deployment pipeline is not yet finalized
- **AI guardrails** — AI grading and assistant features need additional safety checks and input validation before production release
- **Test coverage** — Automated tests for the grading and group discussion APIs are minimal and need expansion
- **AI Insight & AI Assistant** — Partially implemented; need further polish and deeper integration with grading data


## Contributing

TODO: Leave the steps below if you want others to contribute to your project.

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Additional Documentation

[Docs folder](docs)

[Sprint 4 Report](docs/Reports/sprint4_report.md)

[Frontend README](code/frontend/README.md)

[Backend Requirements](code/backend/requirements.txt)

[OpenAI Integration Guide](docs/OPENAI_INTEGRATION.md)

[Architecture Overview](docs/ARCHITECTURE.md)

## License
[View License](LICENSE.txt)
