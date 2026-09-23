/* ═══════════════════════════════════════════════════════════════
   PROFILE SWITCHER — script compartido (auto-wire)
   Se monta sobre cualquier elemento con .profile-switcher:
   - Si falta id="profileSwitcher", lo añade.
   - Si falta el <div class="profile-dd">, lo inyecta con los roles.
   - Wire-up de clic en chip + chevron sin necesidad de onclick inline.
   - Cierra al clickear fuera.
   - Aplica el rol persistido en localStorage.
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const STORAGE_KEY = 'naowee-incentivos-role';

  /* Contrato de rol (matriz de roles 22-09-2026):
     - clave localStorage: 'naowee-incentivos-role'
     - superadmin → Superadmin (módulo global). Se comporta como admin:
                    satisface data-role="admin" y vive en las páginas admin.
     - admin      → Gestor de incentivos (Naowee · parametriza y audita).
     - programa   → Gestor de programa (sólo su programa asignado).
     - operador   → Operador (ministerio · sólo asigna).
     - gestor     → legacy, se conserva por compatibilidad. */
  const ROLES = {
    superadmin: { name:'Doug Vargas',   label:'Superadmin',           initials:'DV', bg:'#fecaca', fg:'#7f1d1d', meta:'Módulo global · acceso total' },
    admin:    { name:'Doug Vargas',     label:'Gestor de incentivos', initials:'DV', bg:'#c4b5fd', fg:'#4c1d95', meta:'Parametriza y audita' },
    operador: { name:'Doug Vargas',     label:'Operador',             initials:'DV', bg:'#ffdfb5', fg:'#92400e', meta:'Asigna incentivos en campo' },
    gestor:   { name:'Doug Vargas',     label:'Gestor',               initials:'DV', bg:'#ffdfb5', fg:'#92400e', meta:'Asigna y revierte incentivos' },
    // Gestor de programa: sólo ve el(los) programa(s) que tiene asignado(s).
    // Persona ficticia distinta de Doug para diferenciar visualmente la vista.
    programa: { name:'Camila Restrepo', label:'Gestor de programa',   initials:'CR', bg:'#bfdbfe', fg:'#1e3a8a', meta:'Solo su programa · Juegos Intercolegiados 2026',
                assignedPrograms: ['PRG-2026-010'],
                scopeLabel: 'Juegos Intercolegiados 2026' }
  };

  // Qué roles muestra el dropdown por default cuando se auto-inyecta.
  // Incluye programa para que el switcher permita probar la vista filtrada.
  const DEFAULT_ROLES_IN_DD = ['superadmin', 'admin', 'programa', 'operador'];

  // Qué valores de data-role "ve" cada rol además del propio. Superadmin
  // hereda todo lo marcado como admin (páginas que sólo conocen 'admin').
  const ROLE_SEES = { superadmin: ['superadmin', 'admin'] };
  function roleSees(role){ return ROLE_SEES[role] || [role]; }

  function currentRole(){
    return localStorage.getItem(STORAGE_KEY) || 'admin';
  }

  function applyRole(role){
    const r = ROLES[role] || ROLES.admin;
    // Actualiza el avatar del chip
    document.querySelectorAll('.user-chip .ava-ring').forEach(ring => {
      ring.textContent = r.initials;
      ring.style.background = r.bg;
      ring.style.color = r.fg;
    });
    // Actualiza la etiqueta del rol en el chip
    document.querySelectorAll('.user-chip .user-role').forEach(lbl => {
      lbl.textContent = r.label;
      lbl.title = r.scopeLabel ? `${r.label} · ${r.scopeLabel}` : r.label;
    });
    // Alcance del rol (ej: programa asignado) como 3a línea del chip.
    document.querySelectorAll('.user-chip .user-info').forEach(info => {
      let sc = info.querySelector('.user-scope');
      if(r.scopeLabel){
        if(!sc){ sc = document.createElement('span'); sc.className = 'user-scope'; info.appendChild(sc); }
        sc.textContent = r.scopeLabel;
      } else if(sc){ sc.remove(); }
    });
    // Actualiza el nombre del usuario (varía entre Doug y Camila según rol)
    document.querySelectorAll('.user-chip .user-name').forEach(lbl => {
      lbl.textContent = r.name;
    });
    // Mantiene compatibilidad con IDs antiguos del template
    const ring = document.getElementById('avaRing');
    if(ring){ ring.textContent = r.initials; ring.style.background = r.bg; ring.style.color = r.fg; }
    const lblById = document.getElementById('userRoleLabel');
    if(lblById) lblById.textContent = r.label;
    // Active state en los items del dropdown
    document.querySelectorAll('.profile-dd__item').forEach(el => {
      el.classList.toggle('active', el.dataset.role === role);
    });
    // Visibilidad por rol — generalizado a cualquier elemento con data-role
    // (ej: nav-row, bloques de acciones admin-only). Excluye los items del
    // dropdown del switcher (.profile-dd__item) — esos siempre están visibles
    // porque son la lista de perfiles disponibles a elegir, no contenido
    // restringido por rol.
    // data-role admite varios valores separados por espacio (ej: "admin programa").
    const sees = roleSees(role);
    document.querySelectorAll('[data-role]').forEach(el => {
      if(el.classList.contains('profile-dd__item')) return;
      const drs = (el.dataset.role || '').split(/\s+/);
      el.style.display = (drs.includes('all') || drs.some(d => sees.includes(d))) ? '' : 'none';
    });
    // Hook opcional por página: si la página define onRoleApplied(role),
    // se llama después del filtrado base. Permite a cada vista reaccionar
    // (ej: cambiar título, hidratar un hero card, etc) sin depender del
    // timing frágil de setTimeout(0) vs scripts deferred.
    try { if(typeof window.onRoleApplied === 'function') window.onRoleApplied(role); } catch(_) {}
  }

  // Mapeo de páginas por rol: en qué vive cada perfil por default.
  // Si el rol seleccionado no corresponde al tipo de página actual,
  // se redirige al "home" del perfil para que la UX refleje el cambio.
  const OPERATOR_PAGES = /incentivo-(08|09|10|11|14)/;
  const ADMIN_PAGES    = /incentivo-(02|03|04|05|06|07|12|13)/;
  // Gestor de programa vive en el dashboard (filtrado a su programa), la
  // lista (filtrada) y el detalle.
  const PROGRAMA_PAGES = /incentivo-(02|03|05)/;
  const OPERATOR_HOME  = 'incentivo-08-asignar-buscar.html';
  const ADMIN_HOME     = 'incentivo-02-dashboard.html';
  const PROGRAMA_HOME  = 'incentivo-02-dashboard.html';

  function switchRole(role){
    localStorage.setItem(STORAGE_KEY, role);
    applyRole(role);
    closeAllSwitchers();

    const path = location.pathname;
    const onOperadorPage = OPERATOR_PAGES.test(path);
    const onAdminPage    = ADMIN_PAGES.test(path);
    const onProgramaPage = PROGRAMA_PAGES.test(path);

    if(role === 'operador' && !onOperadorPage){
      setTimeout(() => { window.location.href = OPERATOR_HOME; }, 180);
    } else if(role === 'programa' && !onProgramaPage){
      // Gestor de programa: redirijo a su lista filtrada (PRG asignado).
      setTimeout(() => { window.location.href = PROGRAMA_HOME; }, 180);
    } else if((role === 'superadmin' || role === 'admin' || role === 'gestor') && !onAdminPage){
      // Gestor de incentivos (admin) vive en el dashboard; si estoy en
      // pages del operador, redirijo.
      setTimeout(() => { window.location.href = ADMIN_HOME; }, 180);
    }
  }

  /* Helper: devuelve los IDs de programas asignados al rol actual.
     Retorna null si el rol no tiene restricciones (ve todo). Las páginas
     que renderizan listas pueden filtrar contra este array. */
  function getRoleAssignments(){
    const r = ROLES[currentRole()];
    return (r && Array.isArray(r.assignedPrograms)) ? r.assignedPrograms.slice() : null;
  }

  function toggleProfileDD(ev){
    if(ev) ev.stopPropagation();
    const sw = ev?.currentTarget?.closest?.('.profile-switcher')
            || document.querySelector('.profile-switcher');
    if(!sw) return;
    const isOpen = sw.classList.contains('open');
    closeAllSwitchers();
    if(!isOpen) sw.classList.add('open');
  }

  function closeAllSwitchers(){
    document.querySelectorAll('.profile-switcher').forEach(sw => sw.classList.remove('open'));
  }

  // Construye el dropdown (profile-dd) cuando una página no lo tiene.
  function buildProfileDD(activeRole){
    const items = DEFAULT_ROLES_IN_DD.map(key => {
      const r = ROLES[key];
      if(!r) return '';
      const isActive = key === activeRole ? ' active' : '';
      return `
        <div class="profile-dd__item${isActive}" data-role="${key}">
          <div class="ava"><div class="ava-ring" style="background:${r.bg};color:${r.fg};width:28px;height:28px;font-size:11px">${r.initials}</div></div>
          <div class="role-meta">
            <strong>${r.label}</strong>
            <small>${r.meta}</small>
          </div>
          <svg class="dd-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>`;
    }).join('');
    const dd = document.createElement('div');
    dd.className = 'profile-dd';
    dd.innerHTML = `<div class="profile-dd__label">Cambiar de perfil</div>${items}`;
    return dd;
  }

  function mountSwitcher(sw){
    if(sw.dataset.wzMounted === '1') return;
    sw.dataset.wzMounted = '1';

    // Asegura id (no es estrictamente necesario, pero mantiene compat con
    // código legacy que buscaba por #profileSwitcher)
    if(!sw.id) sw.id = 'profileSwitcher';

    // Wire-up del chip → toggle. Skipeamos si ya tiene onclick inline
    // (páginas legacy con toggleProfileDD inline) para evitar doble fire.
    const chip = sw.querySelector('.user-chip');
    if(chip && !chip.dataset.wzClick && !chip.hasAttribute('onclick')){
      chip.dataset.wzClick = '1';
      chip.style.cursor = 'pointer';
      chip.addEventListener('click', toggleProfileDD);
    }
    // Chevron sólo necesita stopPropagation para no doble-togglear con el chip
    const chevron = sw.querySelector('.user-chip__chevron');
    if(chevron && !chevron.dataset.wzClick){
      chevron.dataset.wzClick = '1';
      chevron.addEventListener('click', (e) => { e.stopPropagation(); toggleProfileDD(e); });
    }

    // Inyecta profile-dd si no existe
    if(!sw.querySelector('.profile-dd')){
      const dd = buildProfileDD(currentRole());
      sw.appendChild(dd);
    }

    // Wire-up de los items del dropdown. Skipeamos si ya tienen onclick
    // inline (páginas legacy) para evitar doble-fire de switchRole.
    sw.querySelectorAll('.profile-dd__item').forEach(item => {
      if(item.dataset.wzClick || item.hasAttribute('onclick')) return;
      item.dataset.wzClick = '1';
      item.addEventListener('click', () => switchRole(item.dataset.role));
    });
  }

  function mountAll(){
    document.querySelectorAll('.profile-switcher').forEach(mountSwitcher);
    applyRole(currentRole());
  }

  // Cerrar al clickear fuera de cualquier switcher
  document.addEventListener('click', (e) => {
    const inside = e.target.closest?.('.profile-switcher');
    if(!inside) closeAllSwitchers();
  });

  // Logout (opcional)
  document.addEventListener('DOMContentLoaded', () => {
    mountAll();
    const btnLogout = document.getElementById('btnLogout');
    if(btnLogout){
      btnLogout.addEventListener('click', () => {
        window.location.href = 'incentivo-01-login.html';
      });
    }
  });

  // Si el DOM ya está listo cuando se carga el script, montar ya.
  if(document.readyState !== 'loading'){
    mountAll();
  }

  // Exposición global para compatibilidad con onclick inline en páginas viejas
  window.ROLES = ROLES;
  window.currentRole = currentRole;
  window.applyRole = applyRole;
  window.switchRole = switchRole;
  window.toggleProfileDD = toggleProfileDD;
  window.getRoleAssignments = getRoleAssignments;
})();
