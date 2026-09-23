abr 22, 2026

## Incentivos

Invitado [darrieta@naowee.com](mailto:darrieta@naowee.com) [Doug Vargas](mailto:doug@naoweetech.com)

Archivos adjuntos [Incentivos](https://calendar.google.com/calendar/event?eid=Z2hrZDlzOG9sbnQxdnVhODdqN2dia20ycDQgZG91Z0BuYW93ZWV0ZWNoLmNvbQ)

Registros de la reunión [Grabación](https://drive.google.com/file/d/1O4Yy96YDCwaH27dX9p__dsybR729pxjA/view?usp=drive_web) 

### Resumen

Revisión de roles de administrador y operador y el flujo de incentivos con enfoque en elegibilidad y gestión presupuestaria.

**Roles y Flujos de Incentivos**  
Se clarificaron los roles de administrador y operador, siendo el operador el encargado de registrar la entrega del incentivo en campo mediante la carga de archivos. El proceso de reclamación requiere que el operador valide en la plataforma las condiciones preconfiguradas del deportista, como edad o categoría, para garantizar la elegibilidad.

**Gestión del Módulo Presupuestal**  
Se definió que el módulo debe contabilizar y descontar el rubro presupuestal asignado por el ministerio a cada programa de incentivos. Se requiere implementar la carga masiva de códigos de incentivos ya que subirlos individualmente no es eficiente.

**Alcance y Analítica del Módulo**  
El alcance actual (Scope 1\) se enfoca en la asignación del incentivo por el operador en campo, sin incluir el flujo de redención del deportista. Se identificó la necesidad de un rol de visualizador con un dashboard de KPI para monitorear el inventario disponible y el porcentaje de ejecución.

### Próximos pasos

- [ ] \[Danna Arrieta\] Consultar Códigos: Preguntar cómo se cargaron códigos anteriores. Investigar formato, columnas, si fue carga masiva y política de vencimiento o vigencia de códigos.

- [ ] \[Danna Arrieta\] Enviar Documento: Compartir documento de Cami sobre el formulario de firma para la entrega de incentivos.

- [ ] \[Doug Vargas\] Determinar KPIs: Investigar datos clave e indicadores de rendimiento para la sección de analítica del módulo. Definir qué KPIs se pueden colocar.

- [ ] \[Doug Vargas\] Estructurar Proyecto: Estructurar la información del proyecto para la revisión de mañana a las 4\.

### Detalles

* **Revisión y Clarificación de Roles y Flujos de Incentivos**: Doug Vargas abrió la reunión para revisar el visual del incentivo y aclarar preguntas pendientes sobre el flujo y los roles. Se clarificó que los roles principales son el administrador y el operador, aunque inicialmente Doug Vargas había identificado un rol de "responsable en campo" que Danna Arrieta confirmó que es el mismo operador. El operador es la persona designada para apoyar el tema de incentivos y es quien realiza la acción de entrega en campo, registrando el incentivo en la plataforma.

* **Función del Responsable/Operador de Campo**: La función principal del operador en campo es registrar el incentivo. Esto incluye tomar una foto o cargar un archivo (como un certificado de beca) del incentivo entregado y subirla a la plataforma. Este proceso asegura la trazabilidad y la acción de asignar el incentivo al deportista.

* **Definición del Módulo de Incentivos**: El módulo de incentivos está diseñado para abarcar no solo eventos específicos como juegos, sino también programas generales lanzados por el ministerio, como beneficios para menores de edad. La configuración de este módulo implica la creación del programa y la definición de los datos pertinentes.

* **Proceso de Reclamación y Validación de Incentivos**: El proceso establece que los deportistas se acercan a la oficina o punto de incentivos para reclamar su bonificación. El personal de apoyo (operador) valida en la plataforma la condición del deportista, comprobando si cumple las reglas configuradas, como la edad o la categoría deportiva.

* **Reglas y Condiciones para la Elegibilidad**: Para aplicar a un incentivo, un usuario debe cumplir con reglas preconfiguradas, como ser mayor de 18 años o pertenecer a una categoría específica (ej. prejuvenil o ganador de medalla de oro o plata). Estas reglas filtran a los usuarios que aparecerán en la lista de búsqueda para la asignación de incentivos.

* **Tipos de Incentivos y su Valoración**: Los tipos de incentivos pueden ser variados (bonos, becas) y cada uno tiene un costo, aunque sea mínimo, para el ministerio. Se discutió que un incentivo puede ser tanto cualitativo (ej. ingreso a un parque) como tener un valor monetario asociado.

* **Gestión del Rubro Presupuestal**: El rubro se define como una cantidad de dinero asignada por el ministerio para el programa de incentivos. El sistema debe realizar un seguimiento de la contabilización y el descuento del rubro por cada asignación realizada.

* **Usuarios Finales del Incentivo**: Los incentivos se otorgan a usuarios que cumplen con las características definidas, incluyendo deportistas y personal de apoyo (como fisioterapeutas o médicos). Se confirmó que ni los deportistas ni los entrenadores interactúan directamente con el módulo.

* **Restricciones del Rubro y Edición del Programa**: Se aclaró que cada programa de incentivos debe tener un solo rubro, asignado exclusivamente por el ministerio. En caso de necesitar más códigos o aumentar el rubro, se modificaría el rubro existente y se ingresarían nuevos códigos, asumiendo que los nuevos incentivos mantienen el mismo parámetro monetario.

* **Manejo de Códigos de Incentivo**: En el pasado, para los Juegos Intercolegiados, se utilizaron códigos que eran únicos para cada asignación. Se plantea la necesidad de implementar una carga masiva de códigos, ya que subirlos uno por uno no es eficiente, y se debe investigar el formato de estos códigos (si vienen con valor monetario asociado en el Excel).

* **Vigencia y Trazabilidad de Códigos**: La vigencia o expiración de un código de incentivo no ha sido planteada aún. Una vez que se asigna un código, el sistema lo marca como usado, impidiendo que sea reutilizado.

* **Mecanismo de Búsqueda de Usuarios**: La búsqueda de usuarios en campo se realiza a nivel de eventos y está restringida solo a aquellos que cumplen las condiciones del incentivo. La mejor experiencia de usuario sería buscar únicamente con la cédula, y que el sistema valide automáticamente si el perfil aplica para el incentivo.

* **Roles y Permisos de Acceso al Módulo**: El único que tiene permiso para revertir o anular una asignación es el administrador (gestor de incentivos), y esta acción requiere un motivo. El operador de campo solo puede consultar y asignar incentivos.

* **Jerarquía Territorial y Visibilidad del Administrador**: El gestor de incentivos (administrador) es una figura del ministerio y tiene una jerarquía alta, por lo que su visibilidad es nacional, viendo todos los incentivos y eventos del país.

* **Asignación Múltiple de Incentivos**: Un deportista puede acumular varios incentivos vigentes al mismo tiempo si cumple las condiciones de varios programas.

* **Alcance Actual del Módulo de Incentivos**: El alcance actual (Scope 1\) se centra en la asignación del incentivo por parte del operador en campo, sin incluir el seguimiento o un flujo para que el deportista redima o aplique en su perfil. El sistema notifica al usuario cuando el incentivo ha sido asignado a su perfil, pero no hay notificaciones por correo o mensaje de texto.

* **Necesidad de Analítica y Reportería**: Se identificó que un rol de visualizador con un \*dashboard\* que muestre Indicadores Clave de Rendimiento (KPI) sería muy beneficioso para la transparencia del módulo. Ejemplos de KPI incluyen el inventario disponible, el porcentaje de ejecución y el número de reversiones o anulaciones, aunque estos no están en el alcance inicial.

* **Tareas Pendientes para Danna Arrieta**: Danna Arrieta se compromete a preguntar sobre el formato y la carga masiva de los códigos (lista de Excel y columnas) utilizados en años anteriores. También se llevará la pregunta sobre la vigencia o expiración de los códigos de incentivo.

*Revisa las notas de Gemini para asegurarte de que sean precisas. [Obtén sugerencias y descubre cómo Gemini toma notas](https://support.google.com/meet/answer/14754931)*

*Cómo es la calidad de **estas notas específicas?** [Responde una breve encuesta](https://google.qualtrics.com/jfe/form/SV_9vK3UZEaIQKKE7A?confid=u7TID3uSp0XoqXo8monrDxIVOAIIigIgABgBCA&detailid=standard&screenshot=false) para darnos tu opinión; por ejemplo, cuán útiles te resultaron las notas.*