# Reglas de negocio — Módulo Incentivos

**Última actualización:** 2026-04-22 (post entrevista con Danna Arrieta)
**Fuentes:** BPMNs + entrevista stakeholder + Notas de Gemini.
**Alcance:** Scope 1 — parametrización por admin + asignación por operador en campo.

Leyenda:
- ✅ **Confirmada** por Danna
- ⚠️ **Inferida** razonablemente — validar
- ❓ **Abierta** — se necesita más info

---

## RN-01 · Programa

| ID | Regla | Estado |
|---|---|---|
| RN-01.1 | Un programa es lanzado por el ministerio, asociado a un evento (ej. Juegos) o programa general (ej. beneficios a menores). | ✅ |
| RN-01.2 | Un programa tiene **un solo rubro** (no múltiples). | ✅ |
| RN-01.3 | Un programa puede tener uno o varios **tipos de incentivo**. | ⚠️ |
| RN-01.4 | Un programa puede **editarse después de activarse** para ampliar rubro o agregar códigos. | ✅ |
| RN-01.5 | Al ampliar rubro, los nuevos códigos deben mantener el mismo valor unitario (ej. si cada código es $1M, los adicionales también deben ser $1M). | ✅ |
| RN-01.6 | El programa tiene estados (posibles: borrador / activo / pausado / cerrado). Lista exacta: ❓ | ⚠️ |
| RN-01.7 | Vigencia del programa (fecha desde / hasta). | ❓ |
| RN-01.8 | El programa se puede duplicar como alternativa a editar (discutido como plan B si no se puede editar). | ⚠️ |

---

## RN-02 · Rubro

| ID | Regla | Estado |
|---|---|---|
| RN-02.1 | El rubro es una **cantidad de dinero** asignada por el ministerio al programa. | ✅ |
| RN-02.2 | El sistema **descuenta automáticamente** del rubro por cada asignación. | ✅ |
| RN-02.3 | El rubro **no puede tener más de una fuente** por programa. | ✅ |
| RN-02.4 | El rubro puede aumentarse posteriormente (sólo por admin). | ✅ |
| RN-02.5 | El sistema debe mostrar en tiempo real: rubro total, ejecutado, disponible. | ⚠️ |

---

## RN-03 · Tipos de incentivo

| ID | Regla | Estado |
|---|---|---|
| RN-03.1 | Los tipos son libres (no hay lista cerrada) — se definen por programa. | ✅ |
| RN-03.2 | Un tipo puede ser **cualitativo** (sin valor monetario explícito, ej. "pase al parque"). | ✅ |
| RN-03.3 | Un tipo puede ser **monetario** (con valor asociado, ej. "beca $1.000.000"). | ✅ |
| RN-03.4 | Un tipo puede ser **ambos** (categoría cualitativa + valor monetario asociado). | ✅ |
| RN-03.5 | Todo incentivo tiene un costo para el ministerio, aunque sea mínimo. | ✅ |
| RN-03.6 | Un tipo de incentivo puede requerir o no requerir **código** (del BPMN). | ✅ |

---

## RN-04 · Condiciones de elegibilidad

| ID | Regla | Estado |
|---|---|---|
| RN-04.1 | Las condiciones son parametrizables al crear el programa. | ✅ |
| RN-04.2 | Dimensiones disponibles: edad, género, estrato, disciplina, categoría deportiva, zona (urbana/rural), logros, matrícula activa. | ✅ |
| RN-04.3 | Las condiciones se pueden combinar con operadores lógicos **AND / OR**. | ✅ |
| RN-04.4 | Sólo los usuarios que **cumplen todas las condiciones aplicables** aparecen en los resultados de búsqueda. | ✅ |
| RN-04.5 | Si un usuario no aparece en búsqueda → se muestra "no tiene ningún incentivo aplicable". | ✅ |
| RN-04.6 | La lista de dimensiones puede extenderse en el futuro según necesidades del ministerio. | ⚠️ |

---

## RN-05 · Códigos

