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


class AIService:
    """
    Service for interacting with OpenAI or Azure OpenAI for grading.
    Implements singleton pattern via get_ai_service().
    """

    def __init__(self):
        self._client = None
        self._model = None
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
        azure_deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4")
        azure_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

        if azure_endpoint and azure_key:
            try:
                self._client = AzureOpenAI(
                    azure_endpoint=azure_endpoint,
                    api_key=azure_key,
                    api_version=azure_version,
                    http_client=None,  # Avoid proxy issues
                )
                self._model = azure_deployment
                self._service_type = "Azure OpenAI"
                logger.info(f"AI Service initialized with Azure OpenAI (deployment: {azure_deployment})")
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
                    self._model = azure_deployment
                    self._service_type = "Azure OpenAI"
                    logger.info(f"AI Service initialized with Azure OpenAI (deployment: {azure_deployment})")
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
                self._model = os.environ.get("OPENAI_MODEL", "gpt-4")
                self._service_type = "OpenAI"
                logger.info(f"AI Service initialized with OpenAI (model: {self._model})")
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
            "model": self._model,
            "service": self._service_type,
        }

    def chat_completion(
        self,
        messages: list[dict],
        temperature: float = 0.3,
        max_tokens: Optional[int] = None,
    ) -> dict:
        """
        Send a chat completion request to the AI model.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens in response

        Returns:
            dict with 'content', 'model', 'tokens_used', 'finish_reason'
        """
        if not self.is_configured():
            raise RuntimeError("AI service not configured")

        kwargs = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens:
            kwargs["max_tokens"] = max_tokens

        response = self._client.chat.completions.create(**kwargs)
        choice = response.choices[0]

        return {
            "content": choice.message.content,
            "model": self._model,
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

        Args:
            question: The question the student answered
            student_answer: The student's response
            rubric: Optional grading criteria
            context: Optional additional context

        Returns:
            dict with 'evaluation' (JSON string), 'model', 'tokens_used'
        """
        system_prompt = """You are an expert educational assessor for K-12 science education.
Your task is to evaluate student work fairly and provide constructive feedback.
Always respond with a valid JSON object containing:
{
  "score": <number 0-100>,
  "strengths": ["list of things done well"],
  "improvements": ["list of areas to improve"],
  "feedback": "constructive feedback paragraph for the student"
}"""

        user_message = f"Question: {question}\n\nStudent Answer: {student_answer}"
        
        if rubric:
            user_message += f"\n\nGrading Criteria/Rubric:\n{rubric}"
        if context:
            user_message += f"\n\nAdditional Context:\n{context}"

        result = self.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
        )

        return {
            "evaluation": result["content"],
            "model": result["model"],
            "tokens_used": result["tokens_used"],
        }

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

        system_prompt = f"""You are an expert K-12 science educator grading student work.
Use the provided rubric to evaluate the student's response.
Maximum score: {max_score}

Respond with a valid JSON object:
{{
  "total_score": <number>,
  "criteria_scores": [
    {{
      "criterion_index": <0-based index>,
      "criterion_title": "<title>",
      "level_achieved": "<Proficient/Developing/Beginning>",
      "points": <number>,
      "feedback": "<specific feedback for this criterion>"
    }}
  ],
  "overall_feedback": "<comprehensive feedback for the student>",
  "strengths": ["list of strengths"],
  "improvements": ["areas for improvement"]
}}"""

        user_message = f"""Question: {question_text}

Student Answer: {student_answer}

Rubric Criteria:
{criteria_text}"""

        result = self.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
        )

        try:
            parsed = json.loads(result["content"])
        except json.JSONDecodeError:
            # Try to extract JSON from response
            content = result["content"]
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                try:
                    parsed = json.loads(content[start:end])
                except json.JSONDecodeError:
                    parsed = {
                        "total_score": 0,
                        "criteria_scores": [],
                        "overall_feedback": content,
                        "strengths": [],
                        "improvements": ["Unable to parse structured response"],
                    }
            else:
                parsed = {
                    "total_score": 0,
                    "criteria_scores": [],
                    "overall_feedback": content,
                    "strengths": [],
                    "improvements": ["Unable to parse structured response"],
                }

        return {
            **parsed,
            "model": result["model"],
            "tokens_used": result["tokens_used"],
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
        )

        return {
            "feedback": result["content"],
            "model": result["model"],
            "tokens_used": result["tokens_used"],
        }


# Singleton instance
_ai_service_instance: Optional[AIService] = None


def get_ai_service() -> AIService:
    """Get or create the singleton AIService instance."""
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIService()
    return _ai_service_instance
