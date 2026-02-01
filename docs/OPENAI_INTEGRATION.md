# OpenAI Integration Guide

## Overview

This project integrates OpenAI's API (or Azure OpenAI) to power AI-assisted grading, feedback, and educational assistance. The integration follows a secure backend-proxy pattern where all API keys are kept server-side.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   React     │─────▶│   Django    │─────▶│ OpenAI API   │
│  Frontend   │      │   Backend   │      │ (or Azure)   │
└─────────────┘      └─────────────┘      └──────────────┘
     Hooks              Endpoints          AI Service
```

- **Frontend**: React hooks and services for making requests
- **Backend**: Django REST endpoints that proxy requests to OpenAI
- **AI Service**: Python service layer that handles OpenAI/Azure OpenAI clients

## Setup

### 1. Install Backend Dependencies

```powershell
cd code\backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

This installs `openai==1.54.3` along with other dependencies.

### 2. Configure API Keys

Create a `.env` file in the project root (copy from `.env.example`):

**Option A: Standard OpenAI**
```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5
```

Get your API key from: https://platform.openai.com/api-keys

**Option B: Azure OpenAI** (takes precedence if set)
```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-key-here
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-5
```

Get credentials from Azure Portal → Azure OpenAI Service

### 3. Run Migrations

```powershell
cd code\backend
python manage.py migrate
```

This creates the `grading_gradingsession` table for tracking AI interactions.

### 4. Start the Application

```powershell
# From project root
.\start-dev.ps1
```

Or manually:
```powershell
# Terminal 1: Backend
cd code\backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver

# Terminal 2: Frontend
cd code\frontend
npm run dev
```

## API Endpoints

All endpoints require authentication. Base path: `/api/grading/`

### Health Check
```
GET /api/grading/health/
```

Returns AI service configuration status:
```json
{
  "configured": true,
  "model": "gpt-5",
  "service": "OpenAI"
}
```

### Evaluate Student Work
```
POST /api/grading/evaluate/
```

Request:
```json
{
  "question": "What is photosynthesis?",
  "student_answer": "The process where plants make food from sunlight...",
  "rubric": "Optional: Grading criteria",
  "context": "Optional: Additional context",
  "activity_id": 123
}
```

Response:
```json
{
  "evaluation": "JSON string with score, strengths, improvements, feedback",
  "model": "gpt-5",
  "tokens_used": 456
}
```

### Chat Completion
```
POST /api/grading/chat/
```

Request:
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Explain the water cycle"}
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

Response:
```json
{
  "content": "The water cycle is...",
  "model": "gpt-5",
  "tokens_used": 234,
  "finish_reason": "stop"
}
```

### Generate Feedback
```
POST /api/grading/feedback/
```

Request:
```json
{
  "prompt": "Can you explain cellular respiration?",
  "context": "Optional: Student's current work or course context",
  "temperature": 0.7
}
```

Response:
```json
{
  "feedback": "Cellular respiration is...",
  "model": "gpt-5",
  "tokens_used": 189
}
```

## Frontend Usage

### Using React Hooks

```typescript
import { useEvaluateWork, useFeedback, useAIHealth } from './hooks/useAI';

function GradingComponent() {
  const { data, loading, error, evaluate } = useEvaluateWork();

  const handleGrade = async () => {
    try {
      const result = await evaluate({
        question: "What is DNA?",
        student_answer: "DNA is genetic material...",
        rubric: "Accuracy: 40%, Detail: 30%, Clarity: 30%"
      });
      console.log('Evaluation:', result.evaluation);
    } catch (err) {
      console.error('Grading failed:', err);
    }
  };

  return (
    <div>
      {loading && <p>Grading...</p>}
      {error && <p>Error: {error}</p>}
      {data && <div>{data}</div>}
      <button onClick={handleGrade}>Grade Work</button>
    </div>
  );
}
```

### Using Service Functions Directly

