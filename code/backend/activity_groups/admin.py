from django.contrib import admin

from .models import (
    ActivityGroup,
    ActivityGroupMembership,
    ActivityGroupSet,
    GroupAIPrompt,
    GroupAIRun,
)


@admin.register(ActivityGroupSet)
class ActivityGroupSetAdmin(admin.ModelAdmin):
    list_display = ("id", "classroom_activity", "status", "created_by", "created_at")
    list_filter = ("status", "created_at")
    list_select_related = ("classroom_activity", "created_by")


@admin.register(ActivityGroup)
class ActivityGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "group_set", "label", "archived_at", "created_at")
    list_filter = ("archived_at",)
    search_fields = ("label", "group_set__classroom_activity__id")
    list_select_related = ("group_set",)


@admin.register(ActivityGroupMembership)
class ActivityGroupMembershipAdmin(admin.ModelAdmin):
    list_display = ("id", "group_set", "activity_group", "user", "joined_at")
    list_filter = ("group_set",)
    search_fields = ("activity_group__label", "user__username", "user__email")
    list_select_related = ("group_set", "activity_group", "user")


@admin.register(GroupAIRun)
class GroupAIRunAdmin(admin.ModelAdmin):
    list_display = ("id", "activity_group", "run_reason", "model_name", "created_at")
    list_filter = ("run_reason", "created_at", "model_name")
    search_fields = ("activity_group__label", "model_name")
    list_select_related = ("activity_group",)


@admin.register(GroupAIPrompt)
class GroupAIPromptAdmin(admin.ModelAdmin):
    list_display = ("id", "group_ai_run", "prompt_order", "prompt_type", "created_at")
    list_filter = ("prompt_type",)
    search_fields = ("prompt_text",)
    list_select_related = ("group_ai_run",)
