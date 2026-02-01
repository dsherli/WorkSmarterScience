from typing import Dict, Any, List
from .base import BaseAgent
import json

class SummarizationAgent(BaseAgent):
    """
    Agent responsible for summarizing group discussions.
    """
    def __init__(self, client, model: str):
        super().__init__(client, model, name="SummarizationAgent")

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Summarize the provided discussion messages.
        
        Context expected:
        - messages: List[Dict] (sender, text, timestamp)
        - discussion_topic: str (optional context)
        - discussion_questions: List[str] (optional context)
        """
        messages = context.get("messages", [])
        discussion_topic = context.get("discussion_topic", "General Discussion")
        discussion_questions = context.get("discussion_questions", [])
        
        if not messages:
            return {
                "summary": "No discussion messages to summarize.",
                "participation_stats": {},
                "tokens_used": 0
            }

        # Format messages for the prompt
        transcript = ""
        participants = set()
        for msg in messages:
            sender = msg.get("sender", "Unknown")
            text = msg.get("text", "")
            transcript += f"{sender}: {text}\n"
            participants.add(sender)

        system_prompt = """You are an expert impartial observer of student group discussions.
Your task is to summarize the provided discussion transcript.

Analyze:
1. Main topics discussed and key arguments made.
2. Areas of consensus (agreement) and dissension (disagreement).
3. The level of engagement (who spoke a lot, who was quiet).
4. Evidence of understanding relative to the discussion topic.

Output strictly as JSON:
{
  "summary": "A concise paragraph summarizing the key points of the discussion.",
  "key_points": ["Point 1", "Point 2"],
  "unresolved_questions": ["Question 1"],
  "participation_analysis": "Brief comment on group dynamics (e.g., 'balanced', 'dominated by X')."
}"""

        user_message = f"""Discussion Topic: {discussion_topic}
Discussion Questions: {json.dumps(discussion_questions)}

TRANSCRIPT:
{transcript}

Summarize this discussion."""

        result = self._chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3, # Low temperature for factual summarization
            json_output=True
        )

        return {
            "summary_data": result["content"],
            "participants": list(participants),
            "tokens_used": result["tokens_used"]
        }
