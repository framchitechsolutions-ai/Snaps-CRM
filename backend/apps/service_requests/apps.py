from django.apps import AppConfig


class RequestsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'service_requests'

    def ready(self):
        from . import signals  # noqa: F401
