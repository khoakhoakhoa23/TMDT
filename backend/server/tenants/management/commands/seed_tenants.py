"""
Management command to seed initial users and tenants for multi-tenant system.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from tenants.models import Tenant
from tenants.utils import get_or_create_default_tenant
from users.models import UserProfile


class Command(BaseCommand):
    help = 'Seed initial Super Admin and demo Tenant data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--demo',
            action='store_true',
            help='Create demo tenants (Company A, Company B)',
        )

    def handle(self, *args, **options):
        User = get_user_model()

        # Create Super Admin if not exists
        super_admin_username = 'superadmin'
        if not User.objects.filter(username=super_admin_username).exists():
            super_admin = User.objects.create_superuser(
                username=super_admin_username,
                email='superadmin@tmtd.com',
                password='superadmin123',
                is_superuser=True,
                is_staff=True,
            )
            profile, _ = UserProfile.objects.get_or_create(user=super_admin)
            profile.role = 'user'  # Super admin doesn't need tenant role
            profile.tenant = None
            profile.save()
            self.stdout.write(
                self.style.SUCCESS(f'Created Super Admin: {super_admin_username} / superadmin123')
            )
        else:
            self.stdout.write(f'Super Admin already exists: {super_admin_username}')

        # Create demo tenants if --demo flag is set
        if options['demo']:
            demo_tenants = [
                {'name': 'Công ty TNHH TMDT', 'slug': 'tmtd'},
                {'name': 'Công ty Cho Thuê Xe A', 'slug': 'company-a'},
                {'name': 'Công ty Cho Thuê Xe B', 'slug': 'company-b'},
            ]

            for tenant_data in demo_tenants:
                tenant, created = Tenant.objects.get_or_create(
                    slug=tenant_data['slug'],
                    defaults={
                        'name': tenant_data['name'],
                        'is_active': True,
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created tenant: {tenant.name}'))
                else:
                    self.stdout.write(f'Tenant already exists: {tenant.name}')

                # Create Tenant Admin for each tenant
                admin_username = f'admin_{tenant_data["slug"]}'
                if not User.objects.filter(username=admin_username).exists():
                    admin = User.objects.create_user(
                        username=admin_username,
                        email=f'admin@{tenant_data["slug"]}.com',
                        password='admin123',
                        is_staff=True,
                        is_superuser=False,
                    )
                    profile, _ = UserProfile.objects.get_or_create(user=admin)
                    profile.tenant = tenant
                    profile.role = 'tenant_admin'
                    profile.save()
                    self.stdout.write(
                        self.style.SUCCESS(f'  Created Tenant Admin: {admin_username} / admin123 (tenant: {tenant.slug})')
                    )
                else:
                    self.stdout.write(f'  Tenant Admin already exists: {admin_username}')

        self.stdout.write(self.style.SUCCESS('\n=== Seeding completed! ==='))
        self.stdout.write('\nLogin credentials:')
        self.stdout.write('  Super Admin: superadmin / superadmin123')
        if options['demo']:
            self.stdout.write('  Tenant Admin (TMDT): admin_tmtd / admin123')
            self.stdout.write('  Tenant Admin (Company A): admin_company-a / admin123')
