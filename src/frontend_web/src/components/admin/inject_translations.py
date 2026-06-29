import json
import codecs
import os
import re

dir_path = r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\components\admin'
trans_file = r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\data\translations.js'

with codecs.open(os.path.join(dir_path, 'auto_translations.json'), 'r', 'utf-8') as f:
    vi_mapping = json.load(f)
    
with codecs.open(os.path.join(dir_path, 'en_mapping.json'), 'r', 'utf-8') as f:
    en_mapping = json.load(f)

# Format the auto block for VI
vi_auto_str = "auto: {\n"
for k, v in vi_mapping.items():
    safe_v = v.replace("'", "\\'")
    vi_auto_str += f"        {k}: '{safe_v}',\n"
vi_auto_str += "      },"

# Format the auto block for EN
en_auto_str = "auto: {\n"
for k, v in en_mapping.items():
    safe_v = v.replace("'", "\\'")
    en_auto_str += f"        {k}: '{safe_v}',\n"
en_auto_str += "      },"

with codecs.open(trans_file, 'r', 'utf-8') as f:
    content = f.read()

# We need to insert vi_auto_str inside `vi: { admin: { ...`
# Let's find `admin: {` inside `vi: {`
vi_admin_match = re.search(r'vi:\s*\{.*?admin:\s*\{', content, re.DOTALL)
if vi_admin_match:
    insert_pos = vi_admin_match.end()
    content = content[:insert_pos] + "\n      " + vi_auto_str + content[insert_pos:]
    print("Injected into vi.admin")

# Find `admin: {` inside `en: {`
# To find it, we search for `en: {` then `admin: {`
en_match = re.search(r'en:\s*\{.*?admin:\s*\{', content, re.DOTALL)
if en_match:
    insert_pos = en_match.end()
    content = content[:insert_pos] + "\n      " + en_auto_str + content[insert_pos:]
    print("Injected into en.admin")

with codecs.open(trans_file, 'w', 'utf-8') as f:
    f.write(content)

print("Translation merge completed!")
