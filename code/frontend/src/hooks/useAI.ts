/**
 * React hooks for AI-powered grading and feedback
 */

import { useState, useCallback } from 'react';
import {
  evaluateWork,
  chatCompletion,
  generateFeedback,
  checkAIHealth,
} from '../services/aiService';
import type {
  EvaluateWorkRequest,
  ChatCompletionRequest,
  FeedbackRequest,
  Message,
} from '../services/aiService';

interface UseAIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for evaluating student work
 */
export function useEvaluateWork() {
  const [state, setState] = useState<UseAIState<string>>({
    data: null,
    loading: false,
    error: null,
  });

  const evaluate = useCallback(async (request: EvaluateWorkRequest) => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await evaluateWork(request);
      setState({ data: response.evaluation, loading: false, error: null });
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to evaluate work';
      setState({ data: null, loading: false, error: errorMessage });
      throw err;
    }
  }, []);

  return { ...state, evaluate };
}

/**
 * Hook for chat completions
 */
export function useChatCompletion() {
  const [state, setState] = useState<UseAIState<string>>({
    data: null,
    loading: false,
    error: null,
  });

  const chat = useCallback(async (messages: Message[], options?: Partial<ChatCompletionRequest>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await chatCompletion({ messages, ...options });
      setState({ data: response.content, loading: false, error: null });
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chat request failed';
      setState({ data: null, loading: false, error: errorMessage });
      throw err;
    }
  }, []);

  return { ...state, chat };
}

/**
 * Hook for generating feedback
 */
export function useFeedback() {
  const [state, setState] = useState<UseAIState<string>>({
    data: null,
    loading: false,
    error: null,
  });

  const getFeedback = useCallback(async (request: FeedbackRequest) => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await generateFeedback(request);
      setState({ data: response.feedback, loading: false, error: null });
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate feedback';
      setState({ data: null, loading: false, error: errorMessage });
      throw err;
    }
  }, []);

  return { ...state, getFeedback };
}

/**
 * Hook for checking AI service health
 */
export function useAIHealth() {
  const [state, setState] = useState<UseAIState<{
    configured: boolean;
    model?: string;
    service?: string;
  }>>({
    data: null,
    loading: false,
    error: null,
  });

  const check = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await checkAIHealth();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      setState({ data: null, loading: false, error: errorMessage });
      throw err;
    }
  }, []);

  return { ...state, check };
}
