# 🔧 Hướng Dẫn Sửa Lỗi: relation "users_userprofile" does not exist

## ❌ Vấn Đề

Lỗi: `django.db.utils.ProgrammingError: relation "users_userprofile" does not exist`

**Nguyên nhân:** Migration `0002_userprofile` đã được tạo nhưng chưa được apply vào database.

---

## ✅ Đã Sửa

### 1. Kiểm Tra Migration Status

**Command:**
```bash
python manage.py showmigrations users
```

**Kết quả trước khi sửa:**
```
users
 [X] 0001_initial
 [ ] 0002_userprofile  ← Chưa được apply
```

### 2. Chạy Migration

**Command:**
```bash
python manage.py migrate users
```

**Kết quả sau khi sửa:**
```
users
 [X] 0001_initial
 [X] 0002_userprofile  ← Đã được apply
```

### 3. Kiểm Tra Database

**Command:**
```bash
python manage.py shell
>>> from users.models import UserProfile
>>> UserProfile._meta.db_table
'users_userprofile'
```

---

## 📋 Checklist

- [x] Model `UserProfile` có trong `users/models.py`
- [x] Migration `0002_userprofile.py` đã được tạo
- [x] `INSTALLED_APPS` có chứa `'users'`
- [x] Migration đã được apply vào database
- [x] Bảng `users_userprofile` đã được tạo

---

## 🔍 Kiểm Tra Chi Tiết

### 1. Model UserProfile

**File:** `backend/server/users/models.py`

```python
class UserProfile(models.Model):
    """Model mở rộng thông tin User với avatar"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=500, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[...], blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 2. Migration File

**File:** `backend/server/users/migrations/0002_userprofile.py`

Migration này tạo bảng `users_userprofile` với các trường:
- `id` (Primary Key)
- `user_id` (Foreign Key to User)
- `avatar`
- `phone`
- `address`
- `date_of_birth`
- `gender`
- `created_at`
- `updated_at`

### 3. INSTALLED_APPS

**File:** `backend/server/server/settings.py`

```python
INSTALLED_APPS = [
    # ...
    "users",  # ✅ App users đã được thêm
    # ...
]
```

---

## 🚀 Các Bước Thực Hiện

### Bước 1: Kiểm Tra Migration Status

```bash
cd backend/server
python manage.py showmigrations users
```

### Bước 2: Apply Migration

```bash
python manage.py migrate users
```

Hoặc apply tất cả migrations:

```bash
python manage.py migrate
```

### Bước 3: Kiểm Tra Database

```bash
python manage.py shell
```

```python
from users.models import UserProfile
from django.contrib.auth.models import User

# Kiểm tra bảng có tồn tại không
print(UserProfile._meta.db_table)

# Tạo một UserProfile test
user = User.objects.first()
if user:
    profile, created = UserProfile.objects.get_or_create(user=user)
    print(f"Profile created: {created}")
    print(f"Profile: {profile}")
```

### Bước 4: Kiểm Tra Trong Database

Nếu dùng PostgreSQL:
```sql
\dt users_userprofile
```

Nếu dùng SQLite:
```sql
.tables users_userprofile
```

---

## 🐛 Nếu Vẫn Lỗi

### 1. Xóa và Tạo Lại Migration

```bash
# Xóa migration file (KHÔNG XÓA nếu đã có data trong production!)
rm users/migrations/0002_userprofile.py

# Tạo lại migration
python manage.py makemigrations users

# Apply migration
python manage.py migrate users
```

### 2. Fake Migration (Nếu bảng đã tồn tại)

```bash
python manage.py migrate users 0002_userprofile --fake
```

### 3. Reset Migration (CHỈ DÙNG TRONG DEVELOPMENT!)

```bash
# XÓA TẤT CẢ DATA! CHỈ DÙNG TRONG DEVELOPMENT!
python manage.py migrate users zero
python manage.py migrate users
```

---

## 📝 Lưu Ý

1. **Không xóa migration nếu đã có data trong production**
2. **Luôn backup database trước khi chạy migration**
3. **Kiểm tra migration status trước khi deploy**
4. **Nếu có conflict, giải quyết từng bước**

---

## ✅ Kết Quả

Sau khi chạy `python manage.py migrate users`:

- ✅ Bảng `users_userprofile` đã được tạo trong database
- ✅ Migration `0002_userprofile` đã được apply
- ✅ Code có thể truy vấn `UserProfile` không còn lỗi
- ✅ API `/api/users/me/` hoạt động bình thường

---

## 🔗 Liên Quan

- Model: `backend/server/users/models.py`
- Migration: `backend/server/users/migrations/0002_userprofile.py`
- View: `backend/server/users/views.py` (sử dụng `UserProfile.objects.get_or_create()`)
- Serializer: `backend/server/users/serializers.py` (sử dụng `UserProfileSerializer`)

