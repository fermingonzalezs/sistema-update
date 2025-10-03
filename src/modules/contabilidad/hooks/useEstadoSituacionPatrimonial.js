import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';

// Función para ordenar cuentas por código (reemplaza jerarquía)
const ordenarCuentasPorCodigo = (cuentasObj) => {
  return Object.values(cuentasObj)
    .sort((a, b) => {
      const codigoA = a.cuenta.codigo || '';
      const codigoB = b.cuenta.codigo || '';
      return codigoA.localeCompare(codigoB);
    });
};

// Función para extraer código nivel 3 (formato X.X.XX)
const extraerCodigoNivel3 = (codigoCompleto) => {
  if (!codigoCompleto) return null;
  const partes = codigoCompleto.split('.');
  if (partes.length >= 3) {
    return `${partes[0]}.${partes[1]}.${partes[2]}`;
  }
  return null;
};

// Función para agrupar cuentas por nivel 3 con nombres correctos desde la base de datos
const agruparPorNivel3 = async (cuentas) => {
  const grupos = {};
  const codigosNivel3 = new Set();
  
  // Extraer todos los códigos nivel 3 únicos
  cuentas.forEach(cuenta => {
    const codigoNivel3 = extraerCodigoNivel3(cuenta.cuenta.codigo);
    if (codigoNivel3) {
      codigosNivel3.add(codigoNivel3);
    }
  });

  // Obtener nombres reales de las cuentas nivel 3 desde la base de datos
  const cuentasNivel3 = {};
  if (codigosNivel3.size > 0) {
    try {
      const { data: cuentasNivel3Data, error } = await supabase
        .from('plan_cuentas')
        .select('codigo, nombre')
        .in('codigo', Array.from(codigosNivel3))
        .eq('nivel', 3)
        .eq('activa', true);

      if (!error && cuentasNivel3Data) {
        cuentasNivel3Data.forEach(cuenta => {
          cuentasNivel3[cuenta.codigo] = cuenta.nombre;
        });
      }
    } catch (error) {
      console.warn('Error obteniendo nombres nivel 3:', error);
    }
  }
  
  // Agrupar cuentas con nombres reales
  cuentas.forEach(cuenta => {
    const codigoNivel3 = extraerCodigoNivel3(cuenta.cuenta.codigo);
    
    if (codigoNivel3) {
      if (!grupos[codigoNivel3]) {
        grupos[codigoNivel3] = {
          codigoNivel3,
          nombre: cuentasNivel3[codigoNivel3] || `Grupo ${codigoNivel3}`,
          saldoTotal: 0,
          cuentas: []
        };
      }
      
      grupos[codigoNivel3].cuentas.push(cuenta);
      grupos[codigoNivel3].saldoTotal += Math.abs(cuenta.saldo);
    }
  });

  // Convertir a array y ordenar por código
  return Object.values(grupos).sort((a, b) => 
    a.codigoNivel3.localeCompare(b.codigoNivel3)
  );
};

// Servicio para Estado de Situación Patrimonial (Balance General)
export const estadoSituacionPatrimonialService = {
  async getBalanceGeneral(fechaCorte = null) {
    console.log('📡 Obteniendo Balance General...', { fechaCorte });

    try {
      const fecha = fechaCorte || obtenerFechaLocal();

      // Primero obtener asientos hasta la fecha de corte
      const { data: asientos, error: errorAsientos } = await supabase
        .from('asientos_contables')
        .select('id')
        .lte('fecha', fecha);

      if (errorAsientos) throw errorAsientos;

      if (!asientos || asientos.length === 0) {
        console.log('ℹ️ No hay asientos hasta la fecha de corte');
        return {
          activos: [],
          pasivos: [],
          patrimonio: [],
          totalActivos: 0,
          totalPasivos: 0,
          totalPatrimonio: 0,
          fechaCorte: fecha
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
        
        // Validar tipo de cuenta
        if (!cuenta.tipo || !['activo', 'pasivo', 'patrimonio'].includes(cuenta.tipo)) {
          console.warn(`⚠️ Cuenta con tipo inválido: ${cuenta.nombre} (${cuenta.tipo})`);
          return;
        }
        
        if (cuenta.tipo === 'activo') {
          saldo = item.debe - item.haber;
        } else if (cuenta.tipo === 'pasivo' || cuenta.tipo === 'patrimonio') {
          saldo = item.haber - item.debe;
        }
        item.saldo = saldo;

        // Solo incluir cuentas con saldo significativo
        if (Math.abs(saldo) > 0.01) {
          if (cuenta.tipo === 'activo') balance.activos[cuenta.id] = item;
          else if (cuenta.tipo === 'pasivo') balance.pasivos[cuenta.id] = item;
          else if (cuenta.tipo === 'patrimonio') balance.patrimonio[cuenta.id] = item;
        }
      });

      // Ordenar cuentas individuales por código 
      const activosOrdenados = ordenarCuentasPorCodigo(balance.activos);
      const pasivosOrdenados = ordenarCuentasPorCodigo(balance.pasivos);
      const patrimonioOrdenado = ordenarCuentasPorCodigo(balance.patrimonio);

      // Agrupar ACTIVOS y PASIVOS por nivel 3 (patrimonio mantiene estructura individual)
      const activosAgrupados = await agruparPorNivel3(activosOrdenados);
      const pasivosAgrupados = await agruparPorNivel3(pasivosOrdenados);

      // Calcular totales correctamente (suma directa de saldos)
      const totalActivos = activosOrdenados.reduce((sum, item) => sum + Math.abs(item.saldo), 0);
      const totalPasivos = pasivosOrdenados.reduce((sum, item) => sum + Math.abs(item.saldo), 0);
      const totalPatrimonio = patrimonioOrdenado.reduce((sum, item) => sum + Math.abs(item.saldo), 0);

      console.log('✅ Balance General calculado:', {
        activosGrupos: activosAgrupados.length,
        activosCuentas: activosOrdenados.length,
        pasivosGrupos: pasivosAgrupados.length,
        pasivosCuentas: pasivosOrdenados.length,
        patrimonio: patrimonioOrdenado.length,
        totalActivos,
        totalPasivos,
        totalPatrimonio,
        fechaCorte: fecha
      });

      return {
        // Datos agrupados para la vista
        activos: activosAgrupados,
        pasivos: pasivosAgrupados,
        patrimonio: patrimonioOrdenado, // Sin agrupar
        // Datos individuales para cálculos y PDF
        activosDetalle: activosOrdenados,
        pasivosDetalle: pasivosOrdenados,
        patrimonioDetalle: patrimonioOrdenado,
        // Totales
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
