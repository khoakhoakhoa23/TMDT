from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils.text import slugify

from products.models import LoaiXe, Xe, BlogPost
from orders.models import Order, OrderItem


class Command(BaseCommand):
    help = "Seed dá»¯ liá»‡u demo (loáº¡i xe, xe, blog)"

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding demo data..."))

        # Táº¡o admin demo náº¿u chÆ°a cÃ³
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@example.com", "admin123")
            self.stdout.write(self.style.SUCCESS("Created superuser admin/admin123"))

        # Loáº¡i xe
        loai_data = [
            ("LX01", "Xe tay ga"),
            ("LX02", "Xe sá»‘"),
            ("LX03", "Xe cÃ´n tay"),
        ]
        loai_map = {}
        for ma, ten in loai_data:
            obj, _ = LoaiXe.objects.get_or_create(ma_loai=ma, defaults={"ten_loai": ten})
            loai_map[ma] = obj

        xe_data = [
            {
                "ma": "X001",
                "ten": "Yamaha Grande",
                "gia": 45000000,
                "gia_km": 42000000,
                "mau": "Äá»",
                "loai": "LX01",
                "mota": "Xe tay ga tiáº¿t kiá»‡m xÄƒng, phÃ¹ há»£p Ä‘Ã´ thá»‹.",
                "img": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
            },
            {
                "ma": "X002",
                "ten": "Honda Vision",
                "gia": 34000000,
                "gia_km": None,
                "mau": "Tráº¯ng",
                "loai": "LX01",
                "mota": "Nhá» gá»n, dá»… lÃ¡i, chi phÃ­ tháº¥p.",
                "img": "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d",
            },
            {
                "ma": "X003",
                "ten": "Honda Winner X",
                "gia": 46500000,
                "gia_km": 45000000,
                "mau": "Xanh",
                "loai": "LX03",
                "mota": "Xe cÃ´n tay máº¡nh máº½, thiáº¿t káº¿ thá»ƒ thao.",
                "img": "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
            },
            {
                "ma": "X004",
                "ten": "Yamaha Exciter 155",
                "gia": 51000000,
                "gia_km": 49500000,
                "mau": "Äen",
                "loai": "LX03",
                "mota": "CÃ´n tay hiá»‡u nÄƒng cao, phanh ABS.",
                "img": "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
            },
            {
                "ma": "X005",
                "ten": "Honda Future 125",
                "gia": 32000000,
                "gia_km": None,
                "mau": "Xanh",
                "loai": "LX02",
                "mota": "Xe sá»‘ bá»n bá»‰, tiáº¿t kiá»‡m xÄƒng.",
                "img": "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d",
            },
        ]

        for item in xe_data:
            loai = loai_map[item["loai"]]
            slug = slugify(item["ten"])
            Xe.objects.update_or_create(
                ma_xe=item["ma"],
                defaults={
                    "ten_xe": item["ten"],
                    "slug": slug,
                    "gia": item["gia"],
                    "gia_khuyen_mai": item["gia_km"],
                    "so_luong": 10,
                    "mau_sac": item["mau"],
                    "loai_xe": loai,
                    "mo_ta_ngan": item["mota"],
                    "mo_ta": item["mota"],
                    "trang_thai": "in_stock",
                    "image_url": item["img"],
                    "seo_title": item["ten"],
                    "seo_description": item["mota"],
                    "seo_keywords": f"{item['ten']}, {item['mau']}, {loai.ten_loai}",
                },
            )

        blog_data = [
            {
                "title": "Top 5 máº«u xe tay ga Ä‘Ã¡ng mua 2025",
                "excerpt": "Danh sÃ¡ch xe tay ga tiáº¿t kiá»‡m, thiáº¿t káº¿ Ä‘áº¹p cho Ä‘Ã´ thá»‹.",
                "content": "<p>Gá»£i Ã½ cÃ¡c máº«u xe ná»•i báº­t cÃ¹ng Æ°u Ä‘Ã£i.</p>",
                "img": "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d",
            },
            {
                "title": "Máº¹o chá»n xe cÃ´n tay cho ngÆ°á»i má»›i",
                "excerpt": "Chia sáº» kinh nghiá»‡m chá»n dung tÃ­ch, chiá»u cao yÃªn vÃ  an toÃ n.",
                "content": "<p>HÆ°á»›ng dáº«n chi tiáº¿t cho ngÆ°á»i má»›i chÆ¡i xe cÃ´n tay.</p>",
                "img": "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
            },
            {
                "title": "Báº£o dÆ°á»¡ng xe Ä‘á»‹nh ká»³ Ä‘á»ƒ bá»n hÆ¡n",
                "excerpt": "Lá»‹ch thay dáº§u, kiá»ƒm tra lá»‘p, phanh vÃ  áº¯c quy.",
                "content": "<p>Checklist báº£o dÆ°á»¡ng giÃºp xe váº­n hÃ nh á»•n Ä‘á»‹nh.</p>",
                "img": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
            },
        ]

        for post in blog_data:
            slug = slugify(post["title"])
            BlogPost.objects.update_or_create(
                slug=slug,
                defaults={
                    "title": post["title"],
                    "excerpt": post["excerpt"],
                    "content": post["content"],
                    "image_url": post["img"],
                    "seo_title": post["title"],
                    "seo_description": post["excerpt"],
                    "seo_keywords": post["title"],
                    "is_published": True,
                },
            )

        # Seed Ä‘Æ¡n hÃ ng máº«u náº¿u chÆ°a cÃ³
        user, _ = User.objects.get_or_create(username="user1", defaults={"email": "user1@example.com"})
        if not user.has_usable_password():
            user.set_password("user123456")
            user.save()

        if not Order.objects.exists():
            sample_xe = list(Xe.objects.all()[:2])
            if len(sample_xe) >= 1:
                order = Order.objects.create(
                    user=user,
                    total_price=0,
                    status="pending",
                    shipping_name="User One",
                    shipping_phone="0900000000",
                    shipping_address="123 ÄÆ°á»ng ABC",
                    shipping_city="HCM",
                    payment_method="COD",
                )
                total = 0
                for xe in sample_xe:
                    qty = 1
                    price = xe.gia_khuyen_mai if xe.gia_khuyen_mai else xe.gia
                    OrderItem.objects.create(
                        order=order, xe=xe, quantity=qty, price_at_purchase=price
                    )
                    total += price * qty
                order.total_price = total
                order.save()
                self.stdout.write(self.style.SUCCESS("Created sample order for user1"))

        self.stdout.write(self.style.SUCCESS("Seed data created/updated."))

