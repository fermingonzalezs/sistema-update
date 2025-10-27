import { useState, useEffect } from 'react';
import { estadoSituacionPatrimonialService } from './useEstadoSituacionPatrimonial';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';
import { supabase } from '../../../lib/supabase';
import { calcularTotalCategoria, calcularDebitos } from '../utils/saldosUtils';

// Función para identificar si una cuenta es inventario/mercadería
const esInventario = (cuenta) => {
  const codigo = cuenta.codigo || '';
  const nombre = cuenta.nombre.toLowerCase();

  // Buscar específicamente por el código de Mercadería (1.1.04.xx)
  // o por términos relacionados al inventario
  const esCodigoMercaderia = codigo.startsWith('1.1.04');

  const terminosInventario = [
    'mercaderia', 'mercadería', 'inventario', 'stock', 'existencias',
    'bienes de cambio'
  ];

  const esPorNombre = terminosInventario.some(term => nombre.includes(term));

  return esCodigoMercaderia || esPorNombre;
};

// Función para determinar el indicador de liquidez corriente
const determinarIndicadorLiquidez = (ratio) => {
  if (ratio < 1.0) {
    return {
      estado: 'riesgo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Riesgo'
    };
  } else if (ratio >= 1.0 && ratio <= 1.5) {
    return {
      estado: 'aceptable',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Aceptable'
    };
  } else {
    return {
      estado: 'saludable',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Saludable'
    };
  }
};

// Función para determinar el indicador de prueba ácida
const determinarIndicadorPruebaAcida = (ratio) => {
  if (ratio < 0.8) {
    return {
      estado: 'debil',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Débil'
    };
  } else if (ratio >= 0.8 && ratio <= 1.0) {
    return {
      estado: 'justo',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Justo'
    };
  } else {
    return {
      estado: 'solido',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Sólido'
    };
  }
};

// Función para determinar el indicador de capital de trabajo
const determinarIndicadorCapitalTrabajo = (valor) => {
  if (valor < 0) {
    return {
      estado: 'riesgo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Riesgo'
    };
  } else if (valor >= 0 && valor <= 5000) {
    return {
      estado: 'fragil',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Frágil'
    };
  } else {
    return {
      estado: 'positivo',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Positivo'
    };
  }
};

// Función para determinar el indicador de sobrecompra
// Ratio = Compras / CMV
// > 1.0 = Sobrecompra (compraste más de lo que vendiste)
// 0.9-1.0 = Alineado
// < 0.9 = Saludable (compraste menos de lo que vendiste)
const determinarIndicadorSobrecompra = (ratio) => {
  if (ratio < 0.9) {
    return {
      estado: 'verde',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Saludable'
    };
  } else if (ratio >= 0.9 && ratio <= 1.0) {
    return {
      estado: 'amarillo',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Alineado'
    };
  } else {
    return {
      estado: 'rojo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Sobrecompra'
    };
  }
};

// Mapeo de categorías para ratios por tipo de producto
const CATEGORIAS_RATIO = [
  {
    nombre: "Notebooks Nuevas",
    codigoBienes: "1.1.04.01.01",
    codigoCMV: "5.0.1"
  },
  {
    nombre: "Notebooks Usadas",
    codigoBienes: "1.1.04.01.02",
    codigoCMV: "5.0.2"
  },
  {
    nombre: "Celulares Nuevos",
    codigoBienes: "1.1.04.01.03",
    codigoCMV: "5.0.3"
  },
  {
    nombre: "Celulares Usados",
    codigoBienes: "1.1.04.01.04",
    codigoCMV: "5.0.4"
  },
  {
    nombre: "Otros",
    codigoBienes: "1.1.04.01.06",
    codigoCMV: "5.0.6"
  }
];

