from django.urls import re_path

from .consumers import MarketConsumer

websocket_urlpatterns = [
    re_path(r"ws/market/(?P<bar_id>[^/]+)/$", MarketConsumer.as_asgi()),
]
