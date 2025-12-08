from django.db import models


class Admin(models.Model):
    username = models.CharField(max_length=100, primary_key=True)
    password = models.CharField(max_length=255)

    def __str__(self):
        return self.username

