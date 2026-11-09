#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Synchronizes code/index.html to project root index.html with proper 'code/' asset prefixes.
Version: 2.1.0
"""
import os
import re

def sync_root_index():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(base_dir, 'code', 'index.html')
    dest_path = os.path.join(base_dir, 'index.html')

    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace assets to code/ prefixes
    content = content.replace('href="favicon.svg"', 'href="code/favicon.svg"')
    content = content.replace('href="css/style.css"', 'href="code/css/style.css"')
    content = content.replace('src="js/logger.js"', 'src="code/js/logger.js"')
    content = content.replace('src="js/data_bundle.js"', 'src="code/js/data_bundle.js"')
    content = content.replace('src="js/icons.js"', 'src="code/js/icons.js"')
    content = content.replace('src="js/qrcode.js"', 'src="code/js/qrcode.js"')
    content = content.replace('src="js/app.js"', 'src="code/js/app.js"')

    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Successfully synchronized {src_path} -> {dest_path}")

if __name__ == '__main__':
    sync_root_index()
