# Transcripción curada — Entrevista stakeholder

**Fecha:** 2026-04-22 14:00 GMT-05:00
**Duración:** 49:43 min
**Participantes:**
- **Doug Vargas** (diseñador UX/UI, pregunta)
- **Danna Arrieta** (stakeholder, responde)

**Fuentes:**
- `Incentivos - 2026_04_22 14_00 GMT-05_00 - Recording-es-asr.vtt` — transcripción literal (WebVTT)
- `Incentivos_ 2026_04_22 13_59 GMT-05_00 - Notas de Gemini.md` — notas sintéticas generadas por Gemini

> Este documento es la **síntesis narrativa** organizada por tema (no por timestamp). Para citas literales y contexto conversacional, ir al `.vtt`.

---

## 1. Roles del módulo

El sistema tiene **2 roles únicos**:

- **Administrador** (también llamado "gestor de incentivos" — son el mismo).
- **Operador** (también llamado "responsable en campo" — son el mismo). Doug identificó al inicio un supuesto tercer rol de "responsable en campo", pero Danna confirmó que es el operador.

**Usuarios finales que reciben incentivos**: deportistas y personal de apoyo (fisioterapeutas, médicos). **NO** entrenadores. Ni deportistas ni entrenadores interactúan con el módulo.

---

## 2. Alcance (Scope 1 actual)

El alcance se limita a:
- **Parametrización** del programa por el administrador
- **Asignación** del incentivo por el operador en campo

**NO incluye** (queda para futuro):
- Flujo de redención por el deportista
- Tab de incentivos en el perfil del deportista (ver cuáles tiene activos / por asignar)
- Notificaciones por email o SMS (sólo aparece en el perfil del usuario del sistema)
- Rol de visualizador con dashboard de KPIs (se identifica como *nice-to-have*)

---

## 3. Programa

Un **programa** lo lanza el ministerio. Puede estar asociado a:
- Un evento específico (ej. Juegos Intercolegiados)
- Un programa general del ministerio (ej. beneficios para menores de edad)

**Parametrización de un programa incluye:**
1. Datos del programa (nombre, evento/programa general asociado, vigencia — pendiente)
2. **Rubro** (un solo rubro por programa — no múltiples)
3. **Tipo de incentivo** (uno o varios por programa, cada uno con su valor)
4. **Condiciones de elegibilidad**
5. **Códigos** (si aplica) — carga masiva vía Excel

**Se puede editar un programa después de activarlo** para agregar más códigos o ampliar rubro (pero debe mantener el parámetro monetario — ej. si el rubro es 100M y cada código vale 1M, al ampliar a 150M deben ser 50 códigos adicionales de 1M).

---

## 4. Rubro

- **Definición:** cantidad de dinero asignada por el ministerio al programa.
- **Regla:** un programa tiene **UN solo rubro** (no varios).
- **Contabilización:** el sistema descuenta automáticamente del rubro por cada asignación.
- **Ampliable:** el ministerio puede aumentar el rubro posteriormente (ej. 100M → 150M), pero requiere agregar códigos consistentes con el valor unitario.

---

## 5. Tipos de incentivo

Categorías mencionadas como ejemplos reales:
- Bonos
- Becas
- Kits
- Transporte
- Inscripción
- Descuento
- Dinero
- Ingreso a parques (ej. Salitre Mágico, Agre)
- Pases

**No existe lista cerrada**: se definen por programa.

**Dos dimensiones:**
- **Cualitativo**: no tiene valor monetario explícito (ej. "pase al parque")
- **Monetario**: tiene valor asociado (ej. "beca de 1 millón")
- **Ambos**: un mismo incentivo puede ser cualitativo y tener valor monetario asociado (ej. "beca" = categoría cualitativa, pero el valor son $1.000.000)

**Regla implícita:** todo incentivo tiene un costo para el ministerio, aunque sea mínimo.

---

## 6. Condiciones de elegibilidad

