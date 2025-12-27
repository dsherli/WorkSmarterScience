/**
 * Rubric Grading Demo
 * Complete workflow: Create rubric → Submit work → Grade with AI → View results
 */

import { useState } from 'react';
import { useRubrics, useSubmissions } from '../hooks/useRubric';
import RubricBuilder from './RubricBuilder';
import SubmissionGrader from './SubmissionGrader';
import type { Rubric, AssessmentSubmission } from '../services/rubricService';
import { createSubmission } from '../services/rubricService';

export default function RubricGradingDemo() {
  const [view, setView] = useState<'rubrics' | 'create-rubric' | 'submit' | 'grade'>('rubrics');
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
  
  const { data: rubrics, reload: reloadRubrics } = useRubrics();
  const { data: submissions, reload: reloadSubmissions } = useSubmissions();

  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [submissionRubricId, setSubmissionRubricId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleRubricSaved = (_rubric: Rubric) => {
    reloadRubrics();
    setView('rubrics');
    setSelectedRubric(null);
  };

  const handleSubmitWork = async () => {
    if (!questionText || !answerText || !submissionRubricId) {
      setSubmitError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const newSubmission = await createSubmission({
        activity_id: 1, // Demo activity
        question_text: questionText,
        answer_text: answerText,
        rubric: submissionRubricId,
        status: 'submitted' as const,
      });

      await reloadSubmissions();
      setSelectedSubmission(newSubmission.id!);
      setView('grade');
      
      // Reset form
      setQuestionText('');
      setAnswerText('');
      setSubmissionRubricId(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGraded = (_submission: AssessmentSubmission) => {
    reloadSubmissions();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎓 Rubric-Based Assessment Grading</h1>
      <p style={{ fontSize: '18px', marginBottom: '30px', color: '#666' }}>
        Complete AI-powered grading workflow with customizable rubrics
      </p>

      {/* Navigation */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setView('rubrics')}
          style={{
            padding: '10px 20px',
            background: view === 'rubrics' ? '#2196F3' : '#ddd',
            color: view === 'rubrics' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          📋 View Rubrics
        </button>
        <button
          onClick={() => {
            setSelectedRubric(null);
            setView('create-rubric');
          }}
          style={{
            padding: '10px 20px',
            background: view === 'create-rubric' ? '#2196F3' : '#ddd',
            color: view === 'create-rubric' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ➕ Create Rubric
        </button>
        <button
          onClick={() => setView('submit')}
          style={{
            padding: '10px 20px',
            background: view === 'submit' ? '#2196F3' : '#ddd',
            color: view === 'submit' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          📝 Submit Work
        </button>
        <button
          onClick={() => setView('grade')}
          disabled={!selectedSubmission}
          style={{
            padding: '10px 20px',
            background: view === 'grade' ? '#2196F3' : '#ddd',
            color: view === 'grade' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: selectedSubmission ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
          }}
        >
          🤖 Grade Submission
        </button>
      </div>

      {/* Content */}
      {view === 'rubrics' && (
        <div>
          <h2>Available Rubrics</h2>
          
          {!rubrics || rubrics.length === 0 ? (
            <div style={{ padding: '30px', background: '#f9f9f9', borderRadius: '5px', textAlign: 'center' }}>
              <p style={{ fontSize: '18px', marginBottom: '15px' }}>No rubrics created yet.</p>
              <button
                onClick={() => setView('create-rubric')}
                style={{
                  padding: '10px 20px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Create Your First Rubric
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {rubrics.map((rubric) => (
                <div
                  key={rubric.id}
                  style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    background: '#f9f9f9',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ marginTop: 0 }}>{rubric.title}</h3>
                      {rubric.description && <p style={{ color: '#666' }}>{rubric.description}</p>}
                      <div style={{ fontSize: '14px', color: '#999' }}>
                        <strong>Total Points:</strong> {rubric.total_points} | 
                        <strong> Criteria:</strong> {rubric.criteria.length} | 
                        <strong> Created by:</strong> {rubric.created_by_username}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRubric(rubric);
                        setView('create-rubric');
                      }}
                      style={{
                        padding: '8px 15px',
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  </div>

                  <details style={{ marginTop: '10px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Criteria</summary>
                    <div style={{ marginTop: '10px', paddingLeft: '15px' }}>
                      {rubric.criteria.map((criterion, idx) => (
                        <div key={criterion.id || idx} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                          <strong>{criterion.name}</strong> ({criterion.max_points} pts)
                          <div style={{ fontSize: '13px', color: '#666' }}>{criterion.description}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'create-rubric' && (
        <RubricBuilder
          rubric={selectedRubric || undefined}
          activity_id={1}
          onSave={handleRubricSaved}
          onCancel={() => setView('rubrics')}
        />
      )}

      {view === 'submit' && (
        <div>
          <h2>Submit Assessment Work</h2>
          
          {submitError && (
            <div style={{ padding: '10px', background: '#fee', border: '1px solid #fcc', borderRadius: '5px', marginBottom: '15px' }}>
              Error: {submitError}
            </div>
          )}

          <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Select Rubric: <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={submissionRubricId || ''}
                onChange={(e) => setSubmissionRubricId(parseInt(e.target.value) || null)}
                style={{ width: '100%', padding: '8px', fontSize: '16px' }}
              >
                <option value="">-- Choose a rubric --</option>
                {rubrics?.map((rubric) => (
                  <option key={rubric.id} value={rubric.id}>
                    {rubric.title} ({rubric.total_points} pts)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Question: <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '8px' }}
                placeholder="Enter the assessment question..."
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Your Answer: <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={8}
                style={{ width: '100%', padding: '8px' }}
                placeholder="Enter your answer here..."
              />
            </div>

            <button
              onClick={handleSubmitWork}
              disabled={submitting || !questionText || !answerText || !submissionRubricId}
              style={{
                padding: '10px 20px',
                background: submitting ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: submitting || !questionText || !answerText || !submissionRubricId ? 'not-allowed' : 'pointer',
                fontSize: '16px',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit for Grading'}
            </button>
          </div>
        </div>
      )}

      {view === 'grade' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2>Submissions</h2>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
              {submissions?.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub.id!)}
                  style={{
                    padding: '10px',
                    border: selectedSubmission === sub.id ? '2px solid #2196F3' : '1px solid #ddd',
                    borderRadius: '5px',
                    background: '#f9f9f9',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      <strong>#{sub.id}</strong> - Activity {sub.activity_id} - {sub.student_username}
                    </span>
                    <span style={{ padding: '3px 10px', background: '#666', color: 'white', borderRadius: '10px', fontSize: '12px' }}>
                      {sub.status}
                    </span>
                  </div>
                  {sub.final_score !== undefined && (
                    <div style={{ marginTop: '5px', fontSize: '14px' }}>
                      Score: {sub.final_score}/{sub.max_score} ({sub.percentage?.toFixed(1)}%)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedSubmission && (
            <SubmissionGrader
              submissionId={selectedSubmission}
              onGraded={handleGraded}
            />
          )}
        </div>
      )}
    </div>
  );
}
