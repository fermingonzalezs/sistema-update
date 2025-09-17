import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

// Servicio para Balance de Sumas y Saldos
export const balanceSumasYSaldosService = {
  async getBalanceSumasYSaldos(fechaDesde = null, fechaHasta = null) {
    console.log('📡 Obteniendo Balance de Sumas y Saldos...', { fechaDesde, fechaHasta });

    try {
      // Si no se especifican fechas, usar el mes actual
      if (!fechaDesde || !fechaHasta) {
        const hoy = new Date();
        fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
      }

      // Primero obtener los IDs de asientos que coinciden con el período
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
        // No hay asientos en el período
        return {
          balance: [],
          resumen: {
            totalDebe: 0,
            totalHaber: 0,
            totalDebeInicial: 0,
            totalHaberInicial: 0,
            totalSaldosDeudores: 0,
            totalSaldosAcreedores: 0,
            fechaDesde,
            fechaHasta,
            cantidadCuentas: 0,
            cantidadMovimientos: 0,
            cuadreContable: {
              debeHaberCuadra: true,
              saldosCuadra: true,
              diferenciaDH: 0,
              diferenciaSaldos: 0
            }
          }
        };
      }

      const asientoIds = asientos.map(a => a.id);

      // Ahora obtener los movimientos de esos asientos
      const { data: movimientos, error } = await supabase
        .from('movimientos_contables')
        .select(`
          *,
          plan_cuentas (id, codigo, nombre, tipo, nivel, padre_id, activa, imputable, categoria),
          asientos_contables (fecha, descripcion)
        `)
        .in('asiento_id', asientoIds);

      if (error) throw error;

      // Obtener saldos iniciales (movimientos anteriores al período)
      let saldosIniciales = {};
      if (fechaDesde) {
        // Primero obtener asientos anteriores al período
        const { data: asientosAnteriores, error: errorAsientosAnteriores } = await supabase
          .from('asientos_contables')
          .select('id')
          .lt('fecha', fechaDesde);

        if (!errorAsientosAnteriores && asientosAnteriores && asientosAnteriores.length > 0) {
          const asientoIdsAnteriores = asientosAnteriores.map(a => a.id);

          const { data: movimientosAnteriores, error: errorAnteriores } = await supabase
            .from('movimientos_contables')
            .select(`
              *,
              plan_cuentas (id, codigo, nombre, tipo),
              asientos_contables (fecha, descripcion)
            `)
            .in('asiento_id', asientoIdsAnteriores);

          if (!errorAnteriores && movimientosAnteriores) {
          movimientosAnteriores.forEach(mov => {
            const cuenta = mov.plan_cuentas;
            if (!cuenta) return;

            if (!saldosIniciales[cuenta.id]) {
              saldosIniciales[cuenta.id] = {
                debe: 0,
                haber: 0,
                saldo: 0
              };
            }

            saldosIniciales[cuenta.id].debe += parseFloat(mov.debe || 0);
            saldosIniciales[cuenta.id].haber += parseFloat(mov.haber || 0);
          });

          // Calcular saldos iniciales según naturaleza de la cuenta
          Object.keys(saldosIniciales).forEach(cuentaId => {
            const movimiento = movimientosAnteriores.find(m => m.plan_cuentas?.id === parseInt(cuentaId));
            if (movimiento && movimiento.plan_cuentas) {
              const cuenta = movimiento.plan_cuentas;
              const saldoInicial = saldosIniciales[cuentaId];
              
              if (cuenta.tipo === 'activo' || cuenta.tipo === 'resultado negativo') {
                saldoInicial.saldo = saldoInicial.debe - saldoInicial.haber;
              } else {
                saldoInicial.saldo = saldoInicial.haber - saldoInicial.debe;
              }
            }
          });
          }
        }
      }

      // Agrupar movimientos por cuenta y calcular sumas
      const balance = {};
      const resumenGeneral = {
        totalDebe: 0,
        totalHaber: 0,
        totalDebeInicial: 0,
        totalHaberInicial: 0,
        totalSaldosDeudores: 0,
        totalSaldosAcreedores: 0,
        fechaDesde,
        fechaHasta,
        cantidadCuentas: 0,
        cantidadMovimientos: movimientos.length
      };

      // Primero, crear estructura para todas las cuentas que aparecen en movimientos
      movimientos.forEach(mov => {
        const cuenta = mov.plan_cuentas;
        if (!cuenta) return;

        if (!balance[cuenta.id]) {
          const saldoInicial = saldosIniciales[cuenta.id] || { debe: 0, haber: 0, saldo: 0 };
          
          balance[cuenta.id] = {
            cuenta: cuenta,
            saldoInicial: saldoInicial.saldo,
            debeInicial: saldoInicial.debe,
            haberInicial: saldoInicial.haber,
            debeMovimientos: 0,
            haberMovimientos: 0,
            debeFinal: saldoInicial.debe,
            haberFinal: saldoInicial.haber,
            saldoFinal: 0,
            cantidadMovimientos: 0,
            esDeudor: false,
            esAcreedor: false
          };
        }
      });

      // Procesar movimientos del período
      movimientos.forEach(mov => {
        const cuenta = mov.plan_cuentas;
        if (!cuenta) return;

        const debe = parseFloat(mov.debe || 0);
        const haber = parseFloat(mov.haber || 0);

        balance[cuenta.id].debeMovimientos += debe;
        balance[cuenta.id].haberMovimientos += haber;
        balance[cuenta.id].debeFinal += debe;
        balance[cuenta.id].haberFinal += haber;
        balance[cuenta.id].cantidadMovimientos++;

        resumenGeneral.totalDebe += debe;
        resumenGeneral.totalHaber += haber;
      });

      // Calcular saldos finales y clasificar cuentas
      Object.values(balance).forEach(item => {
        const cuenta = item.cuenta;
        
        // Calcular saldo final según naturaleza de la cuenta
        if (cuenta.tipo === 'activo' || cuenta.tipo === 'resultado negativo') {
          item.saldoFinal = item.debeFinal - item.haberFinal;
        } else {
          item.saldoFinal = item.haberFinal - item.debeFinal;
        }

        // Clasificar como deudor o acreedor basado en el saldo final
        if (item.saldoFinal > 0) {
          if (cuenta.tipo === 'activo' || cuenta.tipo === 'resultado negativo') {
            item.esDeudor = true;
            resumenGeneral.totalSaldosDeudores += Math.abs(item.saldoFinal);
          } else {
            item.esAcreedor = true;
            resumenGeneral.totalSaldosAcreedores += Math.abs(item.saldoFinal);
          }
        } else if (item.saldoFinal < 0) {
          if (cuenta.tipo === 'activo' || cuenta.tipo === 'resultado negativo') {
            item.esAcreedor = true;
            resumenGeneral.totalSaldosAcreedores += Math.abs(item.saldoFinal);
          } else {
            item.esDeudor = true;
            resumenGeneral.totalSaldosDeudores += Math.abs(item.saldoFinal);
          }
        }

        resumenGeneral.totalDebeInicial += item.debeInicial;
        resumenGeneral.totalHaberInicial += item.haberInicial;
      });

      // Convertir a array y ordenar por código de cuenta
      const balanceArray = Object.values(balance)
        .filter(item => 
          item.debeInicial > 0 || 
          item.haberInicial > 0 || 
          item.debeMovimientos > 0 || 
          item.haberMovimientos > 0 ||
          Math.abs(item.saldoFinal) > 0.01
        )
        .sort((a, b) => {
          const codigoA = a.cuenta.codigo || '';
          const codigoB = b.cuenta.codigo || '';
          return codigoA.localeCompare(codigoB);
        });

      resumenGeneral.cantidadCuentas = balanceArray.length;

      // Verificar cuadre contable
      const diferenciaDH = Math.abs(resumenGeneral.totalDebe - resumenGeneral.totalHaber);
      const diferenciaSaldos = Math.abs(resumenGeneral.totalSaldosDeudores - resumenGeneral.totalSaldosAcreedores);
      
      resumenGeneral.cuadreContable = {
        debeHaberCuadra: diferenciaDH < 0.01,
        saldosCuadra: diferenciaSaldos < 0.01,
        diferenciaDH: diferenciaDH,
        diferenciaSaldos: diferenciaSaldos
      };

      console.log('✅ Balance de Sumas y Saldos calculado:', {
        cuentas: balanceArray.length,
        totalDebe: resumenGeneral.totalDebe,
        totalHaber: resumenGeneral.totalHaber,
        cuadre: resumenGeneral.cuadreContable
      });

      return {
        balance: balanceArray,
        resumen: resumenGeneral
      };

    } catch (error) {
      console.error('❌ Error obteniendo Balance de Sumas y Saldos:', error);
      throw error;
    }
  },

  // Método para obtener estadísticas adicionales
  async getEstadisticasBalance(fechaDesde, fechaHasta) {
    try {
      const { balance, resumen } = await this.getBalanceSumasYSaldos(fechaDesde, fechaHasta);
      
      // Agrupar por tipo de cuenta
      const estadisticas = {
        porTipo: {},
        porCategoria: {},
        cuentasMasActivas: [],
        mayoresMovimientos: []
      };

      balance.forEach(item => {
        const tipo = item.cuenta.tipo || 'Sin tipo';
        const categoria = item.cuenta.categoria || 'Sin categoría';

        // Estadísticas por tipo
        if (!estadisticas.porTipo[tipo]) {
          estadisticas.porTipo[tipo] = {
            tipo,
            cantidadCuentas: 0,
            totalDebe: 0,
            totalHaber: 0,
            totalSaldo: 0
          };
        }
        estadisticas.porTipo[tipo].cantidadCuentas++;
        estadisticas.porTipo[tipo].totalDebe += item.debeFinal;
        estadisticas.porTipo[tipo].totalHaber += item.haberFinal;
        estadisticas.porTipo[tipo].totalSaldo += Math.abs(item.saldoFinal);

        // Estadísticas por categoría
        if (!estadisticas.porCategoria[categoria]) {
          estadisticas.porCategoria[categoria] = {
            categoria,
            cantidadCuentas: 0,
            totalMovimientos: 0
          };
        }
        estadisticas.porCategoria[categoria].cantidadCuentas++;
        estadisticas.porCategoria[categoria].totalMovimientos += item.cantidadMovimientos;
      });

      // Cuentas más activas (más movimientos)
      estadisticas.cuentasMasActivas = balance
        .filter(item => item.cantidadMovimientos > 0)
        .sort((a, b) => b.cantidadMovimientos - a.cantidadMovimientos)
        .slice(0, 10)
        .map(item => ({
          cuenta: item.cuenta.nombre,
          codigo: item.cuenta.codigo,
          movimientos: item.cantidadMovimientos,
          totalDebe: item.debeMovimientos,
          totalHaber: item.haberMovimientos
        }));

      // Mayores movimientos por monto
      estadisticas.mayoresMovimientos = balance
        .filter(item => (item.debeMovimientos + item.haberMovimientos) > 0)
        .sort((a, b) => (b.debeMovimientos + b.haberMovimientos) - (a.debeMovimientos + a.haberMovimientos))
        .slice(0, 10)
        .map(item => ({
          cuenta: item.cuenta.nombre,
          codigo: item.cuenta.codigo,
          totalMovimientos: item.debeMovimientos + item.haberMovimientos,
          debe: item.debeMovimientos,
          haber: item.haberMovimientos
        }));

      return {
        balance,
        resumen,
        estadisticas
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas del balance:', error);
      throw error;
    }
  }
};

// Hook personalizado para Balance de Sumas y Saldos
export function useBalanceSumasYSaldos() {
  const [balance, setBalance] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = async (fechaDesde = null, fechaHasta = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await balanceSumasYSaldosService.getBalanceSumasYSaldos(fechaDesde, fechaHasta);
      setBalance(data.balance);
      setResumen(data.resumen);
    } catch (err) {
      console.error('Error en useBalanceSumasYSaldos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async (fechaDesde = null, fechaHasta = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await balanceSumasYSaldosService.getEstadisticasBalance(fechaDesde, fechaHasta);
      setBalance(data.balance);
      setResumen(data.resumen);
      setEstadisticas(data.estadisticas);
    } catch (err) {
      console.error('Error obteniendo estadísticas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    balance,
    resumen,
    estadisticas,
    loading,
    error,
    fetchBalance,
    fetchEstadisticas
  };
}