```typescript
import { evaluateWork, generateFeedback, checkAIHealth } from './services/aiService';

// Check if AI is configured
const health = await checkAIHealth();
console.log('AI configured:', health.configured);

// Generate feedback
const feedback = await generateFeedback({
  prompt: "Help me understand mitosis",
  temperature: 0.7
});
console.log(feedback.feedback);

// Evaluate work
const evaluation = await evaluateWork({
  question: "Describe the carbon cycle",
  student_answer: "Carbon moves through...",
});
```

## Backend Service Layer

The `AIService` class in `code/backend/grading/ai_service.py` provides:

```python
from grading.ai_service import get_ai_service

# Get singleton instance
ai_service = get_ai_service()

# Check configuration
if ai_service.is_configured():
    # Evaluate student work
    result = ai_service.evaluate_student_work(
        question="What is evolution?",
        student_answer="Evolution is change over time...",
        rubric="Optional rubric"
    )
    
    # Generate feedback
    feedback = ai_service.generate_feedback(
        prompt="Explain photosynthesis simply",
        temperature=0.7
    )
    
    # Custom chat completion
    response = ai_service.chat_completion(
        messages=[
            {"role": "system", "content": "You are a science tutor"},
            {"role": "user", "content": "What are cells?"}
        ],
        temperature=0.7
    )
```

## Database Logging

All AI interactions are logged to the `grading_gradingsession` table for audit and analytics:

- `user`: Who made the request
- `activity_id`: Related activity (if applicable)
- `prompt`: User's input
- `response`: AI's output
- `model_used`: Which model was used
- `tokens_used`: Token consumption
- `created_at`: Timestamp

View logs in Django admin: `http://localhost:8000/admin/grading/gradingsession/`

## Security Considerations

✅ **API keys never exposed to frontend**: All keys stay server-side  
✅ **Authentication required**: All endpoints require logged-in users  
✅ **CSRF protection**: Enabled for all POST requests  
✅ **Request logging**: All interactions tracked for audit  
✅ **Error handling**: Graceful failures with informative messages  

## Testing

### Test Health Check
```powershell
curl http://localhost:8000/api/grading/health/
```

### Test with Python (after creating superuser)
```python
import requests

# Login first
session = requests.Session()
response = session.get('http://localhost:8000/api/auth/csrf/')
csrf_token = response.cookies['csrftoken']

# Test evaluation
response = session.post(
    'http://localhost:8000/api/grading/evaluate/',
    headers={'X-CSRFToken': csrf_token},
    json={
        'question': 'What is gravity?',
        'student_answer': 'Gravity is a force that pulls objects together.',
    }
)
print(response.json())
```

## Troubleshooting

### "AI service not configured"
- Check that `.env` file exists in project root
- Verify `OPENAI_API_KEY` or Azure credentials are set
- Restart Django server after changing `.env`

### Import errors for `openai` package
- Ensure you're in the virtual environment: `.\.venv\Scripts\Activate.ps1`
- Run `pip install -r requirements.txt`

### CORS/CSRF errors
- Frontend must use `credentials: 'include'` in fetch
- Backend `CORS_ALLOWED_ORIGINS` must include `http://localhost:5173`
- CSRF token must be sent in `X-CSRFToken` header

### Rate limiting / API errors
- Check OpenAI dashboard for quota and usage
- Handle errors gracefully in frontend
- Consider implementing retry logic with exponential backoff

## Cost Management

Monitor token usage via:
1. Django admin logs: `/admin/grading/gradingsession/`
2. OpenAI dashboard: https://platform.openai.com/usage
3. Azure Portal for Azure OpenAI

Tips to reduce costs:
- Use `temperature=0.3` for grading (more deterministic, fewer tokens)
- Set `max_tokens` limits on responses
- Cache common evaluations
- Use gpt-5-mini for simpler tasks

## Next Steps

- [ ] Add streaming responses for real-time feedback
- [ ] Implement prompt templates for consistent grading
- [ ] Add rate limiting per user
- [ ] Create admin dashboard for usage analytics
- [ ] Add support for file attachments (images, PDFs)
- [ ] Implement conversation history for multi-turn interactions
- [ ] Add cost tracking per user/activity

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [OpenAI Python SDK](https://github.com/openai/openai-python)
