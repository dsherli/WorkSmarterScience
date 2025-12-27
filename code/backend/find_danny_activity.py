import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from activities.models import ScienceActivity

# Search for Danny Makes Soap activity
activities = ScienceActivity.objects.filter(activity_title__icontains='danny')
if activities.exists():
    for activity in activities:
        print(f"Found: {activity.activity_id} - {activity.activity_title}")
        print(f"  Task: {activity.activity_task[:100] if activity.activity_task else 'N/A'}...")
else:
    print("No activity found with 'danny' in title.")
    print("\nSearching for 'soap'...")
    activities = ScienceActivity.objects.filter(activity_title__icontains='soap')
    if activities.exists():
        for activity in activities:
            print(f"Found: {activity.activity_id} - {activity.activity_title}")
    else:
        print("No activity found with 'soap' in title either.")
        print("\nShowing all activities:")
        for activity in ScienceActivity.objects.all()[:10]:
            print(f"  {activity.activity_id} - {activity.activity_title}")
