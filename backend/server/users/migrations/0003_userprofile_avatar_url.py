# Generated migration for adding avatar_url field to UserProfile

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_userprofile'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='avatar_url',
            field=models.URLField(blank=True, help_text='Avatar URL từ OAuth provider (Facebook, Google, etc.)', max_length=500, null=True),
        ),
    ]

