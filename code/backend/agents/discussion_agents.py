from typing import Dict, Any, List
from .base import BaseAgent

class DiscussionAnalysisAgent(BaseAgent):
    """
    Analyzes student responses to identify common misconceptions, consistency, and outliers.
    """
    def __init__(self, client, model: str):
        super().__init__(client, model, name="AnalysisAgent")

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        activity_metadata = context.get("activity_metadata", {})
        student_responses = context.get("student_responses", [])
        
        system_prompt = """You are an expert educational researcher. 
Your task is to analyze a set of student responses to a science assessment.
Identify:
1. Common themes and shared understanding.
2. Major misconceptions or gaps in knowledge.
3. Outlier responses (significantly better or worse than average).
4. The overall "Knowledge State" of the group.

Output strictly as JSON."""

        user_message = f"""Activity: {activity_metadata.get('title')}
Task: {activity_metadata.get('task')}

Student Responses:
{self._format_responses(student_responses)}
"""

        result = self._chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,
            json_output=True
        )
        
        return {
            "knowledge_state": result["content"],
            "tokens_used": result["tokens_used"]
        }

    def _format_responses(self, responses: List[Dict]) -> str:
        text = ""
        for i, r in enumerate(responses):
            text += f"Student {i+1}: "
            for ans in r.get("answers", []):
                text += f"(Q: {ans.get('question_text')} A: {ans.get('student_answer')}) "
            text += "\n"
        return text


class DiscussionStrategyAgent(BaseAgent):
    """
    Decides on the pedagogical strategy and question types based on the analysis.
    """
    def __init__(self, client, model: str):
        super().__init__(client, model, name="StrategyAgent")

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        knowledge_state = context.get("knowledge_state", {})
        num_questions = context.get("num_questions", 4)
        rubric_criteria = context.get("rubric_criteria", [])

        system_prompt = f"""You are a pedagogical strategist.
Based on the provided Knowledge State of the student group and the Rubric, decide on {num_questions} discussion questions.

Strategies:
- If misconceptions exist -> 'follow_up' to correct them.
- If understanding is solid -> 'extension' to apply knowledge elsewhere.
- If understanding is mixed -> 'reflection' to compare ideas.
- If unsure -> 'check_in' to verify basics.

Output strictly as JSON:
{{
  "summary_of_strategy": "...",
  "question_plan": [
    {{
      "order": 1,
      "type": "follow_up" | "extension" | "reflection" | "check_in",
      "goal": "Specific goal for this question",
      "target_concept": "Concept to address"
    }},
    ...
  ]
}}"""

        user_message = f"""Knowledge State:
{knowledge_state}

Rubric Criteria:
{rubric_criteria}
"""

        result = self._chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.5,
            json_output=True
        )

        return {
            "strategy": result["content"],
            "tokens_used": result["tokens_used"]
        }


class DiscussionGenerationAgent(BaseAgent):
    """
    Generates the actual discussion questions based on the strategy.
    """
    def __init__(self, client, model: str):
        super().__init__(client, model, name="GenerationAgent")

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        strategy = context.get("strategy", {})
        activity_metadata = context.get("activity_metadata", {})
        knowledge_state = context.get("knowledge_state", {})

        system_prompt = """You are a master teacher and facilitator.
Your goal is to write engaging, clear, and age-appropriate discussion questions based on the provided plan.
Do not change the plan, just execute it perfectly.

Output strictly as JSON:
{
  "questions": [
    {
      "prompt_order": <int>,
      "prompt_text": "<text>",
      "prompt_type": "<type>",
      "rationale": "<why>"
    }
  ]
}"""

        user_message = f"""Activity: {activity_metadata.get('title')}
Knowledge Context: {knowledge_state}

Question Plan:
{strategy.get('question_plan')}
"""

        result = self._chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            json_output=True
        )

        return {
            "generated_questions": result["content"],
            "tokens_used": result["tokens_used"]
        }
