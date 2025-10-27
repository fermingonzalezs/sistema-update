import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { calcularSaldoCuenta } from '../utils/saldosUtils';

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

      // Agrupar movimientos por cuenta y acumular debe/haber
      const cuentasAgrupadas = {};

      movimientos.forEach(mov => {
        const cuenta = mov.plan_cuentas;
        if (!cuenta || !cuenta.tipo) return;

        if (!cuentasAgrupadas[cuenta.id]) {
          cuentasAgrupadas[cuenta.id] = {
            cuenta,
            debe: 0,
            haber: 0
          };
        }

        cuentasAgrupadas[cuenta.id].debe += parseFloat(mov.debe || 0);
        cuentasAgrupadas[cuenta.id].haber += parseFloat(mov.haber || 0);
      });

      // Calcular montos usando función utilitaria centralizada
      Object.values(cuentasAgrupadas).forEach(item => {
        const { cuenta, debe, haber } = item;

        // Usar función utilitaria para calcular monto según tipo de cuenta
        const monto = calcularSaldoCuenta(debe, haber, cuenta.tipo);

        // Clasificar por tipo de cuenta
        if (cuenta.tipo === 'resultado positivo') { // INGRESOS
          if (!resultado.ingresos[cuenta.id]) {
            resultado.ingresos[cuenta.id] = { cuenta, monto: 0 };
          }
          resultado.ingresos[cuenta.id].monto = monto;
        } else if (cuenta.tipo === 'resultado negativo') { // COSTOS Y GASTOS
          // Determinar si es costo o gasto por código
          if (cuenta.codigo.startsWith('5')) {
            if (!resultado.costos[cuenta.id]) {
              resultado.costos[cuenta.id] = { cuenta, monto: 0 };
            }
            resultado.costos[cuenta.id].monto = monto;
          } else if (cuenta.codigo.startsWith('6')) {
            if (!resultado.gastos[cuenta.id]) {
              resultado.gastos[cuenta.id] = { cuenta, monto: 0 };
            }
            resultado.gastos[cuenta.id].monto = monto;
          }
        }
      });

      // Ordenar y calcular totales
      const ingresosOrdenados = ordenarCuentasPorCodigo(resultado.ingresos);
      const costosOrdenados = ordenarCuentasPorCodigo(resultado.costos);
      const gastosOrdenados = ordenarCuentasPorCodigo(resultado.gastos);

      // Para ingresos: sumar normalmente (pueden ser negativos si hay devoluciones)
      const totalIngresos = ingresosOrdenados.reduce((sum, item) => sum + item.monto, 0);

      // Para costos y gastos: sumamos el VALOR ABSOLUTO
      // En un Estado de Resultados, costos y gastos siempre se presentan como positivos
      // y se restan de los ingresos
      const totalCostos = costosOrdenados.reduce((sum, item) => sum + Math.abs(item.monto), 0);
      const totalGastos = gastosOrdenados.reduce((sum, item) => sum + Math.abs(item.monto), 0);

      // Utilidad = Ingresos - Costos - Gastos
      const utilidadNeta = totalIngresos - totalCostos - totalGastos;

      // Debug: Verificar montos negativos ANTES de calcular totales
      const costosNegativos = costosOrdenados.filter(c => c.monto < 0);
      const gastosNegativos = gastosOrdenados.filter(g => g.monto < 0);

      console.log('✅ Estado de resultados calculado:');
      console.log('  📊 Totales:', {
        totalIngresos,
        totalCostos,
        totalGastos,
        utilidadNeta
      });
      console.log('  📝 Detalle completo:', {
        ingresos: ingresosOrdenados.map(i => ({ codigo: i.cuenta.codigo, nombre: i.cuenta.nombre, monto: i.monto })),
        costos: costosOrdenados.map(c => ({ codigo: c.cuenta.codigo, nombre: c.cuenta.nombre, monto: c.monto })),
        gastos: gastosOrdenados.map(g => ({ codigo: g.cuenta.codigo, nombre: g.cuenta.nombre, monto: g.monto }))
      });

      if (costosNegativos.length > 0 || gastosNegativos.length > 0) {
        console.warn('⚠️ MONTOS NEGATIVOS ENCONTRADOS (ajustes/devoluciones):');
        if (costosNegativos.length > 0) {
          console.warn('  Costos negativos:', costosNegativos.map(c => ({
            codigo: c.cuenta.codigo,
            nombre: c.cuenta.nombre,
            monto: c.monto
          })));
        }
        if (gastosNegativos.length > 0) {
          console.warn('  Gastos negativos:', gastosNegativos.map(g => ({
            codigo: g.cuenta.codigo,
            nombre: g.cuenta.nombre,
            monto: g.monto
          })));
        }
      }

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