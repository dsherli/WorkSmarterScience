from typing import Dict, Any
from .base import BaseAgent
import json

class CombinedGradingAgent(BaseAgent):
    """
    Agent responsible for BOTH quantitative grading AND providing feedback in a single pass.
    Optimized for lower latency.
    """
    def __init__(self, client, model: str):
        super().__init__(client, model, name="CombinedGradingAgent")

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate student work and provide feedback.
        
        Context expected:
        - question_text: str
        - student_answer: str
        - rubric_criteria: List[Dict] or str
        - max_score: int
        - activity_context: str
        """
        question_text = context.get("question_text", "")
        student_answer = context.get("student_answer", "")
        rubric_criteria = context.get("rubric_criteria", [])
        max_score = context.get("max_score", 100)
        activity_context = context.get("activity_context", "")

        # Format rubric
        rubric_text = ""
        if isinstance(rubric_criteria, str):
            rubric_text = rubric_criteria
        elif isinstance(rubric_criteria, list):
            for i, criterion in enumerate(rubric_criteria, 1):
                rubric_text += f"\nCriterion {i}: {criterion.get('title', 'Unnamed')}\n"
                rubric_text += f"Weight: {criterion.get('weight', 1.0)}\n"
                levels = criterion.get("levels", [])
                for level in levels:
                    rubric_text += f"  - {level.get('name', 'Level')}: {level.get('description', '')}\n"

        system_prompt = f"""You are an expert impartial grader AND a supportive teacher.
Your task is twofold:
1. Score the student's answer strictly based on the Rubric Criteria.
2. Provide constructive feedback to the student (Strengths, Improvements, and a message).

Maximum Total Score: {max_score}

Output strictly as JSON in the following structure:
{{
  "grading": {{
    "total_score": <number>,
    "criteria_scores": [
      {{
        "criterion_index": <0-based index>,
        "criterion_title": "<title>",
        "level_achieved": "<name of level matched>",
        "points_awarded": <number>,
        "reasoning": "<short justification>"
      }}
    ]
  }},
  "feedback": {{
    "feedback_text": "<paragraph addressed to student>",
    "strengths": ["point 1", "point 2"],
    "improvements": ["point 1", "point 2"]
  }}
}}"""

        user_message = f"""Activity Context: {activity_context}
Question: {question_text}
Student Answer: {student_answer}

Rubric Criteria:
{rubric_text}"""


        
        result = self._chat_completion(
             messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=1.0, 
            json_output=True
        )

        return {
            "combined_result": result["content"],
            "tokens_used": result["tokens_used"],
            "prompt_tokens": result.get("prompt_tokens", 0),
            "completion_tokens": result.get("completion_tokens", 0)
        }
