from backend.market.consumers import MarketConsumer
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r"ws/market/(?P<bar_id>[^/]+)/$", MarketConsumer.as_asgi()),
]
