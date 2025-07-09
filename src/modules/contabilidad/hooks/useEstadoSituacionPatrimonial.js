import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

// Servicio para Estado de Situación Patrimonial (Balance General)
export const estadoSituacionPatrimonialService = {
  async getBalanceGeneral(fechaCorte = null) {
    console.log('📡 Obteniendo Balance General...', { fechaCorte });

    try {
      const fecha = fechaCorte || new Date().toISOString().split('T')[0];

      // Obtener movimientos contables hasta la fecha de corte
      let query = supabase
        .from('movimientos_contables')
        .select(`
          *,
          plan_cuentas (id, codigo, nombre, tipo, nivel, padre_id, activa, imputable, categoria),
          asientos_contables (fecha)
        `);

      query = query.lte('asientos_contables.fecha', fecha);

      const { data: movimientos, error } = await query;

      if (error) throw error;

      // Agrupar por cuenta y calcular saldos
      const saldosPorCuenta = {};

      movimientos.forEach(mov => {
        const cuenta = mov.plan_cuentas;
        if (!cuenta) return;

        if (!saldosPorCuenta[cuenta.id]) {
          saldosPorCuenta[cuenta.id] = {
            cuenta: cuenta,
            debe: 0,
            haber: 0,
            saldo: 0,
            categoria: cuenta.categoria || 'Sin Categorizar'
          };
        }

        saldosPorCuenta[cuenta.id].debe += parseFloat(mov.debe || 0);
        saldosPorCuenta[cuenta.id].haber += parseFloat(mov.haber || 0);
      });

      // Calcular saldos finales y clasificar por tipo
      const balance = {
        activos: [],
        pasivos: [],
        patrimonio: [],
        totalActivos: 0,
        totalPasivos: 0,
        totalPatrimonio: 0,
        fechaCorte: fecha
      };

      Object.values(saldosPorCuenta).forEach(item => {
        const { cuenta } = item;
        
        // Calcular saldo según naturaleza de la cuenta
        let saldo = 0;
        if (cuenta.tipo === 'activo') {
          saldo = item.debe - item.haber; // Naturaleza deudora
        } else if (cuenta.tipo === 'pasivo' || cuenta.tipo === 'patrimonio') {
          saldo = item.haber - item.debe; // Naturaleza acreedora
        }

        item.saldo = saldo;

        // Solo incluir cuentas con saldo diferente de cero
        if (Math.abs(saldo) > 0.01) {
          if (cuenta.tipo === 'activo') {
            balance.activos.push(item);
            balance.totalActivos += Math.abs(saldo);
          } else if (cuenta.tipo === 'pasivo') {
            balance.pasivos.push(item);
            balance.totalPasivos += Math.abs(saldo);
          } else if (cuenta.tipo === 'patrimonio') {
            balance.patrimonio.push(item);
            balance.totalPatrimonio += Math.abs(saldo);
          }
        }
      });

      console.log('✅ Balance General calculado', {
        activos: balance.totalActivos,
        pasivos: balance.totalPasivos,
        patrimonio: balance.totalPatrimonio
      });

      return balance;

    } catch (error) {
      console.error('❌ Error obteniendo Balance General:', error);
      throw error;
    }
  },

  // Método para obtener análisis financiero básico
  async getAnalisisFinanciero(fechaCorte = null) {
    try {
      const balance = await this.getBalanceGeneral(fechaCorte);
      
      // Calcular ratios financieros básicos
      const activosCorrientes = balance.activos
        .filter(item => this.esActivoCorriente(item.cuenta))
        .reduce((sum, item) => sum + Math.abs(item.saldo), 0);
        
      const pasivosCorrientes = balance.pasivos
        .filter(item => this.esPasivoCorriente(item.cuenta))
        .reduce((sum, item) => sum + Math.abs(item.saldo), 0);

      const ratios = {
        liquidezCorriente: pasivosCorrientes > 0 
          ? activosCorrientes / pasivosCorrientes 
          : 0,
        endeudamiento: balance.totalActivos > 0 
          ? balance.totalPasivos / balance.totalActivos 
          : 0,
        solvencia: balance.totalPasivos > 0 
          ? balance.totalActivos / balance.totalPasivos 
          : 0,
        autonomiaFinanciera: balance.totalActivos > 0 
          ? balance.totalPatrimonio / balance.totalActivos 
          : 0
      };

      return {
        balance,
        ratios,
        analisis: {
          situacionLiquidez: ratios.liquidezCorriente >= 1.5 ? 'Buena' : 
                            ratios.liquidezCorriente >= 1.0 ? 'Regular' : 'Crítica',
          situacionEndeudamiento: ratios.endeudamiento <= 0.5 ? 'Conservador' :
                                 ratios.endeudamiento <= 0.7 ? 'Moderado' : 'Alto',
          situacionSolvencia: ratios.solvencia >= 2.0 ? 'Excelente' :
                             ratios.solvencia >= 1.5 ? 'Buena' : 'Regular'
        }
      };

    } catch (error) {
      console.error('❌ Error en análisis financiero:', error);
      throw error;
    }
  },

  esActivoCorriente(cuenta) {
    // Definir qué cuentas son corrientes basado en el código o nombre
    const cuentasCorrientes = [
      'caja', 'banco', 'efectivo', 'mercaderia', 'inventario', 'cliente', 'credito',
      'deudor', 'iva', 'anticipo', 'mp ', 'uala', 'cripto'
    ];
    
    const nombre = cuenta.nombre.toLowerCase();
    const codigo = cuenta.codigo || '';
    
    return cuentasCorrientes.some(term => 
      nombre.includes(term) || codigo.startsWith('1.1')
    );
  },

  esPasivoCorriente(cuenta) {
    // Definir qué cuentas son corrientes
    const cuentasCorrientes = [
      'proveedor', 'acreedor', 'sueldo', 'salario', 'impuesto', 'iva',
      'monotributo', 'ganancias', 'anticipo', 'corto plazo'
    ];
    
    const nombre = cuenta.nombre.toLowerCase();
    const codigo = cuenta.codigo || '';
    
    return cuentasCorrientes.some(term => 
      nombre.includes(term) || codigo.startsWith('2.1')
    );
  }
};

// Hook personalizado para Balance General
export function useEstadoSituacionPatrimonial() {
  const [balance, setBalance] = useState({
    activos: [],
    pasivos: [],
    patrimonio: [],
    totalActivos: 0,
    totalPasivos: 0,
    totalPatrimonio: 0,
    fechaCorte: null
  });
  const [analisisFinanciero, setAnalisisFinanciero] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = async (fechaCorte = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await estadoSituacionPatrimonialService.getBalanceGeneral(fechaCorte);
      setBalance(data);
    } catch (err) {
      console.error('Error en useEstadoSituacionPatrimonial:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalisisFinanciero = async (fechaCorte = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await estadoSituacionPatrimonialService.getAnalisisFinanciero(fechaCorte);
      setBalance(data.balance);
      setAnalisisFinanciero(data);
    } catch (err) {
      console.error('Error en análisis financiero:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    balance,
    analisisFinanciero,
    loading,
    error,
    fetchBalance,
    fetchAnalisisFinanciero
  };
}
