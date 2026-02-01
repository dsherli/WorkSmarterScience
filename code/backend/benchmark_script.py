
import os
import sys
import time
import django
import statistics
from django.conf import settings

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")
django.setup()

from grading.ai_service import get_ai_service

def run_benchmark():
    service = get_ai_service()
    if not service.is_configured():
        print("AI Service not configured!")
        return

    print(f"Service Type: {service._service_type}")
    print(f"Reasoning Model: {service._model_reasoning}")
    print(f"Fast Model: {service._model_fast}")
    print(f"Active Service Model: {service._model_fast}") # Since we hardcoded it in ai_service for this test
    
    question = "Explain the process of photosynthesis."
    answer = "Photosynthesis is how plants make food. They use sunlight, water, and carbon dioxide to create glucose and oxygen. It happens in the chloroplasts."
    
    print("\n--- Starting Benchmark: evaluate_student_work (5 repetitions) ---")
    
    latencies = []
    total_tokens_list = []
    prompt_tokens_list = []
    completion_tokens_list = []
    
    for i in range(1, 6):
        print(f"Run {i}/5...", end="", flush=True)
        start_time = time.time()
        try:
            result = service.evaluate_student_work(question, answer)
            end_time = time.time()
            
            latency = end_time - start_time
            latencies.append(latency)
            
            # Capture tokens
            t_total = result.get("tokens_used", 0)
            t_prompt = result.get("prompt_tokens", 0)
            t_completion = result.get("completion_tokens", 0)
            
            total_tokens_list.append(t_total)
            prompt_tokens_list.append(t_prompt)
            completion_tokens_list.append(t_completion)
            
            print(f" Done. ({latency:.2f}s)")
            
        except Exception as e:
            print(f"\nError run {i}: {e}")
            if "429" in str(e):
                print("Rate Limit Hit! Check headers for Retry-After.")
                # Ideally we check headers here if exception object has them
    
    if latencies:
        avg_latency = statistics.mean(latencies)
        stdev_latency = statistics.stdev(latencies) if len(latencies) > 1 else 0.0
        
        avg_total = statistics.mean(total_tokens_list)
        avg_prompt = statistics.mean(prompt_tokens_list)
        avg_completion = statistics.mean(completion_tokens_list)
        
        print("\n--- Benchmark Results ---")
        print(f"Samples: {len(latencies)}")
        print(f"Avg Latency: {avg_latency:.2f}s (stdev: {stdev_latency:.2f}s)")
        print(f"Avg Total Tokens: {avg_total:.0f}")
        print(f"  - Avg Prompt tokens: {avg_prompt:.0f}")
        print(f"  - Avg Completion tokens: {avg_completion:.0f}")
        print(f"Model: {result.get('model')}")

if __name__ == "__main__":
    run_benchmark()
