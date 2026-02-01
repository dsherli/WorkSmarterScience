from typing import Dict, Any
from .base import BaseAgent

class FeedbackAgent(BaseAgent):
    """
    Agent responsible for providing constructive pedagogical feedback.
    """
    def __init__(self, client, model: str):
        super().__init__(client, model, name="FeedbackAgent")

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate feedback for student work.
        
        Context expected:
        - question_text: str
        - student_answer: str
        - grading_result: Dict (optional, result from GradingAgent)
        - activity_context: str
        """
        question_text = context.get("question_text", "")
        student_answer = context.get("student_answer", "")
        grading_result = context.get("grading_result")
        activity_context = context.get("activity_context", "")
        
        system_prompt = """You are a supportive and expert teacher.
Your task is to provide constructive feedback to a student based on their answer.
Focus on:
1. Validating what they got right (Strengths).
2. Guiding them on what to improve (Improvements/Growth).
3. Encouraging tone.

Output strictly as JSON:
{
  "feedback_text": "<paragraph addressed to student>",
  "strengths": ["point 1", "point 2"],
  "improvements": ["point 1", "point 2"]
}"""
        
        user_message = f"""Activity Context: {activity_context}
Question: {question_text}
Student Answer: {student_answer}
"""
        if grading_result:
            user_message += f"\nGrading Insight: The student scored {grading_result.get('total_score')}."

        result = self._chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.6, # Slightly higher for more natural, varied language
            json_output=True
        )

        return {
            "feedback_result": result["content"],
            "tokens_used": result["tokens_used"]
        }
