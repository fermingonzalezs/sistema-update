# Sistema de Adjuntos para Asientos Contables

## Descripción
Sistema que permite adjuntar hasta 3 archivos (imágenes o PDFs) a cada asiento contable para documentar facturas, recibos u otros comprobantes.

## Características
- **Límite**: Máximo 3 archivos por asiento
- **Formatos permitidos**: JPG, PNG, WEBP, PDF
- **Tamaño máximo**: 5MB por archivo
- **Orden automático**: Los archivos se numeran del 1 al 3
- **Descripción opcional**: Se puede agregar una descripción a cada archivo
- **Vista previa**: Visualización inline de imágenes y enlace para PDFs

## Ubicación en el sistema
El componente de gestión de fotos aparece:
- En el modal de **edición** de asientos (no en creación)
- Indicador visual (📎) en la lista de asientos que tienen archivos adjuntos

## Componentes

### GestionFotosAsiento.jsx
Componente principal que gestiona la subida, visualización y eliminación de archivos.

**Props:**
- `asientoId`: ID del asiento contable
- `readOnly`: Modo solo lectura (default: false)

**Funcionalidades:**
- Botón "Adjuntar" para subir archivos
- Grid de 3 slots para visualizar archivos
- Modal de vista previa con edición de descripción
- Eliminación de archivos con confirmación
- Reorganización automática del orden al eliminar

### Hook: useFotosAsientos.js
Servicio para interactuar con la base de datos y Supabase Storage.

**Funciones principales:**
- `getFotosByAsiento(asientoId)`: Obtiene todas las fotos de un asiento
- `subirFoto(archivo, asientoId, descripcion)`: Sube un nuevo archivo
- `eliminarFoto(fotoId)`: Elimina un archivo y reorganiza el orden
- `actualizarDescripcion(fotoId, nuevaDescripcion)`: Actualiza la descripción
- `tieneFotos(asientoId)`: Verifica si un asiento tiene archivos adjuntos

## Base de Datos

### Tabla: fotos_asientos_contables
```sql
CREATE TABLE fotos_asientos_contables (
  id BIGSERIAL PRIMARY KEY,
  asiento_id INTEGER NOT NULL REFERENCES asientos_contables(id) ON DELETE CASCADE,
  url_foto TEXT NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  tamaño_archivo INTEGER,
  orden INTEGER DEFAULT 1 CHECK (orden >= 1 AND orden <= 3),
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_asiento_orden UNIQUE (asiento_id, orden)
);
```

### Storage Bucket: fotos-asientos
- **Tamaño máximo**: 5MB
- **Tipos permitidos**: image/jpeg, image/jpg, image/png, image/webp, application/pdf
- **Acceso**: Público para lectura, autenticado para escritura

## Uso

### Adjuntar archivos a un asiento
1. Editar un asiento existente
2. Scroll hasta la sección "Archivos Adjuntos"
3. Clic en el botón "Adjuntar" (📎)
4. Seleccionar el archivo (máximo 5MB)
5. El archivo se sube automáticamente

### Ver archivos adjuntos
- **En la lista de asientos**: Buscar el ícono 📎 junto a la descripción
- **En modo edición**: Los archivos aparecen en el grid de 3 slots
- **Clic en la imagen**: Abre modal con vista previa ampliada

### Eliminar archivos
1. Hover sobre el archivo en el grid
2. Clic en el botón de eliminar (🗑️)
3. Confirmar eliminación
4. El orden se reorganiza automáticamente

## Migración desde sistema anterior
El sistema anterior de gestión de fotos de productos (`GestionFotos.jsx`) fue eliminado del módulo de ventas. La funcionalidad de adjuntar archivos ahora está específicamente diseñada para asientos contables.

## Notas técnicas
- Los archivos se almacenan en Supabase Storage con nombres únicos
- La ruta de almacenamiento sigue el patrón: `asientos-contables/asiento_{id}_{timestamp}_{orden}.{ext}`
- Al eliminar un asiento, todos sus archivos se eliminan automáticamente (CASCADE)
- La reorganización del orden es automática al eliminar archivos
- Los PDFs se muestran con un ícono, no se renderizan inline

## Limitaciones
- Solo se pueden adjuntar archivos en modo edición (no al crear un asiento nuevo)
- Los archivos no se incluyen en los PDFs generados del Libro Diario
- No hay función de arrastrar y soltar (drag & drop)
