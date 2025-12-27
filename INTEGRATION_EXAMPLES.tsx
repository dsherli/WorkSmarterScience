// Quick Integration: Add Rubric Grading to Your Existing App
// 
// This file shows the minimal changes needed to add the rubric grading
// system to your existing WorkSmarterScience application.

// ============================================================================
// OPTION 1: Full Demo (Easiest - Good for Testing)
// ============================================================================

// 1. Update App.tsx to include the demo component:

import RubricGradingDemo from './components/RubricGradingDemo';

function App() {
  return (
    <div className="App">
      <RubricGradingDemo />
    </div>
  );
}

export default App;

// That's it! Now run the app and you'll see the complete workflow.


// ============================================================================
// OPTION 2: Add to Existing Assessment Pages
// ============================================================================

// If you already have assessment pages (like Assessment1.tsx), integrate like this:

import { useState } from 'react';
import { useSubmissionActions } from '../hooks/useRubric';
import SubmissionGrader from '../components/SubmissionGrader';

function Assessment1() {
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const { create } = useSubmissionActions();

  // When student submits their answer:
  const handleSubmit = async (questionText: string, answerText: string, rubricId: number) => {
    try {
      const submission = await create({
        activity_id: 1, // Your activity ID
        question_text: questionText,
        answer_text: answerText,
        rubric: rubricId,
        status: 'submitted' as const,
      });
      
      setSubmissionId(submission.id!);
      alert('Submitted successfully!');
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Submission failed. Please try again.');
    }
  };

  return (
    <div>
      {/* Your existing assessment UI */}
      <div className="question-section">
        {/* ... existing question display ... */}
      </div>

      <div className="answer-section">
        {/* ... existing answer input ... */}
        <button onClick={() => handleSubmit(question, answer, rubric)}>
          Submit Answer
        </button>
      </div>

      {/* NEW: Show grading interface after submission */}
      {submissionId && (
        <div className="grading-section">
          <h2>Grading Results</h2>
          <SubmissionGrader
            submissionId={submissionId}
            onGraded={(submission) => {
              console.log('Graded:', submission.final_score, '/', submission.max_score);
              // Optional: Update parent component state, show celebration, etc.
            }}
          />
        </div>
      )}
    </div>
  );
}


// ============================================================================
// OPTION 3: Add Rubric Management Page
// ============================================================================

// Create a dedicated page for teachers to manage rubrics:

import { useRubrics } from '../hooks/useRubric';
import RubricBuilder from '../components/RubricBuilder';
import type { Rubric } from '../services/rubricService';

