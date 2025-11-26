# Gestión de Almacenamiento - Sistema de Grabación

## Introducción

El sistema de grabación utiliza el almacenamiento local de tu navegador (IndexedDB) para guardar grabaciones de forma segura y persistente. Esta guía explica cómo funciona el almacenamiento y cómo gestionarlo eficientemente.

## Cómo Funciona el Almacenamiento

### IndexedDB

El sistema utiliza IndexedDB, una base de datos integrada en tu navegador que:

- **Persiste datos**: Las grabaciones permanecen incluso si cierras el navegador
- **Es específica del sitio**: Solo ClinicalOps puede acceder a estos datos
- **Soporta archivos grandes**: Puede almacenar cientos de MB o incluso GB
- **Es rápida**: Acceso eficiente a grabaciones individuales

### Límites de Almacenamiento

Los límites varían según el navegador:

| Navegador   | Límite Típico         | Notas                             |
| ----------- | --------------------- | --------------------------------- |
| Chrome/Edge | 60% del espacio libre | Dinámico según espacio disponible |
| Firefox     | 50% del espacio libre | Máximo 2GB por grupo de origen    |
| Safari      | ~1GB                  | Límite más restrictivo            |
| Opera       | 60% del espacio libre | Similar a Chrome                  |

**Ejemplo práctico**:

- Si tienes 100GB libres en tu disco
- Chrome permite usar hasta ~60GB para todos los sitios web
- ClinicalOps puede usar una porción de esos 60GB

## Estadísticas de Almacenamiento

### Panel de Estadísticas

En el panel de "Gestión de Grabaciones" verás:

1. **Total de Grabaciones**:
   - Número total de grabaciones guardadas
   - Desglose por estado (pendientes, sincronizadas, fallidas)

2. **Espacio Utilizado**:
   - Tamaño total de todas las grabaciones
   - Mostrado en MB o GB según corresponda

3. **Espacio Disponible**:
   - Estimación del espacio restante
   - Basado en la cuota del navegador

4. **Barra de Progreso Visual**:
   - Representación gráfica del uso
   - Cambia de color según el nivel:
     - 🟢 Verde: <50% usado
     - 🟡 Amarillo: 50-80% usado
     - 🔴 Rojo: >80% usado

### Interpretación de Estadísticas

**Ejemplo de lectura**:

```
Total de Grabaciones: 45
├─ Pendientes: 3
├─ Sincronizadas: 40
└─ Fallidas: 2

Espacio Utilizado: 2.3 GB / 5.0 GB disponibles
[████████████░░░░░░░░] 46%
```

Esto significa:

- Tienes 45 grabaciones guardadas
- 3 aún no se han subido al servidor
- 40 ya están sincronizadas (elegibles para limpieza)
- 2 tuvieron errores al subir
- Estás usando 2.3GB de 5GB disponibles (46%)
- Aún tienes espacio cómodo para más grabaciones

## Limpieza de Almacenamiento

### Limpieza Automática

El sistema limpia automáticamente cuando:

1. **Condición de espacio**: Espacio disponible < 100MB
2. **Condición de tiempo**: Grabación sincronizada hace más de 7 días
3. **Condición de estado**: Solo grabaciones con estado "sincronizado"

**Proceso automático**:

```
1. Sistema detecta espacio bajo (<100MB)
2. Identifica grabaciones sincronizadas >7 días
3. Elimina las más antiguas primero
4. Continúa hasta liberar espacio suficiente
5. Registra la operación en el log
```

**Protecciones**:

- ❌ NUNCA elimina grabaciones pendientes
- ❌ NUNCA elimina grabaciones fallidas
- ❌ NUNCA elimina grabaciones parciales
- ✅ SOLO elimina grabaciones sincronizadas antiguas

### Limpieza Manual

#### Cuándo Limpiar Manualmente

Considera limpiar cuando:

- El espacio disponible es <20%
- Tienes muchas grabaciones sincronizadas antiguas
- Planeas grabar muchas consultas sin conexión
- Quieres mantener el sistema optimizado

#### Cómo Limpiar Manualmente

1. **Acceder al diálogo de limpieza**:
   - Ve a "Gestión de Grabaciones"
   - Haz clic en "Limpiar Almacenamiento"

2. **Revisar grabaciones elegibles**:
   - El sistema muestra qué se eliminará
   - Verás la fecha de cada grabación
   - Se muestra el espacio total a liberar

