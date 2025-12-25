"""
Script để cập nhật imports trong các file test
"""
import os
import re

# Mapping các app names
APP_MAPPING = {
    'products': 'server.products',
    'orders': 'server.orders',
    'users': 'server.users',
    'cart': 'server.cart',
    'payments': 'server.payments',
    'core': 'server.core',
    'api': 'server.api',
    'analytics': 'server.analytics',
}

def update_imports_in_file(file_path):
    """Cập nhật imports trong một file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Cập nhật từng import - xóa server. prefix
    for old_app, new_app in APP_MAPPING.items():
        # Pattern: from server.app.models import ...
        pattern1 = rf'^from {old_app}\.([a-zA-Z_]+) import'
        replacement1 = rf'from {new_app}.\1 import'
        content = re.sub(pattern1, replacement1, content, flags=re.MULTILINE)
        
        # Pattern: from server.app import ...
        pattern2 = rf'^from {old_app} import'
        replacement2 = rf'from {new_app} import'
        content = re.sub(pattern2, replacement2, content, flags=re.MULTILINE)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {file_path}")
        return True
    return False

def main():
    """Main function"""
    tests_dir = os.path.join(os.path.dirname(__file__), 'tests')
    
    if not os.path.exists(tests_dir):
        print(f"Tests directory not found: {tests_dir}")
        return
    
    updated_count = 0
    for root, dirs, files in os.walk(tests_dir):
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                file_path = os.path.join(root, file)
                if update_imports_in_file(file_path):
                    updated_count += 1
    
    print(f"\nUpdated {updated_count} files")

if __name__ == '__main__':
    main()

