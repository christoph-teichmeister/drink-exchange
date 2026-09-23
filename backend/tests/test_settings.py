from channels_redis.core import RedisChannelLayer
from django.conf import settings


def test_channel_layer_socket_timeout_exceeds_blocking_pop_window():
    # Guards against redis-py's 5 s default socket timeout cutting off channels-redis' blocking reads.
    host = settings.CHANNEL_LAYERS["default"]["CONFIG"]["hosts"][0]
    assert host["socket_timeout"] > RedisChannelLayer.brpop_timeout