3. **Confirmar limpieza**:
   - Revisa cuidadosamente la lista
   - Haz clic en "Confirmar Limpieza"
   - Las grabaciones se eliminan inmediatamente

4. **Verificar resultados**:
   - Las estadísticas se actualizan automáticamente
   - Verás el nuevo espacio disponible
   - Recibes confirmación de cuántas grabaciones se eliminaron

#### Ejemplo de Diálogo de Limpieza

```
┌─────────────────────────────────────────────┐
│ Limpiar Almacenamiento                      │
├─────────────────────────────────────────────┤
│                                             │
│ Grabaciones elegibles para limpieza:       │
│                                             │
│ ✓ consulta-2024-10-15.webm (45 MB)        │
│   Sincronizada hace 12 días                │
│                                             │
│ ✓ consulta-2024-10-18.webm (38 MB)        │
│   Sincronizada hace 9 días                 │
│                                             │
│ ✓ consulta-2024-10-20.webm (52 MB)        │
│   Sincronizada hace 7 días                 │
│                                             │
│ Total a liberar: 135 MB                    │
│                                             │
│ [Cancelar]  [Confirmar Limpieza]          │
└─────────────────────────────────────────────┘
```

### Limpieza Selectiva

Para eliminar grabaciones específicas:

1. **Buscar la grabación**:
   - Usa filtros o búsqueda en el panel
   - Encuentra la grabación que deseas eliminar

2. **Verificar estado**:
   - Asegúrate de que esté sincronizada
   - Confirma que no la necesitas localmente

3. **Eliminar**:
   - Haz clic en el botón de eliminar (🗑️)
   - Confirma la acción en el diálogo
   - La grabación se elimina inmediatamente

**Advertencia**: La eliminación es permanente. No se puede deshacer.

## Optimización del Almacenamiento

### Mejores Prácticas

1. **Sincroniza Regularmente**:
   - Conecta a WiFi al final del día
   - Permite que todas las grabaciones se suban
   - Las grabaciones sincronizadas son elegibles para limpieza

2. **Limpia Periódicamente**:
   - Revisa el almacenamiento semanalmente
   - Limpia cuando el uso supere el 70%
   - No esperes a que el espacio sea crítico

3. **Monitorea Grabaciones Fallidas**:
   - Reintenta subir grabaciones fallidas
   - Una vez sincronizadas, se pueden limpiar
   - No dejes acumular grabaciones fallidas

4. **Planifica para Trabajo Offline**:
   - Limpia antes de ir a áreas sin conexión
   - Asegura tener al menos 500MB libres
   - Considera el número de consultas esperadas

### Cálculo de Espacio Necesario

**Fórmula básica**:

```
Espacio necesario = Número de consultas × Duración promedio × 1.5 MB/min
```

**Ejemplos**:

1. **Día normal** (10 consultas de 15 min):

   ```
   10 × 15 × 1.5 = 225 MB necesarios
   ```

2. **Día intenso** (20 consultas de 20 min):

   ```
   20 × 20 × 1.5 = 600 MB necesarios
   ```

3. **Semana offline** (50 consultas de 15 min):
   ```
   50 × 15 × 1.5 = 1,125 MB (1.1 GB) necesarios
   ```

**Recomendación**: Mantén siempre al menos 2x el espacio calculado como margen de seguridad.

## Solución de Problemas

### Espacio Insuficiente

**Síntoma**: Mensaje "Almacenamiento lleno" al intentar grabar

**Soluciones**:

1. **Limpieza inmediata**:

   ```
   1. Detén la grabación actual
   2. Ve a "Gestión de Grabaciones"
   3. Haz clic en "Limpiar Almacenamiento"
   4. Confirma la limpieza
   5. Intenta grabar nuevamente
   ```

2. **Sincronización forzada**:

   ```
   1. Verifica que tengas conexión
   2. Sube manualmente grabaciones pendientes
   3. Espera a que se sincronicen
   4. Limpia las recién sincronizadas
   ```

3. **Eliminación selectiva**:
   ```
   1. Filtra por "Sincronizadas"
   2. Ordena por fecha (más antiguas primero)
   3. Elimina manualmente las más antiguas
   4. Continúa hasta liberar espacio suficiente
   ```

### Grabaciones No Se Eliminan

**Síntoma**: La limpieza no elimina grabaciones esperadas

**Causas posibles**:

1. **Grabaciones no sincronizadas**:
   - Verifica el estado de cada grabación
   - Solo las sincronizadas se pueden limpiar automáticamente

