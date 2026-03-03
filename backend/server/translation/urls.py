"""
Translation App URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'translation'

router = DefaultRouter()
router.register(r'languages', views.LanguageViewSet, basename='language')
router.register(r'cache', views.TranslationCacheViewSet, basename='translation-cache')
router.register(r'requests', views.TranslationRequestViewSet, basename='translation-request')
router.register(r'keys', views.TranslationKeyViewSet, basename='translation-key')

urlpatterns = [
    # Function-based views
    path('translate/', views.translate_text, name='translate'),
    path('batch/', views.translate_batch, name='translate-batch'),
    path('detect/', views.detect_language, name='detect-language'),
    path('status/', views.translation_status, name='translation-status'),
    
    # Router URLs
    path('', include(router.urls)),
]
