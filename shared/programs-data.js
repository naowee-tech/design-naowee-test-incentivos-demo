/* ═══════════════════════════════════════════════════════════════
   PROGRAMAS — data fuente de verdad
   Consumida por incentivo-03 (lista) y incentivo-05 (detalle).
   Cada programa tiene info completa: identidad visual, rubro,
   tipos de incentivo, condiciones y historial.
   ═══════════════════════════════════════════════════════════════ */
window.PROGRAMS_DATA = [
  /* Programa de la primera entrega (reunión 22-09-2026): Juegos Intercolegiados
     2026 con los incentivos y condiciones del reglamento (xlsx de parámetros). */
  {
    id: 'PRG-2026-010',
    codePrefix: '2026BD',
    name: 'Juegos Intercolegiados 2026',
    shortDesc: 'Ganadores fase final nacional · Nacional',
    longDesc: 'Incentivos a deportistas, docentes y establecimientos educativos ganadores de la fase final nacional de los Juegos Intercolegiados 2026.',
    iconBg: '#e6f4e7',
    iconColor: '#15803d',
    status: 'active',
    event: 'Juegos Intercolegiados 2026',
    eventKey: 'intercolegiados2026',
    coverage: 'Nacional',
    responsible: 'Elkin Ávila',
    team: {
      gestorKey: 'elkin.avila', gestor: 'Elkin Ávila · Ministerio del Deporte',
      operatorKeys: ['juan.rodriguez', 'maria.perez'], operators: ['Juan Rodríguez · Operador', 'María Pérez · Operadora']
    },
    rubro: 0,
    exec: 0,
    unit: 100000,
    /* asig = entregas (34, incluye 10 de Crédito que no usan código);
       avail = 200 códigos − 24 entregados con código. */
    codes: { total: 200, avail: 176, asig: 34, rev: 2 },
    codesByIncentive: [
      { name: 'Bono deportivo · Deportistas', count: 120 },
      { name: 'Bono deportivo · Docente entrenador', count: 50 },
      { name: 'Bono deportivo · Docente asistente', count: 30 }
    ],
    from: '—',
    to: '—',
    actoAdmin: 'Reglamento Juegos Intercolegiados 2026',
    fuente: 'Ministerio del Deporte · 2026',
    incentives: [
      { name: 'Bono deportivo · Deportistas', category: 'Bono', categoryKey: 'bono', beneficiary: 'deportista', delivered: 20, beneficiaryLabel: 'Deportista',
        detail: '1er puesto fase final nacional · grado ≤ 11°', value: 0, valueLabel: '—', valueFoot: '',
        badges: [{ text: 'Deportista', variant: 'neutral' }, { text: 'Bono', variant: 'positive' }],
        conditions: { groups: [{ logic: 'AND', rules: [
          { field: 'Logro', op: '=', value: 'Primer puesto · fase final nacional' },
          { field: 'Grado escolar al inscribirse', op: '≤', value: '11°' },
          { field: 'Deportes individuales', op: '→', value: '1 solo incentivo aunque gane varias pruebas' }
        ]}], summary: '' } },
      { name: 'Crédito condonable ICETEX · Deportistas', category: 'Crédito condonable', categoryKey: 'credito', beneficiary: 'deportista', delivered: 8, beneficiaryLabel: 'Deportista',
        detail: 'Oro fase final nacional · grado 11° (12° normal superior)', value: 0, valueLabel: '—', valueFoot: '',
        badges: [{ text: 'Deportista', variant: 'neutral' }, { text: 'Crédito condonable', variant: 'informative' }],
        conditions: { groups: [{ logic: 'AND', rules: [
          { field: 'Logro', op: '=', value: 'Primer puesto / medalla de oro · fase final nacional' },
          { field: 'Grado escolar al inscribirse', op: '∈', value: '{11°, 12° en escuelas normales superiores}' },
          { field: 'Deportes individuales', op: '→', value: '1 solo incentivo aunque gane varias pruebas' }
        ]}], summary: '' } },
      { name: 'Bono deportivo · Docente entrenador', category: 'Bono', categoryKey: 'bono', beneficiary: 'entrenador', delivered: 4, beneficiaryLabel: 'Docente / Entrenador',
        detail: 'Inscrito con el campeón desde la fase municipal', value: 0, valueLabel: '—', valueFoot: '',
        badges: [{ text: 'Docente / Entrenador', variant: 'neutral' }, { text: 'Bono', variant: 'positive' }],
        conditions: { groups: [{ logic: 'AND', rules: [
          { field: 'Deportista o equipo', op: '=', value: 'Campeón (oro) · fase final nacional' },
          { field: 'Inscrito en la plataforma', op: 'desde', value: 'Fase municipal' },
          { field: 'Inscribió y acompañó al campeón', op: 'de', value: 'Fase municipal a fase final departamental' },
          { field: 'Relación con el deportista', op: '=', value: 'La registrada en la inscripción (no quien lo acompañó en la final nacional)' }
        ]}], summary: '' } },
      { name: 'Crédito condonable ICETEX · Docente entrenador', category: 'Crédito condonable', categoryKey: 'credito', beneficiary: 'entrenador', delivered: 2, beneficiaryLabel: 'Docente / Entrenador',
        detail: 'Inscrito con el campeón desde la fase municipal', value: 0, valueLabel: '—', valueFoot: '',
        badges: [{ text: 'Docente / Entrenador', variant: 'neutral' }, { text: 'Crédito condonable', variant: 'informative' }],
        conditions: { groups: [{ logic: 'AND', rules: [
          { field: 'Deportista o equipo', op: '=', value: 'Campeón (oro) · fase final nacional' },
          { field: 'Inscrito en la plataforma', op: 'desde', value: 'Fase municipal' },
          { field: 'Relación con el deportista', op: '=', value: 'La registrada en la inscripción' }
        ]}], summary: '' } },
      { name: 'Bono deportivo · Docente asistente', category: 'Bono', categoryKey: 'bono', beneficiary: 'asistente', delivered: 0, beneficiaryLabel: 'Docente / Asistente (deportes de conjunto)',
        detail: 'Deportes de conjunto · equipo campeón', value: 0, valueLabel: '—', valueFoot: '',
        badges: [{ text: 'Docente / Asistente', variant: 'neutral' }, { text: 'Bono', variant: 'positive' }],
        conditions: { groups: [{ logic: 'AND', rules: [
          { field: 'Deporte', op: '=', value: 'De conjunto' },
          { field: 'Equipo', op: '=', value: 'Campeón (oro) · fase final nacional' },
          { field: 'Inscribió y acompañó al equipo', op: 'de', value: 'Fase municipal a fase final departamental' }
        ]}], summary: '' } },
      { name: 'Kit de implementación · Establecimiento educativo', category: 'Kit', categoryKey: 'kit', beneficiary: 'institucion', beneficiaryLabel: 'Institución educativa',
        detail: 'Más oros en deportes convencionales · solo 1er lugar', value: 0, valueLabel: '—', valueFoot: '',
        badges: [{ text: 'Institución educativa', variant: 'neutral' }, { text: 'Kit', variant: 'caution' }],
        conditions: { groups: [{ logic: 'AND', rules: [
          { field: 'Ranking', op: '=', value: 'Más medallas de oro en deportes convencionales · fase final nacional' },
          { field: 'Desempate', op: '=', value: 'Plata → bronce → más deportistas clasificados a la final nacional' },
          { field: 'Recibe', op: '=', value: 'Solo el 1er lugar' }
        ]}], summary: '' } },
      { name: 'Kit de implementación · Organización para deportes', category: 'Kit', categoryKey: 'kit', beneficiary: 'organizacion', beneficiaryLabel: 'Organización para personas con discapacidad',
        detail: 'Más oros en para deportes · solo 1er lugar', value: 0, valueLabel: '—', valueFoot: '',
        badges: [{ text: 'Organización', variant: 'neutral' }, { text: 'Kit', variant: 'caution' }],
        conditions: { groups: [{ logic: 'AND', rules: [
          { field: 'Ranking', op: '=', value: 'Más medallas de oro en para deportes · fase final nacional' },
          { field: 'Desempate', op: '=', value: 'Plata → bronce → más deportistas clasificados a la final nacional' },
          { field: 'Recibe', op: '=', value: 'Solo el 1er lugar' }
        ]}], summary: '' } }
    ],
    conditions: { groups: [], summary: '' }
  },
  {
    id: 'PRG-2026-001',
    team: { gestorKey: 'danna.arrieta', gestor: 'Danna Arrieta · Naowee', operatorKeys: ['carlos.gomez', 'andrea.lopez'], operators: ['Carlos Gómez · Operador', 'Andrea López · Operadora'] },
    name: 'Becas deportivas 2026',
    shortDesc: 'Medallistas de oro · Nacional',
    longDesc: 'Beca educativa dirigida a deportistas medallistas de oro y plata de los Juegos Nacionales 2025, para apoyar su formación profesional universitaria.',
    iconBg: '#fff3e6',
    iconColor: '#d74009',
    status: 'active',
    event: 'Juegos Nacionales 2025',
    coverage: 'Nacional',
    responsible: 'Doug Vargas',
    rubro: 200000000,
    exec: 182000000,
    unit: 1000000,
    codes: { total: 200, avail: 18, asig: 179, rev: 3 },
    from: '01 ene 2026',
    to: '31 dic 2026',
    actoAdmin: 'Resolución 2026-115',
    fuente: 'Ministerio del Deporte · 2026',
    incentives: [
      { name: 'Beca educativa · Medallistas de oro', category: 'Beca',
        detail: 'Cualitativo + monetario · 200 cupos planeados',
        value: 1000000, valueLabel: '$1.000.000', valueFoot: 'por beneficiario',
        badges: [{ text: 'Beca', variant: 'informative' }, { text: 'Monetario', variant: 'positive' }] }
    ],
    conditions: {
      groups: [
        { logic: 'AND', rules: [
          { field: 'Edad', op: '≥', value: '18' },
          { field: 'Categoría deportiva', op: '=', value: 'Prejuvenil o superior' }
        ]},
        { logic: 'AND', rules: [
          { field: 'Logros', op: '∈', value: '{"medalla de oro", "medalla de plata"}' }
        ]}
      ],
      summary: 'Aplica para deportistas <strong>mayores de 18 años con categoría prejuvenil o superior</strong>, o deportistas <strong>con medalla de oro o plata</strong> (sin importar la edad).'
    }
  },
  {
    id: 'PRG-2026-002',
    team: { gestorKey: 'laura.mejia', gestor: 'Laura Mejía · Coordinación Intercolegiados', operatorKeys: ['maria.perez'], operators: ['María Pérez · Operadora'] },
    name: 'Kit deportivo Atlántico',
    shortDesc: 'Disciplinas de pista · Atlántico',
    longDesc: 'Entrega de kits deportivos (uniforme, calzado y accesorios de entrenamiento) a atletas de disciplinas de pista del departamento del Atlántico.',
    iconBg: '#eef5ff',
    iconColor: '#1f78d1',
    status: 'active',
    event: 'Liga Departamental Atlántico 2026',
    coverage: 'Atlántico',
    responsible: 'Laura Meza',
    rubro: 87500000,
    exec: 37800000,
    unit: 350000,
    codes: { total: 250, avail: 142, asig: 108, rev: 0 },
    from: '01 mar 2026',
    to: '30 abr 2026',
    actoAdmin: 'Convenio 2026-ATL-018',
    fuente: 'Indeportes Atlántico · 2026',
    incentives: [
      { name: 'Kit uniforme · Atletismo pista', category: 'Kit',
        detail: 'Camiseta, pantaloneta, medias y spikes · 250 unidades',
        value: 350000, valueLabel: '$350.000', valueFoot: 'por kit',
        badges: [{ text: 'Kit', variant: 'caution' }, { text: 'En especie', variant: 'neutral' }] }
    ],
    conditions: {
      groups: [
        { logic: 'AND', rules: [
          { field: 'Categoría deportiva', op: '=', value: 'Juvenil' },
          { field: 'Edad', op: '≤', value: '21' }
        ]}
      ],
      summary: 'Aplica para atletas <strong>juveniles con edad hasta 21 años</strong> inscritos en la liga departamental.'
    }
  },
  {
    id: 'PRG-2026-003',
    team: { gestorKey: 'elkin.avila', gestor: 'Elkin Ávila · Ministerio del Deporte', operatorKeys: ['juan.rodriguez', 'carlos.gomez'], operators: ['Juan Rodríguez · Operador', 'Carlos Gómez · Operador'] },
    name: 'Bono transporte intercolegiados',
    shortDesc: 'Prejuveniles · Cundinamarca',
    longDesc: 'Bono mensual de transporte para deportistas prejuveniles de Cundinamarca que participan en los juegos intercolegiados.',
    iconBg: '#e6f4e7',
    iconColor: '#15803d',
    status: 'active',
    event: 'Juegos Intercolegiados 2026',
    coverage: 'Cundinamarca',
    responsible: 'Carla Suárez',
    rubro: 60000000,
    exec: 14160000,
    unit: 120000,
    codes: { total: 500, avail: 382, asig: 118, rev: 0 },
    from: '15 feb 2026',
    to: '30 jun 2026',
    actoAdmin: 'Acuerdo 2026-CUN-042',
    fuente: 'Gobernación Cundinamarca · 2026',
    incentives: [
      { name: 'Bono transporte mensual', category: 'Bono',
        detail: 'Recarga TransMilenio/SITP · 500 cupos',
        value: 120000, valueLabel: '$120.000', valueFoot: 'por mes',
        badges: [{ text: 'Bono', variant: 'informative' }, { text: 'Transporte', variant: 'positive' }] }
    ],
    conditions: {
      groups: [
        { logic: 'AND', rules: [
          { field: 'Categoría deportiva', op: '=', value: 'Prejuvenil' },
          { field: 'Edad', op: '≥', value: '13' },
          { field: 'Edad', op: '≤', value: '17' }
        ]}
      ],
      summary: 'Aplica para deportistas <strong>prejuveniles entre 13 y 17 años</strong> del departamento.'
    }
  },
  {
    id: 'PRG-2026-004',
    team: { gestorKey: 'danna.arrieta', gestor: 'Danna Arrieta · Naowee', operatorKeys: ['andrea.lopez'], operators: ['Andrea López · Operadora'] },
    name: 'Inscripción juegos universitarios',
    shortDesc: 'Mayores de 18 · Nacional',
    longDesc: 'Cobertura del costo de inscripción a los juegos universitarios 2026 para estudiantes-atletas activos en universidades públicas.',
    iconBg: '#fff3e6',
    iconColor: '#d74009',
    status: 'active',
    event: 'Juegos Universitarios 2026',
    coverage: 'Nacional',
    responsible: 'Doug Vargas',
    rubro: 20000000,
    exec: 11000000,
    unit: 250000,
    codes: { total: 80, avail: 36, asig: 44, rev: 0 },
    from: '01 feb 2026',
    to: '15 jun 2026',
    actoAdmin: 'Resolución 2026-UNI-007',
    fuente: 'Mindeporte + ASCUN · 2026',
    incentives: [
      { name: 'Pago inscripción · Juegos Universitarios', category: 'Inscripción',
        detail: 'Cubre cuota única de inscripción · 80 cupos',
        value: 250000, valueLabel: '$250.000', valueFoot: 'por inscrito',
        badges: [{ text: 'Inscripción', variant: 'informative' }, { text: 'Monetario', variant: 'positive' }] }
    ],
    conditions: {
      groups: [
        { logic: 'AND', rules: [
          { field: 'Edad', op: '≥', value: '18' },
          { field: 'Categoría deportiva', op: '=', value: 'Mayores' }
        ]}
      ],
      summary: 'Aplica para <strong>estudiantes-atletas mayores de 18 años</strong> inscritos en universidades públicas.'
    }
  },
  {
    id: 'PRG-2026-005',
    team: { gestorKey: '', gestor: '', operatorKeys: [], operators: [] },
    name: 'Beca integral alto rendimiento',
    shortDesc: 'Élite · Nacional',
    longDesc: 'Beca integral (alimentación, alojamiento, entrenamiento y estímulos mensuales) para deportistas de alto rendimiento con proyección olímpica.',
    iconBg: '#e6f4e7',
    iconColor: '#15803d',
    status: 'draft',
    event: 'Proyección Panamericanos 2027',
    coverage: 'Nacional',
    responsible: 'Doug Vargas',
    rubro: 500000000,
    exec: 0,
    unit: 5000000,
    codes: { total: 0, avail: 0, asig: 0, rev: 0 },
    from: '—',
    to: '—',
    actoAdmin: 'Borrador · pendiente aprobación',
    fuente: 'Ministerio del Deporte · 2026',
    incentives: [
      { name: 'Beca integral alto rendimiento', category: 'Beca',
        detail: 'Pendiente definir número de cupos',
        value: 5000000, valueLabel: '$5.000.000', valueFoot: 'por beneficiario mensual',
        badges: [{ text: 'Beca', variant: 'informative' }, { text: 'Monetario', variant: 'positive' }, { text: 'Borrador', variant: 'neutral' }] }
    ],
    conditions: {
      groups: [
        { logic: 'AND', rules: [
          { field: 'Logros', op: '∈', value: 'Medalla de oro (internacional)' }
        ]}
      ],
      summary: '<strong>Borrador.</strong> Las condiciones están pendientes de revisión por el comité técnico.'
    }
  },
  {
    id: 'PRG-2025-019',
    team: { gestorKey: 'laura.mejia', gestor: 'Laura Mejía · Coordinación Intercolegiados', operatorKeys: ['juan.rodriguez'], operators: ['Juan Rodríguez · Operador'] },
    name: 'Bonos olimpiadas indígenas',
    shortDesc: 'Comunidades · Cauca',
    longDesc: 'Bono único de participación para comunidades indígenas del Cauca inscritas en las primeras Olimpiadas Indígenas Nacionales.',
    iconBg: '#eef5ff',
    iconColor: '#1f78d1',
    status: 'closed',
    event: 'Olimpiadas Indígenas Nacionales 2025',
    coverage: 'Cauca',
    responsible: 'Andrés Polo',
    rubro: 45000000,
    exec: 45000000,
    unit: 250000,
    codes: { total: 180, avail: 0, asig: 180, rev: 0 },
    from: '15 oct 2025',
    to: '15 dic 2025',
    actoAdmin: 'Convenio 2025-CAU-031',
    fuente: 'Ministerio + Gobernación Cauca · 2025',
    incentives: [
      { name: 'Bono participación · Olimpiadas indígenas', category: 'Bono',
        detail: 'Pago único de participación · 180 cupos',
        value: 250000, valueLabel: '$250.000', valueFoot: 'por deportista',
        badges: [{ text: 'Bono', variant: 'informative' }, { text: 'Monetario', variant: 'positive' }] }
    ],
    conditions: {
      groups: [
        { logic: 'AND', rules: [
          { field: 'Categoría deportiva', op: '=', value: 'Mayores' }
        ]}
      ],
      summary: '<strong>Programa cerrado.</strong> Ejecutado al 100% con 180 asignaciones.'
    }
  },
  {
    id: 'PRG-2025-017',
    team: { gestorKey: 'elkin.avila', gestor: 'Elkin Ávila · Ministerio del Deporte', operatorKeys: ['maria.perez', 'andrea.lopez'], operators: ['María Pérez · Operadora', 'Andrea López · Operadora'] },
    name: 'Kit fútbol juveniles Valle',
    shortDesc: 'Juveniles · Valle',
    longDesc: 'Entrega de kits de fútbol (uniforme, guayos y balones) para categorías juveniles de clubes del Valle del Cauca.',
    iconBg: '#eef5ff',
    iconColor: '#1f78d1',
    status: 'closed',
    event: 'Liga Juvenil Valle 2025',
    coverage: 'Valle del Cauca',
    responsible: 'Laura Meza',
    rubro: 32000000,
    exec: 31840000,
    unit: 320000,
    codes: { total: 100, avail: 0, asig: 99, rev: 1 },
    from: '01 sep 2025',
    to: '30 nov 2025',
    actoAdmin: 'Convenio 2025-VAL-022',
    fuente: 'Indervalle · 2025',
    incentives: [
      { name: 'Kit fútbol juvenil', category: 'Kit',
        detail: 'Uniforme + guayos + balón · 100 unidades',
        value: 320000, valueLabel: '$320.000', valueFoot: 'por kit',
        badges: [{ text: 'Kit', variant: 'caution' }, { text: 'En especie', variant: 'neutral' }] }
    ],
    conditions: {
      groups: [
        { logic: 'AND', rules: [
          { field: 'Categoría deportiva', op: '=', value: 'Juvenil' }
        ]}
      ],
      summary: '<strong>Programa cerrado.</strong> 99 kits entregados, 1 reversión por retiro del deportista.'
    }
  },
  {
    id: 'PRG-2025-012',
    team: { gestorKey: 'danna.arrieta', gestor: 'Danna Arrieta · Naowee', operatorKeys: ['carlos.gomez'], operators: ['Carlos Gómez · Operador'] },
    name: 'Becas juegos nacionales 2025',
    shortDesc: 'Oro/plata · Nacional',
    longDesc: 'Beca educativa para medallistas de oro y plata de los Juegos Nacionales 2025. Cubre matrícula universitaria del semestre 2026-I.',
    iconBg: '#fff3e6',
    iconColor: '#d74009',
    status: 'closed',
    event: 'Juegos Nacionales 2025',
    coverage: 'Nacional',
    responsible: 'Doug Vargas',
    rubro: 180000000,
    exec: 180000000,
    unit: 1000000,
    codes: { total: 180, avail: 0, asig: 180, rev: 0 },
    from: '01 jun 2025',
    to: '15 sep 2025',
    actoAdmin: 'Resolución 2025-116',
    fuente: 'Ministerio del Deporte · 2025',
    incentives: [
      { name: 'Beca universitaria · Medallistas', category: 'Beca',
        detail: 'Matrícula semestre 2026-I · 180 cupos',
        value: 1000000, valueLabel: '$1.000.000', valueFoot: 'por beneficiario',
        badges: [{ text: 'Beca', variant: 'informative' }, { text: 'Monetario', variant: 'positive' }] }
    ],
    conditions: {
      groups: [
        { logic: 'AND', rules: [
          { field: 'Logros', op: '∈', value: '{"medalla de oro", "medalla de plata"}' }
        ]}
      ],
      summary: '<strong>Programa cerrado.</strong> 180 becas otorgadas. Ejecución 100%.'
    }
  }
];

