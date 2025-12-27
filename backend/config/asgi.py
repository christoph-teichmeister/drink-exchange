import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

from django.core.asgi import get_asgi_application

http_application = get_asgi_application()

from channels.auth import AuthMiddlewareStack  # noqa: E402
from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

from market.routing import websocket_urlpatterns  # noqa: E402

# Market flows bridge data through channel layer groups named `market.<bar_id>` so that
# backend tasks can emit to specific bar rooms via channel_layer.group_send("market.<bar_id>", ...).
application = ProtocolTypeRouter(
    {
        "http": http_application,
        "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)
