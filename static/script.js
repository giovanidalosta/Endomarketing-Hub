document.addEventListener("DOMContentLoaded", () => {
  let debounceTimers = {};
  let currentBlobData = {};

  /* ==========================================
     HELPER - Carregar Imagem e Fontes como Promise
     ========================================== */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('Falha ao carregar imagem: ' + src));
      img.src = src;
    });
  }

  const fontCache = {};
  async function loadFontFace(family, url, descriptors = {}) {
    const key = `${family}_${descriptors.weight || 'normal'}`;
    if (fontCache[key]) return fontCache[key];
    try {
      const font = new FontFace(family, `url(${url})`, descriptors);
      const loaded = await font.load();
      document.fonts.add(loaded);
      fontCache[key] = loaded;
      return loaded;
    } catch (err) {
      console.warn(`Aviso ao carregar fonte ${family}:`, err);
    }
  }

  let fontsLoadingPromise = null;
  function loadAllHubFonts() {
    if (!fontsLoadingPromise) {
      fontsLoadingPromise = Promise.all([
        loadFontFace('Exo', 'static/fontes/Exo-Bold.ttf', { weight: 'bold' }),
        loadFontFace('Exo-Bold', 'static/fontes/Exo-Bold.ttf', { weight: 'normal' }),
        loadFontFace('Exo-Bold', 'static/fontes/Exo-Bold.ttf', { weight: 'bold' }),
        loadFontFace('Exo-Regular', 'static/fontes/Exo-Regular.ttf', { weight: 'normal' }),
        loadFontFace('Calibri', 'static/fontes/calibri.ttf', { weight: 'normal' }),
        loadFontFace('calibri', 'static/fontes/calibri.ttf', { weight: 'normal' }),
        loadFontFace('Disket-Mono-Bold', 'static/fontes/Disket-Mono-Bold.ttf', { weight: 'bold' }),
        loadFontFace('Disket-Mono-Bold', 'static/fontes/Disket-Mono-Bold.ttf', { weight: 'normal' })
      ]).then(() => document.fonts.ready);
    }
    return fontsLoadingPromise;
  }

  // Preload fonts immediately
  loadAllHubFonts();

  /* ==========================================
     NAVEGAÇÃO DAS ABAS — gerenciada por script_clean.js
     ========================================== */

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

    agendaDoc.innerHTML = `<div class="doc-stripe"></div><div class="doc-header"><div class="doc-logo"><img src="static/logo.png" alt="Ikatec" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=doc-logo-placeholder>IK</span>'" /></div><div class="doc-title-area"><div class="doc-label">Ikatec Tecnologia e Inovação</div><div class="doc-title">Agenda de Integração</div><div class="doc-welcome">Bem-vindo(a) à Ikatec, ${escHtml(name)}!</div></div></div><div class="doc-info-band"><div class="doc-info-item"><div class="doc-info-label">Colaborador</div><div class="doc-info-value">${escHtml(name)}</div></div><div class="doc-info-item"><div class="doc-info-label">Data da Integração</div><div class="doc-info-value">${dateStr}</div></div></div><div class="doc-body"><div class="doc-section-label">Programação do Dia</div>${tableHtml}</div><div class="doc-footer"><span class="doc-footer-tag">Tecnologia e inovação para transformar negócios e pessoas</span><span class="doc-footer-logo"><img src="static/logo-agenda.png" alt="Logo Ikatec" class="footer-logo" onerror="this.style.display='none'"></span></div>`;
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
     LÓGICA - IKANEWS (Canvas Client-Side)
     ========================================== */
  const ikaQtd = document.getElementById("ika-qtd");
  const ikaContainer = document.getElementById("colaboradores-container");

  function quebraTextoSimples(texto, limite = 20) {
    if (!texto) return [];
    const palavras = String(texto).split(/\s+/).filter(Boolean);
    const linhas = [];
    let linha = '';
    for (const palavra of palavras) {
      const teste = linha ? `${linha} ${palavra}` : palavra;
      if (teste.length <= limite) {
        linha = teste;
      } else {
        if (linha) linhas.push(linha);
        linha = palavra;
      }
    }
    if (linha) linhas.push(linha);
    return linhas;
  }

  async function getIkanewsColaboradoresData() {
    const qtd = parseInt(ikaQtd ? ikaQtd.value : '1') || 1;
    const colaboradores = [];
    for (let i = 1; i <= qtd; i++) {
      const nomeInp = document.querySelector(`input[name="nome_${i}"]`);
      const cargoInp = document.querySelector(`input[name="cargo_${i}"]`);
      const fotoInp = document.querySelector(`input[name="foto_${i}"]`);

      const nome = nomeInp ? nomeInp.value.trim() : '';
      const cargo = cargoInp ? cargoInp.value.trim() : '';

      let photoImg = null;
      if (fotoInp && fotoInp.files && fotoInp.files[0]) {
        try {
          const file = fotoInp.files[0];
          const objUrl = URL.createObjectURL(file);
          photoImg = await loadImage(objUrl);
        } catch (err) {
          console.warn(`Erro ao carregar foto do colaborador ${i}:`, err);
        }
      }

      colaboradores.push({ nome, cargo, photoImg });
    }
    return colaboradores;
  }

  async function drawIkanewsCanvas(colaboradores) {
    await loadAllHubFonts();
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Background base image
    const baseImg = await loadImage('static/ikanews_fundo.png');
    ctx.drawImage(baseImg, 0, 0, 1920, 1080);

    const quantidade = colaboradores.length;
    let labelSize, nameSize, cargoSize;
    if (quantidade === 4) {
      labelSize = 20; nameSize = 22; cargoSize = 22;
    } else if (quantidade === 3) {
      labelSize = 22; nameSize = 24; cargoSize = 24;
    } else {
      labelSize = 24; nameSize = 26; cargoSize = 26;
    }

    const fontLabel = `bold ${labelSize}px "Disket-Mono-Bold", monospace`;
    const fontNome = `bold ${nameSize}px "Disket-Mono-Bold", monospace`;
    const fontCargo = `bold ${cargoSize}px "Disket-Mono-Bold", monospace`;

    let posicoes;
    if (quantidade === 1) {
      posicoes = [Math.floor((1920 - (284 + 260)) / 2)];
    } else if (quantidade === 2) {
      posicoes = [220, 1000];
    } else if (quantidade === 3) {
      posicoes = [300, 820, 1340];
    } else {
      posicoes = [250, 640, 1030, 1420];
    }

    for (let i = 0; i < quantidade; i++) {
      const colab = colaboradores[i];
      const x = posicoes[i];
      const y = (quantidade === 1 || quantidade === 2) ? 400 : 330;
      const tamanhoFoto = quantidade === 1 ? 284 : 250;

      // Draw photo or rounded placeholder
      ctx.save();
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, tamanhoFoto, tamanhoFoto, 25);
      } else {
        const r = 25;
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + tamanhoFoto, y, x + tamanhoFoto, y + tamanhoFoto, r);
        ctx.arcTo(x + tamanhoFoto, y + tamanhoFoto, x, y + tamanhoFoto, r);
        ctx.arcTo(x, y + tamanhoFoto, x, y, r);
        ctx.arcTo(x, y, x + tamanhoFoto, y, r);
        ctx.closePath();
      }
      ctx.clip();

      if (colab.photoImg) {
        // Centered square crop
        const w = colab.photoImg.width;
        const h = colab.photoImg.height;
        const s = Math.min(w, h);
        const sx = Math.floor((w - s) / 2);
        const sy = Math.floor((h - s) / 2);
        ctx.drawImage(colab.photoImg, sx, sy, s, s, x, y, tamanhoFoto, tamanhoFoto);
      } else {
        ctx.fillStyle = '#152339';
        ctx.fillRect(x, y, tamanhoFoto, tamanhoFoto);
      }
      ctx.restore();

      // Coordinates for texts
      let textX, textY, nomeLimite, cargoLimite;
      if (quantidade === 1) {
        textX = x + tamanhoFoto + 40;
        textY = y + 112;
        nomeLimite = 18;
        cargoLimite = 24;
      } else if (quantidade === 2) {
        textX = x + tamanhoFoto + 20;
        textY = y + 90;
        nomeLimite = 18;
        cargoLimite = 24;
      } else {
        textX = x;
        textY = y + tamanhoFoto + 14;
        nomeLimite = 16;
        cargoLimite = 18;
      }

      const nomeLinhas = quebraTextoSimples((colab.nome || '').toUpperCase(), nomeLimite);
      const cargoLinhas = quebraTextoSimples((colab.cargo || '').toUpperCase(), cargoLimite);

      ctx.textBaseline = 'top';
      const labelSpacing = 28;

      // Label NOME
      ctx.font = fontLabel;
      ctx.fillStyle = 'white';
      ctx.fillText('NOME', textX, textY);

      // NOME Value
      ctx.font = fontNome;
      ctx.fillStyle = '#08CFFF';
      const nomeLineHeight = Math.floor(nameSize * 1.2);
      nomeLinhas.forEach((line, lIdx) => {
        ctx.fillText(line, textX, textY + labelSpacing + (lIdx * nomeLineHeight));
      });

      const numNomeLines = Math.max(1, nomeLinhas.length);
      const cargoLabelY = textY + labelSpacing + (numNomeLines * nomeLineHeight) + labelSpacing;

      // Label CARGO
      ctx.font = fontLabel;
      ctx.fillStyle = 'white';
      ctx.fillText('CARGO', textX, cargoLabelY);

      // CARGO Value
      ctx.font = fontCargo;
      ctx.fillStyle = '#08CFFF';
      const cargoLineHeight = Math.floor(cargoSize * 1.2);
      cargoLinhas.forEach((line, lIdx) => {
        ctx.fillText(line, textX, cargoLabelY + labelSpacing + (lIdx * cargoLineHeight));
      });
    }

    return canvas;
  }

  if (ikaQtd) {
    function renderIkanewsInputs() {
      const qtd = parseInt(ikaQtd.value);
      const currentBoxes = ikaContainer.querySelectorAll('.colab-box');
      const currentCount = currentBoxes.length;

      if (qtd > currentCount) {
        for (let i = currentCount + 1; i <= qtd; i++) {
          const div = document.createElement('div');
          div.className = 'colab-box';
          div.innerHTML = `
            <h4>Colaborador ${i}</h4>
            <div class="form-row">
              <div class="field"><label>Nome</label><input type="text" name="nome_${i}" placeholder="Ex: Fulano da Silva" required></div>
              <div class="field"><label>Cargo</label><input type="text" name="cargo_${i}" placeholder="Ex: Desenvolvedor" required></div>
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
        for (let i = currentCount; i > qtd; i--) {
          ikaContainer.removeChild(ikaContainer.lastElementChild);
        }
      }
      
      debounceUpdate('ikanews');
    }
    ikaQtd.addEventListener("change", renderIkanewsInputs);
    
    if (ikaContainer.querySelectorAll('.colab-box').length === 0) {
      renderIkanewsInputs();
    }
  }

  /* ==========================================
     LÓGICA - CARDÁPIO (SheetJS + Canvas)
     ========================================== */
  const cardapioFile = document.getElementById('cardapio-file');
  const cardapioEditor = document.getElementById('cardapio-editor');
  const cardapioPeriodo = document.getElementById('cardapio-periodo');
  const cardapioDiasContainer = document.getElementById('cardapio-dias-container');

  let cardapioData = null;

  function parseCardapioExcel(arrayBuffer) {
    if (typeof XLSX === 'undefined') {
      throw new Error('Biblioteca XLSX não carregada.');
    }
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    function safeGet(r, c) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddr];
      if (!cell) return '';
      if (cell.v instanceof Date) return cell.v;
      if (cell.w !== undefined && cell.w !== null && String(cell.w).trim() !== '') {
        return String(cell.w).trim();
      }
      if (cell.v !== undefined && cell.v !== null) {
        return String(cell.v).trim();
      }
      return '';
    }

    function fmtDate(val) {
      if (val instanceof Date) {
        const d = String(val.getUTCDate()).padStart(2, '0');
        const m = String(val.getUTCMonth() + 1).padStart(2, '0');
        return `${d}/${m}`;
      }
      const s = String(val).trim();
      const match = s.match(/(\d{1,2})[\/\-](\d{1,2})/);
      if (match) return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}`;
      return s || "01/01";
    }

    let periodo = "01/01 a 05/01";
    try {
      const rawInicio = safeGet(1, 1);
      const rawFim = safeGet(1, 5);
      if (rawInicio && rawFim) {
        periodo = `${fmtDate(rawInicio)} a ${fmtDate(rawFim)}`;
      }
    } catch (e) {
      console.warn("Erro ao calcular período:", e);
    }

    function textoEvento(t) {
      const s = String(t || '').trim().toLowerCase();
      if (['segunda', 'terça', 'terca', 'quarta', 'quinta', 'sexta'].includes(s)) {
        return 'Sabor da Casa';
      }
      return String(t || '').trim();
    }

    const dias = ["segunda", "terca", "quarta", "quinta", "sexta"];
    const differe = safeGet(12, 5);
    const diasDados = [];

    for (let col = 1; col <= 5; col++) {
      const pratos = [];
      for (let row = 3; row <= 6; row++) {
        pratos.push(String(safeGet(row, col) || ''));
      }
      diasDados.push({
        dia: dias[col - 1],
        evento: textoEvento(safeGet(2, col)),
        pratos: pratos
      });
    }

    return { periodo, dias: diasDados, differe: String(differe || '') };
  }

  async function drawCardapioCanvas(data) {
    await loadAllHubFonts();
    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 864;
    const ctx = canvas.getContext('2d');

    // Background
    const baseImg = await loadImage('static/cardapio_base.jpg');
    ctx.drawImage(baseImg, 0, 0, 1536, 864);

    ctx.textBaseline = 'top';

    // 1. Periodo
    ctx.font = 'bold 46px "Exo", "Exo-Bold", sans-serif';
    ctx.fillStyle = '#13A8C8';
    ctx.fillText(data.periodo || '', 1150, 90);

    const coordenadas = [100, 375, 655, 930, 1205];
    const linhas = [373, 465, 555, 655];

    function wrapText(text, maxWidth, font) {
      if (!text) return [];
      ctx.font = font;
      const words = String(text).split(/\s+/).filter(Boolean);
      const lines = [];
      let currentLine = [];
      for (const word of words) {
        currentLine.push(word);
        const testLine = currentLine.join(' ');
        if (ctx.measureText(testLine).width > maxWidth) {
          if (currentLine.length === 1) {
            lines.push(currentLine[0]);
            currentLine = [];
          } else {
            currentLine.pop();
            lines.push(currentLine.join(' '));
            currentLine = [word];
          }
        }
      }
      if (currentLine.length > 0) lines.push(currentLine.join(' '));
      return lines;
    }

    function escreverEvento(x, y, texto) {
      const font = 'bold 24px "Exo", "Exo-Bold", sans-serif';
      ctx.font = font;
      ctx.fillStyle = '#041621';
      const lines = wrapText(texto, 250, font);
      lines.forEach((line, index) => {
        ctx.fillText(line, x, y + index * 26);
      });
    }

    function escreverPrato(x, y, texto) {
      const font = '20px "Calibri", "calibri", sans-serif';
      ctx.font = font;
      ctx.fillStyle = '#041621';
      const lines = wrapText(texto, 250, font);
      lines.forEach((line, index) => {
        ctx.fillText(line, x, y + index * 25);
      });
    }

    (data.dias || []).forEach((colData, i) => {
      if (i >= coordenadas.length) return;
      const x = coordenadas[i];
      escreverEvento(x, 270, colData.evento || '');

      const pratos = colData.pratos || ['', '', '', ''];
      pratos.forEach((prato, pIdx) => {
        if (pIdx < linhas.length) {
          escreverPrato(x, linhas[pIdx], prato);
        }
      });
    });

    if (data.differe) {
      escreverPrato(1205, 740, data.differe);
    }

    return canvas;
  }

  if (cardapioFile) {
    cardapioEditor.style.display = 'none';
    
    cardapioFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const arrayBuffer = await file.arrayBuffer();
        cardapioData = parseCardapioExcel(arrayBuffer);
        
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
                <input type="text" class="cardapio-prato" data-index="${i}" data-p="0" value="${dia.pratos[0] || ''}" />
              </div>
              <div class="field">
                <label>De casa 2</label>
                <input type="text" class="cardapio-prato" data-index="${i}" data-p="1" value="${dia.pratos[1] || ''}" />
              </div>
              <div class="field">
                <label>Acompanhamento</label>
                <input type="text" class="cardapio-prato" data-index="${i}" data-p="2" value="${dia.pratos[2] || ''}" />
              </div>
              <div class="field">
                <label>Levíssimo</label>
                <input type="text" class="cardapio-prato" data-index="${i}" data-p="3" value="${dia.pratos[3] || ''}" />
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
        alert('Não foi possível ler a planilha. Verifique o formato do arquivo.');
      }
    });
  }

  /* ==========================================
     LÓGICA - GERAÇÃO CLIENT-SIDE (DEBOUNCED)
     ========================================== */
  function debounceUpdate(toolName) {
    if (debounceTimers[toolName]) {
      clearTimeout(debounceTimers[toolName]);
    }
    debounceTimers[toolName] = setTimeout(() => {
      generateLocalPreview(toolName);
    }, 250);
  }

  async function generateLocalPreview(toolName) {
    const renderEl = document.getElementById(`render-${toolName}`);
    const exportBtn = document.getElementById(`export-${toolName}`);

    if (toolName === 'cardapio') {
      if (!cardapioData) {
        renderEl.innerHTML = `<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg><p>Faça upload de uma planilha .xlsx para visualizar o cardápio.</p></div>`;
        renderEl.style.display = "block";
        if (exportBtn) exportBtn.disabled = true;
        return;
      }

      cardapioData.periodo = cardapioPeriodo.value;
      const differeEl = document.getElementById('cardapio-differe');
      cardapioData.differe = differeEl ? differeEl.value : '';

      cardapioEditor.querySelectorAll('.cardapio-evento').forEach(el => {
        const idx = parseInt(el.dataset.index);
        if (cardapioData.dias[idx]) cardapioData.dias[idx].evento = el.value;
      });
      cardapioEditor.querySelectorAll('.cardapio-prato').forEach(el => {
        const idx = parseInt(el.dataset.index);
        const p = parseInt(el.dataset.p);
        if (cardapioData.dias[idx]) cardapioData.dias[idx].pratos[p] = el.value;
      });

      try {
        const canvas = await drawCardapioCanvas(cardapioData);
        const dataUrl = canvas.toDataURL('image/png');
        renderEl.innerHTML = `<img src="${dataUrl}" alt="Cardápio Gerado" style="max-width: 100%; border-radius: 8px; box-shadow: var(--shadow-md);">`;

        if (exportBtn) {
          exportBtn.disabled = false;
          exportBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `Cardapio_${(cardapioData.periodo || 'Semanal').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
            link.href = dataUrl;
            link.click();
          };
        }
      } catch (err) {
        console.error('Erro na renderização do cardápio:', err);
        renderEl.innerHTML = `<div class="empty-state"><p>Erro ao gerar imagem do cardápio.</p></div>`;
      }

    } else if (toolName === 'ikanews') {
      const colaboradores = await getIkanewsColaboradoresData();

      const hasMissing = colaboradores.some(c => !c.nome || !c.cargo);
      if (hasMissing) {
        renderEl.innerHTML = `<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM12 11h.01M8 11h.01M16 11h.01M12 15h.01"/></svg><p>Preencha nome e cargo dos colaboradores para visualizar a arte do IKANEWS.</p></div>`;
        renderEl.style.display = "block";
        if (exportBtn) exportBtn.disabled = true;
        return;
      }

      try {
        const canvas = await drawIkanewsCanvas(colaboradores);
        const dataUrl = canvas.toDataURL('image/png');
        renderEl.innerHTML = `<img src="${dataUrl}" alt="IKANEWS Gerado" style="max-width: 100%; border-radius: 8px; box-shadow: var(--shadow-md);">`;

        if (exportBtn) {
          exportBtn.disabled = false;
          exportBtn.onclick = () => {
            const link = document.createElement('a');
            const now = new Date();
            const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
            link.download = `IKANEWS_${dateStr}.png`;
            link.href = dataUrl;
            link.click();
          };
        }
      } catch (err) {
        console.error('Erro ao gerar arte IKANEWS:', err);
        renderEl.innerHTML = `<div class="empty-state"><p>Erro ao gerar a arte do IKANEWS.</p></div>`;
      }
    }
  }

  // Pre-bind forms
  const clientForms = ['cardapio', 'ikanews'];
  clientForms.forEach(tool => {
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
        debounceUpdate(tool);
      }
    }
  });

});