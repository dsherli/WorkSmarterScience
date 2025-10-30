"""
Standalone script to import Danny Makes Soap rubric
Run this with: python import_danny_rubric.py
"""
import os
import sys
import json

# Add the project directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from grading.models import Rubric, RubricCriterion

User = get_user_model()

def import_rubric():
    """Import the Danny Makes Soap rubric"""
    
    # Load JSON file
    json_file = 'grading/sampleRubric.json'
    print(f"Loading rubric from: {json_file}")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Get or create user (superuser should exist)
    try:
        user = User.objects.get(id=1)
        print(f"Using user: {user.username}")
    except User.DoesNotExist:
        print("ERROR: No user with ID 1 found. Create a superuser first:")
        print("  python manage.py createsuperuser")
        return
    
    # Create rubric
    rubric_description = data.get('learning_target', '')
    
    # Add metadata to description
    if 'metadata' in data:
        metadata = data['metadata']
        rubric_description += f"\n\nSource: {metadata.get('source_document', 'N/A')}"
        if 'aligned_ngss' in metadata:
            rubric_description += f"\nAligned to: {', '.join(metadata['aligned_ngss'])}"
    
    rubric = Rubric.objects.create(
        title=data.get('task_title', 'Danny Makes Soap'),
        description=rubric_description,
        total_points=data.get('max_score', 6),
        created_by=user,
        is_active=True
    )
    
    print(f"\n✅ Created rubric: {rubric.title}")
    print(f"   ID: {rubric.id}")
    print(f"   Total Points: {rubric.total_points}")
    
    # Create criteria with levels
    for idx, criterion_data in enumerate(data.get('criteria', [])):
        criterion_id = criterion_data.get('id', f'criterion_{idx+1}')
        criterion_title = criterion_data.get('title', f'Criterion {idx+1}')
        
        # Build description with levels
        description = criterion_title + "\n\n"
        
        levels = criterion_data.get('levels', [])
        if levels:
            description += "Performance Levels:\n"
            for level in levels:
                level_name = level.get('name', 'Unknown')
                level_score = level.get('score')
                level_desc = level.get('description', '')
                
                if level_score is not None:
                    description += f"• {level_name} ({level_score} pts): {level_desc}\n"
                else:
                    description += f"• {level_name}: {level_desc}\n"
            description += "\n"
        
        # Add examples if available
        examples = criterion_data.get('examples', {})
        if examples:
            description += "Examples:\n"
            for example_type, example_text in examples.items():
                if example_text:
                    description += f"• {example_type.title()}: {example_text}\n"
            description += "\n"
        
        # Add auto-eval rules for AI to use
        auto_eval = criterion_data.get('auto_eval_rules', {})
        if auto_eval:
            description += "Evaluation Guidelines:\n"
            
            if 'keywords_proficient' in auto_eval and auto_eval['keywords_proficient']:
                keywords = ', '.join(auto_eval['keywords_proficient'])
                description += f"Look for: {keywords}\n"
            
            if 'keywords_incorrect' in auto_eval and auto_eval['keywords_incorrect']:
                avoid_words = ', '.join(auto_eval['keywords_incorrect'])
                description += f"Avoid: {avoid_words}\n"
            
            if 'pattern_checks' in auto_eval:
                pattern_info = auto_eval['pattern_checks']
                if isinstance(pattern_info, dict):
                    for check_name, check_value in pattern_info.items():
                        description += f"{check_name}: {check_value}\n"
        
        # Calculate max_points from levels
        max_points = 0
        if levels:
            scores = [level.get('score', 0) for level in levels if level.get('score') is not None]
            if scores:
                max_points = max(scores)
        
        if max_points == 0:
            # Use weight to calculate max points from total
            weight = criterion_data.get('weight', 1.0 / len(data.get('criteria', [1])))
            max_points = int(weight * data.get('max_score', 6))
        
        # Create criterion
        criterion = RubricCriterion.objects.create(
            rubric=rubric,
            name=criterion_id,
            description=description.strip(),
            max_points=max_points,
            weight=criterion_data.get('weight', 1.0),
            order=idx
        )
        
        print(f"   ✓ {criterion_id}: {max_points} pts")
    
    print(f"\n🎉 Successfully imported rubric with {rubric.criteria.count()} criteria!")
    print(f"\nTo use this rubric in Assessment1.tsx, change line 65 to:")
    print(f"    rubric: {rubric.id},  // Danny Makes Soap rubric")
    print(f"\nOr view it at: http://localhost:8000/api/grading/rubrics/{rubric.id}/")

if __name__ == '__main__':
    import_rubric()
