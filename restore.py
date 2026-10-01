import re

with open("temp_index.html", "r", encoding="utf-8") as f:
    temp_html = f.read()

with open("templates/index.html", "r", encoding="utf-8") as f:
    orig_html = f.read()

# Extract from temp_index.html
form_match = re.search(r'(<form id="form-certificado".*?</form>)', temp_html, re.DOTALL)
preview_match = re.search(r'(<div id="preview-certificado".*?</div>\s*</div>\s*</div>)', temp_html, re.DOTALL)

if form_match and preview_match:
    form_html = form_match.group(1)
    preview_html = preview_match.group(1)
    
    # Replace in orig_html
    orig_html = re.sub(r'<form id="form-certificado".*?</form>', form_html, orig_html, flags=re.DOTALL)
    orig_html = re.sub(r'<div id="preview-certificado".*?</div>\s*</div>\s*</div>', preview_html, orig_html, flags=re.DOTALL)
    
    with open("templates/index.html", "w", encoding="utf-8") as f:
        f.write(orig_html)
        
    print("HTML restaurado com sucesso.")
else:
    print("Erro ao extrair HTML")
