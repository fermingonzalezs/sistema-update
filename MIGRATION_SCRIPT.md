# 🚀 SCRIPT DE MIGRACIÓN - LOADINGSPINNER UNIFICADO

## ✅ **COMPONENTE CREADO**
- `src/shared/components/base/LoadingSpinner.jsx` ✅ LISTO

## 📋 **ARCHIVOS IDENTIFICADOS PARA MIGRACIÓN (34 total)**

### **PATRÓN A MIGRAR:**
```jsx
// ❌ CÓDIGO DUPLICADO (presente en 31+ archivos):
<div className="flex items-center justify-center h-64">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
  <span className="ml-3 text-slate-600">Cargando...</span>
</div>

// ✅ REEMPLAZAR POR:
<LoadingSpinner text="Cargando..." size="medium" />
```

## 📂 **ARCHIVOS POR MIGRAR (orden de prioridad)**

### **ALTA PRIORIDAD - Patrón exacto:**

1. **`src/modules/administracion/components/RecuentoStockSection.jsx`**
   - Línea: 312
   - Patrón: `border-emerald-600` + `Cargando inventario...`
   - Import añadir: `import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';`

2. **`src/modules/administracion/components/GarantiasSection_NUEVO.jsx`** 
   - Línea: 312
   - Patrón: `border-emerald-600` + `Cargando garantías...`
   - Import añadir: `import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';`

3. **`src/modules/contabilidad/components/ConciliacionCajaSection.jsx`**
   - Líneas: 281, 354 (2 instancias)
   - Patrones: `border-emerald-500` + `Cargando cuentas de caja...` / `Cargando datos de la cuenta...`
   - Import añadir: `import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';`

4. **`src/modules/contabilidad/components/LibroDiarioSection.jsx`**
   - Línea: 555
   - Patrón: `border-green-600` + `Cargando libro diario...`
   - Import añadir: `import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';`

5. **`src/modules/contabilidad/components/LibroMayorSection.jsx`**
   - Línea: 312 
   - Patrón: `border-emerald-500` + `Cargando libro mayor...`
   - Import añadir: `import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';`

### **MEDIA PRIORIDAD - Variaciones del patrón:**

6. **`src/modules/contabilidad/components/PlanCuentasSection.jsx`**
7. **`src/modules/contabilidad/components/EstadoResultadosSection.jsx`**
8. **`src/modules/contabilidad/components/EstadoSituacionPatrimonialSection.jsx`**
9. **`src/modules/contabilidad/components/CuentasCorrientesSection.jsx`**
10. **`src/modules/soporte/components/ReparacionesMain.jsx`**
11. **`src/modules/soporte/components/RepuestosSection.jsx`**
12. **`src/modules/soporte/components/MovimientosRepuestosSection.jsx`**
13. **`src/modules/soporte/components/RecuentoRepuestosSection.jsx`**
14. **`src/modules/soporte/components/CargaEquiposUnificada.jsx`**
15. **`src/modules/importaciones/components/CotizacionesSection.jsx`**
16. **`src/modules/importaciones/components/EnTransitoSection.jsx`**
17. **`src/modules/importaciones/components/HistorialImportacionesSection.jsx`**
18. **`src/modules/importaciones/components/PendientesCompraSection.jsx`**
19. **`src/modules/ventas/components/Catalogo.jsx`**
20. **`src/modules/ventas/components/Listas.jsx`**
21. **`src/modules/ventas/components/GestionFotos.jsx`**
22. **`src/modules/ventas/components/Clientes.jsx`**
23. **`src/modules/ventas/components/ClienteSelector.jsx`**

### **BAJA PRIORIDAD - Casos especiales:**

24. **`src/components/ConversionMonedas.jsx`** (loading con RefreshCw específico)
25. **`src/components/ui/EquipoAutocomplete.jsx`** (loading en dropdown)
26. **`src/components/ui/RepuestoAutocomplete.jsx`** (loading en dropdown)
27. **`src/components/SelectorCuentaConCotizacion.jsx`** (loading en select)
28. **`src/modules/soporte/components/ModalPresupuesto.jsx`** (loading en modal)
29. **`src/modules/soporte/components/ModalAplicarRepuestos.jsx`** (loading en modal)
30. **`src/modules/administracion/components/DashboardReportesSection.jsx`**
31. **`src/App.jsx`** (loading de aplicación)

## 🛠️ **PASOS DE MIGRACIÓN**

### **Por cada archivo:**

1. **Añadir import:**
   ```jsx
   import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';
   ```

2. **Reemplazar código:**
   ```jsx
   // ANTES:
   if (loading) {
     return (
       <div className="flex items-center justify-center h-64">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
         <span className="ml-3 text-slate-600">Cargando datos...</span>
       </div>
     );
   }

   // DESPUÉS:
   if (loading) {
     return <LoadingSpinner text="Cargando datos..." size="medium" />;
   }
   ```

## 📊 **IMPACTO ESPERADO**

- **-186 líneas** de código duplicado eliminadas (6 líneas × 31 archivos)
- **+31 imports** al componente unificado
- **+100% consistencia** visual en loading states
- **Mantenimiento centralizado** de todos los spinners

## ✅ **VERIFICACIÓN POST-MIGRACIÓN**

Después de migrar, verificar:
1. **Funcionalidad**: Los spinners aparecen correctamente
2. **Estilo**: Colores y tamaños son consistentes con CLAUDE.md
3. **Performance**: No hay degradación de velocidad
4. **Imports**: Todos los paths son correctos

## 🔄 **COMANDO DE ROLLBACK (si es necesario)**

Si algo falla, se puede revertir usando git:
```bash
git checkout HEAD -- src/modules/administracion/components/RecuentoStockSection.jsx
# etc. para cada archivo migrado
```

---

**Estado actual**: ✅ Componente base creado, listo para migración masiva.