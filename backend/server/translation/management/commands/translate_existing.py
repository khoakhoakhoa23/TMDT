from django.core.management.base import BaseCommand
from django.utils import timezone
import asyncio
import logging

from products.models import Xe
from orders.models import Order
from chat.models import Message
from translation.services.translation_service import get_translation_service

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Translate existing content in the database to target language'
    
    CONTENT_TYPES = {
        'products': Xe,
        'orders': Order,
        'chat': Message,
    }
    
    # Fields to translate for each model
    FIELDS_TO_TRANSLATE = {
        'Xe': ['ten_xe', 'mo_ta', 'tieu_de'],
        'Order': [],
        'Message': ['content'],
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--content-type',
            type=str,
            choices=['products', 'orders', 'chat', 'all'],
            default='all',
            help='Type of content to translate',
        )
        parser.add_argument(
            '--target-lang',
            type=str,
            default='vi',
            help='Target language code (default: vi)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually translating',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit number of items to translate',
        )

    def get_fields_to_translate(self, model_class):
        """Get fields to translate based on model"""
        model_name = model_class.__name__
        return self.FIELDS_TO_TRANSLATE.get(model_name, [])

    def handle(self, *args, **options):
        content_type = options['content_type']
        target_lang = options['target_lang']
        dry_run = options['dry_run']
        limit = options['limit']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No translations will be made'))
        
        self.stdout.write(self.style.SUCCESS(f'Starting translation to {target_lang}...'))
        
        # Get translation service
        translation_service = get_translation_service()
        
        # Determine which content types to process
        if content_type == 'all':
            content_types_to_process = self.CONTENT_TYPES.keys()
        else:
            content_types_to_process = [content_type]
        
        total_translated = 0
        
        for ct in content_types_to_process:
            model_class = self.CONTENT_TYPES[ct]
            fields = self.get_fields_to_translate(model_class)
            
            if not fields:
                self.stdout.write(f'Skipping {ct} - no fields configured for translation')
                continue
            
            self.stdout.write(f'\nProcessing {ct}...')
            
            # Get queryset
            queryset = model_class.objects.all()
            if limit:
                queryset = queryset[:limit]
            
            count = queryset.count()
            self.stdout.write(f'Found {count} items')
            
            translated_count = 0
            
            for item in queryset:
                item_translated = False
                
                for field in fields:
                    # Get the value
                    value = getattr(item, field, None)
                    if not value:
                        continue
                    
                    if dry_run:
                        self.stdout.write(f'  Would translate {ct}.{field}#{item.id}: {value[:50]}...')
                        item_translated = True
                    else:
                        try:
                            # Run async translation
                            loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(loop)
                            
                            try:
                                result = loop.run_until_complete(
                                    translation_service.translate(
                                        text=value,
                                        source_lang='auto',
                                        target_lang=target_lang,
                                        use_cache=True
                                    )
                                )
                            finally:
                                loop.close()
                            
                            # Update the field
                            setattr(item, field, result.translated_text)
                            item.save(update_fields=[field])
                            
                            translated_count += 1
                            self.stdout.write(f'  Translated {field}: {result.translated_text[:50]}...')
                            item_translated = True
                            
                        except Exception as e:
                            logger.error(f'Error translating {ct}.{field}#{item.id}: {e}')
                            self.stdout.write(self.style.ERROR(f'  Error: {e}'))
                
                if item_translated and not dry_run:
                    total_translated += 1
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f'\nDry run complete. Would translate approximately {total_translated} items.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\nTranslation complete! Translated {translated_count} fields.'))
