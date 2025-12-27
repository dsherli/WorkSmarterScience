# Rubric-Based Grading System

This directory contains components for AI-powered assessment grading using customizable rubrics.

## Components

### 1. **RubricGradingDemo.tsx**
Complete demonstration workflow showing:
- ✅ Creating and managing rubrics
- ✅ Submitting assessment work
- ✅ AI-powered grading with criterion breakdown
- ✅ Teacher review and override

**Usage:**
```tsx
import RubricGradingDemo from './components/RubricGradingDemo';

function App() {
  return <RubricGradingDemo />;
}
```

### 2. **RubricBuilder.tsx**
Teacher interface for creating and editing rubrics with multiple criteria.

**Features:**
- Dynamic criterion management (add/remove/reorder)
- Point allocation per criterion
- Rich descriptions for each criterion
- Validation and error handling

**Props:**
```typescript
{
  rubric?: Rubric;          // Optional: for editing existing rubric
  activity_id: number;      // Required: associated activity
  onSave: (rubric: Rubric) => void;
  onCancel: () => void;
}
```

**Example:**
```tsx
<RubricBuilder
  activity_id={1}
  onSave={(rubric) => console.log('Saved:', rubric)}
  onCancel={() => console.log('Cancelled')}
/>
```

### 3. **SubmissionGrader.tsx**
Interface for viewing submissions and triggering AI grading.

**Features:**
- Display question and answer
- "Grade with AI" button
- Criterion-by-criterion score breakdown
- Teacher review form for overrides
- Status indicators

**Props:**
```typescript
{
  submissionId: number;
  onGraded?: (submission: AssessmentSubmission) => void;
}
```

**Example:**
```tsx
<SubmissionGrader
  submissionId={42}
  onGraded={(sub) => console.log('Graded:', sub.final_score)}
/>
```

## Hooks

### useRubrics()
Fetch all rubrics for current activity.

```typescript
const { data, loading, error, reload } = useRubrics(activity_id);
```

### useRubric(id)
Fetch single rubric by ID.

```typescript
const { data, loading, error, reload } = useRubric(rubricId);
```

### useRubricActions()
Perform CRUD operations on rubrics.

```typescript
const { create, update, remove } = useRubricActions();

await create({ title: 'Lab Report', criteria: [...] });
await update(rubricId, { title: 'Updated Title' });
await remove(rubricId);
```

### useSubmissions()
Fetch all submissions (optionally filtered by activity).

```typescript
const { data, loading, error, reload } = useSubmissions(activity_id);
```

### useSubmission(id)
Fetch single submission by ID.

```typescript
const { data, loading, error, reload } = useSubmission(submissionId);
```

### useSubmissionActions()
Perform operations on submissions.

```typescript
const { create, update, grade, review, remove } = useSubmissionActions();

// Create submission
await create({
  activity_id: 1,
  question_text: 'Explain photosynthesis',
  answer_text: 'Student answer...',
  rubric: rubricId,
  status: 'submitted'
});

// Trigger AI grading
await grade(submissionId);

// Teacher override
await review(submissionId, {
  final_score: 85,
  teacher_feedback: 'Great work!'
});
```

## Services

### rubricService.ts
API client for backend communication.

**Available Functions:**
- `getRubrics(activity_id?)` - List rubrics
- `getRubric(id)` - Get single rubric
- `createRubric(data)` - Create new rubric
- `updateRubric(id, data)` - Update rubric
- `deleteRubric(id)` - Delete rubric
- `getSubmissions(activity_id?)` - List submissions
- `getSubmission(id)` - Get single submission
- `createSubmission(data)` - Submit work
- `updateSubmission(id, data)` - Update submission
- `gradeSubmission(id)` - Trigger AI grading
- `teacherReview(id, data)` - Override grade
- `deleteSubmission(id)` - Delete submission

## Data Models

### Rubric
```typescript
interface Rubric {
  id?: number;
  title: string;
  description?: string;
  activity_id: number;
  criteria: RubricCriterion[];
  total_points: number;
  created_by: number;
  created_by_username: string;
  created_at?: string;
}
```

### RubricCriterion
```typescript
interface RubricCriterion {
  id?: number;
  name: string;
  description: string;
  max_points: number;
  order?: number;
}
```

### AssessmentSubmission
```typescript
interface AssessmentSubmission {
  id?: number;
  student: number;
  student_username: string;
  activity_id: number;
  rubric: number;
  rubric_details?: Rubric;
  question_text: string;
  answer_text: string;
  status: 'draft' | 'submitted' | 'graded' | 'reviewed';
  final_score?: number;
  max_score?: number;
  percentage?: number;
  ai_feedback?: string;
  teacher_feedback?: string;
  criterion_scores: CriterionScore[];
  submitted_at?: string;
  graded_at?: string;
}
```

### CriterionScore
```typescript
interface CriterionScore {
  id?: number;
  criterion: number;
  criterion_name?: string;
  criterion_max_points?: number;
  points_earned: number;
  feedback: string;
}
```

## Backend API Endpoints

### Rubrics
- `GET /api/grading/rubrics/` - List all rubrics
- `GET /api/grading/rubrics/?activity_id=1` - Filter by activity
- `GET /api/grading/rubrics/{id}/` - Get rubric details
- `POST /api/grading/rubrics/` - Create rubric
- `PUT /api/grading/rubrics/{id}/` - Update rubric
- `PATCH /api/grading/rubrics/{id}/` - Partial update
- `DELETE /api/grading/rubrics/{id}/` - Delete rubric

