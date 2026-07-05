/* =========================================================================
   Líderes Aumentados — Lógica de la app
   No hace falta tocar este archivo para el uso normal de la plataforma.
   ========================================================================= */

(function () {
  "use strict";

  const SESSION_KEY = "lideres_session";

  const gateScreen = document.getElementById("gate-screen");
  const gateForm = document.getElementById("gate-form");
  const gateError = document.getElementById("gate-error");
  const gateSubmit = document.getElementById("gate-submit");
  const app = document.getElementById("app");
  const mainContent = document.getElementById("main-content");
  const mainNav = document.getElementById("main-nav");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const menuToggle = document.getElementById("menu-toggle");

  let currentView = "inicio";
  let session = null; // { email, nombre, rol, token }
  let pendingReply = null; // { moduleId, text } — respuesta pre-cargada al ir a un módulo
  let heroCarouselTimer = null; // interval del carrusel de logos de la portada
  let moduleLocks = []; // IDs de módulos bloqueados (cargados desde el servidor)

  /* ------------------------- Íconos (línea, monocromáticos) ------------------------- */
  // Set de íconos SVG estilo "feather" (heredan el color del texto con currentColor).
  // Se declara arriba de todo porque initSession() lo usa apenas carga la página.
  const ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    play: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'
  };
  function icon(name, cls) {
    return '<svg class="ico' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + '</svg>';
  }

  // Fondo decorativo "red neuronal" de la portada (Inicio), 100% CSS/SVG — sin
  // depender de ninguna foto. Malla de nodos + un par de "hubs" con resplandor +
  // pulsos de luz viajando por las conexiones (simulan señales/actividad de IA).
  function heroDecorSvg() {
    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Pulsos: cada uno viaja de un nodo a otro por una de las líneas de la malla.
    const pulses = [
      { x1: 60, y1: 60, x2: 180, y2: 130, dur: "3.2s", begin: "0s" },
      { x1: 320, y1: 90, x2: 420, y2: 180, dur: "2.8s", begin: "0.9s" },
      { x1: 560, y1: 120, x2: 660, y2: 200, dur: "3.6s", begin: "1.8s" },
      { x1: 700, y1: 60, x2: 820, y2: 110, dur: "3s", begin: "2.6s" },
      { x1: 180, y1: 130, x2: 320, y2: 260, dur: "3.4s", begin: "1.3s" }
    ];
    // Animados con CSS (no SMIL): más consistente entre navegadores y respeta
    // "prefers-reduced-motion" igual que el resto del sitio.
    const pulsesSvg = reducedMotion ? "" : pulses.map(function (p) {
      const style = "--x1:" + p.x1 + "px;--y1:" + p.y1 + "px;--x2:" + p.x2 + "px;--y2:" + p.y2 + "px;" +
        "animation-duration:" + p.dur + ";animation-delay:" + p.begin + ";";
      return '<circle class="hero-pulse" r="3.2" style="' + style + '"/>';
    }).join("");

    return '<svg class="hero-decor-svg" viewBox="0 0 900 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs>' +
        '<filter id="heroGlow" x="-60%" y="-60%" width="220%" height="220%">' +
          '<feGaussianBlur stdDeviation="5" result="blur"/>' +
          '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
        '</filter>' +
      '</defs>' +
      // Malla de conexiones (más densa y orgánica que una simple grilla).
      '<g stroke="#ffffff" stroke-opacity="0.14" stroke-width="1.3">' +
        '<line x1="60" y1="60" x2="180" y2="130"/><line x1="180" y1="130" x2="120" y2="230"/>' +
        '<line x1="180" y1="130" x2="320" y2="90"/><line x1="320" y1="90" x2="420" y2="180"/>' +
        '<line x1="420" y1="180" x2="320" y2="260"/><line x1="120" y1="230" x2="320" y2="260"/>' +
        '<line x1="420" y1="180" x2="560" y2="120"/><line x1="560" y1="120" x2="660" y2="200"/>' +
        '<line x1="660" y1="200" x2="620" y2="290"/><line x1="560" y1="120" x2="700" y2="60"/>' +
        '<line x1="700" y1="60" x2="820" y2="110"/><line x1="820" y1="110" x2="780" y2="220"/>' +
        '<line x1="660" y1="200" x2="780" y2="220"/><line x1="320" y1="90" x2="260" y2="20"/>' +
        '<line x1="60" y1="60" x2="20" y2="160"/><line x1="20" y1="160" x2="120" y2="230"/>' +
        '<line x1="260" y1="20" x2="420" y2="10"/><line x1="420" y1="10" x2="560" y2="120"/>' +
        '<line x1="820" y1="110" x2="880" y2="40"/><line x1="620" y1="290" x2="500" y2="310"/>' +
        '<line x1="320" y1="260" x2="500" y2="310"/><line x1="780" y1="220" x2="860" y2="290"/>' +
      '</g>' +
      // Nodos "hub" (más grandes, con resplandor).
      '<g fill="#fdc904" filter="url(#heroGlow)">' +
        '<circle cx="180" cy="130" r="4.5" fill-opacity="0.9"/>' +
        '<circle cx="420" cy="180" r="5.5" fill-opacity="0.9"/>' +
        '<circle cx="660" cy="200" r="4.5" fill-opacity="0.9"/>' +
      '</g>' +
      '<g fill="#8fc1f2" filter="url(#heroGlow)">' +
        '<circle cx="560" cy="120" r="3.6" fill-opacity="0.75"/>' +
      '</g>' +
      // Nodos regulares (puntos chicos de la malla).
      '<g fill="#ffffff" fill-opacity="0.55">' +
        '<circle cx="60" cy="60" r="3"/><circle cx="120" cy="230" r="3"/><circle cx="320" cy="90" r="3"/>' +
        '<circle cx="320" cy="260" r="3"/><circle cx="620" cy="290" r="3"/>' +
        '<circle cx="700" cy="60" r="3"/><circle cx="820" cy="110" r="3"/><circle cx="780" cy="220" r="3"/>' +
        '<circle cx="260" cy="20" r="3"/><circle cx="20" cy="160" r="2.4"/><circle cx="420" cy="10" r="2.4"/>' +
        '<circle cx="880" cy="40" r="2.4"/><circle cx="500" cy="310" r="2.4"/><circle cx="860" cy="290" r="2.4"/>' +
      '</g>' +
      pulsesSvg +
    '</svg>';
  }

  /* ------------------------- Backend (Apps Script) ------------------------- */
  function apiConfigured() {
    const u = SITE_CONFIG.sheetApiUrl;
    return u && u.indexOf("PEGAR_URL_ACA") === -1;
  }

  // POST sin headers custom a propósito: así el navegador lo trata como
  // "simple request" y evita el preflight CORS que Apps Script no responde.
  function apiPost(payload) {
    return fetch(SITE_CONFIG.sheetApiUrl, {
      method: "POST",
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); });
  }

  function apiGet(params) {
    return fetch(SITE_CONFIG.sheetApiUrl + "?" + params).then(function (r) { return r.json(); });
  }

  function loadSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }
  function saveSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }

  /* ------------------------- Acceso ------------------------- */
  gateForm.addEventListener("submit", function (e) {
    e.preventDefault();
    gateError.textContent = "";

    if (!apiConfigured()) {
      gateError.textContent = "La plataforma todavía no fue configurada por los organizadores.";
      return;
    }

    const email = document.getElementById("gate-email").value.trim();
    const clave = document.getElementById("gate-clave").value;
    if (!email || !clave) return;

    gateSubmit.disabled = true;
    gateSubmit.textContent = "Ingresando…";

    apiPost({ action: "login", email: email, clave: clave })
      .then(function (res) {
        gateSubmit.disabled = false;
        gateSubmit.textContent = "Ingresar";
        if (res && res.ok) {
          session = { email: res.email, nombre: res.nombre, rol: res.rol, token: res.token };
          saveSession(session);
          showApp();
        } else {
          gateError.textContent = (res && res.error) || "No se pudo ingresar. Probá de nuevo.";
        }
      })
      .catch(function () {
        gateSubmit.disabled = false;
        gateSubmit.textContent = "Ingresar";
        gateError.textContent = "No se pudo conectar. Revisá tu internet y probá de nuevo.";
      });
  });

  function showApp() {
    gateScreen.style.display = "none";
    app.classList.add("unlocked");
    renderNav();
    loadModuleLocks(function() { navigateTo("inicio"); });
  }

  function loadModuleLocks(cb) {
    if (!apiConfigured()) { if (cb) cb(); return; }
    apiPost({ action: "getModuleLocks" })
      .then(function(res) { if (res && res.ok) moduleLocks = res.locked || []; if (cb) cb(); })
      .catch(function() { if (cb) cb(); });
  }

  function isModuleLocked(id) {
    return moduleLocks.indexOf(id) !== -1;
  }

  function logout() {
    clearSession();
    session = null;
    window.location.reload();
  }

  // Al cargar: si hay sesión guardada, entramos de una y revalidamos en segundo
  // plano (por si al usuario lo deshabilitaron o borraron después de su último ingreso).
  (function initSession() {
    if (!apiConfigured()) {
      gateSubmit.disabled = true;
      gateError.textContent = "La plataforma todavía no fue configurada por los organizadores.";
      return;
    }
    session = loadSession();
    if (session && session.token) {
      showApp();
      apiPost({ action: "validate", email: session.email, token: session.token })
        .then(function (res) {
          if (!res || !res.ok) { logout(); return; }
          // refrescamos datos por si cambiaron (nombre/rol)
          session.nombre = res.nombre;
          session.rol = res.rol;
          saveSession(session);
          renderNav();
        })
        .catch(function () { /* si el backend no responde, lo dejamos entrar igual */ });
    }
  })();

  /* ------------------------- Menú mobile ------------------------- */
  menuToggle.addEventListener("click", function () {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("show");
  });
  sidebarOverlay.addEventListener("click", closeMobileMenu);
  function closeMobileMenu() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
  }

  /* ------------------------- Navegación ------------------------- */
  function renderNav() {
    // Sección de administración (solo para admins)
    const existingAdmin = document.getElementById("nav-admin-section");
    if (existingAdmin) existingAdmin.remove();
    if (session && session.rol === "admin") {
      const wrap = document.createElement("div");
      wrap.id = "nav-admin-section";
      wrap.innerHTML =
        '<div class="nav-section-label">Administración</div>' +
        '<button class="nav-item" data-view="consultas">' + icon("inbox") + 'Consultas<span class="nav-badge" id="consultas-badge" hidden></span></button>' +
        '<button class="nav-item" data-view="admin">' + icon("users") + 'Gestión de alumnos</button>';
      mainNav.appendChild(wrap);
      refreshConsultasBadge();
    }

    // Footer de usuario con logout
    renderUserFooter();

    // (Re)vinculamos todos los items de navegación
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.onclick = function () {
        navigateTo(btn.dataset.view);
        closeMobileMenu();
      };
    });
    setActiveNav(currentView);
  }

  function renderUserFooter() {
    let footer = document.getElementById("sidebar-user");
    if (!footer) {
      footer = document.createElement("div");
      footer.id = "sidebar-user";
      footer.className = "sidebar-user";
      sidebar.appendChild(footer);
    }
    footer.innerHTML =
      '<div class="su-name">' + escapeHtml(displayName()) + '</div>' +
      '<div class="su-mail">' + escapeHtml(session ? session.email : "") + '</div>' +
      '<button class="su-logout" id="btn-logout">' + icon("logout") + 'Cerrar sesión</button>';
    document.getElementById("btn-logout").onclick = logout;
  }

  function setActiveNav(view) {
    // Al ver el detalle de un módulo, resaltamos "Módulos".
    const activeView = view.indexOf("modulo-") === 0 ? "modulos" : view;
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.view === activeView);
    });
  }

  function navigateTo(view) {
    currentView = view;
    setActiveNav(view);
    window.scrollTo(0, 0);

    // El carrusel de la portada solo corre en Inicio; si nos vamos, lo apagamos.
    if (view !== "inicio" && heroCarouselTimer) { clearInterval(heroCarouselTimer); heroCarouselTimer = null; }

    if (view === "inicio") return renderInicio();
    if (view === "cronograma") return renderCronograma();
    if (view === "modulos") return renderModulos();
    if (view === "novedades") return renderNovedades();
    if (view === "admin") {
      if (session && session.rol === "admin") return renderAdmin();
      return renderInicio();
    }
    if (view === "consultas") {
      if (session && session.rol === "admin") return renderConsultas();
      return renderInicio();
    }
    if (view.indexOf("modulo-") === 0) {
      const id = parseInt(view.replace("modulo-", ""), 10);
      const mod = MODULES.find(function (m) { return m.id === id; });
      if (mod) return renderModulo(mod);
    }
    renderInicio();
  }

  /* ------------------------- Vista: Inicio ------------------------- */
  function renderInicio() {
    let statsHtml = SITE_CONFIG.stats.map(function (s) {
      return '<div class="stat-card">' +
        '<div class="stat-number">' + escapeHtml(s.number) + '</div>' +
        '<div class="stat-label">' + escapeHtml(s.label) + '</div>' +
        '<div class="stat-detail">' + escapeHtml(s.detail) + '</div>' +
        '</div>';
    }).join("");

    const saludo = session
      ? '<p style="color:var(--blue); font-weight:600; margin-bottom:4px;">Hola, ' + escapeHtml(displayName().split(" ")[0]) + '</p>'
      : "";

    const teamHtml = (SITE_CONFIG.team || []).map(function (f) {
      const initials = String(f.name || "").split(" ").map(function (w) { return w.charAt(0); }).slice(0, 2).join("").toUpperCase();
      const photo = f.photo
        ? '<img class="team-photo" src="' + escapeAttr(f.photo) + '" alt="' + escapeAttr(f.name) + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">'
        : '';
      const fallback = '<div class="team-initials"' + (f.photo ? ' style="display:none"' : '') + '>' + escapeHtml(initials) + '</div>';
      return '<div class="team-card">' +
        '<div class="team-name">' + escapeHtml(f.name) + '</div>' +
        photo + fallback +
        (f.role ? '<div class="team-role">' + escapeHtml(f.role) + '</div>' : '') +
        '<p class="team-desc">' + escapeHtml(f.desc || "") + '</p>' +
        '</div>';
    }).join("");

    // Franja blanca con los logos: siempre se ven 3 a la vez, deslizando de a uno.
    // Se arma una lista "extendida" (los logos + los primeros 3 repetidos al final)
    // para poder deslizar sin cortes y, al llegar a la vuelta completa, reiniciar
    // sin que se note (esos primeros repetidos son visualmente idénticos a los reales).
    const heroLogos = SITE_CONFIG.heroLogos || [];
    const HERO_LOGOS_VISIBLE = 3;
    const extendedLogos = heroLogos.length > HERO_LOGOS_VISIBLE
      ? heroLogos.concat(heroLogos.slice(0, HERO_LOGOS_VISIBLE))
      : heroLogos;
    const logoItemsHtml = extendedLogos.map(function (o) {
      const img = o.logo
        ? '<img class="hero-logo-img" src="' + escapeAttr(o.logo) + '" alt="' + escapeAttr(o.name) + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-flex\';">'
        : '';
      const fallback = '<span class="hero-logo-text"' + (o.logo ? ' style="display:none"' : '') + '>' + escapeHtml(o.name) + '</span>';
      return '<div class="hero-logo-item">' + img + fallback + '</div>';
    }).join("");

    mainContent.innerHTML =
      '<div class="hero-banner">' +
        heroDecorSvg() +
        '<div class="hero-content">' +
          '<h1 class="hero-title">' + escapeHtml(SITE_CONFIG.programTitle) + '</h1>' +
          '<p class="hero-subtitle">' + escapeHtml(SITE_CONFIG.programSubtitle) + '</p>' +
          '<p class="hero-tagline">' + escapeHtml(SITE_CONFIG.programTagline) + '</p>' +
        '</div>' +
        (heroLogos.length ? (
          '<div class="hero-logos-panel">' +
            '<div class="hero-logos-track" id="hero-logos-track" style="--hero-visible:' + HERO_LOGOS_VISIBLE + '">' + logoItemsHtml + '</div>' +
          '</div>'
        ) : "") +
      '</div>' +
      saludo +
      '<p class="welcome-text">' + escapeHtml(SITE_CONFIG.welcome || SITE_CONFIG.programTagline) + '</p>' +
      // Archivos descargables (presentación, brochure, etc.)
      ((SITE_CONFIG.recursos && SITE_CONFIG.recursos.length) ?
        '<div class="recursos-wrap">' +
          SITE_CONFIG.recursos.map(function (r) {
            return '<a class="recurso-card" href="' + escapeAttr(r.url) + '" target="_blank" rel="noopener">' +
              '<span class="recurso-ico">' + icon(r.icono || "file-text") + '</span>' +
              '<span class="recurso-info">' +
                '<span class="recurso-nombre">' + escapeHtml(r.nombre) + '</span>' +
                (r.desc ? '<span class="recurso-desc">' + escapeHtml(r.desc) + '</span>' : '') +
              '</span>' +
              '<span class="recurso-action">Abrir →</span>' +
            '</a>';
          }).join("") +
        '</div>'
      : '') +
      // Recuadro de últimas novedades (se completa async — nace sin clase para evitar flash)
      '<div id="home-novedades"></div>' +
      '<div class="stats-grid">' + statsHtml + '</div>' +
      // Equipo capacitador (título del mismo tamaño que el subtítulo de arriba)
      '<div class="team-section">' +
        '<h3 class="section-title-lg" style="margin-bottom:16px;">Equipo capacitador</h3>' +
        '<div class="team-grid">' + teamHtml + '</div>' +
      '</div>';

    bindCardNav();
    loadHomeNovedades();
    initHeroLogos(heroLogos.length, HERO_LOGOS_VISIBLE);
  }

  // Franja de logos de la portada: siempre muestra 3, deslizando de a uno hacia
  // la izquierda. Al completar la vuelta entera, se reinicia sin corte visible
  // (gracias a los duplicados agregados al final de la lista).
  function initHeroLogos(total, visible) {
    if (heroCarouselTimer) { clearInterval(heroCarouselTimer); heroCarouselTimer = null; }
    if (!total || total <= visible) return;

    const track = document.getElementById("hero-logos-track");
    if (!track) return;

    const stepPercent = 100 / visible;
    let step = 0;

    // "animate" usa la transición lenta definida en el CSS (.hero-logos-track);
    // acá solo la desactivamos para el reinicio instantáneo (sin corte visible).
    function goTo(n, animate) {
      track.style.transition = animate ? "" : "none";
      track.style.transform = "translateX(-" + (n * stepPercent) + "%)";
    }

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return; // se queda mostrando los primeros 3, sin animar

    heroCarouselTimer = setInterval(function () {
      step++;
      goTo(step, true);
      if (step === total) {
        // Llegamos a la vuelta completa (posición idéntica a la inicial): reiniciamos sin transición.
        // El timeout espera un poco más que la transición del CSS (1.2s) para que termine de deslizar.
        setTimeout(function () { goTo(0, false); step = 0; }, 1300);
      }
    }, 4200);
  }

  // Recuadro "Últimas novedades" en el Inicio (muestra las 3 más recientes).
  function loadHomeNovedades() {
    const box = document.getElementById("home-novedades");
    if (!box || !apiConfigured()) { if (box) box.remove(); return; }
    apiPost({ action: "getNovedades" })
      .then(function (res) {
        const items = (res && res.items) ? sortByFechaDesc(res.items).slice(0, 3) : [];
        if (!items.length) { box.remove(); return; }
        box.className = "home-news";
        box.innerHTML =
          '<div class="home-news-head">' + icon("bell") + 'Últimas novedades</div>' +
          '<ul>' + items.map(function (n) {
            return '<li>' + escapeHtml(novedadResumen(n)) + '</li>';
          }).join("") + '</ul>' +
          '<button class="link-btn" data-view="novedades">Ver todas las novedades →</button>';
        box.querySelector(".link-btn").onclick = function () { navigateTo("novedades"); };
      })
      .catch(function () { box.remove(); });
  }

  function novedadResumen(n) {
    const t = String(n.titulo || "").trim();
    const x = String(n.texto || "").trim();
    return t ? (t + (x ? " — " + x : "")) : x;
  }

  /* ------------------------- Vista: Módulos ------------------------- */
  function renderModulos() {
    let modulesHtml = MODULES.map(function (m) {
      const esAdmin = session && session.rol === "admin";
      const locked = isModuleLocked(m.id) && !esAdmin;
      const imgHtml = m.image
        ? '<div class="module-card-img" style="background-image:url(' + escapeAttr(m.image) + ')"><span class="module-num">' + m.id + '</span>' + (locked ? '<span class="module-lock-badge">' + icon("lock", "ico-sm") + '</span>' : '') + '</div>'
        : '<div class="module-card-img module-card-img--empty"><span class="module-num">' + m.id + '</span>' + (locked ? '<span class="module-lock-badge">' + icon("lock", "ico-sm") + '</span>' : '') + '</div>';
      return '<button class="module-card' + (locked ? ' module-card--locked' : '') + '"' + (locked ? '' : ' data-view="modulo-' + m.id + '"') + '>' +
        imgHtml +
        '<div class="module-card-body">' +
          '<h3>' + escapeHtml(m.title) + '</h3>' +
          '<p>' + escapeHtml(m.description) + '</p>' +
        '</div>' +
        '</button>';
    }).join("");

    mainContent.innerHTML =
      '<h2>Módulos del programa</h2>' +
      '<p style="color:var(--text-muted); max-width:700px; margin-bottom:24px;">Entrá a cada módulo para ver el video, la documentación y dejar tus consultas.</p>' +
      '<div class="module-preview-grid">' + modulesHtml + '</div>';

    bindCardNav();
  }

  function bindCardNav() {
    document.querySelectorAll("[data-view]").forEach(function (el) {
      if (el.classList.contains("nav-item")) return; // los del nav ya están vinculados
      el.addEventListener("click", function () { navigateTo(el.dataset.view); });
    });
  }

  /* ------------------------- Vista: Módulo ------------------------- */
  function renderModulo(mod) {
    let videoHtml;
    if (mod.videoId) {
      videoHtml = '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(mod.videoId) +
        '" title="Video del módulo ' + mod.id + '" allowfullscreen loading="lazy"></iframe>';
    } else {
      videoHtml = '<div class="video-placeholder">' + icon("play", "ico-lg") + '<div>El video de este módulo todavía no fue cargado.<br>Los organizadores lo suben antes del encuentro.</div></div>';
    }

    let docsHtml;
    if (mod.docs && mod.docs.length) {
      docsHtml = '<ul class="docs-list">' + mod.docs.map(function (d) {
        return '<li><a href="' + escapeAttr(d.url) + '" target="_blank" rel="noopener">' + icon("file") + escapeHtml(d.title) + '</a></li>';
      }).join("") + '</ul>';
    } else {
      docsHtml = '<div class="empty-note">Todavía no hay documentos cargados para este módulo.</div>';
    }

    mainContent.innerHTML =
      '<button class="breadcrumb-back" data-view="inicio">← Volver al inicio</button>' +
      '<div class="module-header">' +
        '<div class="eyebrow">Módulo ' + mod.id + ' de ' + MODULES.length + '</div>' +
        '<h2>' + escapeHtml(mod.title) + '</h2>' +
        '<p class="desc">' + escapeHtml(mod.description) + '</p>' +
      '</div>' +
      '<div class="video-wrap">' + videoHtml + '</div>' +
      '<div class="section-block"><h4>Documentación del módulo</h4>' + docsHtml + '</div>' +
      '<div class="section-block">' +
        '<h4>Comentarios y preguntas</h4>' +
        '<div id="comment-status" class="comment-status">Cargando comentarios…</div>' +
        '<form class="comment-form" id="comment-form">' +
          '<p style="font-size:0.82rem; color:var(--text-muted); margin:0;">Comentás como <strong>' + escapeHtml(displayName()) + '</strong></p>' +
          '<textarea id="comment-message" placeholder="Escribí tu comentario o pregunta sobre este módulo…" required></textarea>' +
          '<button type="submit" class="btn-primary" style="width:auto;">Publicar comentario</button>' +
        '</form>' +
        '<ul class="comments-list" id="comments-list"></ul>' +
      '</div>';

    bindCardNav();
    initComments(mod.id);
  }

  /* ------------------------- Comentarios (Google Sheets vía Apps Script) ------------------------- */
  function initComments(moduleId) {
    const statusEl = document.getElementById("comment-status");
    const listEl = document.getElementById("comments-list");
    const form = document.getElementById("comment-form");

    if (!apiConfigured()) {
      statusEl.textContent = "El foro de comentarios todavía no está configurado por los organizadores.";
      form.querySelector("button").disabled = true;
      return;
    }

    function loadComments() {
      statusEl.textContent = "Cargando comentarios…";
      apiGet("moduleId=" + moduleId)
        .then(function (comments) {
          statusEl.textContent = comments.length
            ? comments.length + " comentario(s)"
            : "Sé el primero en comentar en este módulo.";
          listEl.innerHTML = comments.map(renderComment).reverse().join("");
          bindCommentDelete();
        })
        .catch(function () {
          statusEl.textContent = "No se pudieron cargar los comentarios en este momento.";
        });
    }

    // Borrado de comentarios (solo admin).
    function bindCommentDelete() {
      listEl.querySelectorAll(".comment-del").forEach(function (btn) {
        btn.onclick = function () {
          if (!window.confirm("¿Borrar este comentario? No se puede deshacer.")) return;
          btn.disabled = true;
          apiPost({
            action: "deleteComment", adminEmail: session.email, token: session.token,
            row: btn.dataset.row, moduleId: btn.dataset.module, timestamp: btn.dataset.ts
          })
            .then(function (res) {
              if (!res || !res.ok) { statusEl.textContent = (res && res.error) || "No se pudo borrar."; btn.disabled = false; return; }
              loadComments();
              if (session.rol === "admin") refreshConsultasBadge();
            })
            .catch(function () { statusEl.textContent = "No se pudo conectar con el servidor."; btn.disabled = false; });
        };
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const message = document.getElementById("comment-message").value.trim();
      if (!message) return;

      const btn = form.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Publicando…";

      apiPost({ action: "addComment", moduleId: moduleId, message: message, email: session.email, token: session.token })
        .then(function (res) {
          btn.disabled = false;
          btn.textContent = "Publicar comentario";
          if (res && res.ok === false) { statusEl.textContent = res.error || "No se pudo publicar."; return; }
          document.getElementById("comment-message").value = "";
          loadComments();
          if (session.rol === "admin") refreshConsultasBadge();
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = "Publicar comentario";
          statusEl.textContent = "No se pudo publicar el comentario. Probá de nuevo.";
        });
    });

    // Si venís desde la bandeja "Responder", dejamos la respuesta pre-cargada.
    if (pendingReply && String(pendingReply.moduleId) === String(moduleId)) {
      const ta = document.getElementById("comment-message");
      ta.value = pendingReply.text;
      ta.focus();
      pendingReply = null;
    }

    loadComments();
  }

  // Render de un comentario (con distintivo "Organizador" y borrado para admins).
  function renderComment(c) {
    const date = c.timestamp ? new Date(c.timestamp) : null;
    const timeStr = date && !isNaN(date) ? date.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
    const esOrg = String(c.tipo || "").toLowerCase() === "organizador";
    const badge = esOrg ? ' <span class="badge role admin">Organizador</span>' : '';
    const delBtn = (session && session.rol === "admin")
      ? '<button class="comment-del" title="Borrar comentario" data-row="' + escapeAttr(c.row) + '" data-module="' + escapeAttr(c.moduleId) + '" data-ts="' + escapeAttr(c.timestamp) + '">' + icon("trash", "ico-sm") + '</button>'
      : '';
    return '<li class="comment-item' + (esOrg ? ' is-org' : '') + '">' +
      '<div class="comment-meta"><span class="comment-name">' + escapeHtml(c.name || "Anónimo") + badge + '</span>' +
      '<span class="comment-time">' + escapeHtml(timeStr) + delBtn + '</span></div>' +
      '<div class="comment-msg">' + escapeHtml(c.message || "") + '</div>' +
      '</li>';
  }

  /* ------------------------- Vista: Administración ------------------------- */
  function renderAdmin() {
    mainContent.innerHTML =
      '<h2>Gestión de alumnos</h2>' +
      '<p style="color:var(--text-muted); max-width:720px; margin-bottom:24px;">Agregá personas al programa y controlá quién tiene acceso. Cada alumno entra con su correo y la clave que le asignás acá.</p>' +
      '<form class="admin-toolbar" id="add-user-form">' +
        '<div class="admin-field grow"><label>Correo</label><input type="email" id="au-email" placeholder="maria@correo.com" required></div>' +
        '<div class="admin-field grow"><label>Clave</label><input type="text" id="au-clave" placeholder="clave" required></div>' +
        '<div class="admin-field"><label>&nbsp;</label><button type="button" class="btn-ghost" id="au-gen">Generar clave</button></div>' +
        '<div class="admin-field"><label>Rol</label><select id="au-rol"><option value="alumno">Alumno</option><option value="admin">Admin</option></select></div>' +
        '<div class="admin-field"><label>&nbsp;</label><button type="submit" class="btn-primary" style="width:auto;">Agregar</button></div>' +
      '</form>' +
      '<div class="admin-msg" id="admin-msg"></div>' +
      '<div class="users-table-wrap"><div id="users-table"><p style="color:var(--text-muted);">Cargando alumnos…</p></div></div>' +
      '<h3 class="section-title-lg" style="margin-top:40px; margin-bottom:8px;">Acceso a módulos</h3>' +
      '<p style="color:var(--text-muted); max-width:720px; margin-bottom:20px;">Controlá qué módulos pueden ver los alumnos. Los módulos bloqueados se muestran con candado y no se pueden abrir.</p>' +
      '<div class="module-locks-grid" id="module-locks-grid">' +
        MODULES.map(function(m) {
          const locked = isModuleLocked(m.id);
          return '<div class="module-lock-row" id="mlr-' + m.id + '">' +
            '<span class="module-lock-num">' + m.id + '</span>' +
            '<span class="module-lock-title">' + escapeHtml(m.title) + '</span>' +
            '<button class="module-lock-btn ' + (locked ? 'locked' : 'unlocked') + '" data-mod="' + m.id + '" data-locked="' + (locked ? '1' : '0') + '">' +
              (locked ? icon('lock', 'ico-sm') + ' Bloqueado' : icon('unlock', 'ico-sm') + ' Habilitado') +
            '</button>' +
          '</div>';
        }).join('') +
      '</div>';

    document.getElementById("au-gen").onclick = function () {
      document.getElementById("au-clave").value = genClave();
    };
    document.getElementById("add-user-form").addEventListener("submit", onAddUser);

    loadUsers();

    document.getElementById("module-locks-grid").addEventListener("click", function(e) {
      const btn = e.target.closest(".module-lock-btn");
      if (!btn) return;
      const moduleId = parseInt(btn.dataset.mod, 10);
      const nowLocked = btn.dataset.locked === "1";
      const newLocked = !nowLocked;
      btn.disabled = true;
      apiPost({ action: "setModuleLock", adminEmail: session.email, token: session.token, moduleId: moduleId, locked: newLocked })
        .then(function(res) {
          if (res && res.ok) {
            moduleLocks = res.locked || [];
            const locked = isModuleLocked(moduleId);
            btn.className = "module-lock-btn " + (locked ? "locked" : "unlocked");
            btn.dataset.locked = locked ? "1" : "0";
            btn.innerHTML = locked ? icon("lock", "ico-sm") + " Bloqueado" : icon("unlock", "ico-sm") + " Habilitado";
          }
        })
        .catch(function() { btn.disabled = false; })
        .then(function() { btn.disabled = false; });
    });
  }

  function adminMsg(text, kind) {
    const el = document.getElementById("admin-msg");
    if (!el) return;
    el.textContent = text || "";
    el.className = "admin-msg" + (kind ? " " + kind : "");
  }

  function loadUsers() {
    apiPost({ action: "listUsers", adminEmail: session.email, token: session.token })
      .then(function (res) {
        if (!res || !res.ok) { adminMsg((res && res.error) || "No se pudo cargar la lista.", "err"); return; }
        renderUsersTable(res.users || []);
      })
      .catch(function () { adminMsg("No se pudo conectar con el servidor.", "err"); });
  }

  function renderUsersTable(users) {
    const cont = document.getElementById("users-table");
    if (!users.length) {
      cont.innerHTML = '<p style="color:var(--text-muted);">Todavía no hay alumnos cargados. Agregá el primero con el formulario de arriba.</p>';
      return;
    }
    const rows = users.map(function (u) {
      const habBadge = u.habilitado
        ? '<span class="badge on">Habilitado</span>'
        : '<span class="badge off">Deshabilitado</span>';
      const rolBadge = u.rol === "admin"
        ? '<span class="badge role admin">Admin</span>'
        : '<span class="badge role">Alumno</span>';
      const esYo = u.email === session.email;
      return '<tr>' +
        '<td>' + escapeHtml(u.email) + (esYo ? ' <span style="color:var(--text-muted); font-size:0.75rem;">(vos)</span>' : '') + '</td>' +
        '<td class="clave-cell">' + escapeHtml(u.clave) + '</td>' +
        '<td>' + rolBadge + '</td>' +
        '<td>' + habBadge + '</td>' +
        '<td><div class="row-actions">' +
          '<button class="act-toggle" data-act="toggle" data-email="' + escapeAttr(u.email) + '" data-hab="' + (u.habilitado ? "1" : "0") + '">' + (u.habilitado ? "Deshabilitar" : "Habilitar") + '</button>' +
          '<button class="act-toggle" data-act="clave" data-email="' + escapeAttr(u.email) + '">Nueva clave</button>' +
          (esYo ? '' : '<button class="act-del" data-act="del" data-email="' + escapeAttr(u.email) + '">Eliminar</button>') +
        '</div></td>' +
      '</tr>';
    }).join("");

    cont.innerHTML =
      '<table class="users-table"><thead><tr>' +
        '<th>Correo</th><th>Clave</th><th>Rol</th><th>Estado</th><th>Acciones</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';

    cont.querySelectorAll("button[data-act]").forEach(function (btn) {
      btn.onclick = function () { onRowAction(btn); };
    });
  }

  function onAddUser(e) {
    e.preventDefault();
    const email = document.getElementById("au-email").value.trim();
    const clave = document.getElementById("au-clave").value.trim();
    const rol = document.getElementById("au-rol").value;
    if (!email || !clave) return;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "Agregando…";
    adminMsg("");

    apiPost({ action: "addUser", adminEmail: session.email, token: session.token, email: email, clave: clave, rol: rol })
      .then(function (res) {
        btn.disabled = false; btn.textContent = "Agregar";
        if (!res || !res.ok) { adminMsg((res && res.error) || "No se pudo agregar.", "err"); return; }
        adminMsg("✓ " + email + " fue agregado/a. Clave: " + clave, "ok");
        e.target.reset();
        loadUsers();
      })
      .catch(function () { btn.disabled = false; btn.textContent = "Agregar"; adminMsg("No se pudo conectar con el servidor.", "err"); });
  }

  function onRowAction(btn) {
    const act = btn.dataset.act;
    const email = btn.dataset.email;

    if (act === "toggle") {
      const nuevoEstado = btn.dataset.hab !== "1"; // si estaba habilitado -> deshabilitar
      sendUpdate({ email: email, habilitado: nuevoEstado }, btn);
    } else if (act === "clave") {
      const nueva = window.prompt("Nueva clave para " + email + ":", genClave());
      if (nueva && nueva.trim()) sendUpdate({ email: email, clave: nueva.trim() }, btn);
    } else if (act === "del") {
      if (window.confirm("¿Eliminar a " + email + "? Perderá el acceso a la plataforma.")) {
        btn.disabled = true;
        apiPost({ action: "deleteUser", adminEmail: session.email, token: session.token, email: email })
          .then(function (res) {
            if (!res || !res.ok) { adminMsg((res && res.error) || "No se pudo eliminar.", "err"); btn.disabled = false; return; }
            adminMsg("Usuario eliminado.", "ok");
            loadUsers();
          })
          .catch(function () { adminMsg("No se pudo conectar con el servidor.", "err"); btn.disabled = false; });
      }
    }
  }

  function sendUpdate(fields, btn) {
    if (btn) btn.disabled = true;
    const payload = Object.assign({ action: "updateUser", adminEmail: session.email, token: session.token }, fields);
    apiPost(payload)
      .then(function (res) {
        if (!res || !res.ok) { adminMsg((res && res.error) || "No se pudo actualizar.", "err"); if (btn) btn.disabled = false; return; }
        adminMsg("Cambios guardados.", "ok");
        loadUsers();
      })
      .catch(function () { adminMsg("No se pudo conectar con el servidor.", "err"); if (btn) btn.disabled = false; });
  }

  function genClave() {
    const chars = "abcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < 8; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
  }

  /* ------------------------- Vista: Consultas (bandeja del admin) ------------------------- */
  // Devuelve las consultas de alumnos, cada una con si ya fue respondida por un
  // organizador (heurística: hay una respuesta del organizador posterior en el mismo módulo).
  function buildInbox(comments) {
    const byModule = {};
    comments.forEach(function (c) {
      const m = String(c.moduleId);
      (byModule[m] = byModule[m] || []).push(c);
    });
    const preguntas = [];
    comments.forEach(function (c) {
      if (String(c.tipo || "").toLowerCase() === "organizador") return; // solo consultas de alumnos
      const t = c.timestamp ? new Date(c.timestamp).getTime() : 0;
      const respondida = (byModule[String(c.moduleId)] || []).some(function (o) {
        return String(o.tipo || "").toLowerCase() === "organizador" &&
               (o.timestamp ? new Date(o.timestamp).getTime() : 0) >= t;
      });
      preguntas.push({ c: c, respondida: respondida, t: t });
    });
    preguntas.sort(function (a, b) { return b.t - a.t; }); // más nuevas primero
    return preguntas;
  }

  function renderConsultas() {
    mainContent.innerHTML =
      '<h2>Consultas</h2>' +
      '<p style="color:var(--text-muted); max-width:720px; margin-bottom:20px;">Todas las preguntas de los alumnos, de todos los módulos, en un solo lugar. Las <strong>pendientes</strong> están resaltadas.</p>' +
      '<div class="admin-msg" id="inbox-msg"></div>' +
      '<div id="inbox-list"><p style="color:var(--text-muted);">Cargando consultas…</p></div>';

    apiPost({ action: "allComments", adminEmail: session.email, token: session.token })
      .then(function (res) {
        if (!res || !res.ok) { document.getElementById("inbox-msg").textContent = (res && res.error) || "No se pudo cargar."; return; }
        renderInboxList(buildInbox(res.comments || []));
      })
      .catch(function () { document.getElementById("inbox-msg").textContent = "No se pudo conectar con el servidor."; });
  }

  function renderInboxList(preguntas) {
    const cont = document.getElementById("inbox-list");
    if (!preguntas.length) {
      cont.innerHTML = '<p style="color:var(--text-muted);">Todavía no hay consultas de alumnos.</p>';
      return;
    }
    const pend = preguntas.filter(function (p) { return !p.respondida; }).length;
    const resumen = pend
      ? '<p style="margin-bottom:16px; font-weight:600; color:var(--blue);">' + pend + ' consulta(s) sin responder</p>'
      : '<p style="margin-bottom:16px; color:var(--success); font-weight:600;">✓ No hay consultas pendientes</p>';

    const cards = preguntas.map(function (p, i) {
      const c = p.c;
      const modTitle = moduleTitle(c.moduleId);
      const date = c.timestamp ? new Date(c.timestamp) : null;
      const timeStr = date && !isNaN(date) ? date.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
      return '<div class="inbox-card' + (p.respondida ? ' answered' : ' pending') + '">' +
        '<div class="inbox-top">' +
          '<span class="inbox-mod">Módulo ' + escapeHtml(String(c.moduleId)) + ' · ' + escapeHtml(modTitle) + '</span>' +
          (p.respondida ? '<span class="badge on">Respondida</span>' : '<span class="badge off">Pendiente</span>') +
        '</div>' +
        '<div class="inbox-q"><strong>' + escapeHtml(c.name || "Anónimo") + '</strong> <span class="comment-time">' + escapeHtml(timeStr) + '</span></div>' +
        '<div class="inbox-msg">' + escapeHtml(c.message || "") + '</div>' +
        '<button class="btn-ghost inbox-reply" data-i="' + i + '">Responder →</button>' +
      '</div>';
    }).join("");

    cont.innerHTML = resumen + cards;

    cont.querySelectorAll(".inbox-reply").forEach(function (btn) {
      btn.onclick = function () {
        const p = preguntas[parseInt(btn.dataset.i, 10)];
        pendingReply = { moduleId: p.c.moduleId, text: "@" + (p.c.name || "") + ": " };
        navigateTo("modulo-" + p.c.moduleId);
      };
    });
  }

  function moduleTitle(id) {
    const m = MODULES.find(function (x) { return String(x.id) === String(id); });
    return m ? m.title : "";
  }

  // Actualiza el contador de consultas pendientes en el menú lateral.
  function refreshConsultasBadge() {
    if (!session || session.rol !== "admin" || !apiConfigured()) return;
    apiPost({ action: "allComments", adminEmail: session.email, token: session.token })
      .then(function (res) {
        if (!res || !res.ok) return;
        const pend = buildInbox(res.comments || []).filter(function (p) { return !p.respondida; }).length;
        const badge = document.getElementById("consultas-badge");
        if (!badge) return;
        if (pend > 0) { badge.textContent = pend; badge.hidden = false; }
        else { badge.hidden = true; }
      })
      .catch(function () {});
  }

  /* ------------------------- Vista: Novedades ------------------------- */
  function renderNovedades() {
    const esAdmin = session && session.rol === "admin";
    const adminForm = esAdmin
      ? '<form class="news-form" id="novedad-form">' +
          '<input type="text" id="nv-titulo" placeholder="Título (opcional)">' +
          '<textarea id="nv-texto" placeholder="Escribí la novedad… (ej: Se publicó el material del Módulo 2)" required></textarea>' +
          '<button type="submit" class="btn-primary" style="width:auto;">Publicar novedad</button>' +
        '</form>' +
        '<div class="admin-msg" id="nv-msg"></div>'
      : '';

    mainContent.innerHTML =
      '<h2 class="page-title">' + icon("bell", "ico-title") + 'Novedades</h2>' +
      '<p style="color:var(--text-muted); max-width:700px; margin-bottom:20px;">Anuncios y avisos del programa.</p>' +
      adminForm +
      '<div id="novedades-list"><p style="color:var(--text-muted);">Cargando novedades…</p></div>';

    if (esAdmin) {
      document.getElementById("novedad-form").addEventListener("submit", function (e) {
        e.preventDefault();
        const titulo = document.getElementById("nv-titulo").value.trim();
        const texto = document.getElementById("nv-texto").value.trim();
        if (!texto) return;
        const btn = e.target.querySelector("button");
        btn.disabled = true; btn.textContent = "Publicando…";
        apiPost({ action: "addNovedad", adminEmail: session.email, token: session.token, titulo: titulo, texto: texto })
          .then(function (res) {
            btn.disabled = false; btn.textContent = "Publicar novedad";
            const msg = document.getElementById("nv-msg");
            if (!res || !res.ok) { msg.textContent = (res && res.error) || "No se pudo publicar."; msg.className = "admin-msg err"; return; }
            msg.textContent = "✓ Novedad publicada."; msg.className = "admin-msg ok";
            e.target.reset();
            loadNovedades();
          })
          .catch(function () { btn.disabled = false; btn.textContent = "Publicar novedad"; });
      });
    }

    loadNovedades();
  }

  function loadNovedades() {
    const cont = document.getElementById("novedades-list");
    apiPost({ action: "getNovedades" })
      .then(function (res) {
        const items = (res && res.items) ? sortByFechaDesc(res.items) : [];
        if (!items.length) { cont.innerHTML = '<p style="color:var(--text-muted);">Todavía no hay novedades publicadas.</p>'; return; }
        const esAdmin = session && session.rol === "admin";
        cont.innerHTML = items.map(function (n) {
          const del = esAdmin ? '<button class="row-del" data-row="' + escapeAttr(n.row) + '" data-val="' + escapeAttr(n.texto) + '" title="Borrar">' + icon("trash", "ico-sm") + '</button>' : '';
          const titulo = String(n.titulo || "").trim();
          return '<div class="news-card">' +
            '<div class="news-top"><span class="news-date">' + escapeHtml(formatFecha(n.fecha)) + '</span>' + del + '</div>' +
            (titulo ? '<div class="news-title">' + escapeHtml(titulo) + '</div>' : '') +
            '<div class="news-text">' + escapeHtml(n.texto || "") + '</div>' +
          '</div>';
        }).join("");
        bindRowDelete(cont, "deleteNovedad", "texto", loadNovedades);
      })
      .catch(function () { cont.innerHTML = '<p style="color:var(--text-muted);">No se pudieron cargar las novedades.</p>'; });
  }

  /* ------------------------- Vista: Cronograma ------------------------- */
  function renderCronograma() {
    const esAdmin = session && session.rol === "admin";
    const adminForm = esAdmin
      ? '<form class="crono-form" id="crono-form">' +
          '<div class="admin-field"><label>Fecha</label><input type="date" id="cr-fecha" required></div>' +
          '<div class="admin-field"><label>Hora</label><input type="time" id="cr-hora"></div>' +
          '<div class="admin-field grow"><label>Título / Tema</label><input type="text" id="cr-titulo" placeholder="Ej: Módulo 3 — Toma de decisiones" required></div>' +
          '<div class="admin-field grow"><label>Detalle (opcional)</label><input type="text" id="cr-detalle" placeholder="Lugar, modalidad, notas…"></div>' +
          '<div class="admin-field"><label>&nbsp;</label><button type="submit" class="btn-primary" style="width:auto;">Agregar</button></div>' +
        '</form>' +
        '<div class="admin-msg" id="cr-msg"></div>'
      : '';

    mainContent.innerHTML =
      '<h2 class="page-title">' + icon("calendar", "ico-title") + 'Cronograma</h2>' +
      '<p style="color:var(--text-muted); max-width:700px; margin-bottom:20px;">Fechas y horarios de los encuentros del programa.</p>' +
      (esAdmin ? '<div class="admin-toolbar" style="align-items:flex-end;">' + adminForm + '</div>' : adminForm) +
      '<div id="crono-list"><p style="color:var(--text-muted);">Cargando cronograma…</p></div>';

    if (esAdmin) {
      document.getElementById("crono-form").addEventListener("submit", function (e) {
        e.preventDefault();
        const fecha = document.getElementById("cr-fecha").value;
        const hora = document.getElementById("cr-hora").value;
        const titulo = document.getElementById("cr-titulo").value.trim();
        const detalle = document.getElementById("cr-detalle").value.trim();
        if (!fecha || !titulo) return;
        const btn = e.target.querySelector("button");
        btn.disabled = true; btn.textContent = "Agregando…";
        apiPost({ action: "addCronograma", adminEmail: session.email, token: session.token, fecha: fecha, hora: hora, titulo: titulo, detalle: detalle })
          .then(function (res) {
            btn.disabled = false; btn.textContent = "Agregar";
            const msg = document.getElementById("cr-msg");
            if (!res || !res.ok) { msg.textContent = (res && res.error) || "No se pudo agregar."; msg.className = "admin-msg err"; return; }
            msg.textContent = "✓ Encuentro agregado."; msg.className = "admin-msg ok";
            e.target.reset();
            loadCronograma();
          })
          .catch(function () { btn.disabled = false; btn.textContent = "Agregar"; });
      });
    }

    loadCronograma();
  }

  function loadCronograma() {
    const cont = document.getElementById("crono-list");
    apiPost({ action: "getCronograma" })
      .then(function (res) {
        const items = (res && res.items) ? sortByFechaAsc(res.items) : [];
        if (!items.length) { cont.innerHTML = '<p style="color:var(--text-muted);">Todavía no hay fechas cargadas.</p>'; return; }
        const esAdmin = session && session.rol === "admin";
        cont.innerHTML = items.map(function (c) {
          const del = esAdmin ? '<button class="row-del" data-row="' + escapeAttr(c.row) + '" data-val="' + escapeAttr(c.titulo) + '" title="Borrar">' + icon("trash", "ico-sm") + '</button>' : '';
          const hora = formatHora(c.hora);
          const detalle = String(c.detalle || "").trim();
          return '<div class="crono-card">' +
            '<div class="crono-date"><span class="cd-day">' + escapeHtml(formatFecha(c.fecha)) + '</span>' + (hora ? '<span class="cd-time">' + escapeHtml(hora) + ' hs</span>' : '') + '</div>' +
            '<div class="crono-body"><div class="crono-title">' + escapeHtml(c.titulo || "") + '</div>' +
              (detalle ? '<div class="crono-detail">' + escapeHtml(detalle) + '</div>' : '') + '</div>' +
            del +
          '</div>';
        }).join("");
        bindRowDelete(cont, "deleteCronograma", "titulo", loadCronograma);
      })
      .catch(function () { cont.innerHTML = '<p style="color:var(--text-muted);">No se pudo cargar el cronograma.</p>'; });
  }

  // Borrado genérico de filas (novedades / cronograma) para admins.
  function bindRowDelete(cont, action, verifyField, reload) {
    cont.querySelectorAll(".row-del").forEach(function (btn) {
      btn.onclick = function () {
        if (!window.confirm("¿Borrar este elemento? No se puede deshacer.")) return;
        btn.disabled = true;
        apiPost({ action: action, adminEmail: session.email, token: session.token, row: btn.dataset.row, verifyField: verifyField, verifyValue: btn.dataset.val })
          .then(function (res) {
            if (!res || !res.ok) { window.alert((res && res.error) || "No se pudo borrar."); btn.disabled = false; return; }
            reload();
          })
          .catch(function () { btn.disabled = false; });
      };
    });
  }

  // Ordena por el campo "fecha" (acepta ISO o "YYYY-MM-DD").
  function sortByFechaAsc(items) {
    return items.slice().sort(function (a, b) { return fechaVal(a.fecha) - fechaVal(b.fecha); });
  }
  function sortByFechaDesc(items) {
    return items.slice().sort(function (a, b) { return fechaVal(b.fecha) - fechaVal(a.fecha); });
  }
  function fechaVal(f) {
    const d = f ? new Date(f) : null;
    return d && !isNaN(d) ? d.getTime() : 0;
  }
  // Parsea una fecha tomando su parte YYYY-MM-DD como fecha LOCAL (evita el
  // corrimiento de un día por zona horaria cuando viene como "2026-07-10").
  function parseFecha(f) {
    if (!f) return null;
    const m = String(f).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    const d = new Date(f);
    return isNaN(d) ? null : d;
  }
  function formatFecha(f) {
    const d = parseFecha(f);
    if (!d) return String(f || "");
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  }

  // Normaliza la hora que llega de Google Sheets, que puede venir como:
  // - "22:16" o "22:16:00"  → directo
  // - "1899-12-30T22:16:48.000Z" → número serial de Excel, extraemos HH:MM de la parte T
  // - número decimal (0.927...) → fracción de día, convertimos a HH:MM
  function formatHora(h) {
    if (!h && h !== 0) return "";
    const s = String(h).trim();
    // Formato ISO completo tipo "1899-12-30T22:16:48.000Z"
    const isoMatch = s.match(/T(\d{2}):(\d{2})/);
    if (isoMatch) return isoMatch[1] + ":" + isoMatch[2];
    // Formato "HH:MM" o "HH:MM:SS"
    const hmMatch = s.match(/^(\d{1,2}):(\d{2})/);
    if (hmMatch) return hmMatch[1].padStart(2,"0") + ":" + hmMatch[2];
    // Número decimal (fracción de día)
    const num = parseFloat(s);
    if (!isNaN(num) && num >= 0 && num < 1) {
      const totalMin = Math.round(num * 1440);
      return String(Math.floor(totalMin / 60)).padStart(2,"0") + ":" + String(totalMin % 60).padStart(2,"0");
    }
    return s;
  }

  /* ------------------------- Utilidades ------------------------- */
  // Nombre visible: usa "nombre" si existe; si no, la parte del correo antes de la @.
  function displayName() {
    if (!session) return "";
    if (session.nombre && String(session.nombre).trim()) return session.nombre;
    return String(session.email || "").split("@")[0];
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function escapeAttr(str) { return escapeHtml(str); }

})();
