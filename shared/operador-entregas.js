/* ══════════════════════════════════════════════════════════════════
   Entregas del operador en la demo (compartido 08 · 14).

   Registros base deterministas + lo que haya pasado en la demo
   (localStorage 'inc-op-ledger'). "Asignar incentivo" usa el conteo de
   evidencias pendientes para su aviso; "Mis asignaciones" pinta la tabla.
   ══════════════════════════════════════════════════════════════════ */
const MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
/* Programa de cada entrega. Las del seed son en su mayoría de JIN 2026; unas
   pocas de Bono transporte (activo) y de Olimpiadas indígenas 2025 (cerrado). */
const JIN_ID = 'PRG-2026-010', TRANSP_ID = 'PRG-2026-003', INDIG_ID = 'PRG-2025-019';

/* Registros base (mock determinístico). R-0001 y R-0002 coinciden con los casos de demo de "Asignar". */
function buildStatic(){
  const fixed = [
    { id:'R-0001', name:'Valentina Pérez Gómez', docType:'TI', doc:'1033445566', level:'deportista', incId:'bono-dep', d:[2026,8,15,16,5], evidence:null, kind:'evidence-pending', zone:'Atlántico' },
    { id:'R-0002', name:'Sebastián Camilo Vargas Rincón', docType:'TI', doc:'1022334455', level:'deportista', incId:'bono-dep', d:[2026,8,10,15,18], evidence:'foto-entrega-sebastian.jpg', kind:'all-assigned', zone:'Cundinamarca' },
    { id:'R-0003', name:'Juan Sebastián Rodríguez', docType:'TI', doc:'1019887766', level:'deportista', incId:'credito', d:[2026,8,9,11,20], evidence:'acta-icetex.pdf', estado:'rev',
      motivo:'Beneficiario no elegible', detalle:'Cursa grado 10°, el Crédito Condonable exige grado 11°.', revertedBy:'Juan Rodríguez · Operador', revertedAt:'11 sep 2026 · 09:12', zone:'Valle del Cauca' },
    { id:'R-0004', name:'I.E. Normal Superior de Pasto', docType:'DANE', doc:'152001000456', level:'institucion', incId:'kit', d:[2026,8,18,10,0], evidence:'kit-normal-pasto.jpg', zone:'Nariño' },
    { id:'R-0005', name:'Ana María Castro Luna', docType:'CC', doc:'1044001122', level:'docente-asistente', incId:'bono-dep', d:[2026,8,19,17,40], evidence:null, zone:'Santander' }
  ];
  const PEOPLE = [['Laura Valentina Mejía','deportista'],['Tomás Restrepo Ossa','deportista'],['Mariana Soto Ríos','paradeportista'],['Isabella Gil Cano','deportista'],['Esteban Mora Díaz','docente-entrenador'],['Natalia Ruiz Peña','deportista'],['Felipe Cárdenas León','deportista'],['Diana Torres Vélez','docente-entrenador'],['Nicolás Bernal Rey','deportista'],['Alejandra Vargas Paz','paradeportista'],['Santiago López Gil','deportista'],['Camila Ríos Duarte','deportista']];
  const ZONES = ['Atlántico','Bolívar','Antioquia','Cundinamarca','Santander','Valle del Cauca','Nariño','Boyacá'];
  const out = fixed.slice();
  for(let i=0;i<26;i++){
    const [name, level] = PEOPLE[i % PEOPLE.length];
    const prgId = i % 9 === 7 ? INDIG_ID : (i % 5 === 3 ? TRANSP_ID : JIN_ID);
    const incId = prgId === INDIG_ID ? 'bono-indig' : prgId === TRANSP_ID ? 'bono-transp'
      : level.startsWith('docente') ? (i % 2 ? 'credito' : 'bono-dep') : (i % 3 === 2 ? 'credito' : 'bono-dep');
    const day = 1 + ((i * 5) % 21), month = prgId === INDIG_ID ? 10 : (i < 20 ? 8 : 7), year = prgId === INDIG_ID ? 2025 : 2026;
    out.push({ id:'R-' + String(i + 6).padStart(4,'0'), name, level, incId, prgId,
      docType: level.startsWith('docente') ? 'CC' : 'TI', doc: String(1004000000 + i * 7919),
      d:[year, month, day, 8 + (i * 3) % 10, (i * 13) % 60],
      /* Un programa cerrado no deja entregas a medias: todas con evidencia. */
      evidence: i % 7 === 3 && prgId !== INDIG_ID ? null : `evidencia-${i + 6}.jpg`,
      estado: i % 11 === 5 ? 'rev' : 'asig',
      motivo: i % 11 === 5 ? 'Error en la asignación' : null, detalle: i % 11 === 5 ? 'Se registró el incentivo equivocado; se reasignó el correcto.' : null,
      revertedBy: i % 11 === 5 ? 'Juan Rodríguez · Operador' : null, revertedAt: i % 11 === 5 ? `${String(day).padStart(2,'0')} ${MES[month]} ${year}` : null,
      zone: ZONES[i % ZONES.length] });
  }
  /* Los bonos llevan código; cada bono tiene su prefijo. */
  const PREFIX = { 'bono-dep':'2026BD', 'bono-transp':'2026TR', 'bono-alim':'2026AL', 'bono-indig':'2025OI' };
  out.forEach((r, i) => { if(!r.code && PREFIX[r.incId]) r.code = `${PREFIX[r.incId]}-${String(300 + i * 7).padStart(5,'0')}`; });
  return out.map(r => {
    const [y,m,dd,h,mi] = r.d;
    const dt = new Date(y, m, dd, h, mi);
    return Object.assign({ estado:'asig' }, r, { dt: dt.getTime(),
      fecha:`${String(dd).padStart(2,'0')} ${MES[m]} ${y}`, hora:`${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}` });
  });
}


/* Entregas sin evidencia en programas activos (las de un programa cerrado
   quedan solo para consulta). Requiere programs-data.js. */
function pendingEvidenceCount(){
  let L = {};
  try{ L = JSON.parse(localStorage.getItem('inc-op-ledger') || '{}') || {}; }catch(e){}
  const rows = buildStatic().map(r => L[r.id] ? Object.assign({}, r, L[r.id]) : r);
  Object.values(L).filter(r => r.isNew && r.doc).forEach(r => rows.push(r));
  const active = id => { const p = (window.PROGRAMS_DATA || []).find(x => x.id === id); return !p || p.status === 'active'; };
  return rows.filter(r => (r.estado || 'asig') !== 'rev' && !r.evidence && active(r.prgId || r.programId || JIN_ID)).length;
}