2. **Grabaciones recientes**:
   - La limpieza automática solo afecta grabaciones >7 días
   - Usa limpieza manual para grabaciones más recientes

3. **Error en sincronización**:
   - Grabaciones marcadas como "sincronizadas" pero sin historyID
   - Contacta soporte técnico

### Estadísticas Incorrectas

**Síntoma**: Los números no coinciden con la realidad

**Soluciones**:

1. **Refrescar estadísticas**:
   - Haz clic en el botón de refrescar (🔄)
   - Espera unos segundos
   - Las estadísticas se recalculan

2. **Limpiar caché del navegador**:
   - No elimines datos del sitio
   - Solo limpia caché de imágenes/archivos
   - Recarga la página

3. **Verificar manualmente**:
   - Cuenta las grabaciones visibles
   - Compara con el total mostrado
   - Reporta discrepancias a soporte

## Migración y Respaldo

### Cambio de Navegador

Las grabaciones son específicas del navegador. Para migrar:

1. **Antes de cambiar**:
   - Sincroniza todas las grabaciones pendientes
   - Verifica que todas estén en estado "Sincronizado"
   - Anota cualquier grabación importante

2. **En el nuevo navegador**:
   - Inicia sesión en ClinicalOps
   - Las historias clínicas estarán disponibles
   - Las grabaciones locales NO se transfieren
   - Esto es normal y esperado

3. **Grabaciones no sincronizadas**:
   - Deben sincronizarse antes de cambiar
   - No hay forma de transferirlas manualmente
   - Planifica con anticipación

### Reinstalación del Sistema

Si vas a reinstalar tu sistema operativo:

1. **Preparación**:
   - Sincroniza todas las grabaciones
   - Verifica el estado de cada una
   - Exporta historias clínicas importantes

2. **Después de reinstalar**:
   - Instala tu navegador preferido
   - Inicia sesión en ClinicalOps
   - Las historias clínicas estarán disponibles
   - Comienza con almacenamiento limpio

### Respaldo de Datos

**Importante**: No es necesario hacer respaldo de grabaciones porque:

- Las grabaciones sincronizadas están en el servidor
- Las historias clínicas son el registro oficial
- El audio original se mantiene en el servidor

**Excepción**: Solo considera respaldo si:

- Tienes grabaciones críticas no sincronizadas
- No puedes sincronizar por problemas técnicos
- Necesitas el audio original para fines legales

## Monitoreo y Mantenimiento

### Rutina Diaria

- [ ] Verifica que las grabaciones del día se sincronizaron
- [ ] Revisa el contador de grabaciones pendientes
- [ ] Confirma que no hay grabaciones fallidas

### Rutina Semanal

- [ ] Revisa las estadísticas de almacenamiento
- [ ] Limpia grabaciones sincronizadas antiguas
- [ ] Verifica el espacio disponible
- [ ] Reintenta grabaciones fallidas

### Rutina Mensual

- [ ] Analiza patrones de uso de almacenamiento
- [ ] Ajusta frecuencia de limpieza si es necesario
- [ ] Verifica que la limpieza automática funcione
- [ ] Reporta cualquier anomalía a soporte

## Preguntas Frecuentes

### ¿Puedo aumentar el límite de almacenamiento?

No directamente. El límite lo establece el navegador. Pero puedes:

- Liberar espacio en tu disco duro
- Usar un navegador con límites más generosos (Chrome/Edge)
- Limpiar datos de otros sitios web

### ¿Qué pasa si se llena el almacenamiento durante una grabación?

La grabación se detiene y:

- Los datos capturados hasta ese momento se intentan guardar
- Recibes una notificación de error
- Se te sugiere limpiar almacenamiento
- Puedes reintentar después de liberar espacio

### ¿Las grabaciones eliminadas se pueden recuperar?

No. La eliminación es permanente del almacenamiento local. Sin embargo:

- Si estaban sincronizadas, la historia clínica permanece en el servidor
- El audio original puede estar en el servidor (según configuración)
- Contacta soporte si necesitas recuperar audio de una historia específica

### ¿Cuánto tiempo se mantienen las grabaciones en el servidor?

Según la política de retención de datos de ClinicalOps:

- Historias clínicas: Indefinidamente (registro médico)
- Audio original: Según configuración (típicamente 90 días)
- Consulta la política de privacidad para detalles específicos

---

**Última actualización**: Noviembre 2024  
**Versión**: 2.0
