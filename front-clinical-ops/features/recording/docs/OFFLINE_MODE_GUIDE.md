# Guía de Modo Offline - Grabación de Consultas

## Introducción

El sistema de grabación de ClinicalOps ahora soporta operación offline completa, permitiéndote grabar consultas incluso sin conexión a internet. Todas las grabaciones se guardan automáticamente en tu navegador y se sincronizan cuando recuperas la conexión.

## Características Principales

### 🎙️ Grabación con Pausa/Reanudación

- **Pausar durante la grabación**: Presiona el botón "Pausar" en cualquier momento para detener temporalmente la captura de audio
- **Reanudar grabación**: Presiona "Reanudar" para continuar grabando en la misma sesión
- **Audio continuo**: Todas las pausas y reanudaciones se combinan en un único archivo de audio sin interrupciones

### 💾 Almacenamiento Local Automático

- **Guardado automático**: Cada grabación se guarda automáticamente en tu navegador al finalizar
- **Sin pérdida de datos**: Tus grabaciones están seguras incluso si cierras el navegador o pierdes la conexión
- **Acceso offline**: Puedes revisar y reproducir grabaciones guardadas sin conexión a internet

### 🔄 Sincronización Automática

- **Detección de conexión**: El sistema detecta automáticamente cuando recuperas la conexión a internet
- **Subida automática**: Las grabaciones pendientes se suben automáticamente en orden cronológico
- **Reintentos inteligentes**: Si una subida falla, el sistema reintenta automáticamente con intervalos crecientes
- **Notificaciones**: Recibes notificaciones cuando las grabaciones se sincronizan exitosamente

### 📊 Gestión de Grabaciones

Accede al panel de gestión desde el menú "Gestionar Grabaciones" para:

- Ver todas tus grabaciones locales con su estado
- Reproducir audio de cualquier grabación
- Subir manualmente grabaciones pendientes
- Eliminar grabaciones antiguas ya sincronizadas
- Ver estadísticas de uso de almacenamiento

## Cómo Usar

### Grabar una Consulta

1. **Iniciar grabación**:
   - Haz clic en el botón "Iniciar Grabación"
   - Permite el acceso al micrófono cuando el navegador lo solicite
   - El contador de tiempo comenzará a correr

2. **Durante la grabación**:
   - Puedes pausar en cualquier momento presionando "Pausar"
   - Reanuda cuando estés listo presionando "Reanudar"
   - El tiempo total se muestra en pantalla

3. **Finalizar grabación**:
   - Presiona "Detener" cuando termines la consulta
   - La grabación se guarda automáticamente en tu navegador
   - Si hay conexión, se sube inmediatamente al servidor

### Trabajar Sin Conexión

1. **Indicador de estado**:
   - Un badge en la parte superior muestra tu estado de conexión
   - 🟢 Verde = Online
   - 🔴 Rojo = Offline

2. **Grabar offline**:
   - Puedes grabar normalmente sin conexión
   - Las grabaciones se guardan localmente
   - Un contador muestra cuántas grabaciones están pendientes de subir

3. **Cuando recuperes conexión**:
   - El sistema detecta automáticamente la reconexión
   - Las grabaciones pendientes se suben automáticamente
   - Recibes una notificación cuando se completa la sincronización

### Gestionar Grabaciones

1. **Acceder al panel**:
   - Haz clic en "Gestionar Grabaciones" en el menú
   - O haz clic en el contador de grabaciones pendientes

2. **Filtrar grabaciones**:
   - **Todas**: Muestra todas las grabaciones
   - **Pendientes**: Solo grabaciones que faltan subir
   - **Sincronizadas**: Grabaciones ya procesadas
   - **Fallidas**: Grabaciones con errores de subida

3. **Buscar grabaciones**:
   - Usa la barra de búsqueda para encontrar por nombre, ID o fecha
   - Los resultados se filtran en tiempo real

4. **Acciones disponibles**:
   - ▶️ **Reproducir**: Escucha el audio de la grabación
   - ⬆️ **Subir**: Fuerza la subida manual de una grabación pendiente
   - 🔄 **Reintentar**: Reintenta subir una grabación fallida
   - 🗑️ **Eliminar**: Elimina una grabación (requiere confirmación)

