# Preguntas abiertas — v2 (post-entrevista)

**Actualizado:** 2026-04-22 tras entrevista con Danna Arrieta.
**Previo:** 54 preguntas del guion [entrevista-stakeholder.md](entrevista-stakeholder.md).

De las 54 preguntas originales, **quedaron 8 sin resolver**. Se reorganizan aquí por **bloqueador de diseño** (🔴 bloquea / 🟡 limita / 🟢 curiosidad).

---

## 🔴 Bloqueadores — cerrar antes de diseñar esas pantallas

### 1. Vigencia / expiración del código
- **Pregunta:** ¿El código de incentivo tiene una ventana de redención? Si el deportista no lo reclama en X días, ¿qué pasa?
- **Impacto de diseño:** Afecta pantallas **05 (Detalle del programa)**, **07 (Códigos)**, **12 (Asignaciones)**.
  - Si hay vigencia: necesitamos UI para fecha de expiración por código, alertas cerca del vencimiento, estado "Vencido" en la máquina de estados, política de reingreso automático al inventario.
  - Si no hay vigencia: el estado nunca cambia solo; el código se mantiene asignado hasta revertirse manualmente.
- **Responsable:** Danna Arrieta (consulta al ministerio).
- **Fecha:** pendiente.

### 2. Formato y columnas del Excel de carga masiva
- **Pregunta:** ¿Qué columnas trae el Excel (basado en Juegos Intercolegiados)? Ejemplos: ¿solo código?, ¿código + valor?, ¿código + vencimiento?, ¿código + prefijo de programa?
- **Impacto de diseño:** Afecta pantalla **06 (Códigos: carga masiva)**.
  - Define el preview de filas, las validaciones, el mapping de columnas.
- **Responsable:** Danna Arrieta.
- **Fecha:** pendiente.

### 3. Asignación del código: automática o manual
- **Pregunta:** Cuando el operador asigna un incentivo, ¿el sistema toma el siguiente código del inventario (FIFO) o el operador elige de una lista?
- **Impacto de diseño:** Afecta pantalla **10 (Asignar: tipo + código)**.
  - FIFO: pantalla simple con "Próximo código: X" y confirmación.
  - Manual: selector con inventario visible, posiblemente con filtros.
- **Responsable:** decisión conjunta Danna + Doug.
- **Fecha:** pendiente.

---

## 🟡 Limitadores — avanzamos con supuesto razonable, validar después

### 4. Estados exactos del programa
- **Supuesto actual:** `Borrador` → `Activo` → `Pausado` → `Cerrado`.
- **Riesgo:** puede faltar algún estado intermedio (ej. "En aprobación ministerial").
- **Responsable:** Danna Arrieta.

### 5. Vigencia del programa (fechas desde / hasta)
- **Supuesto actual:** el programa tiene fecha de inicio y fin (común en programas ministeriales).
- **Riesgo bajo:** incluir el campo no estorba si no se usa.
- **Responsable:** Danna Arrieta.

### 6. Ventana de tiempo para revertir una asignación
- **Supuesto actual:** sin ventana — el admin puede revertir en cualquier momento.
- **Riesgo:** que la política real exija "sólo mismo día" u otra restricción.
- **Responsable:** Danna Arrieta.

### 7. Motivo de reversión: lista cerrada o texto libre
- **Supuesto actual:** lista cerrada con 4-6 motivos + opción "Otro (texto libre)".
- **Impacto:** afecta pantalla **13 (Revertir)**.
- **Responsable:** Danna Arrieta.

### 8. Cupo por persona por programa
- **Supuesto actual:** 1 incentivo por programa por persona.
- **Matiz:** Danna dijo "como tal es una sola asignación" pero también "se van acumulando" (entre programas distintos).
- **Responsable:** Danna Arrieta.

---

## 🟢 Curiosidad — no bloquean nada

### 9. Documento de Cami sobre formulario de firma
- **Pregunta:** ¿El documento físico que se firma al entregar el incentivo debe digitalizarse/subirse como parte de la asignación?
- **Estado:** Danna va a compartir el documento.
- **Responsable:** Danna Arrieta.

### 10. Estructura del código (numérico/alfanumérico, longitud, prefijos)
- Sugerencia de Doug: `2026GUMIN` (año + evento + organismo).
- **Responsable:** vendrá definido implícitamente por el Excel histórico.

### 11. KPIs específicos del dashboard (si se hace en un futuro)
- **Responsable:** Doug Vargas.

---

## Qué podemos construir sin esperar

Aún con 3 bloqueadores, podemos avanzar en estas pantallas sin depender de esas decisiones:

| Pantalla | Bloqueada por | Avanzable |
|---|---|---|
| 01 · Login | — | ✅ |
| 02 · Dashboard | KPIs específicos (🟢 no crítico, hay supuestos razonables) | ✅ |
| 03 · Programas (lista) | Estados exactos (🟡 supuesto ok) | ✅ |
| 04 · Crear programa (wizard) | Vigencia del programa (🟡) | ✅ con placeholders |
| 05 · Detalle programa | Vigencia de códigos (🔴) | ⚠️ parcial |
| 06 · Códigos: carga masiva | Formato Excel (🔴) | ❌ — esperar |
| 07 · Códigos (lista) | Vigencia de códigos (🔴) | ⚠️ parcial |
| 08 · Buscar usuario | — | ✅ |
| 09 · Validar fotografía → **renombrar** a "Evidencia de entrega" | — | ✅ |
| 10 · Asignar tipo + código | Automática vs manual (🔴) | ⚠️ mostrar ambas variantes |
| 11 · Confirmación asignación | — | ✅ |
| 12 · Asignaciones (historial) | Vigencia de códigos (🔴), motivos reversión (🟡) | ⚠️ parcial |
| 13 · Revertir | Motivo (🟡) | ✅ con lista placeholder |

**Plan sugerido:** arrancar por **01 (Login)** → **08 (Buscar usuario)** → **09 (Evidencia)** → **11 (Confirmación)** porque son las pantallas que no tienen bloqueadores y cubren el flujo crítico del operador. Paralelamente **02 (Dashboard)**, **03 (Programas)**, y **04 (Wizard)** del admin.
