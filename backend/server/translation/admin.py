from django.contrib import admin
from .models import Language, TranslationCache, TranslationRequest, TranslationKey


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'native_name', 'is_active', 'is_default', 'order']
    list_filter = ['is_active', 'is_default']
    list_editable = ['is_active', 'is_default', 'order']
    search_fields = ['code', 'name', 'native_name']
    ordering = ['order', 'name']


@admin.register(TranslationCache)
class TranslationCacheAdmin(admin.ModelAdmin):
    list_display = ['id', 'source_lang', 'target_lang', 'source_text', 'ai_provider', 'hit_count', 'created_at']
    list_filter = ['source_lang', 'target_lang', 'ai_provider']
    search_fields = ['source_text', 'translated_text']
    readonly_fields = ['created_at', 'updated_at', 'hit_count']
    ordering = ['-created_at']


@admin.register(TranslationRequest)
class TranslationRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'content_type', 'content_id', 'source_lang', 'target_lang', 'status', 'ai_provider', 'created_at']
    list_filter = ['status', 'content_type', 'source_lang', 'target_lang', 'ai_provider']
    search_fields = ['original_text', 'translated_text']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'


@admin.register(TranslationKey)
class TranslationKeyAdmin(admin.ModelAdmin):
    list_display = ['key', 'description', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['key', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['key']
