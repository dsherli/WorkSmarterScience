# OpenAI Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Work Smarter Science                         │
│                     Educational Platform Stack                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│                      │      │                      │      │                      │
│   React Frontend     │─────▶│   Django Backend     │─────▶│    OpenAI API        │
│   (Port 5173)        │      │   (Port 8000)        │      │    or Azure OpenAI   │
│                      │◀─────│                      │◀─────│                      │
└──────────────────────┘      └──────────────────────┘      └──────────────────────┘
         │                              │
         │                              │
         ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│   React Hooks        │      │   AI Service Layer   │
│  - useEvaluateWork   │      │  - OpenAI Client     │
│  - useChatCompletion │      │  - Azure Client      │
│  - useFeedback       │      │  - Auto-detection    │
│  - useAIHealth       │      │  - Error handling    │
└──────────────────────┘      └──────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│   aiService.ts       │      │   grading/views.py   │
│  - CSRF handling     │      │  - Authentication    │
│  - Auth cookies      │      │  - Validation        │
│  - Type safety       │      │  - Logging           │
└──────────────────────┘      └──────────────────────┘
                                       │
                                       ▼
                              ┌──────────────────────┐
                              │   PostgreSQL DB      │
                              │  (Neon Cloud)        │
                              │  - GradingSession    │
                              │  - Usage tracking    │
                              │  - Audit logs        │
                              └──────────────────────┘
```

## Request Flow

### Example: Evaluating Student Work

```
1. User Action
   └─ Student submits answer in React component
      Component calls: evaluate({ question, student_answer, rubric })

2. Frontend Hook (useEvaluateWork)
   └─ Sets loading state
   └─ Calls aiService.evaluateWork()

3. Frontend Service (aiService.ts)
   └─ Gets CSRF token from cookies
   └─ Fetches POST /api/grading/evaluate/
   └─ Includes credentials for authentication

4. Django Middleware
   └─ CORS check (allow localhost:5173)
   └─ CSRF validation
   └─ Authentication check (IsAuthenticated)

5. Django View (views.py)
   └─ Validates request data (EvaluateWorkSerializer)
   └─ Calls get_ai_service()

6. AI Service Layer (ai_service.py)
   └─ Checks if Azure OpenAI configured → Use Azure
   └─ Else checks if OpenAI key → Use OpenAI
   └─ Constructs prompt with rubric and context
   └─ Calls OpenAI chat.completions.create()

7. OpenAI/Azure API
   └─ Processes request with GPT-4
   └─ Returns evaluation with score and feedback

8. Django View
   └─ Logs to GradingSession model (user, activity, tokens, etc.)
   └─ Returns JSON response

9. Frontend Service
   └─ Parses response
   └─ Returns to hook

10. React Hook
    └─ Updates state with evaluation data
    └─ Component re-renders with result
