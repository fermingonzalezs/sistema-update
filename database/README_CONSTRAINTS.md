# Instrucciones para Aplicar Constraints de Categorías en Tabla `otros`

## ✅ Cambios Completados en el Código

### 1. **Constantes Actualizadas** (`/src/shared/constants/categoryConstants.js`)
Se agregó la nueva categoría `FUNDAS_TEMPLADOS`:

```javascript
export const CATEGORIAS_OTROS = {
  ACCESORIOS: 'ACCESORIOS',
  MONITORES: 'MONITORES',
  PERIFERICOS: 'PERIFERICOS',
  COMPONENTES: 'COMPONENTES',
  FUNDAS_TEMPLADOS: 'FUNDAS_TEMPLADOS'  // ✅ NUEVA
};

export const CATEGORIAS_OTROS_LABELS = {
  ACCESORIOS: 'Accesorios',
  MONITORES: 'Monitores',
  PERIFERICOS: 'Periféricos',
  COMPONENTES: 'Componentes',
  FUNDAS_TEMPLADOS: 'Fundas/Templados'  // ✅ NUEVA
};
```

### 2. **Modal de Productos Actualizado** (`/src/shared/components/modals/ModalProducto.jsx`)
El formulario de creación/edición ahora usa las constantes y muestra las 5 categorías correctamente.

### 3. **Validaciones en Código**
- `useOtros.js` - Valida categorías en create/update
- `useCatalogoUnificado.js` - Usa las constantes para filtros
- `Catalogo.jsx` - Muestra las categorías correctamente

---

## 🔧 Pasos para Aplicar Constraints en Supabase

### Paso 1: Conectarse a Supabase
1. Ir a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navegar a **SQL Editor**

### Paso 2: Normalizar Datos Existentes (SI HAY DATOS LEGACY)
**⚠️ IMPORTANTE: Ejecutar ANTES de crear el constraint**

```sql
-- Normalizar categorías legacy a las nuevas categorías
UPDATE otros SET categoria = 'ACCESORIOS'
WHERE LOWER(categoria) IN ('gadgets', 'audio', 'apple', 'otros', 'accesorios');

UPDATE otros SET categoria = 'MONITORES'
WHERE LOWER(categoria) = 'monitores';

UPDATE otros SET categoria = 'PERIFERICOS'
WHERE LOWER(categoria) IN ('teclados', 'mouse', 'perifericos');

UPDATE otros SET categoria = 'COMPONENTES'
WHERE LOWER(categoria) IN ('procesadores', 'motherboards', 'componentes');

UPDATE otros SET categoria = 'FUNDAS_TEMPLADOS'
WHERE LOWER(categoria) IN ('fundas', 'templados', 'fundas_templados', 'fundas/templados');
```

### Paso 3: Verificar Datos
Ejecutar este query para verificar que no hay categorías inválidas:

```sql
-- Este query debe devolver 0 filas
SELECT DISTINCT categoria, COUNT(*) as cantidad
FROM otros
WHERE categoria NOT IN (
    'ACCESORIOS',
    'MONITORES',
    'PERIFERICOS',
    'COMPONENTES',
    'FUNDAS_TEMPLADOS'
)
GROUP BY categoria;
```

**Si devuelve filas:**
- Hay categorías que no están contempladas
- Debes decidir a qué categoría normalizar esos registros
- Ejecutar UPDATE manual para esos casos

### Paso 4: Aplicar el Constraint
Una vez normalizados los datos:

```sql
-- Eliminar constraint anterior si existe
ALTER TABLE otros
DROP CONSTRAINT IF EXISTS check_categoria_valida;

-- Agregar el nuevo constraint con las 5 categorías
ALTER TABLE otros
ADD CONSTRAINT check_categoria_valida
CHECK (categoria IN (
    'ACCESORIOS',
    'MONITORES',
    'PERIFERICOS',
    'COMPONENTES',
    'FUNDAS_TEMPLADOS'
));
```

### Paso 5: Agregar Índice (OPCIONAL, mejora performance)
```sql
CREATE INDEX IF NOT EXISTS idx_otros_categoria ON otros(categoria);
```

---

## 📋 Verificación Final

### Test de Inserción Válida
```sql
-- Esto debe funcionar
INSERT INTO otros (nombre_producto, categoria, precio_compra_usd, precio_venta_usd)
VALUES ('Test Funda', 'FUNDAS_TEMPLADOS', 5, 10);
```

### Test de Inserción Inválida
```sql
-- Esto debe fallar con error de constraint
INSERT INTO otros (nombre_producto, categoria, precio_compra_usd, precio_venta_usd)
VALUES ('Test Invalid', 'categoria_invalida', 5, 10);
```

---

## 🎯 Resultado Final

Después de aplicar estos cambios:

✅ Solo se pueden insertar productos con las 5 categorías válidas
✅ Las validaciones están tanto en la aplicación como en la base de datos
✅ La nueva categoría "Fundas/Templados" está disponible en formularios
✅ Los filtros y búsquedas incluyen la nueva categoría
✅ Los datos existentes han sido normalizados

---

## 🔄 Rollback (Si es necesario)

Para remover el constraint:

```sql
ALTER TABLE otros
DROP CONSTRAINT IF EXISTS check_categoria_valida;
```

---

## 📞 Soporte

Si encuentras problemas:
1. Verificar que no haya datos con categorías inválidas (Paso 3)
2. Revisar los logs de Supabase para errores específicos
3. Contactar al equipo de desarrollo

---

**Fecha de creación:** 2025-01-06
**Versión:** 1.0
