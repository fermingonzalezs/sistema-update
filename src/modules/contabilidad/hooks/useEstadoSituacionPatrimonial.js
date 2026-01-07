import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';
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
      // Sumar el saldo directamente (ya viene con el signo correcto de calcularSaldoCuenta)
      grupos[codigoNivel3].saldoTotal += cuenta.saldo;
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

      // Obtener TODOS los asientos hasta la fecha de corte con PAGINACIÓN
      // Supabase tiene un límite de 1000 registros por defecto
      const PAGE_SIZE_ASIENTOS = 1000;
      let todosLosAsientos = [];
      let offsetAsientos = 0;
      let hayMasAsientos = true;

      console.log('📦 Obteniendo asientos con paginación...');

      while (hayMasAsientos) {
        const { data: asientosPagina, error: errorAsientos } = await supabase
          .from('asientos_contables')
          .select('id, fecha')
          .lte('fecha', fecha)
          .order('fecha', { ascending: true })
          .range(offsetAsientos, offsetAsientos + PAGE_SIZE_ASIENTOS - 1);

        if (errorAsientos) throw errorAsientos;

        const recibidosAsientos = asientosPagina?.length || 0;
        todosLosAsientos = todosLosAsientos.concat(asientosPagina || []);

        console.log(`   📄 Página ${Math.floor(offsetAsientos / PAGE_SIZE_ASIENTOS) + 1}: ${recibidosAsientos} asientos`);

        if (recibidosAsientos < PAGE_SIZE_ASIENTOS) {
          hayMasAsientos = false;
        } else {
          offsetAsientos += PAGE_SIZE_ASIENTOS;
        }
      }

      const asientos = todosLosAsientos;
      console.log(`✅ Total de asientos obtenidos (sin límite): ${asientos.length}`);

      // NOTA: No se excluyen asientos de cierre para que se reflejen en el balance

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

      // LOGS DETALLADOS - Mostrar información del filtrado
      console.log('📊 FILTRO APLICADO:', {
        fechaCorte: fecha,
        asientosEncontrados: asientos.length
      });

      // Encontrar fecha más antigua y más reciente
      const fechasAsientos = asientos.map(a => a.fecha).sort();
      const fechaMasAntigua = fechasAsientos[0];
      const fechaMasReciente = fechasAsientos[fechasAsientos.length - 1];

      console.log('📅 RANGO TEMPORAL PROCESADO:', {
        fechaMasAntigua,
        fechaMasReciente,
        totalDias: Math.ceil((new Date(fechaMasReciente) - new Date(fechaMasAntigua)) / (1000 * 60 * 60 * 24))
      });

      // Mostrar distribución por fecha (últimos 10 días)
      const contadorPorFecha = {};
      asientos.forEach(a => {
        const soloFecha = a.fecha.split('T')[0];
        contadorPorFecha[soloFecha] = (contadorPorFecha[soloFecha] || 0) + 1;
      });

      const fechasOrdenadas = Object.entries(contadorPorFecha)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 10);

      console.log('📋 ASIENTOS POR FECHA (últimos 10 días):',
        fechasOrdenadas.map(([fecha, count]) => `${fecha}: ${count} asientos`)
      );

      const asientoIds = asientos.map(a => a.id);

      // Obtener movimientos con paginación REAL para superar el límite de 1000 de Supabase
      // Dividir asientoIds en chunks de 100 (menos asientos = menos movimientos por consulta)
      const CHUNK_SIZE = 100;
      const PAGE_SIZE = 1000;
      const chunks = [];
      for (let i = 0; i < asientoIds.length; i += CHUNK_SIZE) {
        chunks.push(asientoIds.slice(i, i + CHUNK_SIZE));
      }

      console.log(`📦 Obteniendo movimientos en ${chunks.length} chunk(s)...`);

      // Obtener movimientos de todos los chunks con paginación
      let todosLosMovimientos = [];
      for (const chunk of chunks) {
        let offset = 0;
        let hayMas = true;

        while (hayMas) {
          const { data: movimientosChunk, error } = await supabase
            .from('movimientos_contables')
            .select(`
              *,
              plan_cuentas (id, codigo, nombre, tipo, nivel, padre_id, activa, imputable, categoria)
            `)
            .in('asiento_id', chunk)
            .range(offset, offset + PAGE_SIZE - 1);

          if (error) throw error;

          const recibidos = movimientosChunk?.length || 0;
          todosLosMovimientos = todosLosMovimientos.concat(movimientosChunk || []);

          // Si recibimos menos de PAGE_SIZE, ya no hay más datos
          if (recibidos < PAGE_SIZE) {
            hayMas = false;
          } else {
            offset += PAGE_SIZE;
          }
        }
      }

      const movimientos = todosLosMovimientos;
      console.log(`✅ Total movimientos obtenidos (sin límite): ${movimientos.length}`);

      // VALIDACIÓN FINAL - Verificar fecha del último movimiento
      if (movimientos.length > 0) {
        const fechasMovimientos = movimientos
          .map(m => {
            // Necesitamos obtener la fecha del asiento, pero los movimientos no tienen la fecha directamente
            // La validación se hará después cuando tengamos los asientos con fecha
            return null;
          })
          .filter(f => f);

        // Por ahora, validamos con los asientos que ya tenemos
        if (asientos && asientos.length > 0) {
          const fechasAsientos = asientos.map(a => a.fecha).sort();
          const fechaMasRecienteAsiento = fechasAsientos[fechasAsientos.length - 1];

          console.log('📅 FECHA DEL ÚLTIMO MOVIMIENTO FILTRADO:', {
            fechaCorte: fecha,
            fechaUltimoAsiento: fechaMasRecienteAsiento,
            esAnteriorOIgualACorte: fechaMasRecienteAsiento.split('T')[0] <= fecha,
            status: fechaMasRecienteAsiento.split('T')[0] <= fecha ? '✅ CORRECTO' : '❌ ERROR'
          });
        }
      }

      if (!movimientos || movimientos.length === 0) {
        console.log('ℹ️ No hay movimientos hasta la fecha de corte');
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

      console.log(`📊 Total de movimientos obtenidos hasta ${fecha}:`, movimientos.length);

      // Agrupar por cuenta y calcular saldos
      const saldosPorCuenta = {};

      // DEBUG: Contar movimientos de la cuenta 6
      const movimientosCuenta6 = movimientos.filter(m => m.plan_cuentas?.id === 6);
      console.log('🔍 DEBUG - Movimientos de Caja LP Dólares (ID 6):', {
        totalMovimientos: movimientosCuenta6.length,
        debeTotal: movimientosCuenta6.reduce((sum, m) => sum + parseFloat(m.debe || 0), 0),
        haberTotal: movimientosCuenta6.reduce((sum, m) => sum + parseFloat(m.haber || 0), 0),
        primeros5: movimientosCuenta6.slice(0, 5).map(m => ({
          id: m.id,
          asiento_id: m.asiento_id,
          debe: m.debe,
          haber: m.haber
        }))
      });

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

        // Validar tipo de cuenta
        if (!cuenta.tipo || !['activo', 'pasivo', 'patrimonio', 'resultado positivo', 'resultado negativo'].includes(cuenta.tipo)) {
          console.warn(`⚠️ Cuenta con tipo inválido: ${cuenta.nombre} (${cuenta.tipo})`);
          return;
        }

        // Usar función utilitaria centralizada para calcular saldo
        const saldo = calcularSaldoCuenta(item.debe, item.haber, cuenta.tipo);
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

      // DEBUG: Verificar Caja La Plata Dólares (cuenta ID 6)
      const cajaLPDolares = activosOrdenados.find(a => a.cuenta.id === 6);
      if (cajaLPDolares) {
        console.log('🔍 DEBUG - Caja La Plata Dólares (ID 6):', {
          codigo: cajaLPDolares.cuenta.codigo,
          nombre: cajaLPDolares.cuenta.nombre,
          debe: cajaLPDolares.debe,
          haber: cajaLPDolares.haber,
          saldo: cajaLPDolares.saldo
        });
      }

      // Agrupar ACTIVOS y PASIVOS por nivel 3 (patrimonio mantiene estructura individual)
      const activosAgrupados = await agruparPorNivel3(activosOrdenados);
      const pasivosAgrupados = await agruparPorNivel3(pasivosOrdenados);

      // DEBUG: Verificar grupo 1.1.01 (Disponibilidades)
      const grupoDisponibilidades = activosAgrupados.find(g => g.codigoNivel3 === '1.1.01');
      if (grupoDisponibilidades) {
        console.log('🔍 DEBUG - Grupo 1.1.01 (Disponibilidades):', {
          codigoNivel3: grupoDisponibilidades.codigoNivel3,
          nombre: grupoDisponibilidades.nombre,
          saldoTotal: grupoDisponibilidades.saldoTotal,
          cantidadCuentas: grupoDisponibilidades.cuentas.length,
          cuentas: grupoDisponibilidades.cuentas.map(c => ({
            id: c.cuenta.id,
            codigo: c.cuenta.codigo,
            nombre: c.cuenta.nombre,
            saldo: c.saldo
          }))
        });
      }

      // Calcular totales correctamente (suma directa de saldos sin Math.abs)
      // Los saldos ya vienen con el signo correcto gracias a calcularSaldoCuenta()
      const totalActivos = activosOrdenados.reduce((sum, item) => sum + item.saldo, 0);
      const totalPasivos = pasivosOrdenados.reduce((sum, item) => sum + item.saldo, 0);
      const totalPatrimonio = patrimonioOrdenado.reduce((sum, item) => sum + item.saldo, 0);

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
      // Los saldos ya vienen con signo correcto, no usar Math.abs()
      const activosCorrientes = balance.activos
        .filter(item => this.esActivoCorriente(item.cuenta))
        .reduce((sum, item) => sum + item.saldo, 0);

      const pasivosCorrientes = balance.pasivos
        .filter(item => this.esPasivoCorriente(item.cuenta))
        .reduce((sum, item) => sum + item.saldo, 0);

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