```

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                          Frontend                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Component State                                               │
│  ┌──────────────────────────────────────┐                    │
│  │ { data, loading, error }             │                    │
│  └──────────────────────────────────────┘                    │
│                    │                                           │
│                    ▼                                           │
│  React Hook (useEvaluateWork)                                 │
│  ┌──────────────────────────────────────┐                    │
│  │ evaluate({ question, answer })       │                    │
│  └──────────────────────────────────────┘                    │
│                    │                                           │
│                    ▼                                           │
│  Service (aiService.ts)                                       │
│  ┌──────────────────────────────────────┐                    │
│  │ fetch('/api/grading/evaluate/', {    │                    │
│  │   method: 'POST',                     │                    │
│  │   body: JSON.stringify(request),      │                    │
│  │   credentials: 'include',             │                    │
│  │   headers: { 'X-CSRFToken': token }   │                    │
│  │ })                                    │                    │
│  └──────────────────────────────────────┘                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Request
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                          Backend                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  URL Routing                                                   │
│  ┌──────────────────────────────────────┐                    │
│  │ /api/grading/evaluate/               │                    │
│  └──────────────────────────────────────┘                    │
│                    │                                           │
│                    ▼                                           │
│  View (grading/views.py)                                      │
│  ┌──────────────────────────────────────┐                    │
│  │ @api_view(['POST'])                   │                    │
│  │ @permission_classes([IsAuthenticated])│                    │
│  │ def evaluate_work(request):           │                    │
│  └──────────────────────────────────────┘                    │
│                    │                                           │
│                    ▼                                           │
│  Serializer Validation                                         │
│  ┌──────────────────────────────────────┐                    │
│  │ EvaluateWorkSerializer.is_valid()    │                    │
│  └──────────────────────────────────────┘                    │
│                    │                                           │
│                    ▼                                           │
│  AI Service (grading/ai_service.py)                           │
│  ┌──────────────────────────────────────┐                    │
│  │ AIService.evaluate_student_work()    │                    │
│  │   ├─ Build prompt with rubric        │                    │
│  │   ├─ Call OpenAI API                 │                    │
│  │   └─ Parse response                   │                    │
│  └──────────────────────────────────────┘                    │
│                    │                                           │
│                    ▼                                           │
│  Database Logging                                              │
│  ┌──────────────────────────────────────┐                    │
│  │ GradingSession.objects.create({      │                    │
│  │   user, activity_id, prompt,         │                    │
│  │   response, model, tokens            │                    │
│  │ })                                    │                    │
│  └──────────────────────────────────────┘                    │
│                    │                                           │
│                    ▼                                           │
│  Response                                                      │
│  ┌──────────────────────────────────────┐                    │
│  │ { evaluation, model, tokens_used }   │                    │
│  └──────────────────────────────────────┘                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ JSON Response
                              ▼
                     Frontend displays result
```

## Security Layers

```
┌────────────────────────────────────────────────────────────────┐
│                      Security Measures                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. API Key Protection                                         │
│     ✓ Keys stored in .env (server-side only)                  │
│     ✓ Never exposed to frontend/browser                       │
│     ✓ Not in git (.gitignore)                                 │
│                                                                │
│  2. Authentication                                              │
│     ✓ All endpoints require IsAuthenticated                   │
│     ✓ Session-based auth with cookies                         │
│     ✓ User must log in before accessing AI features           │
│                                                                │
│  3. CSRF Protection                                            │
│     ✓ X-CSRFToken header required on POST                     │
│     ✓ Token validation in Django middleware                   │
│     ✓ Prevents cross-site request forgery                     │
│                                                                │
│  4. CORS Configuration                                         │
│     ✓ CORS_ALLOWED_ORIGINS limits access                      │
│     ✓ CORS_ALLOW_CREDENTIALS = True                           │
│     ✓ Only localhost:5173 allowed in dev                      │
│                                                                │
│  5. Input Validation                                           │
│     ✓ DRF serializers validate all requests                   │
│     ✓ Type checking on frontend (TypeScript)                  │
│     ✓ SQL injection prevention (Django ORM)                   │
│                                                                │
│  6. Audit Trail                                                │
│     ✓ All AI requests logged to database                      │
│     ✓ User, timestamp, tokens tracked                         │
│     ✓ Admin interface for monitoring                          │
│                                                                │
│  7. Error Handling                                             │
│     ✓ No sensitive data in error messages                     │
│     ✓ Graceful degradation if AI unavailable                  │
│     ✓ Rate limiting recommended for production                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Configuration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Configuration Priority                    │
└─────────────────────────────────────────────────────────────┘

1. Check for Azure OpenAI credentials
   ├─ AZURE_OPENAI_ENDPOINT set?
   └─ AZURE_OPENAI_API_KEY set?
         │
         ├─ YES → Use Azure OpenAI
         │        └─ Model: AZURE_OPENAI_DEPLOYMENT (default: gpt-4)
         │
         └─ NO → Check for standard OpenAI
                  │
                  ├─ OPENAI_API_KEY set?
                  │     │
                  │     ├─ YES → Use OpenAI
                  │     │        └─ Model: OPENAI_MODEL (default: gpt-4)
                  │     │
                  │     └─ NO → AI service not configured
                  │              └─ Return 503 Service Unavailable
                  │
                  └─ Health check returns: { configured: false }
```

## File Organization

