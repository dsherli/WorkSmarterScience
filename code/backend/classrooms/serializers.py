from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import (
    Classroom,
    Enrollment,
    ClassroomActivity,
    ClassroomActivityAssignment,
)
import random
import string

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]
        read_only_fields = ["id", "username", "first_name", "last_name", "email"]


class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "student", "joined_at"]
        read_only_fields = ["id", "student", "joined_at"]


class ClassroomSerializer(serializers.ModelSerializer):
    enrollments = EnrollmentSerializer(many=True, read_only=True)

    class Meta:
        model = Classroom
        fields = [
            "id",
            "name",
            "description",
            "grade_level",
            "school",
            "code",
            "status",
            "term",
            "created_by",
            "created_at",
            "updated_at",
            "enrollments",
        ]
    read_only_fields = (
        "id",
        "code",
        "created_by",
        "created_at",
        "updated_at",
        "enrollments",
    )

    def create(self, validated_data):
        user = self.context["request"].user

        code = "".join(random.choices(string.ascii_letters + string.digits, k=5))

        validated_data["created_by"] = user
        validated_data["code"] = code

        validated_data["status"] = validated_data.get("status", "active")
        validated_data["term"] = validated_data.get("term", "")

        return super().create(validated_data)


class EnrollmentJoinSerializer(serializers.ModelSerializer):
    join_code = serializers.CharField(write_only=True)

    class Meta:
        fields = ["id", "join_code", "joined_at"]
        read_only_fields = ["id, join_code", "joined_at"]

    def validate_join_code(self, value):
        from .models import Classroom

        try:
            classroom = Classroom.objects.get(code=value, status="active")
        except Classroom.DoesNotExist:
            raise serializers.ValidationError("Classroom is inactive or does not exist")

        self.context["classroom"] = classroom
        return value

    def create(self, validated_data):
        validated_data.pop("join_code", None)

        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "User must be authenticated to join a classroom"
            )

        classroom = self.context["classroom"]
        student = request.user

        if Enrollment.objects.filter(classroom=classroom, student=student).exists():
            raise serializers.ValidationError("User is already enrolled in classroom")

        enrollment = Enrollment.objects.create(
            classroom=classroom,
            student=student,
        )
        return enrollment


class ClassroomActivityAssignSerializer(serializers.Serializer):
    activity_id = serializers.CharField(max_length=50)
    due_at = serializers.DateTimeField(required=False, allow_null=True)
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
    )

    def validate_activity_id(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Activity id cannot be empty.")
        return cleaned

    def validate(self, attrs):
        classroom = self.context["classroom"]
        student_ids = attrs.get("student_ids") or []

        enrollment_qs = Enrollment.objects.filter(classroom=classroom)

        if student_ids:
            unique_ids = list(dict.fromkeys(student_ids))
            enrollments = list(
                enrollment_qs.filter(student_id__in=unique_ids).select_related("student")
            )
            found_ids = {en.student_id for en in enrollments}
            missing = [sid for sid in unique_ids if sid not in found_ids]
            if missing:
                raise serializers.ValidationError(
                    {"student_ids": f"Students not in classroom: {missing}"}
                )
        else:
            enrollments = list(enrollment_qs.select_related("student"))

        attrs["students"] = [en.student for en in enrollments]
        return attrs


class ClassroomActivitySummarySerializer(serializers.ModelSerializer):
    activity_title = serializers.SerializerMethodField()
    pe = serializers.SerializerMethodField()
    lp = serializers.SerializerMethodField()
    lp_text = serializers.SerializerMethodField()
    total_assignments = serializers.SerializerMethodField()
    submitted_assignments = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = ClassroomActivity
        fields = [
            "id",
            "activity_id",
            "activity_title",
            "pe",
            "lp",
            "lp_text",
            "assigned_at",
            "due_at",
            "status",
            "total_assignments",
            "submitted_assignments",
            "average_score",
        ]
        read_only_fields = fields

    def _get_activity_meta(self, obj):
        activity_map = self.context.get("activity_map") or {}
        return activity_map.get(obj.activity_id) or {}

    def _get_assignments(self, obj):
        cached = getattr(obj, "_cached_assignments", None)
        if cached is None:
            cached = list(obj.student_assignments.all())
            setattr(obj, "_cached_assignments", cached)
        return cached

    def get_activity_title(self, obj):
        return self._get_activity_meta(obj).get("activity_title")

    def get_pe(self, obj):
        return self._get_activity_meta(obj).get("pe")

    def get_lp(self, obj):
        return self._get_activity_meta(obj).get("lp")

    def get_lp_text(self, obj):
        return self._get_activity_meta(obj).get("lp_text")

    def get_total_assignments(self, obj):
        return len(self._get_assignments(obj))

    def get_submitted_assignments(self, obj):
        assignments = self._get_assignments(obj)
        return sum(
            1
            for assignment in assignments
            if assignment.status in ("submitted", "completed")
        )

    def get_average_score(self, obj):
        assignments = self._get_assignments(obj)
        scores = [assignment.score for assignment in assignments if assignment.score is not None]
        if not scores:
            return None
        return sum(scores) / len(scores)

    def get_status(self, obj):
        total = self.get_total_assignments(obj)
        submitted = self.get_submitted_assignments(obj)
        if total > 0 and submitted >= total:
            return "completed"
        return "active"


class StudentAssignmentSerializer(serializers.ModelSerializer):
    activity_id = serializers.CharField(
        source="classroom_activity.activity_id", read_only=True
    )
    classroom = serializers.SerializerMethodField()
    activity_title = serializers.SerializerMethodField()
    pe = serializers.SerializerMethodField()
    lp = serializers.SerializerMethodField()
    lp_text = serializers.SerializerMethodField()
    assigned_at = serializers.DateTimeField(
        source="classroom_activity.assigned_at", read_only=True
    )

    class Meta:
        model = ClassroomActivityAssignment
        fields = [
            "id",
            "activity_id",
            "activity_title",
            "pe",
            "lp",
            "lp_text",
            "due_at",
            "status",
            "assigned_at",
            "classroom",
        ]
        read_only_fields = fields

    def _get_activity_meta(self, obj):
        activity_id = obj.classroom_activity.activity_id
        activity_map = self.context.get("activity_map") or {}
        return activity_map.get(activity_id) or {}

    def get_classroom(self, obj):
        classroom = obj.classroom_activity.classroom
        return {"id": classroom.id, "name": classroom.name}

    def get_activity_title(self, obj):
        return self._get_activity_meta(obj).get("activity_title")

    def get_pe(self, obj):
        return self._get_activity_meta(obj).get("pe")

    def get_lp(self, obj):
        return self._get_activity_meta(obj).get("lp")

    def get_lp_text(self, obj):
        return self._get_activity_meta(obj).get("lp_text")
