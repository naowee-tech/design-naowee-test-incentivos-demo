/* ══════════════════════════════════════════════════════════════════
   Programa de trabajo del operador.

   El operador entrega en los programas donde figura en el equipo
   (team.operatorKeys). "Asignar incentivo" trabaja sobre un programa a
   la vez: la búsqueda, los incentivos y los códigos son de ese programa.

   - Un programa activo  → etiqueta fija.
   - Varios activos      → selector; se recuerda el último elegido.
   - Ninguno activo      → estado vacío, sin búsqueda.

   Los programas cerrados no se eligen aquí: sus entregas se consultan
   en "Mis asignaciones".

   Requiere shared/programs-data.js cargado antes.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  const OPERATOR = { key: 'juan.rodriguez', name: 'Juan Rodríguez' };
  const STORE_KEY = 'inc-op-program';


  const CSS = `
  .op-prg{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:#fff;border:1px solid var(--border,#e5e7eb);border-radius:12px;padding:12px 16px;margin-bottom:16px}
  .op-prg__label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#6b7280}
  .op-prg__fixed{display:flex;flex-direction:column;line-height:1.3}
  .op-prg__fixed strong{font-size:15px;color:#111827}
  .op-prg__fixed small,.op-prg__opt-meta{font-size:12px;color:#6b7280}
  .op-prg__dd{min-width:300px;max-width:420px;flex:0 1 380px}
  .op-prg__dd .naowee-dropdown__menu{z-index:60}
  .op-prg__dd .naowee-dropdown__option{display:flex;flex-direction:column;align-items:flex-start;gap:2px}
  .op-prg__opt-name{font-size:14px}
  .op-prg__hint{font-size:12px;color:#6b7280;flex:1 1 220px}
  .op-prg--empty{flex-direction:column;align-items:center;text-align:center;padding:40px 24px;gap:6px}
  .op-prg--empty h4{margin:6px 0 0;font-size:17px;color:#111827}
  .op-prg--empty p{margin:0;color:#4b5563;font-size:14px}
  .op-prg__empty-icon{width:52px;height:52px;border-radius:50%;background:#fff3e0;color:#92400e;display:flex;align-items:center;justify-content:center}
  `;
  (function injectCss(){
    if(document.getElementById('opPrgCss')) return;
    const st = document.createElement('style'); st.id = 'opPrgCss'; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  })();

  function programsOf(activeOnly){
    const data = window.PROGRAMS_DATA || [];
    return data.filter(p => p.team && (p.team.operatorKeys || []).includes(OPERATOR.key)
      && (!activeOnly || p.status === 'active'));
  }

  function current(){
    const active = programsOf(true);
    let id = null;
    try { id = localStorage.getItem(STORE_KEY); } catch(_) {}
    return active.find(p => p.id === id) || active[0] || null;
  }

  function set(id){
    try { localStorage.setItem(STORE_KEY, id); } catch(_) {}
  }

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';

  /* Pinta la barra del programa en `el`. `onChange(id)` se llama al cambiar
     de programa (la página decide: limpiar el estado y recargar). Devuelve
     el programa actual o null si no hay ninguno activo. */
  function renderBar(el, onChange){
    if(!el) return current();
    const active = programsOf(true);
    const cur = current();
    if(!cur){
      el.innerHTML = `
        <div class="op-prg op-prg--empty">
          <div class="op-prg__empty-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          </div>
          <h4>No tienes programas activos asignados</h4>
          <p>Pídele al gestor que te agregue como operador.</p>
        </div>`;
      return null;
    }
    const meta = p => {
      const n = (p.incentives || []).length;
      return `${p.id} · ${n} incentivo${n === 1 ? '' : 's'}`;
    };
    if(active.length === 1){
      el.innerHTML = `
        <div class="op-prg">
          <span class="op-prg__label">Programa</span>
          <div class="op-prg__fixed"><strong>${esc(cur.name)}</strong><small>${esc(meta(cur))}</small></div>
        </div>`;
      return cur;
    }
    el.innerHTML = `
      <div class="op-prg">
        <span class="op-prg__label">Programa</span>
        <div class="naowee-dropdown op-prg__dd" id="opPrgDd" data-value="${esc(cur.id)}">
          <div class="naowee-dropdown__trigger" tabindex="0" aria-haspopup="listbox">
            <span class="naowee-dropdown__value">${esc(cur.name)}</span>
            <div class="naowee-dropdown__controls"><span class="naowee-dropdown__chevron">${CHEVRON}</span></div>
          </div>
          <div class="naowee-dropdown__menu" role="listbox">
            ${active.map(p => `<div class="naowee-dropdown__option${p.id === cur.id ? ' naowee-dropdown__option--selected' : ''}" data-val="${esc(p.id)}"><span class="op-prg__opt-name">${esc(p.name)}</span><small class="op-prg__opt-meta">${esc(meta(p))}</small></div>`).join('')}
          </div>
        </div>
        <span class="op-prg__hint">${active.length} programas activos. La búsqueda, los incentivos y los códigos son del programa elegido.</span>
      </div>`;
    const dd = el.querySelector('#opPrgDd');
    const trigger = dd.querySelector('.naowee-dropdown__trigger');
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const wasOpen = dd.classList.contains('naowee-dropdown--open');
      document.querySelectorAll('.naowee-dropdown--open').forEach(d => d.classList.remove('naowee-dropdown--open'));
      if(!wasOpen) dd.classList.add('naowee-dropdown--open');
    });
    trigger.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); trigger.click(); }
      if(e.key === 'Escape') dd.classList.remove('naowee-dropdown--open');
    });
    dd.querySelectorAll('.naowee-dropdown__option').forEach(opt => {
      opt.addEventListener('click', e => {
        e.stopPropagation();
        dd.classList.remove('naowee-dropdown--open');
        const id = opt.dataset.val;
        if(id === cur.id) return;
        set(id);
        if(typeof onChange === 'function') onChange(id);
      });
    });
    document.addEventListener('click', () => dd.classList.remove('naowee-dropdown--open'));
    return cur;
  }

  function byId(id){ return (window.PROGRAMS_DATA || []).find(p => p.id === id) || null; }

  window.OperatorProgram = { OPERATOR, programsOf, current, set, renderBar, byId };
})();
