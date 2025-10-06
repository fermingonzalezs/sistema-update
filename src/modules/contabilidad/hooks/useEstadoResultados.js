import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

// Función para ordenar cuentas por código (reemplaza jerarquía)
const ordenarCuentasPorCodigo = (cuentasObj) => {
  return Object.values(cuentasObj)
    .sort((a, b) => {
      const codigoA = a.cuenta.codigo || '';
      const codigoB = b.cuenta.codigo || '';
      return codigoA.localeCompare(codigoB);
    });
};

// Servicio para Estado de Resultados
export const estadoResultadosService = {
  async getEstadoResultados(fechaDesde, fechaHasta) {
    console.log('📡 Obteniendo estado de resultados...', { fechaDesde, fechaHasta });

    try {
      // Primero obtener asientos del período (query de dos pasos)
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

      if (!asientos || asientos.length === 0) {
        console.log('ℹ️ No hay asientos en el período');
        return {
          ingresos: [],
          gastos: [],
          totalIngresos: 0,
          totalGastos: 0,
          utilidadNeta: 0,
          fechaDesde,
          fechaHasta
        };
      }

      const asientoIds = asientos.map(a => a.id);

      // Obtener movimientos de esos asientos
      const { data: movimientos, error } = await supabase
        .from('movimientos_contables')
        .select(`
          *,
          plan_cuentas (id, codigo, nombre, tipo, nivel, padre_id, activa, imputable, categoria),
          asientos_contables (fecha)
        `)
        .in('asiento_id', asientoIds);

      if (error) throw error;

      // Agrupar por tipo de cuenta
      const resultado = {
        ingresos: {},
        costos: {},
        gastos: {}
      };

      movimientos.forEach(mov => {
        const cuenta = mov.plan_cuentas;
        if (!cuenta || !cuenta.codigo) return;

        const debe = parseFloat(mov.debe || 0);
        const haber = parseFloat(mov.haber || 0);
        let monto = 0;

        if (cuenta.codigo.startsWith('4')) { // INGRESOS
          monto = haber - debe;
          if (!resultado.ingresos[cuenta.id]) {
            resultado.ingresos[cuenta.id] = { cuenta, monto: 0 };
          }
          resultado.ingresos[cuenta.id].monto += monto;
        } else if (cuenta.codigo.startsWith('5')) { // COSTOS
          monto = debe - haber;
          if (!resultado.costos[cuenta.id]) {
            resultado.costos[cuenta.id] = { cuenta, monto: 0 };
          }
          resultado.costos[cuenta.id].monto += monto;
        } else if (cuenta.codigo.startsWith('6')) { // GASTOS
          monto = debe - haber;
          if (!resultado.gastos[cuenta.id]) {
            resultado.gastos[cuenta.id] = { cuenta, monto: 0 };
          }
          resultado.gastos[cuenta.id].monto += monto;
        }
      });

      // Ordenar y calcular totales
      const ingresosOrdenados = ordenarCuentasPorCodigo(resultado.ingresos);
      const costosOrdenados = ordenarCuentasPorCodigo(resultado.costos);
      const gastosOrdenados = ordenarCuentasPorCodigo(resultado.gastos);

      // Los totales deben sumarse en valor absoluto
      const totalIngresos = ingresosOrdenados.reduce((sum, item) => sum + Math.abs(item.monto), 0);
      const totalCostos = costosOrdenados.reduce((sum, item) => sum + Math.abs(item.monto), 0);
      const totalGastos = gastosOrdenados.reduce((sum, item) => sum + Math.abs(item.monto), 0);
      const utilidadNeta = totalIngresos - totalCostos - totalGastos;

      console.log('✅ Estado de resultados calculado:', {
        totalIngresos, totalCostos, totalGastos, utilidadNeta
      });

      return {
        ingresos: ingresosOrdenados,
        costos: costosOrdenados,
        gastos: gastosOrdenados,
        totalIngresos,
        totalCostos,
        totalGastos,
        utilidadNeta,
        fechaDesde,
        fechaHasta
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
    costos: [],
    gastos: [],
    totalIngresos: 0,
    totalCostos: 0,
    totalGastos: 0,
    utilidadNeta: 0,
    fechaDesde: null,
    fechaHasta: null
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