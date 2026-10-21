from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

User = get_user_model()


class ListConversationsView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)


class ConversationDetailView(generics.RetrieveAPIView, generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MessageSerializer
        return ConversationSerializer

    def get_object(self):
        conversation_id = self.kwargs['conversation_id']
        return Conversation.objects.get(id=conversation_id, participants=self.request.user)

    def perform_create(self, serializer):
        conversation = self.get_object()
        serializer.save(conversation=conversation, sender=self.request.user)


class ContactsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        target_type = 'customer' if user.user_type == 'provider' else 'provider'

        my_conversations = list(
            Conversation.objects.filter(participants=user).prefetch_related('participants')
        )
        conversation_by_user = {}
        for conv in my_conversations:
            other = conv.participants.exclude(id=user.id).first()
            if other:
                conversation_by_user[other.id] = conv.id

        contacts = []
        for contact in User.objects.filter(user_type=target_type):
            contacts.append({
                'id': contact.id,
                'name': f"{contact.first_name} {contact.last_name}".strip() or contact.email,
                'email': contact.email,
                'is_online': contact.is_online,
                'conversation_id': conversation_by_user.get(contact.id),
            })

        return Response(contacts)


class CreateConversationView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        participant_id = request.data.get('participant_id')
        if not participant_id:
            return Response({'detail': 'participant_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        participant = get_object_or_404(User, id=participant_id)
        conversation = (
            Conversation.objects.filter(participants=request.user)
            .filter(participants=participant)
            .first()
        )
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, participant)

        return Response(ConversationSerializer(conversation).data, status=status.HTTP_201_CREATED)
