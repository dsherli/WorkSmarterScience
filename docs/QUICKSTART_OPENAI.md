# Quick Start: OpenAI Integration

This is a 5-minute guide to get the OpenAI features working in your local environment.

## Prerequisites

✅ You've already cloned the repo and can run the app  
✅ Python environment set up  
✅ Node.js installed  
✅ OpenAI API key (get one at https://platform.openai.com/api-keys)  

## Step-by-Step Setup

### 1. Create Environment File (30 seconds)

Copy the example environment file:

```powershell
# From project root
Copy-Item .env.example .env
```

### 2. Add Your API Key (1 minute)

Open `.env` in your editor and add your OpenAI key:

```env
# For standard OpenAI (most common)
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-5

# OR for Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_DEPLOYMENT=gpt-5
```

**Important:** Only set ONE of these (OpenAI OR Azure). Azure takes precedence if both are set.

### 3. Install Dependencies (2 minutes)

```powershell
# Backend
cd code\backend
pip install openai==1.54.3

# Frontend (if you haven't already)
cd ..\frontend
npm install
cd ..\..
```

### 4. Run Migrations (30 seconds)

```powershell
cd code\backend
python manage.py migrate
```

This creates the `grading_gradingsession` table for tracking AI usage.

### 5. Start the App (1 minute)

Use the helper script:

```powershell
# From project root
.\start-dev.ps1
```

Or manually in two terminals:

```powershell
# Terminal 1: Backend
cd code\backend
python manage.py runserver

# Terminal 2: Frontend
cd code\frontend
npm run dev
```

## Verify It's Working

### Quick Health Check

Visit in your browser:
```
http://localhost:8000/api/grading/health/
```

Expected response (if configured correctly):
```json
{
  "configured": true,
  "model": "gpt-5",
  "service": "OpenAI"
}
```

If `"configured": false`, double-check your `.env` file.

### Test with Example Component

1. **Import the demo component** in your app (e.g., in `App.tsx`):

```typescript
import AIExample from './components/AIExample';

function App() {
  return (
    <div>
      <AIExample />
    </div>
  );
}
```

2. **Visit** `http://localhost:5173`

3. **Click "Check AI Service"** - should show configured: ✅ Yes

4. **Try evaluating work** - enter a question and answer, click "Evaluate"

### Test from Terminal (Backend Only)

```powershell
cd code\backend
python manage.py shell
```

Then in the Python shell:

```python
from grading.ai_service import get_ai_service

ai = get_ai_service()
print(f"Configured: {ai.is_configured()}")

if ai.is_configured():
    result = ai.generate_feedback(
        prompt="Explain photosynthesis in one sentence",
        temperature=0.7
    )
    print(result['content'])
```

## Common Issues

### "AI service not configured"

**Problem:** `.env` file missing or API key not set  
**Fix:** Ensure `.env` exists in project root with `OPENAI_API_KEY=sk-...`

### "Import openai could not be resolved"

**Problem:** OpenAI package not installed  
**Fix:** Run `pip install openai==1.54.3` in your backend environment

### 401 Unauthorized when calling endpoints

**Problem:** Not logged in  
**Fix:** All `/api/grading/*` endpoints require authentication. Create a user and log in first:

```powershell
cd code\backend
python manage.py createsuperuser
# Then log in at http://localhost:8000/admin/
```

### CSRF token errors

**Problem:** Frontend not sending CSRF token  
**Fix:** Make sure you're using `credentials: 'include'` in fetch and sending the token in headers (already done in `aiService.ts`)

## Next Steps

Now that it's working:

1. **Read the full guide:** [docs/OPENAI_INTEGRATION.md](OPENAI_INTEGRATION.md)
2. **Explore the architecture:** [docs/OPENAI_ARCHITECTURE.md](OPENAI_ARCHITECTURE.md)
3. **Check the summary:** [docs/OPENAI_SUMMARY.md](OPENAI_SUMMARY.md)
4. **Integrate into your UI:**
   - Use `useEvaluateWork()` hook in assessment pages
   - Add `useFeedback()` for virtual assistant chat
   - Connect to your grading workflows

## Usage Examples

### Evaluate Student Work

```typescript
import { useEvaluateWork } from './hooks/useAI';

function AssessmentGrading() {
  const { evaluate, data, loading, error } = useEvaluateWork();

  const handleGrade = async () => {
    const result = await evaluate({
      question: "What causes seasons on Earth?",
      student_answer: "Earth's tilt causes seasons because...",
      rubric: "Accuracy: 50%, Explanation: 30%, Clarity: 20%",
      activity_id: 123
    });
    console.log('Grade:', result.evaluation);
  };

  return (
    <button onClick={handleGrade} disabled={loading}>
      {loading ? 'Grading...' : 'Grade Submission'}
    </button>
  );
}
```

### Generate Hints (without giving away answer)

```typescript
import { useFeedback } from './hooks/useAI';

function VirtualAssistant() {
  const { getFeedback, data } = useFeedback();

  const askForHint = async () => {
    await getFeedback({
      prompt: "I don't understand photosynthesis. Can you give me a hint?",
      context: "Student is working on chemistry unit 3",
      temperature: 0.8  // More creative for explanations
    });
  };

  return <div>{data && <p>{data}</p>}</div>;
}
```

## Cost Monitoring

Track your usage:

1. **Django Admin:** `http://localhost:8000/admin/grading/gradingsession/`
   - View all requests, tokens used, costs
   
2. **OpenAI Dashboard:** https://platform.openai.com/usage
   - Real-time usage and billing

3. **Query usage programmatically:**

```python
from grading.models import GradingSession
from django.db.models import Sum

total_tokens = GradingSession.objects.aggregate(Sum('tokens_used'))
print(f"Total tokens used: {total_tokens['tokens_used__sum']}")
```

## Production Checklist

Before deploying to production:

- [ ] Move `.env` to secure secrets manager
- [ ] Set `DEBUG=False` in Django settings
- [ ] Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`
- [ ] Add rate limiting (django-ratelimit or nginx)
- [ ] Set up monitoring/alerts for API costs
- [ ] Consider using gpt-5-mini for cost savings
- [ ] Implement caching for common queries
- [ ] Add proper error tracking (Sentry, etc.)

---

**Setup Time:** ~5 minutes  
**Status:** ✅ Ready to use  
**Questions?** Check the full docs or architecture guide.
