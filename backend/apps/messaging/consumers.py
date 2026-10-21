import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import Conversation, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.group_name = f'chat_{self.conversation_id}'

        if not await self._is_participant():
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if getattr(self, 'group_name', None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            return

        if data.get('type') == 'read':
            await self._mark_read()
            await self.channel_layer.group_send(self.group_name, {
                'type': 'messages_read',
                'conversation_id': self.conversation_id,
                'by': self.user.id,
            })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
        }))

    async def messages_read(self, event):
        await self.send(text_data=json.dumps({
            'type': 'messages_read',
            'conversation_id': event['conversation_id'],
            'by': event['by'],
        }))

    @database_sync_to_async
    def _is_participant(self):
        return Conversation.objects.filter(
            id=self.conversation_id, participants=self.user
        ).exists()

    @database_sync_to_async
    def _mark_read(self):
        # Mark messages sent by the *other* participant as read for the viewer.
        Message.objects.filter(
            conversation_id=self.conversation_id, is_read=False
        ).exclude(sender=self.user).update(is_read=True)


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f'notifications_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if getattr(self, 'group_name', None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notification_send(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification'],
        }))
