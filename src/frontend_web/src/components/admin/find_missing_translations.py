import os, re, json, codecs

dir_path = r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\components\admin'
trans_file = r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\data\translations.js'

with codecs.open(trans_file, 'r', 'utf-8') as f:
    content = f.read()

found_keys = {}
for file in os.listdir(dir_path):
    if file.endswith('.jsx'):
        with codecs.open(os.path.join(dir_path, file), 'r', 'utf-8') as f:
            file_content = f.read()
            # match t('admin.auto.k_xxx', t('admin.auto.k_xxx', 'string'))
            for match in re.finditer(r"t\('admin\.auto\.(k_[^']+)',\s*t\('admin\.auto\.(?:k_[^']+)',\s*'([^']+)'\)\)", file_content):
                found_keys[match.group(1)] = match.group(2)
            # match t('admin.auto.k_xxx', 'string')
            for match in re.finditer(r"t\('admin\.auto\.(k_[^']+)',\s*'([^']+)'\)", file_content):
                if match.group(1) not in found_keys:
                    found_keys[match.group(1)] = match.group(2)

print(f"Total unique keys found in source: {len(found_keys)}")

missing = {}
for k, v in found_keys.items():
    if k not in content:
        missing[k] = v

print(f"Keys missing in translations.js: {len(missing)}")

with codecs.open(os.path.join(dir_path, 'missing_keys.json'), 'w', 'utf-8') as f:
    json.dump(missing, f, ensure_ascii=False, indent=2)
print("Saved missing_keys.json")
