/**
 * Example component demonstrating OpenAI integration
 * This shows how to use the AI hooks in your components
 */

import { useState } from 'react';
import { useEvaluateWork, useFeedback, useAIHealth } from '../hooks/useAI';

export default function AIExample() {
  const [question, setQuestion] = useState('What is photosynthesis?');
  const [answer, setAnswer] = useState('Photosynthesis is the process where plants convert sunlight into energy.');
  const [prompt, setPrompt] = useState('Explain the water cycle in simple terms.');
  
  const { data: evaluation, loading: evaluating, error: evalError, evaluate } = useEvaluateWork();
  const { data: feedback, loading: generating, error: feedbackError, getFeedback } = useFeedback();
  const { data: health, loading: checking, error: healthError, check } = useAIHealth();

  const handleEvaluate = async () => {
    try {
      await evaluate({
        question,
        student_answer: answer,
        rubric: 'Accuracy: 40%, Completeness: 30%, Clarity: 30%'
      });
    } catch (err) {
      console.error('Evaluation failed:', err);
    }
  };

  const handleFeedback = async () => {
    try {
      await getFeedback({ prompt, temperature: 0.7 });
    } catch (err) {
      console.error('Feedback generation failed:', err);
    }
  };

  const handleHealthCheck = async () => {
    try {
      await check();
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>OpenAI Integration Demo</h1>
      
      {/* Health Check Section */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>AI Service Health Check</h2>
        <button onClick={handleHealthCheck} disabled={checking}>
          {checking ? 'Checking...' : 'Check AI Service'}
        </button>
        
        {healthError && <p style={{ color: 'red' }}>Error: {healthError}</p>}
        {health && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '3px' }}>
            <p><strong>Configured:</strong> {health.configured ? '✅ Yes' : '❌ No'}</p>
            {health.model && <p><strong>Model:</strong> {health.model}</p>}
            {health.service && <p><strong>Service:</strong> {health.service}</p>}
          </div>
        )}
      </section>

      {/* Evaluate Work Section */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Evaluate Student Work</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Question:</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Student Answer:</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <button onClick={handleEvaluate} disabled={evaluating}>
          {evaluating ? 'Evaluating...' : 'Evaluate'}
        </button>
        
        {evalError && <p style={{ color: 'red' }}>Error: {evalError}</p>}
        {evaluation && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e9', borderRadius: '3px' }}>
            <h3>Evaluation Result:</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{evaluation}</pre>
          </div>
        )}
      </section>

      {/* Generate Feedback Section */}
      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Generate Educational Feedback</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Prompt:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <button onClick={handleFeedback} disabled={generating}>
          {generating ? 'Generating...' : 'Get Feedback'}
        </button>
        
        {feedbackError && <p style={{ color: 'red' }}>Error: {feedbackError}</p>}
        {feedback && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#e3f2fd', borderRadius: '3px' }}>
            <h3>Feedback:</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{feedback}</p>
          </div>
        )}
      </section>

      {/* Usage Instructions */}
      <section style={{ padding: '15px', background: '#fff9c4', borderRadius: '5px' }}>
        <h3>📝 Setup Instructions</h3>
        <ol>
          <li>Copy <code>.env.example</code> to <code>.env</code> in the project root</li>
          <li>Add your <code>OPENAI_API_KEY</code> or Azure OpenAI credentials</li>
          <li>Restart the Django backend: <code>python manage.py runserver</code></li>
          <li>Make sure you're logged in (these endpoints require authentication)</li>
          <li>Click "Check AI Service" to verify configuration</li>
        </ol>
        <p><strong>Note:</strong> You must be authenticated to use these features. Visit the login page first.</p>
      </section>
    </div>
  );
}
