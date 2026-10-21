import asyncio
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Message
from notifications.models import Notification


def _send_to_group(layer, group: str, message: dict) -> None:
    """group_send that works both in a sync view and inside a running event loop."""
    try:
        loop = asyncio.get_running_loop()
        in_loop = loop.is_running()
    except RuntimeError:
        in_loop = False

    if in_loop:
        asyncio.ensure_future(layer.group_send(group, message))
    else:
        async_to_sync(layer.group_send)(group, message)


def _serialize_message(message: Message) -> dict:
    return {
        'id': message.id,
        'conversation_id': message.conversation_id,
        'sender': message.sender_id,
        'content': message.content,
        'timestamp': message.timestamp.isoformat(),
        'is_read': message.is_read,
    }


@receiver(post_save, sender=Message)
def on_message_created(sender, instance, created, **kwargs):
    if not created:
        return

    conversation = instance.conversation
    recipient = conversation.participants.exclude(id=instance.sender_id).first()
    layer = get_channel_layer()

    serialized = _serialize_message(instance)
    if layer:
        _send_to_group(layer, f'chat_{conversation.id}', {'type': 'chat.message', 'message': serialized})

    if recipient:
        sender_name = (
            f"{instance.sender.first_name} {instance.sender.last_name}".strip()
            or instance.sender.email
        )
        notification = Notification.objects.create(
            user=recipient,
            type=Notification.Type.NEW_MESSAGE,
            message=f"New message from {sender_name}",
            link=f"/messaging/{conversation.id}",
        )
        if layer:
            _send_to_group(
                layer,
                f'notifications_{recipient.id}',
                {
                    'type': 'notification.send',
                    'notification': {
                        'id': notification.id,
                        'type': notification.type,
                        'message': notification.message,
                        'is_read': notification.is_read,
                        'link': notification.link,
                        'created_at': notification.created_at.isoformat(),
                    },
                },
            )
