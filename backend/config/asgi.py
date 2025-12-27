import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

from market.routing import websocket_urlpatterns

# Market flows bridge data through channel layer groups named `market.<bar_id>` so that
# backend tasks can emit to specific bar rooms via channel_layer.group_send("market.<bar_id>", ...).
http_application = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": http_application,
        "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)
