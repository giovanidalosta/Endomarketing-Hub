with open("app.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(len(lines)):
    if "else:" in lines[i]:
        if i + 1 < len(lines) and "try:" in lines[i+1]:
            # find the block size to indent
            spaces_else = len(lines[i]) - len(lines[i].lstrip())
            
            for j in range(i+1, len(lines)):
                if lines[j].strip() == "img_io = BytesIO()":
                    break
                # Only re-indent if it's currently indented poorly relative to else
                cur_spaces = len(lines[j]) - len(lines[j].lstrip())
                if lines[j].strip() != "":
                    # Let's just blindly push everything right by the difference
                    # if they were generated with 8 spaces base
                    lines[j] = " " * (spaces_else - 8) + lines[j]

with open("app.py", "w", encoding="utf-8") as f:
    f.writelines(lines)
