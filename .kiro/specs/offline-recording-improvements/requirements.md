# Requirements Document

## Introduction

Este documento define los requisitos para mejorar la funcionalidad de grabación de historias clínicas en ClinicalOps. El sistema actual presenta problemas críticos:

1. **Los botones de pausar/reanudar no aparecen en la interfaz** - Aunque el código existe, los botones no se renderizan correctamente
2. **El audio final está corrupto o vacío** - Las grabaciones no contienen audio audible, causando errores en la transcripción (`'NoneType' object is not iterable`)
3. **Falta feedback visual durante pausas** - No hay indicación clara de que la grabación está pausada
4. **No se muestran segmentos de grabación** - El usuario no puede ver las pausas realizadas durante la sesión
5. **No soporta operación offline** - Sin almacenamiento local ni sincronización

Esta mejora permitirá a los médicos grabar consultas de manera confiable con pausas múltiples, visualización de segmentos, y soporte offline completo.

## Glossary

- **Recording System**: El componente de la aplicación que captura audio del micrófono del usuario
- **IndexedDB**: Base de datos del navegador para almacenamiento persistente de datos estructurados y blobs
- **MediaRecorder API**: API nativa del navegador para captura de audio/video
- **react-media-recorder**: Librería React que envuelve MediaRecorder API con hooks simples
- **Offline Queue**: Cola de grabaciones pendientes de subir cuando no hay conexión
- **Sync Manager**: Componente que gestiona la sincronización de grabaciones cuando se restaura la conexión
- **Recording Session**: Una sesión de grabación individual que puede incluir múltiples pausas y reanudaciones
- **Recording Segment**: Un fragmento continuo de audio entre dos pausas
- **Cache Storage**: Almacenamiento local del navegador para datos persistentes

## Requirements

### Requirement 1

**User Story:** Como médico, quiero poder pausar y reanudar una grabación durante una consulta, para poder manejar interrupciones sin perder el contexto de la sesión.

#### Acceptance Criteria

1. WHEN THE Recording System está en estado "recording", THE Recording System SHALL mostrar un botón "Pausar" visible y funcional en la interfaz
2. WHEN el usuario presiona "Pausar", THE Recording System SHALL detener la grabación actual, guardar el segmento de audio, cambiar el color del micrófono a amarillo, y mostrar el botón "Reanudar"
3. WHEN THE Recording System está en estado "paused", THE Recording System SHALL mostrar un botón "Reanudar" visible y funcional, texto "PAUSADO" debajo del temporizador, y mantener el temporizador visible sin incrementar
4. WHEN el usuario presiona "Reanudar", THE Recording System SHALL iniciar una nueva grabación que se agregará como segmento adicional, cambiar el color del micrófono de vuelta a verde, y continuar incrementando el temporizador
5. WHEN THE Recording System finaliza una Recording Session con múltiples pausas, THE Recording System SHALL combinar todos los segmentos en un único archivo de audio continuo y reproducible
6. WHEN THE Recording System genera el archivo final, THE Recording System SHALL validar que cada segmento y el blob final contienen datos de audio válidos (tamaño > 0 bytes) antes de guardarlo

### Requirement 2

**User Story:** Como médico, quiero ver los segmentos de mi grabación en tiempo real, para saber cuántas pausas he realizado y la duración de cada segmento.

#### Acceptance Criteria

1. WHEN THE Recording System está grabando, THE Recording System SHALL mostrar una lista visual de segmentos de grabación debajo del temporizador
2. WHEN el usuario pausa la grabación, THE Recording System SHALL cerrar el segmento actual mostrando su duración y crear un nuevo segmento al reanudar
3. WHEN THE Recording System muestra segmentos, THE Recording System SHALL indicar visualmente qué segmento está activo (grabando) con un indicador pulsante
4. WHEN hay múltiples segmentos, THE Recording System SHALL mostrar el número de segmento, duración individual, y estado (grabando/pausado/completado)
5. WHEN el usuario detiene la grabación, THE Recording System SHALL mostrar un resumen total con número de segmentos y duración total acumulada

### Requirement 3

**User Story:** Como médico, quiero que mis grabaciones se guarden automáticamente en el navegador, para no perder datos si pierdo la conexión a internet o cierro accidentalmente la aplicación.

#### Acceptance Criteria

1. WHEN THE Recording System completa una grabación, THE Recording System SHALL almacenar automáticamente el archivo de audio en IndexedDB antes de intentar subirlo al servidor
2. WHEN THE Recording System almacena una grabación, THE Recording System SHALL guardar metadatos asociados incluyendo timestamp, duración, doctorID, y estado de sincronización
3. WHEN el usuario cierra la aplicación con grabaciones no sincronizadas, THE Recording System SHALL mantener las grabaciones en IndexedDB para acceso posterior
4. WHEN el usuario reabre la aplicación, THE Recording System SHALL cargar automáticamente la lista de grabaciones pendientes desde IndexedDB
5. THE Recording System SHALL permitir al usuario visualizar todas las grabaciones almacenadas localmente con su estado de sincronización

### Requirement 4

**User Story:** Como médico, quiero poder grabar consultas sin conexión a internet, para poder trabajar en áreas con conectividad limitada sin interrumpir mi flujo de trabajo.

#### Acceptance Criteria

