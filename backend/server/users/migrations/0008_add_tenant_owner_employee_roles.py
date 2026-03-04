"""
Migration: Thêm role TENANT_OWNER và EMPLOYEE

Thêm các role mới theo mô hình Franchise SaaS:
- TENANT_OWNER: Chủ sở hữu tenant
- EMPLOYEE: Nhân viên (thay thế STAFF)
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_userprofile_deleted_at_userprofile_status_and_more'),
    ]

    operations = [
        # Thêm field mới cho UserProfile để hỗ trợ role mới
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[
                    ('SUPER_ADMIN', 'Super Admin'),
                    ('TENANT_OWNER', 'Chủ sở hữu'),
                    ('TENANT_ADMIN', 'Quản trị viên'),
                    ('EMPLOYEE', 'Nhân viên'),
                    ('CUSTOMER', 'Khách hàng'),
                ],
                default='CUSTOMER',
                help_text='Vai trò: SUPER_ADMIN, TENANT_OWNER, TENANT_ADMIN, EMPLOYEE, CUSTOMER',
                max_length=20
            ),
        ),
        
        # Thêm index cho role để tối ưu query
        migrations.AddIndex(
            model_name='userprofile',
            index=models.Index(fields=['role'], name='users_userp_role_idx'),
        ),
        
        # Thêm index cho tenant + role kết hợp
        migrations.AddIndex(
            model_name='userprofile',
            index=models.Index(fields=['tenant', 'role'], name='users_userp_tenant_role_idx'),
        ),
    ]
