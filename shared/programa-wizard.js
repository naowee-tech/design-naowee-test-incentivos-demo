/* ═══════════════════════════════════════════════════════════════
   PROGRAMA · WIZARD (5 pasos) — lógica compartida
   Inyecta el markup desde shared/programa-wizard.html y expone
   window.openWizard(). Upgrade automático de selects nativos a
   naowee-dropdown y de inputs date a date-picker custom.
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* totalSteps es dinámico: 4 si hay un incentivo "Bono", 3 si no.
     El paso 4 (Códigos) se omite cuando ningún incentivo es Bono — sólo
     los bonos generan códigos. */
  function hasBonoIncentive(){
    return [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card [data-wz-name="categoria"]')]
      .some(dd => (dd.dataset.wzValue || '').toLowerCase() === 'bono');
  }
  function totalStepsNow(){ return hasBonoIncentive() ? 4 : 3; }
  const stepNames = {
    1: 'Datos del programa',
    2: 'Rubro presupuestal',
    3: 'Tipos de incentivo',
    4: 'Condiciones de elegibilidad',
    5: 'Códigos y activación'
  };
  let currentStep = 1;
  let isMounted = false;
  let pendingOpen = false;
  let isDirty = false;

  const MONTHS_LONG = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const WEEKDAYS = ['L','M','X','J','V','S','D'];

  /* ══ Mount ══ */
  function mount(){
    if(isMounted) return Promise.resolve();
    // Deduplicate: if another page already mounted it, reuse.
    if(document.getElementById('wzOverlay')){
      isMounted = true;
      wireAll();
      return Promise.resolve();
    }
    return fetch('shared/programa-wizard.html', {cache: 'no-cache'})
      .then(r => r.text())
      .then(html => {
        const holder = document.createElement('div');
        holder.innerHTML = html;
        while(holder.firstChild) document.body.appendChild(holder.firstChild);
        isMounted = true;
        wireAll();
      })
      .catch(err => { console.error('[wizard] mount failed', err); });
  }

  function wireAll(){
    upgradeDropdowns();
    upgradeTagMultis();
    upgradeDatepickers();
    wireDropzone();
    wireDropzoneClick();
    wireAnexosUpload();
    wireCategoriaWatcher();
    wireChipPicker();
    wireSegments();
    wireCodesMode();
    wireManualCodes();
    wireInputMasks();
    wireBudgetInputs();
    seedFirstCondition();
    wireDirtyTracking();
    renderDevValidations();
    // ESC
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape' && document.getElementById('wzOverlay').classList.contains('open')){
        closeWizard();
      }
    });
    // Close on overlay click
    const overlay = document.getElementById('wzOverlay');
    overlay.addEventListener('click', e => { if(e.target === overlay) closeWizard(); });
  }

  /* ══ Step navigation ══ */
  function renderStep(){
    const lastStep = totalStepsNow();
    const showCodes = lastStep === 4;
    // Si los códigos se ocultan y currentStep cayó en 4, regrésalo a 3.
    if(currentStep > lastStep) currentStep = lastStep;
    document.querySelectorAll('.wz-pane').forEach(p => { p.hidden = +p.dataset.pane !== currentStep; });
    document.querySelectorAll('.naowee-stepper__step').forEach(s => {
      const n = +s.dataset.step;
      // Paso 4 (Códigos) sólo aparece si hay un incentivo Bono.
      const hideStep = (n === 4 && !showCodes);
      s.classList.toggle('wz-step-hidden', hideStep);
      s.hidden = hideStep; // mantenemos también el atributo por accesibilidad
      s.classList.toggle('naowee-stepper__step--active', n === currentStep);
      s.classList.toggle('naowee-stepper__step--done', n < currentStep);
      const conn = s.querySelector('.naowee-stepper__connector');
      if(conn){
        conn.classList.toggle('naowee-stepper__connector--done', n < currentStep);
        // El conector tras "Condiciones" sólo tiene sentido si paso 4 está visible.
        if(n === 3) conn.style.display = showCodes ? '' : 'none';
      }
    });
    const btnPrev = document.getElementById('wzBtnPrev');
    btnPrev.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    const spacer = document.getElementById('wzPrevSpacer');
    if(spacer) spacer.style.display = currentStep === 1 ? 'block' : 'none';
    spacer && (spacer.style.flex = '1');

    const btnNext = document.getElementById('wzBtnNext');
    const draftBtn = document.getElementById('wzBtnDraft');
    const stepperWrap = document.querySelector('#wzOverlay .wz-stepper-wrap');
    if(stepperWrap) stepperWrap.hidden = !!sectionMode;
    if(draftBtn) draftBtn.style.display = sectionMode ? 'none' : '';
    if(sectionMode){
      const back = sectionMode === 'incentivos' && currentStep === 3;
      btnPrev.style.display = back ? 'inline-flex' : 'none';
      if(spacer) spacer.style.display = back ? 'none' : 'block';
      const goCond = sectionMode === 'incentivos' && currentStep === 2 &&
        [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')].some(c => !c._orig);
      btnNext.innerHTML = goCond
        ? `Continuar a condiciones <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Guardar cambios`;
    } else if(currentStep === lastStep){
      btnNext.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Activar programa`;
    }else{
      btnNext.innerHTML = `Continuar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`;
    }
    document.getElementById('wzBody').scrollTop = 0;
    // Recompute segment pills on the now-visible pane (sync + deferred for safety)
    refreshSegmentPills();
    requestAnimationFrame(refreshSegmentPills);
    setTimeout(refreshSegmentPills, 80);
    // Al entrar al paso 3 (Condiciones), re-evaluar paneles según incentivos.
    if(currentStep === 3) renderCondPanels();
    if(currentStep === 4){ renderManualCodes(); renderCodesScope(); }
  }

  function goStep(s){ currentStep = s; renderStep(); }

  /* Clic en stepper:
     - Permite ir a pasos ya completados (s < currentStep) sin validar
     - Permite quedarse en el actual
     - Bloquea saltar hacia adelante — forzar uso del botón "Continuar" */
  function tryGoStep(s){
    if(sectionMode) return;
    // Si el paso 4 está oculto (no hay bono), no permitir saltar a él.
    if(s === 4 && !hasBonoIncentive()) return;
    if(s <= currentStep){ goStep(s); return; }
    if(!validateStep(currentStep)) return;
    if(s === currentStep + 1){ currentStep = s; renderStep(); }
    // más de un paso adelante: bloqueado, solo secuencial
  }

  function nextStep(){
    if(sectionMode) return sectionNext();
    if(!validateStep(currentStep)) return;
    const lastStep = totalStepsNow();
    if(currentStep < lastStep){ currentStep++; renderStep(); }
    else activateProgram();
  }
  function prevStep(){
    if(sectionMode){ if(sectionMode === 'incentivos' && currentStep === 3){ condOnlyNew = null; currentStep = 2; renderStep(); } return; }
    if(currentStep > 1){ currentStep--; renderStep(); }
  }

  /* ══ Validation ══ */
  function validateStep(step){
    const pane = document.querySelector(`.wz-pane[data-pane="${step}"]`);
    if(!pane) return true;
    let ok = true;
    let firstInvalid = null;
    const reqFields = [...pane.querySelectorAll('[data-wz-required]')].filter(f => !f.closest('.wz-inc-card--inactive'));
    reqFields.forEach(field => {
      const input = field.querySelector('input, textarea');
      const isDropdown = field.classList.contains('naowee-dropdown');
      const isTagMulti = field.classList.contains('wz-tag-multi');
      let val;
      if(isTagMulti){
        val = (field.dataset.wzValue || '').trim();
      } else if(isDropdown){
        val = (field.querySelector('.naowee-dropdown__value')?.textContent || '').trim();
      } else {
        val = (input?.value || '').trim();
      }
      const isEmpty = !val || val === '0' || val === '$';
      if(isEmpty){
        ok = false;
        markError(field);
        if(!firstInvalid) firstInvalid = field;
      }else{
        clearError(field);
      }
    });
    /* Paso 2: el rubro es opcional en esta fase (reunión 22-09). Solo se
       bloquea si la suma de rubros por incentivo supera el rubro total. */
    if(step === 2 && ok){
      const total = parseMoney(document.getElementById('wzRubroTotal'));
      const cards = [...pane.querySelectorAll('.wz-inc-card')];
      const sum = cards.reduce((acc, c) => acc + parseMoney(c.querySelector('.wz-inc-card__rubro input')), 0);
      if(total && sum > total){
        ok = false;
        updateRubroAllocation();
        /* Marcar los rubros por incentivo que suman y llevar al primero
           (el resumen de abajo queda como apoyo). */
        const fmt = n => `$${n.toLocaleString('es-CO')}`;
        cards.forEach(c => {
          const f = c.querySelector('.wz-inc-card__rubro');
          if(!f || !parseMoney(f.querySelector('input'))) return;
          markError(f, `La suma de rubros (${fmt(sum)}) supera el rubro total (${fmt(total)}).`);
          f.classList.add('wz-rubro-err');
          if(!firstInvalid) firstInvalid = f;
        });
      }
    }
    if(step === 3){
      const bad = validateCondPanels();
      if(bad){ ok = false; if(!firstInvalid) firstInvalid = bad; }
    }
    /* Paso 2: si el incentivo tiene rubro y valor unitario, el valor unitario
       no puede superar su rubro (no alcanzaría ni para uno). */
    if(step === 2){
      pane.querySelectorAll('.wz-inc-card').forEach(card => {
        const rField = card.querySelector('.wz-inc-card__rubro');
        const uField = card.querySelector('.wz-inc-card__unit');
        const r = parseMoney(rField?.querySelector('input'));
        const u = parseMoney(uField?.querySelector('input'));
        if(r && u && u > r){
          ok = false;
          markError(uField, `No puede superar el rubro del incentivo ($${r.toLocaleString('es-CO')}).`);
          if(!firstInvalid) firstInvalid = uField;
        } else if(uField && uField.classList.contains('naowee-textfield--error')){
          clearError(uField);
          restoreUnitHint(uField);
        }
      });
    }
    if(!ok && firstInvalid){
      // Scroll suave dentro del body del modal al primer campo inválido
      const body = document.getElementById('wzBody');
      if(body){
        const bodyRect = body.getBoundingClientRect();
        const fieldRect = firstInvalid.getBoundingClientRect();
        // Margen para que se vea también el contexto (título de la tarjeta)
        const targetTop = body.scrollTop + (fieldRect.top - bodyRect.top) - 110;
        body.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      }else{
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Relanzar la animación shake después del scroll para que sea visible
      setTimeout(() => {
        pane.querySelectorAll('.naowee-textfield--error, .naowee-dropdown--error').forEach(f => {
          f.classList.remove('wz-shake');
          void f.offsetWidth;
          f.classList.add('wz-shake');
          setTimeout(() => f.classList.remove('wz-shake'), 500);
        });
      }, 260);
    }
    return ok;
  }

  function markError(field, msg = 'Este campo es obligatorio'){
    field.classList.add('wz-shake');
    setTimeout(() => field.classList.remove('wz-shake'), 500);
    const isDropdown = field.classList.contains('naowee-dropdown');
    const isTagMulti = field.classList.contains('wz-tag-multi');
    if(isTagMulti){
      field.classList.add('wz-tag-multi--error');
    } else if(isDropdown){
      field.classList.add('naowee-dropdown--error');
    }else{
      field.classList.add('naowee-textfield--error');
    }
    // Replace/insert helper
    let helper = field.querySelector('.naowee-helper');
    const helperHtml = `
      <div class="naowee-helper__badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div class="naowee-helper__text">${msg}</div>`;
    if(!helper){
      helper = document.createElement('div');
      helper.className = 'naowee-helper naowee-helper--negative';
      field.appendChild(helper);
    }
    helper.className = 'naowee-helper naowee-helper--negative';
    helper.innerHTML = helperHtml;
  }
  function clearError(field){
    field.classList.remove('naowee-textfield--error');
    field.classList.remove('naowee-dropdown--error');
    field.classList.remove('wz-tag-multi--error');
    const helper = field.querySelector('.naowee-helper');
    if(helper && helper.classList.contains('naowee-helper--negative')){
      helper.remove();
    }
  }

  /* ══ Open / Close ══ */
  function openWizard(){
    if(!isMounted){
      pendingOpen = true;
      mount().then(() => { if(pendingOpen){ pendingOpen = false; openWizard(); } });
      return;
    }
    editingProgramId = null;
    leaveSectionMode();
    setWizardTexts();
    resetWizardForm();
    document.getElementById('wzOverlay').classList.add('open');
    currentStep = 1;
    isDirty = false;
    renderStep();
    requestAnimationFrame(() => setTimeout(refreshSegmentPills, 50));
  }

  /* Abre el wizard con los datos del programa pre-cargados (modo edición). */
  function openWizardForEdit(programId){
    if(!isMounted){
      pendingOpen = true;
      mount().then(() => { if(pendingOpen){ pendingOpen = false; openWizardForEdit(programId); } });
      return;
    }
    const prog = (window.PROGRAMS_DATA || []).find(p => p.id === programId);
    if(!prog){ openWizard(); return; }
    editingProgramId = prog.id;
    leaveSectionMode();
    setWizardTexts();
    resetWizardForm();
    populateWizardFromProgram(prog);
    document.getElementById('wzOverlay').classList.add('open');
    currentStep = 1;
    isDirty = false;
    renderStep();
    requestAnimationFrame(() => setTimeout(refreshSegmentPills, 50));
  }

  /* Reset del formulario completo del wizard a su estado inicial. */
  function resetWizardForm(){
    // Step 1
    const fName = document.getElementById('fName');
    if(fName) fName.value = '';
    const desc = document.querySelector('.wz-pane[data-pane="1"] .naowee-textfield--textarea textarea');
    if(desc) desc.value = '';
    document.querySelectorAll('.wz-pane[data-pane="1"] [data-wz-datepicker] input').forEach(i => { i.value = ''; });
    const cobField = document.querySelector('[data-wz-name="cobertura"]');
    if(cobField && cobField._setValues) cobField._setValues([]);
    ['evento','gestor-programa','operadores'].forEach(n => setDropdownValue(document.querySelector(`.wz-pane[data-pane="1"] [data-wz-name="${n}"]`), []));
    // Step 2 — una sola tarjeta vacía
    const rt = document.getElementById('wzRubroTotal');
    if(rt) rt.value = '';
    const list = document.getElementById('wzIncList');
    if(list) list.innerHTML = '';
    incCounter = 0;
    addIncentive({ focus: false });
    updateRubroAllocation();
    // Step 3 — paneles se regeneran al entrar al paso 3
    const condPanels = document.getElementById('wzCondPanels');
    if(condPanels){ condPanels.innerHTML = ''; condPanels.dataset.wzKey = ''; }
    // Step 4 — limpiar archivo y filas manuales; volver a "Subir plantilla"
    resetWzFile && resetWzFile();
    setCodesMode('upload');
    // Anexos del paso 1
    if(typeof resetAnexos === 'function') resetAnexos();
  }

  /* Pre-llena el formulario con los valores de un programa existente. */
  function populateWizardFromProgram(p){
    // === Step 1 ===
    const fName = document.getElementById('fName');
    if(fName) fName.value = p.name || '';
    const desc = document.querySelector('.wz-pane[data-pane="1"] .naowee-textfield--textarea textarea');
    if(desc) desc.value = p.longDesc || p.shortDesc || '';
    const fromInput = document.querySelector('[data-wz-range="from"][data-wz-range-name="vigencia"] input');
    const toInput   = document.querySelector('[data-wz-range="to"][data-wz-range-name="vigencia"] input');
    if(fromInput && p.from && p.from !== '—') fromInput.value = p.from;
    if(toInput && p.to && p.to !== '—') toInput.value = p.to;
    const cobF = document.querySelector('[data-wz-name="cobertura"]');
    if(cobF && cobF._setValues){
      let keys = Array.isArray(p.coverageKeys) ? p.coverageKeys : [];
      if(!keys.length && p.coverage && p.coverage !== '—'){
        const labels = String(p.coverage).split(',').map(x => x.trim().toLowerCase());
        keys = [...cobF.querySelectorAll('.wz-tag-multi__option')]
          .filter(o => labels.includes((o.dataset.label || '').toLowerCase()))
          .map(o => o.dataset.val);
      }
      cobF._setValues(keys);
    }

    // === Step 2 ===
    const rt = document.getElementById('wzRubroTotal');
    if(rt && p.rubro){
      rt.value = Number(p.rubro).toLocaleString('es-CO');
    }
    const incs = Array.isArray(p.incentives) ? p.incentives : [];
    const list = document.getElementById('wzIncList');
    while(list && list.querySelectorAll('.wz-inc-card').length < incs.length) addIncentive({ focus: false });
    setDropdownValue(document.querySelector('[data-wz-name="evento"]'), p.eventKey ? [p.eventKey] : []);
    if(p.team){
      setDropdownValue(document.querySelector('[data-wz-name="gestor-programa"]'), p.team.gestorKey ? [p.team.gestorKey] : []);
      setDropdownValue(document.querySelector('[data-wz-name="operadores"]'), p.team.operatorKeys || []);
    }
    const cards = [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')];
    incs.forEach((inc, idx) => {
      const card = cards[idx];
      if(!card) return;
      const nameInput = card.querySelector('input[type="text"]');
      if(nameInput) nameInput.value = inc.name || '';
      const catKey = inc.categoryKey || CAT_KEY_BY_LABEL[String(inc.category || '').toLowerCase()] || String(inc.category || '').toLowerCase();
      setDropdownValue(card.querySelector('[data-wz-name="categoria"]'), catKey ? [catKey] : []);
      setDropdownValue(card.querySelector('[data-wz-name="beneficiario"]'), inc.beneficiary ? [inc.beneficiary] : []);
      // Rubro per-card (sólo en multi visualmente)
      const rubroInput = card.querySelector('.wz-inc-card__rubro input');
      if(rubroInput && inc.detail){
        const m = String(inc.detail).match(/[\d.,]+/);
        // No siempre hay rubro; saltamos si no se puede inferir
      }
      // Valor unitario
      const unitInput = card.querySelector('.wz-inc-card__unit input');
      if(unitInput && inc.value) unitInput.value = Number(inc.value).toLocaleString('es-CO');
    });
    refreshIncCardHints();
    updateRubroAllocation();

    /* Estado original de cada incentivo: entregas y códigos ya cargados
       (definen si se puede borrar o solo desactivar) y sus condiciones. */
    const byName = Object.fromEntries((p.codesByIncentive || []).map(c => [c.name, c.count]));
    cards.forEach((card, idx) => {
      const inc = incs[idx];
      if(!inc) return;
      card._orig = { name: inc.name, delivered: inc.delivered || 0, codes: byName[inc.name] || 0 };
      card._existingCodes = byName[inc.name] || 0;
      if(inc.active === false){ card.dataset.inactive = '1'; }
      refreshIncCardState(card);
      const rules = inc.conditions?.groups?.[0]?.rules || [];
      const stored = rules.filter(r => r.fieldKey && FIELD_CATALOG[r.fieldKey])
        .map(r => ({ field: r.fieldKey, op: r.opKey || 'eq', values: [...(r.values || [])] }));
      if(stored.length){
        const sig = `${inc.beneficiary || ''}:${inc.categoryKey || ''}`;
        card._cond = { sig, rules: stored, editing: false, error: '' };
      }
    });
  }

  function closeWizard(){
    const overlay = document.getElementById('wzOverlay');
    if(!overlay) return;
    if(sectionMode){ overlay.classList.remove('open'); isDirty = false; leaveSectionMode(); return; }
    // Solo pregunta si el usuario realmente editó algo
    if(!isDirty){
      overlay.classList.remove('open');
      return;
    }
    // Cierra el wizard primero, luego abre el warning (nunca apilados)
    overlay.classList.remove('open');
    const warn = document.getElementById('wzWarnCloseOverlay');
    if(warn){
      setTimeout(() => warn.classList.add('open'), 180);
    }
  }
  function confirmDiscardWizard(){
    document.getElementById('wzWarnCloseOverlay')?.classList.remove('open');
    isDirty = false;
    showToast('Cambios descartados.', 'informative');
  }
  function confirmSaveDraftWizard(){
    persistDraft();
    document.getElementById('wzWarnCloseOverlay')?.classList.remove('open');
    isDirty = false;
  }

  /* ══ Toast (naowee-message --positive/--negative/--informative/--neutral) ══ */
  function getToastWrap(){
    let w = document.getElementById('wzToastWrap');
    if(!w){
      w = document.createElement('div');
      w.id = 'wzToastWrap';
      w.className = 'wz-toast-wrap';
      document.body.appendChild(w);
    }
    return w;
  }
  function showToast(text, variant = 'positive'){
    /* Solo variantes canónicas del DS v1.4.0; 'neutral' aún no existe en el DS
       (mapea a informative hasta que se promueva). */
    if(variant === 'neutral') variant = 'informative';
    const wrap = getToastWrap();
    const el = document.createElement('div');
    el.className = `wz-toast naowee-message naowee-message--${variant}`;
    /* Glifos blancos (el __icon del DS es un círculo coloreado con color:#fff). */
    const icons = {
      positive:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      negative:    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M7 5h2v4H7z" fill="currentColor"/><circle cx="8" cy="11" r="1" fill="currentColor"/></svg>',
      caution:     '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M7 5h2v4H7z" fill="currentColor"/><circle cx="8" cy="11" r="1" fill="currentColor"/></svg>',
      informative: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M7 7h2v4H7z" fill="currentColor"/><circle cx="8" cy="5" r="1" fill="currentColor"/></svg>'
    };
    el.innerHTML = `
      <div class="naowee-message__header">
        <span class="naowee-message__icon">${icons[variant] || icons.positive}</span>
        <span class="naowee-message__body">${text}</span>
        <button type="button" class="naowee-message__dismiss" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
    const dismiss = () => {
      el.style.transition = 'opacity .22s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 260);
    };
    el.querySelector('.naowee-message__dismiss').addEventListener('click', dismiss);
    wrap.appendChild(el);
    setTimeout(dismiss, 4000);
  }
  window.showToast = showToast;

  /* Dirty tracking — marca como dirty solo cuando el usuario interactúa */
  function wireDirtyTracking(){
    const overlay = document.getElementById('wzOverlay');
    if(!overlay || overlay.dataset.wzDirtyWired) return;
    overlay.dataset.wzDirtyWired = '1';
    const markDirty = () => { isDirty = true; };
    overlay.addEventListener('input', markDirty, true);
    overlay.addEventListener('change', markDirty, true);
    // Dropdown option clicks
    overlay.addEventListener('click', e => {
      if(e.target.closest('.naowee-dropdown__option')) isDirty = true;
      if(e.target.closest('.naowee-segment__item')) isDirty = true;
      if(e.target.closest('.naowee-tag--choice')) isDirty = true;
      if(e.target.closest('.toggle-card')) isDirty = true;
      if(e.target.closest('.wz-dp__day')) isDirty = true;
    }, true);
  }

  /* ══ Dropdown upgrade / behaviour ══ */
  function upgradeDropdowns(){
    document.querySelectorAll('[data-wz-dropdown]').forEach(dd => {
      if(dd.dataset.wzWired) return;
      dd.dataset.wzWired = '1';
      const trigger = dd.querySelector('.naowee-dropdown__trigger');
      const menu = dd.querySelector('.naowee-dropdown__menu');
      const placeholderEl = dd.querySelector('.naowee-dropdown__placeholder');
      let valueEl = dd.querySelector('.naowee-dropdown__value');
      function positionMenu(){
        const tRect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - tRect.bottom - 8;
        const desiredH = Math.min(260, menu.scrollHeight || 260);
        const openUp = spaceBelow < desiredH && tRect.top > desiredH;
        menu.style.width = tRect.width + 'px';
        menu.style.left = tRect.left + 'px';
        if(openUp){
          menu.style.top = (tRect.top - 6 - desiredH) + 'px';
        }else{
          menu.style.top = (tRect.bottom + 6) + 'px';
        }
      }
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = dd.classList.contains('naowee-dropdown--open');
        // Close any other dropdowns / date pickers
        document.querySelectorAll('.naowee-dropdown--open').forEach(d => d.classList.remove('naowee-dropdown--open'));
        document.querySelectorAll('.wz-datepicker.open').forEach(p => p.classList.remove('open'));
        if(!wasOpen){
          dd.classList.add('naowee-dropdown--open');
          positionMenu();
        }
      });
      // Reposition on scroll inside modal
      const body = document.getElementById('wzBody');
      if(body){ body.addEventListener('scroll', () => {
        if(dd.classList.contains('naowee-dropdown--open')) positionMenu();
      }, true); }
      trigger.addEventListener('keydown', e => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); trigger.click(); }
      });
      const isMulti = dd.hasAttribute('data-wz-multi');

      function updateMultiTrigger(){
        const selected = [...menu.querySelectorAll('.naowee-dropdown__option--selected')];
        if(!valueEl){
          valueEl = document.createElement('span');
          valueEl.className = 'naowee-dropdown__value';
          trigger.insertBefore(valueEl, trigger.firstChild);
        }
        if(selected.length === 0){
          if(placeholderEl) placeholderEl.style.display = '';
          valueEl.style.display = 'none';
          dd.dataset.wzValue = '';
        } else {
          if(placeholderEl) placeholderEl.style.display = 'none';
          valueEl.style.display = '';
          if(selected.length === 1){
            valueEl.textContent = selected[0].textContent.trim();
          } else if(selected.length <= 3){
            valueEl.textContent = selected.map(o => o.textContent.trim()).join(', ');
          } else {
            valueEl.textContent = selected.length + ' seleccionadas';
          }
          dd.dataset.wzValue = selected.map(o => o.dataset.val || '').join(',');
        }
      }

      menu.querySelectorAll('.naowee-dropdown__option').forEach(opt => {
        opt.addEventListener('click', (e) => {
          if(isMulti){
            e.stopPropagation();
            opt.classList.toggle('naowee-dropdown__option--selected');
            updateMultiTrigger();
            clearError(dd);
            // No cerrar el menú en multi — el user puede seguir seleccionando
            return;
          }
          menu.querySelectorAll('.naowee-dropdown__option').forEach(o => o.classList.remove('naowee-dropdown__option--selected'));
          opt.classList.add('naowee-dropdown__option--selected');
          const text = opt.textContent.trim();
          if(placeholderEl) placeholderEl.style.display = 'none';
          if(!valueEl){
            valueEl = document.createElement('span');
            valueEl.className = 'naowee-dropdown__value';
            trigger.insertBefore(valueEl, trigger.firstChild);
          }
          valueEl.style.display = '';
          valueEl.textContent = text;
          dd.dataset.wzValue = opt.dataset.val || '';
          dd.classList.remove('naowee-dropdown--open');
          clearError(dd);
        });
      });
    });
    // Click outside to close
    document.addEventListener('click', () => {
      document.querySelectorAll('.naowee-dropdown--open').forEach(d => d.classList.remove('naowee-dropdown--open'));
    });
  }

  /* ══ Tag-multi (dropdown multi-select con chips + botón Agregar)
     Pattern portado del escenario-08 (reg-multi). Diferente del naowee-dropdown:
     los cambios quedan en temp hasta click en "Agregar". Al confirmar, renderiza
     chips inline en el trigger. ══ */
  function upgradeTagMultis(){
    document.querySelectorAll('[data-wz-tag-multi]').forEach(field => {
      if(field.dataset.wzWired) return;
      field.dataset.wzWired = '1';
      const trigger = field.querySelector('.wz-tag-multi__trigger');
      const menu = field.querySelector('.wz-tag-multi__menu');
      const chipsEl = field.querySelector('[data-chips]');
      const optionsEl = field.querySelector('[data-options]');
      const confirmBtn = field.querySelector('[data-confirm]');
      const allOptions = [...optionsEl.querySelectorAll('.wz-tag-multi__option')];
      const placeholderHtml = chipsEl.innerHTML; // backup del placeholder
      let tempVals = [];     // selección en curso (menu abierto)
      let confirmedVals = []; // selección aplicada (trigger)

      function renderChips(){
        if(confirmedVals.length === 0){
          chipsEl.innerHTML = placeholderHtml;
          field.dataset.wzValue = '';
          return;
        }
        const byVal = Object.fromEntries(
          allOptions.map(o => [o.dataset.val, o.dataset.label])
        );
        const visible = confirmedVals.slice(0, 2);
        const extra = confirmedVals.length - visible.length;
        // Usa el componente .naowee-tag del Design System con tag--accent
        const parts = visible.map(v => {
          const lbl = byVal[v] || v;
          return `
            <span class="naowee-tag naowee-tag--small naowee-tag--accent">
              ${lbl}
              <span class="naowee-tag__active-area" data-remove="${v}" role="button" aria-label="Quitar ${lbl}">
                <span class="naowee-tag__close">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
              </span>
            </span>`;
        });
        if(extra > 0){
          parts.push(`<span class="naowee-tag naowee-tag--small naowee-tag--accent">+${extra}</span>`);
        }
        chipsEl.innerHTML = parts.join('');
        field.dataset.wzValue = confirmedVals.join(',');
        // Wire remove
        chipsEl.querySelectorAll('[data-remove]').forEach(x => {
          x.addEventListener('click', e => {
            e.stopPropagation();
            e.preventDefault();
            const v = x.dataset.remove;
            confirmedVals = confirmedVals.filter(c => c !== v);
            tempVals = [...confirmedVals];
            renderChips();
            renderOptionsState();
            clearTagMultiError(field);
          });
        });
      }

      function renderOptionsState(){
        // Si una opción exclusiva (ej. "Nacional") está en tempVals, las demás
        // se deshabilitan visual y funcionalmente — no tiene sentido combinar
        // "Nacional" con un departamento específico.
        const exclusiveSel = allOptions.find(o => o.dataset.exclusive === 'true' && tempVals.includes(o.dataset.val));
        allOptions.forEach(opt => {
          const isExcl = opt.dataset.exclusive === 'true';
          opt.classList.toggle('is-selected', tempVals.includes(opt.dataset.val));
          opt.classList.toggle('is-disabled', !!exclusiveSel && !isExcl);
          opt.setAttribute('aria-disabled', !!exclusiveSel && !isExcl ? 'true' : 'false');
        });
      }

      allOptions.forEach(opt => {
        opt.addEventListener('click', e => {
          e.stopPropagation();
          const v = opt.dataset.val;
          const isExcl = opt.dataset.exclusive === 'true';
          // Si hay una exclusiva activa y este opt no lo es → bloquear click.
          const exclusiveSel = allOptions.find(o => o.dataset.exclusive === 'true' && tempVals.includes(o.dataset.val));
          if(exclusiveSel && !isExcl) return;
          if(tempVals.includes(v)){
            tempVals = tempVals.filter(x => x !== v);
          } else if(isExcl){
            // Seleccionar exclusiva → reemplaza toda la selección por sólo ella.
            tempVals = [v];
          } else {
            tempVals = [...tempVals, v];
          }
          renderOptionsState();
        });
      });

      // Floating del menu: position:fixed + coords calculadas por JS para
      // escapar del overflow-scroll del modal. El menu queda dentro del
      // componente (no se mueve al body) — así no colapsa el layout.
      let isFloating = false;
      function floatMenu(){
        const rect = trigger.getBoundingClientRect();
        if(rect.width < 40) return; // trigger no rendered yet — no-op
        const vh = window.innerHeight;
        const spaceBelow = vh - rect.bottom;
        const spaceAbove = rect.top;
        const menuMaxH = 320;
        menu.classList.add('wz-tag-multi__menu--floating');
        menu.style.width = rect.width + 'px';
        menu.style.left = rect.left + 'px';
        if(spaceBelow >= menuMaxH + 8 || spaceBelow >= spaceAbove){
          menu.style.top = (rect.bottom + 4) + 'px';
          menu.style.bottom = 'auto';
        } else {
          menu.style.top = 'auto';
          menu.style.bottom = (vh - rect.top + 4) + 'px';
        }
        isFloating = true;
      }
      function unfloatMenu(){
        if(!isFloating) return;
        menu.classList.remove('wz-tag-multi__menu--floating');
        menu.style.width = menu.style.left = menu.style.top = menu.style.bottom = '';
        isFloating = false;
      }
      // Reposicionar en scroll/resize cuando el menu está flotando
      function reposition(){
        if(field.classList.contains('is-open') && isFloating) floatMenu();
      }
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);

      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = field.classList.contains('is-open');
        // Cerrar otros dropdowns abiertos
        document.querySelectorAll('.wz-tag-multi.is-open').forEach(d => {
          if(d !== field){
            d.classList.remove('is-open');
            d.dispatchEvent(new CustomEvent('wz-tag-multi:close'));
          }
        });
        document.querySelectorAll('.naowee-dropdown--open').forEach(d => d.classList.remove('naowee-dropdown--open'));
        if(wasOpen){
          field.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
          unfloatMenu();
        } else {
          tempVals = [...confirmedVals];
          renderOptionsState();
          field.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
          floatMenu();
        }
      });
      field.addEventListener('wz-tag-multi:close', unfloatMenu);
      /* Fija el valor desde código (reset, edición, plantilla demo). */
      field._setValues = vals => {
        confirmedVals = [...vals]; tempVals = [...vals];
        renderChips(); renderOptionsState(); clearTagMultiError(field);
      };

      confirmBtn.addEventListener('click', e => {
        e.stopPropagation();
        confirmedVals = [...tempVals];
        renderChips();
        field.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        unfloatMenu();
        clearTagMultiError(field);
      });
    });
    // Click outside cierra todos (también si se clickea el menu que está
    // flotando en body: hay que ignorarlo).
    document.addEventListener('click', e => {
      if(e.target.closest('.wz-tag-multi') || e.target.closest('.wz-tag-multi__menu')) return;
      document.querySelectorAll('.wz-tag-multi.is-open').forEach(d => {
        d.classList.remove('is-open');
        d.dispatchEvent(new CustomEvent('wz-tag-multi:close'));
      });
    });
  }

  function clearTagMultiError(field){
    field.classList.remove('wz-tag-multi--error');
  }

  /* ══ Date picker ══ */
  function upgradeDatepickers(){
    document.querySelectorAll('[data-wz-datepicker]').forEach(field => {
      if(field.dataset.wzWired) return;
      field.dataset.wzWired = '1';
      const input = field.querySelector('input');
      const wrap = field.querySelector('.naowee-textfield__input-wrap');
      const hasIso = !!input.dataset.wzIso;
      const iso = input.dataset.wzIso || toIso(new Date());
      const [yy, mm, dd] = iso.split('-').map(Number);
      let viewYear = yy, viewMonth = mm - 1;
      let selected = new Date(yy, mm - 1, dd);
      let hasSelection = hasIso;

      const pop = document.createElement('div');
      pop.className = 'wz-datepicker';
      field.appendChild(pop);

      function render(){
        pop.innerHTML = `
          <div class="wz-dp__head">
            <button class="wz-dp__nav" data-nav="-1" type="button" aria-label="Mes anterior">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="wz-dp__month">${MONTHS_LONG[viewMonth]} ${viewYear}</div>
            <button class="wz-dp__nav" data-nav="1" type="button" aria-label="Mes siguiente">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="wz-dp__weekdays">
            ${WEEKDAYS.map(w => `<div class="wz-dp__weekday">${w}</div>`).join('')}
          </div>
          <div class="wz-dp__days" data-days></div>
        `;
        const grid = pop.querySelector('[data-days]');
        const firstOfMonth = new Date(viewYear, viewMonth, 1);
        const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday=0
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
        const today = new Date();
        const cells = [];
        for(let i = startWeekday - 1; i >= 0; i--){
          cells.push({ day: daysInPrev - i, muted: true, d: new Date(viewYear, viewMonth - 1, daysInPrev - i) });
        }
        for(let i = 1; i <= daysInMonth; i++){
          cells.push({ day: i, muted: false, d: new Date(viewYear, viewMonth, i) });
        }
        while(cells.length % 7 !== 0){
          const d = cells.length - (startWeekday + daysInMonth) + 1;
          cells.push({ day: d, muted: true, d: new Date(viewYear, viewMonth + 1, d) });
        }
        // Rango: calcular límite mínimo si este campo es "to" y ya hay un "from"
        const rangeRole = field.dataset.wzRange;      // "from" | "to" | undefined
        const rangeName = field.dataset.wzRangeName;  // nombre compartido
        let minDate = null, maxDate = null;
        if(rangeRole === 'to' && rangeName){
          const fromField = document.querySelector(`[data-wz-datepicker][data-wz-range="from"][data-wz-range-name="${rangeName}"]`);
          const fromIso = fromField?.querySelector('input')?.dataset.wzIso;
          if(fromIso){
            const [fy, fm, fd] = fromIso.split('-').map(Number);
            minDate = new Date(fy, fm - 1, fd);
          }
        } else if(rangeRole === 'from' && rangeName){
          // from puede tener max si ya hay un "to" (opcional, no bloqueante)
          const toField = document.querySelector(`[data-wz-datepicker][data-wz-range="to"][data-wz-range-name="${rangeName}"]`);
          const toIso = toField?.querySelector('input')?.dataset.wzIso;
          if(toIso){
            const [ty, tm, td] = toIso.split('-').map(Number);
            maxDate = new Date(ty, tm - 1, td);
          }
        }

        cells.forEach(c => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'wz-dp__day';
          if(c.muted) b.classList.add('wz-dp__day--muted');
          if(sameDay(c.d, today)) b.classList.add('wz-dp__day--today');
          if(hasSelection && sameDay(c.d, selected)) b.classList.add('wz-dp__day--selected');
          // Disable días fuera del rango permitido
          const outOfRange = (minDate && c.d < minDate) || (maxDate && c.d > maxDate);
          if(outOfRange){
            b.classList.add('wz-dp__day--disabled');
            b.disabled = true;
          }
          b.textContent = c.day;
          b.addEventListener('click', e => {
            e.stopPropagation();
            if(outOfRange) return;
            selected = c.d;
            hasSelection = true;
            viewYear = c.d.getFullYear();
            viewMonth = c.d.getMonth();
            input.value = formatHuman(c.d);
            input.dataset.wzIso = toIso(c.d);
            pop.classList.remove('open');
            clearError(field);

            // Si este es "from", validar que "to" no quede antes; si es así, limpiar
            // "to" y mostrar feedback visual (flash rojo + mensaje explicativo).
            if(rangeRole === 'from' && rangeName){
              const toField = document.querySelector(`[data-wz-datepicker][data-wz-range="to"][data-wz-range-name="${rangeName}"]`);
              const toInput = toField?.querySelector('input');
              const toIsoVal = toInput?.dataset.wzIso;
              if(toIsoVal){
                const [ty, tm, td] = toIsoVal.split('-').map(Number);
                const toDate = new Date(ty, tm - 1, td);
                if(toDate < c.d){
                  toInput.value = '';
                  delete toInput.dataset.wzIso;
                  const helper = toField.querySelector('.wz-range-helper');
                  toField.classList.add('wz-flash-error');
                  if(helper){
                    helper.classList.add('is-error');
                    helper.textContent = 'Se limpió porque quedaba antes de la vigencia desde.';
                  }
                  setTimeout(() => {
                    toField.classList.remove('wz-flash-error');
                    if(helper){
                      helper.classList.remove('is-error');
                      helper.textContent = 'Debe ser posterior a la vigencia desde.';
                    }
                  }, 2800);
                }
              }
            }
          });
          grid.appendChild(b);
        });
        pop.querySelectorAll('[data-nav]').forEach(btn => {
          btn.addEventListener('click', e => {
            e.stopPropagation();
            const dir = +btn.dataset.nav;
            viewMonth += dir;
            if(viewMonth < 0){ viewMonth = 11; viewYear--; }
            if(viewMonth > 11){ viewMonth = 0; viewYear++; }
            render();
          });
        });
      }

      function positionPop(){
        const r = wrap.getBoundingClientRect();
        const desiredH = pop.offsetHeight || 330;
        const spaceBelow = window.innerHeight - r.bottom - 8;
        const openUp = spaceBelow < desiredH && r.top > desiredH;
        pop.style.left = r.left + 'px';
        pop.style.width = r.width + 'px';
        if(openUp){
          pop.style.top = (r.top - 6 - desiredH) + 'px';
        }else{
          pop.style.top = (r.bottom + 6) + 'px';
        }
      }
      wrap.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = pop.classList.contains('open');
        // Close other date pickers and dropdowns
        document.querySelectorAll('.wz-datepicker.open').forEach(p => p.classList.remove('open'));
        document.querySelectorAll('.naowee-dropdown--open').forEach(d => d.classList.remove('naowee-dropdown--open'));
        if(!wasOpen){
          // Sync view to selected
          viewYear = selected.getFullYear();
          viewMonth = selected.getMonth();
          render();
          positionPop();
          pop.classList.add('open');
        }
      });
      const body = document.getElementById('wzBody');
      if(body){ body.addEventListener('scroll', () => {
        if(pop.classList.contains('open')) positionPop();
      }, true); }
      // Click outside closes
      document.addEventListener('click', ev => {
        if(!field.contains(ev.target)) pop.classList.remove('open');
      });
    });
  }

  function sameDay(a, b){
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function toIso(d){
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }
  function formatHuman(d){
    return `${String(d.getDate()).padStart(2,'0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }

  /* ══ naowee-segment wiring (pill slide) ══ */
  function wireSegments(){
    document.querySelectorAll('[data-wz-segment]').forEach(seg => {
      if(seg.dataset.wzWired) return;
      seg.dataset.wzWired = '1';
      const pill = seg.querySelector('.naowee-segment__pill');
      const items = seg.querySelectorAll('.naowee-segment__item');
      function movePillTo(item, animated){
        if(!pill) return;
        const r = item.getBoundingClientRect();
        const pr = seg.getBoundingClientRect();
        if(r.width === 0 || pr.width === 0) return; // pane hidden
        // El pill está absolute con `left: 0`, que ancla en el PADDING-BOX
        // (justo dentro del border). Para alinearlo con el item hay que
        // restar sólo el border-width, NO el padding (el padding ya está
        // incluido en r.left vs pr.left, y `left: 0` no lo compensa).
        const borderLeft = parseFloat(getComputedStyle(seg).borderLeftWidth) || 0;
        const offset = r.left - pr.left - borderLeft;
        if(!animated) pill.classList.add('naowee-segment__pill--no-anim');
        pill.style.width = r.width + 'px';
        pill.style.setProperty('--segment-pill-x', offset + 'px');
        if(!animated){
          // force reflow then restore animated
          void pill.offsetWidth;
          pill.classList.remove('naowee-segment__pill--no-anim');
        }
      }
      // Initial position (no anim)
      const active = seg.querySelector('.naowee-segment__item--active') || items[0];
      requestAnimationFrame(() => movePillTo(active, false));
      // Recompute on modal open
      seg._wzMoveInit = () => movePillTo(seg.querySelector('.naowee-segment__item--active') || items[0], false);
      items.forEach(it => {
        it.addEventListener('click', () => {
          items.forEach(x => x.classList.remove('naowee-segment__item--active'));
          it.classList.add('naowee-segment__item--active');
          movePillTo(it, true);
          seg.dataset.wzValue = it.dataset.val || '';
        });
      });
    });
  }

  function refreshSegmentPills(){
    document.querySelectorAll('[data-wz-segment]').forEach(seg => {
      if(typeof seg._wzMoveInit === 'function') seg._wzMoveInit();
    });
  }

  /* ══ Input masks / type restriction ══ */
  function wireInputMasks(){
    document.querySelectorAll('[data-wz-input]').forEach(inp => {
      if(inp.dataset.wzMaskWired) return;
      inp.dataset.wzMaskWired = '1';
      const kind = inp.dataset.wzInput;
      if(kind === 'money' || kind === 'integer'){
        inp.addEventListener('input', () => {
          const caretPos = inp.selectionStart;
          const prevLen = inp.value.length;
          const digits = inp.value.replace(/\D/g, '');
          const formatted = digits ? Number(digits).toLocaleString('es-CO') : '';
          inp.value = formatted;
          // Keep caret in roughly the same place
          const delta = formatted.length - prevLen;
          try { inp.setSelectionRange(caretPos + delta, caretPos + delta); } catch(e){}
        });
        inp.addEventListener('keypress', e => {
          if(e.key.length === 1 && !/\d/.test(e.key)){ e.preventDefault(); }
        });
      }else if(kind === 'text'){
        // Allow letters, numbers, spaces and basic puntuation
        inp.addEventListener('input', () => {
          inp.value = inp.value.replace(/[<>{}]/g, '');
        });
      }
    });
  }

  function wireDropzone(){
    const dz = document.getElementById('wzDrop');
    if(!dz) return;
    ['dragenter','dragover'].forEach(evt => dz.addEventListener(evt, e => {
      e.preventDefault(); dz.classList.add('is-dragover');
    }));
    ['dragleave','drop'].forEach(evt => dz.addEventListener(evt, e => {
      e.preventDefault(); dz.classList.remove('is-dragover');
    }));
  }

  function wireChipPicker(){
    document.querySelectorAll('.chip-picker .naowee-tag--choice').forEach(tag => {
      tag.addEventListener('click', e => {
        e.preventDefault();
        tag.classList.toggle('naowee-tag--selected');
      });
    });
  }

  /* ══ Step-5 codes mode (upload vs manual) ══ */
  /* Forma de carga de códigos: plantilla Excel O uno por uno (excluyentes).
     Si la opción actual ya tiene códigos, se pide confirmación y se descartan. */
  let pendingCodesMode = null;
  function codesModeHasData(mode){
    if(mode === 'upload') return !!document.getElementById('wzFileChip')?.innerHTML.trim();
    return allManualCodes().length > 0;
  }
  function clearCodesMode(mode){
    if(mode === 'upload'){ resetWzFile(); return; }
    codeIncentives().forEach(m => { m.card._codes = []; m.card._codesMsg = null; });
    renderManualCodes();
  }
  function setCodesMode(mode){
    const choice = document.querySelector('[data-wz-name="codes-mode"]');
    if(!choice) return;
    choice.dataset.wzValue = mode;
    choice.querySelectorAll('.toggle-card').forEach(c => {
      const on = c.dataset.val === mode;
      c.classList.toggle('active', on);
      c.setAttribute('aria-checked', on);
      c.tabIndex = on ? 0 : -1;
      c.querySelector('.naowee-radio')?.classList.toggle('naowee-radio--selected', on);
    });
    document.querySelectorAll('.wz-codes-mode').forEach(pane => { pane.hidden = pane.dataset.mode !== mode; });
    if(mode === 'manual') renderManualCodes();
    const bx = document.getElementById('wzBudget');
    if(bx && bx.querySelector('.naowee-message--negative')){ bx.hidden = true; bx.innerHTML = ''; }
    updateBudget();
  }
  function requestCodesMode(mode){
    const current = document.querySelector('[data-wz-name="codes-mode"]')?.dataset?.wzValue || 'upload';
    if(mode === current) return;
    if(!codesModeHasData(current)){ setCodesMode(mode); return; }
    pendingCodesMode = mode;
    const sub = document.getElementById('wzCodesSwitchSub');
    if(sub) sub.textContent = current === 'upload'
      ? 'Se descartará el archivo que subiste y sus códigos. Tendrás que agregarlos uno por uno.'
      : 'Se descartarán los códigos que agregaste uno por uno. Tendrás que subirlos en la plantilla.';
    document.getElementById('wzCodesSwitchOverlay')?.classList.add('open');
  }
  function confirmCodesSwitch(){
    const current = document.querySelector('[data-wz-name="codes-mode"]')?.dataset?.wzValue || 'upload';
    document.getElementById('wzCodesSwitchOverlay')?.classList.remove('open');
    if(!pendingCodesMode) return;
    clearCodesMode(current);
    setCodesMode(pendingCodesMode);
    pendingCodesMode = null;
    isDirty = true;
  }
  function cancelCodesSwitch(){
    pendingCodesMode = null;
    document.getElementById('wzCodesSwitchOverlay')?.classList.remove('open');
  }
  function wireCodesMode(){
    const choice = document.querySelector('[data-wz-name="codes-mode"]');
    if(!choice || choice.dataset.wzCodesWired) return;
    choice.dataset.wzCodesWired = '1';
    choice.addEventListener('click', e => {
      const card = e.target.closest('.toggle-card');
      if(card) requestCodesMode(card.dataset.val);
    });
    choice.addEventListener('keydown', e => {
      const card = e.target.closest('.toggle-card');
      if(!card) return;
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); requestCodesMode(card.dataset.val); }
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
        e.preventDefault();
        const other = [...choice.querySelectorAll('.toggle-card')].find(c => c !== card);
        other?.focus();
      }
    });
  }

  /* Qué incentivos llevan códigos (hoy solo categoría Bono). */
  function renderCodesScope(){
    const box = document.getElementById('wzCodesScope');
    if(!box) return;
    const cards = [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')]
      .filter(c => !c.dataset.inactive).map((c, i) => readIncCard(c, i));
    const withCodes = cards.filter(m => m.catKey === 'bono');
    const without = cards.filter(m => m.catKey !== 'bono');
    box.innerHTML = `<div class="naowee-message__header"><div class="naowee-message__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>
      <div class="naowee-message__text">Solo los incentivos <strong>Bono</strong> llevan códigos: <strong>${withCodes.length} de ${cards.length}</strong>
        (${withCodes.map(m => escapeHtml(m.name)).join(', ')}).
        ${without.length ? `Los demás (${[...new Set(without.map(m => escapeHtml(m.catLbl)))].join(', ')}) se entregan sin código.` : ''}
        ${editingProgram()?.codes?.total ? `<br/>Este programa ya tiene <strong>${editingProgram().codes.total} códigos</strong>; carga más solo si hace falta.` : ''}</div></div>`;
  }

  function wireBudgetInputs(){
    const rubro = document.getElementById('wzRubroTotal');
    if(rubro && !rubro.dataset.wzBudgetWired){
      rubro.dataset.wzBudgetWired = '1';
      rubro.addEventListener('input', () => { updateBudget(); updateRubroAllocation(); });
    }
    // Inputs de "Valor unitario" en cada wz-inc-card → recalcular budget al cambiar.
    document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card__unit input').forEach(el => {
      if(el.dataset.wzBudgetWired) return;
      el.dataset.wzBudgetWired = '1';
      el.addEventListener('input', updateBudget);
    });
    wireRubroAllocationInputs();
  }

  /* Wires inputs de rubro per-card → recalcula la asignación en vivo (sólo en multi). */
  function wireRubroAllocationInputs(){
    document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card__rubro input').forEach(el => {
      if(el.dataset.wzAllocWired) return;
      el.dataset.wzAllocWired = '1';
      el.addEventListener('input', updateRubroAllocation);
    });
  }

  /* Renderiza/actualiza el resumen de asignación de rubro (paso 2, modo multi).
     Compara rubro total vs sumatoria de rubros per-card y muestra mensaje DS:
     - positive si exacto
     - informative si falta por asignar
     - negative si excede el total */
  function updateRubroAllocation(){
    const bx = document.getElementById('wzMultiBudget');
    if(!bx) return;
    {
      const t = parseMoney(document.getElementById('wzRubroTotal'));
      const all = [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')];
      const sm = all.reduce((acc, c) => acc + parseMoney(c.querySelector('.wz-inc-card__rubro input')), 0);
      if(!t || sm <= t){
        document.querySelectorAll('.wz-inc-card__rubro.wz-rubro-err').forEach(f => { clearError(f); f.classList.remove('wz-rubro-err'); });
      }
    }
    if(incTypesMode !== 'multi'){
      bx.hidden = true; bx.innerHTML = '';
      return;
    }
    const total = parseMoney(document.getElementById('wzRubroTotal'));
    const cards = [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')];
    const sum = cards.reduce((acc, c) => acc + parseMoney(c.querySelector('.wz-inc-card__rubro input')), 0);
    if(!total){
      bx.hidden = true; bx.innerHTML = '';
      return;
    }
    const fmt = n => `$${n.toLocaleString('es-CO')}`;
    const remaining = total - sum;
    let variant, iconSvg, text;
    if(sum > total){
      variant = 'negative';
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      text = `La sumatoria de rubros (<strong>${fmt(sum)}</strong>) excede el rubro total del programa (<strong>${fmt(total)}</strong>) por <strong>${fmt(sum - total)}</strong>.`;
    } else if(sum === total){
      variant = 'positive';
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      text = `Rubro asignado al 100% — <strong>${fmt(sum)}</strong> distribuido entre ${cards.length} incentivos.`;
    } else {
      variant = 'informative';
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;
      text = `Rubro asignado: <strong>${fmt(sum)}</strong> de <strong>${fmt(total)}</strong>. Restante por asignar: <strong>${fmt(remaining)}</strong>.`;
    }
    bx.hidden = false;
    bx.innerHTML = `
      <div class="naowee-message naowee-message--${variant}">
        <div class="naowee-message__header">
          <div class="naowee-message__icon">${iconSvg}</div>
          <div class="naowee-message__text">${text}</div>
        </div>
      </div>`;
  }

  /* ══ Códigos uno por uno ══
     Un bloque por incentivo Bono con un campo de etiquetas: se escribe el
     código y Enter (o coma) lo agrega; pegar una lista agrega varios.
     Reglas: solo letras sin tilde, números, guion medio (-) y bajo (_);
     únicos en todo el programa (sin distinguir mayúsculas); si el incentivo
     tiene rubro y valor unitario, no más de los esperados.
     Los códigos viven en la tarjeta del incentivo (card._codes). */
  /* Incentivos que llevan códigos (hoy solo categoría Bono — ver pendientes). */
  function codeIncentives(){
    return [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')]
      .map((c, i) => ({ card: c, ...readIncCard(c, i) }))
      .filter(m => m.catKey === 'bono' && !m.card.dataset.inactive);
  }
  const CODE_BAD = /[^A-Za-z0-9_-]/g;
  const CODE_SPLIT = /[\s,;]+/;
  const DEMO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function manualCodesOf(card){ return card._codes || (card._codes = []); }
  function allManualCodes(){ return codeIncentives().flatMap(m => manualCodesOf(m.card).map(code => ({ code, m }))); }
  function expectedFor(card){
    const r = parseMoney(card.querySelector('.wz-inc-card__rubro input'));
    const u = parseMoney(card.querySelector('.wz-inc-card__unit input'));
    return r && u ? Math.floor(r / u) : 0;
  }
  function addCodesTo(card, tokens){
    const codes = manualCodesOf(card);
    const exp = expectedFor(card);
    const taken = new Map(allManualCodes().map(x => [x.code.toUpperCase(), x.m.name]));
    (editingProgram()?.manualCodes || []).forEach(c => taken.set(String(c).toUpperCase(), 'el inventario del programa'));
    const existing = card._existingCodes || 0;
    const res = { added: 0, dup: [], invalid: [], over: 0 };
    tokens.map(t => t.trim()).filter(Boolean).forEach(t => {
      if(t.replace(CODE_BAD, '') !== t){ res.invalid.push(t); return; }
      const k = t.toUpperCase();
      if(taken.has(k)){ res.dup.push({ code: t, where: taken.get(k) }); return; }
      if(exp && existing + codes.length >= exp){ res.over++; return; }
      codes.push(t); taken.set(k, ''); res.added++;
    });
    const msgs = [];
    const list = arr => arr.slice(0, 3).map(escapeHtml).join(', ') + (arr.length > 3 ? '…' : '');
    if(res.dup.length) msgs.push(`${res.dup.length === 1 ? `<strong>${escapeHtml(res.dup[0].code)}</strong> ya está cargado` : `${res.dup.length} códigos repetidos omitidos (${list(res.dup.map(d => d.code))})`}${res.dup.length === 1 && res.dup[0].where ? ` en ${escapeHtml(res.dup[0].where)}` : ''}.`);
    if(res.invalid.length) msgs.push(`${res.invalid.length} con caracteres no permitidos omitidos (${list(res.invalid)}). Solo letras sin tilde, números, - y _.`);
    if(res.over) msgs.push(`${res.over} omitidos: el rubro de este incentivo alcanza para ${exp} códigos.`);
    card._codesMsg = msgs.length ? { type: 'negative', html: (res.added ? `Se agregaron ${res.added}. ` : '') + msgs.join(' ') } : null;
    return res;
  }
  function demoCodes(card){
    const codes = manualCodesOf(card);
    const exp = expectedFor(card);
    const n = exp ? Math.min(5, exp - (card._existingCodes || 0) - codes.length) : 5;
    if(n <= 0){ card._codesMsg = { type: 'negative', html: `El rubro de este incentivo alcanza para ${exp} códigos; ya están todos.` }; return; }
    const taken = new Set(allManualCodes().map(x => x.code.toUpperCase()));
    const out = [];
    while(out.length < n){
      let c = 'DEMO-';
      for(let i = 0; i < 6; i++) c += DEMO_CHARS[Math.floor(Math.random() * DEMO_CHARS.length)];
      if(!taken.has(c)){ taken.add(c); out.push(c); }
    }
    addCodesTo(card, out);
  }
  function manualBlockHTML(m){
    const codes = manualCodesOf(m.card);
    const exp = expectedFor(m.card);
    const n = codes.length;
    const status = !exp
      ? `<span class="naowee-badge naowee-badge--neutral naowee-badge--quiet naowee-badge--small">Sin rubro · sin límite</span>`
      : n + (m.card._existingCodes || 0) >= exp ? `<span class="naowee-badge naowee-badge--positive naowee-badge--quiet naowee-badge--small">Completo</span>`
      : `<span class="naowee-badge naowee-badge--caution naowee-badge--quiet naowee-badge--small">Faltan ${exp - n - (m.card._existingCodes || 0)}</span>`;
    const msg = m.card._codesMsg;
    return `
      <div class="wz-mc" data-mc-idx="${m.idx}">
        <div class="wz-mc__head">
          <span class="wz-mc__name">${escapeHtml(m.name)}</span>
          <span class="wz-mc__count"><strong>${n}</strong> ${n === 1 ? 'nuevo' : 'nuevos'}${m.card._existingCodes ? ` · ${m.card._existingCodes} ya cargados` : ''}${exp ? ` · caben ${exp}` : ''}</span>
          ${status}
        </div>
        <div class="wz-mc__field${msg ? ' wz-mc__field--error' : ''}">
          ${codes.map((c, ci) => `<span class="naowee-tag naowee-tag--small wz-mc__chip">${escapeHtml(c)}<button type="button" class="wz-mc__rm" data-mc-remove="${ci}" aria-label="Quitar ${escapeHtml(c)}">×</button></span>`).join('')}
          <input class="wz-mc__input" type="text" maxlength="40" autocomplete="off" spellcheck="false"
            placeholder="${n ? 'Otro código…' : 'Escribe un código y presiona Enter, o pega una lista'}" aria-label="Códigos de ${escapeHtml(m.name)}"/>
        </div>
        <div class="wz-mc__foot">
          <span class="wz-mc__msg${msg ? ' wz-mc__msg--' + msg.type : ''}" role="status">${msg ? msg.html : 'Letras sin tilde, números, guion medio (-) y bajo (_). Sin espacios.'}</span>
          <button type="button" class="wz-mc__demo" data-mc-demo title="Solo demo: en el producto los códigos los entrega el ministerio">
            <span class="naowee-badge naowee-badge--caution naowee-badge--small">Solo demo</span> Generar 5 al azar
          </button>
        </div>
      </div>`;
  }
  function renderManualCodes(focusIdx){
    const box = document.getElementById('wzManualCodes');
    if(!box) return;
    const bonos = codeIncentives();
    box.innerHTML = bonos.map(manualBlockHTML).join('');
    if(focusIdx !== undefined){
      box.querySelector(`.wz-mc[data-mc-idx="${focusIdx}"] .wz-mc__input`)?.focus();
    }
    updateBudget();
  }
  function wireManualCodes(){
    const box = document.getElementById('wzManualCodes');
    if(!box || box.dataset.mcWired) return;
    box.dataset.mcWired = '1';
    const blockOf = el => {
      const b = el.closest('.wz-mc');
      const idx = +b.dataset.mcIdx;
      const m = codeIncentives().find(x => x.idx === idx);
      return { idx, card: m?.card };
    };
    const commit = (input, extra) => {
      const { idx, card } = blockOf(input);
      if(!card) return;
      const tokens = [...(extra || []), input.value];
      if(!tokens.some(t => t.trim())) return;
      addCodesTo(card, tokens);
      isDirty = true;
      renderManualCodes(idx);
    };
    box.addEventListener('keydown', e => {
      const input = e.target.closest('.wz-mc__input');
      if(!input) return;
      if(e.key === 'Enter' || e.key === ','){ e.preventDefault(); commit(input); }
      else if(e.key === 'Backspace' && !input.value){
        const { idx, card } = blockOf(input);
        const codes = manualCodesOf(card);
        if(codes.length){ codes.pop(); card._codesMsg = null; isDirty = true; renderManualCodes(idx); }
      }
    });
    // Escribir: se quitan en vivo los caracteres no permitidos
    box.addEventListener('input', e => {
      const input = e.target.closest('.wz-mc__input');
      if(!input) return;
      const clean = input.value.replace(CODE_BAD, '');
      const msgEl = input.closest('.wz-mc').querySelector('.wz-mc__msg');
      if(clean !== input.value){
        input.value = clean;
        msgEl.className = 'wz-mc__msg wz-mc__msg--negative';
        msgEl.textContent = 'Ese carácter no se permite: solo letras sin tilde, números, - y _.';
      }
    });
    // Pegar: una lista (líneas, comas, espacios o tabulaciones) agrega varios
    box.addEventListener('paste', e => {
      const input = e.target.closest('.wz-mc__input');
      if(!input) return;
      const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      e.preventDefault();
      const tokens = text.split(CODE_SPLIT);
      const current = input.value; input.value = '';
      commit(input, [current, ...tokens]);
    });
    box.addEventListener('focusout', e => {
      const input = e.target.closest('.wz-mc__input');
      if(input && input.value.trim() && !e.relatedTarget?.closest?.('[data-mc-demo],[data-mc-remove]')) commit(input);
    });
    box.addEventListener('click', e => {
      const rm = e.target.closest('[data-mc-remove]');
      const demo = e.target.closest('[data-mc-demo]');
      const field = e.target.closest('.wz-mc__field');
      if(rm){
        const { idx, card } = blockOf(rm);
        manualCodesOf(card).splice(+rm.dataset.mcRemove, 1);
        card._codesMsg = null; isDirty = true; renderManualCodes(idx);
      } else if(demo){
        const { idx, card } = blockOf(demo);
        demoCodes(card); isDirty = true; renderManualCodes(idx);
      } else if(field){
        field.querySelector('.wz-mc__input')?.focus();
      }
    });
  }

  /* La primera condición ahora se siembra dentro de renderCondPanels(),
     que se encarga de generar los paneles del paso 3 al entrar a ese paso. */
  function seedFirstCondition(){ /* no-op — manejado por renderCondPanels */ }

  /* Tipos de beneficiario — salen de los parámetros 2026 de Juegos
     Intercolegiados (xlsx). El tipo se elige en cada incentivo (reunión 22-09,
     00:13:55) y las condiciones del paso 3 dependen de él. */
  const BENEF_TYPES = [
    { key:'deportista',     label:'Deportista' },
    { key:'paradeportista', label:'Paradeportista' },
    { key:'entrenador',     label:'Docente / Entrenador' },
    { key:'asistente',      label:'Docente / Asistente (deportes de conjunto)' },
    { key:'institucion',    label:'Institución educativa' },
    { key:'organizacion',   label:'Organización para personas con discapacidad' }
  ];
  const BENEF_LABEL = Object.fromEntries(BENEF_TYPES.map(b => [b.key, b.label]));
  const CATEGORIES = [
    ['bono','Bono'], ['credito','Crédito condonable'], ['kit','Kit'], ['beca','Beca'],
    ['transporte','Transporte'], ['inscripcion','Inscripción'], ['pase','Pase / acceso'], ['dinero','Dinero']
  ];
  const CAT_KEY_BY_LABEL = Object.fromEntries(CATEGORIES.map(([k, l]) => [l.toLowerCase(), k]));

  /* Tooltip del DS (naowee-tooltip) con un ícono de ayuda junto al label. */
  const TIP_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  function tipHTML(text, alignEnd = false){
    return `<span class="naowee-tooltip naowee-tooltip--bottom wz-tip${alignEnd ? ' wz-tip--end' : ''}" tabindex="0" role="button" aria-label="Ayuda">${TIP_ICON}<span class="naowee-tooltip__content" role="tooltip">${text}</span></span>`;
  }
  const TIPS = {
    rubroInc: 'Parte del <strong>rubro total</strong> que se destina a este incentivo. Ej.: de $20.000.000 del programa, $10.000.000 para bonos. La suma de todos los incentivos no puede superar el rubro total.',
    unit: 'Lo que vale <strong>cada</strong> incentivo entregado. Ej.: cada bono $100.000. Con el rubro del incentivo define cuántos códigos se esperan: rubro ÷ valor unitario.'
  };

  /* SOLO DEMO · Nota para devs con las validaciones de cada paso.
     Una sola fuente; [data-dev-validations="N"] pinta las del paso N. */
  const DEV_VALIDATIONS = [
    ['Paso 1 · Datos', [
      'Obligatorios: nombre y cobertura territorial.',
      'Vigencia opcional. Si se llenan ambas fechas, "hasta" debe ser posterior a "desde". Sin fechas: sin cierre.',
      'Gestor de programa y operadores: opcionales.',
      'Código del programa: PRG-AAAA-NNN (año de creación + consecutivo del año). Lo asigna el backend y no cambia al editar.'
    ]],
    ['Paso 2 · Incentivos y rubro', [
      'Por incentivo son obligatorios: nombre, tipo de beneficiario y categoría. Mínimo 1 incentivo.',
      'Solo la categoría Bono lleva códigos. Si ningún incentivo es Bono, el paso 4 (Códigos) no aparece y se activa desde el paso 3. Crédito condonable, Kit y demás se entregan sin código (pendiente de confirmar).',
      'Editar un programa existente: un incentivo con entregas NO se borra, se desactiva (no se entrega más, queda en el historial; se puede reactivar). Con códigos y sin entregas: se confirma y sus códigos disponibles se descartan del inventario. Sin nada: se borra. Siempre queda al menos un incentivo activo.',
      'Incentivo nuevo al editar: al guardar pasa a definir sus condiciones; sus códigos se cargan después desde la pestaña Códigos.',
      'Rubro total, rubro del incentivo y valor unitario son opcionales.',
      'Con rubro total: la suma de los rubros por incentivo no puede superarlo (bloquea). Si es menor, solo informa lo restante.',
      'Con rubro del incentivo y valor unitario: el valor unitario no puede superar el rubro del incentivo (bloquea).',
      'División no exacta (ej.: 10M ÷ 300k): se permite; códigos esperados = piso(rubro ÷ valor unitario). Regla pendiente de definir.'
    ]],
    ['Paso 3 · Condiciones', [
      'Armador simple: todas las condiciones de un incentivo se cumplen a la vez (Y). No hay grupos O.',
      'Toda condición necesita campo y al menos un valor; cada incentivo necesita al menos una condición (bloquea).',
      'Regla = { campo, operador, valores[] }. Campos según tipo de beneficiario; valores de listas cerradas (sin texto libre). Un campo no se repite en el mismo incentivo.',
      'Tipo de beneficiario siempre es la primera regla (no se edita aquí; sale del paso 2).',
      'Vista compacta de solo lectura; "Personalizar" abre la edición y "Listo" la cierra (valida el incentivo).',
      'En edición los valores se muestran como botones con todas las opciones visibles: "es uno de" permite varios; "=", "≤" y "≥" permiten uno.',
      'Solo demo: la plantilla de Intercolegiados precarga condiciones para las combinaciones del xlsx de parámetros; un incentivo sin condiciones arranca en edición.',
      'Cambiar tipo de beneficiario o categoría en el paso 2 reinicia las condiciones de ese incentivo.',
      'Paradeportista usa las reglas de Deportista (pendiente de confirmar).'
    ]],
    ['Paso 4 · Códigos (solo incentivos Bono)', [
      'Solo los incentivos de categoría Bono llevan códigos; el paso solo aparece si hay al menos uno. La plantilla, la carga manual y el conteo incluyen únicamente los Bono.',
      'Crédito condonable, Kit y demás categorías se entregan sin código (regla de la demo, pendiente de confirmar con Danna).',
      'Para activar se necesita al menos un código (o un archivo cargado).',
      'Uno por uno: un bloque por incentivo Bono con campo de etiquetas. Enter o coma agrega; pegar una lista (líneas, comas, espacios o tabulaciones) agrega varios; Backspace en vacío quita el último.',
      'Caracteres: solo letras sin tilde, números, guion medio (-) y bajo (_). Al escribir se quitan en vivo; al pegar se omiten los inválidos y se informa. Archivo con inválidos: bloquea.',
      'Unicidad en vivo en todo el programa (sin distinguir mayúsculas): un repetido no entra y se dice en qué incentivo está.',
      'Solo demo: "Generar 5 al azar" crea códigos DEMO-XXXXXX. En el producto los códigos los entrega el ministerio (RN-05.1).',
      'Códigos únicos: repetidos en el archivo bloquean la activación.',
      'Con rubro y valor unitario: no más códigos de los esperados por incentivo (bloquea). Menos: se permite y muestra "Faltan N".',
      'Sin rubro: se aceptan todos los códigos cargados.',
      'Forma de carga: plantilla Excel O uno por uno (excluyentes). Al cambiar con códigos ya cargados, pide confirmación y descarta los de la otra forma.',
      'Plantilla .xlsx generada en el front: hoja Códigos (tipo_incentivo como lista desplegable con los incentivos Bono + codigo como texto), hoja Instrucciones con códigos esperados por incentivo.',
      'Archivo subido (.xlsx o .csv) se lee en el front y se valida igual que la carga manual.'
    ]]
  ];
  function renderDevValidations(){
    document.querySelectorAll('[data-dev-validations]').forEach(el => {
      const [title, items] = DEV_VALIDATIONS[(+el.dataset.devValidations || 1) - 1] || ['', []];
      el.innerHTML = `
        <span class="naowee-badge naowee-badge--caution naowee-badge--small">Solo demo</span>
        Validaciones para devs
        <span class="wz-devnote__pop" role="tooltip">
          <span class="wz-devnote__head">${title} <em>· nota para devs, no es parte del producto</em></span>
          <ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>
        </span>`;
    });
  }

  function ddHTML({ name, label, placeholder, options, required }){
    return `
        <div class="naowee-dropdown" data-wz-dropdown data-wz-name="${name}"${required ? ' data-wz-required' : ''}>
          <label class="naowee-dropdown__label${required ? ' naowee-dropdown__label--required' : ''}">${label}</label>
          <div class="naowee-dropdown__trigger" tabindex="0">
            <span class="naowee-dropdown__placeholder">${placeholder}</span>
            <div class="naowee-dropdown__controls">
              <span class="naowee-dropdown__chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
            </div>
          </div>
          <div class="naowee-dropdown__menu" role="listbox">
            ${options.map(([v, l]) => `<div class="naowee-dropdown__option" data-val="${v}">${escapeHtml(l)}</div>`).join('')}
          </div>
        </div>`;
  }

  /* Setea programáticamente un naowee-dropdown (single o multi) replicando
     el visual que deja upgradeDropdowns al hacer clic. */
  function setDropdownValue(dd, vals){
    if(!dd) return;
    const opts = [...dd.querySelectorAll('.naowee-dropdown__option')];
    opts.forEach(o => o.classList.toggle('naowee-dropdown__option--selected', vals.includes(o.dataset.val)));
    const selected = opts.filter(o => vals.includes(o.dataset.val));
    const trigger = dd.querySelector('.naowee-dropdown__trigger');
    let valEl = dd.querySelector('.naowee-dropdown__value');
    if(!valEl && trigger){
      valEl = document.createElement('span');
      valEl.className = 'naowee-dropdown__value';
      trigger.insertBefore(valEl, trigger.firstChild);
    }
    const ph = dd.querySelector('.naowee-dropdown__placeholder');
    dd.dataset.wzValue = selected.map(o => o.dataset.val).join(',');
    if(!selected.length){
      if(valEl){ valEl.textContent = ''; valEl.style.display = 'none'; }
      if(ph) ph.style.display = '';
      return;
    }
    if(ph) ph.style.display = 'none';
    if(valEl){
      valEl.style.display = '';
      valEl.textContent = selected.length <= 3
        ? selected.map(o => o.textContent.trim()).join(', ')
        : `${selected.length} seleccionados`;
    }
    clearError(dd);
  }

  let incTypesMode = 'multi'; // siempre lista de 1..N incentivos
  let incCounter = 0;

  function addIncentive(opts = {}){
    const list = document.getElementById('wzIncList');
    if(!list) return null;
    incCounter++;
    const idx = incCounter;
    const card = document.createElement('div');
    card.className = 'wz-inc-card';
    card.dataset.idx = idx;
    card.innerHTML = `
      <div class="wz-inc-card__head">
        <span class="wz-inc-card__badge naowee-badge naowee-badge--neutral naowee-badge--quiet naowee-badge--small">Incentivo #${list.children.length + 1}</span>
        <button type="button" class="wz-inc-card__remove" onclick="removeIncentive(this)" aria-label="Eliminar incentivo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="wz-grid wz-inc-card__grid">
        <div class="naowee-textfield" data-wz-required>
          <label class="naowee-textfield__label naowee-textfield__label--required">Nombre del incentivo</label>
          <div class="naowee-textfield__input-wrap">
            <input class="naowee-textfield__input" type="text" placeholder="Ej. Bono deportivo · Deportistas" data-wz-input="text" maxlength="100"/>
          </div>
        </div>
        ${ddHTML({ name:'beneficiario', label:'Tipo de beneficiario', placeholder:'¿A quién va dirigido?', options: BENEF_TYPES.map(b => [b.key, b.label]), required: true })}
        ${ddHTML({ name:'categoria', label:'Categoría', placeholder:'Selecciona categoría', options: CATEGORIES, required: true })}
        <div class="naowee-textfield wz-inc-card__rubro" data-wz-name="rubro">
          <label class="naowee-textfield__label">Rubro del incentivo <span class="wz-inc-card__optional">(opcional)</span> ${tipHTML(TIPS.rubroInc, true)}</label>
          <div class="naowee-textfield__input-wrap">
            <span class="naowee-textfield__prefix" style="padding:0 10px;color:var(--naowee-color-text-secondary)">$</span>
            <input class="naowee-textfield__input" type="text" inputmode="numeric" placeholder="0" data-wz-input="money"/>
          </div>
        </div>
        <div class="naowee-textfield wz-inc-card__unit" data-wz-name="unitario">
          <label class="naowee-textfield__label">Valor unitario <span class="wz-inc-card__optional">(opcional)</span> ${tipHTML(TIPS.unit)}</label>
          <div class="naowee-textfield__input-wrap">
            <span class="naowee-textfield__prefix" style="padding:0 10px;color:var(--naowee-color-text-secondary)">$</span>
            <input class="naowee-textfield__input" type="text" inputmode="numeric" placeholder="0" data-wz-input="money"/>
          </div>
          <div class="naowee-helper"><div class="naowee-helper__text wz-inc-card__unit-hint">Monto por beneficiario.</div></div>
        </div>
      </div>`;
    list.appendChild(card);
    upgradeDropdowns();
    wireInputMasks();
    wireBudgetInputs();
    refreshIncCardHints();
    renumberIncCards();
    if(opts.focus !== false){
      const firstInput = card.querySelector('input');
      if(firstInput) firstInput.focus();
    }
    return card;
  }

  function renumberIncCards(){
    const cards = [...document.querySelectorAll('#wzIncList .wz-inc-card')];
    cards.forEach((c, i) => {
      const b = c.querySelector('.wz-inc-card__badge');
      if(b) b.textContent = `Incentivo #${i + 1}`;
    });
    const list = document.getElementById('wzIncList');
    if(list) list.classList.toggle('wz-inc-list--single', cards.length <= 1);
  }

  /* Cuando un incentivo cambia de categoría (especialmente a/desde "bono"),
     actualizamos:
     1) la visibilidad del paso 4 en el stepper
     2) el label del CTA (Continuar vs Activar) si estamos en el último paso
     3) el helper del Valor unitario (texto explica si genera códigos o no) */
  function onCategoriaChange(){
    refreshIncCardHints();
    renderStep();
  }
  /* Delegado a nivel document — un solo listener para todo el ciclo de vida del wizard. */
  let categoriaWatcherWired = false;
  function wireCategoriaWatcher(){
    if(categoriaWatcherWired) return;
    categoriaWatcherWired = true;
    document.addEventListener('click', e => {
      const opt = e.target.closest('.naowee-dropdown__option');
      if(!opt) return;
      const dd = opt.closest('[data-wz-name="categoria"], [data-wz-name="beneficiario"]');
      if(!dd) return;
      // El handler de upgradeDropdowns corre primero (mismo bubbling) y setea
      // dd.dataset.wzValue. Esperamos al siguiente tick para leerlo ya actualizado.
      setTimeout(onCategoriaChange, 0);
    }, true);
  }

  function restoreUnitHint(uField){
    if(uField.querySelector('.naowee-helper')) return;
    const h = document.createElement('div');
    h.className = 'naowee-helper';
    h.innerHTML = '<div class="naowee-helper__text wz-inc-card__unit-hint">Monto por beneficiario.</div>';
    uField.appendChild(h);
    refreshIncCardHints();
  }

  function refreshIncCardHints(){
    document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card').forEach(card => {
      const cat = (card.querySelector('[data-wz-name="categoria"]')?.dataset?.wzValue || '').toLowerCase();
      const hint = card.querySelector('.wz-inc-card__unit-hint');
      if(!hint) return;
      hint.textContent = cat === 'bono'
        ? 'Valor por código generado.'
        : 'Monto por beneficiario.';
    });
  }

  /* Borrar un incentivo:
     - con entregas: no se borra, se desactiva (no se entrega más, queda en el historial);
     - con códigos y sin entregas: se confirma y se descartan sus códigos disponibles;
     - sin nada: se borra. */
  let pendingIncDelete = null;
  function removeIncentive(btn){
    const card = btn.closest('.wz-inc-card');
    if(!card) return;
    const list = document.getElementById('wzIncList');
    const active = [...list.querySelectorAll('.wz-inc-card')].filter(c => !c.dataset.inactive);
    const o = card._orig;
    if(o && o.delivered > 0){
      if(active.length <= 1){ showToast('El programa debe tener al menos un incentivo activo.', 'informative'); return; }
      card.dataset.inactive = '1';
      refreshIncCardState(card);
      isDirty = true; onCategoriaChange();
      showToast(`"${o.name}" tiene ${o.delivered} entregas: se desactivó en lugar de borrarse.`, 'informative');
      return;
    }
    if(active.length <= 1 && !card.dataset.inactive) return; // siempre al menos uno activo
    if(o && o.codes > 0){
      pendingIncDelete = card;
      const sub = document.getElementById('wzIncDeleteSub');
      if(sub) sub.textContent = `"${o.name}" no tiene entregas, pero tiene ${o.codes} códigos disponibles que se descartarán del inventario.`;
      document.getElementById('wzIncDeleteOverlay')?.classList.add('open');
      return;
    }
    doRemoveIncentive(card);
  }
  function doRemoveIncentive(card){
    card.remove();
    renumberIncCards();
    isDirty = true;
    onCategoriaChange();
    updateRubroAllocation();
  }
  function confirmIncDelete(){
    document.getElementById('wzIncDeleteOverlay')?.classList.remove('open');
    if(pendingIncDelete) doRemoveIncentive(pendingIncDelete);
    pendingIncDelete = null;
  }
  function cancelIncDelete(){
    pendingIncDelete = null;
    document.getElementById('wzIncDeleteOverlay')?.classList.remove('open');
  }
  function reactivateIncentive(btn){
    const card = btn.closest('.wz-inc-card');
    if(!card) return;
    delete card.dataset.inactive;
    refreshIncCardState(card);
    isDirty = true; onCategoriaChange();
  }
  /* Pinta el estado de la tarjeta: desactivado (con sus entregas) o normal. */
  function refreshIncCardState(card){
    const head = card.querySelector('.wz-inc-card__head');
    if(!head) return;
    head.querySelector('.wz-inc-card__state')?.remove();
    const off = !!card.dataset.inactive;
    card.classList.toggle('wz-inc-card--inactive', off);
    card.querySelectorAll('input, .naowee-dropdown__trigger').forEach(el => {
      if(off){ el.setAttribute('tabindex', '-1'); if(el.tagName === 'INPUT') el.disabled = true; }
      else { el.removeAttribute('tabindex'); if(el.tagName === 'INPUT') el.disabled = false; if(!el.tagName || el.tagName !== 'INPUT') el.setAttribute('tabindex', '0'); }
    });
    const rm = head.querySelector('.wz-inc-card__remove');
    if(off){
      const st = document.createElement('span');
      st.className = 'wz-inc-card__state';
      st.innerHTML = `<span class="naowee-badge naowee-badge--neutral naowee-badge--small">Desactivado · ${card._orig?.delivered || 0} entregas</span>
        <button type="button" class="naowee-btn naowee-btn--link naowee-btn--small" onclick="reactivateIncentive(this)">Reactivar</button>`;
      head.insertBefore(st, rm);
      if(rm) rm.hidden = true;
    } else if(rm){
      rm.hidden = false;
      rm.title = card._orig?.delivered ? `Tiene ${card._orig.delivered} entregas: se desactivará` : 'Eliminar incentivo';
    }
  }

  /* ══ Step-3 — condiciones dinámicas (Edad, Género, Categoría, Logros, Tipo de usuario) ══
     `multi: true` habilita selección múltiple en el dropdown de valor. Para esos
     campos los operadores son ∈ (in) y ∉ (nin) — encajan con un set de valores. */
  const COND_FIELDS = {
    edad:        { label: 'Edad',                operators: [['gte','≥'],['lte','≤'],['eq','='],['neq','≠']], valueType: 'number', placeholder: 'Años' },
    genero:      { label: 'Género',              operators: [['eq','='],['neq','≠']],                         valueType: 'select',  options: [['masculino','Masculino'],['femenino','Femenino'],['otro','Otro']] },
    categoria:   { label: 'Categoría deportiva', operators: [['in','∈'],['nin','∉']],                         valueType: 'select',  multi: true, options: [['infantil','Infantil'],['prejuvenil','Pre-juvenil'],['juvenil','Juvenil'],['junior','Junior'],['sub23','Sub-23'],['mayores','Mayores'],['master','Máster']] },
    logros:      { label: 'Logros',              operators: [['in','∈'],['nin','∉']],                         valueType: 'select',  multi: true, options: [['oro','Medalla de oro'],['plata','Medalla de plata'],['bronce','Medalla de bronce'],['top10','Top 10'],['participacion','Participación']] },
    tipoUsuario: { label: 'Tipo de usuario',     operators: [['in','∈'],['nin','∉']],                         valueType: 'select',  multi: true, options: [['deportista','Deportista'],['personal_apoyo','Personal de apoyo'],['entrenador','Entrenador'],['tecnico','Técnico'],['medico','Médico'],['fisioterapeuta','Fisioterapeuta'],['arbitro','Árbitro / Juez'],['delegado','Delegado'],['ciudadano','Ciudadano']] }
  };

  /* Reglas implícitas que se activan cuando una condición toma cierto valor.
     Se muestran como sub-condición auto-añadida (chip naowee-tag) bajo la fila,
     y se incluyen en la vista previa en lenguaje natural. */
  const COND_IMPLIED = {
    'tipoUsuario:personal_apoyo': 'Debe ser el primer entrenador en su historial.'
  };
  function getImpliedRule(fieldKey, value){
    return COND_IMPLIED[`${fieldKey}:${value}`] || null;
  }

  let condRowCounter = 0;
  let condGroupCounter = 0;

  function addConditionGroup(btn){
    // El botón vive dentro de un .wz-cond-panel — ese panel tiene su propio builder.
    // Si no se pasa botón (llamada interna desde seedFirstCondition), usamos el
    // primer panel que se encuentre.
    const panel = btn && btn.closest ? btn.closest('.wz-cond-panel') : document.querySelector('.wz-cond-panel');
    if(!panel) return;
    const builder = panel.querySelector('.cond-builder');
    if(!builder) return;
    if(builder.children.length > 0){
      const divider = document.createElement('div');
      divider.className = 'cond-or-divider';
      divider.innerHTML = `<span class="cond-or-divider__pill">OR</span>`;
      builder.appendChild(divider);
    }
    condGroupCounter++;
    const groupNum = builder.querySelectorAll('.cond-group').length + 1;
    const group = document.createElement('div');
    group.className = 'cond-group';
    group.dataset.groupId = condGroupCounter;
    group.innerHTML = `
      <div class="cond-group__head">
        <span class="cond-group__badge">Grupo ${groupNum} · Y</span>
      </div>
      <div class="cond-rows"></div>
      <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small wz-add-cond" onclick="addConditionRow(this)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Añadir condición
      </button>`;
    builder.appendChild(group);
    addConditionRow(group.querySelector('.add-cond'));
    renumberCondGroups(panel);
  }

  function removeConditionGroup(btn){
    const group = btn.closest('.cond-group');
    if(!group) return;
    const panel = group.closest('.wz-cond-panel');
    const prev = group.previousElementSibling;
    const next = group.nextElementSibling;
    if(prev && prev.classList.contains('cond-or-divider')) prev.remove();
    else if(next && next.classList.contains('cond-or-divider')) next.remove();
    group.remove();
    if(panel) renumberCondGroups(panel);
    refreshCondPreview();
  }

  function renumberCondGroups(panel){
    if(!panel){
      document.querySelectorAll('.wz-cond-panel').forEach(p => renumberCondGroups(p));
      return;
    }
    const groups = panel.querySelectorAll('.cond-group');
    groups.forEach((g, i) => {
      const badge = g.querySelector('.cond-group__badge');
      if(badge) badge.textContent = `Grupo ${i + 1} · Y`;
    });
  }

  /* ══ Condiciones de elegibilidad (reunión 22-09, 00:35:45 y 00:36:00) ══
     Armador SIMPLE, solo con lo que necesita Juegos Intercolegiados (JIN):
       - Todas las reglas se cumplen a la vez (Y). No hay grupos O.
       - Los campos dependen del tipo de beneficiario y los valores salen de
         listas cerradas (sin texto libre).
       - Regla = { campo, operador, valores[] }.
     Las combinaciones que define el reglamento (xlsx de parámetros 2026)
     vienen precargadas y bloqueadas; se pueden "Personalizar" (ej.: un bono
     para plata). Una combinación nueva arranca con el armador vacío.
     El armador AND/OR de la demo original (addConditionGroup/Row, COND_FIELDS)
     ya no se usa. */
  const FASES = ['Fase municipal', 'Fase final departamental', 'Fase final nacional'];
  const FIELD_CATALOG = {
    // Deportista / paradeportista
    logro:         { label: 'Logro en la final nacional', ops: ['in'], options: ['Primer puesto (oro)', 'Segundo puesto (plata)', 'Tercer puesto (bronce)'] },
    fase:          { label: 'Fase', ops: ['eq'], options: FASES },
    grado:         { label: 'Grado escolar al inscribirse', ops: ['lte', 'gte', 'in'], options: ['6°', '7°', '8°', '9°', '10°', '11°', '12° (escuela normal superior)'] },
    tipoDeporte:   { label: 'Tipo de deporte', ops: ['eq'], options: ['Individual', 'De conjunto'] },
    limite:        { label: 'Límite en deportes individuales', ops: ['eq'], options: ['1 incentivo por deportista (aunque gane varias pruebas)'] },
    // Docente entrenador / asistente
    resultado:     { label: 'Resultado del deportista o equipo', ops: ['in'], options: ['Oro en la final nacional', 'Plata en la final nacional', 'Bronce en la final nacional'] },
    inscritoDesde: { label: 'Inscrito con el deportista desde', ops: ['eq'], options: FASES },
    acompanoHasta: { label: 'Lo acompañó hasta', ops: ['eq'], options: FASES },
    relacion:      { label: 'Relación con el deportista', ops: ['eq'], options: ['Registrado con el deportista en la inscripción'] },
    // Institución / organización
    tipoEntidad:   { label: 'Tipo de entidad', ops: ['in'], options: ['Establecimiento educativo público', 'Establecimiento educativo privado', 'Organización que atiende personas con discapacidad'] },
    grupoDeportes: { label: 'Grupo de deportes', ops: ['eq'], options: ['Deportes convencionales', 'Para deportes'] },
    ranking:       { label: 'Criterio del ranking', ops: ['eq'], options: ['Más medallas de oro', 'Más medallas en total', 'Más deportistas clasificados a la final nacional'] },
    desempate:     { label: 'Desempate', ops: ['eq'], options: ['Plata → bronce → más deportistas clasificados'] },
    puestos:       { label: 'Puestos que reciben', ops: ['eq'], options: ['Solo el 1er lugar', '1er y 2º lugar', '1º a 3er lugar'] }
  };
  const BENEF_GROUP = { deportista: 'athlete', paradeportista: 'athlete', entrenador: 'docente', asistente: 'docente', institucion: 'entity', organizacion: 'entity' };
  const FIELDS_BY_GROUP = {
    athlete: ['logro', 'fase', 'grado', 'tipoDeporte', 'limite'],
    docente: ['resultado', 'tipoDeporte', 'inscritoDesde', 'acompanoHasta', 'relacion'],
    entity:  ['tipoEntidad', 'grupoDeportes', 'ranking', 'desempate', 'puestos']
  };
  const OP_LABEL = { eq: '=', in: 'es uno de', lte: '≤', gte: '≥' };
  const OP_TEXT  = { eq: 'es', in: 'es', lte: 'hasta', gte: 'desde' };
  const R = (field, op, values) => ({ field, op, values: [].concat(values) });

  /* Combinaciones que define el reglamento (tipo de beneficiario : categoría). */
  const INDIV = R('limite', 'eq', '1 incentivo por deportista (aunque gane varias pruebas)');
  const DOCENTE = [R('inscritoDesde', 'eq', 'Fase municipal'), R('acompanoHasta', 'eq', 'Fase final departamental'), R('relacion', 'eq', 'Registrado con el deportista en la inscripción')];
  const RANKING = [R('ranking', 'eq', 'Más medallas de oro'), R('desempate', 'eq', 'Plata → bronce → más deportistas clasificados'), R('puestos', 'eq', 'Solo el 1er lugar')];
  const PRESET_RULES = {
    'deportista:bono':    [R('logro', 'in', 'Primer puesto (oro)'), R('fase', 'eq', 'Fase final nacional'), R('grado', 'lte', '11°'), INDIV],
    'deportista:credito': [R('logro', 'in', 'Primer puesto (oro)'), R('fase', 'eq', 'Fase final nacional'), R('grado', 'in', ['11°', '12° (escuela normal superior)']), INDIV],
    'entrenador:bono':    [R('resultado', 'in', 'Oro en la final nacional'), ...DOCENTE],
    'entrenador:credito': [R('resultado', 'in', 'Oro en la final nacional'), ...DOCENTE],
    'asistente:bono':     [R('tipoDeporte', 'eq', 'De conjunto'), R('resultado', 'in', 'Oro en la final nacional'), ...DOCENTE],
    'institucion:kit':    [R('tipoEntidad', 'in', ['Establecimiento educativo público', 'Establecimiento educativo privado']), R('grupoDeportes', 'eq', 'Deportes convencionales'), ...RANKING],
    'organizacion:kit':   [R('tipoEntidad', 'in', 'Organización que atiende personas con discapacidad'), R('grupoDeportes', 'eq', 'Para deportes'), ...RANKING]
  };
  /* Paradeportista: el xlsx no lo separa; mismas reglas que Deportista (pendiente de confirmar). */
  PRESET_RULES['paradeportista:bono'] = PRESET_RULES['deportista:bono'];
  PRESET_RULES['paradeportista:credito'] = PRESET_RULES['deportista:credito'];
  const cloneRules = rules => rules.map(r => ({ field: r.field, op: r.op, values: [...r.values] }));

  function readIncCard(c, i){
    const name = (c.querySelector('input[type="text"]')?.value || '').trim() || `Incentivo #${i + 1}`;
    const catDd = c.querySelector('[data-wz-name="categoria"]');
    const benDd = c.querySelector('[data-wz-name="beneficiario"]');
    const catKey = (catDd?.dataset?.wzValue || '').toLowerCase();
    const benef = benDd?.dataset?.wzValue || '';
    return {
      idx: i, name, catKey, benef,
      catLbl: catDd?.querySelector('.naowee-dropdown__value')?.textContent?.trim() || '—',
      benefLbl: BENEF_LABEL[benef] || ''
    };
  }

  /* Estado de condiciones guardado en la tarjeta del incentivo (sobrevive a
     ir y volver entre pasos). Si cambia tipo de beneficiario o categoría, se
     reinicia: precargado del reglamento si existe, vacío si no. */
  function condState(card){
    const m = readIncCard(card, 0);
    const sig = `${m.benef}:${m.catKey}`;
    if(!card._cond || card._cond.sig !== sig){
      const preset = PRESET_RULES[sig];
      card._cond = { sig, rules: preset ? cloneRules(preset) : [], editing: !preset, error: '' };
    }
    return card._cond;
  }
  function cardRules(card){ return condState(card).rules; }
  function ruleSentence(r){
    const f = FIELD_CATALOG[r.field];
    const vals = r.values.map(v => `<strong>${escapeHtml(v)}</strong>`);
    return `${escapeHtml((f?.label || r.field).toLowerCase())} ${OP_TEXT[r.op] || r.op} ${r.op === 'in' ? vals.join(' o ') : vals.join(', ')}`;
  }
  function condSummary(card, m){
    const rules = cardRules(card).filter(r => r.values.length);
    if(!m.benef || !rules.length) return '';
    return `Recibe <strong>${escapeHtml(m.name)}</strong> cada ${escapeHtml(m.benefLbl.toLowerCase())} que cumpla <strong>todas</strong> estas condiciones: ${rules.map(ruleSentence).join('; ')}.`;
  }

  const LOCK_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>';
  const X_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';

  function valuesHTML(r){
    return r.values.map(v => `<span class="naowee-tag naowee-tag--small">${escapeHtml(v)}</span>`).join('');
  }
  /* Fila bloqueada (reglamento o tipo de beneficiario). */
  function lockedRowHTML(label, op, valsHTML){
    return `<div class="cond-row cond-row--locked">
        <div class="cond-locked__cell cond-locked__field">${escapeHtml(label)}</div>
        <div class="cond-locked__cell cond-locked__op">${escapeHtml(op)}</div>
        <div class="cond-locked__cell cond-locked__val">${valsHTML}</div>
      </div>`;
  }
  /* Desplegable del DS para el armador (se cablea con upgradeDropdowns). */
  const CHEV = '<span class="naowee-dropdown__chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>';
  function crDropdown({ kind, ri, options, selected, placeholder, multi }){
    const sel = options.filter(([v]) => selected.includes(v));
    const shown = sel.length ? escapeHtml(sel.map(([, l]) => l).join(', ')) : '';
    return `<div class="naowee-dropdown cond-dd" data-wz-dropdown ${multi ? 'data-wz-multi' : ''} data-cr-dd="${kind}" data-ri="${ri}" data-wz-value="${escapeHtml(selected.join(','))}">
        <div class="naowee-dropdown__trigger" tabindex="0">
          ${shown ? `<span class="naowee-dropdown__value">${shown}</span>` : `<span class="naowee-dropdown__placeholder">${placeholder}</span>`}
          <div class="naowee-dropdown__controls">${CHEV}</div>
        </div>
        <div class="naowee-dropdown__menu" role="listbox">
          ${options.map(([v, l]) => `<div class="naowee-dropdown__option${selected.includes(v) ? ' naowee-dropdown__option--selected' : ''}" data-val="${escapeHtml(v)}">${escapeHtml(l)}</div>`).join('')}
        </div>
      </div>`;
  }
  /* Fila editable: campo / operador / valor(es). Los campos ya usados no se repiten.
     Los valores se identifican por su posición en la lista (data-val = índice). */
  function editRowHTML(r, ri, group, used){
    const fields = (FIELDS_BY_GROUP[group] || []).filter(k => k === r.field || !used.includes(k));
    const f = FIELD_CATALOG[r.field];
    const fieldDd = crDropdown({ kind: 'field', ri, placeholder: 'Campo…', selected: r.field ? [r.field] : [],
      options: fields.map(k => [k, FIELD_CATALOG[k].label]) });
    const opCtl = !f
      ? `<div class="cond-locked__cell cond-locked__op">—</div>`
      : f.ops.length > 1
        ? crDropdown({ kind: 'op', ri, placeholder: 'Op.', selected: [r.op], options: f.ops.map(o => [o, OP_LABEL[o]]) })
        : `<div class="cond-locked__cell cond-locked__op">${OP_LABEL[r.op]}</div>`;
    const valCtl = !f
      ? '<div class="cond-locked__cell cond-simple__hint">Elige un campo</div>'
      : crDropdown({ kind: 'val', ri, multi: r.op === 'in',
          placeholder: r.op === 'in' ? 'Uno o varios…' : 'Valor…',
          selected: r.values.map(v => String(f.options.indexOf(v))).filter(x => x !== '-1'),
          options: f.options.map((o, oi) => [String(oi), o]) });
    return `<div class="cond-row cond-row--simple">
        ${fieldDd}${opCtl}${valCtl}
        <button type="button" class="x-btn" data-cr="remove" data-ri="${ri}" aria-label="Quitar condición">${X_SVG}</button>
      </div>`;
  }

  function panelHTML(card, i){
    const m = readIncCard(card, i);
    const head = `
      <div class="wz-cond-panel__head">
        <span class="wz-cond-panel__num">#${i + 1}</span>
        <span class="wz-cond-panel__title">${escapeHtml(m.name)}</span>
        ${m.benefLbl ? `<span class="naowee-badge naowee-badge--informative naowee-badge--quiet naowee-badge--small">${escapeHtml(m.benefLbl)}</span>` : ''}
        <span class="naowee-badge naowee-badge--neutral naowee-badge--quiet naowee-badge--small">${escapeHtml(m.catLbl)}</span>
      </div>`;
    if(!m.benef || !m.catKey){
      return head + `<div class="naowee-message naowee-message--caution"><div class="naowee-message__header"><div class="naowee-message__text">Elige el <strong>tipo de beneficiario</strong> y la <strong>categoría</strong> de este incentivo en el paso 2 para definir sus condiciones.</div></div></div>`;
    }
    const st = condState(card);
    const group = BENEF_GROUP[m.benef];
    const benefRow = lockedRowHTML('Tipo de beneficiario', '=', `<span class="naowee-tag naowee-tag--small">${escapeHtml(m.benefLbl)}</span>`);
    const used = st.rules.map(r => r.field);
    let notice, rowsHTML, actions;
    if(!st.editing){
      notice = `<div class="cond-locked__notice"><span>Condiciones del incentivo · todas deben cumplirse</span>
        <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small" data-cr="edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          Personalizar</button></div>`;
      rowsHTML = st.rules.map(r => lockedRowHTML(FIELD_CATALOG[r.field]?.label || r.field, OP_LABEL[r.op] || r.op, valuesHTML(r))).join('');
      actions = '';
    } else {
      notice = st.rules.length
        ? `<div class="cond-locked__notice"><span>Editando · elige el campo y marca sus valores. Todas deben cumplirse.</span>
            <button type="button" class="naowee-btn naowee-btn--loud naowee-btn--small" data-cr="done">Listo</button></div>`
        : `<div class="naowee-message naowee-message--informative cond-simple__intro"><div class="naowee-message__header"><div class="naowee-message__text">Este incentivo aún no tiene condiciones. Usa <strong>Añadir condición</strong>, elige un campo y marca sus valores. Todas deben cumplirse.</div></div></div>`;
      rowsHTML = st.rules.map((r, ri) => editRowHTML(r, ri, group, used)).join('');
      const canAdd = used.length < (FIELDS_BY_GROUP[group] || []).length;
      actions = canAdd ? `<button type="button" class="naowee-btn naowee-btn--quiet naowee-btn--small wz-add-cond" data-cr="add">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Añadir condición</button>` : `<div class="cond-simple__hint-inline">Ya usaste todos los campos disponibles para este tipo de beneficiario.</div>`;
    }
    const err = st.error ? `<div class="naowee-helper naowee-helper--negative cond-simple__error"><div class="naowee-helper__text">${st.error}</div></div>` : '';
    const summary = condSummary(card, m);
    return head + notice + `
      <div class="cond-builder cond-builder--locked"><div class="cond-group">
        <div class="cond-group__head"><span class="cond-group__badge">Todas se cumplen · Y</span></div>
        <div class="cond-rows">${benefRow}${rowsHTML}</div>
        ${actions}${err}
      </div></div>
      <div class="wz-cond-preview" data-empty="false"${summary ? '' : ' hidden'}>
        <div class="wz-cond-preview__head">
          <div class="wz-cond-preview__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div class="wz-cond-preview__title">Así lo verá el operador</div>
            <div class="wz-cond-preview__sub">Solo aparecen en la búsqueda quienes cumplen estas condiciones</div>
          </div>
        </div>
        <div class="wz-cond-preview__body">${summary}</div>
      </div>`;
  }

  function renderCondPanels(){
    const container = document.getElementById('wzCondPanels');
    if(!container) return;
    const cards = [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')];
    container.innerHTML = cards.map((c, i) =>
      (condOnlyNew && !condOnlyNew.has(c)) || c.dataset.inactive ? '' :
      `<div class="wz-cond-panel${c._cond?.error ? ' wz-cond-panel--error' : ''}" data-inc-idx="${i}">${panelHTML(c, i)}</div>`).join('');
    upgradeDropdowns();
    wireCondPanels(container);
  }
  function rerenderPanel(i){
    const panel = document.querySelector(`#wzCondPanels .wz-cond-panel[data-inc-idx="${i}"]`);
    const card = document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')[i];
    if(!panel || !card) return;
    panel.innerHTML = panelHTML(card, i);
    panel.classList.toggle('wz-cond-panel--error', !!card._cond?.error);
    upgradeDropdowns();
  }

  /* Un solo listener delegado para todas las acciones del armador simple. */
  function wireCondPanels(container){
    if(container.dataset.crWired) return;
    container.dataset.crWired = '1';
    const ctx = el => {
      const panel = el.closest('.wz-cond-panel');
      const i = +panel.dataset.incIdx;
      const card = document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')[i];
      return { i, card, st: condState(card), ri: +el.dataset.ri };
    };
    const done = (i, card) => { card._cond.error = ''; isDirty = true; rerenderPanel(i); };
    /* Desplegables del armador. En captura: el desplegable múltiple del DS
       detiene la propagación del clic en la opción. */
    container.addEventListener('click', e => {
      const opt = e.target.closest('.naowee-dropdown__option');
      const dd = opt && opt.closest('[data-cr-dd]');
      if(dd){
        // upgradeDropdowns ya actualizó dd.dataset.wzValue; leerlo en el siguiente tick
        setTimeout(() => {
          const { i, card, st, ri } = ctx(dd);
          const r = st.rules[ri];
          const vals = (dd.dataset.wzValue || '').split(',').filter(v => v !== '');
          const kind = dd.dataset.crDd;
          st.error = ''; isDirty = true;
          if(kind === 'field'){ r.field = vals[0] || ''; r.values = []; r.op = FIELD_CATALOG[r.field]?.ops[0] || 'eq'; rerenderPanel(i); }
          else if(kind === 'op'){ r.op = vals[0] || r.op; if(r.op !== 'in') r.values = r.values.slice(0, 1); rerenderPanel(i); }
          else if(kind === 'val'){
            const f = FIELD_CATALOG[r.field];
            r.values = vals.map(v => f.options[+v]).filter(Boolean);
            if(r.op === 'in'){
              // multi: no re-render para no cerrar el desplegable; solo refrescar el resumen
              const panel = dd.closest('.wz-cond-panel');
              const m = readIncCard(card, i);
              const sum = condSummary(card, m);
              const prev = panel.querySelector('.wz-cond-preview');
              if(prev){ prev.hidden = !sum; prev.querySelector('.wz-cond-preview__body').innerHTML = sum; }
            } else rerenderPanel(i);
          }
        }, 0);
      }
    }, true);
    container.addEventListener('click', e => {
      if(e.target.closest('[data-cr-dd]')) return;
      const el = e.target.closest('[data-cr]');
      if(!el || el.tagName === 'SELECT') return;
      const { i, card, st, ri } = ctx(el);
      const act = el.dataset.cr;
      if(act === 'edit'){ st.editing = true; }
      else if(act === 'done'){
        st.error = !st.rules.length ? 'Agrega al menos una condición para este incentivo.'
          : st.rules.some(r => !r.field || !r.values.length) ? 'Completa el campo y el valor de cada condición, o quita las filas vacías.' : '';
        if(!st.error) st.editing = false;
        isDirty = true; rerenderPanel(i); return;
      }
      else if(act === 'add'){ st.rules.push({ field: '', op: 'eq', values: [] }); }
      else if(act === 'remove'){ st.rules.splice(ri, 1); }
      else return;
      done(i, card);
    });
  }

  /* Paso 3: cada incentivo necesita al menos una condición y cada condición
     debe tener campo y valor. Devuelve el primer panel con error (o null). */
  function validateCondPanels(){
    const cards = [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')];
    let firstBad = null;
    cards.forEach((card, i) => {
      if(card.dataset.inactive || (condOnlyNew && !condOnlyNew.has(card))) return;
      const m = readIncCard(card, i);
      if(!m.benef || !m.catKey) return;
      const st = condState(card);
      st.error = '';
      if(!st.rules.length) st.error = 'Agrega al menos una condición para este incentivo.';
      else if(st.rules.some(r => !r.field || !r.values.length)) st.error = 'Completa el campo y el valor de cada condición, o quita las filas vacías.';
      if(!st.error) st.editing = false;
      if(st.error && firstBad === null) firstBad = i;
    });
    renderCondPanels();
    return firstBad === null ? null : document.querySelector(`#wzCondPanels .wz-cond-panel[data-inc-idx="${firstBad}"]`);
  }

  /* Condiciones listas para persistir: tipo de beneficiario + reglas (todas Y). */
  function conditionsForCard(card, m){
    const rules = [R('tipoBeneficiario', 'eq', m.benefLbl), ...cardRules(card).filter(r => r.field && r.values.length)];
    return {
      groups: [{
        logic: 'AND',
        rules: rules.map(r => ({
          fieldKey: r.field, opKey: r.op, values: [...r.values],
          field: r.field === 'tipoBeneficiario' ? 'Tipo de beneficiario' : (FIELD_CATALOG[r.field]?.label || r.field),
          op: OP_LABEL[r.op] || r.op,
          value: r.values.join(r.op === 'in' ? ' o ' : ', ')
        }))
      }],
      summary: condSummary(card, m)
    };
  }

  function addConditionRow(btnOrNothing){
    // Resolver el grupo: si viene del botón, usa ese grupo; si no, el último grupo
    // del primer panel disponible.
    let group;
    if(btnOrNothing && btnOrNothing.closest){
      group = btnOrNothing.closest('.cond-group');
    }else{
      const groups = document.querySelectorAll('.wz-cond-panel .cond-group');
      group = groups[groups.length - 1];
    }
    if(!group) return;
    const rows = group.querySelector('.cond-rows');
    if(!rows) return;
    condRowCounter++;
    const id = condRowCounter;
    const row = document.createElement('div');
    row.className = 'cond-row';
    row.dataset.rowId = id;
    row.innerHTML = `
      <div class="naowee-dropdown cond-field" data-wz-dropdown data-cond-field data-val="edad">
        <div class="naowee-dropdown__trigger" tabindex="0">
          <span class="naowee-dropdown__value">Edad</span>
          <div class="naowee-dropdown__controls">
            <span class="naowee-dropdown__chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
          </div>
        </div>
        <div class="naowee-dropdown__menu" role="listbox">
          ${Object.entries(COND_FIELDS).map(([k,v], i) => `<div class="naowee-dropdown__option${i === 0 ? ' naowee-dropdown__option--selected' : ''}" data-val="${k}">${v.label}</div>`).join('')}
        </div>
      </div>
      <div class="naowee-dropdown cond-op" data-wz-dropdown data-cond-op>
        <div class="naowee-dropdown__trigger" tabindex="0">
          <span class="naowee-dropdown__value">≥</span>
          <div class="naowee-dropdown__controls">
            <span class="naowee-dropdown__chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
          </div>
        </div>
        <div class="naowee-dropdown__menu" role="listbox"></div>
      </div>
      <span data-cond-value></span>
      <button type="button" class="x-btn" onclick="removeConditionRow(this)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`;
    rows.appendChild(row);
    rebuildCondRow(row, 'edad');
    // Wire dropdowns (field + op)
    upgradeDropdowns();
    // Custom behavior: when field option picked, rebuild operator + value (after native upgrade)
    const fieldDd = row.querySelector('.cond-field');
    fieldDd.querySelectorAll('.naowee-dropdown__option').forEach(opt => {
      opt.addEventListener('click', () => {
        const newField = opt.dataset.val;
        fieldDd.dataset.val = newField;
        setTimeout(() => rebuildCondRow(row, newField), 0);
      });
    });
    refreshCondPreview();
  }

  function removeConditionRow(btn){
    const row = btn.closest('.cond-row');
    if(!row) return;
    row.remove();
    refreshCondPreview();
  }

  function rebuildCondRow(row, fieldKey){
    const def = COND_FIELDS[fieldKey];
    if(!def) return;
    const opDd = row.querySelector('.cond-op');
    if(opDd){
      const menu = opDd.querySelector('.naowee-dropdown__menu');
      menu.innerHTML = def.operators.map(([v, lbl], i) => `<div class="naowee-dropdown__option${i === 0 ? ' naowee-dropdown__option--selected' : ''}" data-val="${v}">${lbl}</div>`).join('');
      opDd.querySelector('.naowee-dropdown__value').textContent = def.operators[0][1];
      opDd.dataset.val = def.operators[0][0];
      // Re-wire options for op (since menu replaced)
      opDd.removeAttribute('data-wz-wired');
      delete opDd.dataset.wzWired;
      upgradeDropdowns();
      opDd.querySelectorAll('.naowee-dropdown__option').forEach(opt => {
        opt.addEventListener('click', () => {
          opDd.dataset.val = opt.dataset.val;
          refreshCondPreview();
        });
      });
    }
    const valSpan = row.querySelector('[data-cond-value]');
    if(def.valueType === 'number'){
      valSpan.innerHTML = makeStepper({ min: 0, max: 120, value: 18, unit: def.placeholder || '' });
      wireStepper(valSpan.querySelector('[data-cond-val]'));
    }else if(def.valueType === 'select'){
      const multiAttr = def.multi ? 'data-wz-multi' : '';
      const placeholder = def.multi ? 'Selecciona uno o varios…' : 'Selecciona…';
      valSpan.innerHTML = `
        <div class="naowee-dropdown cond-val" data-wz-dropdown data-cond-val ${multiAttr}>
          <div class="naowee-dropdown__trigger" tabindex="0">
            <span class="naowee-dropdown__placeholder">${placeholder}</span>
            <div class="naowee-dropdown__controls">
              <span class="naowee-dropdown__chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
            </div>
          </div>
          <div class="naowee-dropdown__menu" role="listbox">
            ${def.options.map(([v, lbl]) => `<div class="naowee-dropdown__option" data-val="${v}">${lbl}</div>`).join('')}
          </div>
        </div>`;
      upgradeDropdowns();
      // En modo multi el handler nativo (upgradeDropdowns) ya actualiza
      // dd.dataset.wzValue (csv). Sólo necesitamos refrescar preview e implied.
      valSpan.querySelectorAll('.naowee-dropdown__option').forEach(opt => {
        opt.addEventListener('click', () => {
          if(!def.multi){
            valSpan.querySelector('.cond-val').dataset.val = opt.dataset.val;
          }
          refreshImpliedRule(row);
          refreshCondPreview();
        });
      });
    }
    refreshImpliedRule(row);
    refreshCondPreview();
  }

  /* Renderiza/actualiza el chip "regla implícita" asociado a la fila.
     Soporta multi: si "personal_apoyo" está dentro de la selección, dispara la regla. */
  function refreshImpliedRule(row){
    if(!row) return;
    const fieldKey = row.querySelector('[data-cond-field]')?.dataset?.val || '';
    const valEl = row.querySelector('[data-cond-val]');
    const values = [];
    if(valEl){
      if(valEl.classList.contains('naowee-input-stepper')){
        values.push(valEl.querySelector('input')?.value || '');
      } else if(valEl.classList.contains('naowee-dropdown')){
        const isMulti = valEl.hasAttribute('data-wz-multi');
        if(isMulti){
          (valEl.dataset.wzValue || '').split(',').filter(Boolean).forEach(v => values.push(v));
        } else {
          values.push(valEl.dataset.val || '');
        }
      }
    }
    const text = values.map(v => getImpliedRule(fieldKey, v)).find(Boolean) || null;
    let chip = row.querySelector('.cond-row__implied');
    if(!text){
      if(chip) chip.remove();
      return;
    }
    if(!chip){
      chip = document.createElement('div');
      chip.className = 'cond-row__implied';
      row.appendChild(chip);
    }
    chip.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
      <span><strong>Regla implícita:</strong> ${text}</span>`;
  }

  /* Stepper DS helpers */
  function makeStepper({ min = 0, max = 120, value = 0, unit = '' } = {}){
    return `
      <div class="naowee-input-stepper" data-cond-val data-min="${min}" data-max="${max}">
        <div class="naowee-input-stepper__content">
          <div class="naowee-input-stepper__input">
            <button type="button" class="naowee-input-stepper__btn" data-step="-1" aria-label="Restar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <div class="naowee-input-stepper__value">
              <input class="naowee-input-stepper__value-input" type="number" value="${value}" min="${min}" max="${max}"/>
              ${unit ? `<span class="naowee-input-stepper__value-comp">${unit}</span>` : ''}
            </div>
            <button type="button" class="naowee-input-stepper__btn" data-step="1" aria-label="Sumar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }
  function wireStepper(stepper){
    if(!stepper) return;
    const input = stepper.querySelector('.naowee-input-stepper__value-input');
    const min = Number(stepper.dataset.min) || 0;
    const max = Number(stepper.dataset.max) || 999;
    stepper.querySelectorAll('.naowee-input-stepper__btn').forEach(b => {
      b.addEventListener('click', () => {
        const delta = Number(b.dataset.step);
        let v = Number(input.value) || 0;
        v = Math.max(min, Math.min(max, v + delta));
        input.value = v;
        refreshCondPreview();
      });
    });
    input.addEventListener('input', () => {
      let v = Number(input.value) || 0;
      if(v < min) v = min;
      if(v > max) v = max;
      refreshCondPreview();
    });
    input.addEventListener('focus', () => stepper.classList.add('naowee-input-stepper--active'));
    input.addEventListener('blur', () => stepper.classList.remove('naowee-input-stepper--active'));
  }

  // Operadores en lenguaje natural español — para la vista previa
  const OP_NATURAL = {
    gte: 'es mayor o igual a',
    lte: 'es menor o igual a',
    eq:  'es',
    neq: 'no es',
    in:  'incluye',
    nin: 'no incluye'
  };

  function refreshCondPreview(){
    // Refresca cada panel del paso 3 — uno solo en single, varios en multi.
    document.querySelectorAll('.wz-cond-panel').forEach(panel => refreshPanelPreview(panel));
  }

  /* Une items con comas y "y" final — "a, b y c" */
  function joinWithAnd(arr){
    if(!arr || arr.length === 0) return '';
    if(arr.length === 1) return arr[0];
    if(arr.length === 2) return `${arr[0]} y ${arr[1]}`;
    return arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1];
  }
  /* Une items con comas y "o" final — "a, b o c" */
  function joinWithOr(arr){
    if(!arr || arr.length === 0) return '';
    if(arr.length === 1) return arr[0];
    if(arr.length === 2) return `${arr[0]} o ${arr[1]}`;
    return arr.slice(0, -1).join(', ') + ' o ' + arr[arr.length - 1];
  }

  /* Convierte una regla {fieldKey, opVal, valueLabels} en una frase natural.
     Si los valores están vacíos, devuelve un placeholder con "…". */
  function ruleToNaturalSentence(fieldKey, opVal, valueLabels){
    const hasValues = valueLabels.length > 0 && valueLabels.some(v => v && v !== '0');
    const dots = `<span class="wz-cond-preview__val wz-cond-preview__val--empty">…</span>`;
    const wrap = s => `<strong>${s}</strong>`;
    const list = valueLabels.map(v => v.toString().toLowerCase());
    const lower = (s) => (s || '').toLowerCase();

    if(fieldKey === 'edad'){
      const v = valueLabels[0];
      if(!hasValues) return `tiene ${dots} años`;
      if(opVal === 'gte') return `tiene al menos ${wrap(v)} años`;
      if(opVal === 'lte') return `tiene como máximo ${wrap(v)} años`;
      if(opVal === 'eq')  return `tiene exactamente ${wrap(v)} años`;
      if(opVal === 'neq') return `no tiene ${wrap(v)} años`;
    }
    if(fieldKey === 'genero'){
      if(!hasValues) return `es de género ${dots}`;
      if(opVal === 'eq')  return `es de género ${wrap(lower(valueLabels[0]))}`;
      if(opVal === 'neq') return `no es de género ${wrap(lower(valueLabels[0]))}`;
    }
    if(fieldKey === 'categoria'){
      if(!hasValues) return `compite en categoría ${dots}`;
      const labels = valueLabels.map(wrap);
      if(opVal === 'in')  return labels.length === 1 ? `compite en categoría ${labels[0]}` : `compite en alguna de las categorías ${joinWithOr(labels)}`;
      if(opVal === 'nin') return `no compite en ${labels.length === 1 ? `categoría ${labels[0]}` : joinWithOr(labels)}`;
    }
    if(fieldKey === 'logros'){
      if(!hasValues) return `ha obtenido ${dots}`;
      const labels = valueLabels.map(wrap);
      if(opVal === 'in')  return `ha obtenido ${joinWithOr(labels)}`;
      if(opVal === 'nin') return `no ha obtenido ${joinWithOr(labels)}`;
    }
    if(fieldKey === 'tipoUsuario'){
      if(!hasValues) return `es ${dots}`;
      const labels = valueLabels.map(v => wrap(lower(v)));
      if(opVal === 'in')  return `es ${joinWithOr(labels)}`;
      if(opVal === 'nin') return `no es ${joinWithOr(labels)}`;
    }
    // Fallback genérico
    return `${COND_FIELDS[fieldKey]?.label || fieldKey} ${opVal} ${valueLabels.length ? wrap(valueLabels.join(', ')) : dots}`;
  }

  /* Refresca el preview de un solo panel. */
  function refreshPanelPreview(panel){
    if(!panel) return;
    const pv   = panel.querySelector('.wz-cond-preview');
    const body = panel.querySelector('.wz-cond-preview__body');
    if(!pv || !body) return;
    const builder = panel.querySelector('.cond-builder');
    const groups = builder ? builder.querySelectorAll('.cond-group') : [];
    const emptyHTML = '<em>Agrega al menos una condición para ver la vista previa.</em>';

    if(!groups.length){
      pv.dataset.empty = 'true';
      body.innerHTML = emptyHTML;
      return;
    }

    const groupSentences = [];
    const impliedNotes = [];
    groups.forEach(g => {
      const rows = g.querySelectorAll('.cond-row');
      if(!rows.length) return;
      const ruleSentences = [];
      [...rows].forEach(r => {
        const fieldKey = r.querySelector('[data-cond-field]').dataset.val || 'edad';
        const def      = COND_FIELDS[fieldKey];
        const opVal    = r.querySelector('[data-cond-op]').dataset.val || def.operators[0][0];
        const valEl    = r.querySelector('[data-cond-val]');
        const valueLabels = [];
        const valueKeys = [];
        if(valEl){
          if(valEl.classList.contains('naowee-input-stepper')){
            const v = valEl.querySelector('input').value;
            if(v){ valueLabels.push(v); valueKeys.push(v); }
          } else if(valEl.classList.contains('naowee-dropdown')){
            const isMulti = valEl.hasAttribute('data-wz-multi');
            if(isMulti){
              const csv = (valEl.dataset.wzValue || '').split(',').filter(Boolean);
              csv.forEach(k => {
                valueKeys.push(k);
                const lbl = (def.options.find(o => o[0] === k) || [k, k])[1];
                valueLabels.push(lbl);
              });
            } else if(valEl.dataset.val){
              valueKeys.push(valEl.dataset.val);
              const lbl = valEl.querySelector('.naowee-dropdown__value')?.textContent || valEl.dataset.val;
              valueLabels.push(lbl);
            }
          }
        }
        ruleSentences.push(ruleToNaturalSentence(fieldKey, opVal, valueLabels));
        // Regla implícita asociada al valor (ej. tipoUsuario=personal_apoyo)
        const implied = valueKeys.map(k => getImpliedRule(fieldKey, k)).find(Boolean);
        if(implied) impliedNotes.push(implied);
      });
      if(ruleSentences.length) groupSentences.push(joinWithAnd(ruleSentences));
    });

    if(!groupSentences.length){
      pv.dataset.empty = 'true';
      body.innerHTML = emptyHTML;
      return;
    }

    pv.dataset.empty = 'false';
    let html;
    if(groupSentences.length === 1){
      html = `<p class="wz-cond-preview__sentence">El atleta es elegible si <span class="wz-cond-preview__chunk">${groupSentences[0]}</span>.</p>`;
    } else {
      const items = groupSentences.map(s => `<li><span class="wz-cond-preview__chunk">${s}</span></li>`).join('');
      html = `<p class="wz-cond-preview__intro">El atleta es elegible si cumple <strong>cualquiera</strong> de estas reglas:</p><ul class="wz-cond-preview__or-list">${items}</ul>`;
    }
    if(impliedNotes.length){
      const uniq = [...new Set(impliedNotes)];
      html += `<p class="wz-cond-preview__implied-note"><strong>Además:</strong> ${joinWithAnd(uniq)}</p>`;
    }
    body.innerHTML = html;
  }

  /* ══ Step-5 — dropzone clickeable + file chip + budget live ══ */
  function wireDropzoneClick(){
    const dz = document.getElementById('wzDrop');
    const input = document.getElementById('wzFileInput');
    if(!dz || !input || dz.dataset.wzClickWired) return;
    dz.dataset.wzClickWired = '1';
    dz.addEventListener('click', () => input.click());
    dz.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if(!f) return;
      const chip = document.getElementById('wzFileChip');
      if(!chip) return;
      chip.hidden = false;
      dz.style.display = 'none';
      chip.innerHTML = `
        <div class="wz-file-chip__ico">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="wz-file-chip__body">
          <div class="wz-file-chip__name">${escapeHtml(f.name)}</div>
          <div class="wz-file-chip__meta" id="wzFileMeta">${(f.size/1024).toFixed(1)} KB · listo para procesar</div>
        </div>
        <button type="button" class="wz-file-chip__remove" onclick="resetWzFile()" aria-label="Quitar archivo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>`;
      uploadedCodes = null;
      const meta = () => document.getElementById('wzFileMeta');
      if(meta()) meta().textContent = `${(f.size/1024).toFixed(1)} KB · leyendo códigos…`;
      readCodesFile(f).then(codes => {
        uploadedCodes = codes;
        if(meta()) meta().textContent = `${(f.size/1024).toFixed(1)} KB · ${codes.length} códigos leídos`;
        updateBudget();
      }).catch(err => {
        console.error('[wizard] lectura de archivo', err);
        if(meta()) meta().textContent = 'No se pudo leer el archivo. Usa la plantilla (.xlsx) o un .csv.';
      });
      updateBudget();
    });
  }
  function resetWzFile(){
    const chip = document.getElementById('wzFileChip');
    const dz = document.getElementById('wzDrop');
    const input = document.getElementById('wzFileInput');
    if(chip){ chip.hidden = true; chip.innerHTML = ''; }
    if(dz) dz.style.display = '';
    if(input) input.value = '';
    uploadedCodes = null;
    updateBudget();
  }
  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  /* ══ Step-1 — Resolución uploader (single file, ghost CTA, % spinner, DS tag) ══ */
  const ANEXOS_MAX_BYTES = 10 * 1024 * 1024;
  let anexosFile = null;
  let anexosUploadTimer = null;
  function wireAnexosUpload(){
    const field = document.getElementById('wzAnexosField');
    const btn = document.getElementById('wzAnexosBtn');
    const input = document.getElementById('wzAnexosInput');
    if(!field || !btn || !input || field.dataset.wzAnxWired) return;
    field.dataset.wzAnxWired = '1';
    btn.addEventListener('click', () => input.click());
    ['dragenter','dragover'].forEach(evt => field.addEventListener(evt, e => {
      e.preventDefault(); e.stopPropagation();
      const wrap = field.closest('.wz-fileinput');
      if(wrap && wrap.dataset.state === 'empty') field.classList.add('is-dragover');
    }));
    ['dragleave','drop'].forEach(evt => field.addEventListener(evt, e => {
      e.preventDefault(); e.stopPropagation(); field.classList.remove('is-dragover');
    }));
    field.addEventListener('drop', e => {
      const wrap = field.closest('.wz-fileinput');
      if(!wrap || wrap.dataset.state !== 'empty') return;
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if(f) startAnexoUpload(f);
    });
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if(f) startAnexoUpload(f);
      input.value = '';
    });
  }
  function startAnexoUpload(f){
    const accept = ['pdf','doc','docx','jpg','jpeg','png'];
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if(!accept.includes(ext) || f.size > ANEXOS_MAX_BYTES) return;
    anexosFile = f;
    setAnexoState('uploading', 0);
    if(anexosUploadTimer) clearInterval(anexosUploadTimer);
    let pct = 0;
    anexosUploadTimer = setInterval(() => {
      pct = Math.min(100, pct + (6 + Math.random() * 10));
      setAnexoState('uploading', Math.round(pct));
      if(pct >= 100){
        clearInterval(anexosUploadTimer);
        anexosUploadTimer = null;
        setTimeout(() => setAnexoState('uploaded'), 220);
      }
    }, 120);
  }
  function removeAnexo(){
    if(anexosUploadTimer){ clearInterval(anexosUploadTimer); anexosUploadTimer = null; }
    anexosFile = null;
    setAnexoState('empty');
  }
  function setAnexoState(state, pct){
    const wrap = document.querySelector('.wz-fileinput');
    const slot = document.getElementById('wzAnexosSlot');
    const action = document.getElementById('wzAnexosAction');
    if(!wrap || !slot || !action) return;
    const prev = wrap.dataset.state;
    wrap.dataset.state = state;
    const fname = anexosFile ? anexosFile.name : '';

    if(state === 'empty'){
      slot.innerHTML = '<span class="wz-fileinput__placeholder">Sin archivo adjunto</span>';
      action.innerHTML = `
        <button type="button" class="naowee-btn naowee-btn--mute naowee-btn--small wz-fileinput__cta" id="wzAnexosBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          <span>Subir documento</span>
        </button>`;
      const newBtn = action.querySelector('#wzAnexosBtn');
      const input = document.getElementById('wzAnexosInput');
      if(newBtn && input) newBtn.addEventListener('click', () => input.click());
      return;
    }

    if(state === 'uploading'){
      const p = Math.max(0, Math.min(100, pct || 0));
      const dash = 100 - p;
      // Left slot: filename (plain, neutral). Mounted only when entering state.
      if(prev !== 'uploading'){
        slot.innerHTML = `
          <span class="wz-fileinput__pending" title="${escapeHtml(fname)}">
            <svg class="wz-fileinput__pending-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span class="wz-fileinput__pending-name">${escapeHtml(fname)}</span>
          </span>`;
        action.innerHTML = `
          <span class="wz-fileinput__progress" role="status" aria-live="polite" aria-label="Subiendo archivo">
            <svg class="wz-fileinput__ring" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle class="wz-fileinput__ring-track" cx="12" cy="12" r="10" fill="none" stroke-width="2.4"/>
              <circle class="wz-fileinput__ring-fill"  cx="12" cy="12" r="10" fill="none" stroke-width="2.4"
                stroke-linecap="round" pathLength="100"
                stroke-dasharray="100" stroke-dashoffset="${dash}"
                transform="rotate(-90 12 12)"/>
            </svg>
            <span class="wz-fileinput__progress-pct">${p}%</span>
          </span>`;
      } else {
        // Update only the changing parts to keep animation smooth
        const fill = action.querySelector('.wz-fileinput__ring-fill');
        const pctEl = action.querySelector('.wz-fileinput__progress-pct');
        if(fill) fill.setAttribute('stroke-dashoffset', dash);
        if(pctEl) pctEl.textContent = p + '%';
      }
      return;
    }

    if(state === 'uploaded' && anexosFile){
      slot.innerHTML = `
        <span class="naowee-tag naowee-tag--positive naowee-tag--small wz-fileinput__tag" title="${escapeHtml(fname)}">
          <span class="naowee-tag__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 14 11 16 15 12"/></svg>
          </span>
          <span class="wz-fileinput__tag-name">${escapeHtml(fname)}</span>
          <span class="naowee-tag__active-area" data-anexo-rm role="button" tabindex="0" aria-label="Quitar ${escapeHtml(fname)}">
            <span class="naowee-tag__close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </span>
          </span>
        </span>`;
      action.innerHTML = '';
      const rm = slot.querySelector('[data-anexo-rm]');
      if(rm){
        rm.addEventListener('click', removeAnexo);
        rm.addEventListener('keydown', e => {
          if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); removeAnexo(); }
        });
      }
    }
  }
  function resetAnexos(){ removeAnexo(); }

  function parseMoney(el){
    if(!el) return 0;
    const digits = String(el.value || '').replace(/\D/g, '');
    return digits ? Number(digits) : 0;
  }

  /* Devuelve el input "Valor unitario" del primer incentivo cuya categoría sea Bono.
     Es el unit que aplica para los códigos del programa (sólo bonos generan códigos). */
  function getBonoUnitInput(){
    const cards = [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')];
    for(const c of cards){
      const cat = (c.querySelector('[data-wz-name="categoria"]')?.dataset?.wzValue || '').toLowerCase();
      if(cat === 'bono') return c.querySelector('.wz-inc-card__unit input');
    }
    return null;
  }
  /* Conteo de códigos por tipo de incentivo (reunión 22-09, 00:16:25).
     - Manual: cuenta las filas con código por incentivo.
     - Archivo CSV: cuenta las filas leídas por tipo_incentivo.
     - Si el incentivo tiene rubro y valor unitario, muestra los esperados;
       si no, se aceptan los códigos que haya (el rubro es opcional). */
  let uploadedCodes = null; // [{ type, code }] leído del CSV; null si no hay o es xlsx
  function codeCountsByIncentive(){
    const mode = (document.querySelector('[data-wz-name="codes-mode"]')?.dataset?.wzValue) || 'upload';
    const bonos = codeIncentives();
    const counts = Object.fromEntries(bonos.map(m => [m.idx, 0]));
    let unmatched = 0;
    if(mode === 'manual'){
      bonos.forEach(m => { counts[m.idx] = manualCodesOf(m.card).length; });
    } else if(uploadedCodes){
      uploadedCodes.forEach(({ type }) => {
        const m = bonos.find(b => b.name.toLowerCase() === type.toLowerCase());
        if(m) counts[m.idx]++; else unmatched++;
      });
    }
    return { mode, bonos, counts, unmatched };
  }
  function updateBudget(){
    const bx = document.getElementById('wzBudget');
    if(!bx) return;
    const { mode, bonos, counts, unmatched } = codeCountsByIncentive();
    if(!bonos.length){ bx.hidden = true; bx.innerHTML = ''; return; }
    const hasFile = !!document.getElementById('wzFileChip')?.innerHTML.trim();
    if(mode === 'manual' || (mode === 'upload' && !hasFile)){ bx.hidden = true; bx.innerHTML = ''; return; }
    const unknownXlsx = mode === 'upload' && !uploadedCodes;
    const rows = bonos.map(m => {
      const rubroInc = parseMoney(m.card.querySelector('.wz-inc-card__rubro input'));
      const unit = parseMoney(m.card.querySelector('.wz-inc-card__unit input'));
      const expected = rubroInc && unit ? Math.floor(rubroInc / unit) : 0;
      const n = counts[m.idx] || 0;
      let status;
      if(unknownXlsx) status = '<span class="naowee-badge naowee-badge--neutral naowee-badge--quiet naowee-badge--small">Leyendo archivo…</span>';
      else if(!expected) status = `<span class="naowee-badge naowee-badge--neutral naowee-badge--quiet naowee-badge--small">Sin rubro · se aceptan los cargados</span>`;
      else if(n > expected) status = `<span class="naowee-badge naowee-badge--negative naowee-badge--quiet naowee-badge--small">Excede por ${n - expected}</span>`;
      else if(n === expected) status = `<span class="naowee-badge naowee-badge--positive naowee-badge--quiet naowee-badge--small">Completo</span>`;
      else status = `<span class="naowee-badge naowee-badge--caution naowee-badge--quiet naowee-badge--small">Faltan ${expected - n}</span>`;
      return `<tr><td>${escapeHtml(m.name)}</td><td class="num">${unknownXlsx ? '—' : n}</td><td class="num">${expected || '—'}</td><td>${status}</td></tr>`;
    }).join('');
    const fileCodes = (uploadedCodes || []).map(c => c.code);
    const seenF = new Set(); let dupF = 0; fileCodes.forEach(c => { const k = c.toUpperCase(); if(seenF.has(k)) dupF++; seenF.add(k); });
    const badF = fileCodes.filter(c => c.replace(CODE_BAD, '') !== c).length;
    const fileWarn = (dupF || badF)
      ? `<div class="naowee-message naowee-message--negative" style="margin-top:10px"><div class="naowee-message__header"><div class="naowee-message__text">El archivo tiene ${[dupF ? `<strong>${dupF} códigos repetidos</strong>` : '', badF ? `<strong>${badF} con caracteres no permitidos</strong> (solo letras sin tilde, números, - y _)` : ''].filter(Boolean).join(' y ')}. Corrígelo y vuelve a subirlo.</div></div></div>`
      : '';
    const warn = unmatched
      ? `<div class="naowee-message naowee-message--caution" style="margin-top:10px"><div class="naowee-message__header"><div class="naowee-message__text"><strong>${unmatched} código(s)</strong> sin un incentivo válido. Revisa la columna <code>tipo_incentivo</code> o el incentivo de cada fila.</div></div></div>`
      : '';
    bx.hidden = false;
    bx.innerHTML = `
      <table class="wz-codes-table">
        <thead><tr><th>Incentivo</th><th class="num">Cargados</th><th class="num">Esperados</th><th>Estado</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>${warn}${fileWarn}`;
  }

  /* ══ Plantilla Excel (se genera en el front) ══
     ExcelJS se carga desde CDN solo al descargar o al leer un .xlsx.
     Hoja "Códigos": tipo_incentivo (lista desplegable) + codigo.
     Hoja "Listas" (oculta): los incentivos Bono del programa, fuente de la lista.
     Hoja "Instrucciones": qué llenar y cuántos códigos se esperan por incentivo. */
  const EXCELJS_URL = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
  let excelJsPromise = null;
  function loadExcelJs(){
    if(window.ExcelJS) return Promise.resolve(window.ExcelJS);
    if(!excelJsPromise){
      excelJsPromise = new Promise((resolve, reject) => {
        const sc = document.createElement('script');
        sc.src = EXCELJS_URL;
        sc.onload = () => resolve(window.ExcelJS);
        sc.onerror = () => { excelJsPromise = null; reject(new Error('No se pudo cargar ExcelJS')); };
        document.head.appendChild(sc);
      });
    }
    return excelJsPromise;
  }
  async function downloadCodesTemplate(){
    const btn = document.getElementById('wzTemplateBtn');
    const bonos = codeIncentives();
    if(!bonos.length){ showToast('No hay incentivos tipo Bono: ningún incentivo lleva códigos.', 'informative'); return; }
    if(btn){ btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = 'Generando…'; }
    try {
      const ExcelJS = await loadExcelJs();
      const wb = new ExcelJS.Workbook();
      const progName = (document.getElementById('fName')?.value || '').trim() || 'Programa';
      const ORANGE = 'FFD74009';

      const ws = wb.addWorksheet('Códigos', { views: [{ state: 'frozen', ySplit: 1 }] });
      ws.columns = [
        { header: 'tipo_incentivo', key: 'tipo', width: Math.max(28, ...bonos.map(b => b.name.length + 4)) },
        { header: 'codigo', key: 'codigo', width: 24 }
      ];
      const head = ws.getRow(1);
      head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
      head.alignment = { vertical: 'middle' };
      head.height = 22;

      const lists = wb.addWorksheet('Listas', { state: 'hidden' });
      bonos.forEach((b, i) => { lists.getCell(`A${i + 1}`).value = b.name; });

      const ROWS = 2000;
      for(let r = 2; r <= ROWS + 1; r++){
        ws.getCell(`A${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`Listas!$A$1:$A$${bonos.length}`],
          showErrorMessage: true, errorStyle: 'stop',
          errorTitle: 'Tipo de incentivo no válido', error: 'Elige un tipo de incentivo de la lista.'
        };
        ws.getCell(`B${r}`).numFmt = '@';
      }

      const info = wb.addWorksheet('Instrucciones');
      info.columns = [{ width: 46 }, { width: 18 }];
      const rows = [
        [`Plantilla de códigos · ${progName}`],
        [],
        ['Cómo llenarla'],
        ['1. En la hoja "Códigos", un código por fila.'],
        ['2. En tipo_incentivo elige el incentivo de la lista desplegable.'],
        ['3. Cada código debe ser único (no se repite en el archivo).'],
        ['4. Guarda como .xlsx y súbelo en el paso "Códigos".'],
        [],
        ['Incentivo', 'Códigos esperados']
      ];
      bonos.forEach(b => {
        const r = parseMoney(b.card.querySelector('.wz-inc-card__rubro input'));
        const u = parseMoney(b.card.querySelector('.wz-inc-card__unit input'));
        rows.push([b.name, r && u ? Math.floor(r / u) : 'Sin límite (sin rubro)']);
      });
      rows.forEach(rw => info.addRow(rw));
      info.getCell('A1').font = { bold: true, size: 14 };
      info.getCell('A3').font = { bold: true };
      info.getRow(9).font = { bold: true };

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const slug = progName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `plantilla-codigos-${slug || 'programa'}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch(err){
      console.error('[wizard] plantilla', err);
      showToast('No se pudo generar la plantilla. Revisa tu conexión e inténtalo de nuevo.', 'negative');
    } finally {
      if(btn){ btn.disabled = false; btn.innerHTML = btn.dataset.label; }
    }
  }

  /* Lee los códigos del archivo subido: .xlsx (hoja "Códigos" o la primera) o .csv. */
  async function readCodesFile(f){
    if(/\.xlsx$/i.test(f.name)){
      const ExcelJS = await loadExcelJs();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await f.arrayBuffer());
      const ws = wb.getWorksheet('Códigos') || wb.worksheets[0];
      const out = [];
      ws.eachRow((row, n) => {
        if(n === 1) return;
        const cell = v => String((v && typeof v === 'object' && 'text' in v) ? v.text : (v ?? '')).trim();
        const type = cell(row.getCell(1).value), code = cell(row.getCell(2).value);
        if(code) out.push({ type, code });
      });
      return out;
    }
    const text = await f.text();
    const lines = text.replace(/^\ufeff/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const sep = (lines[0] || '').includes(';') ? ';' : ',';
    const body = /tipo_incentivo/i.test(lines[0] || '') ? lines.slice(1) : lines;
    return body.map(l => l.split(sep)).filter(c => c.length >= 2 && c[1].trim())
      .map(c => ({ type: c[0].trim(), code: c[1].trim() }));
  }

  /* ══ Success modal ══ */
  function showSuccessModal(){
    const overlay = document.getElementById('wzSuccessOverlay');
    if(!overlay) return;
    // Poblar stats
    const rubro = parseMoney(document.getElementById('wzRubroTotal'));
    const prog = (window.PROGRAMS_DATA || []).find(p => p.id === lastCreatedProgramId);
    const from = document.querySelector('[data-wz-range="from"][data-wz-range-name="vigencia"] input')?.value || '';
    const to = document.querySelector('[data-wz-range="to"][data-wz-range-name="vigencia"] input')?.value || '';
    overlay.querySelector('[data-key="rubro"]').textContent = rubro ? `$${rubro.toLocaleString('es-CO')}` : 'Sin rubro';
    overlay.querySelector('[data-key="codigos"]').textContent = prog?.codes?.total || '—';
    overlay.querySelector('[data-key="vigencia"]').textContent = from && to ? `${from} → ${to}` : from ? `Desde ${from}` : to ? `Hasta ${to}` : 'Sin fecha de cierre';
    const st = document.getElementById('wzSuccessTitle');
    if(st) st.textContent = editingProgramId ? '¡Cambios guardados!' : '¡Programa creado con éxito!';
    seedConfetti();
    overlay.classList.add('open');
  }

  function seedConfetti(){
    const root = document.getElementById('wzConfetti');
    if(!root) return;
    root.innerHTML = '';
    // Patrón escenario-11: paleta mixta + falling confetti
    const colors = ['#FF7500', '#d74009', '#1f8923', '#1f78d1', '#ffbf75', '#ffffff'];
    const pieces = 42;
    for(let i = 0; i < pieces; i++){
      const p = document.createElement('span');
      p.className = 'wz-confetti__piece';
      p.style.left = (Math.random() * 100) + '%';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
      p.style.animationDuration = (1.8 + Math.random() * 1.4).toFixed(2) + 's';
      p.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
      root.appendChild(p);
    }
  }
  function hideSuccessModal(){
    const overlay = document.getElementById('wzSuccessOverlay');
    if(overlay) overlay.classList.remove('open');
  }
  function closeSuccessAndNew(){
    hideSuccessModal();
    openWizard(); // formulario limpio, en modo crear
  }
  function goToProgramDetail(){
    hideSuccessModal();
    const id = lastCreatedProgramId;
    const url = id
      ? `incentivo-05-programa-detalle.html?id=${encodeURIComponent(id)}&activated=1`
      : 'incentivo-05-programa-detalle.html?activated=1';
    window.location.href = url;
  }

  /* ══ Step-4 activate ══ */
  function activateProgram(){
    // Si hay incentivos Bono, se exigen códigos. Al editar un programa que ya
    // tiene códigos, cargar más es opcional.
    const origCodes = editingProgram()?.codes?.total || 0;
    const hasNewCodes = codesModeHasData(currentCodesMode());
    if(!checkCodesBeforeSave({ requireNew: hasBonoIncentive() && !(origCodes && !hasNewCodes) })) return;
    // Construir el programa con todo lo parametrizado en el wizard, persistirlo
    // (memoria + sessionStorage para que el detalle lo lea al navegar) y notificar.
    const prog = buildProgramFromForm('active');
    persistProgram(prog);

    // Cerrar wizard y mostrar success modal
    const overlay = document.getElementById('wzOverlay');
    overlay.classList.remove('open');
    isDirty = false;
    showSuccessModal();
    if(typeof window.onProgramCreated === 'function') window.onProgramCreated(prog);
  }
  function currentCodesMode(){
    return (document.querySelector('[data-wz-name="codes-mode"]')?.dataset?.wzValue) || 'upload';
  }
  /* Códigos antes de guardar: que haya (si se exigen), caracteres válidos,
     únicos (también frente a los que el programa ya tenía) y sin pasarse de
     lo que alcanza el rubro de cada incentivo. Muestra el error y devuelve false. */
  function checkCodesBeforeSave({ requireNew }){
    if(!hasBonoIncentive()) return true;
    const mode = currentCodesMode();
    if(requireNew){
      if(mode === 'upload'){
        const chip = document.getElementById('wzFileChip');
        if(!(chip && !chip.hidden && chip.innerHTML.trim().length)){
          showCodesError('Carga el archivo de códigos para continuar.');
          shakeDropzone(); scrollToCodesError(); return false;
        }
      } else if(!allManualCodes().length){
        showCodesError('Agrega al menos un código para continuar.');
        document.querySelector('#wzManualCodes .wz-mc__input')?.focus();
        scrollToCodesError(); return false;
      }
    }
    const list = mode === 'manual' ? allManualCodes().map(x => x.code) : (uploadedCodes || []).map(c => c.code);
    const bad = list.filter(c => c.replace(CODE_BAD, '') !== c);
    if(bad.length){
      showCodesError(`Hay ${bad.length} códigos con caracteres no permitidos: <strong>${bad.slice(0, 5).map(escapeHtml).join(', ')}</strong>${bad.length > 5 ? '…' : ''}. Solo letras sin tilde, números, - y _. Corrige el archivo y vuelve a subirlo.`);
      scrollToCodesError(); return false;
    }
    const seen = new Set((editingProgram()?.manualCodes || []).map(c => c.toUpperCase()));
    const dup = new Set();
    list.forEach(c => { const k = c.toUpperCase(); if(seen.has(k)) dup.add(c); seen.add(k); });
    if(dup.size){
      showCodesError(`Hay códigos repetidos o que el programa ya tenía: <strong>${[...dup].slice(0, 5).map(escapeHtml).join(', ')}</strong>${dup.size > 5 ? '…' : ''}. Cada código es único.`);
      scrollToCodesError(); return false;
    }
    const { bonos, counts } = codeCountsByIncentive();
    const over = bonos.map(m => {
      const expected = expectedFor(m.card);
      return { m, expected, n: (counts[m.idx] || 0) + (m.card._existingCodes || 0) };
    }).filter(x => x.expected && x.n > x.expected);
    if(over.length){
      showCodesError(over.map(x => `<strong>${escapeHtml(x.m.name)}</strong>: ${x.n} códigos en total y su rubro alcanza para ${x.expected}.`).join('<br/>') + ' Quita códigos o amplía el rubro del incentivo.');
      scrollToCodesError(); return false;
    }
    return true;
  }
  function showCodesError(text){
    const bx = document.getElementById('wzBudget');
    if(!bx) return;
    bx.hidden = false;
    bx.innerHTML = `
      <div class="naowee-message naowee-message--negative">
        <div class="naowee-message__header">
          <div class="naowee-message__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div class="naowee-message__text">${text}</div>
        </div>
      </div>`;
  }
  function shakeDropzone(){
    const dz = document.getElementById('wzDrop');
    if(!dz) return;
    dz.classList.remove('wz-shake');
    void dz.offsetWidth;
    dz.classList.add('wz-shake');
    setTimeout(() => dz.classList.remove('wz-shake'), 500);
  }
  function scrollToCodesError(){
    const body = document.getElementById('wzBody');
    const bx = document.getElementById('wzBudget');
    if(!body || !bx) return;
    const bodyRect = body.getBoundingClientRect();
    const bxRect = bx.getBoundingClientRect();
    body.scrollTo({ top: body.scrollTop + (bxRect.top - bodyRect.top) - 24, behavior: 'smooth' });
  }

  function saveDraft(){
    persistDraft();
    const overlay = document.getElementById('wzOverlay');
    if(overlay) overlay.classList.remove('open');
    isDirty = false;
  }

  /* Programa recién creado/guardado por activateProgram, para que goToProgramDetail
     pueda navegar al ID correcto. */
  let lastCreatedProgramId = null;
  /* Programa que se está editando (null = creando uno nuevo). */
  let editingProgramId = null;
  function editingProgram(){ return editingProgramId ? (window.PROGRAMS_DATA || []).find(p => p.id === editingProgramId) : null; }
  /* ══ Editar por sección (desde el detalle del programa) ══
     Abre el mismo wizard mostrando solo una sección, con Cancelar / Guardar
     cambios. "incentivos" sigue a las condiciones de los incentivos nuevos. */
  let sectionMode = null;
  let condOnlyNew = null; // tarjetas nuevas cuyas condiciones se piden tras editar incentivos
  const SECTIONS = {
    datos:       { pane: 1, title: 'Editar información general', hist: 'Información general editada' },
    equipo:      { pane: 1, title: 'Equipo del programa',        hist: 'Equipo del programa actualizado' },
    incentivos:  { pane: 2, title: 'Editar incentivos',          hist: 'Incentivos editados' },
    condiciones: { pane: 3, title: 'Editar condiciones',         hist: 'Condiciones de elegibilidad editadas' },
    codigos:     { pane: 4, title: 'Cargar códigos',             hist: 'Códigos cargados' }
  };
  function openWizardSection(programId, section){
    if(!SECTIONS[section]) return openWizardForEdit(programId);
    if(!isMounted){
      mount().then(() => openWizardSection(programId, section));
      return;
    }
    const prog = (window.PROGRAMS_DATA || []).find(p => p.id === programId);
    if(!prog) return;
    editingProgramId = prog.id;
    sectionMode = section;
    condOnlyNew = null;
    resetWizardForm();
    populateWizardFromProgram(prog);
    setWizardTexts();
    document.querySelector('#wzOverlay .wz-modal')?.setAttribute('data-section', section);
    document.getElementById('wzOverlay').classList.add('open');
    currentStep = SECTIONS[section].pane;
    isDirty = false;
    renderStep();
    requestAnimationFrame(() => setTimeout(refreshSegmentPills, 50));
  }
  function leaveSectionMode(){
    sectionMode = null;
    condOnlyNew = null;
    document.querySelector('#wzOverlay .wz-modal')?.removeAttribute('data-section');
  }
  function sectionNext(){
    if(!validateStep(currentStep)) return;
    if(sectionMode === 'incentivos' && currentStep === 2){
      const fresh = [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')].filter(c => !c._orig);
      if(fresh.length){ condOnlyNew = new Set(fresh); currentStep = 3; renderStep(); return; }
    }
    if(sectionMode === 'codigos' && !checkCodesBeforeSave({ requireNew: true })) return;
    saveSection();
  }
  function saveSection(){
    const orig = editingProgram();
    const prog = buildProgramFromForm(orig?.status || 'active');
    const cfg = SECTIONS[sectionMode];
    let desc = '';
    if(sectionMode === 'codigos'){
      const added = (prog.codes?.total || 0) - (orig?.codes?.total || 0);
      desc = `${added} códigos nuevos agregados al inventario.`;
    } else if(sectionMode === 'incentivos'){
      const before = (orig?.incentives || []).map(i => i.name);
      const after = prog.incentives.map(i => i.name);
      const nuevos = after.filter(n => !before.includes(n));
      const quitados = before.filter(n => !after.includes(n));
      const desact = prog.incentives.filter(i => i.active === false && (orig?.incentives || []).find(o => o.name === i.name)?.active !== false).map(i => i.name);
      desc = [nuevos.length && `Nuevos: ${nuevos.join(', ')}.`, quitados.length && `Eliminados: ${quitados.join(', ')}.`, desact.length && `Desactivados: ${desact.join(', ')}.`].filter(Boolean).join(' ') || 'Datos de los incentivos actualizados.';
    } else if(sectionMode === 'equipo'){
      desc = `Gestor: ${prog.team?.gestor || 'sin asignar'}. Operadores: ${prog.team?.operators?.length || 0}.`;
    } else desc = 'Cambios guardados desde el detalle del programa.';
    prog.history = [...(orig?.history || []), { at: new Date().toISOString(), who: 'Doug Vargas', title: cfg.hist, desc }];
    persistProgram(prog);
    const section = sectionMode;
    document.getElementById('wzOverlay').classList.remove('open');
    isDirty = false;
    leaveSectionMode();
    if(typeof window.onSectionSaved === 'function') window.onSectionSaved(prog, section);
    else showToast('Cambios guardados.', 'positive');
  }

  function setWizardTexts(){
    const t = document.getElementById('wzTitle');
    const sub = document.querySelector('#wzOverlay .naowee-modal__subtitle');
    if(t) t.textContent = sectionMode ? SECTIONS[sectionMode].title : editingProgramId ? 'Editar programa de incentivos' : 'Crear programa de incentivos';
    const pname = editingProgram()?.name || '';
    if(sub) sub.textContent = sectionMode ? `${pname} · ${editingProgramId}` : editingProgramId ? `${editingProgramId} · los cambios reemplazan la versión actual.` : 'Completa los datos del programa. Puedes guardar como borrador y retomar después.';
  }

  /* Construye un program completo desde el formulario del wizard (todos los pasos)
     y lo persiste en window.PROGRAMS_DATA + sessionStorage queue (cross-page). */
  function buildProgramFromForm(status){
    const data = window.PROGRAMS_DATA;
    if(!Array.isArray(data)) return null;

    /* === Step 1 — Datos === */
    const name = (document.getElementById('fName')?.value || '').trim() || 'Programa sin nombre';
    const descEl = document.querySelector('.wz-pane[data-pane="1"] .naowee-textfield--textarea textarea');
    const desc = descEl ? (descEl.value || '').trim() : '';
    const fromEl = document.querySelector('[data-wz-range="from"][data-wz-range-name="vigencia"] input');
    const toEl   = document.querySelector('[data-wz-range="to"][data-wz-range-name="vigencia"] input');
    const from = (fromEl?.value || '').trim() || '—';
    const to   = (toEl?.value || '').trim() || '—';
    // Cobertura: leer todos los chips confirmados del tag-multi.
    const cobField = document.querySelector('[data-wz-name="cobertura"]');
    const cobCsv = cobField?.dataset?.wzValue || '';
    const cobLabels = cobCsv ? cobCsv.split(',').map(v => {
      const opt = cobField.querySelector(`.wz-tag-multi__option[data-val="${v}"]`);
      return opt ? (opt.dataset.label || v) : v;
    }) : [];
    const coverage = cobLabels.length === 0 ? '—'
      : cobLabels.length === 1 ? cobLabels[0]
      : cobLabels.length <= 3 ? cobLabels.join(', ')
      : `${cobLabels.length} departamentos`;
    const eventoVal = document.querySelector('[data-wz-name="evento"]')?.dataset?.wzValue || '';
    const eventoLbl = eventoVal ? (document.querySelector(`[data-wz-name="evento"] .naowee-dropdown__option[data-val="${eventoVal}"]`)?.textContent?.trim() || eventoVal) : '';

    /* === Step 2 — Tipos & rubro === */
    const rubro = parseMoney(document.getElementById('wzRubroTotal'));
    const cards = [...document.querySelectorAll('.wz-pane[data-pane="2"] .wz-inc-card')];
    const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
    const fmtMoney = v => '$' + Number(v||0).toLocaleString('es-CO');
    const VARIANT_BY_CAT = { bono:'positive', credito:'informative', beca:'informative', kit:'caution', transporte:'neutral', inscripcion:'informative', descuento:'caution', pase:'neutral', dinero:'positive' };
    const incentives = cards.map((c, i) => {
      const m = readIncCard(c, i);
      const catLabel = m.catLbl !== '—' ? m.catLbl : cap(m.catKey);
      const incRubro = parseMoney(c.querySelector('.wz-inc-card__rubro input'));
      const unit = parseMoney(c.querySelector('.wz-inc-card__unit input'));
      const badges = [{ text: catLabel, variant: VARIANT_BY_CAT[m.catKey] || 'neutral' }];
      if(m.benefLbl) badges.unshift({ text: m.benefLbl, variant: 'neutral' });
      return {
        name: m.name,
        category: catLabel,
        categoryKey: m.catKey,
        beneficiary: m.benef,
        beneficiaryLabel: m.benefLbl,
        active: !c.dataset.inactive,
        delivered: c._orig?.delivered || 0,
        detail: incRubro ? `Rubro asignado: ${fmtMoney(incRubro)}` : 'Sin rubro definido',
        rubro: incRubro,
        value: unit,
        valueLabel: unit ? fmtMoney(unit) : '—',
        valueFoot: unit ? 'por beneficiario' : '',
        badges,
        /* Condiciones: del reglamento o personalizadas (armador simple, todas Y) */
        conditions: conditionsForCard(c, m)
      };
    });
    const firstCat = (cards[0]?.querySelector('[data-wz-name="categoria"]')?.dataset?.wzValue || '').toLowerCase();
    const ICON_BY_CAT = {
      bono:        { bg: '#e6f4e7', color: '#1f8923' },
      beca:        { bg: '#fff3e6', color: '#d74009' },
      kit:         { bg: '#eef5ff', color: '#1f78d1' },
      transporte:  { bg: '#f3e8ff', color: '#7c3aed' },
      inscripcion: { bg: '#fff3e6', color: '#d74009' },
      descuento:   { bg: '#fff0ee', color: '#b42318' },
      pase:        { bg: '#f5f6fa', color: '#646587' },
      dinero:      { bg: '#e6f4e7', color: '#1f8923' }
    };
    const iconStyle = ICON_BY_CAT[firstCat] || { bg: '#f5f6fa', color: '#646587' };

    /* === Step 3 — Condiciones: predefinidas por incentivo (ver arriba) === */
    const groups = [];
    const summary = '';

    /* === Step 4 — Códigos (por incentivo Bono) === */
    let codeCount = 0;
    let manualCodes = [];
    let codesMode = 'none';
    let codesFile = '';
    let codesByIncentive = [];
    let manualCodesByIncentive = [];
    if(hasBonoIncentive()){
      const cc = codeCountsByIncentive();
      codesMode = cc.mode;
      codesByIncentive = cc.bonos.map(m => ({ name: m.name, count: cc.counts[m.idx] || 0 }));
      if(codesMode === 'manual'){
        manualCodes = allManualCodes().map(x => x.code);
        manualCodesByIncentive = cc.bonos.map(m => ({ name: m.name, codes: [...manualCodesOf(m.card)] }));
        codeCount = manualCodes.length;
      } else {
        const chip = document.getElementById('wzFileChip');
        codesFile = chip?.querySelector('.wz-file-chip__name')?.textContent?.trim() || '';
        codeCount = uploadedCodes ? uploadedCodes.length
          : cards.reduce((acc, c) => {
              const r = parseMoney(c.querySelector('.wz-inc-card__rubro input'));
              const u = parseMoney(c.querySelector('.wz-inc-card__unit input'));
              return acc + (r && u ? Math.floor(r / u) : 0);
            }, 0);
      }
    }

    /* === Equipo del programa === */
    const ddVals = n => (document.querySelector(`.wz-pane[data-pane="1"] [data-wz-name="${n}"]`)?.dataset?.wzValue || '').split(',').filter(Boolean);
    const ddLabel = (n, v) => document.querySelector(`.wz-pane[data-pane="1"] [data-wz-name="${n}"] .naowee-dropdown__option[data-val="${v}"]`)?.textContent?.trim() || v;
    const gestorKey = ddVals('gestor-programa')[0] || '';
    const operatorKeys = ddVals('operadores');
    const team = {
      gestorKey,
      gestor: gestorKey ? ddLabel('gestor-programa', gestorKey) : '',
      operatorKeys,
      operators: operatorKeys.map(k => ddLabel('operadores', k))
    };

    /* === Código del programa: PRG-AAAA-NNN ===
       Año actual + consecutivo dentro de ese año (el siguiente al mayor que
       exista). En el producto lo asigna el backend (evita choques si dos
       gestores crean a la vez) y no cambia al editar. */
    const year = new Date().getFullYear();
    const yearPrefix = `PRG-${year}-`;
    const lastN = data.map(p => String(p.id || ''))
      .filter(x => x.startsWith(yearPrefix))
      .map(x => parseInt(x.slice(yearPrefix.length), 10) || 0)
      .reduce((a, b) => Math.max(a, b), 0);
    let id = yearPrefix + String(lastN + 1).padStart(3, '0');
    const orig = editingProgram();
    if(orig) id = orig.id;

    const built = {
      id,
      name,
      shortDesc: desc.slice(0, 80) || (coverage !== '—' ? coverage : 'Sin descripción'),
      longDesc: desc || '',
      iconBg: iconStyle.bg,
      iconColor: iconStyle.color,
      status,
      event: eventoLbl,
      eventKey: eventoVal,
      coverage,
      coverageKeys: cobCsv ? cobCsv.split(',') : [],
      responsible: 'Doug Vargas',
      rubro,
      exec: 0,
      unit: parseMoney(getBonoUnitInput()) || (cards[0] ? parseMoney(cards[0].querySelector('.wz-inc-card__unit input')) : 0),
      team,
      codesByIncentive,
      codes: { total: codeCount, avail: codeCount, asig: 0, rev: 0 },
      from, to,
      actoAdmin: '',
      fuente: 'Ministerio del Deporte · 2026',
      incentives,
      conditions: { groups, summary },
      // Marcar como creado por el usuario para que el detalle no use el seed
      // de demo (200 códigos fake, 182 asignaciones fake, etc).
      _userCreated: true,
      manualCodes,
      manualCodesByIncentive,
      codesMode,
      codesFile,
      createdAt: new Date().toISOString()
    };
    if(!orig) return built;
    /* Códigos de incentivos eliminados: se descartan del inventario. */
    const keptNames = new Set(built.incentives.map(i => i.name));
    const removedCodes = (orig.codesByIncentive || []).filter(c => !keptNames.has(c.name)).reduce((a, c) => a + c.count, 0);
    const baseCodes = orig.codes
      ? { ...orig.codes, total: Math.max(0, (orig.codes.total || 0) - removedCodes), avail: Math.max(0, (orig.codes.avail || 0) - removedCodes) }
      : built.codes;
    /* Edición: se conserva lo que el formulario no maneja (ejecución,
       identidad visual, códigos ya cargados si no se cargaron nuevos) y un
       programa activo no vuelve a borrador por "Guardar borrador". */
    return {
      ...orig, ...built,
      id: orig.id,
      iconBg: orig.iconBg, iconColor: orig.iconColor,
      exec: orig.exec,
      status: status === 'draft' && orig.status && orig.status !== 'draft' ? orig.status : status,
      /* Los códigos nuevos se SUMAN al inventario que ya tenía el programa. */
      codes: codeCount
        ? { total: (baseCodes.total || 0) + codeCount, avail: (baseCodes.avail || 0) + codeCount, asig: baseCodes.asig || 0, rev: baseCodes.rev || 0 }
        : baseCodes,
      codesByIncentive: (() => {
        const acc = {};
        (orig.codesByIncentive || []).filter(c => keptNames.has(c.name)).forEach(c => { acc[c.name] = (acc[c.name] || 0) + c.count; });
        if(codeCount) (built.codesByIncentive || []).forEach(c => { acc[c.name] = (acc[c.name] || 0) + c.count; });
        return Object.entries(acc).map(([name, count]) => ({ name, count }));
      })(),
      manualCodes: [...(orig.manualCodes || []), ...(built.manualCodes || [])],
      history: orig.history || [],
      _userCreated: orig._userCreated,
      createdAt: orig.createdAt || built.createdAt,
      updatedAt: new Date().toISOString()
    };
  }

  /* Persiste el programa: lo unshift en PROGRAMS_DATA y lo encola en
     sessionStorage para que otras páginas (detalle, lista) lo absorban. */
  function persistProgram(prog){
    if(!prog) return;
    /* SOLO DEMO: se guarda en localStorage (shared/programs-data.js) para
       que sobreviva recargas; si no está disponible, queda solo en memoria. */
    if(typeof window.saveDemoProgram === 'function') window.saveDemoProgram(prog);
    else {
      const data = window.PROGRAMS_DATA;
      if(Array.isArray(data)){
        const i = data.findIndex(x => x.id === prog.id);
        if(i >= 0) data[i] = prog; else data.unshift(prog);
      }
    }
    lastCreatedProgramId = prog.id;
  }

  /* Compat alias usado por saveDraft/confirmSaveDraftWizard. */
  function persistDraft(){
    const prog = buildProgramFromForm('draft');
    persistProgram(prog);
    if(typeof window.onDraftSaved === 'function') window.onDraftSaved(prog);
  }

  /* ══ SOLO DEMO · Llenado rápido con Juegos Intercolegiados 2026 ══
     Atajo para presentar la demo sin digitar en vivo. NO es funcionalidad del
     producto. Los datos salen del xlsx de parámetros 2026. */
  const INTERCOLEGIADOS_2026 = {
    name: 'Juegos Intercolegiados 2026',
    desc: 'Incentivos a deportistas, docentes y establecimientos educativos ganadores de la fase final nacional de los Juegos Intercolegiados 2026.',
    evento: 'intercolegiados2026',
    incentives: [
      { name: 'Bono deportivo · Deportistas',                 benef: 'deportista',   cat: 'bono' },
      { name: 'Crédito condonable ICETEX · Deportistas',      benef: 'deportista',   cat: 'credito' },
      { name: 'Bono deportivo · Docente entrenador',          benef: 'entrenador',   cat: 'bono' },
      { name: 'Crédito condonable ICETEX · Docente entrenador', benef: 'entrenador', cat: 'credito' },
      { name: 'Bono deportivo · Docente asistente',           benef: 'asistente',    cat: 'bono' },
      { name: 'Kit de implementación · Establecimiento educativo', benef: 'institucion', cat: 'kit' },
      { name: 'Kit de implementación · Organización para deportes', benef: 'organizacion', cat: 'kit' }
    ]
  };
  function applyIntercolegiadosTemplate(){
    const t = INTERCOLEGIADOS_2026;
    const fName = document.getElementById('fName');
    if(fName){ fName.value = t.name; clearError(fName.closest('.naowee-textfield')); }
    const desc = document.querySelector('.wz-pane[data-pane="1"] .naowee-textfield--textarea textarea');
    if(desc) desc.value = t.desc;
    setDropdownValue(document.querySelector('[data-wz-name="evento"]'), [t.evento]);
    // Cobertura nacional: el tag-multi guarda su estado en un closure, así que
    // se reproduce la interacción (abrir → Nacional → Agregar).
    document.querySelector('[data-wz-name="cobertura"]')?._setValues?.(['nacional']);
    const list = document.getElementById('wzIncList');
    if(list) list.innerHTML = '';
    incCounter = 0;
    t.incentives.forEach(inc => {
      const card = addIncentive({ focus: false });
      if(!card) return;
      card.querySelector('input[type="text"]').value = inc.name;
      setDropdownValue(card.querySelector('[data-wz-name="beneficiario"]'), [inc.benef]);
      setDropdownValue(card.querySelector('[data-wz-name="categoria"]'), [inc.cat]);
    });
    refreshIncCardHints();
    updateRubroAllocation();
    isDirty = true;
    renderStep();
    showToast('Formulario llenado con los 7 incentivos de Intercolegiados 2026 (atajo de la demo).', 'positive');
  }

  /* ══ Expose to window ══ */
  window.openWizard = openWizard;
  window.openWizardForEdit = openWizardForEdit;
  window.closeWizard = closeWizard;
  window.goStep = goStep;
  window.tryGoStep = tryGoStep;
  window.nextStep = nextStep;
  window.prevStep = prevStep;
  window.saveDraft = saveDraft;
  window.activateProgram = activateProgram;
  window.addIncentive = () => addIncentive();
  window.applyIntercolegiadosTemplate = applyIntercolegiadosTemplate;
  window.downloadCodesTemplate = downloadCodesTemplate;
  window.confirmCodesSwitch = confirmCodesSwitch;
  window.openWizardSection = openWizardSection;
  window.confirmIncDelete = confirmIncDelete;
  window.cancelIncDelete = cancelIncDelete;
  window.reactivateIncentive = reactivateIncentive;
  window.cancelCodesSwitch = cancelCodesSwitch;
  window.removeIncentive = removeIncentive;
  window.addConditionGroup = addConditionGroup;
  window.removeConditionGroup = removeConditionGroup;
  window.addConditionRow = addConditionRow;
  window.removeConditionRow = removeConditionRow;
  window.resetWzFile = resetWzFile;
  window.closeSuccessAndNew = closeSuccessAndNew;
  window.goToProgramDetail = goToProgramDetail;
  window.confirmDiscardWizard = confirmDiscardWizard;
  window.confirmSaveDraftWizard = confirmSaveDraftWizard;

  /* ══ Auto-mount on load, auto-open if ?new=1 ══ */
  document.addEventListener('DOMContentLoaded', () => {
    mount().then(() => {
      if(new URLSearchParams(location.search).get('new') === '1'){
        setTimeout(openWizard, 200);
      }
    });
  });
})();
