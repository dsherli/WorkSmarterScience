"""
OpenAI/Azure OpenAI service layer
Provides unified interface for both OpenAI and Azure OpenAI APIs
"""

import os
import json
from typing import Optional, Dict, Any, List
from openai import OpenAI, AzureOpenAI
from django.conf import settings


class AIService:
    """
    Unified AI service supporting both OpenAI and Azure OpenAI.
    Automatically detects which service to use based on environment variables.
    """
    
    def __init__(self):
        self.client = None
        self.model = "gpt-4"
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize OpenAI or Azure OpenAI client based on available credentials"""
        
        # Try Azure OpenAI first (since you have it in .env.example)
        azure_endpoint = getattr(settings, "AZURE_OPENAI_ENDPOINT", None)
        azure_key = getattr(settings, "AZURE_OPENAI_API_KEY", None)
        
        if azure_endpoint and azure_key:
            self.client = AzureOpenAI(
                api_key=azure_key,
                api_version=getattr(settings, "AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
                azure_endpoint=azure_endpoint
            )
            self.model = getattr(settings, "AZURE_OPENAI_DEPLOYMENT", "gpt-4")
            print(f"[AIService] Using Azure OpenAI with deployment: {self.model}")
            return
        
        # Fall back to standard OpenAI
        openai_key = getattr(settings, "OPENAI_API_KEY", None)
        if openai_key:
            self.client = OpenAI(api_key=openai_key)
            self.model = getattr(settings, "OPENAI_MODEL", "gpt-4")
            print(f"[AIService] Using OpenAI with model: {self.model}")
            return
        
        print("[AIService] WARNING: No OpenAI or Azure OpenAI credentials found!")
    
    def is_configured(self) -> bool:
        """Check if AI service is properly configured"""
        return self.client is not None
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to OpenAI/Azure OpenAI
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            **kwargs: Additional OpenAI API parameters
        
        Returns:
            Dict with 'content', 'model', 'tokens_used', and 'finish_reason'
        
        Raises:
            ValueError: If service not configured
            Exception: API errors
        """
        if not self.is_configured():
            raise ValueError("AI service not configured. Set OPENAI_API_KEY or Azure credentials.")
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            return {
                "content": response.choices[0].message.content,
                "model": response.model,
                "tokens_used": response.usage.total_tokens if response.usage else None,
                "finish_reason": response.choices[0].finish_reason,
                "raw_response": response
            }
        
        except Exception as e:
            print(f"[AIService] Error in chat_completion: {e}")
            raise
    
    def evaluate_student_work(
        self,
        question: str,
        student_answer: str,
        rubric: Optional[str] = None,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate student work using AI grading
        
        Args:
            question: The question or prompt
            student_answer: Student's submitted answer
            rubric: Optional grading rubric
            context: Optional additional context (course materials, etc.)
        
        Returns:
            Dict with evaluation results including score, feedback, and reasoning
        """
        
        system_prompt = """You are an expert educational assessment grader. 
Provide constructive, specific feedback that helps students learn.
Be fair, consistent, and encouraging while maintaining high standards."""
        
        user_message = f"""Grade the following student work:

QUESTION:
{question}

STUDENT ANSWER:
{student_answer}"""
        
        if rubric:
            user_message += f"\n\nGRADING RUBRIC:\n{rubric}"
        
        if context:
            user_message += f"\n\nADDITIONAL CONTEXT:\n{context}"
        
        user_message += """

Please provide:
1. A score or grade (if rubric provided, follow it; otherwise use 0-100 scale)
2. Specific strengths in the answer
3. Areas for improvement
4. Constructive feedback for the student

Format your response as JSON with keys: score, strengths, improvements, feedback"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        return self.chat_completion(messages, temperature=0.3)
    
    def generate_feedback(
        self,
        prompt: str,
        context: Optional[str] = None,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate general educational feedback or assistance
        
        Args:
            prompt: User's question or request
            context: Optional context (student work, course materials, etc.)
            temperature: Creativity level (0-2)
        
        Returns:
            AI-generated response
        """
        system_prompt = """You are a helpful educational assistant for the Work Smarter Science platform.
Help students understand concepts, provide hints without giving away answers, 
and encourage critical thinking."""
        
        user_message = prompt
        if context:
            user_message = f"Context: {context}\n\n{prompt}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        return self.chat_completion(messages, temperature=temperature)
    
    def grade_with_rubric(
        self,
        question: str,
        student_answer: str,
        rubric_data: Dict[str, Any],
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Grade student work using a structured rubric with multiple criteria
        
        Args:
            question: The question or prompt
            student_answer: Student's submitted answer
            rubric_data: Dict with 'title', 'total_points', and 'criteria' list
                Each criterion has: name, description, max_points, weight
            context: Optional additional context
        
        Returns:
            Dict with overall score, criterion scores, and feedback
            {
                "total_score": float,
                "max_score": float,
                "percentage": float,
                "overall_feedback": str,
                "criterion_results": [
                    {
                        "criterion_name": str,
                        "points_earned": float,
                        "max_points": float,
                        "feedback": str
                    },
                    ...
                ]
            }
        """
        
        # Build detailed rubric description
        rubric_text = f"Rubric: {rubric_data.get('title', 'Grading Rubric')}\n"
        rubric_text += f"Total Points: {rubric_data.get('total_points', 100)}\n\n"
        rubric_text += "Criteria:\n"
        
        for i, criterion in enumerate(rubric_data.get('criteria', []), 1):
            rubric_text += f"{i}. {criterion['name']} ({criterion['max_points']} points)\n"
            rubric_text += f"   Description: {criterion['description']}\n"
            rubric_text += f"   Weight: {criterion.get('weight', 1.0)}\n"
        
        system_prompt = """You are an expert educational grader. Evaluate student work against specific rubric criteria.
Be fair, consistent, and provide constructive feedback that helps students improve.
Grade each criterion separately and provide specific feedback for each."""
        
        user_message = f"""Grade the following student work according to the rubric:

QUESTION:
{question}

STUDENT ANSWER:
{student_answer}

{rubric_text}"""
        
        if context:
            user_message += f"\n\nADDITIONAL CONTEXT:\n{context}"
        
        user_message += """

Please evaluate the work against EACH criterion in the rubric and respond with valid JSON:

{
  "overall_feedback": "General feedback about the submission",
  "criterion_results": [
    {
      "criterion_name": "Name of criterion",
      "points_earned": <number between 0 and max_points>,
      "max_points": <max points for this criterion>,
      "feedback": "Specific feedback for this criterion explaining the score"
    }
  ]
}

Be specific about why points were awarded or deducted for each criterion.
Provide actionable feedback to help the student improve."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        try:
            response = self.chat_completion(messages, temperature=0.3, max_tokens=2000)
            
            # Parse JSON response
            content = response["content"].strip()
            
            # Try to extract JSON if wrapped in markdown code blocks
            if content.startswith("```"):
                # Remove code block markers
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:].strip()
            
            result_data = json.loads(content)
            
            # Calculate total score
            total_score = sum(cr["points_earned"] for cr in result_data["criterion_results"])
            max_score = sum(cr["max_points"] for cr in result_data["criterion_results"])
            
            return {
                "total_score": total_score,
                "max_score": max_score,
                "percentage": (total_score / max_score * 100) if max_score > 0 else 0,
                "overall_feedback": result_data["overall_feedback"],
                "criterion_results": result_data["criterion_results"],
                "model_used": response["model"],
                "tokens_used": response.get("tokens_used")
            }
        
        except json.JSONDecodeError as e:
            # Fallback if JSON parsing fails
            print(f"[AIService] JSON parsing failed: {e}")
            print(f"[AIService] Raw content: {content}")
            
            # Return a fallback structure
            return {
                "total_score": 0,
                "max_score": rubric_data.get("total_points", 100),
                "percentage": 0,
                "overall_feedback": f"Error parsing AI response. Raw response: {content}",
                "criterion_results": [],
                "model_used": response["model"],
                "tokens_used": response.get("tokens_used"),
                "error": str(e)
            }


# Singleton instance
_ai_service = None

def get_ai_service() -> AIService:
    """Get or create AIService singleton"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