Dimensiones parametrizables (mencionadas por Danna):
- Edad (ej. mayor de 18)
- Género
- Estrato
- Disciplina
- Categoría deportiva (ej. prejuvenil)
- Zona (urbana / rural)
- Logros (ej. ganador medalla oro o plata)
- Matrícula activa
- (Otras que surjan del contexto del programa)

**Combinación:** las condiciones **se pueden combinar con AND y OR** ("combinadas"). Ej. `(edad > 18 AND categoría = prejuvenil) OR (medalla = oro)`.

**Efecto en búsqueda:** el sistema filtra automáticamente. Un usuario que **no cumple** las condiciones **no aparece** en la lista de resultados — se muestra como "no tiene ningún incentivo aplicable".

---

## 7. Códigos

### Generación
- Los **genera externamente el ministerio**, el sistema los recibe.
- **Carga masiva vía Excel** es obligatoria (cargar uno por uno es ineficiente).
- Formato de Excel pendiente de confirmar — Danna consultará con base en Juegos Intercolegiados.
- Posible estructura sugerida por Doug: prefijo año + programa + organismo (ej. `2026GUMIN`, `2027GUCOL`).

### Reglas
- **Únicos por asignación**: un código no se reusa entre programas ni entre usuarios.
- Una vez asignado, el sistema **lo marca como usado** y nadie más puede utilizarlo.
- Pueden traer **valor monetario inline** en el Excel (cada fila: código + valor).
- El nombre del archivo Excel puede indicar el tipo (ej. "becas") mientras el valor monetario está por código.

### Vigencia ⚠️
- **No definida todavía**. Danna se llevará la pregunta al ministerio.
- Pregunta abierta: si un deportista no reclama el incentivo en X tiempo, ¿se vence? ¿se pierde el dinero? ¿se reingresa al inventario?

### Estados
Según el BPMN `FLUJO DE ESTADOS INCENTIVOS`:
- `Sin asignación` → `Asignado` → (`Revertido` → `Sin asignación`) o fin.

---

## 8. Flujo de asignación en campo (operador)

1. El deportista llega al punto de incentivos (post-evento o durante programa activo).
2. El operador le pide la **cédula**.
3. Busca en el sistema por **cédula** (principal) — también soporta tipo de documento + nombre.
4. El sistema filtra automáticamente: sólo muestra al deportista si **cumple las condiciones del programa**.
5. Si aparece: se ve el perfil del usuario, el tipo de incentivo aplicable, y el operador **asigna un código** del inventario.
6. El operador **sube evidencia** — foto del deportista recibiendo el incentivo O un archivo (ej. certificado de beca).
7. El sistema marca el código como `Asignado` y descuenta del rubro.

### "Validación de fotografía" (paso del BPMN)
**Aclaración crítica:** NO es validación biométrica. Es la **evidencia de entrega**: el operador toma/sube una foto o archivo demostrando que entregó el incentivo. Garantiza trazabilidad.

### Asignación del código (pendiente decisión)
Dos opciones discutidas, **no se cerró**:
- **Automática**: el sistema toma el siguiente código disponible (01, 02, 03…)
- **Manual**: el operador elige de la lista del inventario

---

## 9. Reversión

- **Sólo el Administrador** puede revertir (el operador no tiene ese permiso).
- Escenario típico: el operador asigna el código equivocado en campo y contacta al admin para que lo revierta.
- **Requiere motivo** (no se especificó si es lista cerrada o texto libre).
- Tras revertir, el código vuelve al estado `Sin asignación` y puede reasignarse.

---

## 10. Jerarquía territorial del administrador

- El admin es **una persona del ministerio** con jerarquía alta.
- **Visibilidad nacional**: ve todos los incentivos y eventos del país.
- NO hay división por zona (nacional / regional / municipal) para este rol — es una única persona centralizada.

---

## 11. Multi-incentivo por deportista

