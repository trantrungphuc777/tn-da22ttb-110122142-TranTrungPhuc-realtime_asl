import os, re, sys, codecs

sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

directory = r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\components\admin'

viet_chars = set('àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ')

def is_viet(text):
    return any(c in viet_chars for c in text)

files = [f for f in os.listdir(directory) if f.endswith('.jsx')]

results = []
for filename in sorted(files):
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
            continue
        for match in re.finditer(r"'([^']{2,}?)'", line):
            text = match.group(1)
            if is_viet(text) and 'admin.auto' not in text:
                before = line[:match.start()]
                if any(skip in before for skip in ['import', 'className', 'class=', 'src=', 'style', 'require']):
                    continue
                results.append(f'{filename}:{i+1}: {text[:80]}')
                break

with open(os.path.join(directory, 'remaining_viet.txt'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(results))

print(f'Found {len(results)} remaining Vietnamese strings. Written to remaining_viet.txt')
