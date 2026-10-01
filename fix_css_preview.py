with open("static/styles.css", "r", encoding="utf-8") as f:
    css = f.read()

if "justify-content: flex-start;" not in css.split(".tool-preview.active {")[1].split("}")[0]:
    css = css.replace(".tool-preview.active {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    animation: fadeIn 0.4s ease;\n  }", ".tool-preview.active {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    justify-content: flex-start;\n    animation: fadeIn 0.4s ease;\n  }")

with open("static/styles.css", "w", encoding="utf-8") as f:
    f.write(css)