### Limpieza de Almacenamiento

El sistema gestiona automáticamente el espacio de almacenamiento:

1. **Limpieza automática**:
   - Grabaciones sincronizadas de más de 7 días se eliminan automáticamente
   - Solo cuando el espacio disponible es menor a 100MB
   - Las grabaciones no sincronizadas NUNCA se eliminan automáticamente

2. **Limpieza manual**:
   - Haz clic en "Limpiar Almacenamiento" en el panel de gestión
   - Revisa qué grabaciones se eliminarán y cuánto espacio se liberará
   - Confirma la acción para proceder

3. **Estadísticas de almacenamiento**:
   - Total de grabaciones por estado
   - Espacio total utilizado
   - Espacio disponible estimado

## Solución de Problemas

### No puedo grabar (Error de micrófono)

**Problema**: El navegador no puede acceder al micrófono

**Soluciones**:

1. **Chrome/Edge**:
   - Haz clic en el ícono de candado en la barra de direcciones
   - Selecciona "Configuración del sitio"
   - Cambia "Micrófono" a "Permitir"
   - Recarga la página

2. **Firefox**:
   - Haz clic en el ícono de información (i) en la barra de direcciones
   - Selecciona "Permisos"
   - Encuentra "Usar el micrófono" y selecciona "Permitir"
   - Recarga la página

3. **Safari**:
   - Ve a Safari > Preferencias > Sitios web > Micrófono
   - Encuentra el sitio y selecciona "Permitir"
   - Recarga la página

### La grabación se cortó o está incompleta

**Problema**: La grabación se detuvo inesperadamente

**Soluciones**:

1. Verifica que el micrófono esté conectado correctamente
2. Revisa que no hayas cerrado la pestaña durante la grabación
3. Busca la grabación en "Gestión de Grabaciones" - puede estar guardada como "Parcial"
4. Si la grabación parcial tiene contenido útil, puedes intentar subirla manualmente

### Las grabaciones no se sincronizan

**Problema**: Las grabaciones permanecen en estado "Pendiente"

**Soluciones**:

1. **Verifica tu conexión**:
   - Comprueba que el indicador muestre estado "Online"
   - Intenta cargar otra página web para confirmar conectividad

2. **Sincronización manual**:
   - Ve a "Gestión de Grabaciones"
   - Encuentra la grabación pendiente
   - Haz clic en el botón "Subir" (⬆️)

3. **Revisa errores**:
   - Ve a la pestaña "Registro de Errores" en el panel de gestión
   - Busca mensajes de error relacionados con la grabación
   - Contacta soporte si el error persiste

### Almacenamiento lleno

**Problema**: No puedes grabar porque el almacenamiento está lleno

**Soluciones**:

1. **Limpieza automática**:
   - Ve a "Gestión de Grabaciones"
   - Haz clic en "Limpiar Almacenamiento"
   - Confirma la eliminación de grabaciones antiguas sincronizadas

2. **Limpieza manual**:
   - Revisa grabaciones sincronizadas antiguas
   - Elimina manualmente las que ya no necesites
   - Prioriza eliminar grabaciones grandes

3. **Sincroniza pendientes**:
   - Asegúrate de que todas las grabaciones pendientes se hayan subido
   - Una vez sincronizadas, serán elegibles para limpieza automática

### La grabación tiene pausas audibles

**Problema**: Se escuchan cortes o pausas en el audio final

**Nota**: Esto NO debería ocurrir. El sistema combina todos los segmentos en un archivo continuo.

**Soluciones**:

1. Reporta el problema a soporte técnico con:
   - ID de la grabación afectada
   - Navegador y versión utilizada
   - Cuántas veces pausaste durante la grabación

2. Como solución temporal:
   - Intenta minimizar el uso de pausa/reanudación
   - Graba en sesiones continuas cuando sea posible

## Preguntas Frecuentes

### ¿Cuánto espacio de almacenamiento tengo disponible?

