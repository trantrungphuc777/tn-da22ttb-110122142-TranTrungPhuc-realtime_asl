import os
import re
import json
import hashlib

def get_key(text):
    return 'k_' + hashlib.md5(text.encode('utf-8')).hexdigest()[:8]

def is_vietnamese(text):
    if not text.strip(): return False
    if len(text.strip()) < 2: return False
    if re.match(r'^[\W_0-9A-Za-z]+$', text.strip()): return False
    return True

directory = r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\components\admin'

files_to_process = ['AdminDashboard.jsx', 'AdminLayout.jsx']

translations = {}

def repl_jsx_text(match):
    text = match.group(1)
    if is_vietnamese(text) and '{' not in text and '}' not in text:
        key = get_key(text.strip())
        translations[key] = text.strip()
        safe_text = text.strip().replace("'", "\\'")
        return f'> {{t(\'admin.auto.{key}\', \'{safe_text}\')}} <'
    return match.group(0)

def repl_attr(match):
    attr = match.group(1)
    text = match.group(2)
    if is_vietnamese(text) and '{' not in text and '}' not in text:
        key = get_key(text)
        translations[key] = text
        safe_text = text.replace("'", "\\'")
        return f'{attr}={{t(\'admin.auto.{key}\', \'{safe_text}\')}}'
    return match.group(0)

for filename in files_to_process:
    filepath = os.path.join(directory, filename)
    if not os.path.exists(filepath): continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # ensure useLanguage
    if 'useLanguage' not in content:
        content = re.sub(r'(import React.*?from \'react\';)', r'\1\nimport { useLanguage } from \'../../contexts/LanguageContext\';', content)
        comp_name = filename.replace('.jsx', '')
        pattern = r'(const ' + comp_name + r' = \(.*?\) => \{\n)'
        content = re.sub(pattern, r'\1    const { t } = useLanguage();\n', content)

    # Replace >Text<
    content = re.sub(r'>\s*([^<>{}\n]+?)\s*<', repl_jsx_text, content)
    
    # Replace placeholder="Text", label="Text", title="Text", sub="Text"
    content = re.sub(r'\b(placeholder|label|title|subtitle|badge|sub|text)="([^"]+)"', repl_attr, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {filename}')

with open(os.path.join(directory, 'auto_translations2.json'), 'w', encoding='utf-8') as f:
    json.dump(translations, f, ensure_ascii=False, indent=2)

print('Translation extraction completed. Found:', len(translations), 'keys')
