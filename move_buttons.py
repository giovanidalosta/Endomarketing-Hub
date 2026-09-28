with open('c:/Users/GiovaniFreitas/Desktop/Projetos/ikatec-geradores/templates/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re

# 1. Agenda
# Remove from left panel
html = re.sub(r'<div class="export-row">\s*<button id="exportPdfBtn" class="btn btn--outline">Exportar PDF</button>\s*<button id="exportPngBtn" class="btn btn--outline">Exportar PNG</button>\s*</div>', '', html)

# Insert into right panel
agenda_prev_old = r'<div class="panel__title panel__title--preview">Pré-visualização da Agenda</div>'
agenda_prev_new = r'''<div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div class="panel__title panel__title--preview" style="margin-bottom: 0;">Pré-visualização da Agenda</div>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" id="exportPdfBtn" class="btn btn--outline">Exportar PDF</button>
            <button type="button" id="exportPngBtn" class="btn btn--primary">Exportar PNG</button>
          </div>
        </div>'''
html = html.replace(agenda_prev_old, agenda_prev_new)

# 2. Cardapio
html = re.sub(r'<button type="button" id="export-cardapio".*?</button>', '', html)
cardapio_prev_old = r'<div class="panel__title panel__title--preview">Pré-visualização do Cardápio</div>'
cardapio_prev_new = r'''<div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div class="panel__title panel__title--preview" style="margin-bottom: 0;">Pré-visualização do Cardápio</div>
          <button type="button" id="export-cardapio" class="btn btn--primary" disabled>Exportar PNG</button>
        </div>'''
html = html.replace(cardapio_prev_old, cardapio_prev_new)

# 3. Ikanews
html = re.sub(r'<button type="button" id="export-ikanews".*?</button>', '', html)
ikanews_prev_old = r'<div class="panel__title panel__title--preview">Pré-visualização Ikanews</div>'
ikanews_prev_new = r'''<div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div class="panel__title panel__title--preview" style="margin-bottom: 0;">Pré-visualização Ikanews</div>
          <button type="button" id="export-ikanews" class="btn btn--primary" disabled>Exportar PNG</button>
        </div>'''
html = html.replace(ikanews_prev_old, ikanews_prev_new)

# 4. Certificado
html = re.sub(r'<button type="button" id="export-certificado".*?</button>', '', html)
cert_prev_old = r'<div class="panel__title panel__title--preview">Pré-visualização Certificado</div>'
cert_prev_new = r'''<div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div class="panel__title panel__title--preview" style="margin-bottom: 0;">Pré-visualização Certificado</div>
          <button type="button" id="export-certificado" class="btn btn--primary" disabled>Exportar PNG</button>
        </div>'''
html = html.replace(cert_prev_old, cert_prev_new)


with open('c:/Users/GiovaniFreitas/Desktop/Projetos/ikatec-geradores/templates/index.html', 'w', encoding='utf-8') as f:
    f.write(html)