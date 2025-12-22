"""
WebSocket consumers cho real-time notifications và order updates
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from orders.models import Order


class NotificationConsumer(AsyncWebsocketConsumer):
    """Consumer cho real-time notifications"""
    
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'notifications_{self.user_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'notification_message',
                'message': message
            }
        )
    
    # Receive message from room group
    async def notification_message(self, event):
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': message
        }))


class OrderConsumer(AsyncWebsocketConsumer):
    """Consumer cho real-time order updates"""
    
    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.room_group_name = f'order_{self.order_id}'
        
        # Verify user has permission to view this order
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return
        
        # Check if user owns the order or is admin
        has_permission = await self.check_order_permission(user.id, self.order_id)
        if not has_permission:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    @database_sync_to_async
    def check_order_permission(self, user_id, order_id):
        """Kiểm tra user có quyền xem order không"""
        try:
            user = User.objects.get(id=user_id)
            if user.is_superuser or user.is_staff:
                return True
            
            order = Order.objects.get(id=order_id)
            return order.user.id == user_id
        except (User.DoesNotExist, Order.DoesNotExist):
            return False
    
    # Receive message from room group
    async def order_update(self, event):
        """Nhận order update từ room group"""
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'order_update',
            'message': message
        }))


def send_order_update(order_id, update_data):
    """Helper function để gửi order update qua WebSocket"""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    channel_layer = get_channel_layer()
    room_group_name = f'order_{order_id}'
    
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            'type': 'order_update',
            'message': update_data
        }
    )


def send_notification(user_id, notification_data):
    """Helper function để gửi notification qua WebSocket"""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    channel_layer = get_channel_layer()
    room_group_name = f'notifications_{user_id}'
    
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            'type': 'notification_message',
            'message': notification_data
        }
    )

