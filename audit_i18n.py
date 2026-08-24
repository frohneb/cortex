import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('js/shared/i18n.js', 'r', encoding='utf-8') as f:
    i18n = f.read()

de_match = re.search(r'de:\s*\{(.*?)\},\s*en:', i18n, re.DOTALL)
en_match = re.search(r'en:\s*\{(.*?)\}\s*\};', i18n, re.DOTALL)

de_keys = set(re.findall(r'([a-zA-Z0-9_]+)\s*:', de_match.group(1))) if de_match else set()
en_keys = set(re.findall(r'([a-zA-Z0-9_]+)\s*:', en_match.group(1))) if en_match else set()

for idx, line in enumerate(lines, 1):
    m = re.findall(r'data-i18n="([^"]+)"', line)
    for k in m:
        if k not in de_keys:
            print(f"Line {idx:3d}: Missing in DE -> '{k}' | Line: {line.strip()}")
        if k not in en_keys:
            print(f"Line {idx:3d}: Missing in EN -> '{k}' | Line: {line.strip()}")
