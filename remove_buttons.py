import re
with open("templates/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Remove the buttons div
html = re.sub(r'<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;">\s*<button id="btn-trocar-fundo".*?</div>', '', html, flags=re.DOTALL)
# Remove script.js v15
html = re.sub(r'<script src="{{ url_for\(\'static\', filename=\'script\.js\'\) }}\?v=\d+"></script>', '<script src="{{ url_for(\'static\', filename=\'script_clean.js\') }}"></script>', html)

with open("templates/index.html", "w", encoding="utf-8") as f:
    f.write(html)
