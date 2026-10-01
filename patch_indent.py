with open("app.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(len(lines)):
    if "else:        try:" in lines[i]:
        lines[i] = lines[i].replace("else:        try:", "else:\n            try:")
    elif "else:    try:" in lines[i]:
        lines[i] = lines[i].replace("else:    try:", "else:\n        try:")

with open("app.py", "w", encoding="utf-8") as f:
    f.writelines(lines)
