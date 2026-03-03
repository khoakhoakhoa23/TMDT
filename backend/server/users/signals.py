from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from tenants.utils import get_or_create_default_tenant
from users.models import UserProfile


User = get_user_model()


@receiver(post_save, sender=User)
def ensure_profile_and_tenant(sender, instance: User, created: bool, **kwargs):
    """
    Ensure every user has a profile and (for non-superusers) a tenant.
    """
    profile, _ = UserProfile.objects.get_or_create(user=instance)

    if instance.is_superuser:
        return

    changed = False

    if not profile.tenant_id:
        profile.tenant = get_or_create_default_tenant()
        changed = True

    # Backward compatibility: existing staff users become tenant_admin by default.
    if instance.is_staff and profile.role != "tenant_admin":
        profile.role = "tenant_admin"
        changed = True

    if changed:
        profile.save()

