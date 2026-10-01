with open("templates/index.html", "r", encoding="utf-8") as f:
    html = f.read()

import time
import re
html = re.sub(r'styles.css\?v=\d+', f'styles.css?v={int(time.time())}', html)

with open("templates/index.html", "w", encoding="utf-8") as f:
    f.write(html)
