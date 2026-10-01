# Diretiva: Canva Studio — Editor de Certificados

## Objetivo
Transformar o editor de certificados em dois ambientes distintos:
1. **Modo Emissão** (padrão, operacional)
2. **Canva Studio** (editor visual avançado)

## Status de Implementação

| Feature | Status |
|---------|--------|
| Dois Ambientes (Emissão / Studio) | ⬜ Pendente |
| Topbar Canva (fonte, tamanho, cor, bold/italic) | ⬜ Pendente |
| Rail Lateral (Textos, Fundo, Camadas) | ⬜ Pendente |
| Bounding Box + Handles Visuais | ✅ Parcial (handles existem) |
| Smart Snapping + Linhas Guia | ✅ Parcial (snap existe, cor diferente) |
| Undo/Redo Stack | ✅ Parcial (só undo) |
| Ctrl+D (duplicar), Del (excluir), Arrows | ⬜ Pendente |
| Modo Lote com navegação < 1 de N > | ⬜ Pendente |
| Export: PNG / PDF / ZIP | ✅ PNG + ZIP (falta PDF) |

## Arquitetura

```
index.html
└── #tab-certificado
    ├── [MODO EMISSÃO]  .cert-emission-panel
    │   ├── Sidebar: modelo, campos, export buttons
    │   └── Preview: canvas (read-only)
    └── [CANVA STUDIO]  .cert-studio-overlay (fullscreen)
        ├── .studio-topbar (fixed top)
        │   ├── Botão Fechar / Salvar
        │   ├── Controles de fonte, tamanho, cor
        │   └── Bold, Italic, Align
        ├── .studio-rail (left sidebar, 64px icons → 240px expanded)
        │   ├── Aba Textos
        │   ├── Aba Fundo
        │   └── Aba Camadas
        └── .studio-canvas-area (center, scrollable)
            └── cert-canvas (1684x1190px, com zoom)
```

## Detalhes de Implementação

### index.html
- Manter formulário de emissão atual mas embrulhá-lo em `.cert-emission-panel`
- Adicionar `.cert-studio-overlay` como overlay fullscreen
- Topbar Studio: fixa no topo da overlay
- Rail: sidebar esquerdo 64px colapsado / 240px expandido
- Canvas area: flex-grow com scroll e zoom

### certificado_drag.js
- `openStudio()` / `closeStudio()`: toggle de modo
- `undoStack` / `redoStack`: Ctrl+Z / Ctrl+Y
- `duplicateSelected()`: Ctrl+D
- `deleteSelected()`: Del
- Arrow keys: mover 1px (Shift=10px)
- Topbar sync: atualiza os inputs da topbar ao selecionar elemento
- Layers panel: reflete `.draggable-text` elements em tempo real

### certificado_drag.css
- `.cert-studio-overlay`: position fixed, 100vw x 100vh, z-index 1000
- `.studio-topbar`: altura 52px, fundo escuro, flex row
- `.studio-rail`: 64px, com ícones verticais; expande ao hover
- Snap lines: cor magenta `#FF007A`
- Handles visuais redesenhados: círculos e pílulas

## Fluxo de Dados
1. Emissão → Usuário preenche campos → exporta direto
2. Studio → Edita posições/estilos → Salva → volta para Emissão
3. Configuração sempre salva em `certificado_config.json`
