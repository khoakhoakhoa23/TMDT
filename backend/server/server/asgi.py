"""
ASGI config for server project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

# Basic ASGI application (WebSocket support sẽ được thêm sau khi cài channels)
application = get_asgi_application()

# Uncomment khi đã cài channels:
# from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack
# import core.routing
# 
# django_asgi_app = get_asgi_application()
# 
# application = ProtocolTypeRouter({
#     "http": django_asgi_app,
#     "websocket": AuthMiddlewareStack(
#         URLRouter(
#             core.routing.websocket_urlpatterns
#         )
#     ),
# })
