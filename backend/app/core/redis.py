"""Shared async Redis client (redis-py)."""

from redis.asyncio import Redis

from app.core.config import get_settings

redis_client: Redis = Redis.from_url(
    get_settings().REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
)
