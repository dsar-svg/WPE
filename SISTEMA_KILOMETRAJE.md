# Sistema de Cobro por Kilometraje - Panda Express

## Descripción

El sistema ha sido actualizado para calcular el costo de delivery basado en la distancia real entre la sede y la dirección del cliente, en lugar de usar zonas predefinidas.

## Características Implementadas

### 🗺️ **Geocodificación Gratuita**
- Usa **Nominatim (OpenStreetMap)** para convertir direcciones a coordenadas
- No requiere API key ni tiene costos
- Búsqueda en tiempo real con autocompletado

### 📍 **Mapas Atractivos**
- **Stadia Maps** para mapas visuales modernos y profesionales
- Selección de ubicación por click en el mapa
- Ubicación automática del usuario

### 📏 **Cálculo de Distancias**
- **Fórmula Haversine** para cálculo preciso de distancias
- Distancias en kilómetros con precisión de 1 decimal
- Validación de área de cobertura

### 💰 **Tarifas por Distancia**
- Configuración global (solo super admin)
- Rangos escalonados configurables
- Ejemplo por defecto:
  - 0-5 km: $3.00
  - 5-10 km: $5.00
  - 10-15 km: $7.00
  - 15+ km: Consultar disponibilidad

## Configuración Requerida

### 1. Coordenadas de Sedes
Cada sede debe tener sus coordenadas geográficas configuradas en el panel de administración:
- **Latitud**: Coordenada norte-sur (ej: 10.162)
- **Longitud**: Coordenada este-oeste (ej: -68.007)

### 2. Configuración Global
El super admin debe configurar los rangos de tarifas en "Ajustes de Marca":
1. Ir a Panel Admin → Ajustes de Marca
2. Configurar "Tarifas por Distancia"
3. Establecer distancia máxima de delivery
4. Definir rangos y tarifas

## Flujo del Usuario

### Cliente:
1. Selecciona sede
2. Elige "Delivery"
3. Escribe dirección → autocompletado sugiere opciones
4. O usa "Ubicación actual" o selecciona en mapa
5. Sistema calcula distancia y muestra tarifa
6. Confirma pedido

### Administrador:
1. Configura coordenadas de cada sede
2. Define rangos globales de tarifas
3. Monitorea pedidos con información de distancia

## Archivos Modificados

### Nuevos:
- `src/services/DistanceService.ts` - Servicio de geocodificación y cálculos
- `src/hooks/useDistanceCalculation.ts` - Hook React para cálculos
- `SISTEMA_KILOMETRAJE.md` - Esta documentación

### Modificados:
- `src/types.ts` - Interfaces actualizadas
- `src/components/CartDrawer.tsx` - Nueva UI de delivery
- `src/components/MapComponent.tsx` - Mapas mejorados
- `src/pages/AdminPage.tsx` - Configuración global
- `src/utils.ts` - Mensajes de WhatsApp actualizados
- `src/context/RestaurantContext.tsx` - Configuración por defecto
- `src/constants.ts` - Coordenadas de sedes
- `.env.example` - Documentación actualizada

## Ventajas del Nuevo Sistema

✅ **Más justo** - Pago proporcional a la distancia real
✅ **Preciso** - Cálculo basado en coordenadas reales
✅ **Gratuito** - Sin costos de API externas
✅ **Flexible** - Rangos configurables fácilmente
✅ **Experiencia mejorada** - Mapas atractivos y autocompletado

## Solución de Problemas

### La geocodificación no funciona:
- Verificar conexión a internet
- Las direcciones deben tener al menos 3 caracteres

### Las coordenadas no son precisas:
- Usar herramientas como Google Maps para obtener coordenadas exactas
- Verificar que las coordenadas estén en el formato correcto

### El cálculo de distancia parece incorrecto:
- Verificar que las coordenadas de la sede estén correctas
- La fórmula Haversine calcula distancia en línea recta (no rutas)

## Próximas Mejoras

- Implementar cálculo de rutas reales (cuando haya presupuesto para APIs)
- Historial de direcciones frecuentes
- Optimización de rutas para múltiples pedidos
- Integración con servicios de delivery externos