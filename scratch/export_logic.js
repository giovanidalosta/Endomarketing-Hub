function setupExportButtons() {
    const btnZip = document.getElementById('btn-baixar-cert');
    const btnPdf = document.getElementById('btn-baixar-cert-pdf');
    
    const handler = (format) => {
        const btn = format === 'pdf' ? btnPdf : btnZip;
        const orig = btn.innerHTML;
        btn.innerHTML = 'Gerando...';
        btn.disabled = true;

        const mode = document.querySelector('input[name="cert_mode"]:checked').value;
        const modelo = selModelo ? selModelo.value : 'alura';
        
        let temaText = document.querySelector('#form-certificado [name="tema"]').value.trim();
        let temaWords = temaText ? temaText.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).slice(0, 3).join('_') : modelo;
        let baseName = `Certificados_${temaWords}`;

        const canvasEl = document.getElementById('cert-canvas');
        
        const generateCanvas = () => {
            return html2canvas(canvasEl, {
                scale: 1, 
                useCORS: true,
                backgroundColor: null,
                width: 1684,
                height: 1190,
                windowWidth: 1684,
                windowHeight: 1190,
                onclone: (clonedDoc) => {
                    const clonedWrapper = clonedDoc.getElementById('cert-wrapper');
                    if (clonedWrapper) clonedWrapper.style.transform = 'none';
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
            });
        };

        if (mode === 'lote') {
            const rawNames = document.getElementById('input-nome-lote').value;
            const nomes = rawNames.split('\n').map(n => n.trim()).filter(n => n);
            
            if (nomes.length === 0) {
                alert('Lista de nomes vazia.');
                btn.innerHTML = orig;
                btn.disabled = false;
                return;
            }
            
            if (format === 'zip' && typeof JSZip === 'undefined') {
                alert('Erro: Biblioteca JSZip não carregada. Tente recarregar a página.');
                btn.innerHTML = orig;
                btn.disabled = false;
                return;
            }
            
            btn.innerHTML = 'Gerando Lote...';
            
            let zip = format === 'zip' ? new JSZip() : null;
            let folder = zip ? zip.folder(baseName) : null;
            let pdf = format === 'pdf' ? new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'px', format: [1684, 1190] }) : null;
            
            let p = Promise.resolve();
            const originalName = texts['nome'].getAttribute('data-value') || texts['nome'].textContent;
            
            nomes.forEach((nomeAluno, index) => {
                p = p.then(() => {
                    btn.innerHTML = `Gerando ${index + 1}/${nomes.length}...`;
                    updateTextHtml(texts['nome'], nomeAluno);
                    return new Promise(resolve => setTimeout(resolve, 100));
                }).then(() => {
                    return generateCanvas();
                }).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    if (format === 'zip') {
                        const base64Data = imgData.replace(/^data:image\/(png|jpg);base64,/, "");
                        folder.file(`Certificado_${nomeAluno}.png`, base64Data, {base64: true});
                    } else if (format === 'pdf') {
                        if (index > 0) pdf.addPage([1684, 1190], 'landscape');
                        pdf.addImage(imgData, 'PNG', 0, 0, 1684, 1190);
                    }
                });
            });
            
            p.then(() => {
                updateTextHtml(texts['nome'], originalName);
                if (format === 'zip') {
                    btn.innerHTML = 'Compactando ZIP...';
                    return zip.generateAsync({type:"blob"}).then(content => {
                        const url = window.URL.createObjectURL(content);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${baseName}.zip`;
                        link.click();
                        window.URL.revokeObjectURL(url);
                    });
                } else if (format === 'pdf') {
                    btn.innerHTML = 'Gerando PDF...';
                    pdf.save(`${baseName}.pdf`);
                }
            }).catch(err => {
                alert('Erro na geração: ' + err.message);
            }).finally(() => {
                updateTextHtml(texts['nome'], originalName);
                btn.innerHTML = orig;
                btn.disabled = false;
            });

        } else {
            // UNICO
            generateCanvas().then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const nomeAluno = inputs['nome'] ? inputs['nome'].value : 'Gerado';
                
                if (format === 'zip') { // Single format PNG
                    const link = document.createElement('a');
                    link.download = `Certificado_${nomeAluno}.png`;
                    link.href = imgData;
                    link.click();
                } else {
                    const pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'px', format: [1684, 1190] });
                    pdf.addImage(imgData, 'PNG', 0, 0, 1684, 1190);
                    pdf.save(`Certificado_${nomeAluno}.pdf`);
                }
            }).finally(() => {
                btn.innerHTML = orig;
                btn.disabled = false;
            });
        }
    };

    if (btnZip) btnZip.onclick = () => handler('zip');
    if (btnPdf) btnPdf.onclick = () => handler('pdf');
}
setupExportButtons();
