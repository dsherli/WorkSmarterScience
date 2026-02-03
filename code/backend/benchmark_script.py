import os
import sys
import time
import django
import statistics
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")
django.setup()

from grading.ai_service import get_ai_service

# Configuration
ITERATIONS = 100 # Updated from 10 to 100
QUESTION = "Explain the process of photosynthesis."
ANSWER = "Photosynthesis is how plants make food. They use sunlight, water, and carbon dioxide to create glucose and oxygen. It happens in the chloroplasts."

# Hypothetical Pricing (per 1M tokens) - Adjust as needed
PRICE_GPT5_INPUT = 5.00
PRICE_GPT5_OUTPUT = 15.00
PRICE_GPT5_MINI_INPUT = 0.15
PRICE_GPT5_MINI_OUTPUT = 0.60

def single_run(service, model_name, run_id):
    """
    Helper function for a single service call.
    Returns a dict with metrics.
    """
    start_time = time.time()
    try:
        # Pass model_override to the modified evaluate_student_work
        result = service.evaluate_student_work(QUESTION, ANSWER, model_override=model_name)
        end_time = time.time()
        
        latency = end_time - start_time
        
        # Parse score for "Reasoning Accuracy"
        import json
        try:
            eval_json = json.loads(result.get("evaluation", "{}"))
            score = eval_json.get("score", 0)
        except:
            score = 0
            
        return {
            "success": True,
            "latency": latency,
            "total_tokens": result.get("tokens_used", 0),
            "prompt_tokens": result.get("prompt_tokens", 0),
            "completion_tokens": result.get("completion_tokens", 0),
            "score": score,
            "model": result.get("model"),
            "error": None
        }
    except Exception as e:
        end_time = time.time()
        return {
            "success": False,
            "latency": end_time - start_time,
            "total_tokens": 0,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "score": 0,
            "model": model_name,
            "error": str(e)
        }

def run_parallel(service, model_name, iterations):
    print(f"\n--- Starting Parallel Benchmark for {model_name} (N={iterations}) ---")
    results = []
    start_wall = time.time()
    
    # 20 workers for N=100 balances throughput and stability
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(single_run, service, model_name, i) for i in range(iterations)]
        
        for i, future in enumerate(concurrent.futures.as_completed(futures)):
            if (i+1) % 10 == 0:
                print(f"Progress: {i+1}/{iterations} completed...")
            results.append(future.result())
            
    end_wall = time.time()
    total_wall_time = end_wall - start_wall
    return results, total_wall_time

def calculate_cost(results, model_label):
    # Select pricing
    if "mini" in model_label.lower():
        p_in = PRICE_GPT5_MINI_INPUT
        p_out = PRICE_GPT5_MINI_OUTPUT
    else:
        p_in = PRICE_GPT5_INPUT
        p_out = PRICE_GPT5_OUTPUT
        
    total_prompt = sum(r["prompt_tokens"] for r in results if r["success"])
    total_completion = sum(r["completion_tokens"] for r in results if r["success"])
    
    cost_prompt = (total_prompt / 1_000_000) * p_in
    cost_completion = (total_completion / 1_000_000) * p_out
    
    # Normalize to "Cost per 100 Tasks" as requested
    # We ran N tasks. (Cost / N) * 100
    n = len(results)
    if n == 0: return 0.0
    
    total_cost_run = cost_prompt + cost_completion
    cost_per_100 = (total_cost_run / n) * 100
    return cost_per_100

def print_metrics(model_label, results, wall_time):
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    
    # Latency
    latencies = [r["latency"] for r in successful]
    avg_latency = statistics.mean(latencies) if latencies else 0
    stdev_latency = statistics.stdev(latencies) if len(latencies) > 1 else 0
    
    # Accuracy (Score)
    scores = [r["score"] for r in successful]
    avg_score = statistics.mean(scores) if scores else 0
    stdev_score = statistics.stdev(scores) if len(scores) > 1 else 0
    
    # Cost
    cost_per_100 = calculate_cost(results, model_label)
    
    # User Interaction (Throughput)
    throughput = len(results) / wall_time if wall_time > 0 else 0
    
    print(f"\nResults for {model_label} (Parallel)")
    print(f"{'Metric':<25} | {'Value':<15}")
    print("-" * 45)
    print(f"{'Reasoning Accuracy':<25} | {avg_score:.1f}% (±{stdev_score:.1f})")
    print(f"{'Response Latency':<25} | {avg_latency:.2f} s (±{stdev_latency:.2f})")
    print(f"{'Cost per 100 Tasks':<25} | ${cost_per_100:.4f}")
    print(f"{'User Interaction (Req/s)':<25} | {throughput:.2f}")
    print(f"{'Wall-clock Time':<25} | {wall_time:.2f} s")
    
    if failed:
        print(f"Errors: {len(failed)}")
        print(f"Sample Error: {failed[0]['error']}")

def main():
    service = get_ai_service()
    if not service.is_configured():
        print("AI Service not configured!")
        return

    # 1. GPT-5 Parallel
    gpt5_model = "gpt-5"
    gpt5_results, gpt5_wall = run_parallel(service, gpt5_model, ITERATIONS)
    
    # 2. GPT-5-Mini Parallel
    gpt5_mini_model = "gpt-5-mini"
    mini_results, mini_wall = run_parallel(service, gpt5_mini_model, ITERATIONS)
    
    print("\n\n" + "="*40)
    print(f"COMPARATIVE BENCHMARK (N={ITERATIONS} Parallel)")
    print("="*40)
    
    print_metrics("GPT-5", gpt5_results, gpt5_wall)
    print_metrics("GPT-5-Mini", mini_results, mini_wall)

if __name__ == "__main__":
    main()
