/* ============================================================================
   Naowee · Incentivos — RECORRIDO GUIADO por HU (verificación Danna/Elkin)  v1.0.0
   Capa de ayuda ADITIVA: por cada Historia de Usuario muestra TAREA + PROPÓSITO
   (la HU) + spotlight de dónde hacer clic + "Paso N de M". Lanzador flotante
   abajo-derecha (sobre el pill de versión) que lista las HU por fase (Gestor /
   Operador); al elegir una, setea el rol en localStorage, navega a su pantalla
   y corre los pasos. No toca la lógica de las páginas.
   Patrón: skill naowee-guided-tour (impl de referencia suite-web-territorio).
   ========================================================================== */
(function () {
  'use strict';
  if (window.__incTour) return; window.__incTour = true;

  var ROLE_KEY = 'naowee-incentivos-role';
  function qs(k) { return new URLSearchParams(location.search).get(k); }
  function curRole() { try { return localStorage.getItem(ROLE_KEY) || 'admin'; } catch (e) { return 'admin'; } }
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase() || 'incentivo-02-dashboard.html';

  // ── Catálogo de tours por HU (ACTA-MVP.md) ──
  var TOURS = {
    /* ═══ GESTOR DE INCENTIVOS (rol admin) ═══ */
    'HU-GI-01': { ph: 'Gestor de Incentivos', page: 'incentivo-01-login.html', role: 'admin',
      title: 'Login y selección de rol', purpose: 'Acceder al SUID y elegir el rol con el que se va a operar (Gestor u Operador).',
      steps: [
        { sel: '#email', body: 'Ingresa el <b>correo institucional</b> (valida formato email).' },
        { sel: '#password', body: 'Escribe la <b>contraseña</b> (con toggle de visibilidad).' },
        { sel: '#submitBtn', body: 'Clic en <b>Iniciar sesión</b>: abre el selector de rol.', click: true },
        { sel: '#demoOverlay .demo-option[data-role="admin"], #demoOverlay', body: 'Elige <b>Gestor de incentivos</b> para administrar programas, códigos y reversiones.' }
      ] },
    'HU-GI-02': { ph: 'Gestor de Incentivos', page: 'incentivo-02-dashboard.html', role: 'admin',
      title: 'Dashboard del gestor', purpose: 'Monitorear el estado nacional: inventario, ejecución del rubro y asignaciones recientes.',
      steps: [
        { sel: '#kpiInvVal', body: 'Los <b>KPIs nacionales</b>: inventario disponible, asignados, revertidos y ejecución del rubro.' },
        { sel: '.prg-mini, .prg-mini__row', body: 'Los <b>programas activos</b> con su rubro, ejecución y progreso en tiempo real.' },
        { sel: '#btnNuevoPrograma', body: '<b>Nuevo programa</b> abre el wizard de parametrización (ver HU-GI-04).' }
      ] },
    'HU-GI-03': { ph: 'Gestor de Incentivos', page: 'incentivo-03-programas.html', role: 'admin',
      title: 'Listado de programas', purpose: 'Administrar el portafolio nacional: buscar, filtrar y abrir cada programa.',
      steps: [
        { sel: '#searchInput', body: '<b>Busca</b> un programa por nombre.' },
        { sel: '#ddStatusWrap', body: '<b>Filtra por estado</b>: borrador, activo, pausado o cerrado.' },
        { sel: '#prgBody', body: 'Cada fila muestra <b>rubro, ejecución, códigos y vigencia</b>. Clic en una → su detalle.' },
        { sel: '#btnCrearPrograma', body: '<b>Crear programa</b> abre el wizard (HU-GI-04).' }
      ] },
    'HU-GI-04': { ph: 'Gestor de Incentivos', page: 'incentivo-03-programas.html', role: 'admin',
      title: 'Wizard: parametrizar programa', purpose: 'Definir en pasos guiados el rubro, los tipos de incentivo, el tipo de beneficiario y las condiciones de elegibilidad.',
      steps: [
        { sel: '#btnCrearPrograma', body: 'Abre el <b>wizard de creación</b>.', click: true },
        { sel: '#fName', body: '<b>Paso 1 — Datos:</b> nombre, evento, vigencia y cobertura territorial.' },
        { sel: '#wzRubroTotal', body: '<b>Paso 2 — Rubro:</b> monto total del programa; abajo eliges <b>un solo tipo</b> o <b>varios tipos</b> de incentivo.' },
        { sel: '#wzBtnNext', body: 'Avanza al <b>Paso 3 — Condiciones</b>: aquí eliges el <b>tipo de beneficiario</b> y la regla (para institución: ranking de medallero).', click: true },
        { sel: '#wzCondPanels', body: 'Define las <b>condiciones de elegibilidad</b> o la regla institucional. Al final, <b>Activar programa</b>.' }
      ] },
    'HU-GI-05': { ph: 'Gestor de Incentivos', page: 'incentivo-05-programa-detalle.html', role: 'admin',
      title: 'Detalle del programa', purpose: 'Auditar la ejecución de un programa: información, códigos, asignaciones e historial.',
      steps: [
        { sel: '#wzTabs, .naowee-tabs', body: 'Pestañas: <b>Resumen, Condiciones, Códigos, Asignaciones e Historial</b>.' },
        { sel: '.naowee-tab[data-tab="codigos"]', body: 'La pestaña <b>Códigos</b> lista el inventario del programa.', click: true },
        { sel: '#btnCargarCodigos', body: '<b>Cargar códigos</b> abre el modal de carga (HU-GI-06).' }
      ] },
    'HU-GI-06': { ph: 'Gestor de Incentivos', page: 'incentivo-05-programa-detalle.html', role: 'admin',
      title: 'Cargar inventario de códigos', purpose: 'Poblar el inventario del programa de forma masiva (Excel/CSV) o manual, sin salir del detalle.',
      steps: [
        { sel: '#btnCargarCodigos', body: 'Abre el <b>modal de carga de códigos</b>.', click: true },
        { sel: '#ccSeg', body: 'Elige el modo: <b>carga masiva</b> (Excel/CSV) o <b>manual</b> (uno a uno).' },
        { sel: '#ccDropzone', body: 'Arrastra el archivo: el sistema valida columnas y muestra <b>vista previa</b> antes de confirmar.' },
        { sel: '#btnCcConfirm', body: 'Confirma con <b>Cargar códigos</b>: se suman al inventario del programa.' }
      ] },
    'HU-GI-07': { ph: 'Gestor de Incentivos', page: 'incentivo-07-codigos.html', role: 'admin',
      title: 'Inventario consolidado', purpose: 'Auditar todos los códigos del sistema y filtrar por programa, tipo, estado o beneficiario.',
      steps: [
        { sel: '#ddEstadoWrap', body: '<b>Filtra por estado</b>: sin asignación, asignado o revertido.' },
        { sel: '#ddProgWrap', body: '<b>Filtra por programa</b>.' },
        { sel: '#codSearch', body: '<b>Busca</b> por código o beneficiario.' },
        { sel: '#codBody', body: 'Cada código con su programa, valor, estado y beneficiario. Desde aquí también se <b>revierte</b> (HU-GI-09).' }
      ] },
    'HU-GI-08': { ph: 'Gestor de Incentivos', page: 'incentivo-12-asignaciones.html', role: 'admin',
      title: 'Historial nacional de asignaciones', purpose: 'Registro completo y auditable de todas las entregas del país, filtrable para consolidar reportes.',
      steps: [
        { sel: '#ddProgWrap', body: '<b>Filtra por programa</b>.' },
        { sel: '#ddRegionWrap', body: '<b>Filtra por región / municipio</b>.' },
        { sel: '#searchInput', body: '<b>Busca</b> por beneficiario o documento.' },
        { sel: '#asigBody', body: 'Registro cronológico completo: fecha, beneficiario, programa, operador, región y estado (solo lectura / auditoría).' }
      ] },
    'HU-GI-09': { ph: 'Gestor de Incentivos', page: 'incentivo-07-codigos.html', role: 'admin',
      title: 'Reversión con motivo', purpose: 'Revertir una asignación con motivo obligatorio: el código vuelve al inventario y queda la trazabilidad.',
      steps: [
        { sel: '.cod-revert-btn', body: 'En un código <b>asignado</b>, clic en <b>Revertir</b>: abre el modal.', click: true },
        { sel: '#rvCatDD', body: 'Selecciona el <b>motivo</b> de la reversión.' },
        { sel: '#rvJust', body: 'Escribe la <b>justificación</b> (obligatoria — queda en auditoría).' },
        { sel: '#btnRvConfirm', body: 'Confirma: el código vuelve a <b>disponible</b>, el valor regresa al rubro y queda en el historial.' }
      ] },
    'HU-GI-10': { ph: 'Gestor de Incentivos', page: 'incentivo-15-reporteria.html', role: 'admin',
      title: 'Reportería consolidada', purpose: 'Generar reportes filtrados por periodo, programa y logro para rendición de cuentas, con descarga CSV.',
      steps: [
        { sel: '#filterBtn', body: 'Abre los <b>filtros avanzados</b>: año, mes, programa y logro.', click: true },
        { sel: '#prevTags, #filterPopover', body: 'Los <b>filtros activos</b> aparecen como tags; el botón muestra el conteo aplicado.' },
        { sel: '#prevBody', body: 'La <b>previsualización</b> del reporte: beneficiario, disciplina, logro, programa, valor.' },
        { sel: '#btnDescargarReporte', body: '<b>Descargar reporte</b> genera un CSV (UTF-8) listo para Excel.' }
      ] },

    /* ═══ OPERADOR EN CAMPO (rol operador) ═══ */
    'HU-OP-01': { ph: 'Operador en campo', page: 'incentivo-08-asignar-buscar.html', role: 'operador',
      title: 'Buscar y verificar', purpose: 'Buscar al beneficiario entre quienes cumplen las condiciones del programa y verificar sus datos.',
      steps: [
        { sel: '#benefTabs', body: 'Elige el <b>tipo de beneficiario</b>: deportista, paradeportista, personal de apoyo o institución educativa.' },
        { sel: '#docNumber', body: 'Ingresa el <b>documento</b> (o usa un ejemplo de demo abajo).' },
        { sel: '.quick-chip[data-type="deportista"]', body: 'Clic en un <b>caso de demo</b> para ver el resultado de la validación.', click: true },
        { sel: '.profile-card', body: 'Solo aparece quien cumple las condiciones del programa. <b>Verifica sus datos</b>.' },
        { sel: '#contactBlock', body: 'Corrige el <b>contacto</b> si la inscripción trae datos de la institución.' },
        { sel: '.profile-card__footer .naowee-btn--loud', body: '<b>Entregar</b>: elegir el incentivo y, si es bono, el código.' }
      ] },
    'HU-OP-02': { ph: 'Operador en campo', page: 'incentivo-10-asignar-tipo.html', role: 'operador',
      title: 'Entregar', purpose: 'Elegir el incentivo aplicable y el código del inventario a entregar (asignación manual, trazable).',
      steps: [
        { sel: '#incList', body: 'Cada incentivo muestra las <b>condiciones que cumple</b>. Si es un bono, al elegirlo aparece el <b>inventario de códigos</b>.' },
        { sel: '#btnNext', body: '<b>Confirmar entrega</b> y pasar a la evidencia.' }
      ] },
    'HU-OP-03': { ph: 'Operador en campo', page: 'incentivo-09-validar-foto.html', role: 'operador',
      title: 'Evidencia de entrega', purpose: 'Adjuntar la evidencia de la entrega física (foto o archivo de respaldo). No es validación biométrica.',
      steps: [
        { sel: '#dropZone', body: 'Adjunta la <b>evidencia</b>: foto del beneficiario recibiendo, o un documento de respaldo.' },
        { sel: '#btnLater', body: 'Si no tienes la foto, <b>la subes después</b>: queda como evidencia pendiente.' },
        { sel: '#btnConfirmMain', body: '<b>Registrar foto</b> de la entrega.' }
      ] },
    'HU-OP-04': { ph: 'Operador en campo', page: 'incentivo-11-asignar-exito.html', role: 'operador',
      title: 'Confirmación exitosa', purpose: 'Confirmar visualmente que la asignación quedó registrada y su comprobante.',
      steps: [
        { sel: '#receiptId', body: 'El <b>comprobante de entrega</b> con su identificador único.' },
        { sel: '#receiptName', body: 'Los datos de la entrega: <b>beneficiario, incentivo, programa y fecha</b>.' },
        { sel: '#btnNewAssignment', body: '<b>Nueva asignación</b> para continuar con el siguiente beneficiario.' }
      ] },
    'HU-OP-05': { ph: 'Operador en campo', page: 'incentivo-14-mis-asignaciones.html', role: 'operador',
      title: 'Mis asignaciones', purpose: 'Ver únicamente las entregas que el operador ha realizado: su gestión personal del día / evento.',
      steps: [
        { sel: '#kpiPend', body: 'Toca <b>Evidencia pendiente</b> para ver solo las entregas a las que les falta la foto.' },
        { sel: '#searchInput', body: 'Busca por beneficiario, documento, incentivo o <b>código</b>.' },
        { sel: '#asigBody', body: 'Cada fila abre el <b>detalle</b>: su historial, el código y la opción de <b>revertir</b> con motivo.' }
      ] },

    /* ═══ TRANSVERSAL ═══ */
    'HU-TR': { ph: 'Transversal', page: 'incentivo-02-dashboard.html', role: 'admin',
      title: 'Navegación, roles y branding', purpose: 'El chrome común: sidebar por rol, chip de perfil con cambio de rol y footer institucional.',
      steps: [
        { sel: '#sidebar', body: 'El <b>sidebar</b> cambia según el rol (Gestor ve Dashboard/Programas/Códigos/Historial/Reportería; Operador ve Asignar/Mis asignaciones), con indicador del item activo.' },
        { sel: '.profile-switcher .user-chip, .profile-switcher', body: 'El <b>chip de perfil</b> muestra nombre, rol y avatar; desde aquí se <b>cambia de rol</b> sin reingresar credenciales.', click: true },
        { sel: '.naowee-floating-footer', body: 'El <b>footer institucional</b> con marca Naowee y la <b>versión</b> del módulo.' }
      ] }
  };
  var ORDER = ['HU-GI-01','HU-GI-02','HU-GI-03','HU-GI-04','HU-GI-05','HU-GI-06','HU-GI-07','HU-GI-08','HU-GI-09','HU-GI-10',
               'HU-OP-01','HU-OP-02','HU-OP-03','HU-OP-04','HU-OP-05','HU-TR'];

  // ── Estado ──
  var curHab = null, curStep = 0, _retry = null, _stepActed = false, _curEl = null;

  // ── CSS (tokens naranja del módulo + Inter) ──
  function injectCSS() {
    if (document.getElementById('incTourCSS')) return;
    var st = document.createElement('style'); st.id = 'incTourCSS';
    st.textContent =
      '.tt-spot{position:fixed;border-radius:12px;box-shadow:0 0 0 9999px rgba(20,20,32,.55);z-index:9000;pointer-events:none;transition:top .25s,left .25s,width .25s,height .25s;border:2px solid var(--accent,#d74009);}' +
      '.tt-coach{position:fixed;z-index:9002;width:348px;max-width:calc(100vw - 28px);background:#fff;border-radius:16px;box-shadow:0 24px 60px -16px rgba(20,20,32,.4);pointer-events:auto;overflow:hidden;font-family:Inter,-apple-system,sans-serif;}' +
      '.tt-coach-h{display:flex;align-items:center;gap:8px;padding:13px 16px 0;}' +
      '.tt-chip{font-size:10px;font-weight:800;letter-spacing:.04em;color:var(--accent,#d74009);background:var(--orange-bg,#fff3e6);padding:3px 9px;border-radius:999px;text-transform:uppercase;}' +
      '.tt-phase{font-size:10.5px;font-weight:600;color:#9aa0b8;}' +
      '.tt-x{margin-left:auto;background:none;border:0;cursor:pointer;color:#9aa0b8;font-size:20px;line-height:1;padding:2px 4px;}' +
      '.tt-x:hover{color:#282834;}' +
      '.tt-title{font-size:16px;font-weight:800;color:#282834;padding:8px 16px 0;letter-spacing:-.2px;}' +
      '.tt-purpose{font-size:12px;color:#646587;padding:4px 16px 0;line-height:1.45;}' +
      '.tt-body{font-size:13.5px;color:#282834;padding:12px 16px 0;line-height:1.5;}' +
      '.tt-body b{color:var(--accent,#d74009);font-weight:700;}' +
      '.tt-f{display:flex;align-items:center;gap:8px;padding:14px 16px 16px;margin-top:8px;}' +
      '.tt-count{font-size:11.5px;font-weight:700;color:#9aa0b8;}' +
      '.tt-btns{margin-left:auto;display:flex;gap:8px;}' +
      '.tt-btn{font-family:inherit;font-size:12.5px;font-weight:700;border-radius:10px;padding:8px 15px;cursor:pointer;color:var(--accent,#d74009);background:#fff;border:1px solid var(--border,#e7e9f3);transition:background .14s,box-shadow .14s,border-color .14s;}' +
      '.tt-btn:hover{background:#fafbfd;border-color:#d0d4e6;box-shadow:0 4px 12px -6px rgba(20,20,32,.15);}' +
      '.tt-btn--p{color:#fff;border:1px solid transparent;background:var(--accent,#d74009);box-shadow:0 6px 16px -6px rgba(215,64,9,.5);}' +
      '.tt-btn--p:hover{background:var(--accent,#d74009);box-shadow:0 10px 24px -6px rgba(215,64,9,.55);}' +
      '.tt-launch{position:fixed;right:20px;bottom:64px;z-index:8000;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--border,#e7e9f3);border-radius:999px;padding:9px 15px;font-family:Inter,sans-serif;font-size:12.5px;font-weight:700;color:var(--accent,#d74009);cursor:pointer;box-shadow:0 10px 30px -10px rgba(20,20,32,.28);}' +
      '.tt-launch:hover{box-shadow:0 14px 36px -10px rgba(20,20,32,.38);}' +
      '.tt-panel{position:fixed;right:20px;bottom:110px;z-index:8001;width:320px;max-height:70vh;overflow:auto;background:#fff;border:1px solid var(--border,#e7e9f3);border-radius:16px;box-shadow:0 20px 50px -14px rgba(20,20,32,.4);padding:8px;display:none;font-family:Inter,sans-serif;}' +
      '.tt-panel.open{display:block;}' +
      '.tt-panel-h{font-size:12.5px;font-weight:800;color:#282834;padding:8px 10px 2px;}' +
      '.tt-panel-sub{font-size:11px;color:#646587;padding:0 10px 8px;line-height:1.4;}' +
      '.tt-grp{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#9aa0b8;padding:12px 10px 4px;}' +
      '.tt-item{width:100%;display:flex;align-items:center;gap:9px;background:none;border:0;cursor:pointer;padding:8px 10px;border-radius:9px;text-align:left;font-family:inherit;}' +
      '.tt-item:hover{background:var(--orange-bg,#fff3e6);}' +
      '.tt-item-code{font-size:9px;font-weight:800;color:var(--accent,#d74009);background:var(--orange-bg,#fff3e6);border-radius:6px;padding:3px 6px;flex-shrink:0;min-width:60px;text-align:center;letter-spacing:.02em;}' +
      '.tt-item-t{font-size:12.5px;font-weight:600;color:#282834;}' +
      '@media (prefers-reduced-motion:reduce){.tt-spot{transition:none;}}' +
      '@media (max-width:768px){.tt-coach{left:50%!important;transform:translateX(-50%);bottom:14px!important;top:auto!important;}}';
    document.head.appendChild(st);
  }

  // ── Lanzador + panel (índice de HU por fase) ──
  function renderLauncher() {
    if (document.getElementById('ttLaunch')) return;
    var b = document.createElement('button'); b.id = 'ttLaunch'; b.className = 'tt-launch';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5L11 11l-1.5 3.5L13 13z"/></svg>Recorrido HU';
    b.onclick = function (e) { e.stopPropagation(); togglePanel(); };
    var p = document.createElement('div'); p.id = 'ttPanel'; p.className = 'tt-panel';
    var groups = {};
    ORDER.forEach(function (h) { var t = TOURS[h]; (groups[t.ph] = groups[t.ph] || []).push(h); });
    var html = '<div class="tt-panel-h">Recorrido guiado por HU</div>'
      + '<div class="tt-panel-sub">Cada paso indica la tarea, el propósito (la HU) y dónde hacer clic.</div>';
    Object.keys(groups).forEach(function (ph) {
      html += '<div class="tt-grp">' + ph + '</div>';
      groups[ph].forEach(function (h) {
        var t = TOURS[h];
        html += '<button class="tt-item" data-hab="' + h + '"><span class="tt-item-code">' + h.replace('HU-', '') + '</span><span class="tt-item-t">' + t.title + '</span></button>';
      });
    });
    p.innerHTML = html;
    document.body.appendChild(b); document.body.appendChild(p);
    p.querySelectorAll('.tt-item').forEach(function (it) {
      it.onclick = function (e) { e.stopPropagation(); togglePanel(false); start(it.dataset.hab); };
    });
    document.addEventListener('click', function (e) {
      var pan = document.getElementById('ttPanel');
      if (pan && pan.classList.contains('open') && !pan.contains(e.target) && e.target.id !== 'ttLaunch' && !(e.target.closest && e.target.closest('#ttLaunch'))) pan.classList.remove('open');
    });
  }
  function togglePanel(force) {
    var p = document.getElementById('ttPanel'); if (!p) return;
    if (force === false) p.classList.remove('open'); else p.classList.toggle('open');
  }

  // ── Arranque de un tour (setea rol + navega si hace falta) ──
  function runTour(hab) {
    var t = TOURS[hab]; if (!t) return;
    curHab = hab; curStep = 0; _stepActed = false; renderStep();
  }
  function start(hab) {
    var t = TOURS[hab]; if (!t) return;
    var needRole = t.role || 'admin';
    if (PAGE !== t.page || curRole() !== needRole) {
      try { localStorage.setItem(ROLE_KEY, needRole); } catch (e) {}
      location.href = t.page + '?tour=' + hab;
      return;
    }
    runTour(hab);
  }

  // ── Render de un paso (con reintento para targets dentro de modales) ──
  function findTarget(sel) {
    var els = sel.split(',').map(function (s) { return s.trim(); });
    for (var i = 0; i < els.length; i++) {
      var el = document.querySelector(els[i]);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }
  function renderStep() {
    var t = TOURS[curHab]; if (!t) return; var step = t.steps[curStep];
    clearTimeout(_retry);
    var tries = 0;
    (function locate() {
      var el = findTarget(step.sel);
      if (el || tries > 16) { paint(t, step, el); return; }
      tries++; _retry = setTimeout(locate, 120);
    })();
  }
  function paint(t, step, el) {
    var spot = document.getElementById('ttSpot') || mk('div', 'tt-spot', 'ttSpot');
    var coach = document.getElementById('ttCoach') || mk('div', 'tt-coach', 'ttCoach');
    var last = curStep === t.steps.length - 1;
    _curEl = el || null;
    if (el) {
      placeSpot(spot, el);
      try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
      setTimeout(function () { if (curHab && _curEl === el && document.body.contains(el)) { placeSpot(spot, el); positionCoach(coach, el); } }, 280);
      if (step.click) el.addEventListener('click', function onc() { _stepActed = true; }, { once: true });
    } else {
      spot.style.display = 'none';
    }
    coach.innerHTML =
      '<div class="tt-coach-h"><span class="tt-chip">' + curHab.replace('HU-', '') + '</span><span class="tt-phase">' + t.ph + '</span><button class="tt-x" aria-label="Cerrar">&times;</button></div>'
      + '<div class="tt-title">' + t.title + '</div>'
      + '<div class="tt-purpose">' + t.purpose + '</div>'
      + '<div class="tt-body">' + step.body + '</div>'
      + '<div class="tt-f"><span class="tt-count">Paso ' + (curStep + 1) + ' de ' + t.steps.length + '</span>'
      + '<div class="tt-btns">'
      + (curStep > 0 ? '<button class="tt-btn" data-a="prev">Anterior</button>' : '')
      + '<button class="tt-btn tt-btn--p" data-a="' + (last ? 'done' : 'next') + '">' + (last ? 'Finalizar' : 'Siguiente') + '</button>'
      + '</div></div>';
    positionCoach(coach, el);
    coach.querySelector('.tt-x').onclick = endTour;
    coach.querySelectorAll('[data-a]').forEach(function (btn) {
      btn.onclick = function () {
        var a = btn.dataset.a;
        if (a === 'prev') { _stepActed = false; curStep = Math.max(0, curStep - 1); renderStep(); return; }
        if (a === 'done') { endTour(); return; }
        var step = t.steps[curStep];
        if (step.click && !_stepActed) {
          var el = findTarget(step.sel);
          if (el) { _stepActed = true; try { el.click(); } catch (e) {} setTimeout(function () { _stepActed = false; curStep = Math.min(t.steps.length - 1, curStep + 1); renderStep(); }, 420); return; }
        }
        _stepActed = false; curStep = Math.min(t.steps.length - 1, curStep + 1); renderStep();
      };
    });
  }
  function placeSpot(spot, el) {
    var box = el.closest('.naowee-searchbox__input-wrap, .naowee-searchbox, .naowee-textfield__input-wrap, .naowee-textfield, .naowee-dropdown') || el;
    var r = box.getBoundingClientRect(), pad = 4;
    var br = getComputedStyle(box).borderTopLeftRadius || '8px', radius;
    if (br.indexOf('%') >= 0) radius = '50%';
    else { var n = parseFloat(br) || 0; radius = (n > 0 ? n + pad : 8) + 'px'; }
    spot.style.display = 'block';
    spot.style.top = (r.top - pad) + 'px';
    spot.style.left = (r.left - pad) + 'px';
    spot.style.width = (r.width + pad * 2) + 'px';
    spot.style.height = (r.height + pad * 2) + 'px';
    spot.style.borderRadius = radius;
  }
  function reposition() {
    if (!curHab) return;
    var coach = document.getElementById('ttCoach'), spot = document.getElementById('ttSpot');
    if (!coach) return;
    if (_curEl && document.body.contains(_curEl) && _curEl.offsetParent !== null) {
      if (spot) placeSpot(spot, _curEl);
      positionCoach(coach, _curEl);
    } else if (spot) { spot.style.display = 'none'; positionCoach(coach, null); }
  }
  function positionCoach(coach, el) {
    coach.style.display = 'block';
    var cw = 348, ch = coach.offsetHeight || 240, m = 14;
    var top, left;
    if (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom + ch + m < window.innerHeight) top = r.bottom + m;
      else if (r.top - ch - m > 0) top = r.top - ch - m;
      else top = Math.max(m, (window.innerHeight - ch) / 2);
      left = Math.min(Math.max(m, r.left), window.innerWidth - cw - m);
    } else {
      top = (window.innerHeight - ch) / 2; left = (window.innerWidth - cw) / 2;
    }
    coach.style.top = top + 'px'; coach.style.left = left + 'px';
  }
  function mk(tag, cls, id) { var e = document.createElement(tag); e.className = cls; e.id = id; document.body.appendChild(e); return e; }
  function endTour() {
    clearTimeout(_retry); curHab = null; _curEl = null;
    ['ttSpot', 'ttCoach'].forEach(function (id) { var e = document.getElementById(id); if (e) e.remove(); });
    if (qs('tour')) { var u = new URL(location.href); u.searchParams.delete('tour'); history.replaceState(null, '', u); }
  }
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && curHab) endTour(); });

  // ── Boot ──
  function boot() {
    injectCSS(); renderLauncher();
    var auto = qs('tour');
    if (auto && TOURS[auto]) setTimeout(function () { runTour(auto); }, 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
