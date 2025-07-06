import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

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
        totalIngresos: 0,
        totalGastos: 0,
        utilidadBruta: 0,
        utilidadNeta: 0
      };

      movimientos.forEach(mov => {
        const cuenta = mov.plan_cuentas;
        if (!cuenta) return;

        // Para ingresos: haber aumenta, debe disminuye
        // Para gastos: debe aumenta, haber disminuye
        const debe = parseFloat(mov.debe || 0);
        const haber = parseFloat(mov.haber || 0);

        if (cuenta.tipo_cuenta === 'Ingresos') {
          const monto = haber - debe; // Ingresos netos
          
          if (!resultado.ingresos[cuenta.id]) {
            resultado.ingresos[cuenta.id] = {
              cuenta: cuenta,
              monto: 0
            };
          }
          resultado.ingresos[cuenta.id].monto += monto;
          resultado.totalIngresos += monto;
          
        } else if (cuenta.tipo_cuenta === 'Gastos') {
          const monto = debe - haber; // Gastos netos
          
          if (!resultado.gastos[cuenta.id]) {
            resultado.gastos[cuenta.id] = {
              cuenta: cuenta,
              monto: 0
            };
          }
          resultado.gastos[cuenta.id].monto += monto;
          resultado.totalGastos += monto;
        }
      });

      resultado.utilidadBruta = resultado.totalIngresos - resultado.totalGastos;
      resultado.utilidadNeta = resultado.utilidadBruta;

      console.log('✅ Estado de resultados calculado', {
        ingresos: resultado.totalIngresos,
        gastos: resultado.totalGastos,
        utilidad: resultado.utilidadNeta
      });
      
      return resultado;

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
    ingresos: {},
    gastos: {},
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