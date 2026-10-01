with open("app.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(len(lines)):
    if "else:" in lines[i]:
        if i + 1 < len(lines) and "try:" in lines[i+1]:
            # count leading spaces
            spaces_else = len(lines[i]) - len(lines[i].lstrip())
            spaces_try = len(lines[i+1]) - len(lines[i+1].lstrip())
            if spaces_try <= spaces_else:
                lines[i+1] = " " * (spaces_else + 4) + lines[i+1].lstrip()

with open("app.py", "w", encoding="utf-8") as f:
    f.writelines(lines)
