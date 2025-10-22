"""
Test script for AI grading system
This will test the complete workflow:
1. Create a rubric with multiple criteria
2. Create a submission
3. Grade it with AI
4. View the results
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from django.contrib.auth import get_user_model
from grading.models import Rubric, RubricCriterion, AssessmentSubmission
from grading.ai_service import AIService
from django.utils import timezone

User = get_user_model()

print("=" * 70)
print("AI GRADING SYSTEM TEST")
print("=" * 70)

# Step 1: Get or create a test user
print("\n1. Setting up test user...")
user, created = User.objects.get_or_create(
    username='test_teacher',
    defaults={
        'email': 'teacher@test.com',
        'first_name': 'Test',
        'last_name': 'Teacher'
    }
)
if created:
    user.set_password('test123')
    user.save()
    print("   ✅ Created test user: test_teacher")
else:
    print("   ✅ Using existing user: test_teacher")

# Step 2: Create a test rubric
print("\n2. Creating rubric...")
rubric = Rubric.objects.create(
    title="Science Lab Report Rubric",
    description="Grading criteria for photosynthesis lab report",
    activity_id=1,
    created_by=user
)
print(f"   ✅ Created rubric: {rubric.title} (ID: {rubric.id})")

# Step 3: Add criteria to rubric
print("\n3. Adding criteria...")
criteria_data = [
    {
        "name": "Hypothesis",
        "description": "Clear and testable hypothesis about photosynthesis",
        "max_points": 20,
        "order": 1
    },
    {
        "name": "Understanding",
        "description": "Demonstrates understanding of photosynthesis process",
        "max_points": 30,
        "order": 2
    },
    {
        "name": "Scientific Accuracy",
        "description": "Uses correct scientific terminology and concepts",
        "max_points": 30,
        "order": 3
    },
    {
        "name": "Clarity",
        "description": "Clear and well-organized explanation",
        "max_points": 20,
        "order": 4
    }
]

for criterion_data in criteria_data:
    criterion = RubricCriterion.objects.create(
        rubric=rubric,
        **criterion_data
    )
    print(f"   ✅ Added criterion: {criterion.name} ({criterion.max_points} pts)")

rubric.refresh_from_db()
print(f"\n   Total rubric points: {rubric.total_points}")

# Step 4: Create a test submission
print("\n4. Creating test submission...")
question = "Explain the process of photosynthesis and its importance to life on Earth."

# Good answer example
good_answer = """
Photosynthesis is the process by which plants, algae, and some bacteria convert light energy 
(usually from the sun) into chemical energy stored in glucose molecules. The process occurs 
primarily in the chloroplasts of plant cells and can be summarized by the equation:

6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂

The process has two main stages:
1. Light-dependent reactions: These occur in the thylakoid membranes where chlorophyll 
   captures light energy to split water molecules, releasing oxygen as a byproduct and 
   producing ATP and NADPH.
2. Light-independent reactions (Calvin Cycle): These occur in the stroma where CO₂ is 
   fixed and reduced to form glucose using the ATP and NADPH from the light reactions.

Photosynthesis is crucial for life on Earth because:
- It produces oxygen that most organisms need for cellular respiration
- It forms the base of most food chains by converting light energy into chemical energy
- It removes CO₂ from the atmosphere, helping regulate Earth's climate
- It produces organic compounds that are essential building blocks for life

In summary, photosynthesis is fundamental to sustaining life on Earth by providing both 
the oxygen we breathe and the food energy that supports ecosystems.
"""

submission = AssessmentSubmission.objects.create(
    student=user,
    activity_id=1,
    rubric=rubric,
    question_text=question,
    answer_text=good_answer,
    status='submitted',
    submitted_at=timezone.now()
)
print(f"   ✅ Created submission (ID: {submission.id})")
print(f"   Question: {question[:60]}...")
print(f"   Answer length: {len(good_answer)} characters")

# Step 5: Check if AI service is configured
print("\n5. Checking AI service configuration...")
try:
    ai_service = AIService()
    print("   ✅ AI service initialized")
    
    # Check if API key is set
    if hasattr(ai_service, 'client') and ai_service.client:
        print("   ✅ OpenAI client configured")
    else:
        print("   ⚠️  Warning: AI client may not be properly configured")
        print("   Check your OPENAI_API_KEY or Azure OpenAI settings in .env")
        
except Exception as e:
    print(f"   ❌ Error initializing AI service: {e}")
    print("   Make sure you have OPENAI_API_KEY set in your .env file")
    exit(1)

# Step 6: Grade the submission with AI
print("\n6. Grading submission with AI...")
print("   This may take 10-30 seconds...\n")

try:
    from grading.views import AssessmentSubmissionViewSet
    from rest_framework.test import APIRequestFactory
    from django.test import RequestFactory
    
    # Simulate the grading request
    rubric_dict = {
        'title': rubric.title,
        'total_points': rubric.total_points,
        'criteria': [
            {
                'name': c.name,
                'description': c.description,
                'max_points': c.max_points,
                'weight': 1.0
            }
            for c in rubric.criteria.all()
        ]
    }
    
    result = ai_service.grade_with_rubric(
        question=submission.question_text,
        student_answer=submission.answer_text,
        rubric_data=rubric_dict
    )
    
    print("   ✅ AI grading completed!")
    print("\n" + "=" * 70)
    print("GRADING RESULTS")
    print("=" * 70)
    
    if 'criterion_results' in result:
        total_earned = 0
        print("\nCRITERION BREAKDOWN:")
        print("-" * 70)
        
        for i, criterion_result in enumerate(result['criterion_results'], 1):
            name = criterion_result.get('criterion_name', 'Unknown')
            points = criterion_result.get('points_earned', 0)
            max_points = criterion_result.get('max_points', 0)
            feedback = criterion_result.get('feedback', '')
            
            total_earned += points
            percentage = (points / max_points * 100) if max_points > 0 else 0
            
            print(f"\n{i}. {name}")
            print(f"   Score: {points}/{max_points} ({percentage:.1f}%)")
            print(f"   Feedback: {feedback}")
        
        print("\n" + "=" * 70)
        print(f"TOTAL SCORE: {total_earned}/{rubric.total_points} ({total_earned/rubric.total_points*100:.1f}%)")
        print("=" * 70)
        
        if 'overall_feedback' in result:
            print(f"\nOVERALL FEEDBACK:")
            print(f"{result['overall_feedback']}")
    
    else:
        print("   ⚠️  Unexpected result format:")
        print(result)
        
except Exception as e:
    print(f"   ❌ Error during grading: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("TEST COMPLETE!")
print("=" * 70)
print(f"\nTo view in Django admin:")
print(f"  1. Go to http://localhost:8000/admin/grading/rubric/{rubric.id}/")
print(f"  2. Go to http://localhost:8000/admin/grading/assessmentsubmission/{submission.id}/")
print(f"\nTo test via API:")
print(f"  POST http://localhost:8000/api/grading/submissions/{submission.id}/grade_submission/")
print("\n")
