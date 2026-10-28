# Diretiva: Motor de Edição Interativa Konva.js — Criação de Artes

## Objetivo
Implementar um motor de edição interativa no módulo **Criação de Artes (TV 16:9)** do Endomarketing Hub baseado na arquitetura comprovada do **Weuny Design**, utilizando **Konva.js Vanilla**.

## O que isso entrega
1. **Manipulação direta no Canvas (1920x1080)**:
   - Seleção de qualquer elemento (textos, títulos, badges, fotos, elementos 3D, logos).
   - Alças de redimensionamento e rotação (`Konva.Transformer`).
   - Arraste livre com movimentação suave.
2. **Edição Inline de Texto**:
   - Duplo clique no texto abre um editor sobreposto (`<textarea>`) no canvas para digitação direta.
3. **Barra de Ferramentas Contextual Flutuante**:
   - Ajustes em tempo real de fonte, tamanho (+/-), cor, negrito, alinhamento e opacidade.
   - Controle de camadas: Trazer para Frente, Enviar para Trás, Duplicar, Bloquear, Excluir.
4. **Sincronização com os Templates e Formulário**:
   - Alternância entre templates (Split, Colunas, Ações, Livre) monta os elementos organizados no canvas.
   - Inputs do formulário lateral atualizam o canvas instantaneamente.
5. **Exportação de Alta Fidelidade (Instantânea)**:
   - Substituição do `html2canvas` pelo `stage.toDataURL()` do Konva para PNG 1920x1080 cristalino e cópia para clipboard em milissegundos.

## Arquitetura de Arquivos
- `static/konva.min.js`: Biblioteca Konva v9 local (independente de internet).
- `templates/index.html`: Inclusão do script do Konva, container do stage `#artes-konva-container`, barra contextual e overlay de texto.
- `static/artes_konva_editor.js`: Motor do canvas Konva (Stage, Layer, Transformer, Elementos, Auto-layout, Eventos).
- `static/artes_creator.css`: Estilização da barra contextual, handles do transformer e textarea overlay.