| ID | Regla | Estado |
|---|---|---|
| RN-05.1 | Los códigos son generados **externamente por el ministerio** y cargados al sistema. | ✅ |
| RN-05.2 | El sistema soporta **dos modos de carga** de códigos al crear el programa: **(a) Carga masiva vía Excel** (recomendada) y **(b) Carga manual** (uno a uno — para casos puntuales). | ✅ (Doug 2026-04-22) |
| RN-05.3 | Un código es **único por asignación**: no se reusa entre programas ni entre usuarios. | ✅ |
| RN-05.4 | Un código una vez asignado se marca como usado y nadie más puede utilizarlo. | ✅ |
| RN-05.5 | El Excel puede incluir el valor monetario por código (fila: código + valor). | ✅ |
| RN-05.6 | El nombre del archivo Excel puede indicar el tipo (ej. "becas"), mientras el valor va por fila. | ✅ |
| RN-05.7 | Formato / estructura del código (numérico / alfanumérico / longitud / prefijo). | ❓ |
| RN-05.8 | **Vigencia del código: SIN vencimiento** (por ahora, decisión Doug 2026-04-22). Si se necesita en el futuro, se parametriza. | ✅ |
| RN-05.9 | Estados de un código: `Sin asignación` → `Asignado` → (`Revertido` → `Sin asignación`) o fin. | ✅ |
| RN-05.10 | **Asignación MANUAL** — el gestor de incentivos elige el código del inventario al momento de consultar. No es FIFO automático. (Doug 2026-04-22) | ✅ |
| RN-05.11 | Carga manual de códigos: campos mínimos `código de incentivo`, `categoría/tipo`, y opcionalmente `evento asociado`. | ✅ (Doug 2026-04-22) |
| RN-05.12 | Carga masiva: soporta Excel (`.xlsx`) y CSV. | ✅ (Doug 2026-04-22) |

---

## RN-06 · Asignación

| ID | Regla | Estado |
|---|---|---|
| RN-06.1 | La asignación la hace el operador en campo. | ✅ |
| RN-06.2 | La búsqueda de usuarios se hace por **cédula** (principal), tipo de documento, o nombre. | ✅ |
| RN-06.3 | El sistema valida automáticamente si el usuario buscado cumple las condiciones del programa activo. | ✅ |
| RN-06.4 | Al asignar, el operador **sube evidencia**: foto del deportista recibiendo el incentivo o archivo (ej. certificado de beca). | ✅ |
| RN-06.5 | La "validación de fotografía" del BPMN **NO es validación biométrica** — es evidencia de entrega. | ✅ |
| RN-06.6 | Una asignación descuenta 1 código del inventario y X del rubro según valor. | ⚠️ |
| RN-06.7 | Un usuario puede recibir un único incentivo por asignación (no múltiples en la misma operación). | ⚠️ |
| RN-06.8 | Cupo máximo por persona por programa. | ❓ |
| RN-06.9 | El sistema notifica al usuario cuando se le asigna incentivo — **sólo dentro del perfil del sistema**, NO email ni SMS. | ✅ |

---

## RN-07 · Reversión

| ID | Regla | Estado |
|---|---|---|
| RN-07.1 | Sólo el **administrador** puede revertir — el operador NO tiene ese permiso. | ✅ |
| RN-07.2 | La reversión requiere un **motivo**. | ✅ |
| RN-07.3 | Al revertir, el código regresa al estado `Sin asignación` y puede reasignarse. | ✅ |
| RN-07.4 | Ventana de tiempo para revertir (inmediato / mismo día / indefinido). | ❓ |
| RN-07.5 | Formato del motivo: lista cerrada o texto libre. | ❓ |

---

## RN-08 · Multi-incentivo

| ID | Regla | Estado |
|---|---|---|
| RN-08.1 | Un deportista puede **acumular varios incentivos vigentes** al mismo tiempo, de distintos programas. | ✅ |
| RN-08.2 | **No existen reglas de exclusión** entre incentivos ("si gana A no puede tener B" NO aplica). | ✅ |
| RN-08.3 | Límite de incentivos por persona por programa. | ❓ (probablemente 1 por programa) |
| RN-08.4 | Tope por zona / rubro. | ❓ |

---

## RN-09 · Roles y permisos

Ver detalle completo en [`roles-matrix.md`](roles-matrix.md).

| ID | Regla | Estado |
|---|---|---|
| RN-09.1 | Existen **2 roles**: Administrador (gestor de incentivos) y Operador (responsable en campo). | ✅ |
| RN-09.2 | El admin es **una persona del ministerio** con jerarquía nacional. | ✅ |
| RN-09.3 | Los deportistas y entrenadores **NO interactúan con el módulo**. | ✅ |
| RN-09.4 | Los beneficiarios son deportistas **y personal de apoyo** (fisios, médicos). | ✅ |
| RN-09.5 | Rol de "visualizador" con dashboard de KPIs — identificado como necesidad, pero fuera de scope 1. | ✅ |

