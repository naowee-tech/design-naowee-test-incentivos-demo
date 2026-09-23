# Entrevista Stakeholder — Módulo Incentivos

**Objetivo:** cerrar las 12 preguntas abiertas detectadas tras leer los BPMN para poder diseñar las pantallas sin inventar reglas.

**Duración estimada:** 40–50 min.
**Formato:** ir pregunta por pregunta, pedir **ejemplos reales** (no definiciones abstractas). Cuando diga "depende", pedir los casos concretos.

**Cómo usar este guion:**
- Llevar impreso o abierto en segunda pantalla.
- Marcar ✅ cuando quede claro, ⚠️ si queda ambiguo (se revisita al final).
- Grabar la sesión (audio basta) para transcribir después.

---

## Bloque 0 — Contexto y alcance (5 min)

1. En una frase, ¿**qué problema resuelve** este módulo hoy que antes no se resolvía?
2. ¿Quién es el **usuario final** de los incentivos? (deportista, entrenador, familia, comunidad beneficiaria…)
3. ¿Cuántos **programas** corren al año, en promedio? ¿Son paralelos o secuenciales?
4. ¿Hay un **programa piloto/ejemplo** que podamos usar como caso guía durante todo el diseño? (pedir nombre real)

---

## Bloque 1 — Parametrización del programa (10 min)

### 1.1 Datos del programa
5. ¿Qué **campos** tiene un programa? (nombre, vigencia, cupo total, presupuesto, responsable, zona, disciplinas, etc.)
6. ¿Hay **vigencia** (fecha desde–hasta)? ¿Qué pasa cuando expira un programa con códigos sin asignar?
7. ¿Un programa puede estar en **borrador**, **activo**, **pausado**, **cerrado**? Listar los estados reales.

### 1.2 Rubro
8. ¿Qué **es un "rubro"** exactamente? ¿Es categoría presupuestal, tipo de beneficio, fuente de financiación, línea estratégica?
9. ¿El rubro es **lista cerrada** (catálogo) o **libre**?
10. ¿Un programa tiene **un rubro** o puede tener varios?

### 1.3 Tipo de incentivo
11. ¿Cuáles son los **tipos de incentivo reales** que manejan hoy? (ejemplos: bono transporte, kit, inscripción, descuento, dinero, especie…)
12. ¿Qué **tipos requieren código** y cuáles **no**?
13. ¿Un tipo de incentivo puede tener **valor monetario asociado**? ¿O es solo cualitativo?

### 1.4 Condiciones del incentivo
14. ¿Qué **dimensiones** se parametrizan como condición? (edad, género, estrato, disciplina, categoría deportiva, zona, logros, matrícula activa, etc.)
15. ¿Las condiciones son **AND** (todas) u **OR** (alguna)? ¿Se combinan por grupos?
16. Ejemplo concreto: "El incentivo X va para usuarios Y". Dame **2 o 3 reglas reales** de programas pasados.

### 1.5 Códigos
17. ¿Los **códigos los genera el sistema** o se **suben**? Si ambos, ¿cuándo se usa cada uno?
18. Formato del código: ¿alfanumérico, numérico, longitud fija? ¿tiene estructura (prefijo por programa, año, etc.)?
19. Carga masiva: ¿archivo **CSV/Excel**? ¿qué **columnas** trae? ¿cómo resolvemos **duplicados** o **inválidos**?
20. ¿Un código tiene **valor monetario**, **vigencia propia**, **QR**, **expiración independiente** del programa?
21. ¿Un mismo código puede aplicarse a **más de un programa**, o son únicos por programa?

---

## Bloque 2 — Gestión y asignación (10 min)

### 2.1 Búsqueda del usuario
22. ¿Cómo se **busca** al usuario? (documento, nombre, QR, NFC, teléfono)
23. ¿El buscador es **global SUID** o solo **dentro de beneficiarios del programa**?
24. ¿Qué se muestra del usuario? (foto, nombre, documento, estado, programas previos, bloqueos)

