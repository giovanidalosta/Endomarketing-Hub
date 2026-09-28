with open('c:/Users/GiovaniFreitas/Desktop/Projetos/ikatec-geradores/static/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re

# We want to replace the html2canvas call inside exportToPdf and exportToPng
# Let's just use regex to match html2canvas(agendaDoc, {...}).then
pattern = r"html2canvas\(agendaDoc, \{[^}]*onclone:[^}]*\}[^}]*\}\)\.then"

replacement = """html2canvas(agendaDoc, { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById('agendaDoc');
        clonedEl.style.width = '794px';
        clonedEl.style.maxWidth = 'none';
        if (clonedEl.parentElement) {
           clonedEl.parentElement.style.width = '794px';
           clonedEl.parentElement.style.maxWidth = 'none';
           clonedEl.parentElement.style.padding = '0';
        }
      }
    }).then"""

js = re.sub(pattern, replacement, js)

with open('c:/Users/GiovaniFreitas/Desktop/Projetos/ikatec-geradores/static/script.js', 'w', encoding='utf-8') as f:
    f.write(js)