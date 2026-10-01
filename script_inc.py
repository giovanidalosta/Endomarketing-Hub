with open("templates/index.html", "r", encoding="utf-8") as f:
    content = f.read()

if "certificado_live.js" not in content:
    content = content.replace("</body>", "  <script src=\"{{ url_for('static', filename='certificado_live.js') }}?v=9\"></script>\n</body>")
    with open("templates/index.html", "w", encoding="utf-8") as f:
        f.write(content)