// Servicio para calcular ratios financieros
export const ratiosFinancierosService = {
  async calcularRatioSobrecompra(fechaCorte = null) {
    console.log('📊 Calculando ratio de sobrecompra...', { fechaCorte });

    try {
      const fecha = fechaCorte || obtenerFechaLocal();

      // Calcular primer y último día del mes actual
      const fechaActual = new Date(fecha);
      const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

      const fechaInicioStr = primerDiaMes.toISOString().split('T')[0];
      const fechaFinStr = ultimoDiaMes.toISOString().split('T')[0];

      console.log('📅 RATIOS - Mes calendario actual:', {
        desde: fechaInicioStr,
        hasta: fechaFinStr,
        mes: fechaActual.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
      });

      // Obtener asientos del mes
      const { data: asientos, error: errorAsientos } = await supabase
        .from('asientos_contables')
        .select('id')
        .gte('fecha', fechaInicioStr)
        .lte('fecha', fechaFinStr);

      if (errorAsientos) throw errorAsientos;

      if (!asientos || asientos.length === 0) {
        return {
          cmv: 0,
          compras: 0,
          ratio: 0,
          indicador: determinarIndicadorSobrecompra(0),
          fechaInicio: fechaInicioStr,
          fechaFin: fecha
        };
      }

      const asientoIds = asientos.map(a => a.id);

      // Obtener movimientos en lotes para evitar límite de 1000 registros
      const BATCH_SIZE = 200;
      let todosLosMovimientos = [];
      let batchCount = 0;

      for (let i = 0; i < asientoIds.length; i += BATCH_SIZE) {
        const batch = asientoIds.slice(i, i + BATCH_SIZE);
        batchCount++;

        const { data: movimientosBatch, error: errorBatch } = await supabase
          .from('movimientos_contables')
          .select(`
            *,
            plan_cuentas (id, codigo, nombre, tipo, categoria)
          `)
          .in('asiento_id', batch);

        if (errorBatch) throw errorBatch;

        console.log(`📦 RATIOS Lote ${batchCount}: ${movimientosBatch.length} movimientos (asientos ${i+1}-${Math.min(i+BATCH_SIZE, asientoIds.length)})`);
        todosLosMovimientos = todosLosMovimientos.concat(movimientosBatch);
      }

      const movimientos = todosLosMovimientos;
      console.log(`📊 RATIOS TOTAL de movimientos procesados en ${batchCount} lotes:`, movimientos.length);

      console.log('🔍 DEBUG RATIOS - Total movimientos obtenidos:', movimientos.length);
      console.log('🔍 DEBUG RATIOS - Asientos del período:', asientos.length);

      // Calcular ratios por categoría (solo débitos)
      const categorias = CATEGORIAS_RATIO.map(cat => {
        // Sumar SOLO los débitos de cada cuenta específica
        const debitosCompras = calcularDebitos(
          movimientos,
          (mov) => mov.plan_cuentas?.codigo === cat.codigoBienes
        );

        const debitosCMV = calcularDebitos(
          movimientos,
          (mov) => mov.plan_cuentas?.codigo === cat.codigoCMV
        );

        // Ratio = Compras / CMV (invertido)
        const ratio = debitosCMV > 0
          ? debitosCompras / debitosCMV
          : 0;

        console.log(`📊 Categoría ${cat.nombre}:`, {
          cuenta_bienes: cat.codigoBienes,
          cuenta_cmv: cat.codigoCMV,
          compras: debitosCompras.toFixed(2),
          cmv: debitosCMV.toFixed(2),
          ratio: ratio.toFixed(2)
        });

        return {
          nombre: cat.nombre,
          codigoBienes: cat.codigoBienes,
          codigoCMV: cat.codigoCMV,
          compras: debitosCompras,
          cmv: debitosCMV,
          ratio,
          indicador: determinarIndicadorSobrecompra(ratio)
        };
      });

      // Calcular totales generales (suma de todas las categorías)
      const comprasTotal = categorias.reduce((sum, cat) => sum + cat.compras, 0);
      const cmvTotal = categorias.reduce((sum, cat) => sum + cat.cmv, 0);
      // Ratio General = Compras / CMV (invertido)
      const ratioGeneral = cmvTotal > 0 ? comprasTotal / cmvTotal : 0;

      console.log('📊 TOTALES GENERALES:', {
        compras: comprasTotal.toFixed(2),
        cmv: cmvTotal.toFixed(2),
        ratio: ratioGeneral.toFixed(2),
        periodo: `${fechaInicioStr} al ${fechaFinStr}`
      });

      return {
        // Totales generales
        compras: comprasTotal,
        cmv: cmvTotal,
        ratio: ratioGeneral,
        indicador: determinarIndicadorSobrecompra(ratioGeneral),

        // Desglose por categorías
        categorias,

        // Metadata
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr
      };

    } catch (error) {
      console.error('❌ Error calculando ratio de sobrecompra:', error);
      throw error;
    }
  },

  async calcularRatiosLiquidez(fechaCorte = null) {
    console.log('📊 Calculando ratios de liquidez...', { fechaCorte });

    try {
      const fecha = fechaCorte || obtenerFechaLocal();

      // Obtener balance general (UNA sola consulta)
      const balance = await estadoSituacionPatrimonialService.getBalanceGeneral(fecha);

      // Si no hay datos, retornar valores en cero
      if (!balance.activosDetalle || balance.activosDetalle.length === 0) {
        console.log('ℹ️ No hay datos de balance para calcular ratios');
        return {
          activoCorriente: 0,
          pasivoCorriente: 0,
          inventario: 0,
          liquidezCorriente: 0,
          pruebaAcida: 0,
          capitalTrabajoNeto: 0,
          indicadores: {
            liquidezCorriente: determinarIndicadorLiquidez(0),
            pruebaAcida: determinarIndicadorPruebaAcida(0),
            capitalTrabajoNeto: determinarIndicadorCapitalTrabajo(0)
          },
          fechaCalculo: fecha
        };
      }

      // Calcular activo corriente desde cuentas detalladas
      const activoCorriente = balance.activosDetalle
        .filter(item => estadoSituacionPatrimonialService.esActivoCorriente(item.cuenta))
        .reduce((sum, item) => sum + item.saldo, 0);

      console.log('💰 Activo Corriente:', activoCorriente);

      // Calcular pasivo corriente desde cuentas detalladas
      const pasivoCorriente = balance.pasivosDetalle
        .filter(item => estadoSituacionPatrimonialService.esPasivoCorriente(item.cuenta))
        .reduce((sum, item) => sum + item.saldo, 0);

      console.log('💳 Pasivo Corriente:', pasivoCorriente);

      // Calcular inventario desde cuentas detalladas (más preciso para este caso)
      const inventario = balance.activosDetalle
        .filter(item => estadoSituacionPatrimonialService.esActivoCorriente(item.cuenta) && esInventario(item.cuenta))
        .reduce((sum, item) => sum + item.saldo, 0);

      console.log('📦 Inventario:', inventario);

      // Calcular ratios
      const liquidezCorriente = pasivoCorriente > 0
        ? activoCorriente / pasivoCorriente
        : 0;

      const pruebaAcida = pasivoCorriente > 0
        ? (activoCorriente - inventario) / pasivoCorriente
        : 0;

      const capitalTrabajoNeto = activoCorriente - pasivoCorriente;

      console.log('📈 Ratios calculados:', {
        liquidezCorriente: liquidezCorriente.toFixed(2),
        pruebaAcida: pruebaAcida.toFixed(2),
        capitalTrabajoNeto: capitalTrabajoNeto.toFixed(2)
      });

      // Determinar indicadores de salud
      const indicadores = {
        liquidezCorriente: determinarIndicadorLiquidez(liquidezCorriente),
        pruebaAcida: determinarIndicadorPruebaAcida(pruebaAcida),
        capitalTrabajoNeto: determinarIndicadorCapitalTrabajo(capitalTrabajoNeto)
      };

      return {
        // Valores base
        activoCorriente,
        pasivoCorriente,
        inventario,
        // Ratios calculados
        liquidezCorriente,
        pruebaAcida,
        capitalTrabajoNeto,
        // Indicadores de salud
        indicadores,
        // Metadata
        fechaCalculo: fecha
      };

    } catch (error) {
      console.error('❌ Error calculando ratios de liquidez:', error);
      throw error;
    }
  }
};

// Hook personalizado para Ratios Financieros
export function useRatiosFinancieros() {
  const [ratios, setRatios] = useState(null);
  const [ratioSobrecompra, setRatioSobrecompra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const calcularRatios = async (fechaCorte = null) => {
    setLoading(true);
    setError(null);

    try {
      // Calcular ambos ratios en paralelo
      const [liquidez, sobrecompra] = await Promise.all([
        ratiosFinancierosService.calcularRatiosLiquidez(fechaCorte),
        ratiosFinancierosService.calcularRatioSobrecompra(fechaCorte)
      ]);

      setRatios(liquidez);
      setRatioSobrecompra(sobrecompra);
      console.log('✅ Ratios financieros calculados exitosamente');
    } catch (err) {
      console.error('Error en useRatiosFinancieros:', err);
      setError(err.message || 'Error calculando ratios financieros');
    } finally {
      setLoading(false);
    }
  };

  // Calcular automáticamente al montar (fecha actual)
  useEffect(() => {
    console.log('🚀 Iniciando cálculo de ratios financieros...');
    calcularRatios();
  }, []);

  return {
    ratios,
    ratioSobrecompra,
    loading,
    error,
    refetch: calcularRatios
  };
}
