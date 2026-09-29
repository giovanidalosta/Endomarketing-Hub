document.addEventListener("DOMContentLoaded", () => {
  let debounceTimers = {};
  let currentBlobData = {};

  /* ==========================================
     NAVEGAÇÃO DAS ABAS
     ========================================== */
  const navBtns = document.querySelectorAll(".nav-btn");
  const toolForms = document.querySelectorAll(".tool-form");
  const toolPreviews = document.querySelectorAll(".tool-preview");

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");

      navBtns.forEach(b => b.classList.remove("active"));
      toolForms.forEach(f => f.classList.remove("active"));
      toolPreviews.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(`form-${target}`).classList.add("active");
      document.getElementById(`preview-${target}`).classList.add("active");
    });
  });

  /* ==========================================
     LÓGICA - AGENDA DE INTEGRAÇÃO
     ========================================== */
  let activityCounter = 0;
  const activities = [];

  const collabNameEl = document.getElementById('collabName');
  const integrationDateEl = document.getElementById('integrationDate');
  const addActivityBtn = document.getElementById('addActivityBtn');
  const activitiesContainer = document.getElementById('activitiesContainer');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const exportPngBtn = document.getElementById('exportPngBtn');
  const agendaDoc = document.getElementById('agendaDoc');

  const TYPE_LABELS = {
    normal: 'Normal',
    free: 'Horário Livre',
    lunch: 'Almoço',
    training: 'Treinamento',
    meeting: 'Reunião'
  };

  function fmtTime(t) { return t ? t.replace(':', 'h') : '--:--'; }
  function fmtDate(d) {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  }
  function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function createActivityCard() {
    activityCounter++;
    const id = activityCounter;
    activities.push({ id, start: '', end: '', title: '', desc: '', type: 'normal' });

    const card = document.createElement('div');
    card.className = 'activity-card';
    card.dataset.id = id;
    card.innerHTML = `
      <div class="card-header">
        <span>Atividade ${id}</span>
        <button type="button" class="remove-btn" title="Remover"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>
      <div class="time-row">
        <div class="field"><label>Início</label><input type="time" class="js-start" /></div>
        <div class="field"><label>Fim</label><input type="time" class="js-end" /></div>
      </div>
      <div class="field"><label>Título</label><input type="text" class="js-title" placeholder="Ex.: Integração com RH" /></div>
      <div class="field"><label>Descrição</label><textarea class="js-desc" placeholder="Detalhes da atividade..."></textarea></div>
      <div class="field"><label>Tipo</label>
        <select class="js-type">
          <option value="normal">Normal</option><option value="free">Horário Livre</option><option value="lunch">Almoço</option>
          <option value="training">Treinamento</option><option value="meeting">Reunião</option>
        </select>
      </div>`;

    card.querySelector('.remove-btn').addEventListener('click', () => {
      const idx = activities.findIndex(a => a.id === id);
      if (idx !== -1) activities.splice(idx, 1);
      card.remove();
      renderAgenda();
    });

    const sync = () => {
      const a = activities.find(a => a.id === id);
      if (!a) return;
      a.start = card.querySelector('.js-start').value;
      a.end = card.querySelector('.js-end').value;
      a.title = card.querySelector('.js-title').value;
      a.desc = card.querySelector('.js-desc').value;
      a.type = card.querySelector('.js-type').value;
      renderAgenda();
    };

    card.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', sync); el.addEventListener('change', sync);
    });

    activitiesContainer.appendChild(card);
    renderAgenda();
  }

  function renderAgenda() {
    const name = collabNameEl.value.trim() || '[Nome do Colaborador]';
    const rawDate = integrationDateEl.value;
    const dateStr = rawDate ? fmtDate(rawDate) : '[Data da Integração]';
    const sorted = activities.slice().sort((a, b) => a.start.localeCompare(b.start));

    let rowsHtml = '';
    sorted.forEach(act => {
      if (!act.title && !act.start) return;
      rowsHtml += `
        <tr class="row-${act.type}">
          <td>${fmtTime(act.start)} &ndash; ${fmtTime(act.end)}</td>
          <td><span class="act-badge">${TYPE_LABELS[act.type] || act.type}</span>
          <div class="act-title">${escHtml(act.title || '')}</div>
          ${act.desc ? `<div class="act-desc">${escHtml(act.desc)}</div>` : ''}</td>
        </tr>`;
    });

    const tableHtml = rowsHtml
      ? `<table class="agenda-table"><thead><tr><th>Horário</th><th>Atividade</th></tr></thead><tbody>${rowsHtml}</tbody></table>`
      : `<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg><p>Adicione atividades no painel ao lado para visualizar a agenda.</p></div>`;

    agendaDoc.innerHTML = `<div class="doc-stripe"></div><div class="doc-header"><div class="doc-logo"><img src="/static/logo.png" alt="Ikatec" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=doc-logo-placeholder>IK</span>'" /></div><div class="doc-title-area"><div class="doc-label">Ikatec Tecnologia e Inovação</div><div class="doc-title">Agenda de Integração</div><div class="doc-welcome">Bem-vindo(a) à Ikatec, ${escHtml(name)}!</div></div></div><div class="doc-info-band"><div class="doc-info-item"><div class="doc-info-label">Colaborador</div><div class="doc-info-value">${escHtml(name)}</div></div><div class="doc-info-item"><div class="doc-info-label">Data da Integração</div><div class="doc-info-value">${dateStr}</div></div></div><div class="doc-body"><div class="doc-section-label">Programação do Dia</div>${tableHtml}</div><div class="doc-footer"><span class="doc-footer-tag">Tecnologia e inovação para transformar negócios e pessoas</span><span class="doc-footer-logo"><img src="/static/logo-agenda.png" alt="Logo Ikatec" class="footer-logo" onerror="this.style.display='none'"></span></div>`;
  }

  function exportToPdf() {
    const orig = exportPdfBtn.innerHTML;
    exportPdfBtn.textContent = 'Gerando...';
    exportPdfBtn.disabled = true;
        html2canvas(agendaDoc, { 
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
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save('agenda-integracao.pdf');
    }).finally(() => { exportPdfBtn.innerHTML = orig; exportPdfBtn.disabled = false; });
  }

  function exportToPng() {
    const orig = exportPngBtn.innerHTML;
    exportPngBtn.textContent = 'Gerando...';
    exportPngBtn.disabled = true;
        html2canvas(agendaDoc, { 
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
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'agenda-integracao.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).finally(() => { exportPngBtn.innerHTML = orig; exportPngBtn.disabled = false; });
  }

  if (addActivityBtn) {
    addActivityBtn.addEventListener('click', createActivityCard);
    exportPdfBtn.addEventListener('click', exportToPdf);
    exportPngBtn.addEventListener('click', exportToPng);
    collabNameEl.addEventListener('input', renderAgenda);
    integrationDateEl.addEventListener('input', renderAgenda);
    renderAgenda();
  }

  /* ==========================================
     LÓGICA - IKANEWS (Dinâmico)
     ========================================== */
  const ikaQtd = document.getElementById("ika-qtd");
  const ikaContainer = document.getElementById("colaboradores-container");
  if(ikaQtd) {
    function renderIkanewsInputs() {
      const qtd = parseInt(ikaQtd.value);
      const currentBoxes = ikaContainer.querySelectorAll('.colab-box');
      const currentCount = currentBoxes.length;

      if (qtd > currentCount) {
        // Add new boxes
        for (let i = currentCount + 1; i <= qtd; i++) {
          const div = document.createElement('div');
          div.className = 'colab-box';
          div.innerHTML = `
            <h4>Colaborador ${i}</h4>
            <div class="form-row">
              <div class="field"><label>Nome</label><input type="text" name="nome_${i}" required></div>
              <div class="field"><label>Cargo</label><input type="text" name="cargo_${i}" required></div>
            </div>
            <div class="field"><label>Foto (Opcional)</label><input type="file" name="foto_${i}" accept="image/*"></div>
          `;
          
          div.querySelectorAll('input').forEach(el => {
            el.addEventListener('input', () => debounceUpdate('ikanews'));
            el.addEventListener('change', () => debounceUpdate('ikanews'));
          });
          
          ikaContainer.appendChild(div);
        }
      } else if (qtd < currentCount) {
        // Remove excess boxes
        for (let i = currentCount; i > qtd; i--) {
          ikaContainer.removeChild(ikaContainer.lastElementChild);
        }
      }
      
      debounceUpdate('ikanews');
    }
    ikaQtd.addEventListener("change", renderIkanewsInputs);
    
    if(ikaContainer.querySelectorAll('.colab-box').length === 0) {
      renderIkanewsInputs();
    }
  }

  /* ==========================================
     LÓGICA - CARDÁPIO (Upload -> Edição)
     ========================================== */
  const cardapioFile = document.getElementById('cardapio-file');
  const cardapioEditor = document.getElementById('cardapio-editor');
  const cardapioPeriodo = document.getElementById('cardapio-periodo');
  const cardapioDiasContainer = document.getElementById('cardapio-dias-container');

  let cardapioData = null; 

  if (cardapioFile) {
    cardapioEditor.style.display = 'none';
    
    cardapioFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/parse-cardapio', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Erro ao ler planilha');
        
        cardapioData = await response.json();
        
        cardapioPeriodo.value = cardapioData.periodo || '';
        
        let html = '';
        const diaNomes = {'segunda': 'Segunda-feira', 'terca': 'Terça-feira', 'quarta': 'Quarta-feira', 'quinta': 'Quinta-feira', 'sexta': 'Sexta-feira'};
        
        cardapioData.dias.forEach((dia, i) => {
          html += `
            <div class="colab-box">
              <h4>${diaNomes[dia.dia] || dia.dia}</h4>
              <div class="field">
                <label>Evento / Título</label>
                <input type="text" class="cardapio-evento" data-index="${i}" value="${dia.evento}" />
              </div>
              <div class="field">
                <label>De casa 1</label>
                <input type="text" class="cardapio-prato" data-index="${i}" data-p="0" value="${dia.pratos[0]}" />
              </div>
              <div class="field">
                <label>De casa 2</label>
                <input type="text" class="cardapio-prato" data-index="${i}" data-p="1" value="${dia.pratos[1]}" />
              </div>
              <div class="field">
                <label>Acompanhamento</label>
                <input type="text" class="cardapio-prato" data-index="${i}" data-p="2" value="${dia.pratos[2]}" />
              </div>
              <div class="field">
                <label>Levíssimo</label>
                <input type="text" class="cardapio-prato" data-index="${i}" data-p="3" value="${dia.pratos[3]}" />
              </div>
              ${dia.dia === 'sexta' ? `
              <div class="divider"></div>
              <div class="field">
                <label>Differe</label>
                <textarea id="cardapio-differe" rows="3">${cardapioData.differe || ''}</textarea>
              </div>` : ''}
            </div>
          `;
        });
        
        cardapioDiasContainer.innerHTML = html;
        cardapioEditor.style.display = 'flex';
        
        cardapioEditor.querySelectorAll('input, textarea').forEach(el => {
          el.addEventListener('input', () => debounceUpdate('cardapio'));
          el.addEventListener('change', () => debounceUpdate('cardapio'));
        });
        
        debounceUpdate('cardapio');

      } catch (err) {
        console.error(err);
        alert('Não foi possível ler a planilha.');
      }
    });
  }

  /* ==========================================
     LÓGICA - AJAX REAL-TIME (DEBOUNCED)
     ========================================== */
  function debounceUpdate(toolName) {
    if (debounceTimers[toolName]) {
      clearTimeout(debounceTimers[toolName]);
    }
    debounceTimers[toolName] = setTimeout(() => {
      generatePythonPreview(toolName);
    }, 800);
  }

  async function generatePythonPreview(toolName) {
    const formEl = document.getElementById(`form-${toolName}`);
    const renderEl = document.getElementById(`render-${toolName}`);
    const exportBtn = document.getElementById(`export-${toolName}`);
    
    // Check if form is valid before submitting to backend
    if (!formEl.checkValidity()) {
      renderEl.innerHTML = `<div class="empty-state"><p>Preencha os campos obrigatórios para visualizar a arte.</p></div>`;
      renderEl.style.display = "block";
      if(exportBtn) exportBtn.disabled = true;
      return;
    }

    renderEl.innerHTML = `<div class="empty-state"><p>Gerando visualização...</p></div>`;
    renderEl.style.display = "block";
    if(exportBtn) exportBtn.disabled = true;

    try {
      let response;
      if (toolName === 'cardapio' && cardapioData) {
        cardapioData.periodo = cardapioPeriodo.value;
        const differeEl = document.getElementById('cardapio-differe');
        cardapioData.differe = differeEl ? differeEl.value : '';
        
        cardapioEditor.querySelectorAll('.cardapio-evento').forEach(el => {
          cardapioData.dias[el.dataset.index].evento = el.value;
        });
        cardapioEditor.querySelectorAll('.cardapio-prato').forEach(el => {
          cardapioData.dias[el.dataset.index].pratos[el.dataset.p] = el.value;
        });
        
        response = await fetch('/api/cardapio-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cardapioData)
        });
      } else {
        response = await fetch(formEl.action, { method: formEl.method, body: new FormData(formEl) });
      }

      if (!response.ok) {
        throw new Error("Erro na geração");
      }
      
      const blob = await response.blob();
      
      if(currentBlobData[toolName] && currentBlobData[toolName].url) {
        window.URL.revokeObjectURL(currentBlobData[toolName].url);
      }

      const url = window.URL.createObjectURL(blob);
      let filename = `export-${toolName}.png`;
      const cd = response.headers.get('Content-Disposition');
      if (cd && cd.indexOf('attachment') !== -1) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(cd);
          if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
      }
      
      currentBlobData[toolName] = { url, filename };
      renderEl.innerHTML = `<img src="${url}" alt="Pré-visualização gerada">`;
      
      if(exportBtn) {
        exportBtn.disabled = false;
        exportBtn.onclick = () => {
          const a = document.createElement('a'); 
          a.href = url; 
          a.download = filename; 
          a.click();
        };
      }
      
    } catch (err) {
      console.error(err);
      renderEl.innerHTML = `<div class="empty-state"><p>Ocorreu um erro ao gerar a arte. Verifique os dados inseridos.</p></div>`;
    }
  }

  // Attach event listeners to all inputs in the forms
  const pythonForms = ['cardapio', 'ikanews'];
  pythonForms.forEach(tool => {
    const formEl = document.getElementById(`form-${tool}`);
    if (formEl) {
      formEl.addEventListener('submit', (e) => e.preventDefault()); 
      
      formEl.querySelectorAll('input, select').forEach(el => {
        if (el.id !== 'cardapio-file') {
          el.addEventListener('input', () => debounceUpdate(tool));
          el.addEventListener('change', () => debounceUpdate(tool));
        }
      });
      
      if (tool !== 'cardapio') {
        generatePythonPreview(tool);
      }
    }
  });

});