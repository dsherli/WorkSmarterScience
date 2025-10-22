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
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Base fetch wrapper with authentication and CSRF
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const csrfToken = getCsrfToken();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
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
