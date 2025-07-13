// ✅ EJEMPLO DE MIGRACIÓN - RecuentoStockSection.jsx
// ANTES vs DESPUÉS del LoadingSpinner unificado

// ❌ ANTES (líneas 1-3 del archivo original):
import React, { useState, useEffect } from 'react';
import { Package, Search, Save, AlertTriangle, CheckCircle, RefreshCw, Eye, FileText, Monitor, Smartphone, Box, Calculator } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// ✅ DESPUÉS (líneas 1-4 migradas):
import React, { useState, useEffect } from 'react';
import { Package, Search, Save, AlertTriangle, CheckCircle, RefreshCw, Eye, FileText, Monitor, Smartphone, Box, Calculator } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner'; // ← NUEVO IMPORT

// ❌ ANTES (líneas 310-316 del archivo original):
/*
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-slate-600">Cargando inventario...</span>
      </div>
    );
  }
*/

// ✅ DESPUÉS (líneas 310-316 migradas):
if (loading) {
  return (
    <LoadingSpinner 
      text="Cargando inventario..." 
      size="medium"
    />
  );
}

// 📊 RESULTADOS DE LA MIGRACIÓN:
// - ✅ Eliminadas 6 líneas de código duplicado  
// - ✅ Componente centralizado con sistema de diseño CLAUDE.md
// - ✅ Props configurables para reutilización
// - ✅ Mantenimiento centralizado

// 🔄 PRÓXIMOS ARCHIVOS A MIGRAR (mismo patrón):
// 1. src/modules/administracion/components/GarantiasSection_NUEVO.jsx (línea 312)
// 2. src/modules/contabilidad/components/ConciliacionCajaSection.jsx (líneas 312, 438)  
// 3. src/modules/contabilidad/components/LibroDiarioSection.jsx (línea 312)
// 4. src/modules/contabilidad/components/LibroMayorSection.jsx (línea 312)
// ... y 25+ archivos más

export default function MigrationExample() {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        📋 Ejemplo de Migración Completada
      </h2>
      <p className="text-slate-600">
        Este archivo muestra cómo se ve la migración del LoadingSpinner.
        El patrón se repite en 31+ archivos de la aplicación.
      </p>
    </div>
  );
}