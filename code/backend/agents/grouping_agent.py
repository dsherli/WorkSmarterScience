from typing import Dict, Any, List
from .base import BaseAgent
import json

class GroupingAgent(BaseAgent):
    """
    Agent responsible for grouping students based on their responses.
    """
    def __init__(self, client, model: str):
        super().__init__(client, model, name="GroupingAgent")

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Group students based on the provided strategy.
        
        Context expected:
        - student_data: List[Dict] (id, name, answers_text)
        - num_groups: int (optional target number of groups)
        - group_size: int (optional target size per group)
        - strategy: str ("homogeneous" | "heterogeneous")
        - activity_context: str (topic/question info)
        """
        student_data = context.get("student_data", [])
        strategy = context.get("strategy", "heterogeneous")
        activity_context = context.get("activity_context", "")
        
        # Determine strict constraints
        num_students = len(student_data)
        if num_students < 2:
            return {"groups": [{"group_id": 1, "student_ids": [s["id"] for s in student_data], "reasoning": "Too few students to group"}]}

        target_group_size = context.get("group_size", 4)
        target_num_groups = context.get("num_groups", max(1, num_students // target_group_size))

        strategy_desc = ""
        if strategy == "homogeneous":
            strategy_desc = "Group students with SIMILAR levels of understanding or similar misconceptions together. This is good for targeted intervention or debates between opposing views."
        else: # heterogeneous
            strategy_desc = "Group students with MIXED levels of understanding. Mix high-performing students with those struggling. This is good for peer tutoring."

        system_prompt = f"""You are an expert classroom manager and pedagogical planner.
Your task is to group students into {target_num_groups} working groups based on their responses.

Strategy: {strategy}
{strategy_desc}

Constraints:
- Every student MUST be assigned to exactly one group.
- Groups should be roughly equal in size.
- Explain the reasoning for each group composition briefly.

Output strictly as JSON:
{{
  "groups": [
    {{
      "group_id": 1,
      "student_ids": [101, 102, ...],
      "reasoning": "These students all showed..."
    }},
    ...
  ]
}}"""

        # Format student data for the prompt to be token-efficient
        students_text = ""
        for s in student_data:
            # truncate answers to avoid token limits if necessary
            answers = s.get('answers_text', '')[:500] 
            students_text += f"ID {s['id']} ({s.get('name', 'Student')}): {answers}\n\n"

        user_message = f"""Activity Context: {activity_context}

List of Students and their Responses:
{students_text}

Recall the Strategy: {strategy}
Generate {target_num_groups} groups."""

        result = self._chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.4, # Slightly higher than 0 for some creative clustering but still structured
            json_output=True
        )

        return {
            "groups": result["content"].get("groups", []),
            "strategy_used": strategy,
            "tokens_used": result["tokens_used"]
        }
