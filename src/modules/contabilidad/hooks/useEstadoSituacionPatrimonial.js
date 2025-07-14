import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

// Función para construir la jerarquía de cuentas (reutilizada)
const buildHierarchy = (cuentas) => {
  const cuentasMap = {};
  const cuentasRaiz = [];

  Object.values(cuentas).forEach(cuenta => {
    cuentasMap[cuenta.cuenta.id] = { ...cuenta, children: [] };
  });

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

  const sumarizarMontos = (cuenta) => {
    if (cuenta.children.length === 0) {
      return cuenta.saldo;
    }
    const montoHijos = cuenta.children.reduce((sum, hijo) => sum + sumarizarMontos(hijo), 0);
    cuenta.saldo += montoHijos;
    return cuenta.saldo;
  };

  cuentasRaiz.forEach(sumarizarMontos);

  return cuentasRaiz;
};

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
        activos: {},
        pasivos: {},
        patrimonio: {},
        fechaCorte: fecha
      };

      Object.values(saldosPorCuenta).forEach(item => {
        const { cuenta } = item;
        let saldo = 0;
        if (cuenta.tipo === 'activo') {
          saldo = item.debe - item.haber;
        } else if (cuenta.tipo === 'pasivo' || cuenta.tipo === 'patrimonio') {
          saldo = item.haber - item.debe;
        }
        item.saldo = saldo;

        if (Math.abs(saldo) > 0.01) {
          if (cuenta.tipo === 'activo') balance.activos[cuenta.id] = item;
          else if (cuenta.tipo === 'pasivo') balance.pasivos[cuenta.id] = item;
          else if (cuenta.tipo === 'patrimonio') balance.patrimonio[cuenta.id] = item;
        }
      });

      const activosJerarquizados = buildHierarchy(balance.activos);
      const pasivosJerarquizados = buildHierarchy(balance.pasivos);
      const patrimonioJerarquizado = buildHierarchy(balance.patrimonio);

      const totalActivos = activosJerarquizados.reduce((sum, c) => sum + c.saldo, 0);
      const totalPasivos = pasivosJerarquizados.reduce((sum, c) => sum + c.saldo, 0);
      const totalPatrimonio = patrimonioJerarquizado.reduce((sum, c) => sum + c.saldo, 0);

      console.log('✅ Balance General calculado');

      return {
        activos: activosJerarquizados,
        pasivos: pasivosJerarquizados,
        patrimonio: patrimonioJerarquizado,
        totalActivos,
        totalPasivos,
        totalPatrimonio,
        fechaCorte: fecha
      };

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