window.getProgramById = function(id){
  return window.PROGRAMS_DATA.find(p => p.id === id) || window.PROGRAMS_DATA[0];
};

/* ══ Iconografía de categorías de incentivo ══════════════════════════════
   8 iconos representativos. Stroke-based (24x24, stroke-width 1.6, currentColor).
   Cada path es el contenido interno de un <svg>; quien lo consume decide
   tamaño, color de fondo y color de stroke. Accesible vía window.CAT_ICONS.
   Para asignar el icono de un programa: tomar la categoría del primer
   incentivo (programa puede tener varios; el primero define el icono). */
window.CAT_ICONS = {
  // Birrete con base — formación académica
  'Crédito condonable': '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v4c0 1.66 2.69 3 6 3s6-1.34 6-3v-4"/><line x1="22" y1="10" x2="22" y2="15"/>',
  'Beca':        '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v4c0 1.66 2.69 3 6 3s6-1.34 6-3v-4"/><line x1="22" y1="10" x2="22" y2="15"/>',
  // Bolsa deportiva con asa y franja central
  'Kit':         '<path d="M5 9h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z"/><path d="M9 9V7a3 3 0 016 0v2"/><line x1="4" y1="13" x2="20" y2="13"/>',
  // Cupón / voucher con perforaciones laterales tipo ticket
  'Bono':        '<path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a1.5 1.5 0 000 3v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a1.5 1.5 0 000-3V7z"/><line x1="13" y1="6" x2="13" y2="9" stroke-dasharray="1.5 1.5"/><line x1="13" y1="11" x2="13" y2="13" stroke-dasharray="1.5 1.5"/><line x1="13" y1="15" x2="13" y2="18" stroke-dasharray="1.5 1.5"/>',
  // Bus frontal con ventanas y ruedas
  'Transporte':  '<rect x="4" y="3" width="16" height="14" rx="2"/><line x1="4" y1="9" x2="20" y2="9"/><rect x="6" y="11" width="3.5" height="3" rx=".5"/><rect x="14.5" y="11" width="3.5" height="3" rx=".5"/><circle cx="8" cy="20" r="1.5"/><circle cx="16" cy="20" r="1.5"/>',
  // Portapapeles con check — formulario inscrito
  'Inscripción': '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/><polyline points="9 13 11 15 15 11"/>',
  // Etiqueta de precio con símbolo % adentro
  'Descuento':   '<path d="M20 12L12 20a2 2 0 01-2.83 0l-6.59-6.59A2 2 0 012 12V4a2 2 0 012-2h8a2 2 0 011.41.59L20 9.17a2 2 0 010 2.83z"/><circle cx="7" cy="7" r="1"/><line x1="9.5" y1="14.5" x2="14.5" y2="9.5"/><circle cx="10" cy="14" r=".4"/><circle cx="14" cy="10" r=".4"/>',
  // Carnet de acceso con foto + líneas (ID-card)
  'Pase':        '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c.5-1.5 1.5-2.5 3-2.5s2.5 1 3 2.5"/><line x1="14" y1="10" x2="19" y2="10"/><line x1="14" y1="13" x2="18" y2="13"/>',
  // Billete con moneda central y puntos en esquinas
  'Dinero':      '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><circle cx="6" cy="12" r=".7"/><circle cx="18" cy="12" r=".7"/>'
};

