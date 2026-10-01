with open("templates/index.html", "r", encoding="utf-8") as f:
    html = f.read()

html = html.replace('id="previews-container" style="position: relative;"', 'id="previews-container"')

with open("templates/index.html", "w", encoding="utf-8") as f:
    f.write(html)
