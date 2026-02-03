import logging
import json
from typing import Optional, Dict, List, Any

logger = logging.getLogger(__name__)

class BaseAgent:
    """
    Base class for all agents in the multi-agent system.
    """
    
    def __init__(self, client, model: str, name: str = "BaseAgent"):
        self.client = client
        self.model = model
        self.name = name
        
    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for the agent.
        Should be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement run()")

    def _chat_completion(
        self,
        messages: List[Dict],
        temperature: float = 0.3,
        max_tokens: Optional[int] = None,
        json_output: bool = False
    ) -> Dict:
        """
        Helper to call the LLM.
        """
        kwargs = {
            "model": self.model,
            "messages": messages,
        }
        
        # Temperature strictly removed as per user request for gpt-5-mini usage
        
        if max_tokens:
            kwargs["max_tokens"] = max_tokens
            
        if json_output:
            kwargs["response_format"] = {"type": "json_object"}

        try:
            logger.info(f"[{self.name}] Sending request to LLM (temp={temperature})")
            response = self.client.chat.completions.create(**kwargs)
            choice = response.choices[0]
            
            content = choice.message.content
            
            if json_output:
                try:
                    content = json.loads(content)
                except json.JSONDecodeError:
                    logger.error(f"[{self.name}] Failed to parse JSON response: {content}")
                    # Try to extract JSON if it's wrapped in markdown
                    raw_content = choice.message.content
                    start = raw_content.find("{")
                    end = raw_content.rfind("}") + 1
                    if start >= 0 and end > start:
                        try:
                            content = json.loads(raw_content[start:end])
                        except json.JSONDecodeError:
                            pass

            return {
                "content": content,
                "tokens_used": response.usage.total_tokens if response.usage else 0,
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "finish_reason": choice.finish_reason,
            }
            
        except Exception as e:
            logger.error(f"[{self.name}] LLM Error: {e}")
            raise e
