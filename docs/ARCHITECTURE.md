# System Architecture: Rubric-Based Grading

## Data Flow Diagram

```
┌─────────────┐
│   Teacher   │
└──────┬──────┘
       │ Creates
       ▼
┌─────────────────────────────────────┐
│          Rubric                     │
│  - Title: "Lab Report"              │
│  - Total: 100 points                │
│  └─ Criteria:                       │
│     ├─ Hypothesis (20 pts)          │
│     ├─ Methodology (30 pts)         │
│     ├─ Analysis (30 pts)            │
│     └─ Conclusion (20 pts)          │
└──────┬──────────────────────────────┘
       │
       │ Student submits using this rubric
       ▼
┌─────────────────────────────────────┐
│     Assessment Submission           │
│  - Question: "Explain..."           │
│  - Answer: "Photosynthesis..."      │
│  - Status: submitted                │
│  - Rubric: Link to rubric above     │
└──────┬──────────────────────────────┘
       │
       │ Teacher clicks "Grade with AI"
       ▼
┌─────────────────────────────────────┐
│        AI Service                   │
│  - Sends prompt with:               │
│    * Question                       │
│    * Answer                         │
│    * All rubric criteria            │
│  - OpenAI evaluates each criterion  │
│  - Returns JSON:                    │
│    {                                │
│      "criterion_results": [         │
│        {                            │
│          "criterion_name": "...",   │
│          "points_earned": 18,       │
│          "max_points": 20,          │
│          "feedback": "..."          │
│        },                           │
│        ...                          │
│      ],                             │
│      "overall_feedback": "..."      │
│    }                                │
└──────┬──────────────────────────────┘
       │
       │ Backend processes response
       ▼
┌─────────────────────────────────────┐
│     Criterion Scores (Database)     │
│  ├─ Hypothesis: 18/20               │
│  │   Feedback: "Good hypothesis..." │
│  ├─ Methodology: 25/30              │
│  │   Feedback: "Clear steps..."     │
│  ├─ Analysis: 28/30                 │
│  │   Feedback: "Strong analysis..." │
│  └─ Conclusion: 19/20               │
│      Feedback: "Well supported..."  │
└──────┬──────────────────────────────┘
       │
       │ Calculate totals
       ▼
┌─────────────────────────────────────┐
│  Updated Submission                 │
│  - Final Score: 90/100              │
│  - Percentage: 90%                  │
│  - Status: graded                   │
│  - AI Feedback: Overall comments    │
│  - Graded At: timestamp             │
└──────┬──────────────────────────────┘
       │
       │ Teacher reviews (optional)
       ▼
┌─────────────────────────────────────┐
│  Teacher Override                   │
│  - Adjusted Score: 92/100           │
│  - Teacher Feedback: "Bonus..."     │
│  - Status: reviewed                 │
└─────────────────────────────────────┘
```

## Component Hierarchy

```
RubricGradingDemo (Main container)
├─ Navigation Buttons
│  ├─ View Rubrics
│  ├─ Create Rubric
│  ├─ Submit Work
│  └─ Grade Submission
│
├─ View: "rubrics"
│  └─ List of Rubrics
│     ├─ Rubric Card 1
│     │  ├─ Title, description, metadata
│     │  ├─ Edit button → switches to RubricBuilder
│     │  └─ Expandable criteria list
│     └─ Rubric Card 2...
│
├─ View: "create-rubric"
│  └─ RubricBuilder Component
│     ├─ Title input
│     ├─ Description textarea
│     ├─ Criteria section
│     │  └─ For each criterion:
│     │     ├─ Name input
│     │     ├─ Description textarea
│     │     ├─ Max points input
│     │     └─ Remove button
│     ├─ Add Criterion button
│     └─ Save/Cancel buttons
│
├─ View: "submit"
│  └─ Submission Form
│     ├─ Rubric selector (dropdown)
│     ├─ Question textarea
│     ├─ Answer textarea
│     └─ Submit button → creates submission
│
└─ View: "grade"
   ├─ Submissions List
   │  └─ Submission cards (clickable)
   │
   └─ SubmissionGrader Component
      ├─ Header (status badge, metadata)
      ├─ Question display
      ├─ Answer display
      ├─ Grade with AI button
      ├─ Score Summary
      │  ├─ Final score / Max score
      │  ├─ Percentage
      │  └─ AI feedback
      ├─ Criterion Scores Table
      │  └─ For each criterion:
      │     ├─ Name
      │     ├─ Points earned / Max points
      │     └─ Feedback
      └─ Teacher Review Form
         ├─ Final score input
         ├─ Teacher feedback textarea
         └─ Submit Review button
```

## API Request/Response Flow

### 1. Create Rubric

