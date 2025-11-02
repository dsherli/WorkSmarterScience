from rest_framework import serializers
from .models import Classroom
import random
import string


class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = '__all__'
        read_only_fields = ('id', 'code', 'created_by', 'created_at', 'updated_at')

    def create(self, validated_data):
        user = self.context['request'].user

        code = ''.join(random.choices(string.ascii_letters + string.digits, k=5))

        validated_data['created_by'] = user
        validated_data['code'] = code

        validated_data['status'] = validated_data.get('status', 'active')
        validated_data['term'] = validated_data.get('term', '')

        return super().create(validated_data)
