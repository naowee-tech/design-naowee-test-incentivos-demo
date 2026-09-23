# Docs — Fuente de verdad de Incentivos

Esta carpeta contiene toda la documentación funcional, técnica y de UX que define **qué** debemos construir. Claude lee estos archivos antes de escribir código.

## Qué subir aquí

Cualquiera de estos formatos funciona. Pon los archivos directamente en `docs/` (o en subcarpetas si son muchos).

### Casos de uso / historias de usuario
- CSVs exportados de Excel / Airtable con columnas tipo "ID", "Actor", "Acción", "Resultado"
- PDFs de alcance / SOW
- Markdown con bullets

### Estructura de datos
- CSV con las columnas del formulario / entidad
- Excel con tabs por tabla / módulo
- JSON schema si lo tienes

### BPMN / flujos
- PDF exportado del diagrama
- PNG / JPG del flowchart
- Miro / Figma board links (pégalos en `BPMN.md`)

### Wireframes / mockups
- Figma URL (pégala en `FIGMA.md`)
- Screenshots PNG
- PDFs exportados

### Entrevistas / requirements raw
- Transcripciones (.txt / .md)
- Notas de Notion exportadas
- Audio NO (usar transcripción)

## Sugerencia de estructura

Si tienes varios artefactos, organízalos así:

```
docs/
├── alcance.pdf                    ← el SOW
├── casos-de-uso.csv               ← user stories
├── estructura-datos.csv           ← campos del formulario
├── BPMN.md                        ← link al BPMN o PDF export
├── FIGMA.md                       ← links a los mockups
├── reglas-de-negocio.md           ← validaciones, cálculos
└── preguntas-abiertas.md          ← lo que aún no está claro
```

Pero también está bien dejarlos planos si son pocos.

## No subir

- Credenciales / tokens / API keys
- Datos personales reales de usuarios
- Archivos > 10 MB (si un PDF pesa más, exporta las páginas relevantes)

## Claude leerá estos archivos en la próxima sesión

No tienes que hacer nada más. Cuando inicies la próxima sesión y me pidas empezar, leeré automáticamente lo que esté en `docs/` antes de proponer cualquier pantalla.
