"""Celery app (`celery -A app.workers.celery_app worker|beat`)."""

import os
import sys

from celery import Celery
from kombu import Queue

from app.core.config import get_settings

if sys.platform == "darwin":
    # billiard starts prefork children with `spawn` on macOS; without this flag Celery skips
    # task setup in the children and every task fails with "not enough values to unpack".
    os.environ.setdefault("FORKED_BY_MULTIPROCESSING", "1")

settings = get_settings()

QUEUES = ("default", "ingestion", "documents", "ai", "notifications")

celery_app = Celery(
    "tenderscout",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)
celery_app.conf.update(
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_queues=[Queue(name) for name in QUEUES],
    task_default_queue="default",
    broker_connection_retry_on_startup=True,
    # The 02:00 IST CPPP ingestion job is added here in Task 9.
    beat_schedule={},
)

# Task modules under app.modules are autodiscovered here once they exist, e.g.
# celery_app.autodiscover_tasks(["app.modules.ingestion", "app.modules.documents"])


@celery_app.task(name="app.workers.celery_app.ping")
def ping() -> str:
    return "pong"
