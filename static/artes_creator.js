/* ================================================================
   Módulo Criação de Artes - Endomarketing Hub (16:9 Canvas)
   Motor de Renderização - Padrão Oficial Ikatec
   Arquitetura de Camadas Inteligente: Fundo + 3D + Logos + Conteúdo
   ================================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const layoutBtns = document.querySelectorAll(".artes-type-btn");
  const logoOptions = document.querySelectorAll(".artes-logo-option");

  // Groups
  const groupSplit = document.getElementById("artes-group-split");
  const groupColumns = document.getElementById("artes-group-columns");
  const groupActions = document.getElementById("artes-group-actions");
  const groupFreeform = document.getElementById("artes-group-freeform");

  // Views inside Canvas
  const viewSplit = document.getElementById("artes-view-split");
  const viewColumns = document.getElementById("artes-view-columns");
  const viewActions = document.getElementById("artes-view-actions");
  const viewFreeform = document.getElementById("artes-view-freeform");

  // Common Form inputs
  const tagInput = document.getElementById("artes-tag");
  const titleInput = document.getElementById("artes-title");
  const accentInput = document.getElementById("artes-accent");
  const sloganInput = document.getElementById("artes-slogan-input");

  // Split inputs
  const splitHeaderInput = document.getElementById("artes-split-header");
  const splitBulletsInput = document.getElementById("artes-split-bullets");
  const splitClosingInput = document.getElementById("artes-split-closing");

  // Columns inputs
  const colPillInput = document.getElementById("artes-col-pill");
  const c1h = document.getElementById("artes-col1-h");
  const c1d = document.getElementById("artes-col1-d");
  const c2h = document.getElementById("artes-col2-h");
  const c2d = document.getElementById("artes-col2-d");
  const c3h = document.getElementById("artes-col3-h");
  const c3d = document.getElementById("artes-col3-d");

  // Actions input
  const actionsTextInput = document.getElementById("artes-actions-text");

  // Freeform inputs
  const freeLeadInput = document.getElementById("artes-freeform-lead-input");
  const freeClosingInput = document.getElementById("artes-freeform-closing-input");

  // Upload inputs & Dropzone
  const photoInput = document.getElementById("artes-photo-upload");
  const photoDropzone = document.getElementById("artes-photo-dropzone");
  const photoEmptyState = document.getElementById("artes-photo-empty-state");
  const photoPreviewState = document.getElementById("artes-photo-preview-state");
  const photoThumb = document.getElementById("artes-photo-thumb");
  const changePhotoBtn = document.getElementById("btn-change-artes-photo");
  const removePhotoBtn = document.getElementById("btn-remove-artes-photo");

  // Photo Controls & Sliders
  const photoControls = document.getElementById("artes-photo-controls");
  const photoModeBtns = document.querySelectorAll(".artes-photo-mode-btn");
  const cardPositionGroup = document.getElementById("artes-card-position-group");
  const cardAlignBtns = document.querySelectorAll(".artes-card-align-btn");
  const photoZoomInput = document.getElementById("artes-photo-zoom");
  const photoOpacityInput = document.getElementById("artes-photo-opacity");
  const resetPhotoBtn = document.getElementById("btn-reset-artes-photo");

  const valPhotoZoom = document.getElementById("val-photo-zoom");
  const valPhotoOpacity = document.getElementById("val-photo-opacity");

  const extraLogoInput = document.getElementById("artes-extra-logo-upload");

  // Smart Logo & 3D Form Controls
  const logoSmartStatus = document.getElementById("artes-logo-smart-status");
  const forceLogoContainer = document.getElementById("artes-force-logo-container");
  const forceLogoToggle = document.getElementById("artes-force-logo-toggle");
  const hint3DBox = document.getElementById("artes-3d-hint-box");

  // Buttons
  const exportPngBtn = document.getElementById("export-artes-png");
  const copyArtesBtn = document.getElementById("copy-artes-btn");

  // Canvas Display Elements
  const screenEl = document.getElementById("artes-screen");
  const bgImageLayer = document.getElementById("artes-bg-image-layer");
  const element3DLayer = document.getElementById("artes-3d-layer");
  const bgPhotoLayer = document.getElementById("artes-bg-photo-layer");
  const bgPhotoInner = document.getElementById("artes-bg-photo-inner");
  const bgPhotoOverlay = document.getElementById("artes-bg-photo-overlay");
  const cardDragBar = document.getElementById("artes-card-drag-bar");
  const badgeEl = document.getElementById("artes-badge-tag");
  const brandBlockEl = document.getElementById("artes-brand-block");
  const logoEl = document.getElementById("artes-canvas-logo");
  const sloganEl = document.getElementById("artes-canvas-slogan");
  const extraLogoEl = document.getElementById("artes-canvas-extra-logo");

  // Split view DOM
  const splitTitleText = document.getElementById("artes-split-title-text");
  const splitAccentText = document.getElementById("artes-split-accent-text");
  const splitListTitle = document.getElementById("artes-split-list-title");
  const splitList = document.getElementById("artes-split-list");
  const splitClosingText = document.getElementById("artes-split-closing-text");

  // Columns view DOM
  const colsMainTitle = document.getElementById("artes-cols-main-title");
  const colsPillTitle = document.getElementById("artes-cols-pill-title");
  const col1hEl = document.getElementById("artes-c1-h");
  const col1dEl = document.getElementById("artes-c1-d");
  const col2hEl = document.getElementById("artes-c2-h");
  const col2dEl = document.getElementById("artes-c2-d");
  const col3hEl = document.getElementById("artes-c3-h");
  const col3dEl = document.getElementById("artes-c3-d");

  // Actions view DOM
  const actTitleText = document.getElementById("artes-act-title-text");
  const actAccentText = document.getElementById("artes-act-accent-text");
  const actListContainer = document.getElementById("artes-act-list-container");

  // Freeform view DOM
  const freeTitleText = document.getElementById("artes-free-title-text");
  const freeLeadText = document.getElementById("artes-free-lead-text");
  const freeClosingText = document.getElementById("artes-free-closing-text");

  const wrapper = document.getElementById("artes-canvas-wrapper");
  const workspace = document.getElementById("artes-workspace");
  const scaler = document.getElementById("artes-scaler");

  // Catalogs
  const backgroundCatalog = {
    "none-dark": {
      name: "Dark Tech (Nativo)",
      type: "theme",
      theme: "dark",
      src: "",
      hasBakedLogo: false,
      hasBaked3D: false
    },
    "none-cyan": {
      name: "Cyan Wash (Nativo)",
      type: "theme",
      theme: "cyan-wash",
      src: "",
      hasBakedLogo: false,
      hasBaked3D: false
    },
    "none-white": {
      name: "White Clean (Nativo)",
      type: "theme",
      theme: "white-clean",
      src: "",
      hasBakedLogo: false,
      hasBaked3D: false
    },
    "bg-ikatec-1": {
      name: "Fundo Ikatec 01",
      type: "image",
      theme: "dark",
      src: "static/marketing/fundos/Background Ikatec (1).png",
      hasBakedLogo: false,
      hasBaked3D: false
    },
    "bg-ikatec-2": {
      name: "Fundo Ikatec 02",
      type: "image",
      theme: "dark",
      src: "static/marketing/fundos/Background Ikatec (2).png",
      hasBakedLogo: false,
      hasBaked3D: false
    },
    "prancheta-1": {
      name: "Prancheta 01 (Cyan + 3D)",
      type: "image",
      theme: "dark",
      src: "static/marketing/fundos/BackgroundsPrancheta 1.png",
      hasBakedLogo: true,
      hasBaked3D: true
    },
    "prancheta-2": {
      name: "Prancheta 02 (Dark)",
      type: "image",
      theme: "dark",
      src: "static/marketing/fundos/BackgroundsPrancheta 2.png",
      hasBakedLogo: true,
      hasBaked3D: false
    },
    "prancheta-3": {
      name: "Prancheta 03 (Cyan)",
      type: "image",
      theme: "cyan-wash",
      src: "static/marketing/fundos/BackgroundsPrancheta 3.png",
      hasBakedLogo: true,
      hasBaked3D: false
    },
    "prancheta-4": {
      name: "Prancheta 04 (Dark + Cubos)",
      type: "image",
      theme: "dark",
      src: "static/marketing/fundos/BackgroundsPrancheta 4.png",
      hasBakedLogo: true,
      hasBaked3D: true
    },
    "prancheta-5": {
      name: "Prancheta 05 (Dark)",
      type: "image",
      theme: "dark",
      src: "static/marketing/fundos/BackgroundsPrancheta 5.png",
      hasBakedLogo: true,
      hasBaked3D: false
    },
    "prancheta-6": {
      name: "Prancheta 06 (Cyan)",
      type: "image",
      theme: "cyan-wash",
      src: "static/marketing/fundos/BackgroundsPrancheta 6.png",
      hasBakedLogo: true,
      hasBaked3D: false
    },
    "prancheta-7": {
      name: "Prancheta 07 (Dark)",
      type: "image",
      theme: "dark",
      src: "static/marketing/fundos/BackgroundsPrancheta 7.png",
      hasBakedLogo: true,
      hasBaked3D: false
    },
    "prancheta-8": {
      name: "Prancheta 08 (Branco + Logo)",
      type: "image",
      theme: "white-clean",
      src: "static/marketing/fundos/BackgroundsPrancheta-8.png",
      hasBakedLogo: true,
      hasBaked3D: false
    },
    "prancheta-9": {
      name: "Prancheta 09 (Branco + Logo)",
      type: "image",
      theme: "white-clean",
      src: "static/marketing/fundos/BackgroundsPrancheta-9.png",
      hasBakedLogo: true,
      hasBaked3D: false
    }
  };

  const elements3DCatalog = {
    "none": {
      name: "Nenhum 3D",
      src: "",
      blendMode: "normal"
    },
    "3d-001": {
      name: "Cubos 01",
      src: "static/marketing/fundos/3D-001.png",
      blendMode: "normal"
    },
    "3d-003": {
      name: "Geometria 03",
      src: "static/marketing/fundos/3D-003.png",
      blendMode: "normal"
    },
    "3d-005": {
      name: "Ângulo 05",
      src: "static/marketing/fundos/3D-005.png",
      blendMode: "normal"
    },
    "3d-004": {
      name: "Cubos 04",
      src: "static/marketing/fundos/3D-004.png",
      blendMode: "screen"
    },
    "3d-006": {
      name: "Sólido 06",
      src: "static/marketing/fundos/3D-006.png",
      blendMode: "screen"
    },
    "elemento-3d": {
      name: "Composição 3D",
      src: "static/marketing/fundos/Elemento-3D.png",
      blendMode: "screen"
    }
  };

  // State
  let currentLayout = "split";
  let currentTheme = "dark";
  let currentLogo = "static/marketing/logos/Fundo PretoLogotipo Ikatec.png";
  let currentBgKey = "none-dark";
  let current3DKey = "none";
  let customPhotoUrl = null;
  let customExtraLogoUrl = null;
  let currentPhotoMode = "fade"; // "fade" | "card" | "full"
  let photoZoom = 100;
  let photoPanX = 0; // offset em pixels no canvas (pan horizontal com mouse)
  let photoPanY = 0; // offset em pixels no canvas (pan vertical com mouse)
  let photoOpacity = 100;
  let cardX = 1100;  // posição X do card no canvas 1920x1080 (padrão direita)
  let cardY = 130;   // posição Y do card no canvas 1920x1080
  let cardAlign = "right"; // "left" | "center" | "right" | "custom"

  // Presets mapping based on real samples
  const layoutPresets = {
    split: {
      tag: "Cultura Ikatec",
      title: "Transparência não é diferencial.",
      accent: "É critério.",
      theme: "dark",
      splitHeader: "Na Ikatec, ela se apoia em:",
      splitBullets: "Honestidade\nClareza\nFeedbacks\nCompromisso",
      splitClosing: "Confiança se constrói todos os dias."
    },
    columns: {
      tag: "Cultura Ikatec",
      title: "Foco no cliente",
      accent: "",
      theme: "cyan-wash",
      pill: "Coloque esse valor em prática!",
      c1h: "Ouça ativamente:",
      c1d: "Entenda as necessidades antes de oferecer soluções.",
      c2h: "Seja ágil:",
      c2d: "Responda rapidamente e atenda às expectativas com eficiência.",
      c3h: "Personalize a experiência:",
      c3d: "Ofereça soluções alinhadas aos objetivos e desafios de cada cliente."
    },
    actions: {
      tag: "Cultura Ikatec",
      title: "3 atitudes que promovem",
      accent: "transformação:",
      theme: "dark",
      actionsText: "Inove – Explore novas ideias e crie soluções.\nColabore – Trabalhe em equipe para crescer mais.\nAja rápido – Identifique oportunidades e faça acontecer."
    },
    freeform: {
      tag: "Cultura Ikatec",
      title: "A inovação vai além do óbvio",
      accent: "",
      theme: "dark",
      freeLead: "Está nos desafios superados, nos processos melhorados e nas soluções que produzimos...",
      freeClosing: "Que mudança você pode criar hoje?"
    }
  };

  function switchLayout(layoutName) {
    currentLayout = layoutName;
    layoutBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-layout") === layoutName));

    // Hide all form groups
    if (groupSplit) groupSplit.style.display = "none";
    if (groupColumns) groupColumns.style.display = "none";
    if (groupActions) groupActions.style.display = "none";
    if (groupFreeform) groupFreeform.style.display = "none";

    // Hide all canvas views
    if (viewSplit) viewSplit.style.display = "none";
    if (viewColumns) viewColumns.style.display = "none";
    if (viewActions) viewActions.style.display = "none";
    if (viewFreeform) viewFreeform.style.display = "none";

    const p = layoutPresets[layoutName];

    if (layoutName === "split") {
      if (groupSplit) groupSplit.style.display = "block";
      if (viewSplit) viewSplit.style.display = "flex";
      if (p) {
        tagInput.value = p.tag;
        titleInput.value = p.title;
        accentInput.value = p.accent;
        splitHeaderInput.value = p.splitHeader;
        splitBulletsInput.value = p.splitBullets;
        splitClosingInput.value = p.splitClosing;
        selectBackground("none-dark");
      }
    } else if (layoutName === "columns") {
      if (groupColumns) groupColumns.style.display = "block";
      if (viewColumns) viewColumns.style.display = "flex";
      if (p) {
        tagInput.value = p.tag;
        titleInput.value = p.title;
        accentInput.value = p.accent;
        colPillInput.value = p.pill;
        c1h.value = p.c1h; c1d.value = p.c1d;
        c2h.value = p.c2h; c2d.value = p.c2d;
        c3h.value = p.c3h; c3d.value = p.c3d;
        selectBackground("none-cyan");
      }
    } else if (layoutName === "actions") {
      if (groupActions) groupActions.style.display = "block";
      if (viewActions) viewActions.style.display = "flex";
      if (p) {
        tagInput.value = p.tag;
        titleInput.value = p.title;
        accentInput.value = p.accent;
        actionsTextInput.value = p.actionsText;
        selectBackground("none-dark");
      }
    } else if (layoutName === "freeform") {
      if (groupFreeform) groupFreeform.style.display = "block";
      if (viewFreeform) viewFreeform.style.display = "flex";
      if (p) {
        tagInput.value = p.tag;
        titleInput.value = p.title;
        accentInput.value = p.accent;
        freeLeadInput.value = p.freeLead;
        freeClosingInput.value = p.freeClosing;
        selectBackground("none-dark");
      }
    }

    renderCanvas();
  }

  function applyTheme(themeName) {
    currentTheme = themeName;
    screenEl.className = `artes-screen artes-theme--${themeName}`;

    if (themeName === "cyan-wash") {
      screenEl.style.backgroundColor = "#0087a3";
    } else if (themeName === "white-clean") {
      screenEl.style.backgroundColor = "#ffffff";
    } else {
      screenEl.style.backgroundColor = "#03080e";
    }
  }

  function selectBackground(bgKey) {
    if (!backgroundCatalog[bgKey]) bgKey = "none-dark";
    currentBgKey = bgKey;

    // Update active highlight in UI
    document.querySelectorAll("[data-bg-key]").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-bg-key") === bgKey);
    });

    const bg = backgroundCatalog[bgKey];
    applyTheme(bg.theme);

    // Smart Logo Management: if background already contains Ikatec logo, hide dynamic logo & inform user
    if (bg.hasBakedLogo) {
      if (logoSmartStatus) logoSmartStatus.style.display = "flex";
      if (forceLogoContainer) forceLogoContainer.style.display = "block";
    } else {
      if (logoSmartStatus) logoSmartStatus.style.display = "none";
      if (forceLogoContainer) forceLogoContainer.style.display = "none";
      if (forceLogoToggle) forceLogoToggle.checked = false;
    }

    // Smart 3D Management: if background already has 3D baked in, warn user & default 3D to "none"
    if (bg.hasBaked3D) {
      if (hint3DBox) hint3DBox.style.display = "flex";
      select3D("none");
    } else {
      if (hint3DBox) hint3DBox.style.display = "none";
    }

    renderCanvas();
  }

  function select3D(key) {
    if (!elements3DCatalog[key]) key = "none";
    current3DKey = key;

    document.querySelectorAll("[data-3d-key]").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-3d-key") === key);
    });

    renderCanvas();
  }

  function renderCanvas() {
    const bg = backgroundCatalog[currentBgKey] || backgroundCatalog["none-dark"];
    const el3d = elements3DCatalog[current3DKey] || elements3DCatalog["none"];

    // 1. Render Background Layer (1920x1080)
    if (bgImageLayer) {
      if (bg.type === "image" && bg.src) {
        bgImageLayer.style.backgroundImage = `url('${bg.src}')`;
        bgImageLayer.style.display = "block";
      } else {
        bgImageLayer.style.display = "none";
        bgImageLayer.style.backgroundImage = "none";
      }
    }

    // 2. Render Independent 3D Floating Layer
    if (element3DLayer) {
      if (el3d.src) {
        element3DLayer.style.backgroundImage = `url('${el3d.src}')`;
        element3DLayer.style.display = "block";
        element3DLayer.className = `artes-3d-layer${el3d.blendMode === "screen" ? " artes-blend--screen" : ""}`;
      } else {
        element3DLayer.style.display = "none";
        element3DLayer.style.backgroundImage = "none";
      }
    }

    // 3. Render Custom Photo Layer with Selected Mode & Framing
    if (bgPhotoLayer && bgPhotoInner) {
      if (customPhotoUrl) {
        bgPhotoLayer.style.display = "block";
        bgPhotoLayer.className = `artes-bg-photo-layer artes-photo-mode--${currentPhotoMode}`;
        
        // Configuração de posição no modo card
        if (currentPhotoMode === "card") {
          bgPhotoLayer.style.left = `${cardX}px`;
          bgPhotoLayer.style.top = `${cardY}px`;
          bgPhotoLayer.style.right = "auto";
          if (cardPositionGroup) cardPositionGroup.style.display = "block";
        } else {
          bgPhotoLayer.style.left = "";
          bgPhotoLayer.style.top = "";
          bgPhotoLayer.style.right = "";
          if (cardPositionGroup) cardPositionGroup.style.display = "none";
        }

        bgPhotoInner.style.backgroundImage = `url('${customPhotoUrl}')`;
        bgPhotoInner.style.backgroundPosition = `calc(50% + ${photoPanX}px) calc(50% + ${photoPanY}px)`;
        bgPhotoInner.style.transform = `scale(${photoZoom / 100})`;
        bgPhotoInner.style.transformOrigin = `center center`;
        bgPhotoInner.style.opacity = `${photoOpacity / 100}`;
      } else {
        bgPhotoLayer.style.display = "none";
        bgPhotoInner.style.backgroundImage = "none";
        if (cardPositionGroup) cardPositionGroup.style.display = "none";
      }
    }

    // 4. Smart Logo Collision Avoidance:
    // If background already has baked logo, hide footer brand block unless explicitly forced
    const isForced = forceLogoToggle && forceLogoToggle.checked;
    const shouldHideFooterLogo = bg.hasBakedLogo && !isForced;

    if (brandBlockEl) {
      brandBlockEl.style.display = shouldHideFooterLogo ? "none" : "flex";
    }

    if (logoEl) {
      logoEl.src = currentLogo;
    }

    if (sloganEl) {
      sloganEl.textContent = sloganInput.value || "";
    }

    // 5. Header Extra Logo (Partner / Seal)
    if (extraLogoEl) {
      if (customExtraLogoUrl) {
        extraLogoEl.src = customExtraLogoUrl;
        extraLogoEl.style.display = "block";
      } else {
        extraLogoEl.style.display = "none";
      }
    }

    // 6. Badge Tag
    if (badgeEl) {
      badgeEl.textContent = tagInput.value || "Cultura Ikatec";
    }

    // 7. Render Layout Specific Contents
    if (currentLayout === "split") {
      if (splitTitleText) splitTitleText.textContent = titleInput.value;
      if (splitAccentText) {
        splitAccentText.textContent = accentInput.value;
        splitAccentText.style.display = accentInput.value.trim() ? "block" : "none";
      }
      if (splitListTitle) splitListTitle.textContent = splitHeaderInput.value;
      if (splitClosingText) splitClosingText.textContent = splitClosingInput.value;

      if (splitList) {
        splitList.innerHTML = "";
        const lines = (splitBulletsInput.value || "").split("\n");
        lines.forEach((line) => {
          const trimmed = line.trim().replace(/^[·\-\*]\s*/, "");
          if (trimmed) {
            const li = document.createElement("li");
            li.className = "artes-bullet-item";
            li.textContent = trimmed;
            splitList.appendChild(li);
          }
        });
      }
    } else if (currentLayout === "columns") {
      if (colsMainTitle) colsMainTitle.textContent = titleInput.value;
      if (colsPillTitle) colsPillTitle.textContent = colPillInput.value;
      if (col1hEl) col1hEl.textContent = c1h.value;
      if (col1dEl) col1dEl.textContent = c1d.value;
      if (col2hEl) col2hEl.textContent = c2h.value;
      if (col2dEl) col2dEl.textContent = c2d.value;
      if (col3hEl) col3hEl.textContent = c3h.value;
      if (col3dEl) col3dEl.textContent = c3d.value;
    } else if (currentLayout === "actions") {
      if (actTitleText) actTitleText.textContent = titleInput.value;
      if (actAccentText) {
        actAccentText.textContent = accentInput.value;
        actAccentText.style.display = accentInput.value.trim() ? "inline" : "none";
      }

      if (actListContainer) {
        actListContainer.innerHTML = "";
        const rawLines = (actionsTextInput.value || "").split("\n");
        rawLines.forEach((row) => {
          if (!row.trim()) return;
          const parts = row.split("–");
          const rowDiv = document.createElement("div");
          rowDiv.className = "artes-action-row";

          if (parts.length > 1) {
            rowDiv.innerHTML = `<span class="artes-action-keyword">${parts[0].trim()} – </span><span class="artes-action-desc">${parts.slice(1).join("–").trim()}</span>`;
          } else {
            rowDiv.innerHTML = `<span class="artes-action-desc">${row.trim()}</span>`;
          }
          actListContainer.appendChild(rowDiv);
        });
      }
    } else if (currentLayout === "freeform") {
      if (freeTitleText) freeTitleText.textContent = titleInput.value;
      if (freeLeadText) freeLeadText.textContent = freeLeadInput.value;
      if (freeClosingText) freeClosingText.textContent = freeClosingInput.value;
    }

    // 8. Sincronização em tempo real com o motor Konva.js (Edição Interativa)
    if (window.ArtesKonva && window.ArtesKonva.updateCanvas) {
      const payload = {
        layout: currentLayout,
        bg,
        el3d,
        logoSrc: currentLogo,
        slogan: sloganInput ? sloganInput.value : "Tecnologia e Inovação",
        extraLogoSrc: customExtraLogoUrl,
        tag: tagInput ? tagInput.value : "Cultura Ikatec",
        title: titleInput ? titleInput.value : "",
        accent: accentInput ? accentInput.value : "",
        splitHeader: splitHeaderInput ? splitHeaderInput.value : "",
        splitBullets: splitBulletsInput ? splitBulletsInput.value : "",
        splitClosing: splitClosingInput ? splitClosingInput.value : "",
        colPill: colPillInput ? colPillInput.value : "",
        col1h: c1h ? c1h.value : "",
        col1d: c1d ? c1d.value : "",
        col2h: c2h ? c2h.value : "",
        col2d: c2d ? c2d.value : "",
        col3h: c3h ? c3h.value : "",
        col3d: c3d ? c3d.value : "",
        actionsList: actionsTextInput ? actionsTextInput.value : "",
        freeLead: freeLeadInput ? freeLeadInput.value : "",
        freeClosing: freeClosingInput ? freeClosingInput.value : "",
        photoUrl: customPhotoUrl,
        photoMode: currentPhotoMode,
        photoPanX,
        photoPanY,
        photoZoom,
        photoOpacity,
        cardX,
        cardY,
        forceLogo: forceLogoToggle && forceLogoToggle.checked
      };
      window.ArtesKonva.updateCanvas(payload);
    }
  }

  // Bind Listeners to all text inputs
  const allInputs = [
    tagInput, titleInput, accentInput, sloganInput,
    splitHeaderInput, splitBulletsInput, splitClosingInput,
    colPillInput, c1h, c1d, c2h, c2d, c3h, c3d,
    actionsTextInput, freeLeadInput, freeClosingInput
  ];

  allInputs.forEach((inp) => {
    if (inp) inp.addEventListener("input", renderCanvas);
  });

  // Layout Buttons
  layoutBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchLayout(btn.getAttribute("data-layout"));
    });
  });

  // Logos Selector
  logoOptions.forEach((opt) => {
    opt.addEventListener("click", () => {
      logoOptions.forEach((o) => o.classList.remove("active"));
      opt.classList.add("active");
      currentLogo = opt.getAttribute("data-src");
      renderCanvas();
    });
  });

  // Background Selectors (Themes + Clean Textures + Official Templates)
  document.querySelectorAll("[data-bg-key]").forEach((el) => {
    el.addEventListener("click", () => {
      selectBackground(el.getAttribute("data-bg-key"));
    });
  });

  // 3D Elements Selector
  document.querySelectorAll("[data-3d-key]").forEach((el) => {
    el.addEventListener("click", () => {
      select3D(el.getAttribute("data-3d-key"));
    });
  });

  // Force Logo Toggle
  if (forceLogoToggle) {
    forceLogoToggle.addEventListener("change", () => {
      renderCanvas();
    });
  }

  // Photo File Loader & Preview
  function handlePhotoFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      alert("Por favor selecione um arquivo de imagem válido (JPG, PNG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      customPhotoUrl = evt.target.result;
      if (photoThumb) photoThumb.src = customPhotoUrl;
      if (photoEmptyState) photoEmptyState.style.display = "none";
      if (photoPreviewState) photoPreviewState.style.display = "flex";
      if (photoControls) photoControls.style.display = "block";
      renderCanvas();
    };
    reader.readAsDataURL(file);
  }

  // Trigger file picker from empty box or change button
  if (photoEmptyState) {
    photoEmptyState.addEventListener("click", () => {
      if (photoInput) photoInput.click();
    });
  }
  if (changePhotoBtn) {
    changePhotoBtn.addEventListener("click", () => {
      if (photoInput) photoInput.click();
    });
  }

  // File input change
  if (photoInput) {
    photoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handlePhotoFile(file);
    });
  }

  // Drag & Drop on photo dropzone
  if (photoDropzone) {
    photoDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      photoDropzone.classList.add("dragover");
    });
    photoDropzone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      photoDropzone.classList.remove("dragover");
    });
    photoDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      photoDropzone.classList.remove("dragover");
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handlePhotoFile(files[0]);
      }
    });
  }

  // Remove Photo
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      customPhotoUrl = null;
      if (photoInput) photoInput.value = "";
      if (photoThumb) photoThumb.src = "";
      if (photoEmptyState) photoEmptyState.style.display = "flex";
      if (photoPreviewState) photoPreviewState.style.display = "none";
      if (photoControls) photoControls.style.display = "none";
      renderCanvas();
    });
  }

  // Photo Modes Selection (Fusão Lateral, Card Moldura, Fundo Total)
  photoModeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      photoModeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentPhotoMode = btn.getAttribute("data-photo-mode") || "fade";
      renderCanvas();
    });
  });

  // Card Alignment Selection (Esquerda, Centro, Direita)
  cardAlignBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      cardAlignBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const align = btn.getAttribute("data-align") || "right";
      cardAlign = align;
      if (align === "left") {
        cardX = 80;
        cardY = 130;
      } else if (align === "center") {
        cardX = 590; // (1920 - 740) / 2
        cardY = 130;
      } else if (align === "right") {
        cardX = 1100;
        cardY = 130;
      }
      renderCanvas();
    });
  });

  // Photo Zoom & Opacity Sliders
  if (photoZoomInput) {
    photoZoomInput.addEventListener("input", (e) => {
      photoZoom = parseInt(e.target.value, 10) || 100;
      if (valPhotoZoom) valPhotoZoom.textContent = `${photoZoom}%`;
      renderCanvas();
    });
  }

  if (photoOpacityInput) {
    photoOpacityInput.addEventListener("input", (e) => {
      photoOpacity = parseInt(e.target.value, 10);
      if (valPhotoOpacity) valPhotoOpacity.textContent = `${photoOpacity}%`;
      renderCanvas();
    });
  }

  // Reset Photo Framing & Card Position
  if (resetPhotoBtn) {
    resetPhotoBtn.addEventListener("click", () => {
      photoZoom = 100;
      photoPanX = 0;
      photoPanY = 0;
      photoOpacity = 100;
      cardX = 1100;
      cardY = 130;
      cardAlign = "right";

      cardAlignBtns.forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-align") === "right");
      });

      if (photoZoomInput) photoZoomInput.value = 100;
      if (valPhotoZoom) valPhotoZoom.textContent = "100%";

      if (photoOpacityInput) photoOpacityInput.value = 100;
      if (valPhotoOpacity) valPhotoOpacity.textContent = "100%";

      renderCanvas();
    });
  }

  // Helper to obtain current canvas transform scale
  function getCanvasScale() {
    const wrapperEl = document.getElementById("artes-canvas-wrapper");
    if (!wrapperEl) return 1;
    const match = wrapperEl.style.transform.match(/scale\(([^)]+)\)/);
    return match ? parseFloat(match[1]) : 1;
  }

  // -------------------------------------------------------------
  // MOUSE DRAG 1: Enquadramento da Foto (Pan X / Y Direto no Canvas)
  // -------------------------------------------------------------
  let isPanningPhoto = false;
  let panStartX = 0;
  let panStartY = 0;
  let initialPanX = 0;
  let initialPanY = 0;

  if (bgPhotoLayer) {
    bgPhotoLayer.addEventListener("mousedown", (e) => {
      // Se clicou na alça de mover o card, não inicia o pan da foto
      if (e.target.closest("#artes-card-drag-bar")) return;
      if (!customPhotoUrl) return;

      e.preventDefault();
      isPanningPhoto = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      initialPanX = photoPanX;
      initialPanY = photoPanY;
      bgPhotoLayer.classList.add("is-panning");
    });
  }

  // -------------------------------------------------------------
  // MOUSE DRAG 2: Reposicionamento do Card no Canvas (Modo Card Moldura)
  // -------------------------------------------------------------
  let isDraggingCard = false;
  let cardStartX = 0;
  let cardStartY = 0;
  let initialCardX = 0;
  let initialCardY = 0;

  if (cardDragBar) {
    cardDragBar.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingCard = true;
      cardStartX = e.clientX;
      cardStartY = e.clientY;
      initialCardX = cardX;
      initialCardY = cardY;
      if (bgPhotoLayer) bgPhotoLayer.classList.add("is-dragging-card");
    });
  }

  // Global window mousemove & mouseup for instant 60fps tracking
  window.addEventListener("mousemove", (e) => {
    const scale = getCanvasScale();

    // 1. Pan da Foto
    if (isPanningPhoto) {
      const dx = (e.clientX - panStartX) / scale;
      const dy = (e.clientY - panStartY) / scale;
      photoPanX = Math.round(initialPanX + dx);
      photoPanY = Math.round(initialPanY + dy);
      if (bgPhotoInner) {
        bgPhotoInner.style.backgroundPosition = `calc(50% + ${photoPanX}px) calc(50% + ${photoPanY}px)`;
      }
    }

    // 2. Mover Posição do Card
    if (isDraggingCard) {
      const dx = (e.clientX - cardStartX) / scale;
      const dy = (e.clientY - cardStartY) / scale;
      const cardW = bgPhotoLayer ? bgPhotoLayer.offsetWidth || 740 : 740;
      const cardH = bgPhotoLayer ? bgPhotoLayer.offsetHeight || 770 : 770;
      cardX = Math.round(Math.max(20, Math.min(1920 - cardW - 20, initialCardX + dx)));
      cardY = Math.round(Math.max(20, Math.min(1080 - cardH - 20, initialCardY + dy)));
      cardAlign = "custom";
      cardAlignBtns.forEach((b) => b.classList.remove("active"));
      if (bgPhotoLayer) {
        bgPhotoLayer.style.left = `${cardX}px`;
        bgPhotoLayer.style.top = `${cardY}px`;
        bgPhotoLayer.style.right = "auto";
      }
    }
  });

  window.addEventListener("mouseup", () => {
    if (isPanningPhoto) {
      isPanningPhoto = false;
      if (bgPhotoLayer) bgPhotoLayer.classList.remove("is-panning");
    }
    if (isDraggingCard) {
      isDraggingCard = false;
      if (bgPhotoLayer) bgPhotoLayer.classList.remove("is-dragging-card");
    }
  });

  // Extra Logo Upload
  if (extraLogoInput) {
    extraLogoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          customExtraLogoUrl = evt.target.result;
          renderCanvas();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Responsive Canvas Scaler (16:9 - 1920x1080)
  function resizeArtesCanvas(zoom) {
    const wrapperEl = document.getElementById("artes-canvas-wrapper");
    const workspaceEl = document.getElementById("artes-workspace");
    const scalerEl = document.getElementById("artes-scaler");
    if (!wrapperEl || !workspaceEl) return;

    const currentZoom = (typeof zoom === "number") ? zoom : (window.currentHubZoom || 1.0);

    const viewport = document.getElementById("preview-scroll-viewport") || workspaceEl.parentElement;
    
    // Obter dimensões reais da área de visualização
    const vpWidth = (viewport && viewport.clientWidth > 50) ? viewport.clientWidth : window.innerWidth;
    const vpHeight = (viewport && viewport.clientHeight > 50) ? viewport.clientHeight : window.innerHeight;

    // Subtrair padding e respiro
    const availableWidth = Math.max(300, vpWidth - 48);
    const availableHeight = Math.max(300, vpHeight - 90);

    // Escala para caber perfeitamente na largura E na altura (proporção 16:9 = 1920x1080)
    const scaleW = availableWidth / 1920;
    const scaleH = availableHeight / 1080;
    const baseScale = Math.min(scaleW, scaleH);

    const scale = +(baseScale * currentZoom).toFixed(4);
    const scaledWidth = Math.round(1920 * scale);
    const scaledHeight = Math.round(1080 * scale);

    wrapperEl.style.transform = `scale(${scale})`;
    wrapperEl.style.transformOrigin = "top left";
    wrapperEl.style.width = "1920px";
    wrapperEl.style.height = "1080px";

    if (scalerEl) {
      scalerEl.style.width = `${scaledWidth}px`;
      scalerEl.style.height = `${scaledHeight}px`;
    }

    if (scaledWidth > availableWidth) {
      workspaceEl.style.justifyContent = "flex-start";
      if (scalerEl) {
        scalerEl.style.marginLeft = "0";
        scalerEl.style.marginRight = "auto";
      }
    } else {
      workspaceEl.style.justifyContent = "center";
      if (scalerEl) {
        scalerEl.style.marginLeft = "auto";
        scalerEl.style.marginRight = "auto";
      }
    }
  }

  window.resizeArtesCanvas = resizeArtesCanvas;
  window.addEventListener("resize", () => {
    resizeArtesCanvas();
  });

  const artesNavBtn = document.querySelector('.nav-btn[data-target="artes"]');
  if (artesNavBtn) {
    artesNavBtn.addEventListener("click", () => {
      setTimeout(() => resizeArtesCanvas(), 30);
      setTimeout(() => resizeArtesCanvas(), 100);
      setTimeout(() => resizeArtesCanvas(), 300);
    });
  }

  // Export to PNG in 1920x1080 Full HD
  async function generateArtesCanvas() {
    if (typeof html2canvas === "undefined") {
      alert("A biblioteca html2canvas ainda está carregando. Tente novamente em instantes.");
      return null;
    }

    const originalTransform = wrapper.style.transform;
    wrapper.style.transform = "none";

    const canvas = await html2canvas(screenEl, {
      width: 1920,
      height: 1080,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null
    });

    wrapper.style.transform = originalTransform;
    return canvas;
  }

  if (exportPngBtn) {
    exportPngBtn.addEventListener("click", async () => {
      exportPngBtn.disabled = true;
      exportPngBtn.textContent = "Gerando PNG...";
      try {
        const safeTitle = (titleInput.value || "arte_ikatec").toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30);
        const filename = `ikatec_tv_${safeTitle}_1920x1080.png`;

        if (window.ArtesKonva && window.ArtesKonva.exportPng) {
          window.ArtesKonva.exportPng(filename);
        } else {
          const canvas = await generateArtesCanvas();
          if (canvas) {
            const link = document.createElement("a");
            link.download = filename;
            link.href = canvas.toDataURL("image/png");
            link.click();
          }
        }
      } catch (err) {
        console.error("Erro ao exportar arte:", err);
        alert("Erro ao gerar imagem. Verifique o console.");
      } finally {
        exportPngBtn.disabled = false;
        exportPngBtn.textContent = "Baixar PNG (1920x1080)";
      }
    });
  }

  if (copyArtesBtn) {
    copyArtesBtn.addEventListener("click", async () => {
      copyArtesBtn.disabled = true;
      copyArtesBtn.textContent = "Copiando...";
      try {
        let success = false;
        if (window.ArtesKonva && window.ArtesKonva.copyPng) {
          success = await window.ArtesKonva.copyPng();
        } else {
          const canvas = await generateArtesCanvas();
          if (canvas) {
            success = await new Promise((resolve) => {
              canvas.toBlob(async (blob) => {
                if (blob) {
                  try {
                    await navigator.clipboard.write([
                      new ClipboardItem({ "image/png": blob })
                    ]);
                    resolve(true);
                  } catch (e) {
                    resolve(false);
                  }
                } else {
                  resolve(false);
                }
              }, "image/png");
            });
          }
        }

        if (success) {
          copyArtesBtn.textContent = "✓ Copiado!";
          setTimeout(() => {
            copyArtesBtn.textContent = "Copiar";
            copyArtesBtn.disabled = false;
          }, 2000);
        } else {
          throw new Error("Falha na cópia");
        }
      } catch (err) {
        console.error("Erro ao copiar arte:", err);
        alert("Não foi possível copiar automaticamente para a área de transferência neste navegador.");
        copyArtesBtn.disabled = false;
        copyArtesBtn.textContent = "Copiar";
      }
    });
  }

  // Initialize with official Split sample
  switchLayout("split");
  setTimeout(resizeArtesCanvas, 150);
});
