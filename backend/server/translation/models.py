from django.db import models
from django.conf import settings


class Language(models.Model):
    """Supported languages for translation"""
    code = models.CharField(max_length=10, unique=True)  # e.g., 'vi', 'en', 'zh'
    name = models.CharField(max_length=100)  # e.g., 'Vietnamese', 'English'
    native_name = models.CharField(max_length=100)  # e.g., 'Tiếng Việt'
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'Languages'

    def __str__(self):
        return f"{self.name} ({self.code})"

    def save(self, *args, **kwargs):
        if self.is_default:
            Language.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class TranslationCache(models.Model):
    """Cache for translated text to avoid repeated API calls"""
    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="translation_caches",
    )
    source_text = models.TextField()
    source_lang = models.CharField(max_length=10)
    target_lang = models.CharField(max_length=10)
    translated_text = models.TextField()
    ai_provider = models.CharField(max_length=50, blank=True)  # 'openai', 'gemini', 'groq', etc.
    confidence_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    hit_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['tenant', 'source_text', 'source_lang', 'target_lang']
        indexes = [
            models.Index(fields=['source_lang', 'target_lang']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Translation Cache'
        verbose_name_plural = 'Translation Caches'

    def __str__(self):
        return f"{self.source_lang}→{self.target_lang}: {self.source_text[:50]}..."


class TranslationRequest(models.Model):
    """Track translation requests for content"""
    CONTENT_TYPE_CHOICES = [
        ('chat', 'Chat Message'),
        ('post', 'User Post'),
        ('product', 'Product'),
        ('comment', 'Comment'),
        ('review', 'Review'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('translating', 'Translating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('human_review', 'Human Review'),
    ]

    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    content_id = models.IntegerField()
    original_text = models.TextField()
    source_lang = models.CharField(max_length=10)
    target_lang = models.CharField(max_length=10)
    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="translation_requests",
    )
    
    translated_text = models.TextField(null=True, blank=True)
    ai_provider = models.CharField(max_length=50, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_translations'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'content_id']),
            models.Index(fields=['status']),
            models.Index(fields=['source_lang', 'target_lang']),
        ]

    def __str__(self):
        return f"{self.content_type}:{self.content_id} - {self.source_lang}→{self.target_lang}"


class TranslationKey(models.Model):
    """Store translatable keys for UI translations"""
    key = models.CharField(max_length=200, unique=True)
    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="translation_keys",
    )
    description = models.CharField(max_length=500, blank=True)
    translations = models.JSONField(default=dict)  # {lang_code: translation}
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['key']

    def __str__(self):
        return self.key

    def get_translation(self, lang_code: str) -> str:
        """Get translation for a specific language"""
        return self.translations.get(lang_code, self.key)
