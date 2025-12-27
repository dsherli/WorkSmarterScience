import json
import os
import django

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from grading.models import Rubric, RubricCriterion

User = get_user_model()


class Command(BaseCommand):
    help = 'Import rubric from custom JSON format with levels and evaluation rules'

    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str, help='Path to JSON file')
        parser.add_argument('--user-id', type=int, default=1, help='User ID for created_by')
        parser.add_argument('--activity-id', type=str, help='Activity ID to link (e.g., 005.04-c01)')

    def handle(self, *args, **options):
        json_file = options['json_file']
        user_id = options['user_id']
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {user_id} not found. Create a superuser first.'))
            return
        
        # Read JSON file
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Create rubric
        rubric_description = data.get('learning_target', '')
        
        # Add metadata to description
        if 'metadata' in data:
            metadata = data['metadata']
            rubric_description += f"\n\nSource: {metadata.get('source_document', 'N/A')}"
            if 'aligned_ngss' in metadata:
                rubric_description += f"\nAligned to: {', '.join(metadata['aligned_ngss'])}"
        
        rubric = Rubric.objects.create(
            title=data.get('task_title', data.get('assignment_id', 'Untitled Rubric')),
            description=rubric_description,
            total_points=data.get('max_score', 100),
            created_by=user,
            is_active=True
        )
        
        self.stdout.write(f'Created rubric: {rubric.title} (ID: {rubric.id})')
        
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
                max_points = int(weight * data.get('max_score', 100))
            
            # Create criterion
            criterion = RubricCriterion.objects.create(
                rubric=rubric,
                name=criterion_id,
                description=description.strip(),
                max_points=max_points,
                weight=criterion_data.get('weight', 1.0),
                order=idx
            )
            
            self.stdout.write(f'  ✓ Created criterion: {criterion_id} ({max_points} pts)')
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully imported rubric "{rubric.title}"'))
        self.stdout.write(self.style.SUCCESS(f'   Rubric ID: {rubric.id}'))
        self.stdout.write(self.style.SUCCESS(f'   Total Points: {rubric.total_points}'))
        self.stdout.write(self.style.SUCCESS(f'   Criteria: {rubric.criteria.count()}'))
        
        # Store activity mapping info in a comment for manual SQL update
        if options.get('activity_id'):
            activity_id = options['activity_id']
            assignment_id = data.get('assignment_id', '')
            
            self.stdout.write(self.style.WARNING(f'\n⚠️  To link this rubric to activity "{activity_id}", run this SQL:'))
            self.stdout.write(self.style.WARNING(f'''
INSERT INTO grading_activityrubricmapping (activity_id, rubric_id, assignment_id, created_at)
VALUES ('{activity_id}', {rubric.id}, '{assignment_id}', NOW())
ON CONFLICT (activity_id) DO UPDATE SET rubric_id = {rubric.id}, assignment_id = '{assignment_id}';
'''))
            self.stdout.write(self.style.WARNING('Or update Rubric.activity_id field in Django admin.'))
