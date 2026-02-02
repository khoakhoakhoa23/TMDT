from django.core.management.base import BaseCommand
from django.utils import timezone
from orders.models import Order
from orders.utils import release_expired_reservations
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Release expired order reservations and restore inventory'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually doing it',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write('DRY RUN MODE - No changes will be made')

        self.stdout.write('Checking for expired order reservations...')

        # Count expired reservations before processing
        now = timezone.now()
        expired_count = Order.objects.filter(
            status="reserved",
            reserved_until__lt=now
        ).count()

        if expired_count == 0:
            self.stdout.write(
                self.style.SUCCESS('No expired reservations found.')
            )
            return

        self.stdout.write(f'Found {expired_count} expired reservation(s)')

        if dry_run:
            # Show details of what would be processed
            expired_orders = Order.objects.filter(
                status="reserved",
                reserved_until__lt=now
            ).select_related('user')

            for order in expired_orders:
                self.stdout.write(f'  - Order #{order.id} by {order.user.username} '
                                f'(expired: {order.reserved_until})')
        else:
            # Actually process the expired reservations
            try:
                processed_count = release_expired_reservations()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully processed {processed_count} expired reservation(s)'
                    )
                )
            except Exception as e:
                logger.error(f'Error releasing expired reservations: {str(e)}')
                self.stdout.write(
                    self.style.ERROR(f'Error: {str(e)}')
                )