```
WorkSmarterScience/
├── .env                           ← API keys (you create, not in git)
├── .env.example                   ← Template with all options
├── setup-openai.ps1               ← Quick setup script
│
├── code/
│   ├── backend/
│   │   ├── requirements.txt       ← Updated with openai
│   │   │
│   │   ├── api/
│   │   │   ├── settings.py        ← OpenAI config variables
│   │   │   └── urls.py            ← Mounts /api/grading/
│   │   │
│   │   └── grading/               ← New Django app
│   │       ├── __init__.py
│   │       ├── apps.py
│   │       ├── models.py          ← GradingSession model
│   │       ├── admin.py           ← Admin config
│   │       ├── serializers.py     ← Request/response validation
│   │       ├── views.py           ← API endpoints
│   │       ├── urls.py            ← URL routing
│   │       ├── ai_service.py      ← Core AI logic
│   │       └── migrations/
│   │           └── 0001_initial.py
│   │
│   └── frontend/
│       └── src/
│           ├── services/
│           │   └── aiService.ts   ← API client
│           │
│           ├── hooks/
│           │   └── useAI.ts       ← React hooks
│           │
│           └── components/
│               └── AIExample.tsx  ← Demo component
│
└── docs/
    ├── OPENAI_INTEGRATION.md      ← Full guide
    ├── OPENAI_SUMMARY.md          ← Quick reference
    └── OPENAI_ARCHITECTURE.md     ← This file
```

## API Endpoint Map

```
Base URL: http://localhost:8000/api/grading/

GET  /health/      → Check AI service status
                     ├─ Returns: { configured, model, service }
                     └─ Auth: Not required

POST /evaluate/    → Grade student work
                     ├─ Request: { question, student_answer, rubric, context }
                     └─ Response: { evaluation, model, tokens_used }

POST /chat/        → General chat completion
                     ├─ Request: { messages[], temperature, max_tokens }
                     └─ Response: { content, model, tokens_used, finish_reason }

POST /feedback/    → Educational assistance
                     ├─ Request: { prompt, context, temperature }
                     └─ Response: { feedback, model, tokens_used }

All POST endpoints require:
  ✓ Authentication (session cookie)
  ✓ CSRF token in X-CSRFToken header
  ✓ Content-Type: application/json
```

## Database Schema

```sql
Table: grading_gradingsession

┌──────────────┬────────────────┬──────────────────────────────────┐
│   Column     │     Type       │         Description              │
├──────────────┼────────────────┼──────────────────────────────────┤
│ id           │ INTEGER        │ Primary key                      │
│ user_id      │ INTEGER        │ FK to auth_user (nullable)       │
│ activity_id  │ INTEGER        │ Related activity (nullable)      │
│ prompt       │ TEXT           │ User's input/question            │
│ response     │ TEXT           │ AI's output                      │
│ model_used   │ VARCHAR(100)   │ gpt-4, gpt-3.5-turbo, etc.      │
│ tokens_used  │ INTEGER        │ Total tokens consumed            │
│ created_at   │ DATETIME       │ Timestamp                        │
└──────────────┴────────────────┴──────────────────────────────────┘

Indexes:
  - user_id (for user-specific queries)
  - created_at (for time-based queries)
  - activity_id (for activity analytics)

Typical queries:
  - Usage by user: SELECT SUM(tokens_used) WHERE user_id = ?
  - Recent sessions: SELECT * ORDER BY created_at DESC LIMIT 50
  - Cost estimation: COUNT(*) * avg_cost_per_request
```

## Error Handling Flow

```
Frontend Request
       │
       ▼
┌─────────────────────────────────────────┐
│  Try to call API endpoint               │
└─────────────────────────────────────────┘
       │
       ├─ Success → Return data to component
       │
       └─ Error
             │
             ├─ 401 Unauthorized
             │    └─ Redirect to login
             │
             ├─ 403 Forbidden (CSRF fail)
             │    └─ Refresh page / Get new CSRF token
             │
             ├─ 503 Service Unavailable
             │    └─ "AI service not configured"
             │        Show setup instructions
             │
             ├─ 500 Internal Server Error
             │    └─ Log error, show generic message
             │
             └─ Network error
                  └─ "Connection failed, check backend"
```

---

**Architecture Status: ✅ Complete**

This architecture provides a secure, scalable foundation for AI-powered educational features with proper separation of concerns, comprehensive logging, and production-ready security measures.