**Request:**
```http
POST /api/grading/rubrics/
Content-Type: application/json

{
  "title": "Lab Report",
  "description": "Science lab grading",
  "activity_id": 1,
  "criteria": [
    {
      "name": "Hypothesis",
      "description": "Clear hypothesis",
      "max_points": 20,
      "order": 1
    },
    {
      "name": "Methodology",
      "description": "Detailed procedure",
      "max_points": 30,
      "order": 2
    }
  ]
}
```

**Response:**
```json
{
  "id": 5,
  "title": "Lab Report",
  "description": "Science lab grading",
  "activity_id": 1,
  "total_points": 50,
  "created_by": 1,
  "created_by_username": "teacher1",
  "created_at": "2025-06-10T10:30:00Z",
  "criteria": [
    {
      "id": 10,
      "name": "Hypothesis",
      "description": "Clear hypothesis",
      "max_points": 20,
      "order": 1
    },
    {
      "id": 11,
      "name": "Methodology",
      "description": "Detailed procedure",
      "max_points": 30,
      "order": 2
    }
  ]
}
```

### 2. Submit Work

**Request:**
```http
POST /api/grading/submissions/
Content-Type: application/json

{
  "activity_id": 1,
  "rubric": 5,
  "question_text": "Explain photosynthesis",
  "answer_text": "Photosynthesis is...",
  "status": "submitted"
}
```

**Response:**
```json
{
  "id": 42,
  "student": 2,
  "student_username": "student1",
  "activity_id": 1,
  "rubric": 5,
  "question_text": "Explain photosynthesis",
  "answer_text": "Photosynthesis is...",
  "status": "submitted",
  "submitted_at": "2025-06-10T11:00:00Z",
  "criterion_scores": []
}
```

### 3. Grade with AI

**Request:**
```http
POST /api/grading/submissions/42/grade_submission/
Content-Type: application/json
```

**Backend → OpenAI:**
```python
prompt = """
Grade this student submission using the following rubric:

Question: Explain photosynthesis

Student Answer: Photosynthesis is...

Rubric Criteria:
1. Hypothesis (20 points): Clear hypothesis
2. Methodology (30 points): Detailed procedure

For each criterion, provide:
- Points earned (0 to max_points)
- Specific feedback

Return as JSON:
{
  "criterion_results": [
    {
      "criterion_name": "Hypothesis",
      "points_earned": 18,
      "feedback": "Good understanding..."
    }
  ],
  "overall_feedback": "Overall comments..."
}
"""
```

**OpenAI → Backend:**
```json
{
  "criterion_results": [
    {
      "criterion_name": "Hypothesis",
      "points_earned": 18,
      "feedback": "Strong understanding of photosynthesis basics..."
    },
    {
      "criterion_name": "Methodology",
      "points_earned": 25,
      "feedback": "Good explanation but could include more detail..."
    }
  ],
  "overall_feedback": "Solid response demonstrating good grasp of concepts."
}
```

**Response to Frontend:**
```json
{
  "id": 42,
  "student": 2,
  "student_username": "student1",
  "activity_id": 1,
  "rubric": 5,
  "question_text": "Explain photosynthesis",
  "answer_text": "Photosynthesis is...",
  "status": "graded",
  "final_score": 43,
  "max_score": 50,
  "percentage": 86.0,
  "ai_feedback": "Solid response demonstrating good grasp of concepts.",
  "submitted_at": "2025-06-10T11:00:00Z",
  "graded_at": "2025-06-10T11:00:45Z",
  "criterion_scores": [
    {
      "id": 100,
      "criterion": 10,
      "criterion_name": "Hypothesis",
      "criterion_max_points": 20,
      "points_earned": 18,
      "feedback": "Strong understanding of photosynthesis basics..."
    },
    {
      "id": 101,
      "criterion": 11,
      "criterion_name": "Methodology",
      "criterion_max_points": 30,
      "points_earned": 25,
      "feedback": "Good explanation but could include more detail..."
    }
  ]
}
```

### 4. Teacher Review

**Request:**
```http
POST /api/grading/submissions/42/teacher_review/
Content-Type: application/json

{
  "final_score": 45,
  "teacher_feedback": "Added bonus points for extra insight"
}
```

**Response:**
```json
{
  "id": 42,
  "status": "reviewed",
  "final_score": 45,
  "percentage": 90.0,
  "teacher_feedback": "Added bonus points for extra insight",
  ...
}
```

## Database Schema

