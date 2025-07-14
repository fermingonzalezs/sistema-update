import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

// Función para construir la jerarquía de cuentas
const buildHierarchy = (cuentas) => {
  const cuentasMap = {};
  const cuentasRaiz = [];

  // Primera pasada: crear mapa y encontrar raíces
  Object.values(cuentas).forEach(cuenta => {
    cuentasMap[cuenta.cuenta.id] = { ...cuenta, children: [] };
  });

  // Segunda pasada: construir la jerarquía
  Object.values(cuentasMap).forEach(cuenta => {
    const codigo = cuenta.cuenta.codigo;
    const partes = codigo.split('.');
    
    if (partes.length > 1) {
      partes.pop();
      const codigoPadre = partes.join('.');
      const padre = Object.values(cuentasMap).find(c => c.cuenta.codigo === codigoPadre);
      
      if (padre) {
        padre.children.push(cuenta);
      } else {
        cuentasRaiz.push(cuenta);
      }
    } else {
      cuentasRaiz.push(cuenta);
    }
  });

  // Función para sumarizar montos de hijos a padres
  const sumarizarMontos = (cuenta) => {
    if (cuenta.children.length === 0) {
      return cuenta.monto;
    }
    const montoHijos = cuenta.children.reduce((sum, hijo) => sum + sumarizarMontos(hijo), 0);
    cuenta.monto += montoHijos;
    return cuenta.monto;
  };

  cuentasRaiz.forEach(sumarizarMontos);

  return cuentasRaiz;
};

// Servicio para Estado de Resultados
export const estadoResultadosService = {
  async getEstadoResultados(fechaDesde, fechaHasta) {
    console.log('📡 Obteniendo estado de resultados...', { fechaDesde, fechaHasta });

    try {
      // Obtener movimientos contables del período con sus asientos
      let query = supabase
        .from('movimientos_contables')
        .select(`
          *,
          plan_cuentas (id, codigo, nombre, tipo_cuenta),
          asientos_contables (fecha)
        `);

      // Aplicar filtros de fecha si están presentes
      if (fechaDesde || fechaHasta) {
        // Primero obtener IDs de asientos que cumplen filtros de fecha
        let asientosQuery = supabase
          .from('asientos_contables')
          .select('id');

        if (fechaDesde) {
          asientosQuery = asientosQuery.gte('fecha', fechaDesde);
        }
        if (fechaHasta) {
          asientosQuery = asientosQuery.lte('fecha', fechaHasta);
        }

        const { data: asientos, error: errorAsientos } = await asientosQuery;
        
        if (errorAsientos) throw errorAsientos;

        if (asientos.length === 0) {
          return {
            ingresos: {},
            gastos: {},
            totalIngresos: 0,
            totalGastos: 0,
            utilidadBruta: 0,
            utilidadNeta: 0
          };
        }

        // Filtrar movimientos por asientos del período
        const asientoIds = asientos.map(a => a.id);
        query = query.in('asiento_id', asientoIds);
      }

      const { data: movimientos, error } = await query;

      if (error) throw error;

      // Agrupar por tipo de cuenta (Ingresos y Gastos)
      const resultado = {
        ingresos: {},
        gastos: {},
      };

      movimientos.forEach(mov => {
        const cuenta = mov.plan_cuentas;
        if (!cuenta) return;

        const debe = parseFloat(mov.debe || 0);
        const haber = parseFloat(mov.haber || 0);

        if (cuenta.tipo_cuenta === 'Ingresos') {
          const monto = haber - debe;
          if (!resultado.ingresos[cuenta.id]) {
            resultado.ingresos[cuenta.id] = { cuenta, monto: 0 };
          }
          resultado.ingresos[cuenta.id].monto += monto;
        } else if (cuenta.tipo_cuenta === 'Gastos') {
          const monto = debe - haber;
          if (!resultado.gastos[cuenta.id]) {
            resultado.gastos[cuenta.id] = { cuenta, monto: 0 };
          }
          resultado.gastos[cuenta.id].monto += monto;
        }
      });

      const ingresosJerarquizados = buildHierarchy(resultado.ingresos);
      const gastosJerarquizados = buildHierarchy(resultado.gastos);

      const totalIngresos = ingresosJerarquizados.reduce((sum, c) => sum + c.monto, 0);
      const totalGastos = gastosJerarquizados.reduce((sum, c) => sum + c.monto, 0);
      const utilidadNeta = totalIngresos - totalGastos;

      console.log('✅ Estado de resultados calculado');
      
      return {
        ingresos: ingresosJerarquizados,
        gastos: gastosJerarquizados,
        totalIngresos,
        totalGastos,
        utilidadNeta
      };

    } catch (error) {
      console.error('❌ Error obteniendo estado de resultados:', error);
      throw error;
    }
  },

  async getComparativoMensual(año) {
    console.log('📊 Obteniendo comparativo mensual para año:', año);

    try {
      const meses = [];
      
      for (let mes = 1; mes <= 12; mes++) {
        const fechaDesde = `${año}-${mes.toString().padStart(2, '0')}-01`;
        const ultimoDia = new Date(año, mes, 0).getDate();
        const fechaHasta = `${año}-${mes.toString().padStart(2, '0')}-${ultimoDia}`;
        
        const estadoMensual = await this.getEstadoResultados(fechaDesde, fechaHasta);
        
        meses.push({
          mes,
          nombreMes: new Date(año, mes - 1).toLocaleDateString('es-ES', { month: 'long' }),
          ...estadoMensual
        });
      }

      return meses;

    } catch (error) {
      console.error('❌ Error obteniendo comparativo mensual:', error);
      throw error;
    }
  }
};

// Hook personalizado
export function useEstadoResultados() {
  const [estadoResultados, setEstadoResultados] = useState({
    ingresos: [],
    gastos: [],
    totalIngresos: 0,
    totalGastos: 0,
    utilidadBruta: 0,
    utilidadNeta: 0
  });
  const [comparativoMensual, setComparativoMensual] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEstadoResultados = async (fechaDesde, fechaHasta) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await estadoResultadosService.getEstadoResultados(fechaDesde, fechaHasta);
      setEstadoResultados(data);
    } catch (err) {
      console.error('Error en useEstadoResultados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparativoMensual = async (año) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await estadoResultadosService.getComparativoMensual(año);
      setComparativoMensual(data);
    } catch (err) {
      console.error('Error en fetchComparativoMensual:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    estadoResultados,
    comparativoMensual,
    loading,
    error,
    fetchEstadoResultados,
    fetchComparativoMensual
  };
}