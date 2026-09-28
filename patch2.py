with open('c:/Users/GiovaniFreitas/Desktop/Projetos/ikatec-geradores/static/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re

start_marker = "/* ==========================================\n     LÓGICA - IKANEWS (Dinâmico)\n     ========================================== */"
end_marker = "/* ==========================================\n     LÓGICA - CARDÁPIO (Upload -> Edição)\n     ========================================== */"

start_idx = js.find(start_marker)
end_idx = js.find(end_marker)

if start_idx != -1 and end_idx != -1:
    old_block = js[start_idx:end_idx]
    
    new_block = start_marker + """
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

  """
    
    js = js.replace(old_block, new_block)
    
    with open('c:/Users/GiovaniFreitas/Desktop/Projetos/ikatec-geradores/static/script.js', 'w', encoding='utf-8') as f:
        f.write(js)
else:
    print("Markers not found")