with open("templates/index.html", "r", encoding="utf-8") as f:
    html = f.read()

import time
html = html.replace('script_clean.js', f'script_clean.js?v={int(time.time())}')

with open("templates/index.html", "w", encoding="utf-8") as f:
    f.write(html)
