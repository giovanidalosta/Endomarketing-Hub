document.addEventListener("DOMContentLoaded", function () {
    const certForm = document.getElementById("form-certificado");
    const certModelo = document.getElementById("cert-modelo");
    const certModes = document.getElementsByName("cert_mode");
    
    // Elements to toggle
    const inputNome = document.getElementById("nome");
    const inputNomeLote = document.getElementById("input-nome-lote");
    const groupCurso = document.getElementById("group-curso");
    const rowAlura = document.getElementById("row-alura");
    const groupTema = document.getElementById("group-tema");
    const groupApresentador = document.getElementById("group-apresentador");

    // Toggle logic
    function updateCertForm() {
        if (!certModelo) return;
        const modelo = certModelo.value;
        const mode = Array.from(certModes).find(r => r.checked)?.value || "unico";

        // Toggle Single vs Batch
        if (mode === "lote") {
            inputNome.style.display = "none";
            inputNomeLote.style.display = "block";
        } else {
            inputNome.style.display = "block";
            inputNomeLote.style.display = "none";
        }

        // Toggle Model fields
        if (modelo === "alura") {
            groupCurso.style.display = "flex";
            rowAlura.style.display = "flex";
            groupTema.style.display = "none";
            groupApresentador.style.display = "none";
        } else if (modelo === "ikated") {
            groupCurso.style.display = "none";
            rowAlura.style.display = "none";
            groupTema.style.display = "flex";
            groupApresentador.style.display = "flex";
        } else {
            // Generico
            groupCurso.style.display = "none";
            rowAlura.style.display = "none";
            groupTema.style.display = "none";
            groupApresentador.style.display = "none";
        }
    }

    if (certModelo) {
        certModelo.addEventListener("change", updateCertForm);
        Array.from(certModes).forEach(r => r.addEventListener("change", updateCertForm));
        updateCertForm();
    }

    const submitBtn = document.getElementById("submit-button-cert");
    const resultMsg = document.getElementById("result-message-cert");
    const resultInfo = document.getElementById("resultado-info-cert");
    const previewStatus = document.getElementById("preview-status-cert");
    const previewImage = document.getElementById("preview-image-cert");
    const emptyPreview = document.getElementById("empty-preview-cert");
    const downloadLink = document.getElementById("download-link-cert");

    if (certForm) {
        certForm.addEventListener("submit", function(e) {
            // Se for em lote, o backend atual (/api/certificados-lote) espera nomes_lote
            // e retorna um ZIP direto! Não temos preview pra zip.
            // Se for unico, o ideal seria retornar a imagem, mas a api retorna um zip com 1 se usarmos o lote.
            // Para manter simples e usar a API já existente:
            
            const mode = Array.from(certModes).find(r => r.checked)?.value || "unico";
            if (mode === "unico") {
                // Copiar o nome unico para o campo de lote para a API funcionar
                inputNomeLote.value = inputNome.value;
            }
            
            // Allow form submission normally (will download zip)
            submitBtn.innerHTML = 'Gerando...';
            setTimeout(() => {
                submitBtn.innerHTML = 'Gerar certificado';
                previewStatus.textContent = "Pronto (Baixado)";
                resultMsg.textContent = "Download iniciado!";
                resultMsg.style.display = "block";
                resultMsg.style.color = "var(--c-primary)";
            }, 2000);
        });
    }
});
