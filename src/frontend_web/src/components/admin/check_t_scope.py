import os

directory = r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\components\admin'
files = [f for f in os.listdir(directory) if f.endswith('.jsx')]

for filename in sorted(files):
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    t_decl_pos = content.find('const { t } = useLanguage();')
    
    if t_decl_pos != -1:
        before_decl = content[:t_decl_pos]
        # Count occurrences of t('admin.auto in the area before the declaration
        t_calls = before_decl.count("t('admin.auto")
        if t_calls > 0:
            print(f"Warning: {filename} has {t_calls} calls to t() BEFORE its declaration.")
    else:
        t_calls = content.count("t('admin.auto")
        if t_calls > 0:
            print(f"Error: {filename} has {t_calls} calls to t() but useLanguage() is not used.")

print("Check completed.")
