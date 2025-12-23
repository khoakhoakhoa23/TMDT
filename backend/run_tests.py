#!/usr/bin/env python
"""
Script để chạy tất cả tests trong project
"""
import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")
    django.setup()
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    
    # Chạy tất cả tests
    failures = test_runner.run_tests([
        "products.tests",
        "users.tests",
        "orders.tests",
        "cart.tests",
        "payments.tests",
        "core.tests",
        "analytics.tests",
    ])
    
    if failures:
        sys.exit(1)
    else:
        print("\n✅ Tất cả tests đã pass!")
        sys.exit(0)

