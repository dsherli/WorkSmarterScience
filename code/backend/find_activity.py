import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")
django.setup()

from activities.models import ScienceActivity

query = os.environ.get("QUERY", "matching unknown liquids")
qs = ScienceActivity.objects.filter(activity_title__icontains=query)
print(f"Search: {query}")
print(f"Found {qs.count()} activities:\n")
for a in qs[:50]:
    print(f"- activity_id: {a.activity_id} | title: {a.activity_title}")