- **SÍ se acumulan**: un deportista puede tener varios incentivos vigentes al mismo tiempo (de distintos programas o distintas ventanas de tiempo).
- **NO hay reglas de exclusión**: Danna confirmó que no existe el caso "si gana A no puede tener B".
- Matiz: "como tal es una sola asignación" por programa por persona — implícitamente parece 1 incentivo por programa por usuario (no verificado al 100%).

---

## 12. Notificaciones

- **Sólo en el perfil del usuario** dentro del sistema (aparece como incentivo asignado).
- **No hay** email ni SMS.

---

## 13. Reportería y KPIs (fuera de scope 1, *nice-to-have*)

**Motivación:** transparencia del módulo.

**KPIs sugeridos:**
- Inventario disponible
- Asignados / asignados hoy
- Revertidos / % reversión
- % ejecución del rubro
- Alertas de anulación excesiva

**Rol propuesto:** "visualizador" (tercer rol potencial, no incluido en scope 1).

**Exportables requeridos:** PDF, Excel, SVG.

**Auditoría (por cada asignación):**
- Quién asignó (operador)
- Cuándo
- Dónde
- Dispositivo
- Foto del avatar (ya existe)

---

## 14. Caso histórico de referencia

**Juegos Intercolegiados** usaron códigos únicos cargados desde Excel. Durante ese proceso surgieron problemas:
- Algunos deportistas no aparecían en búsqueda (obstáculos de desarrollo).
- Había que hacer **consultas directas en la base de datos** para verificar inscripciones — no había flujo en la interfaz.
- Esta lección motiva el diseño actual: que el operador pueda verificar trazabilidad del usuario desde la plataforma, no en DB.

---

## 15. Decisiones pendientes (responsables)

| Decisión | Responsable | Fecha |
|---|---|---|
| Formato y estructura del Excel de carga masiva (basado en Juegos Intercolegiados) | Danna Arrieta | — |
| Vigencia / expiración de códigos de incentivo | Danna Arrieta (consulta ministerio) | — |
| Enviar documento de Cami sobre formulario de firma de entrega | Danna Arrieta | — |
| Definir KPIs específicos a mostrar en analítica | Doug Vargas | — |
| Estructurar proyecto para review | Doug Vargas | 2026-04-23 16:00 |
| Asignación de código: automática (siguiente en cola) vs manual (operador elige) | — | — |
| Cupo por persona por programa (¿1 incentivo por programa o más?) | — | — |
| Vigencia del programa (fechas desde / hasta) | — | — |

---

## 16. Citas literales destacadas

> **Danna (sobre roles):** "solamente operador y administrador. (...) el responsable en campo vendría siendo el operador."

> **Danna (sobre fotografía):** "Al final es fotografía o un archivo porque la beca (...) no necesariamente tiene que ser que se le está entregando el incentivo."

> **Danna (sobre rubro único):** "eso tiene que ser un solo rubro."

> **Danna (sobre incentivos cualitativos vs monetarios):** "puede ser cualitativo o puede tener un valor asociado o incluso podría ser nada más cualitativo y no decirle que es plata."

> **Danna (sobre condiciones combinadas):** "las condiciones ahí ya podrían ser combinadas (...) como programación está AND, que es I, O, entonces puede que se combinen ciertas condiciones."

> **Danna (sobre búsqueda):** "la búsqueda de usuarios en campo (...) está restringida solo a aquellos que cumplen las condiciones."

> **Danna (sobre reversión):** "el único que puede revertir es el administrador."

> **Danna (sobre jerarquía):** "la persona que que encargan de eso es una persona de ministerio (...) es una jerarquía super alta."

> **Danna (sobre multi-incentivo):** "se le van acumulando."

> **Danna (sobre KPIs):** "uno de los pilares para este módulo es la transparencia."

> **Danna (sobre vigencia de códigos):** "No lo planteé, la verdad. No lo tuve en cuenta."
