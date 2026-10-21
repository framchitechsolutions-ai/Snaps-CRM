from rest_framework import serializers
from .models import ProjectRequest, Document, SelectedService, Deliverable, Service, Message
from accounts.serializers import UserSerializer


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'code', 'description', 'base_price']


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'file_url', 'document_type', 'original_filename', 'created_at', 'uploaded_by']


class DeliverableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deliverable
        fields = ['id', 'selected_service', 'file_url', 'original_filename', 'created_at']


class SelectedServiceSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    deliverables = DeliverableSerializer(many=True, read_only=True)

    class Meta:
        model = SelectedService
        fields = ['id', 'service', 'price', 'status', 'deliverables']


class SelectedServiceInputSerializer(serializers.Serializer):
    service_id = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)


class ProjectRequestSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    selected_services = SelectedServiceSerializer(many=True, read_only=True)
    customer = UserSerializer(read_only=True)
    assigned_provider = UserSerializer(read_only=True)

    class Meta:
        model = ProjectRequest
        fields = [
            'id', 'title', 'description', 'status', 'created_at', 'updated_at',
            'documents', 'selected_services', 'customer', 'assigned_provider',
        ]


class CreateProjectRequestSerializer(serializers.ModelSerializer):
    selected_services = SelectedServiceInputSerializer(many=True, required=False)

    class Meta:
        model = ProjectRequest
        fields = ['id', 'title', 'description', 'status', 'selected_services', 'created_at']

    def create(self, validated_data):
        services = validated_data.pop('selected_services', [])
        project_request = ProjectRequest.objects.create(**validated_data)
        for item in services:
            service = Service.objects.get(id=item['service_id'])
            SelectedService.objects.create(
                project_request=project_request,
                service=service,
                price=item['price'],
            )
        return project_request


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'content', 'timestamp', 'is_read']