1. WHEN THE Recording System detecta que no hay conexión a internet, THE Recording System SHALL permitir al usuario iniciar y completar grabaciones normalmente
2. WHEN THE Recording System completa una grabación sin conexión, THE Recording System SHALL almacenar la grabación en Offline Queue con estado "pending_upload"
3. WHEN THE Recording System está offline, THE Recording System SHALL mostrar un indicador visual claro del estado de conexión al usuario
4. WHEN THE Recording System está offline, THE Recording System SHALL deshabilitar el botón de subida inmediata y mostrar un mensaje informativo
5. THE Recording System SHALL mantener un contador visible de grabaciones pendientes de sincronización

### Requirement 5

**User Story:** Como médico, quiero que mis grabaciones se suban automáticamente cuando recupere la conexión, para no tener que recordar sincronizar manualmente mis datos.

#### Acceptance Criteria

1. WHEN THE Sync Manager detecta que la conexión a internet se ha restaurado, THE Sync Manager SHALL iniciar automáticamente el proceso de sincronización de grabaciones pendientes
2. WHEN THE Sync Manager procesa Offline Queue, THE Sync Manager SHALL subir las grabaciones en orden cronológico (más antiguas primero)
3. WHEN THE Sync Manager sube una grabación exitosamente, THE Sync Manager SHALL actualizar el estado en IndexedDB a "synced" y marcar la grabación como procesable
4. IF una subida falla después de restaurar conexión, THEN THE Sync Manager SHALL reintentar hasta 3 veces con backoff exponencial antes de marcar como "failed"
5. WHEN todas las grabaciones pendientes se sincronizan exitosamente, THE Sync Manager SHALL notificar al usuario y limpiar las grabaciones antiguas según política de retención

### Requirement 6

**User Story:** Como médico, quiero poder decidir manualmente qué hacer con grabaciones no sincronizadas, para tener control sobre mis datos cuando hay problemas de conectividad prolongados.

#### Acceptance Criteria

1. THE Recording System SHALL proporcionar una interfaz de gestión de grabaciones locales accesible desde el dashboard
2. WHEN el usuario accede a la gestión de grabaciones, THE Recording System SHALL mostrar una lista de todas las grabaciones con estado, tamaño, fecha y opciones de acción
3. WHERE una grabación tiene estado "pending_upload", THE Recording System SHALL permitir al usuario forzar la subida manual, reproducir el audio, o eliminar la grabación
4. WHERE una grabación tiene estado "failed", THE Recording System SHALL mostrar el mensaje de error y permitir reintentar la subida o eliminar la grabación
5. THE Recording System SHALL solicitar confirmación antes de eliminar cualquier grabación no sincronizada

### Requirement 7

**User Story:** Como médico, quiero que el sistema maneje correctamente los errores de grabación, para entender qué salió mal y poder tomar acción apropiada.

#### Acceptance Criteria

1. IF THE Recording System no puede acceder al micrófono, THEN THE Recording System SHALL mostrar un mensaje de error específico con instrucciones para otorgar permisos
2. IF THE Recording System detecta que el almacenamiento local está lleno, THEN THE Recording System SHALL notificar al usuario y sugerir eliminar grabaciones antiguas sincronizadas
3. IF una Recording Session falla durante la captura, THEN THE Recording System SHALL intentar guardar los datos parciales en IndexedDB con estado "partial"
4. WHEN ocurre un error durante la grabación, THE Recording System SHALL registrar detalles del error en los metadatos para diagnóstico
5. THE Recording System SHALL proporcionar mensajes de error en español, claros y accionables para el usuario
6. WHEN THE Recording System genera un blob de audio, THE Recording System SHALL validar que el blob tiene tamaño mayor a 0 bytes y contiene datos válidos
7. IF el blob de audio está vacío o corrupto, THEN THE Recording System SHALL mostrar error "Audio inválido - la grabación no contiene datos" y no permitir la subida
8. WHEN THE Recording System detecta audio corrupto que causa error de transcripción, THE Recording System SHALL registrar el error específico y sugerir reintentar la grabación

### Requirement 8

**User Story:** Como médico, quiero ver el progreso de sincronización de mis grabaciones, para saber cuándo están listas para ser procesadas como historias clínicas.

#### Acceptance Criteria

1. WHEN THE Sync Manager está subiendo grabaciones, THE Sync Manager SHALL mostrar una barra de progreso con porcentaje completado para cada archivo
2. WHEN múltiples grabaciones están en cola, THE Sync Manager SHALL mostrar el progreso general indicando "X de Y grabaciones sincronizadas"
3. WHEN una grabación se sincroniza exitosamente, THE Sync Manager SHALL mostrar una notificación de éxito con opción de ver la historia clínica generada
4. WHILE THE Sync Manager está procesando, THE Sync Manager SHALL permitir al usuario continuar usando otras funciones de la aplicación
5. THE Recording System SHALL mantener un log de sincronización accesible mostrando historial de subidas exitosas y fallidas

### Requirement 9

**User Story:** Como médico, quiero que el sistema optimice el uso de almacenamiento local, para no llenar el espacio de mi dispositivo con grabaciones antiguas.

#### Acceptance Criteria

1. WHEN una grabación se sincroniza exitosamente y su historia clínica se completa, THE Recording System SHALL marcar la grabación local como elegible para limpieza después de 7 días
2. WHEN THE Recording System detecta que el almacenamiento disponible es menor a 100MB, THE Recording System SHALL eliminar automáticamente grabaciones sincronizadas más antiguas que 7 días
3. THE Recording System SHALL mantener siempre las grabaciones no sincronizadas independientemente del espacio disponible
4. WHEN el usuario solicita limpiar almacenamiento manualmente, THE Recording System SHALL mostrar cuánto espacio se liberará antes de confirmar
5. THE Recording System SHALL proporcionar estadísticas de uso de almacenamiento en la interfaz de gestión de grabaciones

