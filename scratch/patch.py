import re

with open('static/certificado_drag.js', 'r', encoding='utf-8') as f:
    content = f.read()
    
with open('scratch/export_logic.js', 'r', encoding='utf-8') as f:
    new_content = f.read()
    
content = re.sub(
    r'    // Override the "Export" button for Certificado.*?    const saveDefaultBtn = document.getElementById',
    lambda m: new_content + '\n\n    const saveDefaultBtn = document.getElementById',
    content,
    flags=re.DOTALL
)

with open('static/certificado_drag.js', 'w', encoding='utf-8') as f:
    f.write(content)
