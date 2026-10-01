document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-certificado");
    const submitButton = document.getElementById("submit-button-cert");
    const resultMessage = document.getElementById("result-message-cert");
    const previewStatus = document.getElementById("preview-status-cert");
    const emptyPreview = document.getElementById("empty-preview-cert");
    const previewImage = document.getElementById("preview-image-cert");
    const downloadLink = document.getElementById("btn-baixar-cert");
    const certModes = document.getElementsByName("cert_mode");
    const inputNomeLote = document.getElementById("input-nome-lote");
    const inputNome = document.getElementById("nome");

    if (!form || !submitButton) return;

    let base64Image = null;

    submitButton.addEventListener("click", function (event) {
        event.preventDefault();

        const mode = Array.from(certModes).find(r => r.checked)?.value || "unico";

        if (mode === "lote") {
            // Em lote: faz o submit normal que retorna o ZIP
            form.submit();
            return;
        }

        const nome = document.getElementById("nome").value.trim();
        const curso = document.getElementById("curso").value.trim();
        const carga = document.getElementById("carga").value.trim();
        const data = document.getElementById("data").value.trim();

        if (!nome) {
            resultMessage.textContent = "Por favor, preencha o Nome.";
            resultMessage.style.display = "block";
            resultMessage.className = "result-message error";
            return;
        }

        const formData = new FormData(form);
        formData.append("nome", nome);

        submitButton.disabled = true;
        submitButton.innerHTML = 'Gerando certificado...';
        resultMessage.textContent = "Gerando certificado oficial...";
        resultMessage.style.display = "block";
        resultMessage.className = "result-message";
        previewStatus.textContent = "Gerando";
        previewStatus.style.display = "inline";

        fetch("/api/preview_certificado", {
            method: "POST",
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao gerar o certificado.");
            }
            return response.json();
        })
        .then(data => {
            if (!data.image) {
                throw new Error("Resposta inválida do servidor.");
            }

            // Atualiza a prévia visual
            previewImage.src = data.image;
            previewImage.style.display = "block";
            emptyPreview.style.display = "none";
            base64Image = data.image;

            previewStatus.textContent = "Pronto";
            resultMessage.textContent = "Certificado gerado com sucesso!";
            resultMessage.className = "result-message";
        })
        .catch(error => {
            resultMessage.textContent = error.message;
            resultMessage.className = "result-message error";
            previewStatus.textContent = "Erro";
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Gerar certificado';
        });
    });

    if (downloadLink) {
        downloadLink.addEventListener('click', (e) => {
            const mode = Array.from(certModes).find(r => r.checked)?.value || "unico";
            if (mode === "lote") {
                form.submit();
            } else {
                if (!base64Image) {
                    alert("Por favor, clique em 'Gerar certificado' primeiro.");
                    e.preventDefault();
                    return;
                }
                const link = document.createElement('a');
                link.href = base64Image;
                link.download = `Certificado_${inputNome.value.trim()}.png`;
                link.click();
            }
        });
    }
});
