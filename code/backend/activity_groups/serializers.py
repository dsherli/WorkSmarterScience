from rest_framework import serializers
from .models import (
    ActivityGroup,
    ActivityGroupMembership,
    GroupAIRun,
    GroupAIPrompt,
)


class GroupAIPromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupAIPrompt
        fields = ["id", "prompt_order", "prompt_text", "prompt_type", "created_at"]


class GroupAIRunSerializer(serializers.ModelSerializer):
    prompts = GroupAIPromptSerializer(many=True, read_only=True)

    class Meta:
        model = GroupAIRun
        fields = [
            "id",
            "activity_group",
            "run_reason",
            "input_response_ids",
            "synthesized_summary_text",
            "model_name",
            "model_params",
            "released_at",
            "created_at",
            "prompts",
        ]
        read_only_fields = ["created_at", "prompts"]


class ActivityGroupSerializer(serializers.ModelSerializer):
    ai_runs = GroupAIRunSerializer(many=True, read_only=True)

    class Meta:
        model = ActivityGroup
        fields = ["id", "group_set", "label", "archived_at", "created_at", "ai_runs"]


class ActivityGroupMembershipSerializer(serializers.ModelSerializer):
    group = ActivityGroupSerializer(source="activity_group", read_only=True)

    class Meta:
        model = ActivityGroupMembership
        fields = ["id", "group_set", "activity_group", "user", "joined_at", "group"]
        read_only_fields = ["joined_at"]


# Optionally for listing groups + prompts for an assignment:
class GroupWithPromptsSerializer(serializers.ModelSerializer):
    ai_runs = GroupAIRunSerializer(many=True, read_only=True)

    class Meta:
        model = ActivityGroup
        fields = ["id", "label", "archived_at", "ai_runs"]