El espacio disponible depende de tu navegador y sistema operativo:

- **Chrome/Edge**: Hasta 60% del espacio libre en disco
- **Firefox**: Hasta 50% del espacio libre en disco
- **Safari**: Hasta 1GB por sitio web

Puedes ver tu uso actual en el panel de "Gestión de Grabaciones".

### ¿Qué pasa si cierro el navegador durante una grabación?

Si cierras el navegador mientras grabas:

- La grabación se detiene inmediatamente
- Los datos capturados hasta ese momento se intentan guardar como "Parcial"
- Puedes encontrar la grabación parcial en "Gestión de Grabaciones"
- El sistema te advertirá antes de cerrar si hay una grabación en progreso

### ¿Cuánto tiempo se guardan las grabaciones localmente?

- **Grabaciones no sincronizadas**: Se guardan indefinidamente hasta que se suban o elimines manualmente
- **Grabaciones sincronizadas**: Se eliminan automáticamente después de 7 días (solo si el espacio es limitado)
- **Grabaciones fallidas**: Se guardan indefinidamente hasta que las reintentes o elimines

### ¿Puedo usar el sistema en múltiples dispositivos?

Sí, pero ten en cuenta:

- Las grabaciones locales son específicas de cada navegador/dispositivo
- Una grabación hecha en tu computadora no aparecerá en tu tablet hasta que se sincronice
- Una vez sincronizada, la historia clínica generada está disponible en todos tus dispositivos

### ¿Es seguro almacenar grabaciones en el navegador?

Sí, el almacenamiento es seguro:

- Los datos se almacenan en IndexedDB, que es específico del origen (tu dominio)
- Otros sitios web no pueden acceder a tus grabaciones
- Los datos persisten incluso si limpias el caché del navegador (a menos que específicamente elimines datos del sitio)
- Las grabaciones se cifran durante la transmisión al servidor

### ¿Qué formato de audio se utiliza?

- **Formato**: WebM con códec Opus (o OGG como alternativa)
- **Calidad**: Optimizada para voz (no música)
- **Tamaño**: Aproximadamente 1-2 MB por minuto de grabación
- **Compatibilidad**: Soportado por todos los navegadores modernos

## Mejores Prácticas

### Para Grabaciones de Calidad

1. **Ambiente silencioso**: Graba en un lugar con mínimo ruido de fondo
2. **Micrófono cercano**: Mantén el micrófono a una distancia razonable
3. **Prueba antes**: Haz una grabación de prueba corta para verificar el audio
4. **Batería suficiente**: Asegúrate de tener batería si usas un dispositivo móvil

### Para Gestión Eficiente

1. **Sincroniza regularmente**: Conecta a WiFi al final del día para sincronizar todas las grabaciones
2. **Limpia periódicamente**: Revisa y limpia grabaciones antiguas cada semana
3. **Verifica sincronización**: Confirma que las grabaciones importantes se hayan sincronizado correctamente
4. **Nombra descriptivamente**: Aunque el sistema genera nombres automáticos, puedes identificar grabaciones por fecha/hora

### Para Trabajo Offline

1. **Planifica con anticipación**: Si sabes que estarás sin conexión, verifica que tengas espacio suficiente
2. **Sincroniza antes**: Sube todas las grabaciones pendientes antes de ir a un área sin cobertura
3. **Monitorea espacio**: Revisa el espacio disponible si planeas múltiples grabaciones offline
4. **Conecta cuando puedas**: Sincroniza en cuanto tengas conexión estable

## Soporte Técnico

Si experimentas problemas no cubiertos en esta guía:

1. **Registro de errores**: Revisa la pestaña "Registro de Errores" en el panel de gestión
2. **Información del sistema**: Anota tu navegador, versión y sistema operativo
3. **Detalles del problema**: Describe qué estabas haciendo cuando ocurrió el error
4. **Contacta soporte**: Envía toda la información recopilada al equipo de soporte

---

**Última actualización**: Noviembre 2024  
**Versión del sistema**: 2.0 - Soporte Offline Completo
