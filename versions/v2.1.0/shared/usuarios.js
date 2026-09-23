/* ══════════════════════════════════════════════════════════════════
   Usuarios del módulo (demo).

   Jerarquía: Superadmin → Administrador → Gestor de incentivos →
   Gestor de programa → Operador. Cada rol crea y administra cualquier
   rol que esté por debajo del suyo; nunca uno igual o superior.

   Los programas de un gestor de programa o de un operador NO se guardan
   en el usuario: salen del equipo de cada programa (team.gestorKey /
   team.operatorKeys), que sigue siendo la única fuente. Asignar programas
   al crear o editar un usuario actualiza esos equipos.

   SOLO DEMO: lo creado o editado se guarda en localStorage de este
   navegador ('naowee:incentivos:usuarios'). En el producto lo persiste
   el backend y la invitación la envía el servicio de usuarios.

   Requiere shared/programs-data.js cargado antes.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  const KEY = 'naowee:incentivos:usuarios';

  const ROLE_ORDER = ['superadmin', 'administrador', 'gestor_incentivos', 'gestor_programa', 'operador'];
  const ROLE_LABEL = {
    superadmin: 'Superadmin', administrador: 'Administrador', gestor_incentivos: 'Gestor de incentivos',
    gestor_programa: 'Gestor de programa', operador: 'Operador'
  };
  /* Perfil del selector de la demo → rol del módulo y usuario que lo encarna. */
  const SWITCHER = {
    superadmin:    { role: 'superadmin',        key: 'andres.mora' },
    administrador: { role: 'administrador',     key: 'claudia.ospina' },
    admin:         { role: 'gestor_incentivos', key: 'doug.vargas' },
    programa:      { role: 'gestor_programa',   key: 'elkin.avila' },
    operador:      { role: 'operador',          key: 'juan.rodriguez' }
  };

  const SEED = [
    { key:'andres.mora',    name:'Andrés Mora',     doc:'79456123',   email:'andres.mora@naowee.com',         org:'Naowee',                                 role:'superadmin',        createdBy:null,             createdAt:'02 ene 2026' },
    { key:'claudia.ospina', name:'Claudia Ospina',  doc:'52789456',   email:'claudia.ospina@mindeporte.gov.co', org:'Ministerio del Deporte',                role:'administrador',     createdBy:'andres.mora',    createdAt:'05 ene 2026' },
    { key:'doug.vargas',    name:'Doug Vargas',     doc:'80123789',   email:'doug.vargas@naowee.com',         org:'Naowee',                                 role:'gestor_incentivos', createdBy:'claudia.ospina', createdAt:'12 ene 2026' },
    { key:'sofia.pineda',   name:'Sofía Pineda',    doc:'1020456789', email:'sofia.pineda@naowee.com',        org:'Naowee',                                 role:'gestor_incentivos', createdBy:'claudia.ospina', createdAt:'03 feb 2026' },
    { key:'elkin.avila',    name:'Elkin Ávila',     doc:'71234567',   email:'elkin.avila@mindeporte.gov.co',  org:'Ministerio del Deporte',                 role:'gestor_programa',   createdBy:'doug.vargas',    createdAt:'20 ene 2026' },
    { key:'danna.arrieta',  name:'Danna Arrieta',   doc:'1045678901', email:'danna.arrieta@naowee.com',       org:'Naowee',                                 role:'gestor_programa',   createdBy:'doug.vargas',    createdAt:'20 ene 2026' },
    { key:'laura.mejia',    name:'Laura Mejía',     doc:'1032567890', email:'laura.mejia@intercolegiados.gov.co', org:'Coordinación Intercolegiados',       role:'gestor_programa',   createdBy:'sofia.pineda',   createdAt:'10 feb 2026' },
    { key:'juan.rodriguez', name:'Juan Rodríguez',  doc:'1098765432', email:'juan.rodriguez@mindeporte.gov.co', org:'Ministerio del Deporte',               role:'operador',          createdBy:'elkin.avila',    createdAt:'01 mar 2026' },
    { key:'carlos.gomez',   name:'Carlos Gómez',    doc:'1076543210', email:'carlos.gomez@mindeporte.gov.co', org:'Ministerio del Deporte',                 role:'operador',          createdBy:'elkin.avila',    createdAt:'01 mar 2026' },
    { key:'maria.perez',    name:'María Pérez',     doc:'1054321098', email:'maria.perez@intercolegiados.gov.co', org:'Coordinación Intercolegiados',       role:'operador',          createdBy:'laura.mejia',    createdAt:'15 mar 2026' },
    { key:'andrea.lopez',   name:'Andrea López',    doc:'1065432109', email:'andrea.lopez@naowee.com',        org:'Naowee',                                 role:'operador',          createdBy:'danna.arrieta',  createdAt:'18 mar 2026' },
    { key:'pedro.salas',    name:'Pedro Salas',     doc:'1087654321', email:'pedro.salas@mindeporte.gov.co',  org:'Ministerio del Deporte',                 role:'operador',          createdBy:'elkin.avila',    createdAt:'01 mar 2026', status:'inactive' }
  ];

  function read(){ try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); return (v && typeof v === 'object') ? v : {}; } catch(e){ return {}; } }
  function write(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }

  /* Seed + lo guardado en la demo (usuarios nuevos y cambios sobre los de ejemplo). */
  function all(){
    const saved = read();
    const list = SEED.map(u => Object.assign({ status:'active' }, u, saved[u.key] || {}));
    Object.values(saved).filter(u => u.isNew).forEach(u => list.push(Object.assign({ status:'active' }, u)));
    return list;
  }
  function byKey(k){ return all().find(u => u.key === k) || null; }
  function patch(k, obj){ const s = read(); s[k] = Object.assign({}, s[k] || {}, obj); write(s); }

  function rank(role){ return ROLE_ORDER.indexOf(role); }
  function rolesBelow(role){ return ROLE_ORDER.filter(r => rank(r) > rank(role)); }

  /* Quién está usando la demo (según el perfil del selector). */
  function viewer(){
    const sw = (window.currentRole && window.currentRole()) || localStorage.getItem('naowee-incentivos-role') || 'admin';
    return SWITCHER[sw] || SWITCHER.admin;
  }

  function programsOf(u){
    const data = window.PROGRAMS_DATA || [];
    if(u.role === 'gestor_programa') return data.filter(p => p.team && p.team.gestorKey === u.key);
    if(u.role === 'operador') return data.filter(p => p.team && (p.team.operatorKeys || []).includes(u.key));
    return [];
  }

  /* Visibilidad: superadmin y administrador ven a todos; el gestor de incentivos,
     a los gestores de programa y operadores; el gestor de programa, a los operadores
     de sus programas y a los que él creó. El operador no tiene la pantalla. */
  function canSee(v, u){
    if(v.role === 'superadmin' || v.role === 'administrador') return true;
    if(v.role === 'gestor_incentivos') return u.role === 'gestor_programa' || u.role === 'operador';
    if(v.role === 'gestor_programa'){
      if(u.role !== 'operador') return false;
      const mine = programsOf({ role:'gestor_programa', key: v.key }).map(p => p.id);
      return u.createdBy === v.key || programsOf(u).some(p => mine.includes(p.id));
    }
    return false;
  }
  function canManage(v, u){ return rank(u.role) > rank(v.role) && canSee(v, u); }
  function visible(){ const v = viewer(); return all().filter(u => canSee(v, u)); }

  /* Programas que quien crea puede asignar: todos (si ve todo) o los suyos (gestor de programa). */
  function assignablePrograms(){
    const v = viewer();
    const data = (window.PROGRAMS_DATA || []).filter(p => p.status !== 'closed');
    if(v.role === 'gestor_programa') return data.filter(p => p.team && p.team.gestorKey === v.key);
    return data;
  }

  function slug(name){
    return String(name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
      .split(/\s+/).slice(0, 2).join('.').replace(/[^a-z.]/g, '');
  }
  const MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  function today(){ const d = new Date(); return `${String(d.getDate()).padStart(2,'0')} ${MES[d.getMonth()]} ${d.getFullYear()}`; }
  function teamLabel(u){ return `${u.name} · ${u.org || ROLE_LABEL[u.role]}`; }

  /* Deja el equipo de los programas como indica `ids` para este usuario. */
  function syncTeams(u, ids){
    const data = window.PROGRAMS_DATA || [];
    data.forEach(p => {
      /* Un programa cerrado es de solo lectura: su equipo queda como estaba. */
      if(p.status === 'closed') return;
      if(!p.team) p.team = { gestorKey:'', gestor:'', operatorKeys:[], operators:[] };
      const t = p.team, want = ids.includes(p.id);
      let changed = false;
      if(u.role === 'gestor_programa'){
        const has = t.gestorKey === u.key;
        if(want && !has){ t.gestorKey = u.key; t.gestor = teamLabel(u); changed = true; }
        if(!want && has){ t.gestorKey = ''; t.gestor = ''; changed = true; }
      } else if(u.role === 'operador'){
        const keys = t.operatorKeys || (t.operatorKeys = []);
        const labels = t.operators || (t.operators = []);
        const i = keys.indexOf(u.key);
        if(want && i < 0){ keys.push(u.key); labels.push(teamLabel(u)); changed = true; }
        if(!want && i >= 0){ keys.splice(i, 1); labels.splice(i, 1); changed = true; }
      }
      if(changed && typeof window.saveDemoProgram === 'function') window.saveDemoProgram(p);
    });
  }

  function validate(d, editingKey){
    if(!d.name) return { field:'usName', msg:'Escribe el nombre completo.' };
    if(!/^[0-9]{6,12}$/.test(d.doc || '')) return { field:'usDoc', msg:'El documento debe tener entre 6 y 12 dígitos.' };
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || '')) return { field:'usEmail', msg:'El correo no tiene un formato válido.' };
    const dup = all().find(u => u.key !== editingKey && (u.doc === d.doc || u.email.toLowerCase() === d.email.toLowerCase()));
    if(dup) return { field: dup.doc === d.doc ? 'usDoc' : 'usEmail', msg:`Ya existe un usuario con ese ${dup.doc === d.doc ? 'documento' : 'correo'}: ${dup.name}.` };
    if(!d.role) return { field:'usRole', msg:'Elige el rol.' };
    return null;
  }

  function create(d, programIds){
    const v = viewer();
    let key = slug(d.name) || ('usuario.' + Date.now().toString(36));
    while(byKey(key)) key += '.' + Math.floor(Math.random() * 9 + 1);
    const u = { key, isNew:true, name:d.name, doc:d.doc, email:d.email, org:d.org || '', role:d.role, status:'invited',
                createdBy:v.key, createdAt:today(), invitedAt:today() };
    patch(key, u);
    syncTeams(u, programIds || []);
    return byKey(key);
  }
  function update(key, d, programIds){
    const u = byKey(key); if(!u) return null;
    patch(key, { name:d.name, doc:d.doc, email:d.email, org:d.org || '' });
    const nu = byKey(key);
    if(Array.isArray(programIds)) syncTeams(nu, programIds);
    return byKey(key);
  }
  /* Desactivar no borra: las entregas y el historial se conservan. Sale de los equipos. */
  function deactivate(key){
    const u = byKey(key); if(!u) return;
    syncTeams(u, []);
    patch(key, { status:'inactive', deactivatedAt: today() });
  }
  /* Un gestor de programa con programas no se desactiva sin antes darles otro
     gestor: `map` = { programId: keyDelNuevoGestor } para cada programa no cerrado. */
  function reassignAndDeactivate(key, map){
    const u = byKey(key); if(!u) return false;
    const pending = programsOf(u).filter(p => p.status !== 'closed');
    if(u.role === 'gestor_programa' && pending.some(p => !map || !map[p.id])) return false;
    pending.forEach(p => {
      const nu = map && byKey(map[p.id]);
      if(!nu) return;
      const ids = programsOf(nu).map(x => x.id);
      if(!ids.includes(p.id)) syncTeams(nu, ids.concat(p.id));
    });
    deactivate(key);
    return true;
  }
  function reactivate(key){ patch(key, { status:'active' }); }
  function resendInvite(key){ patch(key, { invitedAt: today() }); }
  function resetUsers(){ try { localStorage.removeItem(KEY); } catch(e){} }

  /* ══ Modal crear / editar (compartido: pantalla Usuarios y equipo del programa) ══ */
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  const CSS = `
  .us-ov{position:fixed;inset:0;background:rgba(20,20,32,.45);display:none;align-items:center;justify-content:center;z-index:12000;padding:16px}
  .us-ov.open{display:flex}
  .us-modal{background:#fff;border-radius:16px;width:560px;max-width:100%;max-height:calc(100vh - 32px);overflow:auto;box-shadow:0 24px 60px rgba(20,20,32,.25);font-family:Inter,system-ui,sans-serif}
  .us-modal__head{padding:20px 24px 8px}
  .us-modal__head h2{font-size:18px;font-weight:800;color:#282834;margin:0}
  .us-modal__head p{font-size:12.5px;color:#646587;margin:4px 0 0;line-height:1.45}
  .us-modal__body{padding:12px 24px 8px;display:grid;grid-template-columns:1fr 1fr;gap:14px 16px}
  .us-modal__body .full{grid-column:1 / -1}
  .us-fld label{display:block;font-size:12px;font-weight:600;color:#282834;margin-bottom:6px}
  .us-fld label .opt{font-weight:500;color:#9c9ebf}
  .us-fld input,.us-fld select{width:100%;box-sizing:border-box;height:40px;border:1px solid #d0d4e6;border-radius:10px;padding:0 12px;font:inherit;font-size:13.5px;color:#282834;background:#fff}
  .us-fld input:focus,.us-fld select:focus{outline:none;border-color:#d74009;box-shadow:0 0 0 3px rgba(215,64,9,.12)}
  .us-fld input[disabled]{background:#f5f6fa;color:#646587}
  .us-roles{display:flex;flex-wrap:wrap;gap:8px}
  .us-role{border:1.5px solid #e7e9f3;border-radius:10px;padding:8px 12px;font:inherit;font-size:13px;font-weight:600;color:#282834;background:#fff;cursor:pointer}
  .us-role.on{border-color:#d74009;background:#fff3e6;color:#b45309}
  .us-role[disabled]{cursor:default;opacity:.7}
  .us-prgs{display:flex;flex-direction:column;gap:6px;max-height:180px;overflow:auto;border:1px solid #e7e9f3;border-radius:10px;padding:8px 10px}
  .us-prgs label{display:flex;align-items:center;gap:10px;font-size:13px;color:#282834;cursor:pointer;margin:0;font-weight:500}
  .us-prgs input{width:16px;height:16px;accent-color:#d74009}
  .us-prgs small{color:#9c9ebf;font-size:11.5px}
  .us-hint{font-size:11.5px;color:#646587;margin-top:6px;line-height:1.4}
  .us-err{grid-column:1 / -1;background:#fdecec;color:#9e0015;border-radius:10px;padding:10px 12px;font-size:12.5px;font-weight:600}
  .us-modal__foot{padding:14px 24px 20px;display:flex;justify-content:flex-end;gap:10px}
  .us-modal__foot button{height:40px;border-radius:10px;padding:0 18px;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;border:none}
  .us-btn-mute{background:#f1f1f6;color:#282834}
  .us-btn-loud{background:#d74009;color:#fff}
  @media(max-width:560px){.us-modal__body{grid-template-columns:1fr}}
  `;
  function injectCss(){
    if(document.getElementById('usCss')) return;
    const st = document.createElement('style'); st.id = 'usCss'; st.textContent = CSS; document.head.appendChild(st);
  }
  injectCss();
  function ensureModal(){
    injectCss();
    let ov = document.getElementById('usOverlay');
    if(ov) return ov;
    ov = document.createElement('div');
    ov.className = 'us-ov'; ov.id = 'usOverlay';
    ov.innerHTML = `<div class="us-modal" role="dialog" aria-modal="true" aria-labelledby="usTitle"></div>`;
    ov.addEventListener('click', e => { if(e.target === ov) closeForm(); });
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && ov.classList.contains('open')) closeForm(); });
    document.body.appendChild(ov);
    return ov;
  }
  let formCtx = null;
  function closeForm(){ const ov = document.getElementById('usOverlay'); if(ov) ov.classList.remove('open'); formCtx = null; }

  /* opts: { user?: existente (editar), roles?: forzar roles permitidos, programIds?: preseleccionados, onSaved(u) } */
  function openForm(opts){
    opts = opts || {};
    const ov = ensureModal();
    const v = viewer();
    const editing = opts.user || null;
    const allowed = editing ? [editing.role] : (opts.roles || rolesBelow(v.role)).filter(r => rolesBelow(v.role).includes(r));
    if(!allowed.length) return;
    const role0 = editing ? editing.role : allowed[allowed.length - 1];
    const progs = assignablePrograms();
    const preset = editing ? programsOf(editing).map(p => p.id) : (opts.programIds || []);
    formCtx = { editing, opts, role: role0 };
    const m = ov.querySelector('.us-modal');
    m.innerHTML = `
      <div class="us-modal__head">
        <h2 id="usTitle">${editing ? 'Editar usuario' : 'Crear usuario'}</h2>
        <p>${editing ? `${ROLE_LABEL[editing.role]} · el rol no se cambia.` : 'Recibe una invitación por correo para activar su cuenta.'}${opts.hidePrograms ? ' Queda en el equipo de este programa al guardar.' : ''}</p>
      </div>
      <div class="us-modal__body">
        <div class="us-fld full"><label for="usName">Nombre completo</label><input id="usName" value="${esc(editing ? editing.name : '')}" autocomplete="off"/></div>
        <div class="us-fld"><label for="usDoc">Documento</label><input id="usDoc" inputmode="numeric" value="${esc(editing ? editing.doc : '')}"/></div>
        <div class="us-fld"><label for="usEmail">Correo</label><input id="usEmail" type="email" value="${esc(editing ? editing.email : '')}"/></div>
        <div class="us-fld full"><label for="usOrg">Entidad <span class="opt">(opcional)</span></label><input id="usOrg" placeholder="Ej. Ministerio del Deporte" value="${esc(editing ? editing.org : '')}"/></div>
        <div class="us-fld full" id="usRoleFld"><label>Rol</label>
          <div class="us-roles" id="usRole">${allowed.map(r => `<button type="button" class="us-role${r === role0 ? ' on' : ''}" data-r="${r}"${editing ? ' disabled' : ''}>${ROLE_LABEL[r]}</button>`).join('')}</div>
          ${editing ? '' : '<div class="us-hint">Solo puedes crear roles por debajo del tuyo.</div>'}
        </div>
        <div class="us-fld full" id="usPrgFld">
          <label id="usPrgLbl">Programas <span class="opt">(opcional)</span></label>
          <div class="us-prgs">${progs.length ? progs.map(p => `<label><input type="checkbox" value="${esc(p.id)}"${preset.includes(p.id) ? ' checked' : ''}/> <span>${esc(p.name)} <small>${esc(p.id)}${p.status === 'draft' ? ' · borrador' : ''}</small></span></label>`).join('') : '<small>No tienes programas para asignar.</small>'}</div>
          <div class="us-hint" id="usPrgHint"></div>
        </div>
        <div class="us-err" id="usErr" hidden></div>
      </div>
      <div class="us-modal__foot">
        <button type="button" class="us-btn-mute" id="usCancel">Cancelar</button>
        <button type="button" class="us-btn-loud" id="usSave">${editing ? 'Guardar cambios' : 'Crear e invitar'}</button>
      </div>`;
    const setRole = r => {
      formCtx.role = r;
      m.querySelectorAll('.us-role').forEach(b => b.classList.toggle('on', b.dataset.r === r));
      const withPrg = (r === 'gestor_programa' || r === 'operador') && !formCtx.opts.hidePrograms;
      m.querySelector('#usPrgFld').hidden = !withPrg;
      m.querySelector('#usPrgLbl').innerHTML = (r === 'gestor_programa' ? 'Programas que gestiona' : 'Programas donde entrega') + ' <span class="opt">(opcional)</span>';
      m.querySelector('#usPrgHint').textContent = r === 'gestor_programa'
        ? 'Un programa tiene un solo gestor: si ya tenía uno, este lo reemplaza.'
        : 'Queda en el equipo de esos programas. Sin programa, no puede entregar hasta que lo agreguen a uno.';
    };
    m.querySelectorAll('.us-role').forEach(b => b.addEventListener('click', () => { if(!editing) setRole(b.dataset.r); }));
    setRole(role0);
    m.querySelector('#usCancel').addEventListener('click', closeForm);
    m.querySelector('#usSave').addEventListener('click', () => {
      const val = id => (m.querySelector('#' + id).value || '').trim();
      const d = { name: val('usName'), doc: val('usDoc').replace(/\D/g, ''), email: val('usEmail'), org: val('usOrg'), role: formCtx.role };
      const err = validate(d, editing && editing.key);
      const box = m.querySelector('#usErr');
      if(err){ box.textContent = err.msg; box.hidden = false; const f = m.querySelector('#' + err.field); if(f && f.focus) f.focus(); return; }
      const ids = Array.from(m.querySelectorAll('.us-prgs input:checked')).map(i => i.value);
      const withPrg = (d.role === 'gestor_programa' || d.role === 'operador') && !formCtx.opts.hidePrograms;
      /* Al editar, los programas que quien edita no puede asignar se conservan. */
      const keep = editing ? programsOf(editing).map(p => p.id).filter(id => !progs.some(p => p.id === id)) : [];
      const u = editing ? update(editing.key, d, withPrg ? keep.concat(ids) : undefined) : create(d, withPrg ? ids : []);
      const cb = formCtx.opts.onSaved;
      closeForm();
      if(typeof cb === 'function') cb(u);
    });
    ov.classList.add('open');
    setTimeout(() => { const f = m.querySelector('#usName'); if(f) f.focus(); }, 30);
  }

  window.IncUsers = {
    ROLE_ORDER, ROLE_LABEL, SWITCHER, all, byKey, viewer, visible, canSee, canManage, rolesBelow, rank,
    programsOf, assignablePrograms, create, update, deactivate, reassignAndDeactivate, reactivate, resendInvite, resetUsers,
    openForm, closeForm, teamLabel
  };
})();
