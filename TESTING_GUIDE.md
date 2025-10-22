# 🚀 Quick Start Guide: Testing Rubric Grading

## Step 1: Import the Demo Component

Add this to your `App.tsx`:

```tsx
import RubricGradingDemo from './components/RubricGradingDemo';

function App() {
  return (
    <div>
      <RubricGradingDemo />
    </div>
  );
}

export default App;
```

## Step 2: Start the Servers

### Backend (Terminal 1):
```powershell
cd code\backend
conda run -n WorkSmarterScience --no-capture-output python manage.py runserver
```

### Frontend (Terminal 2):
```powershell
cd code\frontend
npm run dev
```

## Step 3: Test the Workflow

### 3.1 Create a Test Rubric

1. Navigate to the app in your browser
2. Click **"➕ Create Rubric"**
3. Fill in:
   - Title: `Lab Report Grading`
   - Description: `Grading criteria for science lab reports`
4. Add criteria:
   - **Hypothesis** (20 pts): "Clear and testable hypothesis stated"
   - **Methodology** (30 pts): "Detailed procedure with materials and steps"
   - **Data & Analysis** (30 pts): "Organized data with proper analysis"
   - **Conclusion** (20 pts): "Evidence-based conclusion that addresses hypothesis"
5. Click **"Save Rubric"**

### 3.2 Submit Sample Work

1. Click **"📝 Submit Work"**
2. Select your rubric from the dropdown
3. Enter a sample question:
   ```
   Describe the process of photosynthesis and explain how it relates to cellular respiration.
   ```
4. Enter a sample answer (test with varying quality):
   
   **Good Answer:**
   ```
   Photosynthesis is the process by which plants convert light energy into chemical energy in the form of glucose. It occurs in chloroplasts and requires carbon dioxide, water, and sunlight. The equation is: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.
   
   This relates to cellular respiration, which is essentially the reverse process. Plants and animals use cellular respiration to break down glucose to release energy for cellular activities. The oxygen produced during photosynthesis is used in cellular respiration, while the carbon dioxide from respiration is used in photosynthesis. This creates a cycle of energy transfer in ecosystems.
   ```
   
   **Weak Answer:**
   ```
   Photosynthesis is when plants make food using sunlight. It's important for life.
   ```

5. Click **"Submit for Grading"**

### 3.3 Grade with AI

1. Click **"🤖 Grade Submission"**
2. You'll see your submission listed - click to select it
3. Click the **"Grade with AI"** button
4. Wait 10-30 seconds (OpenAI API is processing)
5. View the results:
   - Overall score and percentage
   - Score breakdown by criterion
   - AI feedback for each criterion

### 3.4 Teacher Review (Optional)

If you want to override the AI grade:
1. Scroll to the "Teacher Review" section
2. Enter a new final score
3. Add teacher feedback
4. Click **"Submit Review"**
5. Status changes from "graded" to "reviewed"

## Expected Results

### Good Answer (Sample):
- **Hypothesis:** 18/20 pts - "Strong understanding of photosynthesis definition and equation"
- **Methodology:** 25/30 pts - "Explained the process but could include more detail about light-dependent vs light-independent reactions"
- **Data & Analysis:** 28/30 pts - "Excellent connection to cellular respiration and energy cycle"
- **Conclusion:** 19/20 pts - "Clear understanding of the cyclical relationship"
- **Total:** 90/100 (90%)

### Weak Answer (Sample):
- **Hypothesis:** 8/20 pts - "Basic understanding but lacks detail"
- **Methodology:** 10/30 pts - "Missing key components and scientific terminology"
- **Data & Analysis:** 5/30 pts - "No analysis or data provided"
- **Conclusion:** 8/20 pts - "Superficial conclusion without supporting evidence"
- **Total:** 31/100 (31%)

## Troubleshooting

### Error: "AI service not configured"
1. Check your `.env` file in `code/backend/`:
   ```env
   OPENAI_API_KEY=sk-proj-...
   ```
2. Restart the Django server

### Error: "Network request failed" / CORS issues
1. Make sure Django is running on `http://localhost:8000`
2. Check that CORS settings in `api/settings.py` include `localhost:5173`

### Grading takes forever
- OpenAI API calls are slow (~10-30 seconds)
- Check your internet connection
- Verify API key has credits remaining

### "No rubrics created yet"
- You need to create a rubric first before submitting work
- Click "Create Rubric" button and add at least 2 criteria

## Next Steps

### Integration into Existing Pages

Replace the demo with real integration:

```tsx
// In your Assessment page
import SubmissionGrader from '../components/SubmissionGrader';

function Assessment1() {
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  
  // After student submits their answer:
  const handleSubmit = async (answerText: string) => {
    const submission = await createSubmission({
      activity_id: 1,
      question_text: currentQuestion,
      answer_text: answerText,
      rubric: selectedRubricId,
      status: 'submitted'
    });
    
    setSubmissionId(submission.id!);
  };
  
  return (
    <div>
      {/* Your existing assessment UI */}
      
      {submissionId && (
        <SubmissionGrader submissionId={submissionId} />
      )}
    </div>
  );
}
```

### Create Custom Rubrics

For each assessment type, create specialized rubrics:
- Lab reports
- Essay questions
- Problem-solving exercises
- Project submissions

### Admin Panel

Access Django admin to manage rubrics:
```
http://localhost:8000/admin/grading/rubric/
http://localhost:8000/admin/grading/assessmentsubmission/
```

## API Testing (Optional)

Use these endpoints directly:

```bash
# List rubrics
curl http://localhost:8000/api/grading/rubrics/

# Create submission
curl -X POST http://localhost:8000/api/grading/submissions/ \
  -H "Content-Type: application/json" \
  -d '{
    "activity_id": 1,
    "question_text": "Test question",
    "answer_text": "Test answer",
    "rubric": 1,
    "status": "submitted"
  }'

# Grade submission
curl -X POST http://localhost:8000/api/grading/submissions/1/grade_submission/ \
  -H "Content-Type: application/json"
```

## Success Criteria

✅ You can create a rubric with multiple criteria  
✅ You can submit assessment work  
✅ AI grading returns criterion-by-criterion scores  
✅ Total score is calculated correctly  
✅ Teacher can review and override grades  
✅ All data persists in database  

If all checkboxes pass, the system is working correctly!
