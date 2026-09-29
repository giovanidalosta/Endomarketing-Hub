document.addEventListener("DOMContentLoaded", () => {
    // Modify the preview HTML for the Certificate
    const renderCert = document.getElementById('render-certificado');
    if (!renderCert) return;
    
    renderCert.style.display = 'block';

    // Build the canvas
    renderCert.innerHTML = `
        <div class="cert-workspace" id="cert-workspace">
            <div class="cert-canvas-wrapper" id="cert-wrapper">
                <div class="cert-canvas" id="cert-canvas">
                    <div id="cert-nome-txt" class="draggable-text">Nome do Aluno</div>
                    <div id="cert-curso-txt" class="draggable-text">Nome do Curso</div>
                    <div id="cert-carga-txt" class="draggable-text">Carga Horária</div>
                    <div id="cert-data-txt" class="draggable-text">Data</div>
                    <div id="cert-tema-txt" class="draggable-text" style="display: none;">Tema</div>
                    <div id="cert-apresentador-txt" class="draggable-text" style="display: none;">Apresentador</div>
                    <div id="snap-line-x" class="snap-line-x"></div>
                    <div id="snap-line-y" class="snap-line-y"></div>
                </div>
            </div>
        </div>
    `;

    const wrapper = document.getElementById('cert-wrapper');
    const workspace = document.getElementById('cert-workspace');
    
    // Scale canvas to fit preview area
    function resizeCanvas() {
        if (!wrapper || !workspace) return;
        const availableWidth = workspace.clientWidth - 40; // 40px padding
        const scale = availableWidth / 1684;
        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.height = `${1190 * scale}px`;
    }
    
    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 100);

    // Resize when switching to the Certificado tab
    const certNavBtn = document.querySelector('.nav-btn[data-target="certificado"]');
    if (certNavBtn) {
        certNavBtn.addEventListener('click', () => {
            setTimeout(resizeCanvas, 50);
        });
    }

    const formCert = document.getElementById('form-certificado');
    if (formCert) {
        formCert.addEventListener('submit', (e) => e.preventDefault());
    }

    // Sync inputs to the text elements
    const inputs = {
        'nome': document.querySelector('#form-certificado input[name="nome"]'),
        'curso': document.querySelector('#form-certificado input[name="curso"]'),
        'carga': document.querySelector('#form-certificado input[name="carga"]'),
        'data': document.querySelector('#form-certificado input[name="data"]'),
        'tema': document.querySelector('#form-certificado input[name="tema"]'),
        'apresentador': document.querySelector('#form-certificado input[name="apresentador"]')
    };

    const texts = {
        'nome': document.getElementById('cert-nome-txt'),
        'curso': document.getElementById('cert-curso-txt'),
        'carga': document.getElementById('cert-carga-txt'),
        'data': document.getElementById('cert-data-txt'),
        'tema': document.getElementById('cert-tema-txt'),
        'apresentador': document.getElementById('cert-apresentador-txt')
    };

    let defaultConfig = {};
    const selModelo = document.getElementById('cert-modelo');
    const radiosMode = document.querySelectorAll('input[name="cert_mode"]');
    const lblModeLote = document.getElementById('lbl-mode-lote');
    const radioLote = document.getElementById('radio-mode-lote');
    
    function createCustomField(fieldId, label, conf) {
        if (document.getElementById(`input-${fieldId}`)) return; // already exists
        
        const divId = `cert-${fieldId}-txt`;
        const dynFields = document.getElementById('dynamic-fields-container');
        const group = document.createElement('div');
        group.className = 'field';
        group.innerHTML = `<label>${label}</label><input type="text" name="${fieldId}" id="input-${fieldId}" class="form__input" placeholder="Preencha o campo..." />`;
        if (dynFields) dynFields.appendChild(group);
        
        const canvasEl = document.getElementById('cert-canvas');
        const newText = document.createElement('div');
        newText.className = 'draggable-text cert-custom-field';
        newText.id = divId;
        newText.setAttribute('data-label', label);
        if (conf) {
            newText.style.top = conf.top;
            newText.style.left = conf.left;
            newText.style.transform = conf.transform || 'none';
            if (conf.color) newText.style.color = conf.color;
            if (conf.fontSize) newText.style.fontSize = conf.fontSize;
            if (conf.showLabel) newText.dataset.showLabel = conf.showLabel;
        } else {
            newText.style.top = '400px';
            newText.style.left = '400px';
            newText.style.fontSize = '50px'; // default
        }
        
        // This will render it correctly based on datasets
        updateTextHtml(newText, label);
        
        if (canvasEl) canvasEl.appendChild(newText);
        
        const inp = document.getElementById(`input-${fieldId}`);
        if (inp) {
            inp.addEventListener('input', () => {
                updateTextHtml(newText, inp.value || label);
            });
        }
    }

    function loadConfigForModel() {
        const modelo = selModelo ? selModelo.value : 'alura';
        
        // Clear previous custom fields from DOM
        document.querySelectorAll('.cert-custom-field').forEach(el => el.remove());
        const dynFields = document.getElementById('dynamic-fields-container');
        if (dynFields) dynFields.innerHTML = '';
        
        fetch(`/api/certificado-config?modelo=${modelo}`)
            .then(res => res.json())
            .then(config => {
                defaultConfig = config;
                Object.keys(texts).forEach(key => {
                    const el = texts[key];
                    if (!el) return;
                    const conf = defaultConfig[el.id];
                    if (conf) {
                        el.style.top = conf.top;
                        el.style.left = conf.left;
                        el.style.transform = conf.transform || 'none';
                        if (conf.color) el.style.color = conf.color;
                        if (conf.fontSize) el.style.fontSize = conf.fontSize;
                        if (conf.showLabel) el.dataset.showLabel = conf.showLabel;
                        
                        // Re-render HTML with new properties
                        updateTextHtml(el);
                    }
                });
                
                // Re-create custom fields
                Object.keys(config).forEach(k => {
                    if (k.startsWith('cert-extra_')) {
                        const fieldId = k.replace('cert-', '').replace('-txt', '');
                        const conf = config[k];
                        createCustomField(fieldId, conf.label || 'Campo Extra', conf);
                    }
                });
            });
    }

    loadConfigForModel();

    function updateTextHtml(el, val) {
        if (val !== undefined) {
            el.setAttribute('data-value', val);
        } else {
            val = el.getAttribute('data-value') || el.getAttribute('data-placeholder') || el.getAttribute('data-label') || '';
        }
        
        const label = el.getAttribute('data-label') || 'CAMPO';
        const showLabel = el.dataset.showLabel === 'true';
        
        if (showLabel) {
            el.innerHTML = `<span style="display:block; font-size:40%; color:#08CFFF; text-transform:uppercase; margin-bottom: 5px; font-weight: bold; font-family: 'Exo-Regular', sans-serif;">${label}</span><span>${val}</span>`;
        } else {
            el.textContent = val;
        }
    }

    Object.keys(inputs).forEach(key => {
        const inp = inputs[key];
        if (inp) {
            // Give standard elements a data-label based on their initial content
            texts[key].setAttribute('data-label', texts[key].textContent);
            texts[key].setAttribute('data-placeholder', texts[key].textContent);
            texts[key].setAttribute('data-value', texts[key].textContent);
            
            inp.addEventListener('input', () => {
                updateTextHtml(texts[key], inp.value || texts[key].getAttribute('data-placeholder'));
                
                // If it's nome, keep it centered horizontally if user hasn't moved it
                if (key === 'nome' && !texts['nome'].dataset.moved) {
                    const conf = defaultConfig['cert-nome-txt'];
                    if (conf) {
                        texts['nome'].style.transform = conf.transform || 'none';
                        texts['nome'].style.left = conf.left;
                    }
                }
            });
        }
    });
    
    // Inputs/groups
    const grpNome = document.getElementById('group-nome');
    const grpCurso = document.getElementById('group-curso');
    const rowAlura = document.getElementById('row-alura');
    const grpTema = document.getElementById('group-tema');
    const grpApres = document.getElementById('group-apresentador');
    const inputNomeUnico = document.getElementById('input-nome-unico');
    const inputNomeLote = document.getElementById('input-nome-lote');
    const lblNome = document.getElementById('label-nome');

    function updateFormState() {
        const modelo = selModelo.value;
        const mode = document.querySelector('input[name="cert_mode"]:checked').value;
        
        const btnAddField = document.getElementById('btn-add-field');
        const dynFields = document.getElementById('dynamic-fields-container');
        
        // Handle fields visibility
        if (modelo === 'alura') {
            grpCurso.style.display = 'block';
            rowAlura.style.display = 'flex';
            grpTema.style.display = 'none';
            grpApres.style.display = 'none';
            if (btnAddField) btnAddField.style.display = 'none';
            if (dynFields) dynFields.style.display = 'none';
            
            texts['curso'].style.display = 'block';
            texts['carga'].style.display = 'block';
            texts['data'].style.display = 'block';
            texts['tema'].style.display = 'none';
            texts['apresentador'].style.display = 'none';
            
            // hide any custom fields
            document.querySelectorAll('.cert-custom-field').forEach(el => el.style.display = 'none');
            
            radioLote.disabled = true;
            lblModeLote.style.color = 'var(--c-fg-muted)';
            if (mode === 'lote') document.querySelector('input[value="unico"]').checked = true;
        } else if (modelo === 'ikated') {
            grpCurso.style.display = 'none';
            rowAlura.style.display = 'none';
            grpTema.style.display = 'block';
            grpApres.style.display = 'block';
            if (btnAddField) btnAddField.style.display = 'none';
            if (dynFields) dynFields.style.display = 'none';
            
            texts['curso'].style.display = 'none';
            texts['carga'].style.display = 'none';
            texts['data'].style.display = 'none';
            texts['tema'].style.display = 'block';
            texts['apresentador'].style.display = 'block';
            
            document.querySelectorAll('.cert-custom-field').forEach(el => el.style.display = 'none');
            
            radioLote.disabled = false;
            lblModeLote.style.color = 'var(--c-fg)';
        } else if (modelo === 'generico') {
            grpCurso.style.display = 'none';
            rowAlura.style.display = 'none';
            grpTema.style.display = 'none';
            grpApres.style.display = 'none';
            if (btnAddField) btnAddField.style.display = 'block';
            if (dynFields) dynFields.style.display = 'block';
            
            texts['curso'].style.display = 'none';
            texts['carga'].style.display = 'none';
            texts['data'].style.display = 'none';
            texts['tema'].style.display = 'none';
            texts['apresentador'].style.display = 'none';
            
            document.querySelectorAll('.cert-custom-field').forEach(el => el.style.display = 'block');
            
            radioLote.disabled = false;
            lblModeLote.style.color = 'var(--c-fg)';
        }
        
        const newMode = document.querySelector('input[name="cert_mode"]:checked').value;
        if (newMode === 'lote') {
            inputNomeUnico.style.display = 'none';
            inputNomeLote.style.display = 'block';
            lblNome.textContent = 'Lista de Participantes (um por linha)';
            texts['nome'].textContent = '<< Nomes em Lote >>';
        } else {
            inputNomeUnico.style.display = 'block';
            inputNomeLote.style.display = 'none';
            lblNome.textContent = 'Nome do Aluno';
            texts['nome'].textContent = inputNomeUnico.value || texts['nome'].getAttribute('data-placeholder');
        }

        // Change background image based on template
        const canvasEl = document.getElementById('cert-canvas');
        if (canvasEl) {
            canvasEl.style.backgroundImage = `url('/static/certificado_base_${modelo}.png?v=${Date.now()}')`;
        }
    }

    if (selModelo) {
        let lastModelo = selModelo.value;
        selModelo.addEventListener('change', () => {
            if (selModelo.value !== lastModelo) {
                lastModelo = selModelo.value;
                loadConfigForModel();
            }
            updateFormState();
        });
    }
    radiosMode.forEach(r => r.addEventListener('change', updateFormState));
    
    let extraFieldsCount = 0;
    const btnAddField = document.getElementById('btn-add-field');
    if (btnAddField) {
        btnAddField.addEventListener('click', () => {
            const label = prompt('Digite o nome do novo campo (ex: Local, Assinatura):');
            if (!label) return;
            
            extraFieldsCount = Date.now();
            const fieldId = `extra_${extraFieldsCount}`;
            createCustomField(fieldId, label);
        });
    }

    // Make elements draggable
    let activeEl = null;
    let initialX, initialY, startLeft, startTop;
    let snapTargetsX = [];
    let snapTargetsY = [];
    const snapLineX = document.getElementById('snap-line-x');
    const snapLineY = document.getElementById('snap-line-y');
    const SNAP_THRESHOLD = 8; // pixels in original scale

    function buildSnapTargets() {
        snapTargetsX = [1684 / 2]; // Center of canvas
        snapTargetsY = [1190 / 2]; // Center of canvas
        
        document.querySelectorAll('.draggable-text').forEach(el => {
            if (el === activeEl) return;
            const rect = el.getBoundingClientRect();
            const canvasRect = document.getElementById('cert-canvas').getBoundingClientRect();
            const scale = parseFloat(wrapper.style.transform.replace('scale(', '').replace(')', '')) || 1;
            
            const left = (rect.left - canvasRect.left) / scale;
            const top = (rect.top - canvasRect.top) / scale;
            const width = rect.width / scale;
            const height = rect.height / scale;
            
            snapTargetsX.push(left, left + width / 2, left + width);
            snapTargetsY.push(top, top + height / 2, top + height);
        });
    }

    let historyStack = [];
    function captureState() {
        const state = {};
        document.querySelectorAll('.draggable-text').forEach(el => {
            state[el.id] = {
                left: el.style.left || '',
                top: el.style.top || '',
                transform: el.style.transform || '',
                color: el.style.color || '',
                fontSize: el.style.fontSize || '',
                showLabel: el.dataset.showLabel || '',
                moved: el.dataset.moved || ''
            };
        });
        return state;
    }

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
            // Only undo if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            e.preventDefault();
            if (historyStack.length > 0) {
                const prevState = historyStack.pop();
                document.querySelectorAll('.draggable-text').forEach(el => {
                    const saved = prevState[el.id];
                    if (saved) {
                        el.style.left = saved.left;
                        el.style.top = saved.top;
                        el.style.transform = saved.transform;
                        el.style.color = saved.color;
                        el.style.fontSize = saved.fontSize;
                        if (saved.showLabel) el.dataset.showLabel = saved.showLabel;
                        else delete el.dataset.showLabel;
                        if (saved.moved) el.dataset.moved = saved.moved;
                        else delete el.dataset.moved;
                        
                        updateTextHtml(el);
                    }
                });
            }
        }
    });

    const propsPanel = document.getElementById('cert-props-panel');
    const inputColor = document.getElementById('prop-color');
    const inputSize = document.getElementById('prop-size');
    const inputShowLabel = document.getElementById('prop-show-label');
    let activePropsEl = null;

    if (inputColor && inputSize && inputShowLabel) {
        inputColor.addEventListener('input', (e) => {
            if (activePropsEl) activePropsEl.style.color = e.target.value;
        });
        inputSize.addEventListener('input', (e) => {
            if (activePropsEl) activePropsEl.style.fontSize = e.target.value + 'px';
        });
        inputShowLabel.addEventListener('change', (e) => {
            if (activePropsEl) {
                activePropsEl.dataset.showLabel = e.target.checked ? 'true' : 'false';
                updateTextHtml(activePropsEl);
            }
        });
    }

    document.addEventListener('mousedown', (e) => {
        const isPanelClick = e.target.closest('#cert-props-panel');
        const el = e.target.closest('.draggable-text');
        
        if (!el && !isPanelClick) {
            if (propsPanel) propsPanel.style.display = 'none';
            activePropsEl = null;
            return;
        }
        
        if (isPanelClick) return; // let interactions with panel happen
        
        // Element clicked, populate and show panel
        activePropsEl = el;
        if (propsPanel) {
            propsPanel.style.display = 'block';
            
            // Populate color
            // getComputedStyle returns rgb(255, 255, 255), so we must convert or just use el.style.color if it's hex, but it might not be.
            // Let's use a quick helper to convert rgb to hex if needed
            let color = window.getComputedStyle(el).color;
            if (color.startsWith('rgb')) {
                const rgb = color.match(/\d+/g);
                color = `#${Number(rgb[0]).toString(16).padStart(2, '0')}${Number(rgb[1]).toString(16).padStart(2, '0')}${Number(rgb[2]).toString(16).padStart(2, '0')}`;
            }
            inputColor.value = color;
            
            // Populate size
            let size = window.getComputedStyle(el).fontSize;
            inputSize.value = parseInt(size) || 50;
            
            // Populate show label
            inputShowLabel.checked = el.dataset.showLabel === 'true';
        }
        
        historyStack.push(captureState());
        if (historyStack.length > 50) historyStack.shift();

        activeEl = el;
        activeEl.classList.add('dragging');
        
        const scale = parseFloat(wrapper.style.transform.replace('scale(', '').replace(')', '')) || 1;
        initialX = e.clientX;
        initialY = e.clientY;
        
        if (el.id === 'cert-nome-txt' && !el.dataset.moved) {
            const rect = el.getBoundingClientRect();
            const canvasRect = document.getElementById('cert-canvas').getBoundingClientRect();
            el.style.transform = 'none';
            el.style.left = ((rect.left - canvasRect.left) / scale) + 'px';
            el.dataset.moved = 'true';
        }

        startLeft = parseFloat(getComputedStyle(el).left);
        startTop = parseFloat(getComputedStyle(el).top);
        
        buildSnapTargets();
    });

    document.addEventListener('mousemove', (e) => {
        if (!activeEl) return;
        
        const scale = parseFloat(wrapper.style.transform.replace('scale(', '').replace(')', '')) || 1;
        
        let dx = (e.clientX - initialX) / scale;
        let dy = (e.clientY - initialY) / scale;
        
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;
        
        const rect = activeEl.getBoundingClientRect();
        const elWidth = rect.width / scale;
        const elHeight = rect.height / scale;
        
        let snappedX = false;
        let snappedY = false;

        // Check X snaps
        for (const target of snapTargetsX) {
            // Check left, center, right of activeEl against target
            if (Math.abs(newLeft - target) < SNAP_THRESHOLD) { newLeft = target; snappedX = target; break; }
            if (Math.abs(newLeft + elWidth / 2 - target) < SNAP_THRESHOLD) { newLeft = target - elWidth / 2; snappedX = target; break; }
            if (Math.abs(newLeft + elWidth - target) < SNAP_THRESHOLD) { newLeft = target - elWidth; snappedX = target; break; }
        }

        // Check Y snaps
        for (const target of snapTargetsY) {
            // Check top, center, bottom of activeEl against target
            if (Math.abs(newTop - target) < SNAP_THRESHOLD) { newTop = target; snappedY = target; break; }
            if (Math.abs(newTop + elHeight / 2 - target) < SNAP_THRESHOLD) { newTop = target - elHeight / 2; snappedY = target; break; }
            if (Math.abs(newTop + elHeight - target) < SNAP_THRESHOLD) { newTop = target - elHeight; snappedY = target; break; }
        }
        
        activeEl.style.left = `${newLeft}px`;
        activeEl.style.top = `${newTop}px`;
        
        if (snappedX !== false) {
            snapLineX.style.left = `${snappedX}px`;
            snapLineX.style.display = 'block';
        } else {
            snapLineX.style.display = 'none';
        }
        
        if (snappedY !== false) {
            snapLineY.style.top = `${snappedY}px`;
            snapLineY.style.display = 'block';
        } else {
            snapLineY.style.display = 'none';
        }
    });

    document.addEventListener('mouseup', () => {
        if (activeEl) {
            activeEl.classList.remove('dragging');
            activeEl = null;
            snapLineX.style.display = 'none';
            snapLineY.style.display = 'none';
        }
    });

    // Override the "Export" button for Certificado
    const exportBtn = document.getElementById('export-certificado');
    if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.textContent = 'Baixar Certificado';
        exportBtn.onclick = () => {
            const orig = exportBtn.innerHTML;
            exportBtn.innerHTML = 'Gerando...';
            exportBtn.disabled = true;

            const mode = document.querySelector('input[name="cert_mode"]:checked').value;
            const modelo = selModelo ? selModelo.value : 'alura';

            if (mode === 'lote') {
                const formData = new FormData(document.getElementById('form-certificado'));
                formData.append('modelo', modelo);
                
                // Add current configs to payload so python knows where things are!
                // Actually, python can just read the JSON file directly since they are saved.
                
                fetch('/api/certificados-lote', {
                    method: 'POST',
                    body: formData
                })
                .then(res => {
                    if (!res.ok) throw new Error('Erro na geracao');
                    return res.blob();
                })
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Certificados_${modelo}.zip`;
                    link.click();
                    window.URL.revokeObjectURL(url);
                })
                .catch(err => alert(err.message))
                .finally(() => {
                    exportBtn.innerHTML = orig;
                    exportBtn.disabled = false;
                });
                return;
            }

            // UNICO MODE
            const canvasEl = document.getElementById('cert-canvas');
            
            // html2canvas
            html2canvas(canvasEl, {
                scale: 1, 
                useCORS: true,
                backgroundColor: null,
                width: 1684,
                height: 1190,
                windowWidth: 1684,
                windowHeight: 1190,
                onclone: (clonedDoc) => {
                    const clonedWrapper = clonedDoc.getElementById('cert-wrapper');
                    if (clonedWrapper) {
                        clonedWrapper.style.transform = 'none';
                    }
                    const clonedWorkspace = clonedDoc.getElementById('cert-workspace');
                    if (clonedWorkspace) {
                        clonedWorkspace.style.overflow = 'visible';
                        clonedWorkspace.style.padding = '0';
                        clonedWorkspace.style.margin = '0';
                        clonedWorkspace.style.display = 'block';
                    }
                    const clonedCanvas = clonedDoc.getElementById('cert-canvas');
                    if (clonedCanvas) {
                        clonedCanvas.style.boxShadow = 'none';
                        clonedCanvas.style.margin = '0';
                    }
                }
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `Certificado_${inputs['nome'] ? inputs['nome'].value : 'Gerado'}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).finally(() => {
                exportBtn.innerHTML = orig;
                exportBtn.disabled = false;
            });
        };
    }

    // Reset positions button
    const resetBtn = document.getElementById('reset-certificado');
    if (resetBtn) {
        resetBtn.style.display = 'inline-block';
        resetBtn.onclick = () => {
            historyStack.push(captureState());
            if (historyStack.length > 50) historyStack.shift();

            document.querySelectorAll('.draggable-text').forEach(el => {
                delete el.dataset.moved;
                const conf = defaultConfig[el.id];
                if (conf) {
                    el.style.top = conf.top;
                    el.style.left = conf.left;
                    el.style.transform = conf.transform || 'none';
                }
            });
        };
    }

    const saveDefaultBtn = document.getElementById('save-default-certificado');
    if (saveDefaultBtn) {
        saveDefaultBtn.style.display = 'inline-block';
        saveDefaultBtn.onclick = () => {
            const newConfig = {};
            document.querySelectorAll('.draggable-text').forEach(el => {
                const confObj = {
                    top: el.style.top || window.getComputedStyle(el).top,
                    left: el.style.left || window.getComputedStyle(el).left,
                    transform: el.style.transform !== 'none' ? el.style.transform : '',
                    color: el.style.color || window.getComputedStyle(el).color,
                    fontSize: el.style.fontSize || window.getComputedStyle(el).fontSize,
                    showLabel: el.dataset.showLabel === 'true'
                };
                if (el.classList.contains('cert-custom-field')) {
                    confObj.label = el.getAttribute('data-label');
                }
                newConfig[el.id] = confObj;
            });
            saveDefaultBtn.textContent = 'Salvando...';
            const modelo = selModelo ? selModelo.value : 'alura';
            fetch(`/api/certificado-config?modelo=${modelo}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(newConfig)
            }).then(() => {
                defaultConfig = newConfig;
                saveDefaultBtn.textContent = 'Padrão Salvo!';
                setTimeout(() => saveDefaultBtn.textContent = 'Salvar como Padrão', 2000);
            });
        };
    }
    const btnUploadBg = document.getElementById('btn-upload-bg');
    const inputUploadBg = document.getElementById('upload-bg-certificado');
    if (btnUploadBg && inputUploadBg) {
        btnUploadBg.style.display = 'inline-block';
        btnUploadBg.onclick = () => inputUploadBg.click();
        
        inputUploadBg.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            btnUploadBg.textContent = 'Enviando...';
            const modelo = selModelo ? selModelo.value : 'alura';
            fetch(`/api/upload-certificado-bg?modelo=${modelo}`, {
                method: 'POST',
                body: formData
            }).then(res => res.json())
            .then(data => {
                if (data.success) {
                    const canvasEl = document.getElementById('cert-canvas');
                    if (canvasEl) {
                        canvasEl.style.backgroundImage = `url('/static/certificado_base_${modelo}.png?v=${Date.now()}')`;
                    }
                    btnUploadBg.textContent = 'Fundo Atualizado!';
                    setTimeout(() => btnUploadBg.textContent = 'Trocar Fundo', 2000);
                } else {
                    alert(data.error || 'Erro ao fazer upload');
                    btnUploadBg.textContent = 'Trocar Fundo';
                }
            }).catch(() => {
                alert('Erro de conexão');
                btnUploadBg.textContent = 'Trocar Fundo';
            });
        };
    }
});