### Submissions
- `GET /api/grading/submissions/` - List all submissions
- `GET /api/grading/submissions/?activity_id=1` - Filter by activity
- `GET /api/grading/submissions/{id}/` - Get submission details
- `POST /api/grading/submissions/` - Create submission
- `PUT /api/grading/submissions/{id}/` - Update submission
- `POST /api/grading/submissions/{id}/grade_submission/` - Trigger AI grading
- `POST /api/grading/submissions/{id}/teacher_review/` - Teacher override
- `DELETE /api/grading/submissions/{id}/` - Delete submission

## Quick Start

### 1. Create a Rubric
```tsx
import { useRubricActions } from '../hooks/useRubric';

function CreateRubricExample() {
  const { create } = useRubricActions();
  
  const handleCreate = async () => {
    const rubric = await create({
      title: 'Lab Report Rubric',
      description: 'Grading criteria for lab reports',
      activity_id: 1,
      criteria: [
        {
          name: 'Hypothesis',
          description: 'Clear and testable hypothesis',
          max_points: 20,
          order: 1
        },
        {
          name: 'Methodology',
          description: 'Detailed experimental procedure',
          max_points: 30,
          order: 2
        },
        {
          name: 'Analysis',
          description: 'Data analysis and interpretation',
          max_points: 30,
          order: 3
        },
        {
          name: 'Conclusion',
          description: 'Conclusion supported by evidence',
          max_points: 20,
          order: 4
        }
      ]
    });
    
    console.log('Created rubric:', rubric);
  };
  
  return <button onClick={handleCreate}>Create Rubric</button>;
}
```

### 2. Submit Work
```tsx
import { useSubmissionActions } from '../hooks/useRubric';

function SubmitWorkExample() {
  const { create } = useSubmissionActions();
  
  const handleSubmit = async () => {
    const submission = await create({
      activity_id: 1,
      rubric: 5, // Rubric ID
      question_text: 'Explain the process of photosynthesis...',
      answer_text: 'Photosynthesis is the process by which...',
      status: 'submitted'
    });
    
    console.log('Submitted:', submission);
  };
  
  return <button onClick={handleSubmit}>Submit Answer</button>;
}
```

### 3. Grade with AI
```tsx
import { useSubmissionActions } from '../hooks/useRubric';

function GradeExample() {
  const { grade } = useSubmissionActions();
  
  const handleGrade = async (submissionId: number) => {
    const result = await grade(submissionId);
    console.log('AI Grading complete:', result);
    console.log('Score:', result.final_score, '/', result.max_score);
    console.log('Criteria:', result.criterion_scores);
  };
  
  return <button onClick={() => handleGrade(42)}>Grade with AI</button>;
}
```

### 4. Teacher Review
```tsx
import { useSubmissionActions } from '../hooks/useRubric';

function ReviewExample() {
  const { review } = useSubmissionActions();
  
  const handleReview = async (submissionId: number) => {
    const result = await review(submissionId, {
      final_score: 85,
      teacher_feedback: 'Excellent work on hypothesis and methodology. Consider expanding your analysis section.'
    });
    
    console.log('Review saved:', result);
  };
  
  return <button onClick={() => handleReview(42)}>Submit Review</button>;
}
```

## Integration Example

To integrate into your existing app:

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RubricGradingDemo from './components/RubricGradingDemo';
import RubricBuilder from './components/RubricBuilder';
import SubmissionGrader from './components/SubmissionGrader';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Full demo workflow */}
        <Route path="/grading/demo" element={<RubricGradingDemo />} />
        
        {/* Individual components */}
        <Route path="/rubrics/create" element={
          <RubricBuilder
            activity_id={1}
            onSave={(rubric) => console.log('Saved:', rubric)}
            onCancel={() => history.back()}
          />
        } />
        
        <Route path="/submissions/:id" element={
          <SubmissionGrader
            submissionId={parseInt(window.location.pathname.split('/').pop() || '0')}
          />
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

## Environment Setup

Make sure your `.env` file contains OpenAI credentials:

```env
# For OpenAI
OPENAI_API_KEY=sk-...

# Or for Azure OpenAI
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

## Testing

1. **Start the backend:**
   ```powershell
   cd code\backend
   conda run -n WorkSmarterScience --no-capture-output python manage.py runserver
   ```

2. **Start the frontend:**
   ```powershell
   cd code\frontend
   npm run dev
   ```

3. **Access the demo:**
   Navigate to `http://localhost:5173` and import `RubricGradingDemo` component

4. **Test workflow:**
   - Create a rubric with 3-5 criteria
   - Submit sample assessment work
   - Click "Grade with AI" to see criterion-level evaluation
   - Review and override scores if needed

## Troubleshooting

### "AI service not configured"
- Check that OpenAI API key is set in Django settings
- Verify credentials in `.env` file
- Restart Django server after changing environment variables

### "CSRF token missing"
- Ensure Django session middleware is enabled
- Check that cookies are being sent with requests
- Verify `credentials: 'include'` in fetch calls

### "Invalid rubric ID"
- Make sure rubric exists before submitting work
- Check that activity_id matches between rubric and submission
- Use RubricGradingDemo to see all available rubrics

### Grading takes too long
- OpenAI API calls can take 10-30 seconds for complex rubrics
- Consider implementing a background task queue (Celery) for production
- Show loading indicators to users during grading

## Performance Tips

1. **Caching:** Backend automatically caches rubric lookups
2. **Pagination:** Add pagination for large submission lists
3. **Lazy Loading:** Load rubric details only when needed
4. **Debouncing:** Debounce search/filter inputs
5. **Background Jobs:** Use Celery for AI grading in production

## Future Enhancements

- [ ] Bulk grading for multiple submissions
- [ ] Rubric templates library
- [ ] Student self-assessment before submission
- [ ] Peer review integration
- [ ] Analytics dashboard (average scores, common errors)
- [ ] Export grades to CSV/Excel
- [ ] Rubric versioning and history
- [ ] Comment threads on criterion scores
