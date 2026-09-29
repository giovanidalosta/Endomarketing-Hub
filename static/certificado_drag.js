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
        'data': document.querySelector('#form-certificado input[name="data"]')
    };

    const texts = {
        'nome': document.getElementById('cert-nome-txt'),
        'curso': document.getElementById('cert-curso-txt'),
        'carga': document.getElementById('cert-carga-txt'),
        'data': document.getElementById('cert-data-txt')
    };

    let defaultConfig = {};
    fetch('/api/certificado-config')
        .then(res => res.json())
        .then(config => {
            defaultConfig = config;
            Object.keys(texts).forEach(key => {
                const el = texts[key];
                const conf = defaultConfig[el.id];
                if (conf) {
                    el.style.top = conf.top;
                    el.style.left = conf.left;
                    if (conf.transform) {
                        el.style.transform = conf.transform;
                    } else {
                        el.style.transform = 'none';
                    }
                }
            });
        });

    Object.keys(inputs).forEach(key => {
        const inp = inputs[key];
        if (inp) {
            inp.addEventListener('input', () => {
                texts[key].textContent = inp.value || texts[key].getAttribute('data-placeholder');
                // If it's nome, keep it centered horizontally if user hasn't moved it
                if (key === 'nome' && !texts['nome'].dataset.moved) {
                    const conf = defaultConfig['cert-nome-txt'];
                    if (conf) {
                        texts['nome'].style.transform = conf.transform || 'none';
                        texts['nome'].style.left = conf.left;
                    }
                }
            });
            // store placeholder
            texts[key].setAttribute('data-placeholder', texts[key].textContent);
        }
    });

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
                        if (saved.moved) el.dataset.moved = saved.moved;
                        else delete el.dataset.moved;
                    }
                });
            }
        }
    });

    document.querySelectorAll('.draggable-text').forEach(el => {
        el.addEventListener('mousedown', (e) => {
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
                newConfig[el.id] = {
                    top: el.style.top || window.getComputedStyle(el).top,
                    left: el.style.left || window.getComputedStyle(el).left,
                    transform: el.style.transform !== 'none' ? el.style.transform : ''
                };
            });
            saveDefaultBtn.textContent = 'Salvando...';
            fetch('/api/certificado-config', {
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
});
