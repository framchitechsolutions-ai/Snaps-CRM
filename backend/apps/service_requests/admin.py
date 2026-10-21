from django.contrib import admin
from .models import Service, ProjectRequest, Document, SelectedService, Deliverable, Message

admin.site.register(Service)
admin.site.register(ProjectRequest)
admin.site.register(Document)
admin.site.register(SelectedService)
admin.site.register(Deliverable)