function RubricsPage() {
  const [editing, setEditing] = useState<Rubric | null>(null);
  const [creating, setCreating] = useState(false);
  const { data: rubrics, reload } = useRubrics();

  const handleSave = (rubric: Rubric) => {
    reload();
    setCreating(false);
    setEditing(null);
  };

  if (creating || editing) {
    return (
      <RubricBuilder
        rubric={editing || undefined}
        activity_id={1}
        onSave={handleSave}
        onCancel={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div>
      <h1>My Rubrics</h1>
      <button onClick={() => setCreating(true)}>Create New Rubric</button>
      
      <div className="rubric-list">
        {rubrics?.map((rubric) => (
          <div key={rubric.id} className="rubric-card">
            <h3>{rubric.title}</h3>
            <p>{rubric.description}</p>
            <p>Total Points: {rubric.total_points}</p>
            <button onClick={() => setEditing(rubric)}>Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}


// ============================================================================
// OPTION 4: Add to Existing Routing (if using React Router)
// ============================================================================

// Update your App.tsx routing:

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RubricGradingDemo from './components/RubricGradingDemo';
import RubricBuilder from './components/RubricBuilder';
import SubmissionGrader from './components/SubmissionGrader';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/assessment/:id" element={<Assessment1 />} />
        
        {/* NEW: Rubric grading routes */}
        <Route path="/grading/demo" element={<RubricGradingDemo />} />
        
        <Route path="/rubrics" element={<RubricsPage />} />
        
        <Route path="/rubrics/create" element={
          <RubricBuilder
            activity_id={1}
            onSave={(rubric) => {
              console.log('Created:', rubric);
              // Navigate back or show success
            }}
            onCancel={() => window.history.back()}
          />
        } />
        
        <Route path="/submissions/:id" element={<SubmissionViewPage />} />
      </Routes>
    </BrowserRouter>
  );
}


// ============================================================================
// OPTION 5: API Usage Only (No UI Components)
// ============================================================================

// If you want to use the API directly without the pre-built components:

import { 
  createRubric, 
  createSubmission, 
  gradeSubmission 
} from './services/rubricService';

async function example() {
  // 1. Create a rubric
  const rubric = await createRubric({
    title: 'Essay Rubric',
    description: 'Grading criteria for essays',
    activity_id: 1,
    criteria: [
      {
        name: 'Thesis',
        description: 'Clear thesis statement',
        max_points: 25,
        order: 1
      },
      {
        name: 'Evidence',
        description: 'Supporting evidence',
        max_points: 50,
        order: 2
      },
      {
        name: 'Grammar',
        description: 'Proper grammar and spelling',
        max_points: 25,
        order: 3
      }
    ]
  });

  console.log('Created rubric:', rubric.id);

  // 2. Submit student work
  const submission = await createSubmission({
    activity_id: 1,
    rubric: rubric.id!,
    question_text: 'Write an essay about climate change',
    answer_text: 'Climate change is one of the most pressing...',
    status: 'submitted'
  });

  console.log('Submitted:', submission.id);

  // 3. Grade with AI
  const gradedSubmission = await gradeSubmission(submission.id!);

  console.log('Grading complete!');
  console.log('Score:', gradedSubmission.final_score, '/', gradedSubmission.max_score);
  console.log('Percentage:', gradedSubmission.percentage?.toFixed(1), '%');
  
  // 4. View criterion breakdown
  gradedSubmission.criterion_scores.forEach(score => {
    console.log(
      `${score.criterion_name}: ${score.points_earned}/${score.criterion_max_points}`,
      `- ${score.feedback}`
    );
  });
}


// ============================================================================
// OPTION 6: Custom Hook Usage
// ============================================================================

// Build your own UI using the provided hooks:

import { useRubrics, useRubricActions, useSubmissions } from '../hooks/useRubric';

function MyCustomGradingUI() {
  const { data: rubrics, loading: loadingRubrics } = useRubrics(1); // activity_id = 1
  const { data: submissions, loading: loadingSubmissions } = useSubmissions(1);
  const { create: createRubric, update: updateRubric } = useRubricActions();

  const handleCreateRubric = async () => {
    const newRubric = await createRubric({
      title: 'Custom Rubric',
      activity_id: 1,
      criteria: [
        { name: 'Quality', description: 'Overall quality', max_points: 100, order: 1 }
      ]
    });
    
    console.log('Created:', newRubric);
  };

  if (loadingRubrics || loadingSubmissions) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Rubrics ({rubrics?.length})</h2>
      {rubrics?.map(rubric => (
        <div key={rubric.id}>
          {rubric.title} - {rubric.total_points} pts
        </div>
      ))}

      <h2>Submissions ({submissions?.length})</h2>
      {submissions?.map(sub => (
        <div key={sub.id}>
          {sub.student_username} - {sub.status}
        </div>
      ))}

      <button onClick={handleCreateRubric}>Create Rubric</button>
    </div>
  );
}


// ============================================================================
// RECOMMENDED QUICK START
// ============================================================================

// The fastest way to see the system working:
//
// 1. Update App.tsx:
//    import RubricGradingDemo from './components/RubricGradingDemo';
//    function App() { return <RubricGradingDemo />; }
//
// 2. Start servers:
//    Terminal 1: cd code\backend && conda run -n WorkSmarterScience python manage.py runserver
//    Terminal 2: cd code\frontend && npm run dev
//
// 3. Open browser to http://localhost:5173
//
// 4. Test workflow:
//    - Click "Create Rubric" → Add 3 criteria → Save
//    - Click "Submit Work" → Fill form → Submit
//    - Click "Grade Submission" → Select submission → "Grade with AI"
//    - View results with criterion breakdown
//
// That's it! The system is fully functional.


// ============================================================================
// NEED HELP?
// ============================================================================

// See these files for more details:
// - TESTING_GUIDE.md - Step-by-step testing instructions
// - ARCHITECTURE.md - System design and data flow
// - components/README.md - Component API documentation
// - RUBRIC_GRADING_SUMMARY.md - Complete feature overview
