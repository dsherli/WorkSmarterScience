/**
 * Rubric and Assessment Grading Service
 * API client for rubric management and submission grading
 */

const API_BASE = '/api/grading';

export interface RubricCriterion {
  id?: number;
  name: string;
  description: string;
  max_points: number;
  weight: number;
  order: number;
}

export interface Rubric {
  id?: number;
  title: string;
  description: string;
  activity_id?: number;
  created_by?: number;
  created_by_username?: string;
  created_at?: string;
  updated_at?: string;
  is_active: boolean;
  total_points: number;
  criteria: RubricCriterion[];
}

export interface CriterionScore {
  id?: number;
  criterion: number;
  criterion_name?: string;
  criterion_max_points?: number;
  points_earned: number;
  feedback: string;
  teacher_points?: number;
  teacher_feedback?: string;
  final_points?: number;
}

export interface AssessmentSubmission {
  id?: number;
  student: number;
  student_username?: string;
  activity_id: number;
  question_text: string;
  answer_text: string;
  rubric?: number;
  rubric_title?: string;
  status: 'submitted' | 'grading' | 'graded' | 'reviewed';
  score?: number;
  max_score?: number;
  feedback?: string;
  submitted_at?: string;
  graded_at?: string;
  graded_by_ai?: boolean;
  ai_model_used?: string;
  tokens_used?: number;
  teacher_score?: number;
  teacher_feedback?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  final_score?: number;
  percentage?: number;
  criterion_scores?: CriterionScore[];
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
 * Base fetch wrapper
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
    throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ==================== Rubric APIs ====================

export async function listRubrics(activity_id?: number): Promise<Rubric[]> {
  const params = activity_id ? `?activity_id=${activity_id}` : '';
  return apiFetch<Rubric[]>(`/rubrics/${params}`);
}

export async function getRubric(id: number): Promise<Rubric> {
  return apiFetch<Rubric>(`/rubrics/${id}/`);
}

export async function createRubric(rubric: Rubric): Promise<Rubric> {
  return apiFetch<Rubric>('/rubrics/', {
    method: 'POST',
    body: JSON.stringify(rubric),
  });
}

export async function updateRubric(id: number, rubric: Partial<Rubric>): Promise<Rubric> {
  return apiFetch<Rubric>(`/rubrics/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(rubric),
  });
}

export async function deleteRubric(id: number): Promise<void> {
  await apiFetch<void>(`/rubrics/${id}/`, {
    method: 'DELETE',
  });
}

// ==================== Submission APIs ====================

export async function listSubmissions(activity_id?: number, status?: string): Promise<AssessmentSubmission[]> {
  const params = new URLSearchParams();
  if (activity_id) params.append('activity_id', activity_id.toString());
  if (status) params.append('status', status);
  
  const queryString = params.toString();
  return apiFetch<AssessmentSubmission[]>(`/submissions/${queryString ? '?' + queryString : ''}`);
}

export async function getSubmission(id: number): Promise<AssessmentSubmission> {
  return apiFetch<AssessmentSubmission>(`/submissions/${id}/`);
}

export async function createSubmission(submission: Partial<AssessmentSubmission>): Promise<AssessmentSubmission> {
  return apiFetch<AssessmentSubmission>('/submissions/', {
    method: 'POST',
    body: JSON.stringify(submission),
  });
}

export async function gradeSubmission(id: number, context?: string): Promise<AssessmentSubmission> {
  return apiFetch<AssessmentSubmission>(`/submissions/${id}/grade/`, {
    method: 'POST',
    body: JSON.stringify({ context: context || '' }),
  });
}

export async function teacherReview(id: number, teacher_score: number, teacher_feedback: string): Promise<AssessmentSubmission> {
  return apiFetch<AssessmentSubmission>(`/submissions/${id}/review/`, {
    method: 'POST',
    body: JSON.stringify({ teacher_score, teacher_feedback }),
  });
}
