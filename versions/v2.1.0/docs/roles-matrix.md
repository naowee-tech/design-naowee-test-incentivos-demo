# Matriz de roles y permisos — Módulo Incentivos

**Fuente:** Entrevista con Danna Arrieta (2026-04-22).
**Scope:** Scope 1 — sin rol visualizador.

---

## Roles definidos (2)

### 1. Administrador (a.k.a. "gestor de incentivos")

| Atributo | Valor |
|---|---|
| Sinónimos en el dominio | "Gestor de incentivos", "Admin general" |
| Quién lo ocupa | Persona del **ministerio**, jerarquía alta |
| Cantidad | Una sola persona centralizada (no distribuido territorialmente) |
| Visibilidad territorial | **Nacional** — ve todos los programas, códigos y asignaciones del país |
| Dispositivo típico | Desktop / laptop (trabajo de oficina) |

### 2. Operador (a.k.a. "responsable en campo")

| Atributo | Valor |
|---|---|
| Sinónimos en el dominio | "Operador de campo", "Responsable en campo", "Personal de apoyo" |
| Quién lo ocupa | Persona designada para apoyar la entrega de incentivos durante eventos o en puntos de atención |
| Cantidad | Múltiples, distribuidos por evento / zona |
| Visibilidad territorial | Limitada al evento / programa donde está asignado |
| Dispositivo típico | Móvil / tablet (operación en campo) |

---

## Matriz de permisos

| Acción | Administrador | Operador |
|---|:---:|:---:|
| **Programas** | | |
| Ver lista de programas | ✅ (todos, nacional) | ⚠️ (sólo los que opera) |
| Crear programa | ✅ | ❌ |
| Editar programa (datos, condiciones) | ✅ | ❌ |
| Ampliar rubro | ✅ | ❌ |
| Activar / pausar / cerrar programa | ✅ | ❌ |
| Ver detalle de un programa | ✅ | ⚠️ (sólo en los que opera) |
| **Códigos / Inventario** | | |
| Cargar códigos (masiva) | ✅ | ❌ |
| Ver inventario de códigos | ✅ | ⚠️ (sólo del programa que opera) |
| Asignar código a usuario | ⚠️ (posible) | ✅ |
| Revertir asignación | ✅ | ❌ |
| **Búsqueda y asignación en campo** | | |
| Buscar usuario por cédula/nombre | ⚠️ | ✅ |
| Ver condiciones aplicables al usuario | ✅ | ✅ |
| Asignar incentivo | ⚠️ | ✅ |
| Subir foto / archivo de evidencia | ⚠️ | ✅ |
| **Reversión** | | |
| Revertir una asignación existente | ✅ | ❌ |
| Ingresar motivo de reversión | ✅ | ❌ |
| **Auditoría y trazabilidad** | | |
| Ver historial de asignaciones | ✅ (nacional) | ⚠️ (propias) |
| Ver quién asignó / revirtió | ✅ | ⚠️ (propias) |
| Exportar reportes (PDF/Excel/SVG) | ✅ | ❌ |
| **Dashboard / KPIs** (fuera de scope 1) | | |
| Ver dashboard con KPIs | ⚠️ (nice-to-have) | ❌ |

**Leyenda:**
- ✅ Permiso confirmado por Danna
- ⚠️ Permiso probable / por confirmar
- ❌ Sin permiso

---

## Escenarios confirmados

### Escenario 1 — Operador se equivoca en campo
> "En campo no le di un código de un incentivo que no era (…) el operador viene y contacta a un gestor de incentivos y le dice: mira, necesito revertir este porque le di el que no era. El único que puede hacer eso es el admin."

**Flujo:**
1. Operador detecta error tras asignar.
2. Operador contacta al admin (fuera del sistema — teléfono, Slack, etc.).
3. Admin abre el módulo → asignaciones → encuentra la asignación → click "Revertir".
4. Admin ingresa motivo obligatorio.
5. Código vuelve a `Sin asignación` en el inventario.

### Escenario 2 — Admin amplía rubro
> "100 códigos que dio el ministerio y después el ministerio a las dos semanas dice, no mira, voy a habilitar 50 códigos más porque hay más presupuesto."

**Flujo:**
1. Admin edita el programa.
2. Aumenta rubro (ej. $100M → $150M).
3. Carga masiva del Excel adicional (50 códigos × $1M).
4. Inventario se actualiza.

### Escenario 3 — Operador busca usuario no elegible
> "Si la persona que le buscan no es elegible… simplemente no le aparece en la búsqueda (…) no tiene ningún incentivo aplicable."

**Flujo:**
1. Operador busca por cédula.
2. Sistema filtra contra condiciones del programa activo.
3. Si no cumple → no aparece en resultados, muestra mensaje "no tiene incentivos aplicables".
4. (Fuera de scope) Verificación manual del usuario en módulo de inscripciones.

---

## Jerarquía territorial

> **Importante:** aunque Naowee maneja 3 niveles territoriales (Nacional / Regional / Municipal) en otros módulos, en **Incentivos el Admin es una única persona con visibilidad nacional**. No hay divisiones territoriales en este rol.

Los operadores sí están territorialmente asignados a eventos/programas específicos, pero esa asignación es a nivel de **programa**, no del rol en sí.

---

## Roles futuros (fuera de scope 1)

### Visualizador (propuesto por Doug, aceptado por Danna como nice-to-have)

- Rol sin permisos de escritura
- Ve dashboard con KPIs de transparencia
- Posibles usuarios: alta dirección del ministerio, entes de control, auditoría
- Vista nacional sin permisos de acción

---

## Usuarios externos (NO interactúan con el módulo)

- **Deportistas** (beneficiarios) — reciben incentivo, pero no acceden al módulo en scope 1.
- **Entrenadores** — no participan del flujo.
- **Personal de apoyo que recibe incentivos** (fisios, médicos) — reciben pero no acceden al módulo.

Estos usuarios podrían, en un scope futuro, ver sus incentivos en un **tab de incentivos** dentro de su perfil SUID — pero no se construye ahora.
