"""
AI Grading Service
Provides OpenAI/Azure OpenAI integration for automated grading and feedback.
"""

import json
import os
import logging
from typing import Optional
from django.conf import settings

logger = logging.getLogger(__name__)

# Try to import openai, handle if not installed
try:
    from openai import AzureOpenAI, OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI package not installed. AI grading will be unavailable.")

# Import new Agents
try:
    from agents.grading_agent import GradingAgent
    from agents.feedback_agent import FeedbackAgent
    from agents.combined_agent import CombinedGradingAgent
except ImportError:
    logger.warning("Could not import Agents. Make sure they are in the python path.")


class AIService:
    """
    Service for interacting with OpenAI or Azure OpenAI for grading.
    Implements singleton pattern via get_ai_service().
    """

    def __init__(self):
        self._client = None
        self._model_reasoning = None  # Primary (High IQ)
        self._model_fast = None       # Secondary (Fast/Cheap)
        self._service_type = None
        self._initialize()

    def _initialize(self):
        """Initialize the OpenAI client based on environment configuration."""
        if not OPENAI_AVAILABLE:
            logger.warning("OpenAI package not available")
            return

        # Check for Azure OpenAI first (takes precedence)
        azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
        azure_key = os.environ.get("AZURE_OPENAI_API_KEY")
        azure_deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-5")
        # New: Fast model deployment
        azure_deployment_fast = os.environ.get("AZURE_OPENAI_DEPLOYMENT_FAST", "gpt-5-mini")
        
        azure_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")

        if azure_endpoint and azure_key:
            try:
                self._client = AzureOpenAI(
                    azure_endpoint=azure_endpoint,
                    api_key=azure_key,
                    api_version=azure_version,
                    http_client=None,  # Avoid proxy issues
                )
                self._model_reasoning = azure_deployment
                self._model_fast = azure_deployment_fast
                self._service_type = "Azure OpenAI"
                logger.info(f"AI Service initialized with Azure OpenAI (Reasoning: {azure_deployment}, Fast: {azure_deployment_fast})")
                return
            except TypeError as te:
                # Fallback for older versions that don't support http_client
                logger.warning(f"Retrying Azure OpenAI init without http_client: {te}")
                try:
                    self._client = AzureOpenAI(
                        azure_endpoint=azure_endpoint,
                        api_key=azure_key,
                        api_version=azure_version,
                    )
                    self._model_reasoning = azure_deployment
                    self._model_fast = azure_deployment_fast
                    self._service_type = "Azure OpenAI"
                    logger.info(f"AI Service initialized with Azure OpenAI (Reasoning: {azure_deployment}, Fast: {azure_deployment_fast})")
                    return
                except Exception as e2:
                    logger.error(f"Failed to initialize Azure OpenAI: {e2}")
            except Exception as e:
                logger.error(f"Failed to initialize Azure OpenAI: {e}")

        # Fall back to standard OpenAI
        openai_key = os.environ.get("OPENAI_API_KEY")
        if openai_key:
            try:
                self._client = OpenAI(api_key=openai_key)
                self._model_reasoning = os.environ.get("OPENAI_MODEL", "gpt-5")
                self._model_fast = os.environ.get("OPENAI_MODEL_FAST", "gpt-5-mini")
                self._service_type = "OpenAI"
                logger.info(f"AI Service initialized with OpenAI (Reasoning: {self._model_reasoning}, Fast: {self._model_fast})")
                return
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI: {e}")

        logger.warning("No AI service configured. Set AZURE_OPENAI_* or OPENAI_API_KEY.")

    def is_configured(self) -> bool:
        """Check if the AI service is properly configured."""
        return self._client is not None

    def get_config_info(self) -> dict:
        """Return configuration information for health checks."""
        return {
            "configured": self.is_configured(),
            "model_reasoning": self._model_reasoning,
            "model_fast": self._model_fast,
            "service": self._service_type,
        }

    def chat_completion(
        self,
        messages: list[dict],
        temperature: float = 0.3,
        max_tokens: Optional[int] = None,
        model_type: str = "reasoning",
    ) -> dict:
        """
        Send a chat completion request to the AI model.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens in response
            model_type: "reasoning" (default) or "fast"

        Returns:
            dict with 'content', 'model', 'tokens_used', 'finish_reason'
        """
        if not self.is_configured():
            raise RuntimeError("AI service not configured")
        
        # Select model based on type
        selected_model = self._model_fast if model_type == "fast" else self._model_reasoning

        kwargs = {
            "model": selected_model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens:
            kwargs["max_tokens"] = max_tokens

        response = self._client.chat.completions.create(**kwargs)
        choice = response.choices[0]

        return {
            "content": choice.message.content,
            "model": selected_model,
            "tokens_used": response.usage.total_tokens if response.usage else None,
            "finish_reason": choice.finish_reason,
        }

    def evaluate_student_work(
        self,
        question: str,
        student_answer: str,
        rubric: Optional[str] = None,
        context: Optional[str] = None,
    ) -> dict:
        """
        Evaluate a student's answer using AI.
        """
        # Instantiate Agents with Reasoning Model
        # Using CombinedAgent for lower latency
        combined_agent = CombinedGradingAgent(self._client, self._model_reasoning)
        
        # Prepare context
        ctx = {
            "question_text": question,
            "student_answer": student_answer,
            "rubric_criteria": rubric or "No rubric provided", 
            "max_score": 100,
            "activity_context": context or ""
        }
        
        res = combined_agent.run(ctx)
        combined_data = res.get("combined_result", {})
        
        # Identify if combined_data is dict or string (Agent should return dict if json_output=True works)
        # But base.py might return string if not parsed. checking base.py logic... 
        # base.py parses if json_output=True. So it should be dict.
        
        grading_data = combined_data.get("grading", {})
        feedback_data = combined_data.get("feedback", {})
        
        # Merge results to match expected output format of legacy code
        # Expected: score, strengths, improvements, feedback
        combined_result = {
            "score": grading_data.get("total_score", 0),
            "strengths": feedback_data.get("strengths", []),
            "improvements": feedback_data.get("improvements", []),
            "feedback": feedback_data.get("feedback_text", "No feedback generated.")
        }
        
        return {
            "evaluation": json.dumps(combined_result),
            "model": self._model_reasoning,
            "tokens_used": res.get("tokens_used", 0),
            "prompt_tokens": res.get("prompt_tokens", 0),
            "completion_tokens": res.get("completion_tokens", 0)
        }

    def generate_student_groups(
        self,
        student_data: list[dict],
        activity_context: str,
        strategy: str = "heterogeneous",
        group_size: int = 4
    ) -> dict:
        """
        Group students using the Multi-Agent System.
        """
        if not self.is_configured():
            raise RuntimeError("AI service not configured")
            
        try:
            from agents.coordinator import AgentCoordinator
            # Grouping is complex -> Reasoning model
            coordinator = AgentCoordinator(self._client, self._model_reasoning)
            return coordinator.generate_student_groups(
                student_data=student_data,
                activity_context=activity_context,
                strategy=strategy,
                group_size=group_size
            )
        except Exception as e:
            logger.error(f"AI Grouping failed: {e}")
            raise e

    def summarize_discussion(
        self,
        messages: list[dict],
        discussion_topic: str = "",
        discussion_questions: list[str] = []
    ) -> dict:
        """
        Summarize discussion messages using agents.
        """
        if not self.is_configured():
            raise RuntimeError("AI service not configured")
            
        try:
            from agents.coordinator import AgentCoordinator
            # Summarization is a good candidate for FAST model
            coordinator = AgentCoordinator(self._client, self._model_fast)
            return coordinator.summarize_discussion(
                messages=messages,
                discussion_topic=discussion_topic,
                discussion_questions=discussion_questions
            )
        except Exception as e:
            logger.error(f"AI Summarization failed: {e}")
            raise e

    def grade_with_rubric(
        self,
        question_text: str,
        student_answer: str,
        rubric_criteria: list[dict],
        max_score: int = 100,
    ) -> dict:
        """
        Grade a student answer using a structured rubric.

        Args:
            question_text: The question
            student_answer: Student's response
            rubric_criteria: List of criteria dicts with title, levels, weight
            max_score: Maximum possible score

        Returns:
            dict with score, criteria_scores, overall_feedback, model, tokens_used
        """
        criteria_text = ""
        for i, criterion in enumerate(rubric_criteria, 1):
            criteria_text += f"\nCriterion {i}: {criterion.get('title', 'Unnamed')}\n"
            criteria_text += f"Weight: {criterion.get('weight', 1.0)}\n"
            levels = criterion.get("levels", [])
            for level in levels:
                criteria_text += f"  - {level.get('name', 'Level')}: {level.get('description', '')}\n"

        # Prepare rubric text context (kept for backward compat in context, but Agent handles it better if passed structs)
        # Assuming Agents are flexible, but let's pass the text version to be safe as per GradingAgent design
        
        # Instantiate Agents with Reasoning Model
        grading_agent = GradingAgent(self._client, self._model_reasoning)
        feedback_agent = FeedbackAgent(self._client, self._model_reasoning)
        
        # 1. Grading
        grading_ctx = {
            "question_text": question_text,
            "student_answer": student_answer,
            "rubric_criteria": criteria_text, # Passing the pre-formatted text
            "max_score": max_score
        }
        g_res = grading_agent.run(grading_ctx)
        grade_data = g_res.get("grading_result", {})
        
        # 2. Feedback (Optional here since GradingAgent returns detailed breakdown, but we might want overall summary)
        # grade_with_rubric expects detailed criteria scores.
        # GradingAgent already returns criteria_scores. 
        # We need "overall_feedback", "strengths", "improvements"
        
        feedback_ctx = {
            "question_text": question_text,
            "student_answer": student_answer,
            "grading_result": grade_data,
            "activity_context": "Rubric Grading"
        }
        f_res = feedback_agent.run(feedback_ctx)
        feedback_data = f_res.get("feedback_result", {})
        
        parsed = {
            "total_score": grade_data.get("total_score", 0),
            "criteria_scores": grade_data.get("criteria_scores", []),
            "overall_feedback": feedback_data.get("feedback_text", ""),
            "strengths": feedback_data.get("strengths", []),
            "improvements": feedback_data.get("improvements", [])
        }

        return {
            **parsed,
            "model": self._model_reasoning,
            "tokens_used": g_res.get("tokens_used", 0) + f_res.get("tokens_used", 0),
        }

    def generate_feedback(
        self,
        prompt: str,
        context: Optional[str] = None,
        temperature: float = 0.7,
    ) -> dict:
        """
        Generate educational feedback or explanation.

        Args:
            prompt: The question or topic
            context: Additional context
            temperature: Creativity level

        Returns:
            dict with 'feedback', 'model', 'tokens_used'
        """
        system_prompt = """You are a helpful K-12 science educator.
Provide clear, age-appropriate explanations and feedback.
Be encouraging while maintaining accuracy."""

        user_message = prompt
        if context:
            user_message = f"{context}\n\n{prompt}"

        result = self.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=temperature,
            model_type="reasoning", # Feedback quality is important
        )

        return {
            "feedback": result["content"],
            "model": result["model"],
            "tokens_used": result["tokens_used"],
        }

    def generate_group_discussion_questions(
        self,
        activity_metadata: dict,
        rubric_criteria: list[dict],
        student_responses: list[dict],
        num_questions: int = 4,
    ) -> dict:
        """
        Generate AI-powered follow-up discussion questions for a student group
        based on their collective responses to an assessment.
        
        Refactored to use Multi-Agent System (Analysis -> Strategy -> Generation).

        Args:
            activity_metadata: Dict with activity info (title, task, questions, etc.)
            rubric_criteria: List of rubric criteria used for grading
            student_responses: List of dicts with student answers and feedback
            num_questions: Number of discussion questions to generate

        Returns:
            dict with 'questions' (list of question dicts), 'summary', 'model', 'tokens_used'
        """
        if not self.is_configured():
            raise RuntimeError("AI service not configured")

        try:
            from agents.coordinator import AgentCoordinator
            
            # Discussion generation is complex -> Reasoning model
            coordinator = AgentCoordinator(self._client, self._model_reasoning)
            result = coordinator.generate_discussion_questions(
                activity_metadata=activity_metadata,
                student_responses=student_responses,
                rubric_criteria=rubric_criteria,
                num_questions=num_questions
            )
            return result
            
        except ImportError:
            logger.error("Failed to import AgentCoordinator. Falling back to simple generation.")
            # Fallback logic could go here, or just re-raise
            raise
        except Exception as e:
            logger.error(f"Multi-Agent Generation failed: {e}")
            # Fallback to simple error response
            return {
                "summary": "Error in AI generation",
                "questions": [{
                    "prompt_order": 1,
                    "prompt_text": "We encountered an error generating questions. Please discuss your answers with your group.",
                    "prompt_type": "reflection",
                    "rationale": f"Error: {str(e)}"
                }],
                "model": self._model_reasoning,
                "tokens_used": 0,
            }


# Singleton instance
_ai_service_instance: Optional[AIService] = None


def get_ai_service() -> AIService:
    """Get or create the singleton AIService instance."""
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIService()
    return _ai_service_instance