---

## RN-10 · Trazabilidad y auditoría

| ID | Regla | Estado |
|---|---|---|
| RN-10.1 | Cada asignación registra: quién (operador), cuándo, dónde, dispositivo, foto del avatar. | ✅ |
| RN-10.2 | Cada reversión registra: admin que revirtió, motivo, fecha, referencia a la asignación original. | ⚠️ |
| RN-10.3 | El inventario se actualiza en tiempo real. | ✅ |
| RN-10.4 | Exportes disponibles: PDF, Excel, SVG. | ✅ |
| RN-10.5 | Alertas automáticas de anulación excesiva o inventario bajo. | ⚠️ (*nice-to-have*) |

---

## RN-11 · Fuera de scope (explícitamente)

| ID | Regla | Estado |
|---|---|---|
| RN-11.1 | El deportista **no** redime el incentivo desde su perfil en el sistema — la redención física sucede en campo. | ✅ |
| RN-11.2 | No se construye tab de incentivos en el perfil del deportista (futuro). | ✅ |
| RN-11.3 | No hay notificaciones por email ni SMS al deportista. | ✅ |
| RN-11.4 | No hay dashboard de KPIs en scope 1 (se incluye como *nice-to-have*). | ✅ |
| RN-11.5 | No hay rol de visualizador en scope 1. | ✅ |

---

## RN-12 · Estados del incentivo (a nivel beneficiario)

Distinto del ciclo del **código**. Un "incentivo asignado a un deportista" transita:

| Estado | Significado | Visible |
|---|---|---|
| `Otorgado` | El deportista cumple condiciones y tiene derecho al incentivo. | Implícito — NO se activa automáticamente en perfil del deportista. |
| `Asignado` | El gestor entregó el incentivo en campo y registró evidencia. | Queda en el historial del sistema. |
| `Revertido` | El admin anuló la asignación con motivo. | Queda en el historial con referencia a la asignación original. |

**Regla clave (Doug 2026-04-22):** el deportista **NO** ve el estado `Otorgado` en su perfil. Para aplicar debe **contactar manualmente** al gestor de incentivos y solicitar la validación.

---

## RN-13 · Historial y reporte (IN SCOPE 1)

Antes considerado nice-to-have, ahora **entra en scope 1** (Doug 2026-04-22).

| ID | Regla | Estado |
|---|---|---|
| RN-13.1 | El gestor de incentivos ve un **historial/registro completo** de incentivos entregados. | ✅ |
| RN-13.2 | Filtros disponibles: **región, municipio, ciudad**. | ✅ |
| RN-13.3 | Métricas agregadas: **# deportistas, total asignados, revertidos, nulos, data general**. | ✅ |
| RN-13.4 | Exportable: PDF, Excel. | ⚠️ (supuesto) |
| RN-13.5 | Incluye drill-down: de métrica agregada a lista de asignaciones individuales. | ⚠️ (supuesto de diseño) |
| RN-13.6 | Dashboard de KPIs "puros" (sin lista detallada) — sigue fuera de scope 1 (nice-to-have futuro). | ⚠️ |

---

## Resumen: qué hay que decidir antes de diseñar

| # | Tema | Estado |
|---|---|---|
| 1 | Vigencia del código | ✅ Sin vencimiento (Doug) |
| 2 | Carga manual y masiva de códigos | ✅ Ambas opciones (Doug) |
| 3 | Asignación automática vs manual | ✅ Manual (Doug) |
| 4 | Estructura del Excel/CSV de carga masiva | ⚠️ Danna consulta. Supuesto mínimo: `código, categoría, [evento]` |
| 5 | Vigencia del programa (fechas desde/hasta) | ⚠️ Supuesto razonable: sí existe |
| 6 | Lista exacta de estados del programa | ⚠️ Supuesto: Borrador/Activo/Pausado/Cerrado |
| 7 | Ventana de tiempo para revertir | ⚠️ Supuesto: sin ventana |
| 8 | Motivo de reversión: cerrado o libre | ⚠️ Supuesto: lista + "Otro" |
| 9 | Cupo por persona por programa | ⚠️ Supuesto: 1 por programa |

Con los puntos 1–3 resueltos, **ya no hay bloqueadores duros** — podemos construir todas las pantallas. Los puntos 4–9 son afinamientos.