### 2.2 Validación "usuario permitido"
25. ¿Cómo el sistema sabe si un usuario es **permitido** para un programa específico?
26. ¿Se evalúan las **condiciones parametrizadas** al vuelo, o hay una **lista precargada** de elegibles?
27. ¿Qué pasa cuando **no es elegible**? ¿Se puede **forzar** la asignación con justificación? ¿Quién aprueba?

### 2.3 Validación de fotografía
28. ¿Es **comparación biométrica automática** o **verificación visual** lado-a-lado?
29. ¿Se **toma foto en vivo** con la cámara del dispositivo o se **sube archivo**?
30. ¿Qué pasa si **no coincide**? ¿Bloqueo duro o se deja continuar con observación?
31. ¿Se guarda la foto de la entrega como **evidencia**?

### 2.4 Asignación del código
32. ¿El sistema **elige el código** del inventario o el gestor lo **selecciona**?
33. ¿Qué se muestra después de asignar? (comprobante, QR, mensaje, impresión)
34. ¿Se **notifica al usuario** (SMS, email, push, nada)?

---

## Bloque 3 — Reversión y post-asignación (5 min)

35. ¿Quién puede **revertir**? ¿El mismo gestor, solo supervisor, admin?
36. ¿Requiere **motivo obligatorio**? ¿Lista cerrada o texto libre?
37. ¿Hay **ventana de tiempo** (ej. solo mismo día) o se puede revertir indefinidamente?
38. ¿Necesita **aprobación** de otro rol, o es directa?
39. Cuando se revierte: ¿el código regresa al **mismo inventario** disponible? ¿Puede reasignarse al mismo usuario u otro?

---

## Bloque 4 — Roles y permisos (5 min)

40. Listar **todos los roles** que tocan el módulo. Para cada uno:
    - ¿Qué puede **ver**?
    - ¿Qué puede **crear/editar**?
    - ¿Qué puede **asignar/revertir**?
41. ¿Hay **jerarquía territorial** (nacional → regional → municipal)?
42. ¿Los gestores ven solo **su zona** o todo?

---

## Bloque 5 — Multi-programa y reglas cruzadas (5 min)

43. ¿Un usuario puede tener **varios incentivos vigentes** al mismo tiempo?
44. ¿Hay **cupo por persona por programa**? (ej. máximo 1 kit por usuario)
45. ¿Hay **incentivos excluyentes** entre sí? (si recibe A no puede recibir B)
46. ¿Hay **tope por zona/rubro**?

---

## Bloque 6 — Inventario, reportes y trazabilidad (5 min)

47. ¿Qué **KPIs** quieren ver en el dashboard? (inventario disponible, asignados, revertidos, % ejecución, alertas)
48. ¿Se necesita **reporte exportable** (Excel/PDF)? ¿Con qué periodicidad?
49. ¿Hay **alertas automáticas** (ej. inventario bajo, programa por vencer)?
50. ¿Qué **auditoría** se necesita por asignación? (quién, cuándo, dónde, dispositivo, foto)

---

## Bloque 7 — Cierre y supuestos (5 min)

51. ¿Hay **flujos alternos** que no estén en el BPMN? (excepciones, casos especiales)
52. ¿Hay **integraciones externas**? (SUID ya sabemos, pero ¿tesorería, proveedores, SMS gateway, impresora de tarjetas?)
53. ¿Cuál es la **pantalla más crítica** del módulo desde tu perspectiva? (para priorizar calidad de diseño ahí)
54. ¿Hay **decisiones aún no tomadas** que dependen de alguien más? ¿Quién y cuándo se cierran?

---

## Cierre

> "¿Hay algo importante que no te pregunté y que yo debería saber antes de diseñar?"

(esta última pregunta suele revelar el 20% del contexto que nunca aparece en docs)

---

## Post-entrevista — Checklist para mí

- [ ] Transcribir audio → `docs/transcripcion-entrevista.md`
- [ ] Llenar el CSV `PARAMETROS.csv` con lo que se aclaró
- [ ] Crear `docs/reglas-de-negocio.md` con las reglas confirmadas
- [ ] Crear `docs/roles-matrix.md` con la matriz de permisos
- [ ] Marcar qué quedó sin resolver → `docs/preguntas-abiertas-v2.md`
- [ ] Recién ahí: proponer wireframes de pantallas
