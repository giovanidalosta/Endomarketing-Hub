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

    Object.keys(inputs).forEach(key => {
        const inp = inputs[key];
        if (inp) {
            inp.addEventListener('input', () => {
                texts[key].textContent = inp.value || texts[key].getAttribute('data-placeholder');
                // If it's nome, keep it centered horizontally if user hasn't moved it
                if (key === 'nome' && !texts['nome'].dataset.moved) {
                    texts['nome'].style.transform = 'translateX(-50%)';
                    texts['nome'].style.left = '50%';
                }
            });
            // store placeholder
            texts[key].setAttribute('data-placeholder', texts[key].textContent);
        }
    });

    // Make elements draggable
    let activeEl = null;
    let initialX, initialY, startLeft, startTop;

    document.querySelectorAll('.draggable-text').forEach(el => {
        el.addEventListener('mousedown', (e) => {
            activeEl = el;
            activeEl.classList.add('dragging');
            
            // Get the current scale
            const scale = parseFloat(wrapper.style.transform.replace('scale(', '').replace(')', '')) || 1;
            
            initialX = e.clientX;
            initialY = e.clientY;
            
            // Remove the transform(-50%) if it's the name so we can drag it properly by left/top
            if (el.id === 'cert-nome-txt' && !el.dataset.moved) {
                const rect = el.getBoundingClientRect();
                const canvasRect = document.getElementById('cert-canvas').getBoundingClientRect();
                el.style.transform = 'none';
                el.style.left = ((rect.left - canvasRect.left) / scale) + 'px';
                el.dataset.moved = 'true';
            }

            startLeft = parseFloat(getComputedStyle(el).left);
            startTop = parseFloat(getComputedStyle(el).top);
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (!activeEl) return;
        
        const scale = parseFloat(wrapper.style.transform.replace('scale(', '').replace(')', '')) || 1;
        
        const dx = (e.clientX - initialX) / scale;
        const dy = (e.clientY - initialY) / scale;
        
        activeEl.style.left = `${startLeft + dx}px`;
        activeEl.style.top = `${startTop + dy}px`;
    });

    document.addEventListener('mouseup', () => {
        if (activeEl) {
            activeEl.classList.remove('dragging');
            activeEl = null;
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
});
