from rest_framework import generics, permissions
from django.db.models import Prefetch
from .models import (
    ActivityGroup,
    GroupAIRun,
    GroupAIPrompt,
)
from .serializers import (
    GroupAIPromptSerializer,
    GroupWithPromptsSerializer,
)


class StudentCurrentPromptsView(generics.ListAPIView):
    serializer_class = GroupAIPromptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        assignment_id = self.kwargs["assignment_id"]
        user = self.request.user
        group = (
            ActivityGroup.objects.filter(
                group_set__assignment_id=assignment_id,
                memberships__user=user,
            )
            .prefetch_related("ai_runs")
            .first()
        )
        latest_run = group.ai_runs.order_by("-created_at").first() if group else None
        return (
            GroupAIPrompt.objects.filter(group_ai_run=latest_run).order_by(
                "prompt_order"
            )
            if latest_run
            else GroupAIPrompt.objects.none()
        )


class TeacherGroupsWithPromptsView(generics.ListAPIView):
    serializer_class = GroupWithPromptsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        assignment_id = self.kwargs["assignment_id"]
        return (
            ActivityGroup.objects.filter(group_set__assignment_id=assignment_id)
            .select_related("group_set")
            .prefetch_related(
                Prefetch(
                    "ai_runs",
                    queryset=GroupAIRun.objects.order_by(
                        "-created_at"
                    ).prefetch_related("prompts"),
                )
            )
        )