/* Helper: devuelve la categoría primaria (1er incentivo) con fallback. */
window.getProgramCategory = function(p){
  return (p && p.incentives && p.incentives[0] && p.incentives[0].category) || 'Beca';
};

/* Entregas por incentivo (demo): los programas de un solo incentivo
   heredan las asignaciones del programa. */
window.PROGRAMS_DATA.forEach(p => {
  (p.incentives || []).forEach((inc, i, arr) => {
    if(inc.delivered == null) inc.delivered = arr.length === 1 ? (p.codes?.asig || 0) : 0;
  });
});

/* ══ Programas creados o editados en la demo ═════════════════════════════
   SOLO DEMO: se guardan en localStorage de este navegador para que
   sobrevivan recargas y navegación. Al cargar, se suman a los de ejemplo
   (un programa editado reemplaza al original por su id).
   En el producto esto lo persiste el backend. */
(function(){
  const KEY = 'naowee:incentivos:programas';
  function read(){
    try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch(e){ return []; }
  }
  function write(list){
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch(e){ return false; }
  }
  function upsert(arr, p){
    const i = arr.findIndex(x => x.id === p.id);
    if(i >= 0) arr[i] = p; else arr.unshift(p);
  }
  // Guardados del más nuevo al más viejo: se insertan al revés para que el más nuevo quede arriba.
  read().slice().reverse().forEach(p => upsert(window.PROGRAMS_DATA, p));

  window.saveDemoProgram = function(p){
    const list = read();
    upsert(list, p);
    const ok = write(list);
    upsert(window.PROGRAMS_DATA, p);
    return ok;
  };
  window.demoProgramsCount = () => read().length;
  /* Borra lo creado en la demo: programas y entregas del operador. */
  window.resetDemoData = function(){
    try { localStorage.removeItem(KEY); localStorage.removeItem('inc-op-ledger'); } catch(e){}
  };
})();
