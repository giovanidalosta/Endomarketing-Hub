with open("templates/index.html", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('<script src="{{ url_for(\'static\', filename=\'cert_logic.js\') }}?v=4"></script>', '')
with open("templates/index.html", "w", encoding="utf-8") as f:
    f.write(content)
