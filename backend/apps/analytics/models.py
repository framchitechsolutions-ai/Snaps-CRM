from django.db import models

class KPI(models.Model):
    date = models.DateField()
    total_requests = models.IntegerField(default=0)
    completed_requests = models.IntegerField(default=0)
    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_turnaround_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        unique_together = ['date']