```sql
-- Rubrics table
CREATE TABLE grading_rubric (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    activity_id INTEGER NOT NULL,
    total_points INTEGER NOT NULL,
    created_by_id INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rubric criteria
CREATE TABLE grading_rubriccriterion (
    id SERIAL PRIMARY KEY,
    rubric_id INTEGER REFERENCES grading_rubric(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    max_points INTEGER NOT NULL CHECK (max_points > 0),
    "order" INTEGER DEFAULT 0
);

-- Assessment submissions
CREATE TABLE grading_assessmentsubmission (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES auth_user(id),
    activity_id INTEGER NOT NULL,
    rubric_id INTEGER REFERENCES grading_rubric(id),
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    final_score DECIMAL(5, 2),
    ai_feedback TEXT,
    teacher_feedback TEXT,
    submitted_at TIMESTAMP,
    graded_at TIMESTAMP
);

-- Criterion scores (one per criterion per submission)
CREATE TABLE grading_criterionscore (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES grading_assessmentsubmission(id) ON DELETE CASCADE,
    criterion_id INTEGER REFERENCES grading_rubriccriterion(id),
    points_earned DECIMAL(5, 2) NOT NULL,
    feedback TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_submission_student_activity ON grading_assessmentsubmission(student_id, activity_id);
CREATE INDEX idx_submission_status ON grading_assessmentsubmission(status);
CREATE INDEX idx_criterion_rubric ON grading_rubriccriterion(rubric_id);
```

## State Management Flow

### Hook: `useSubmissionActions()`

```typescript
const { grade } = useSubmissionActions();

// When user clicks "Grade with AI"
const handleGrade = async () => {
  setGrading(true);
  try {
    // 1. API call to backend
    const result = await rubricService.gradeSubmission(submissionId);
    
    // 2. Update local state
    setSubmission(result);
    
    // 3. Notify parent component
    onGraded?.(result);
    
    // 4. Show success message
    console.log(`Graded: ${result.final_score}/${result.max_score}`);
  } catch (error) {
    // 5. Handle errors
    console.error('Grading failed:', error);
  } finally {
    setGrading(false);
  }
};
```

### Backend Service: `grade_with_rubric()`

```python
def grade_with_rubric(self, question, answer, rubric):
    # 1. Build prompt with all criteria
    criteria_text = "\n".join([
        f"{i+1}. {c.name} ({c.max_points} points): {c.description}"
        for i, c in enumerate(rubric.criteria.all())
    ])
    
    prompt = f"""
    Grade this submission using the rubric.
    Question: {question}
    Answer: {answer}
    
    Rubric:
    {criteria_text}
    
    Return JSON with criterion_results array.
    """
    
    # 2. Call OpenAI API
    response = self.client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    # 3. Parse JSON response
    result = json.loads(response.choices[0].message.content)
    
    # 4. Return structured data
    return result
```

### View: `grade_submission` action

```python
@action(detail=True, methods=['post'])
def grade_submission(self, request, pk=None):
    submission = self.get_object()
    rubric = submission.rubric
    
    # 1. Call AI service
    ai_result = ai_service.grade_with_rubric(
        submission.question_text,
        submission.answer_text,
        rubric
    )
    
    # 2. Save criterion scores
    for criterion_data in ai_result['criterion_results']:
        criterion = rubric.criteria.get(name=criterion_data['criterion_name'])
        CriterionScore.objects.create(
            submission=submission,
            criterion=criterion,
            points_earned=criterion_data['points_earned'],
            feedback=criterion_data['feedback']
        )
    
    # 3. Update submission
    submission.final_score = sum(score.points_earned for score in submission.criterion_scores.all())
    submission.ai_feedback = ai_result['overall_feedback']
    submission.status = 'graded'
    submission.graded_at = timezone.now()
    submission.save()
    
    # 4. Return updated data
    return Response(AssessmentSubmissionSerializer(submission).data)
```

## Security Considerations

1. **Authentication**: All API endpoints require authenticated users
2. **Authorization**: Students can only view their own submissions
3. **CSRF Protection**: All POST/PUT/DELETE requests require CSRF token
4. **Input Validation**: All data validated through serializers
5. **SQL Injection**: Django ORM prevents SQL injection
6. **API Rate Limiting**: Consider adding rate limits for AI grading
7. **Sensitive Data**: OpenAI API calls don't store student data permanently

## Performance Optimization

1. **Database Queries**:
   - Use `select_related()` for rubric details
   - Use `prefetch_related()` for criteria and scores
   - Add indexes on frequently queried fields

2. **Caching**:
   - Cache rubric lookups (infrequently change)
   - Don't cache submissions (frequently updated)

3. **Background Processing**:
   - Consider Celery for AI grading in production
   - Process multiple submissions concurrently

4. **Frontend**:
   - Lazy load submission details
   - Debounce search/filter inputs
   - Use React.memo for expensive components

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| AI service not configured | Missing OpenAI API key | Add key to environment |
| JSON parse error | AI returned invalid JSON | Retry or fallback to text parsing |
| Criterion not found | AI returned wrong name | Fuzzy match criterion names |
| Network timeout | OpenAI API slow | Increase timeout, show progress |
| Permission denied | Wrong user accessing data | Check authentication |
| Validation error | Invalid input data | Display field errors to user |

## Monitoring & Logging

Key metrics to track:
- AI grading success rate
- Average grading time
- API costs per submission
- User satisfaction ratings
- Error rates by type
