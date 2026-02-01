from typing import Dict, Any, List, Optional
from .base import BaseAgent
import json

class GradingAgent(BaseAgent):
    """
    Agent responsible for quantitative grading of student work against a rubric.
    """
    def __init__(self, client, model: str):
        super().__init__(client, model, name="GradingAgent")

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate student work.
        
        Context expected:
        - question_text: str
        - student_answer: str
        - rubric_criteria: List[Dict] or str (JSON dump)
        - max_score: int (default 100)
        """
        question_text = context.get("question_text", "")
        student_answer = context.get("student_answer", "")
        rubric_criteria = context.get("rubric_criteria", [])
        max_score = context.get("max_score", 100)
        
        # Format rubric for prompt
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

        system_prompt = f"""You are an expert impartial grader.
Your task is to score the student's answer strictly based on the provided Rubric Criteria.
Maximum Total Score: {max_score}

Output strictly as JSON:
{{
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
}}"""

        user_message = f"""Question: {question_text}
Student Answer: {student_answer}

Rubric Criteria:
{rubric_text}"""

        result = self._chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.0, # Strict grading requires deterministic output
            json_output=True
        )

        return {
            "grading_result": result["content"],
            "tokens_used": result["tokens_used"]
        }
