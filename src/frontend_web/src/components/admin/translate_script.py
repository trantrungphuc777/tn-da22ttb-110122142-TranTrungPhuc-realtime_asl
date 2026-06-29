import os
import re
import json
import hashlib

def get_key(text):
    return 'k_' + hashlib.md5(text.encode('utf-8')).hexdigest()[:8]

def is_vietnamese(text):
    if not text.strip(): return False
    if len(text.strip()) < 2: return False
    if re.match(r'^[\W_0-9A-Za-z]+$', text.strip()): return False # only symbols/numbers/acronyms/english
    return True

directory = r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\components\admin'

files_to_process = [
    'AdminBadges.jsx', 'AdminClasses.jsx', 'AdminContent.jsx',
    'AdminInstructors.jsx', 'AdminLogs.jsx', 'AdminNotifications.jsx',
    'AdminProfile.jsx', 'AdminReports.jsx', 'AdminRoles.jsx',
    'AdminStatistics.jsx', 'AdminStudents.jsx', 'AdminSupport.jsx',
    'AdminSystem.jsx', 'PaginationBar.jsx'
]

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
    
    # Replace >Text<
    content = re.sub(r'>\s*([^<>{}\n]+?)\s*<', repl_jsx_text, content)
    
    # Replace placeholder="Text", label="Text", title="Text"
    content = re.sub(r'\b(placeholder|label|title|subtitle|badge|sub|text)="([^"]+)"', repl_attr, content)
    
    # Write back
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filename}")

# Dump translations to a file to merge later
with open(os.path.join(directory, 'auto_translations.json'), 'w', encoding='utf-8') as f:
    json.dump(translations, f, ensure_ascii=False, indent=2)

print("Translation extraction completed. Found:", len(translations), "keys")
