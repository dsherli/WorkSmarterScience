from rest_framework import serializers
from .models import Classroom
from .models import Enrollment
import random
import string


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom.created_by.field.related_model
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
        # remove join code
        validated_data.pop("join_code", None)

        # request
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "User must be authenticated to join a classroom"
            )

        # set classroom and student = user
        classroom = self.context["classroom"]
        student = request.user

        # guard against dupes in DB
        if Enrollment.objects.filter(classroom=classroom, student=student).exists:
            raise serializers.ValidationError("User is already enrolled in classroom")

        enrollment = Enrollment.objects.create(
            classroom=classroom,
            student=student,
        )
        return enrollment
