# Preguntas Frecuentes - Sistema de Grabación Offline

## General

### ¿Qué es el modo offline?

El modo offline permite grabar consultas médicas incluso sin conexión a internet. Las grabaciones se guardan automáticamente en tu navegador y se sincronizan cuando recuperas la conexión.

### ¿Necesito hacer algo especial para usar el modo offline?

No. El sistema funciona automáticamente:

- Detecta tu estado de conexión
- Guarda todas las grabaciones localmente
- Sincroniza automáticamente cuando hay conexión

## Grabación

### ¿Puedo pausar una grabación?

Sí. Puedes pausar y reanudar cuantas veces necesites. El sistema combina todos los segmentos en un único archivo de audio continuo.

### ¿Qué pasa si pierdo la conexión durante una grabación?

Nada. La grabación continúa normalmente y se guarda en tu navegador. Se subirá automáticamente cuando recuperes la conexión.

### ¿Cuánto tiempo puedo grabar?

No hay límite de tiempo específico, pero considera:

- El espacio disponible en tu navegador
- La batería de tu dispositivo
- Grabaciones muy largas (>2 horas) pueden ser más difíciles de procesar

### ¿Puedo grabar en mi teléfono móvil?

Sí, el sistema funciona en navegadores móviles modernos:

- iOS: Safari 14.1+
- Android: Chrome 47+

## Almacenamiento

### ¿Cuánto espacio ocupan las grabaciones?

Aproximadamente 1-2 MB por minuto de grabación. Por ejemplo:

- Consulta de 10 minutos: ~15 MB
- Consulta de 30 minutos: ~45 MB
- Consulta de 1 hora: ~90 MB

### ¿Qué pasa cuando se llena el almacenamiento?

El sistema:

1. Te notifica cuando el espacio es bajo
2. Sugiere eliminar grabaciones antiguas sincronizadas
3. Elimina automáticamente grabaciones sincronizadas de más de 7 días (solo si es necesario)
4. NUNCA elimina grabaciones no sincronizadas

### ¿Puedo aumentar el espacio de almacenamiento?

El espacio disponible depende de tu navegador y no se puede aumentar directamente. Sin embargo, puedes:

- Liberar espacio en tu disco duro
- Sincronizar y limpiar grabaciones antiguas regularmente
- Usar un dispositivo con más espacio disponible

## Sincronización

### ¿Cómo sé si una grabación se sincronizó?

Verás:

- Una notificación de éxito
- El estado cambia a "Sincronizado" en el panel de gestión
- Un badge verde en la tarjeta de la grabación

### ¿Qué pasa si falla la sincronización?

El sistema:

1. Reintenta automáticamente hasta 3 veces
2. Usa intervalos crecientes entre reintentos (1s, 2s, 4s)
3. Marca la grabación como "Fallida" si todos los reintentos fallan
4. Te permite reintentar manualmente desde el panel de gestión

### ¿Puedo forzar la sincronización de una grabación?

Sí. En el panel de "Gestión de Grabaciones":

1. Encuentra la grabación pendiente
2. Haz clic en el botón "Subir" (⬆️)
3. La grabación se subirá inmediatamente

### ¿En qué orden se sincronizan las grabaciones?

Las grabaciones se sincronizan en orden cronológico (más antiguas primero) para mantener la secuencia correcta de las historias clínicas.

## Seguridad y Privacidad

### ¿Son seguras las grabaciones en mi navegador?

Sí:

- Se almacenan en IndexedDB, específico de tu dominio
- Otros sitios web no pueden acceder a ellas
- Se cifran durante la transmisión al servidor
- Solo tú (con tu sesión activa) puedes acceder a ellas

### ¿Qué pasa si alguien más usa mi computadora?

Las grabaciones están asociadas a tu sesión de usuario. Si cierras sesión:

- Las grabaciones permanecen en el navegador
- Pero solo son accesibles cuando inicias sesión nuevamente
- Recomendamos siempre cerrar sesión en computadoras compartidas

### ¿Se pueden recuperar grabaciones eliminadas?

No. Una vez eliminadas del navegador:

- No se pueden recuperar localmente
- Si ya estaban sincronizadas, la historia clínica permanece en el servidor
- Si no estaban sincronizadas, se pierden permanentemente

## Problemas Técnicos

### El navegador no detecta mi micrófono

Verifica:

1. El micrófono está conectado correctamente
2. Los permisos del navegador están configurados para permitir el micrófono
3. Ninguna otra aplicación está usando el micrófono
4. El micrófono funciona en otras aplicaciones

### La grabación suena distorsionada o con ruido

Posibles causas:

- Micrófono de baja calidad
- Nivel de volumen muy alto (causa distorsión)
- Interferencia de otros dispositivos
- Ruido ambiental excesivo

