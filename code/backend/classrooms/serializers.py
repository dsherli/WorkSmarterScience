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
        fields = ["id", "student", "joined_at", "assigned_table"]
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


class ClassroomActivityAssignmentSubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    submission = serializers.SerializerMethodField()

    class Meta:
        model = ClassroomActivityAssignment
        fields = [
            "id",
            "student",
            "status",
            "due_at",
            "submitted_at",
            "score",
            "submission",
        ]
        read_only_fields = fields

    def get_submission(self, obj):
        submission_map = self.context.get("submission_map") or {}
        submission = submission_map.get(obj.student_id)
        if not submission:
            return None
        
        # Get answers from the normalized activity_answers table
        answers = []
        try:
            from activities.models import ActivityAnswer
            answer_objs = ActivityAnswer.objects.filter(
                submission_id=submission.id
            ).order_by("question_number")
            answers = [
                {
                    "id": ans.id,
                    "question_number": ans.question_number,
                    "question_text": ans.question_text,
                    "student_answer": ans.student_answer,
                    "ai_feedback": ans.ai_feedback,
                    "teacher_feedback": ans.teacher_feedback,
                    "score": float(ans.score) if ans.score else None,
                }
                for ans in answer_objs
            ]
        except Exception:
            pass
        
        return {
            "id": submission.id,
            "status": submission.status,
            "submitted_at": submission.submitted_at,
            "score": submission.score,
            "feedback_overview": submission.feedback_overview,
            "attempt_number": submission.attempt_number,
            "answers": answers,
        }


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


from .models import ClassroomTable, TableMessage

class TableMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = TableMessage
        fields = ["id", "table", "sender", "sender_name", "sender_avatar", "content", "timestamp", "is_me"]
        read_only_fields = ["id", "sender", "timestamp", "sender_name", "sender_avatar", "is_me"]

    def get_sender_avatar(self, obj):
        # Placeholder for avatar logic
        return "👨‍🎓"

    def get_is_me(self, obj):
        request = self.context.get("request")
        if request and request.user:
            return obj.sender == request.user
        return False

class ClassroomTableSerializer(serializers.ModelSerializer):
    students = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()

    class Meta:
        model = ClassroomTable
        fields = ["id", "classroom", "name", "x_position", "y_position", "rotation", "students", "messages"]
        read_only_fields = ["id", "classroom", "students", "messages"]

    def get_students(self, obj):
        # Return students assigned to this table
        # We need to look up Enrollments that have this table assigned
        enrollments = obj.students.all().select_related("student")
        return [
            {
                "id": en.student.id,
                "name": en.student.get_full_name() or en.student.username,
                "initials": (en.student.first_name[:1] + en.student.last_name[:1]).upper() if en.student.first_name and en.student.last_name else en.student.username[:2].upper(),
                "avatar": "👨‍🎓", # Placeholder
                "color": "from-blue-500 to-blue-600" # Placeholder
            }
            for en in enrollments
        ]

    def get_messages(self, obj):
        # Return recent messages (e.g. last 50)
        messages = obj.messages.order_by("-timestamp")[:50]
        # Reverse to show chronological order
        reversed_msgs = list(reversed(messages))
        return TableMessageSerializer(reversed_msgs, many=True, context=self.context).data

