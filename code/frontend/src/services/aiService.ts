/**
 * AI Grading Service
 * Frontend service for interacting with OpenAI-powered grading endpoints
 */

const API_BASE = '/api/grading';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface EvaluateWorkRequest {
  question: string;
  student_answer: string;
  rubric?: string;
  context?: string;
  activity_id?: number;
}

export interface EvaluateWorkResponse {
  evaluation: string;
  model: string;
  tokens_used?: number;
}

export interface ChatCompletionRequest {
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  tokens_used?: number;
  finish_reason?: string;
}

export interface FeedbackRequest {
  prompt: string;
  context?: string;
  temperature?: number;
}

export interface FeedbackResponse {
  feedback: string;
  model: string;
  tokens_used?: number;
}

export interface HealthCheckResponse {
  configured: boolean;
  model?: string;
  service?: string;
}

/**
 * Get JWT token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Base fetch wrapper with JWT authentication
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if AI service is configured and healthy
 */
export async function checkAIHealth(): Promise<HealthCheckResponse> {
  return apiFetch<HealthCheckResponse>('/health/');
}

/**
 * Evaluate student work using AI
 */
export async function evaluateWork(
  request: EvaluateWorkRequest
): Promise<EvaluateWorkResponse> {
  return apiFetch<EvaluateWorkResponse>('/evaluate/', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Send a chat completion request
 */
export async function chatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  return apiFetch<ChatCompletionResponse>('/chat/', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Generate educational feedback
 */
export async function generateFeedback(
  request: FeedbackRequest
): Promise<FeedbackResponse> {
  return apiFetch<FeedbackResponse>('/feedback/', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Grade Submission Request/Response Types
 */
export interface GradeSubmissionRequest {
  submission_id: number;
  rubric_json?: Record<string, unknown>;
}

export interface GradingResult {
  question_number: number;
  question_text: string;
  student_answer: string;
  score: number;
  feedback: string;
  error?: string;
}

export interface GradeSubmissionResponse {
  submission_id: number;
  status: string;
  overall_score: number;
  answers_graded: number;
  tokens_used: number;
  results: GradingResult[];
}

export interface TeacherFeedbackRequest {
  answer_id: number;
  teacher_feedback?: string;
  score?: number;
}

export interface TeacherFeedbackResponse {
  answer_id: number;
  teacher_feedback: string | null;
  score: number | null;
  updated_at: string;
}

/**
 * Grade a science activity submission using AI
 */
export async function gradeSubmission(
  request: GradeSubmissionRequest
): Promise<GradeSubmissionResponse> {
  return apiFetch<GradeSubmissionResponse>('/grade-submission/', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Update teacher feedback for an answer
 */
export async function updateTeacherFeedback(
  request: TeacherFeedbackRequest
): Promise<TeacherFeedbackResponse> {
  return apiFetch<TeacherFeedbackResponse>('/teacher-feedback/', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
