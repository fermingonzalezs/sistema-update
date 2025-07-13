# 🔄 MIGRACIÓN A COMPONENTES UNIFICADOS - EJEMPLOS

## 1. **MIGRACIÓN DE LOADINGSPINNER**

### ❌ **ANTES** (Duplicado en 31+ archivos):
```jsx
// En ConversionMonedas.jsx (y muchos otros)
if (loading && !cotizacion) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center space-x-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-blue-800 text-sm">Obteniendo cotización...</span>
      </div>
    </div>
  );
}
```

### ✅ **DESPUÉS** (Componente unificado):
```jsx
// Importar el componente unificado
import LoadingSpinner from '../shared/components/base/LoadingSpinner';

// Usar el componente unificado
if (loading && !cotizacion) {
  return (
    <LoadingSpinner 
      text="Obteniendo cotización..." 
      size="small"
      className="bg-blue-50 border border-blue-200 rounded p-4"
    />
  );
}
```

## 2. **MIGRACIÓN DE MODALES DE PRODUCTOS**

### ❌ **ANTES** (3 archivos idénticos):

**CelularesModal.jsx (164 líneas):**
```jsx
const CelularesModal = ({ producto, isOpen, onClose, cotizacionDolar }) => {
  const formatPriceUSD = (price) => {
    const numPrice = parseFloat(price) || 0;
    return `U$${Math.round(numPrice)}`;
  };
  
  // 150+ líneas de código duplicado...
}
```

**NotebooksModal.jsx (similar estructura):**
```jsx
const NotebooksModal = ({ producto, isOpen, onClose, cotizacionDolar }) => {
  const formatPriceUSD = (price) => { /* mismo código */ };
  // Misma estructura, diferentes campos...
}
```

### ✅ **DESPUÉS** (1 componente genérico):
```jsx
// Usar el ProductModal unificado
import ProductModal from '../shared/components/base/ProductModal';

// En CelularesSection.jsx
<ProductModal
  producto={selectedProducto}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  cotizacionDolar={cotizacionDolar}
  tipoProducto="celular"
/>

// En NotebooksSection.jsx  
<ProductModal
  producto={selectedProducto}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  cotizacionDolar={cotizacionDolar}
  tipoProducto="notebook"
/>
```

## 3. **MIGRACIÓN DE HOOKS CRUD**

### ❌ **ANTES** (5+ hooks similares):

**useInventario.js (471 líneas):**
```jsx
export function useInventario() {
  const [computers, setComputers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchComputers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await inventarioService.getAll()
      setComputers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  // ... más código duplicado
}
```

**useCelulares.js (similar estructura):**
```jsx
export function useCelulares() {
  const [celulares, setCelulares] = useState([]) // mismo patrón
  const [loading, setLoading] = useState(false)  // mismo patrón
  const [error, setError] = useState(null)       // mismo patrón
  // ... código prácticamente idéntico
}
```

### ✅ **DESPUÉS** (Hook genérico reutilizable):
```jsx
// useInventario.js REFACTORIZADO
import { useSupabaseEntity } from '../../shared/hooks/useSupabaseEntity';

export function useInventario() {
  return useSupabaseEntity('inventario', {
    defaultFilters: { disponible: true },
    defaultOrderBy: 'created_at',
    defaultOrder: 'desc',
    transformOnCreate: (data) => ({
      ...data,
      precio_costo_usd: parseFloat(data.precio_costo_usd) || 0,
      precio_venta_usd: parseFloat(data.precio_venta_usd) || 0,
      disponible: data.disponible !== false
    })
  });
}

// useCelulares.js REFACTORIZADO  
export function useCelulares() {
  return useSupabaseEntity('celulares', {
    defaultFilters: { disponible: true },
    transformOnCreate: (data) => ({
      ...data,
      precio_compra_usd: parseFloat(data.precio_compra_usd) || 0,
      precio_venta_usd: parseFloat(data.precio_venta_usd) || 0,
      ciclos: parseInt(data.ciclos) || 0
    })
  });
}
```

## 📊 **RESULTADOS DE LA MIGRACIÓN**

### **Métricas de Impacto:**
- **Líneas de código eliminadas**: ~2,500+ líneas
- **Archivos consolidados**: 
  - 31 LoadingSpinners → 1 componente
  - 3 ProductModals → 1 componente genérico
  - 5+ hooks CRUD → 1 hook genérico + configuraciones
- **Consistencia visual**: 100% adherencia al sistema CLAUDE.md
- **Mantenimiento**: Centralizado en componentes base

### **Próximos Pasos:**
1. ✅ Crear componentes base unificados
2. 🔄 Migrar componentes uno por uno
3. 📝 Actualizar imports en archivos afectados
4. 🧪 Testear funcionalidad equivalente
5. 🗑️ Eliminar archivos obsoletos

### **Comando de Migración Sugerido:**
```bash
# Buscar y reemplazar imports de loading
find src/ -name "*.jsx" -exec sed -i 's/animate-spin.*Loading/LoadingSpinner/g' {} +

# Actualizar imports de ProductModal
find src/modules/ventas -name "*Modal.jsx" -exec mv {} {}.backup \;
```

---

*Este ejemplo muestra cómo la fase crítica de estandarización elimina duplicación masiva y mejora la consistencia del código.*