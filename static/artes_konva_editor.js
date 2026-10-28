/* ================================================================
   Motor de Edição Interativa Konva.js — Criação de Artes (TV 16:9)
   Inspirado na arquitetura do Weuny Design / Canva
   Padrão Oficial Ikatec (1920x1080)
   ================================================================ */

(function () {
  "use strict";

  // Estado do Editor Konva
  const state = {
    stage: null,
    bgLayer: null,
    contentLayer: null,
    uiLayer: null,
    transformer: null,
    selectedNode: null,
    customElements: [],
    loadedImages: new Map(),
    defaultPositions: new Map(),
    isReady: false,
    currentPayload: null
  };

  // Helper para obter a imagem em cache ou carregar
  function getImage(src) {
    if (!src) return Promise.resolve(null);
    if (state.loadedImages.has(src)) {
      return Promise.resolve(state.loadedImages.get(src));
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        state.loadedImages.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn("[ArtesKonva] Falha ao carregar imagem:", src);
        resolve(null);
      };
      img.src = src;
    });
  }

  // Helper para obter escala atual do canvas-wrapper
  function getCanvasScale() {
    const wrapperEl = document.getElementById("artes-canvas-wrapper");
    if (!wrapperEl) return 1;
    const match = wrapperEl.style.transform.match(/scale\(([^)]+)\)/);
    return match ? parseFloat(match[1]) : 1;
  }

  // ----------------------------------------------------------------
  // 1. INICIALIZAÇÃO DO PALCO E CAMADAS
  // ----------------------------------------------------------------
  function initStage() {
    const container = document.getElementById("artes-konva-container");
    if (!container || typeof Konva === "undefined") {
      console.warn("[ArtesKonva] Container ou biblioteca Konva não encontrados.");
      return false;
    }

    if (state.stage) return true;

    // Criar palco fixo em 1920x1080 (resolução Full HD oficial da TV corporativa)
    state.stage = new Konva.Stage({
      container: "artes-konva-container",
      width: 1920,
      height: 1080
    });

    // Camadas
    state.bgLayer = new Konva.Layer({ name: "bgLayer" });
    state.contentLayer = new Konva.Layer({ name: "contentLayer" });
    state.uiLayer = new Konva.Layer({ name: "uiLayer" });

    // Transformer estilizado (estilo Weuny/Canva)
    state.transformer = new Konva.Transformer({
      name: "artes-transformer",
      anchorFill: "#09A8C9",
      anchorStroke: "#ffffff",
      anchorStrokeWidth: 2,
      anchorSize: 14,
      anchorCornerRadius: 4,
      borderStroke: "#09A8C9",
      borderStrokeWidth: 2,
      borderDash: [6, 4],
      rotateAnchorOffset: 32,
      rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
      ignoreStroke: true,
      keepRatio: false
    });
    state.uiLayer.add(state.transformer);

    state.stage.add(state.bgLayer);
    state.stage.add(state.contentLayer);
    state.stage.add(state.uiLayer);

    // Eventos de clique no palco (desmarcar ao clicar no vazio)
    state.stage.on("click tap", (e) => {
      // Se clicou no palco direto ou no fundo
      if (e.target === state.stage || e.target.hasName("canvas-bg-shape")) {
        selectElement(null);
      }
    });

    // Eventos globais de teclado
    setupKeyboardShortcuts();

    // Eventos da barra contextual flutuante
    setupToolbarEvents();

    state.isReady = true;
    console.log("[ArtesKonva] Motor de edição interativa iniciado com sucesso!");
    return true;
  }

  // ----------------------------------------------------------------
  // 2. SELEÇÃO DE ELEMENTOS E ATUALIZAÇÃO DA TOOLBAR
  // ----------------------------------------------------------------
  function selectElement(node) {
    if (state.selectedNode === node) return;

    state.selectedNode = node;
    const barGlobal = document.getElementById("artes-bar-global");
    const barSelected = document.getElementById("artes-bar-selected");

    if (!node || node.hasName("canvas-bg-shape")) {
      state.transformer.nodes([]);
      state.uiLayer.batchDraw();
      if (barGlobal) barGlobal.style.display = "flex";
      if (barSelected) barSelected.style.display = "none";
      return;
    }

    // Acoplar o transformer
    state.transformer.nodes([node]);
    
    // Regras de alças do transformer conforme o tipo
    if (node instanceof Konva.Text) {
      state.transformer.keepRatio(false);
      state.transformer.enabledAnchors([
        "top-left", "top-right", "bottom-left", "bottom-right",
        "middle-left", "middle-right"
      ]);
    } else if (node instanceof Konva.Image) {
      state.transformer.keepRatio(true);
      state.transformer.enabledAnchors([
        "top-left", "top-right", "bottom-left", "bottom-right"
      ]);
    } else {
      state.transformer.keepRatio(false);
      state.transformer.enabledAnchors([
        "top-left", "top-center", "top-right",
        "middle-left", "middle-right",
        "bottom-left", "bottom-center", "bottom-right"
      ]);
    }

    state.uiLayer.batchDraw();

    // Atualizar UI da Toolbar Contextual
    if (barGlobal) barGlobal.style.display = "none";
    if (barSelected) barSelected.style.display = "flex";

    updateToolbarFromNode(node);
  }

  function updateToolbarFromNode(node) {
    const typeBadge = document.getElementById("artes-sel-type-badge");
    const textControls = document.getElementById("artes-bar-text-controls");
    const shapeControls = document.getElementById("artes-bar-shape-controls");

    const isText = node instanceof Konva.Text;
    const isGroupWithText = node instanceof Konva.Group && node.findOne("Text");
    const isShape = node instanceof Konva.Rect || node instanceof Konva.Circle;

    if (typeBadge) {
      typeBadge.textContent = node.getAttr("customType") || (isText ? "Texto" : isShape ? "Forma" : "Elemento");
    }

    // Mostrar controles adequados
    if (isText || isGroupWithText) {
      if (textControls) textControls.style.display = "flex";
      if (shapeControls) shapeControls.style.display = "none";

      const targetText = isText ? node : node.findOne("Text");
      
      const selFont = document.getElementById("artes-sel-font-family");
      if (selFont) selFont.value = targetText.fontFamily() || "Inter";

      const selSize = document.getElementById("artes-sel-font-size");
      if (selSize) selSize.value = Math.round(targetText.fontSize()) || 48;

      const selColor = document.getElementById("artes-sel-color");
      const selColorPreview = document.getElementById("artes-sel-color-preview");
      const currentColor = targetText.fill() || "#ffffff";
      if (selColor && currentColor.startsWith("#")) selColor.value = currentColor;
      if (selColorPreview) selColorPreview.style.background = currentColor;

      const btnBold = document.getElementById("artes-sel-bold");
      if (btnBold) {
        const style = targetText.fontStyle() || "";
        btnBold.classList.toggle("active", style.includes("bold") || targetText.getAttr("isBold"));
      }

      const btnItalic = document.getElementById("artes-sel-italic");
      if (btnItalic) {
        const style = targetText.fontStyle() || "";
        btnItalic.classList.toggle("active", style.includes("italic"));
      }

      const align = targetText.align() || "left";
      document.querySelectorAll(".artes-bar-align-group .artes-bar-icon-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-align") === align);
      });
    } else {
      if (textControls) textControls.style.display = "none";
      if (shapeControls) shapeControls.style.display = "flex";

      const selFill = document.getElementById("artes-sel-fill-color");
      const selFillPreview = document.getElementById("artes-sel-fill-preview");
      const fill = node.fill() || "#09A8C9";
      if (selFill && typeof fill === "string" && fill.startsWith("#")) selFill.value = fill;
      if (selFillPreview) selFillPreview.style.background = fill;

      const selOpacity = document.getElementById("artes-sel-opacity");
      if (selOpacity) selOpacity.value = Math.round((node.opacity() || 1) * 100);
    }

    // Botão Lock
    const btnLock = document.getElementById("artes-sel-lock");
    if (btnLock) {
      btnLock.classList.toggle("active", !node.draggable());
    }
  }

  // ----------------------------------------------------------------
  // 3. EDIÇÃO INLINE DE TEXTO (DUPLO CLIQUE)
  // ----------------------------------------------------------------
  function setupInlineTextEditor(textNode) {
    const overlay = document.getElementById("artes-text-overlay");
    const stage = state.stage;
    if (!overlay || !stage) return;

    const scale = getCanvasScale();
    const stageBox = stage.container().getBoundingClientRect();
    const textPosition = textNode.getAbsolutePosition();

    // Ocultar texto no canvas enquanto edita
    textNode.hide();
    state.transformer.nodes([]);
    state.contentLayer.batchDraw();
    state.uiLayer.batchDraw();

    const currentText = textNode.text();
    const fontSize = textNode.fontSize() * scale;
    const fontFamily = textNode.fontFamily();
    const fontColor = textNode.fill();
    const align = textNode.align() || "left";
    const width = Math.max(220, textNode.width() * scale);
    const height = Math.max(fontSize * 1.5, textNode.height() * scale);

    overlay.value = currentText;
    overlay.style.display = "block";
    overlay.style.left = `${stageBox.left + textPosition.x * scale}px`;
    overlay.style.top = `${stageBox.top + textPosition.y * scale}px`;
    overlay.style.width = `${width + 20}px`;
    overlay.style.minHeight = `${height}px`;
    overlay.style.fontFamily = `'${fontFamily}', sans-serif`;
    overlay.style.fontSize = `${fontSize}px`;
    overlay.style.fontWeight = textNode.fontStyle()?.includes("bold") ? "700" : "400";
    overlay.style.fontStyle = textNode.fontStyle()?.includes("italic") ? "italic" : "normal";
    overlay.style.color = fontColor;
    overlay.style.textAlign = align;

    overlay.focus();
    overlay.select();

    function finishEdit() {
      if (overlay.style.display === "none") return;
      overlay.style.display = "none";
      const newText = overlay.value;
      textNode.text(newText);
      textNode.show();
      selectElement(textNode);
      state.contentLayer.batchDraw();

      // Sincronizar de volta com o input correspondente se existir
      const formInputId = textNode.getAttr("formInputId");
      if (formInputId) {
        const inp = document.getElementById(formInputId);
        if (inp) {
          inp.value = newText;
        }
      }

      overlay.removeEventListener("blur", finishEdit);
      overlay.removeEventListener("keydown", handleKeyDown);
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        finishEdit();
      }
    }

    overlay.addEventListener("blur", finishEdit);
    overlay.addEventListener("keydown", handleKeyDown);
  }

  // ----------------------------------------------------------------
  // 4. ATALHOS DE TECLADO E EVENTOS DA TOOLBAR
  // ----------------------------------------------------------------
  function setupKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      // Ignorar se estiver digitando em um input ou textarea
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const node = state.selectedNode;
      if (!node) return;

      // Delete ou Backspace: remover elemento
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelectedNode();
      }

      // Ctrl + D: duplicar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelectedNode();
      }

      // Esc: desmarcar
      if (e.key === "Escape") {
        e.preventDefault();
        selectElement(null);
      }

      // Setas: mover (Shift = 10px)
      const step = e.shiftKey ? 10 : 2;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        node.x(node.x() - step);
        state.contentLayer.batchDraw();
        state.uiLayer.batchDraw();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        node.x(node.x() + step);
        state.contentLayer.batchDraw();
        state.uiLayer.batchDraw();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        node.y(node.y() - step);
        state.contentLayer.batchDraw();
        state.uiLayer.batchDraw();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        node.y(node.y() + step);
        state.contentLayer.batchDraw();
        state.uiLayer.batchDraw();
      }
    });
  }

  function setupToolbarEvents() {
    // 1. Font Family
    const selFont = document.getElementById("artes-sel-font-family");
    if (selFont) {
      selFont.addEventListener("change", (e) => {
        const node = state.selectedNode;
        if (!node) return;
        const target = node instanceof Konva.Text ? node : node.findOne("Text");
        if (target) {
          target.fontFamily(e.target.value);
          state.contentLayer.batchDraw();
          state.uiLayer.batchDraw();
        }
      });
    }

    // 2. Font Size
    const inpSize = document.getElementById("artes-sel-font-size");
    const btnDec = document.getElementById("artes-sel-size-dec");
    const btnInc = document.getElementById("artes-sel-size-inc");

    function changeFontSize(delta) {
      const node = state.selectedNode;
      if (!node) return;
      const target = node instanceof Konva.Text ? node : node.findOne("Text");
      if (target) {
        const current = target.fontSize();
        const next = Math.max(12, Math.min(220, current + delta));
        target.fontSize(next);
        if (inpSize) inpSize.value = next;
        state.contentLayer.batchDraw();
        state.uiLayer.batchDraw();
      }
    }

    if (btnDec) btnDec.addEventListener("click", () => changeFontSize(-2));
    if (btnInc) btnInc.addEventListener("click", () => changeFontSize(2));
    if (inpSize) {
      inpSize.addEventListener("change", (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) changeFontSize(val - (state.selectedNode?.fontSize?.() || val));
      });
    }

    // 3. Cor do Texto
    const inpColor = document.getElementById("artes-sel-color");
    const prevColor = document.getElementById("artes-sel-color-preview");
    if (inpColor) {
      inpColor.addEventListener("input", (e) => {
        const node = state.selectedNode;
        if (!node) return;
        const target = node instanceof Konva.Text ? node : node.findOne("Text");
        if (target) {
          target.fill(e.target.value);
          if (prevColor) prevColor.style.background = e.target.value;
          state.contentLayer.batchDraw();
        }
      });
    }

    // 4. Negrito
    const btnBold = document.getElementById("artes-sel-bold");
    if (btnBold) {
      btnBold.addEventListener("click", () => {
        const node = state.selectedNode;
        if (!node) return;
        const target = node instanceof Konva.Text ? node : node.findOne("Text");
        if (target) {
          const style = target.fontStyle() || "";
          const isBold = style.includes("bold");
          target.fontStyle(isBold ? style.replace("bold", "").trim() : `${style} bold`.trim());
          btnBold.classList.toggle("active", !isBold);
          state.contentLayer.batchDraw();
          state.uiLayer.batchDraw();
        }
      });
    }

    // 5. Itálico
    const btnItalic = document.getElementById("artes-sel-italic");
    if (btnItalic) {
      btnItalic.addEventListener("click", () => {
        const node = state.selectedNode;
        if (!node) return;
        const target = node instanceof Konva.Text ? node : node.findOne("Text");
        if (target) {
          const style = target.fontStyle() || "";
          const isItalic = style.includes("italic");
          target.fontStyle(isItalic ? style.replace("italic", "").trim() : `${style} italic`.trim());
          btnItalic.classList.toggle("active", !isItalic);
          state.contentLayer.batchDraw();
          state.uiLayer.batchDraw();
        }
      });
    }

    // 6. Alinhamento
    document.querySelectorAll(".artes-bar-align-group .artes-bar-icon-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const node = state.selectedNode;
        if (!node) return;
        const target = node instanceof Konva.Text ? node : node.findOne("Text");
        if (target) {
          const align = btn.getAttribute("data-align");
          target.align(align);
          document.querySelectorAll(".artes-bar-align-group .artes-bar-icon-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          state.contentLayer.batchDraw();
        }
      });
    });

    // 7. Formas - Cor de preenchimento & Opacidade
    const inpFillColor = document.getElementById("artes-sel-fill-color");
    const prevFill = document.getElementById("artes-sel-fill-preview");
    if (inpFillColor) {
      inpFillColor.addEventListener("input", (e) => {
        const node = state.selectedNode;
        if (node && node.fill) {
          node.fill(e.target.value);
          if (prevFill) prevFill.style.background = e.target.value;
          state.contentLayer.batchDraw();
        }
      });
    }

    const inpOpacity = document.getElementById("artes-sel-opacity");
    if (inpOpacity) {
      inpOpacity.addEventListener("input", (e) => {
        const node = state.selectedNode;
        if (node) {
          node.opacity(parseInt(e.target.value, 10) / 100);
          state.contentLayer.batchDraw();
        }
      });
    }

    // 8. Camadas: Trazer para Frente & Enviar para Trás
    const btnBringForward = document.getElementById("artes-sel-bring-forward");
    if (btnBringForward) {
      btnBringForward.addEventListener("click", () => {
        if (state.selectedNode) {
          state.selectedNode.moveToTop();
          state.contentLayer.batchDraw();
          state.uiLayer.batchDraw();
        }
      });
    }

    const btnSendBackward = document.getElementById("artes-sel-send-backward");
    if (btnSendBackward) {
      btnSendBackward.addEventListener("click", () => {
        if (state.selectedNode) {
          state.selectedNode.moveDown();
          state.contentLayer.batchDraw();
          state.uiLayer.batchDraw();
        }
      });
    }

    // 9. Duplicar
    const btnDuplicate = document.getElementById("artes-sel-duplicate");
    if (btnDuplicate) {
      btnDuplicate.addEventListener("click", duplicateSelectedNode);
    }

    // 10. Bloquear / Desbloquear
    const btnLock = document.getElementById("artes-sel-lock");
    if (btnLock) {
      btnLock.addEventListener("click", () => {
        const node = state.selectedNode;
        if (node) {
          const isDraggable = node.draggable();
          node.draggable(!isDraggable);
          btnLock.classList.toggle("active", isDraggable);
          state.uiLayer.batchDraw();
        }
      });
    }

    // 11. Excluir
    const btnDelete = document.getElementById("artes-sel-delete");
    if (btnDelete) {
      btnDelete.addEventListener("click", deleteSelectedNode);
    }

    // 12. Desmarcar
    const btnDeselect = document.getElementById("artes-sel-deselect");
    if (btnDeselect) {
      btnDeselect.addEventListener("click", () => selectElement(null));
    }

    // 13. Ações Globais: + Texto, + Badge, + Card, Resetar
    const btnAddText = document.getElementById("artes-add-text-btn");
    if (btnAddText) {
      btnAddText.addEventListener("click", () => {
        addNewText("Novo Texto Livre", 600, 480);
      });
    }

    const btnAddBadge = document.getElementById("artes-add-badge-btn");
    if (btnAddBadge) {
      btnAddBadge.addEventListener("click", () => {
        addNewBadge("NOVO DESTAQUE", 600, 420);
      });
    }

    const btnAddRect = document.getElementById("artes-add-rect-btn");
    if (btnAddRect) {
      btnAddRect.addEventListener("click", () => {
        addNewCard(600, 400);
      });
    }

    const btnReset = document.getElementById("artes-reset-layout-btn");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        state.defaultPositions.clear();
        state.customElements = [];
        if (state.currentPayload) {
          updateCanvas(state.currentPayload, true);
        }
      });
    }
  }

  function deleteSelectedNode() {
    const node = state.selectedNode;
    if (!node || node.hasName("canvas-bg-shape")) return;

    // Remover da lista de custom elements se for um
    const idx = state.customElements.indexOf(node);
    if (idx !== -1) state.customElements.splice(idx, 1);

    selectElement(null);
    node.destroy();
    state.contentLayer.batchDraw();
    state.uiLayer.batchDraw();
  }

  function duplicateSelectedNode() {
    const node = state.selectedNode;
    if (!node || node.hasName("canvas-bg-shape")) return;

    const clone = node.clone({
      x: node.x() + 30,
      y: node.y() + 30
    });

    state.contentLayer.add(clone);
    state.customElements.push(clone);
    attachNodeInteractions(clone, clone.getAttr("customType") || "Elemento Copiado");
    selectElement(clone);
    state.contentLayer.batchDraw();
    state.uiLayer.batchDraw();
  }

  function attachNodeInteractions(node, typeLabel, formInputId) {
    node.setAttr("customType", typeLabel);
    if (formInputId) node.setAttr("formInputId", formInputId);

    node.on("click tap", (e) => {
      e.cancelBubble = true;
      selectElement(node);
    });

    node.on("dragstart", () => {
      selectElement(node);
    });

    // Duplo clique para texto
    if (node instanceof Konva.Text) {
      node.on("dblclick dbltap", () => {
        setupInlineTextEditor(node);
      });
    }
  }

  // ----------------------------------------------------------------
  // 5. CRIAÇÃO DE NOVOS ELEMENTOS LIVRES (+ TEXTO, + BADGE, + CARD)
  // ----------------------------------------------------------------
  function addNewText(text, x, y) {
    if (!initStage()) return;

    const textNode = new Konva.Text({
      x: x || 500,
      y: y || 450,
      text: text || "Novo Texto",
      fontSize: 44,
      fontFamily: "Inter",
      fontStyle: "bold",
      fill: "#ffffff",
      draggable: true,
      shadowColor: "rgba(0,0,0,0.5)",
      shadowBlur: 10,
      shadowOffset: { x: 0, y: 4 }
    });

    state.contentLayer.add(textNode);
    state.customElements.push(textNode);
    attachNodeInteractions(textNode, "Texto Livre");
    selectElement(textNode);
    state.contentLayer.batchDraw();
  }

  function addNewBadge(text, x, y) {
    if (!initStage()) return;

    const group = new Konva.Group({
      x: x || 500,
      y: y || 400,
      draggable: true
    });

    const badgeText = new Konva.Text({
      x: 18,
      y: 10,
      text: text || "BADGE",
      fontSize: 22,
      fontFamily: "Inter",
      fontStyle: "bold",
      fill: "#02060b",
      letterSpacing: 1.5
    });

    const paddingX = 18;
    const paddingY = 10;
    const badgeBg = new Konva.Rect({
      x: 0,
      y: 0,
      width: badgeText.width() + paddingX * 2,
      height: badgeText.height() + paddingY * 2,
      fill: "#09A8C9",
      cornerRadius: (badgeText.height() + paddingY * 2) / 2,
      shadowColor: "rgba(9, 168, 201, 0.4)",
      shadowBlur: 15,
      shadowOffset: { x: 0, y: 4 }
    });

    group.add(badgeBg);
    group.add(badgeText);

    state.contentLayer.add(group);
    state.customElements.push(group);
    attachNodeInteractions(group, "Badge / Tag");
    selectElement(group);
    state.contentLayer.batchDraw();
  }

  function addNewCard(x, y) {
    if (!initStage()) return;

    const card = new Konva.Rect({
      x: x || 500,
      y: y || 380,
      width: 440,
      height: 280,
      fill: "#0b1a28",
      opacity: 0.88,
      stroke: "#09A8C9",
      strokeWidth: 2,
      cornerRadius: 16,
      draggable: true,
      shadowColor: "rgba(0, 0, 0, 0.5)",
      shadowBlur: 25,
      shadowOffset: { x: 0, y: 12 }
    });

    state.contentLayer.add(card);
    state.customElements.push(card);
    attachNodeInteractions(card, "Card / Moldura");
    selectElement(card);
    state.contentLayer.batchDraw();
  }

  // ----------------------------------------------------------------
  // 6. RENDERIZAÇÃO PRINCIPAL DO CANVAS BASEADO NO TEMPLATE
  // ----------------------------------------------------------------
  async function updateCanvas(payload, forceResetPositions) {
    if (!initStage()) return;
    state.currentPayload = payload;

    const {
      layout,
      bg,
      el3d,
      logoSrc,
      slogan,
      extraLogoSrc,
      tag,
      title,
      accent,
      splitHeader,
      splitBullets,
      splitClosing,
      colPill,
      col1h, col1d, col2h, col2d, col3h, col3d,
      actionsList,
      freeLead,
      freeClosing,
      photoUrl,
      photoMode,
      photoPanX,
      photoPanY,
      photoZoom,
      photoOpacity,
      cardX,
      cardY
    } = payload;

    // Preservar posições movidas pelo usuário se forceResetPositions for falso
    const savedNodes = new Map();
    state.contentLayer.getChildren().forEach((node) => {
      const id = node.name() || node.id();
      if (id && !forceResetPositions) {
        savedNodes.set(id, {
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation()
        });
      }
    });

    // Limpar camadas
    state.bgLayer.destroyChildren();
    state.contentLayer.destroyChildren();

    // -------------------------------------------------------------
    // CAMADA 1: FUNDO (1920x1080)
    // -------------------------------------------------------------
    const bgRect = new Konva.Rect({
      name: "canvas-bg-shape",
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      fill: (bg && bg.theme === "white-clean") ? "#f4f7fa" : "#02060b",
      listening: true
    });
    state.bgLayer.add(bgRect);

    // Glows decorativos de fundo
    const isDark = !bg || bg.theme !== "white-clean";
    if (isDark) {
      const glowTR = new Konva.Circle({
        x: 1800,
        y: 80,
        radius: 400,
        fillRadialGradientStartPoint: 0,
        fillRadialGradientStartRadius: 0,
        fillRadialGradientEndPoint: 0,
        fillRadialGradientEndRadius: 400,
        fillRadialGradientColorStops: [0, "rgba(9, 168, 201, 0.22)", 1, "rgba(9, 168, 201, 0)"],
        listening: false
      });
      const glowBL = new Konva.Circle({
        x: 120,
        y: 1000,
        radius: 450,
        fillRadialGradientStartPoint: 0,
        fillRadialGradientStartRadius: 0,
        fillRadialGradientEndPoint: 0,
        fillRadialGradientEndRadius: 450,
        fillRadialGradientColorStops: [0, "rgba(9, 168, 201, 0.18)", 1, "rgba(9, 168, 201, 0)"],
        listening: false
      });
      state.bgLayer.add(glowTR);
      state.bgLayer.add(glowBL);
    }

    // Imagem de Fundo (se existir)
    if (bg && bg.type === "image" && bg.src) {
      const bgImg = await getImage(bg.src);
      if (bgImg) {
        const konvaBgImg = new Konva.Image({
          name: "canvas-bg-shape",
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          image: bgImg,
          listening: true
        });
        state.bgLayer.add(konvaBgImg);
      }
    }

    // Elemento 3D Independente (se existir)
    if (el3d && el3d.src) {
      const el3dImg = await getImage(el3d.src);
      if (el3dImg) {
        const konva3D = new Konva.Image({
          name: "element-3d-node",
          x: 1050,
          y: 120,
          width: 820,
          height: 820,
          image: el3dImg,
          opacity: 0.95,
          draggable: true
        });
        attachNodeInteractions(konva3D, "Elemento 3D");
        state.contentLayer.add(konva3D);
      }
    }

    // -------------------------------------------------------------
    // CAMADA 2: FOTO PERSONALIZADA / EQUIPE
    // -------------------------------------------------------------
    if (photoUrl) {
      const pImg = await getImage(photoUrl);
      if (pImg) {
        const photoGroup = new Konva.Group({
          name: "photo-card-group",
          x: cardX || 1080,
          y: cardY || 160,
          draggable: true
        });

        const cardW = 740;
        const cardH = 770;

        // Fundo e moldura do card
        const cardBg = new Konva.Rect({
          width: cardW,
          height: cardH,
          fill: "#0b1a28",
          stroke: "#09A8C9",
          strokeWidth: 2,
          cornerRadius: 24,
          shadowColor: "rgba(0, 0, 0, 0.6)",
          shadowBlur: 35,
          shadowOffset: { x: 0, y: 15 }
        });
        photoGroup.add(cardBg);

        // Imagem interna recortada
        const innerImg = new Konva.Image({
          x: 0,
          y: 0,
          width: cardW,
          height: cardH,
          image: pImg,
          opacity: (photoOpacity || 100) / 100,
          cornerRadius: 24
        });
        photoGroup.add(innerImg);

        attachNodeInteractions(photoGroup, "Foto / Card Equipe");
        state.contentLayer.add(photoGroup);
      }
    }

    // -------------------------------------------------------------
    // CAMADA 3: TOPO - BADGE DE CATEGORIA & LOGO EXTRA
    // -------------------------------------------------------------
    const badgeTextStr = (tag || "Cultura Ikatec").toUpperCase();
    const badgeGroup = new Konva.Group({
      name: "header-badge-group",
      x: 96,
      y: 72,
      draggable: true
    });

    const badgeText = new Konva.Text({
      x: 18,
      y: 9,
      text: badgeTextStr,
      fontSize: 20,
      fontFamily: "Inter",
      fontStyle: "bold",
      fill: isDark ? "#09A8C9" : "#027189",
      letterSpacing: 1.5
    });

    const badgeBg = new Konva.Rect({
      x: 0,
      y: 0,
      width: badgeText.width() + 36,
      height: badgeText.height() + 18,
      fill: isDark ? "rgba(9, 168, 201, 0.14)" : "rgba(9, 168, 201, 0.16)",
      stroke: isDark ? "rgba(9, 168, 201, 0.45)" : "rgba(9, 168, 201, 0.4)",
      strokeWidth: 1.5,
      cornerRadius: 14
    });

    badgeGroup.add(badgeBg);
    badgeGroup.add(badgeText);
    attachNodeInteractions(badgeGroup, "Badge Categoria", "artes-tag");
    state.contentLayer.add(badgeGroup);

    // Logo Extra / Parceiro
    if (extraLogoSrc) {
      const extraImg = await getImage(extraLogoSrc);
      if (extraImg) {
        const extraLogoNode = new Konva.Image({
          name: "extra-logo-node",
          x: 1650,
          y: 70,
          height: 60,
          width: (extraImg.width / extraImg.height) * 60,
          image: extraImg,
          draggable: true
        });
        attachNodeInteractions(extraLogoNode, "Logo Parceiro");
        state.contentLayer.add(extraLogoNode);
      }
    }

    // -------------------------------------------------------------
    // CAMADA 4: CONTEÚDO CONFORME O LAYOUT SELECIONADO
    // -------------------------------------------------------------
    const primaryTextColor = isDark ? "#ffffff" : "#111827";

    if (layout === "split") {
      // TÍTULO SPLIT ESQUERDA
      const titleNode = new Konva.Text({
        name: "split-title-node",
        x: 96,
        y: 260,
        width: 820,
        text: title || "Transparência não é diferencial.",
        fontSize: 66,
        fontFamily: "Inter",
        fontStyle: "bold",
        fill: primaryTextColor,
        lineHeight: 1.15,
        draggable: true
      });
      attachNodeInteractions(titleNode, "Título Principal", "artes-title");
      state.contentLayer.add(titleNode);

      // PALAVRA DE DESTAQUE CIANO
      if (accent && accent.trim()) {
        const accentY = titleNode.y() + titleNode.height() + 12;
        const accentNode = new Konva.Text({
          name: "split-accent-node",
          x: 96,
          y: accentY,
          width: 820,
          text: accent,
          fontSize: 66,
          fontFamily: "Inter",
          fontStyle: "bold",
          fill: "#09A8C9",
          draggable: true
        });
        attachNodeInteractions(accentNode, "Destaque Ciano", "artes-accent");
        state.contentLayer.add(accentNode);
      }

      // COLUNA DA DIREITA (TÍTULO DA LISTA + BULLETS + FECHAMENTO)
      const rightGroup = new Konva.Group({
        name: "split-right-group",
        x: 1040,
        y: 260,
        draggable: true
      });

      const listHeader = new Konva.Text({
        x: 0,
        y: 0,
        text: splitHeader || "Na Ikatec, ela se apoia em:",
        fontSize: 32,
        fontFamily: "Inter",
        fontStyle: "bold",
        fill: isDark ? "#cbd5e1" : "#334155"
      });
      rightGroup.add(listHeader);

      let currentBulletY = 56;
      const bulletItems = (splitBullets || "").split("\n").filter(b => b.trim());
      bulletItems.forEach((bullet) => {
        const cleaned = bullet.trim().replace(/^[·\-\*]\s*/, "");
        if (cleaned) {
          const bulletDot = new Konva.Circle({
            x: 10,
            y: currentBulletY + 16,
            radius: 5,
            fill: "#09A8C9"
          });
          const bulletText = new Konva.Text({
            x: 28,
            y: currentBulletY,
            width: 720,
            text: cleaned,
            fontSize: 32,
            fontFamily: "Inter",
            fontStyle: "bold",
            fill: primaryTextColor,
            lineHeight: 1.2
          });
          rightGroup.add(bulletDot);
          rightGroup.add(bulletText);
          currentBulletY += Math.max(46, bulletText.height() + 16);
        }
      });

      if (splitClosing && splitClosing.trim()) {
        const closingNode = new Konva.Text({
          x: 0,
          y: currentBulletY + 24,
          width: 750,
          text: splitClosing,
          fontSize: 26,
          fontFamily: "Inter",
          fontStyle: "italic",
          fill: "#09A8C9"
        });
        rightGroup.add(closingNode);
      }

      attachNodeInteractions(rightGroup, "Lista Direita");
      state.contentLayer.add(rightGroup);

    } else if (layout === "columns") {
      // 3 COLUNAS COM MOLDURAS
      const colsTitle = new Konva.Text({
        name: "cols-main-title",
        x: 96,
        y: 190,
        text: title || "Foco no cliente",
        fontSize: 68,
        fontFamily: "Inter",
        fontStyle: "bold",
        fill: primaryTextColor,
        draggable: true
      });
      attachNodeInteractions(colsTitle, "Título Principal", "artes-title");
      state.contentLayer.add(colsTitle);

      const pillTitle = new Konva.Text({
        name: "cols-pill-title",
        x: 96,
        y: 280,
        text: colPill || "Coloque esse valor em prática!",
        fontSize: 28,
        fontFamily: "Inter",
        fontStyle: "bold",
        fill: "#09A8C9",
        draggable: true
      });
      attachNodeInteractions(pillTitle, "Subtítulo / Valor", "artes-col-pill");
      state.contentLayer.add(pillTitle);

      // Caixa das 3 Colunas
      const colsGroup = new Konva.Group({
        name: "columns-cards-group",
        x: 96,
        y: 360,
        draggable: true
      });

      const cols = [
        { h: col1h || "Ouça ativamente:", d: col1d || "Entenda as necessidades antes de oferecer soluções." },
        { h: col2h || "Seja ágil:", d: col2d || "Responda rapidamente e atenda às expectativas." },
        { h: col3h || "Personalize:", d: col3d || "Ofereça soluções alinhadas aos objetivos de cada cliente." }
      ];

      const colWidth = 550;
      const colGap = 40;
      cols.forEach((col, idx) => {
        const colCard = new Konva.Group({
          x: idx * (colWidth + colGap),
          y: 0
        });

        const cardBox = new Konva.Rect({
          width: colWidth,
          height: 380,
          fill: isDark ? "rgba(11, 26, 40, 0.75)" : "rgba(255, 255, 255, 0.8)",
          stroke: isDark ? "rgba(9, 168, 201, 0.3)" : "rgba(9, 168, 201, 0.4)",
          strokeWidth: 1.5,
          cornerRadius: 16,
          shadowColor: "rgba(0, 0, 0, 0.3)",
          shadowBlur: 20,
          shadowOffset: { x: 0, y: 8 }
        });

        const heading = new Konva.Text({
          x: 32,
          y: 40,
          width: colWidth - 64,
          text: col.h,
          fontSize: 34,
          fontFamily: "Inter",
          fontStyle: "bold",
          fill: "#09A8C9"
        });

        const desc = new Konva.Text({
          x: 32,
          y: 110,
          width: colWidth - 64,
          text: col.d,
          fontSize: 26,
          fontFamily: "Inter",
          fill: primaryTextColor,
          lineHeight: 1.35
        });

        colCard.add(cardBox);
        colCard.add(heading);
        colCard.add(desc);
        colsGroup.add(colCard);
      });

      attachNodeInteractions(colsGroup, "3 Colunas de Valores");
      state.contentLayer.add(colsGroup);

    } else if (layout === "actions") {
      // ATITUDES / LINHAS
      const actTitle = new Konva.Text({
        name: "actions-title-node",
        x: 96,
        y: 220,
        text: `${title || "3 atitudes que promovem"} ${accent || "transformação:"}`,
        fontSize: 66,
        fontFamily: "Inter",
        fontStyle: "bold",
        fill: primaryTextColor,
        draggable: true
      });
      attachNodeInteractions(actTitle, "Título de Atitudes", "artes-title");
      state.contentLayer.add(actTitle);

      const actGroup = new Konva.Group({
        name: "actions-list-group",
        x: 96,
        y: 340,
        draggable: true
      });

      let currentActY = 0;
      const lines = (actionsList || "").split("\n").filter(l => l.trim());
      lines.forEach((line) => {
        const parts = line.split("–");
        const rowGroup = new Konva.Group({ x: 0, y: currentActY });

        const rowBg = new Konva.Rect({
          width: 1400,
          height: 90,
          fill: isDark ? "rgba(11, 26, 40, 0.6)" : "rgba(255, 255, 255, 0.7)",
          stroke: "rgba(9, 168, 201, 0.25)",
          strokeWidth: 1,
          cornerRadius: 12
        });
        rowGroup.add(rowBg);

        if (parts.length > 1) {
          const keyText = new Konva.Text({
            x: 28,
            y: 28,
            text: `${parts[0].trim()} – `,
            fontSize: 30,
            fontFamily: "Inter",
            fontStyle: "bold",
            fill: "#09A8C9"
          });
          const descText = new Konva.Text({
            x: 28 + keyText.width(),
            y: 28,
            width: 1300 - keyText.width(),
            text: parts.slice(1).join("–").trim(),
            fontSize: 30,
            fontFamily: "Inter",
            fill: primaryTextColor
          });
          rowGroup.add(keyText);
          rowGroup.add(descText);
        } else {
          const singleText = new Konva.Text({
            x: 28,
            y: 28,
            width: 1340,
            text: line.trim(),
            fontSize: 30,
            fontFamily: "Inter",
            fill: primaryTextColor
          });
          rowGroup.add(singleText);
        }

        actGroup.add(rowGroup);
        currentActY += 114;
      });

      attachNodeInteractions(actGroup, "Lista de Atitudes");
      state.contentLayer.add(actGroup);

    } else if (layout === "freeform") {
      // LIVRE / COMUNICADO
      const freeTitle = new Konva.Text({
        name: "free-title-node",
        x: 96,
        y: 220,
        width: 1400,
        text: title || "A inovação vai além do óbvio",
        fontSize: 70,
        fontFamily: "Inter",
        fontStyle: "bold",
        fill: primaryTextColor,
        draggable: true
      });
      attachNodeInteractions(freeTitle, "Título Comunicado", "artes-title");
      state.contentLayer.add(freeTitle);

      const freeLeadNode = new Konva.Text({
        name: "free-lead-node",
        x: 96,
        y: 350,
        width: 1350,
        text: freeLead || "Está nos desafios superados, nos processos melhorados e nas soluções que produzimos...",
        fontSize: 36,
        fontFamily: "Inter",
        fill: primaryTextColor,
        lineHeight: 1.4,
        draggable: true
      });
      attachNodeInteractions(freeLeadNode, "Texto do Comunicado", "artes-freeform-lead-input");
      state.contentLayer.add(freeLeadNode);

      if (freeClosing && freeClosing.trim()) {
        const freeCloseNode = new Konva.Text({
          name: "free-closing-node",
          x: 96,
          y: freeLeadNode.y() + 240,
          width: 1350,
          text: freeClosing,
          fontSize: 38,
          fontFamily: "Inter",
          fontStyle: "bold",
          fill: "#09A8C9",
          draggable: true
        });
        attachNodeInteractions(freeCloseNode, "Frase de Fechamento", "artes-freeform-closing-input");
        state.contentLayer.add(freeCloseNode);
      }
    }

    // -------------------------------------------------------------
    // CAMADA 5: RODAPÉ COM LOGO E SLOGAN IKATEC
    // -------------------------------------------------------------
    const shouldHideFooterLogo = bg && bg.hasBakedLogo && !payload.forceLogo;
    if (!shouldHideFooterLogo && logoSrc) {
      const brandGroup = new Konva.Group({
        name: "brand-footer-group",
        x: 96,
        y: 935,
        draggable: true
      });

      const logoImg = await getImage(logoSrc);
      if (logoImg) {
        const konvaLogo = new Konva.Image({
          x: 0,
          y: 0,
          height: 62,
          width: (logoImg.width / logoImg.height) * 62,
          image: logoImg
        });
        brandGroup.add(konvaLogo);

        if (slogan && slogan.trim()) {
          const sloganNode = new Konva.Text({
            x: konvaLogo.width() + 24,
            y: 18,
            text: slogan,
            fontSize: 22,
            fontFamily: "Inter",
            fontStyle: "600",
            fill: isDark ? "#8ea6bc" : "#475569",
            letterSpacing: 0.8
          });
          brandGroup.add(sloganNode);
        }
      }

      attachNodeInteractions(brandGroup, "Rodapé Marca Ikatec", "artes-slogan-input");
      state.contentLayer.add(brandGroup);
    }

    // -------------------------------------------------------------
    // CAMADA 6: ELEMENTOS PERSONALIZADOS DO USUÁRIO
    // -------------------------------------------------------------
    state.customElements.forEach((el) => {
      state.contentLayer.add(el);
    });

    // Restaurar posições salvas
    if (!forceResetPositions) {
      state.contentLayer.getChildren().forEach((node) => {
        const id = node.name() || node.id();
        if (id && savedNodes.has(id)) {
          const saved = savedNodes.get(id);
          node.x(saved.x);
          node.y(saved.y);
          node.scaleX(saved.scaleX);
          node.scaleY(saved.scaleY);
          node.rotation(saved.rotation);
        }
      });
    }

    // Desenhar camadas
    state.bgLayer.batchDraw();
    state.contentLayer.batchDraw();
    state.uiLayer.batchDraw();
  }

  // ----------------------------------------------------------------
  // 7. EXPORTAÇÃO NATIVA FULL HD (1920x1080)
  // ----------------------------------------------------------------
  function exportPng(filename) {
    if (!state.stage) return;

    // Desmarcar temporariamente para esconder o transformer
    const previouslySelected = state.selectedNode;
    state.transformer.nodes([]);
    state.uiLayer.batchDraw();

    // Exportação em resolução nativa exata (1920x1080)
    const dataUrl = state.stage.toDataURL({
      pixelRatio: 1,
      mimeType: "image/png"
    });

    // Restaurar seleção
    if (previouslySelected) {
      state.transformer.nodes([previouslySelected]);
      state.uiLayer.batchDraw();
    }

    // Trigger de download
    const link = document.createElement("a");
    link.download = filename || "ikatec_tv_1920x1080.png";
    link.href = dataUrl;
    link.click();
  }

  async function copyPng() {
    if (!state.stage) return false;

    const previouslySelected = state.selectedNode;
    state.transformer.nodes([]);
    state.uiLayer.batchDraw();

    return new Promise((resolve, reject) => {
      state.stage.toBlob({
        pixelRatio: 1,
        mimeType: "image/png",
        callback: async (blob) => {
          if (previouslySelected) {
            state.transformer.nodes([previouslySelected]);
            state.uiLayer.batchDraw();
          }

          if (!blob) {
            resolve(false);
            return;
          }

          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            resolve(true);
          } catch (err) {
            console.error("[ArtesKonva] Erro ao copiar imagem:", err);
            resolve(false);
          }
        }
      });
    });
  }

  // Exportar API Pública no objeto global
  window.ArtesKonva = {
    init: initStage,
    updateCanvas,
    selectElement,
    exportPng,
    copyPng,
    addNewText,
    addNewBadge,
    addNewCard
  };

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStage);
  } else {
    initStage();
  }
})();
