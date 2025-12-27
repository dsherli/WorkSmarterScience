/**
 * Submission Grader Component
 * Displays student submission and allows AI grading with rubric
 */

import { useState } from 'react';
import { useSubmission, useSubmissionActions } from '../hooks/useRubric';
import type { AssessmentSubmission } from '../services/rubricService';

interface SubmissionGraderProps {
  submissionId: number;
  onGraded?: (submission: AssessmentSubmission) => void;
}

export default function SubmissionGrader({ submissionId, onGraded }: SubmissionGraderProps) {
  const { data: submission, loading, error, reload } = useSubmission(submissionId);
  const { grade, review, loading: actionLoading, error: actionError } = useSubmissionActions();
  
  const [context, setContext] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [teacherScore, setTeacherScore] = useState<number>(0);
  const [teacherFeedback, setTeacherFeedback] = useState('');

  const handleGrade = async () => {
    try {
      const result = await grade(submissionId, context);
      await reload();
      if (onGraded) onGraded(result);
    } catch (err) {
      console.error('Grading failed:', err);
    }
  };

  const handleReview = async () => {
    try {
      await review(submissionId, teacherScore, teacherFeedback);
      await reload();
      setShowReviewForm(false);
    } catch (err) {
      console.error('Review failed:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading submission...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  if (!submission) {
    return <div style={{ padding: '20px' }}>Submission not found</div>;
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return '#FFA500';
      case 'grading':
        return '#2196F3';
      case 'graded':
        return '#4CAF50';
      case 'reviewed':
        return '#9C27B0';
      default:
        return '#999';
    }
  };

  const getPercentageColor = (percentage?: number) => {
    if (!percentage) return '#999';
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 80) return '#8BC34A';
    if (percentage >= 70) return '#FFC107';
    if (percentage >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h2>Assessment Submission</h2>

      {(actionError || error) && (
        <div style={{ padding: '10px', background: '#fee', border: '1px solid #fcc', borderRadius: '5px', marginBottom: '15px' }}>
          Error: {actionError || error}
        </div>
      )}

      {/* Submission Header */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', background: '#f9f9f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <strong>Student:</strong> {submission.student_username}
            <span style={{ marginLeft: '15px' }}>
              <strong>Activity ID:</strong> {submission.activity_id}
            </span>
          </div>
          <div
            style={{
              padding: '5px 15px',
              background: getStatusBadgeColor(submission.status),
              color: 'white',
              borderRadius: '15px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {submission.status.toUpperCase()}
          </div>
        </div>
        
        <div>
          <strong>Submitted:</strong> {new Date(submission.submitted_at!).toLocaleString()}
          {submission.graded_at && (
            <span style={{ marginLeft: '15px' }}>
              <strong>Graded:</strong> {new Date(submission.graded_at).toLocaleString()}
            </span>
          )}
        </div>

        {submission.rubric_title && (
          <div style={{ marginTop: '10px' }}>
            <strong>Rubric:</strong> {submission.rubric_title}
          </div>
        )}
      </div>

      {/* Question and Answer */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '15px' }}>
          <h3 style={{ marginTop: 0 }}>Question</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{submission.question_text}</p>
        </div>

        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', background: '#f9f9f9' }}>
          <h3 style={{ marginTop: 0 }}>Student Answer</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{submission.answer_text}</p>
        </div>
      </div>

      {/* Grading Section */}
      {submission.status === 'submitted' && submission.rubric && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #2196F3', borderRadius: '5px' }}>
          <h3>Grade with AI</h3>
          <p>This submission has a rubric attached. Click below to grade it automatically using AI.</p>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Additional Context (Optional):
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px' }}
              placeholder="Any additional context for the AI grader (course materials, previous discussions, etc.)"
            />
          </div>

          <button
            onClick={handleGrade}
            disabled={actionLoading}
            style={{
              padding: '10px 20px',
              background: actionLoading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
            }}
          >
            {actionLoading ? 'Grading...' : '🤖 Grade with AI'}
          </button>
        </div>
      )}

      {submission.status === 'grading' && (
        <div style={{ padding: '15px', background: '#E3F2FD', border: '1px solid #2196F3', borderRadius: '5px', marginBottom: '20px' }}>
          <strong>⏳ Grading in progress...</strong> Please wait while AI evaluates this submission.
        </div>
      )}

      {/* Score Display */}
      {(submission.status === 'graded' || submission.status === 'reviewed') && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Grade</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
            <div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: getPercentageColor(submission.percentage) }}>
                {submission.final_score?.toFixed(1) || 0} / {submission.max_score || 0}
              </div>
              <div style={{ fontSize: '24px', color: '#666' }}>
                {submission.percentage?.toFixed(1)}%
              </div>
            </div>

            {submission.graded_by_ai && (
              <div style={{ padding: '10px', background: '#E8F5E9', borderRadius: '5px', fontSize: '14px' }}>
                <div>✓ Graded by AI</div>
                <div style={{ color: '#666' }}>Model: {submission.ai_model_used}</div>
                {submission.tokens_used && <div style={{ color: '#666' }}>Tokens: {submission.tokens_used}</div>}
              </div>
            )}
          </div>

          {/* Criterion Scores */}
          {submission.criterion_scores && submission.criterion_scores.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h4>Criterion Breakdown</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Criterion</th>
                    <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>Score</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {submission.criterion_scores.map((cs) => (
                    <tr key={cs.id}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        <strong>{cs.criterion_name}</strong>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
                        {cs.final_points?.toFixed(1)} / {cs.criterion_max_points}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '14px' }}>
                        {cs.teacher_feedback || cs.feedback}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Overall Feedback */}
          <div>
            <h4>Overall Feedback</h4>
            <div style={{ padding: '10px', background: '#f9f9f9', borderRadius: '5px', whiteSpace: 'pre-wrap' }}>
              {submission.teacher_feedback || submission.feedback || 'No feedback provided.'}
            </div>
          </div>

          {/* Teacher Review Section */}
          {submission.status === 'graded' && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
              {!showReviewForm ? (
                <button
                  onClick={() => {
                    setTeacherScore(submission.score || 0);
                    setTeacherFeedback(submission.feedback || '');
                    setShowReviewForm(true);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#9C27B0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Override Grade (Teacher Review)
                </button>
              ) : (
                <div>
                  <h4>Teacher Review</h4>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      Adjusted Score (out of {submission.max_score}):
                    </label>
                    <input
                      type="number"
                      value={teacherScore}
                      onChange={(e) => setTeacherScore(parseFloat(e.target.value))}
                      step="0.5"
                      min="0"
                      max={submission.max_score || 100}
                      style={{ padding: '8px', width: '150px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      Additional Feedback:
                    </label>
                    <textarea
                      value={teacherFeedback}
                      onChange={(e) => setTeacherFeedback(e.target.value)}
                      rows={4}
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleReview}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 20px',
                        background: actionLoading ? '#ccc' : '#9C27B0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {actionLoading ? 'Saving...' : 'Submit Review'}
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      disabled={actionLoading}
                      style={{
                        padding: '10px 20px',
                        background: '#999',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
