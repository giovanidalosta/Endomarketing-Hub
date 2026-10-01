with open("static/styles.css", "r", encoding="utf-8") as f:
    css = f.read()

if "justify-content: flex-start;" not in css:
    css = css.replace("align-items: center;\n    overflow-y: auto;", "align-items: center;\n    justify-content: flex-start;\n    overflow-y: auto;")

with open("static/styles.css", "w", encoding="utf-8") as f:
    f.write(css)
