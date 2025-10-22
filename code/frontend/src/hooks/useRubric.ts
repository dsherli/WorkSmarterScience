/**
 * React hooks for rubric and assessment submission management
 */

import { useState, useCallback, useEffect } from 'react';
import {
  listRubrics,
  getRubric,
  createRubric,
  updateRubric,
  deleteRubric,
  listSubmissions,
  getSubmission,
  createSubmission,
  gradeSubmission,
  teacherReview,
} from '../services/rubricService';
import type { Rubric, AssessmentSubmission } from '../services/rubricService';

interface UseResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ==================== Rubric Hooks ====================

export function useRubrics(activity_id?: number) {
  const [state, setState] = useState<UseResourceState<Rubric[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const rubrics = await listRubrics(activity_id);
      setState({ data: rubrics, loading: false, error: null });
      return rubrics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load rubrics';
      setState({ data: null, loading: false, error: errorMessage });
      throw err;
    }
  }, [activity_id]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

export function useRubric(id?: number) {
  const [state, setState] = useState<UseResourceState<Rubric>>({
    data: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    if (!id) return;
    
    setState({ data: null, loading: true, error: null });
    try {
      const rubric = await getRubric(id);
      setState({ data: rubric, loading: false, error: null });
      return rubric;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load rubric';
      setState({ data: null, loading: false, error: errorMessage });
      throw err;
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

export function useRubricActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (rubric: Rubric) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createRubric(rubric);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create rubric';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  const update = useCallback(async (id: number, rubric: Partial<Rubric>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateRubric(id, rubric);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update rubric';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteRubric(id);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete rubric';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  return { create, update, remove, loading, error };
}

// ==================== Submission Hooks ====================

export function useSubmissions(activity_id?: number, status?: string) {
  const [state, setState] = useState<UseResourceState<AssessmentSubmission[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const submissions = await listSubmissions(activity_id, status);
      setState({ data: submissions, loading: false, error: null });
      return submissions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load submissions';
      setState({ data: null, loading: false, error: errorMessage });
      throw err;
    }
  }, [activity_id, status]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

export function useSubmission(id?: number) {
  const [state, setState] = useState<UseResourceState<AssessmentSubmission>>({
    data: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    if (!id) return;
    
    setState({ data: null, loading: true, error: null });
    try {
      const submission = await getSubmission(id);
      setState({ data: submission, loading: false, error: null });
      return submission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load submission';
      setState({ data: null, loading: false, error: errorMessage });
      throw err;
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

export function useSubmissionActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (submission: Partial<AssessmentSubmission>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createSubmission(submission);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create submission';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  const grade = useCallback(async (id: number, context?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await gradeSubmission(id, context);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to grade submission';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  const review = useCallback(async (id: number, teacher_score: number, teacher_feedback: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await teacherReview(id, teacher_score, teacher_feedback);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  return { create, grade, review, loading, error };
}