Soluciones:

- Usa un micrófono externo de calidad
- Ajusta el nivel de volumen del micrófono
- Graba en un ambiente más silencioso
- Mantén el micrófono a distancia apropiada

### El indicador de conexión muestra "Offline" pero tengo internet

El sistema verifica la conexión real, no solo la disponibilidad de red. Posibles causas:

- Firewall bloqueando la conexión
- Proxy o VPN interfiriendo
- Servidor temporalmente no disponible
- Conexión muy lenta o inestable

Soluciones:

- Verifica que puedas acceder a otros sitios web
- Desactiva temporalmente VPN/proxy
- Espera unos segundos y verifica si se reconecta
- Contacta soporte si el problema persiste

### Las grabaciones no aparecen en el panel de gestión

Verifica:

1. Estás usando el mismo navegador donde grabaste
2. No has limpiado los datos del sitio
3. Los filtros no están ocultando las grabaciones
4. Estás iniciado sesión con la misma cuenta

## Compatibilidad

### ¿Qué navegadores son compatibles?

Navegadores modernos con soporte para MediaRecorder API:

- ✅ Chrome 47+
- ✅ Firefox 25+
- ✅ Safari 14.1+
- ✅ Edge 79+
- ✅ Opera 36+

### ¿Funciona en navegadores móviles?

Sí:

- ✅ iOS Safari 14.1+
- ✅ Android Chrome 47+
- ⚠️ Algunos navegadores móviles antiguos pueden tener limitaciones

### ¿Funciona en modo incógnito/privado?

Sí, pero con limitaciones:

- Las grabaciones se guardan durante la sesión
- Se eliminan cuando cierras el navegador
- Recomendamos usar modo normal para grabaciones importantes

## Rendimiento

### ¿Afecta el rendimiento de mi computadora?

El impacto es mínimo:

- Uso de CPU: Bajo (solo durante grabación)
- Uso de memoria: Moderado (depende de la duración)
- Uso de disco: Solo para almacenar grabaciones

### ¿Puedo usar otras pestañas mientras grabo?

Sí, puedes:

- Navegar en otras pestañas
- Usar otras aplicaciones
- Minimizar el navegador

No debes:

- Cerrar la pestaña de grabación
- Cerrar el navegador completamente
- Apagar la computadora

### ¿Cuántas grabaciones puedo tener almacenadas?

No hay límite de cantidad, solo de espacio. El límite depende de:

- Espacio disponible en tu disco
- Límites del navegador (generalmente 50-60% del espacio libre)
- Tamaño de cada grabación

## Mejores Prácticas

### ¿Con qué frecuencia debo sincronizar?

Recomendamos:

- Al final de cada día de consultas
- Cuando tengas conexión WiFi estable
- Antes de apagar tu dispositivo
- Cuando el contador de pendientes sea alto (>10)

### ¿Cuándo debo limpiar el almacenamiento?

Limpia cuando:

- El sistema te notifique que el espacio es bajo
- Tengas muchas grabaciones sincronizadas antiguas (>1 mes)
- Planees grabar muchas consultas sin conexión
- Semanalmente como mantenimiento preventivo

### ¿Debo hacer respaldo de las grabaciones?

No es necesario porque:

- Las grabaciones sincronizadas están en el servidor
- Las historias clínicas generadas son el registro oficial
- El audio original se mantiene en el servidor

Solo considera respaldo si:

- Tienes grabaciones muy importantes no sincronizadas
- Planeas reinstalar tu sistema operativo
- Vas a cambiar de navegador

## Soporte

### ¿Dónde puedo obtener más ayuda?

1. **Documentación**: Lee la Guía de Modo Offline completa
2. **Registro de errores**: Revisa la pestaña "Registro de Errores" en el panel
3. **Soporte técnico**: Contacta al equipo con:
   - Descripción del problema
   - Navegador y versión
   - Pasos para reproducir el error
   - Capturas de pantalla si es posible

### ¿Cómo reporto un error?

Incluye:

1. **Qué estabas haciendo**: Descripción detallada
2. **Qué esperabas**: Comportamiento esperado
3. **Qué pasó**: Comportamiento actual
4. **Información técnica**:
   - Navegador y versión
   - Sistema operativo
   - Mensajes de error (del Registro de Errores)
5. **Capturas de pantalla**: Si es relevante

### ¿Hay actualizaciones del sistema?

El sistema se actualiza automáticamente. Las nuevas características y correcciones se aplican sin necesidad de acción de tu parte. Revisa las notas de versión para conocer las últimas mejoras.

---

**¿No encontraste tu pregunta?** Contacta al equipo de soporte técnico.
