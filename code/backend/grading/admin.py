from django.contrib import admin
from .models import GradingSession, Rubric, RubricCriterion, AssessmentSubmission, CriterionScore


@admin.register(GradingSession)
class GradingSessionAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "activity_id", "model_used", "tokens_used", "created_at"]
    list_filter = ["model_used", "created_at"]
    search_fields = ["user__username", "prompt", "response"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]


class RubricCriterionInline(admin.TabularInline):
    model = RubricCriterion
    extra = 1
    fields = ["name", "description", "max_points", "weight", "order"]


@admin.register(Rubric)
class RubricAdmin(admin.ModelAdmin):
    list_display = ["title", "total_points", "created_by", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["title", "description"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [RubricCriterionInline]
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


class CriterionScoreInline(admin.TabularInline):
    model = CriterionScore
    extra = 0
    readonly_fields = ["criterion", "points_earned", "feedback"]
    fields = ["criterion", "points_earned", "teacher_points", "feedback", "teacher_feedback"]


@admin.register(AssessmentSubmission)
class AssessmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ["id", "student", "activity_id", "status", "final_score", "max_score", "percentage", "submitted_at"]
    list_filter = ["status", "graded_by_ai", "submitted_at"]
    search_fields = ["student__username", "question_text", "answer_text"]
    readonly_fields = ["submitted_at", "graded_at", "graded_by_ai", "ai_model_used", "tokens_used", "percentage"]
    inlines = [CriterionScoreInline]
    
    fieldsets = (
        ("Submission Info", {
            "fields": ("student", "activity_id", "question_text", "answer_text", "rubric", "status")
        }),
        ("AI Grading", {
            "fields": ("score", "max_score", "feedback", "graded_at", "graded_by_ai", "ai_model_used", "tokens_used")
        }),
        ("Teacher Review", {
            "fields": ("teacher_score", "teacher_feedback", "reviewed_by", "reviewed_at")
        }),
        ("Metadata", {
            "fields": ("submitted_at", "percentage")
        }),
    )


@admin.register(CriterionScore)
class CriterionScoreAdmin(admin.ModelAdmin):
    list_display = ["submission", "criterion", "points_earned", "final_points"]
    list_filter = ["criterion__rubric"]
    search_fields = ["submission__student__username", "criterion__name"]
