"""
WebSocket routing cho Django Channels
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/notifications/(?P<user_id>\w+)/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/orders/(?P<order_id>\d+)/$', consumers.OrderConsumer.as_asgi()),
]

