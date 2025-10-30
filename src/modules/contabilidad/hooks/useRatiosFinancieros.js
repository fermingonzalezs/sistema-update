import { useState, useEffect } from 'react';
import { estadoSituacionPatrimonialService } from './useEstadoSituacionPatrimonial';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';
import { supabase } from '../../../lib/supabase';
import { calcularTotalCategoria, calcularDebitos, calcularSaldoCuenta } from '../utils/saldosUtils';

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

// Función para identificar si una cuenta es Cuentas por Cobrar
const esCuentaPorCobrar = (cuenta) => {
  const codigo = cuenta.codigo || '';
  return codigo.startsWith('1.1.02');
};

// Función para identificar si una cuenta es Cuentas por Pagar
const esCuentaPorPagar = (cuenta) => {
  const codigo = cuenta.codigo || '';
  return codigo.startsWith('2.1');
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

// ===============================
// 🟢 Funciones de indicadores para Ratios de Endeudamiento
// ===============================

// Función para determinar el indicador de Endeudamiento Total
// >0.7 = Riesgo | 0.5-0.7 = Controlable | <0.5 = Sólido
const determinarIndicadorEndeudamientoTotal = (ratio) => {
  if (ratio > 0.7) {
    return {
      estado: 'riesgo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Riesgo'
    };
  } else if (ratio >= 0.5 && ratio <= 0.7) {
    return {
      estado: 'controlable',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Controlable'
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

// Función para determinar el indicador de Apalancamiento Financiero
// >3 = Excesivo | 2-3 = Moderado | <2 = Sano
const determinarIndicadorApalancamiento = (ratio) => {
  if (ratio > 3) {
    return {
      estado: 'excesivo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Excesivo'
    };
  } else if (ratio >= 2 && ratio <= 3) {
    return {
      estado: 'moderado',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Moderado'
    };
  } else {
    return {
      estado: 'sano',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Sano'
    };
  }
};

// Función para determinar el indicador de Cobertura de Intereses
// <2 = Riesgo | 2-4 = Aceptable | >4 = Cómodo
const determinarIndicadorCoberturaIntereses = (ratio) => {
  if (ratio < 2) {
    return {
      estado: 'riesgo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Riesgo'
    };
  } else if (ratio >= 2 && ratio <= 4) {
    return {
      estado: 'aceptable',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Aceptable'
    };
  } else {
    return {
      estado: 'comodo',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Cómodo'
    };
  }
};

// Función para determinar el indicador de Pasivo Corriente / Pasivo Total
// >0.7 = Tensión | 0.5-0.7 = Controlable | <0.5 = Sano
const determinarIndicadorPasivoCorriente = (ratio) => {
  if (ratio > 0.7) {
    return {
      estado: 'tension',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Tensión'
    };
  } else if (ratio >= 0.5 && ratio <= 0.7) {
    return {
      estado: 'controlable',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Controlable'
    };
  } else {
    return {
      estado: 'sano',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Sano'
    };
  }
};

// ===============================
// 🟢 Funciones de indicadores para Ratios de Rentabilidad
// ===============================

// Función para determinar el indicador de Margen Bruto
// <10% = Bajo | 10-20% = Normal | >20% = Fuerte
const determinarIndicadorMargenBruto = (porcentaje) => {
  if (porcentaje < 10) {
    return {
      estado: 'bajo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Bajo'
    };
  } else if (porcentaje >= 10 && porcentaje <= 20) {
    return {
      estado: 'normal',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Normal'
    };
  } else {
    return {
      estado: 'fuerte',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Fuerte'
    };
  }
};

// Función para determinar el indicador de Margen Operativo (EBIT)
// <5% = Bajo | 5-10% = Medio | >10% = Alto
const determinarIndicadorMargenOperativo = (porcentaje) => {
  if (porcentaje < 5) {
    return {
      estado: 'bajo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Bajo'
    };
  } else if (porcentaje >= 5 && porcentaje <= 10) {
    return {
      estado: 'medio',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Medio'
    };
  } else {
    return {
      estado: 'alto',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Alto'
    };
  }
};

// Función para determinar el indicador de Margen Neto
// <3% = Bajo | 3-8% = Bueno | >8% = Excelente
const determinarIndicadorMargenNeto = (porcentaje) => {
  if (porcentaje < 3) {
    return {
      estado: 'bajo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Bajo'
    };
  } else if (porcentaje >= 3 && porcentaje <= 8) {
    return {
      estado: 'bueno',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Bueno'
    };
  } else {
    return {
      estado: 'excelente',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Excelente'
    };
  }
};

// Función para determinar el indicador de ROA
// <3% = Ineficiente | 3-6% = Normal | >6% = Sano
const determinarIndicadorROA = (porcentaje) => {
  if (porcentaje < 3) {
    return {
      estado: 'ineficiente',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Ineficiente'
    };
  } else if (porcentaje >= 3 && porcentaje <= 6) {
    return {
      estado: 'normal',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Normal'
    };
  } else {
    return {
      estado: 'sano',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Sano'
    };
  }
};

// Función para determinar el indicador de ROE
// <10% = Bajo | 10-20% = Adecuado | >20% = Excelente
// Caso especial: Patrimonio negativo
const determinarIndicadorROE = (porcentaje, patrimonioNeto) => {
  // Si el patrimonio es negativo, situación crítica
  if (patrimonioNeto <= 0) {
    return {
      estado: 'critico',
      color: '#991b1b',
      emoji: '⛔',
      texto: 'Patrimonio Negativo'
    };
  }

  if (porcentaje < 10) {
    return {
      estado: 'bajo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Bajo'
    };
  } else if (porcentaje >= 10 && porcentaje <= 20) {
    return {
      estado: 'adecuado',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Adecuado'
    };
  } else {
    return {
      estado: 'excelente',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Excelente'
    };
  }
};

// ===============================
// 🟢 Funciones de indicadores para Ratios de Eficiencia
// ===============================

// Rotación de Inventario: <4 = 🔴 Exceso stock | 4–8 = 🟡 Normal | >8 = 🟢 Excelente
const determinarIndicadorRotacionInventario = (ratio) => {
  if (ratio < 4) {
    return {
      estado: 'exceso',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Exceso Stock'
    };
  } else if (ratio >= 4 && ratio <= 8) {
    return {
      estado: 'normal',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Normal'
    };
  } else {
    return {
      estado: 'excelente',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Excelente'
    };
  }
};

// Días de Inventario: >75 = 🔴 Lento | 45–75 = 🟡 Moderado | <45 = 🟢 Eficiente
const determinarIndicadorDiasInventario = (dias) => {
  if (dias > 75) {
    return {
      estado: 'lento',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Lento'
    };
  } else if (dias >= 45 && dias <= 75) {
    return {
      estado: 'moderado',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Moderado'
    };
  } else {
    return {
      estado: 'eficiente',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Eficiente'
    };
  }
};

// Rotación CxC: <4 = 🔴 Lento | 4–8 = 🟡 Regular | >8 = 🟢 Rápido
const determinarIndicadorRotacionCxC = (ratio) => {
  if (ratio < 4) {
    return {
      estado: 'lento',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Lento'
    };
  } else if (ratio >= 4 && ratio <= 8) {
    return {
      estado: 'regular',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Regular'
    };
  } else {
    return {
      estado: 'rapido',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Rápido'
    };
  }
};

// Días de Cobro: >60 = 🔴 Riesgo | 45–60 = 🟡 Normal | <45 = 🟢 Eficiente
const determinarIndicadorDiasCobro = (dias) => {
  if (dias > 60) {
    return {
      estado: 'riesgo',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Riesgo'
    };
  } else if (dias >= 45 && dias <= 60) {
    return {
      estado: 'normal',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Normal'
    };
  } else {
    return {
      estado: 'eficiente',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Eficiente'
    };
  }
};

// Rotación CxP: >12 = 🔴 Muy rápido | 6–12 = 🟡 Equilibrado | <6 = 🟢 Aprovecha crédito
const determinarIndicadorRotacionCxP = (ratio) => {
  if (ratio > 12) {
    return {
      estado: 'muy_rapido',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Muy Rápido'
    };
  } else if (ratio >= 6 && ratio <= 12) {
    return {
      estado: 'equilibrado',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Equilibrado'
    };
  } else {
    return {
      estado: 'aprovecha',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Aprovecha Crédito'
    };
  }
};

// Días de Pago: <15 = 🔴 Estrés | 15–30 = 🟡 Normal | >30 = 🟢 Óptimo
const determinarIndicadorDiasPago = (dias) => {
  if (dias < 15) {
    return {
      estado: 'estres',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Estrés'
    };
  } else if (dias >= 15 && dias <= 30) {
    return {
      estado: 'normal',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Normal'
    };
  } else {
    return {
      estado: 'optimo',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Óptimo'
    };
  }
};

// Ciclo de Caja: >60 = 🔴 Tenso | 45–60 = 🟡 Controlable | <45 = 🟢 Eficiente
const determinarIndicadorCicloCaja = (dias) => {
  if (dias > 60) {
    return {
      estado: 'tenso',
      color: '#ef4444',
      emoji: '🔴',
      texto: 'Tenso'
    };
  } else if (dias >= 45 && dias <= 60) {
    return {
      estado: 'controlable',
      color: '#f59e0b',
      emoji: '🟡',
      texto: 'Controlable'
    };
  } else {
    return {
      estado: 'eficiente',
      color: '#10b981',
      emoji: '🟢',
      texto: 'Eficiente'
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
  },
  {
    nombre: "Periféricos",
    codigoBienes: "1.1.04.01.07",
    codigoCMV: "5.0.7"
  }
];

// Servicio para calcular ratios financieros
export const ratiosFinancierosService = {
  async calcularRatioSobrecompra(fechaDesde = null, fechaHasta = null) {
    console.log('📊 Calculando ratio de sobrecompra...', { fechaDesde, fechaHasta });

    try {
      let fechaInicioStr, fechaFinStr;

      if (fechaDesde && fechaHasta) {
        // Si se proporcionan ambas fechas, usar el rango específico
        fechaInicioStr = fechaDesde;
        fechaFinStr = fechaHasta;
      } else {
        // Si no, calcular el mes actual (comportamiento legacy)
        const fecha = fechaHasta || fechaDesde || obtenerFechaLocal();
        const fechaActual = new Date(fecha);
        const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

        fechaInicioStr = primerDiaMes.toISOString().split('T')[0];
        fechaFinStr = ultimoDiaMes.toISOString().split('T')[0];
      }

      console.log('📅 RATIOS - Período de análisis:', {
        desde: fechaInicioStr,
        hasta: fechaFinStr
      });

      // Obtener asientos del período
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

      // ⚠️ VERIFICACIÓN: Calcular total usando startsWith para comparar
      const comprasTotalVerificacion = calcularDebitos(
        movimientos,
        (mov) => mov.plan_cuentas?.codigo?.startsWith('1.1.04.01')
      );

      console.log('📊 TOTALES GENERALES:', {
        compras: comprasTotal.toFixed(2),
        comprasVerificacion: comprasTotalVerificacion.toFixed(2),
        diferencia: (comprasTotalVerificacion - comprasTotal).toFixed(2),
        cmv: cmvTotal.toFixed(2),
        ratio: ratioGeneral.toFixed(2),
        periodo: `${fechaInicioStr} al ${fechaFinStr}`
      });

      if (comprasTotalVerificacion !== comprasTotal) {
        console.warn('⚠️ ADVERTENCIA: Hay cuentas 1.1.04.01.xx que no están en CATEGORIAS_RATIO');
      }

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

      // Calcular totales del balance
      const activoTotal = balance.totalActivos;
      const pasivoTotal = balance.totalPasivos;
      const patrimonioNeto = balance.totalPatrimonio;

      // ===============================
      // Calcular Ratios de Endeudamiento
      // ===============================

      // 1. Endeudamiento Total = Pasivo Total / Activo Total
      const endeudamientoTotal = activoTotal > 0 ? pasivoTotal / activoTotal : 0;

      // 2. Apalancamiento Financiero = Activo Total / Patrimonio Neto
      const apalancamientoFinanciero = patrimonioNeto > 0 ? activoTotal / patrimonioNeto : 0;

      // 3. Cobertura de Intereses = EBIT / Gastos Financieros
      // NOTA: Por ahora asumimos gastos financieros = 0, lo calcularemos desde rentabilidad si hay
      const coberturaIntereses = 0; // Se actualizará desde rentabilidad si hay gastos financieros

      // 4. Pasivo Corriente / Pasivo Total
      const proporcionPasivoCorriente = pasivoTotal > 0 ? pasivoCorriente / pasivoTotal : 0;

      console.log('📊 Ratios de endeudamiento calculados:', {
        endeudamientoTotal: endeudamientoTotal.toFixed(2),
        apalancamientoFinanciero: apalancamientoFinanciero.toFixed(2),
        proporcionPasivoCorriente: proporcionPasivoCorriente.toFixed(2)
      });

      // Determinar indicadores de salud
      const indicadores = {
        liquidezCorriente: determinarIndicadorLiquidez(liquidezCorriente),
        pruebaAcida: determinarIndicadorPruebaAcida(pruebaAcida),
        capitalTrabajoNeto: determinarIndicadorCapitalTrabajo(capitalTrabajoNeto)
      };

      // Indicadores de endeudamiento
      const indicadoresEndeudamiento = {
        endeudamientoTotal: determinarIndicadorEndeudamientoTotal(endeudamientoTotal),
        apalancamientoFinanciero: determinarIndicadorApalancamiento(apalancamientoFinanciero),
        coberturaIntereses: determinarIndicadorCoberturaIntereses(coberturaIntereses),
        proporcionPasivoCorriente: determinarIndicadorPasivoCorriente(proporcionPasivoCorriente)
      };

      return {
        // Valores base
        activoCorriente,
        pasivoCorriente,
        inventario,
        activoTotal,
        pasivoTotal,
        patrimonioNeto,
        // Ratios de liquidez
        liquidezCorriente,
        pruebaAcida,
        capitalTrabajoNeto,
        // Ratios de endeudamiento
        endeudamientoTotal,
        apalancamientoFinanciero,
        coberturaIntereses,
        proporcionPasivoCorriente,
        // Indicadores de salud
        indicadores,
        indicadoresEndeudamiento,
        // Metadata
        fechaCalculo: fecha
      };

    } catch (error) {
      console.error('❌ Error calculando ratios de liquidez:', error);
      throw error;
    }
  },

  async calcularRatiosRentabilidad(fechaDesde, fechaHasta) {
    console.log('📊 Calculando ratios de rentabilidad...', { fechaDesde, fechaHasta });

    try {
      const fechaInicio = fechaDesde || obtenerFechaLocal();
      const fechaFin = fechaHasta || obtenerFechaLocal();

      // Calcular días y meses del período
      const fechaInicioDate = new Date(fechaInicio);
      const fechaFinDate = new Date(fechaFin);
      const dias = (fechaFinDate - fechaInicioDate) / (1000 * 60 * 60 * 24);
      const meses = dias / 30.44; // Promedio días por mes
      const factorAnualizacion = 12 / meses;

      console.log('📅 Período de análisis:', {
        desde: fechaInicio,
        hasta: fechaFin,
        dias: dias.toFixed(0),
        meses: meses.toFixed(1),
        factorAnualizacion: factorAnualizacion.toFixed(2)
      });

      // Obtener asientos del período
      const { data: asientos, error: errorAsientos } = await supabase
        .from('asientos_contables')
        .select('id')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);

      if (errorAsientos) throw errorAsientos;

      if (!asientos || asientos.length === 0) {
        console.log('ℹ️ No hay asientos en el período de rentabilidad');
        return {
          ventas: 0,
          cmv: 0,
          gastosOperativos: 0,
          ebit: 0,
          resultadoNeto: 0,
          resultadoNetoAnualizado: 0,
          activoTotal: 0,
          patrimonioNeto: 0,
          margenBruto: { valor: 0, indicador: determinarIndicadorMargenBruto(0) },
          margenOperativo: { valor: 0, indicador: determinarIndicadorMargenOperativo(0) },
          margenNeto: { valor: 0, indicador: determinarIndicadorMargenNeto(0) },
          roa: { valorPeriodo: 0, valorAnualizado: 0, indicador: determinarIndicadorROA(0), mesesPeriodo: meses, factorAnualizacion },
          roe: { valorPeriodo: 0, valorAnualizado: 0, indicador: determinarIndicadorROE(0, 0), mesesPeriodo: meses, factorAnualizacion },
          fechaDesde: fechaInicio,
          fechaHasta: fechaFin
        };
      }

      const asientoIds = asientos.map(a => a.id);

      // Obtener movimientos en lotes
      const BATCH_SIZE = 200;
      let todosLosMovimientos = [];

      for (let i = 0; i < asientoIds.length; i += BATCH_SIZE) {
        const batch = asientoIds.slice(i, i + BATCH_SIZE);

        const { data: movimientosBatch, error: errorBatch } = await supabase
          .from('movimientos_contables')
          .select(`
            *,
            plan_cuentas (id, codigo, nombre, tipo, categoria)
          `)
          .in('asiento_id', batch);

        if (errorBatch) throw errorBatch;
        todosLosMovimientos = todosLosMovimientos.concat(movimientosBatch);
      }

      const movimientos = todosLosMovimientos;
      console.log(`📊 RENTABILIDAD - Total movimientos procesados:`, movimientos.length);

      // Calcular componentes principales usando débitos/créditos según naturaleza contable
      // VENTAS (4.1): Se acreditan (haber) cuando se genera ingreso
      const ventas = movimientos
        .filter(mov => mov.plan_cuentas?.codigo?.startsWith('4.1'))
        .reduce((sum, mov) => sum + parseFloat(mov.haber || 0), 0);

      // CMV (5.0): Se debita (debe) cuando se registra el costo
      const cmv = calcularDebitos(movimientos, (mov) => mov.plan_cuentas?.codigo?.startsWith('5.0'));

      // GASTOS OPERATIVOS (5.1): Se debitan (debe) cuando se registran gastos
      const gastosOperativos = calcularDebitos(movimientos, (mov) => mov.plan_cuentas?.codigo?.startsWith('5.1'));

      // Calcular EBIT (Earnings Before Interest and Taxes)
      const ebit = ventas - cmv - gastosOperativos;

      // Calcular Resultado Neto (simplificado: EBIT sin ajustar por intereses e impuestos)
      // En tu caso, el resultado neto es el EBIT ya que no tienes cuentas de intereses/impuestos separadas
      const resultadoNeto = ebit;
      const resultadoNetoAnualizado = resultadoNeto * factorAnualizacion;

      console.log('💰 Componentes de rentabilidad (usando débitos/créditos correctos):', {
        ventas: ventas.toFixed(2) + ' (HABER)',
        cmv: cmv.toFixed(2) + ' (DEBE)',
        gastosOperativos: gastosOperativos.toFixed(2) + ' (DEBE)',
        ebit: ebit.toFixed(2),
        resultadoNeto: resultadoNeto.toFixed(2),
        resultadoNetoAnualizado: resultadoNetoAnualizado.toFixed(2)
      });

      // Obtener Balance General al inicio y fin del período para calcular promedio
      const [balanceInicio, balanceFin] = await Promise.all([
        estadoSituacionPatrimonialService.getBalanceGeneral(fechaInicio),
        estadoSituacionPatrimonialService.getBalanceGeneral(fechaFin)
      ]);

      // Calcular promedios (es la práctica contable estándar internacional)
      const activoTotal = (balanceInicio.totalActivos + balanceFin.totalActivos) / 2;
      const patrimonioNeto = (balanceInicio.totalPatrimonio + balanceFin.totalPatrimonio) / 2;

      console.log('📊 Balance promedio del período:', {
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        activoInicio: balanceInicio.totalActivos.toFixed(2),
        activoFin: balanceFin.totalActivos.toFixed(2),
        activoPromedio: activoTotal.toFixed(2),
        patrimonioInicio: balanceInicio.totalPatrimonio.toFixed(2),
        patrimonioFin: balanceFin.totalPatrimonio.toFixed(2),
        patrimonioPromedio: patrimonioNeto.toFixed(2)
      });

      console.log('🔍 DESGLOSE Balance Inicio:', {
        activoCorriente: balanceInicio.totalActivoCorriente?.toFixed(2) || 'N/A',
        activoNoCorriente: balanceInicio.totalActivoNoCorriente?.toFixed(2) || 'N/A',
        totalActivos: balanceInicio.totalActivos.toFixed(2)
      });

      console.log('🔍 DESGLOSE Balance Fin:', {
        activoCorriente: balanceFin.totalActivoCorriente?.toFixed(2) || 'N/A',
        activoNoCorriente: balanceFin.totalActivoNoCorriente?.toFixed(2) || 'N/A',
        totalActivos: balanceFin.totalActivos.toFixed(2)
      });

      // ===============================
      // Calcular Ratios de Rentabilidad
      // ===============================

      // 1. Margen Bruto = (Ventas - CMV) / Ventas × 100
      const margenBrutoPorcentaje = ventas > 0 ? ((ventas - cmv) / ventas) * 100 : 0;
      const margenBruto = {
        valor: margenBrutoPorcentaje,
        indicador: determinarIndicadorMargenBruto(margenBrutoPorcentaje)
      };

      // 2. Margen Operativo (EBIT) = EBIT / Ventas × 100
      const margenOperativoPorcentaje = ventas > 0 ? (ebit / ventas) * 100 : 0;
      const margenOperativo = {
        valor: margenOperativoPorcentaje,
        indicador: determinarIndicadorMargenOperativo(margenOperativoPorcentaje)
      };

      // 3. Margen Neto = Resultado Neto / Ventas × 100
      const margenNetoPorcentaje = ventas > 0 ? (resultadoNeto / ventas) * 100 : 0;
      const margenNeto = {
        valor: margenNetoPorcentaje,
        indicador: determinarIndicadorMargenNeto(margenNetoPorcentaje)
      };

      // 4. ROA = Resultado Neto / Activo Total × 100
      const roaPeriodoPorcentaje = activoTotal > 0 ? (resultadoNeto / activoTotal) * 100 : 0;
      const roaAnualizadoPorcentaje = activoTotal > 0 ? (resultadoNetoAnualizado / activoTotal) * 100 : 0;
      const roa = {
        valorPeriodo: roaPeriodoPorcentaje,
        valorAnualizado: roaAnualizadoPorcentaje,
        indicador: determinarIndicadorROA(roaAnualizadoPorcentaje),
        mesesPeriodo: meses,
        factorAnualizacion
      };

      // 5. ROE = Resultado Neto / Patrimonio Neto × 100
      const roePeriodoPorcentaje = patrimonioNeto > 0 ? (resultadoNeto / patrimonioNeto) * 100 : 0;
      const roeAnualizadoPorcentaje = patrimonioNeto > 0 ? (resultadoNetoAnualizado / patrimonioNeto) * 100 : 0;
      const roe = {
        valorPeriodo: roePeriodoPorcentaje,
        valorAnualizado: roeAnualizadoPorcentaje,
        indicador: determinarIndicadorROE(roeAnualizadoPorcentaje, patrimonioNeto),
        mesesPeriodo: meses,
        factorAnualizacion
      };

      console.log('📈 Ratios de rentabilidad calculados:', {
        margenBruto: margenBrutoPorcentaje.toFixed(2) + '%',
        margenOperativo: margenOperativoPorcentaje.toFixed(2) + '%',
        margenNeto: margenNetoPorcentaje.toFixed(2) + '%',
        roaPeriodo: roaPeriodoPorcentaje.toFixed(2) + '%',
        roaAnualizado: roaAnualizadoPorcentaje.toFixed(2) + '%',
        roePeriodo: roePeriodoPorcentaje.toFixed(2) + '%',
        roeAnualizado: roeAnualizadoPorcentaje.toFixed(2) + '%'
      });

      return {
        // Valores base
        ventas,
        cmv,
        gastosOperativos,
        ebit,
        resultadoNeto,
        resultadoNetoAnualizado,
        activoTotal,
        patrimonioNeto,
        // Ratios calculados
        margenBruto,
        margenOperativo,
        margenNeto,
        roa,
        roe,
        // Metadata
        mesesPeriodo: meses,
        factorAnualizacion,
        fechaDesde: fechaInicio,
        fechaHasta: fechaFin
      };

    } catch (error) {
      console.error('❌ Error calculando ratios de rentabilidad:', error);
      throw error;
    }
  },

  async calcularRatiosEficiencia(fechaDesde, fechaHasta) {
    console.log('📊 Calculando ratios de eficiencia operacional...', { fechaDesde, fechaHasta });

    try {
      const fechaInicio = fechaDesde || obtenerFechaLocal();
      const fechaFin = fechaHasta || obtenerFechaLocal();

      console.log('📅 Período de análisis:', {
        desde: fechaInicio,
        hasta: fechaFin
      });

      // Obtener asientos del período
      const { data: asientos, error: errorAsientos } = await supabase
        .from('asientos_contables')
        .select('id')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);

      if (errorAsientos) throw errorAsientos;

      if (!asientos || asientos.length === 0) {
        console.log('ℹ️ No hay asientos en el período de eficiencia');
        return {
          ventas: 0,
          cmv: 0,
          compras: 0,
          inventarioPromedio: 0,
          cxcPromedio: 0,
          cxpPromedio: 0,
          rotacionInventario: { valor: 0, indicador: determinarIndicadorRotacionInventario(0) },
          diasInventario: { valor: 0, indicador: determinarIndicadorDiasInventario(0) },
          rotacionCxC: { valor: 0, indicador: determinarIndicadorRotacionCxC(0) },
          diasCobro: { valor: 0, indicador: determinarIndicadorDiasCobro(0) },
          rotacionCxP: { valor: 0, indicador: determinarIndicadorRotacionCxP(0) },
          diasPago: { valor: 0, indicador: determinarIndicadorDiasPago(0) },
          cicloCaja: { valor: 0, indicador: determinarIndicadorCicloCaja(0) },
          fechaDesde: fechaInicio,
          fechaHasta: fechaFin
        };
      }

      const asientoIds = asientos.map(a => a.id);

      // Obtener movimientos en lotes
      const BATCH_SIZE = 200;
      let todosLosMovimientos = [];

      for (let i = 0; i < asientoIds.length; i += BATCH_SIZE) {
        const batch = asientoIds.slice(i, i + BATCH_SIZE);

        const { data: movimientosBatch, error: errorBatch } = await supabase
          .from('movimientos_contables')
          .select(`
            *,
            plan_cuentas (id, codigo, nombre, tipo, categoria)
          `)
          .in('asiento_id', batch);

        if (errorBatch) throw errorBatch;
        todosLosMovimientos = todosLosMovimientos.concat(movimientosBatch);
      }

      const movimientos = todosLosMovimientos;
      console.log(`📊 EFICIENCIA - Total movimientos procesados:`, movimientos.length);

      // ===============================
      // Calcular componentes principales (REUTILIZAR lógica de rentabilidad)
      // ===============================

      // VENTAS (4.1): Se acreditan (haber) cuando se genera ingreso
      const ventas = movimientos
        .filter(mov => mov.plan_cuentas?.codigo?.startsWith('4.1'))
        .reduce((sum, mov) => sum + parseFloat(mov.haber || 0), 0);

      // CMV (5.0): Se debita (debe) cuando se registra el costo
      const cmv = calcularDebitos(movimientos, (mov) => mov.plan_cuentas?.codigo?.startsWith('5.0'));

      // COMPRAS (1.1.04.01): Se debita (debe) cuando se registran compras de mercadería
      const compras = calcularDebitos(movimientos, (mov) => mov.plan_cuentas?.codigo?.startsWith('1.1.04.01'));

      console.log('💰 Componentes de eficiencia:', {
        ventas: ventas.toFixed(2) + ' (HABER)',
        cmv: cmv.toFixed(2) + ' (DEBE)',
        compras: compras.toFixed(2) + ' (DEBE)'
      });

      // ===============================
      // Obtener Balances de inicio y fin del período
      // ===============================

      const [balanceInicio, balanceFin] = await Promise.all([
        estadoSituacionPatrimonialService.getBalanceGeneral(fechaInicio),
        estadoSituacionPatrimonialService.getBalanceGeneral(fechaFin)
      ]);

      // Validar que el balance de fin tenga datos (es el más importante)
      if (!balanceFin || !balanceFin.activosDetalle || !balanceFin.pasivosDetalle) {
        console.warn('⚠️ Balance de fin sin datos, retornando valores en cero');
        return {
          ventas: 0,
          cmv: 0,
          compras: 0,
          inventarioPromedio: 0,
          cxcPromedio: 0,
          cxpPromedio: 0,
          rotacionInventario: { valor: 0, indicador: determinarIndicadorRotacionInventario(0) },
          diasInventario: { valor: 0, indicador: determinarIndicadorDiasInventario(0) },
          rotacionCxC: { valor: 0, indicador: determinarIndicadorRotacionCxC(0) },
          diasCobro: { valor: 0, indicador: determinarIndicadorDiasCobro(0) },
          rotacionCxP: { valor: 0, indicador: determinarIndicadorRotacionCxP(0) },
          diasPago: { valor: 0, indicador: determinarIndicadorDiasPago(0) },
          cicloCaja: { valor: 0, indicador: determinarIndicadorCicloCaja(0) },
          fechaDesde: fechaInicio,
          fechaHasta: fechaFin
        };
      }

      // Si el balance de inicio no tiene datos, usar el balance de fin para ambos
      // (no calculamos promedio, usamos el balance actual)
      let balanceInicioFinal = balanceInicio;
      if (!balanceInicio || !balanceInicio.activosDetalle || !balanceInicio.pasivosDetalle) {
        console.warn('⚠️ Balance de inicio sin datos, usando balance de fin para cálculos');
        balanceInicioFinal = balanceFin;
      }

      // ===============================
      // Calcular promedios de cuentas de balance
      // ===============================

      // Inventario Promedio (1.1.04.xx)
      const inventarioInicio = (balanceInicioFinal.activosDetalle || [])
        .filter(item => estadoSituacionPatrimonialService.esActivoCorriente(item.cuenta) && esInventario(item.cuenta))
        .reduce((sum, item) => sum + item.saldo, 0);

      const inventarioFin = (balanceFin.activosDetalle || [])
        .filter(item => estadoSituacionPatrimonialService.esActivoCorriente(item.cuenta) && esInventario(item.cuenta))
        .reduce((sum, item) => sum + item.saldo, 0);

      const inventarioPromedio = (inventarioInicio + inventarioFin) / 2;

      // Cuentas por Cobrar Promedio (1.1.02.xx)
      const cxcInicio = (balanceInicioFinal.activosDetalle || [])
        .filter(item => esCuentaPorCobrar(item.cuenta))
        .reduce((sum, item) => sum + item.saldo, 0);

      const cxcFin = (balanceFin.activosDetalle || [])
        .filter(item => esCuentaPorCobrar(item.cuenta))
        .reduce((sum, item) => sum + item.saldo, 0);

      const cxcPromedio = (cxcInicio + cxcFin) / 2;

      // Cuentas por Pagar Promedio (2.1.xx)
      const cxpInicio = (balanceInicioFinal.pasivosDetalle || [])
        .filter(item => esCuentaPorPagar(item.cuenta))
        .reduce((sum, item) => sum + item.saldo, 0);

      const cxpFin = (balanceFin.pasivosDetalle || [])
        .filter(item => esCuentaPorPagar(item.cuenta))
        .reduce((sum, item) => sum + item.saldo, 0);

      const cxpPromedio = (cxpInicio + cxpFin) / 2;

      const usoBalanceFin = balanceInicioFinal === balanceFin;
      console.log('📊 Promedios de balance:', {
        usoBalanceFin: usoBalanceFin ? 'SÍ (no había datos de inicio)' : 'NO (cálculo normal)',
        inventarioInicio: inventarioInicio.toFixed(2),
        inventarioFin: inventarioFin.toFixed(2),
        inventarioPromedio: inventarioPromedio.toFixed(2),
        cxcInicio: cxcInicio.toFixed(2),
        cxcFin: cxcFin.toFixed(2),
        cxcPromedio: cxcPromedio.toFixed(2),
        cxpInicio: cxpInicio.toFixed(2),
        cxpFin: cxpFin.toFixed(2),
        cxpPromedio: cxpPromedio.toFixed(2)
      });

      // ===============================
      // Calcular Ratios de Eficiencia
      // ===============================

      // 1. Rotación de Inventario = CMV / Inventario Promedio
      const rotacionInventarioValor = inventarioPromedio > 0 ? cmv / inventarioPromedio : 0;
      const rotacionInventario = {
        valor: rotacionInventarioValor,
        indicador: determinarIndicadorRotacionInventario(rotacionInventarioValor)
      };

      // 2. Días de Inventario = 365 / Rotación de Inventario
      const diasInventarioValor = rotacionInventarioValor > 0 ? 365 / rotacionInventarioValor : 0;
      const diasInventario = {
        valor: diasInventarioValor,
        indicador: determinarIndicadorDiasInventario(diasInventarioValor)
      };

      // 3. Rotación de Cuentas por Cobrar = Ventas / CxC Promedio
      const rotacionCxCValor = cxcPromedio > 0 ? ventas / cxcPromedio : 0;
      const rotacionCxC = {
        valor: rotacionCxCValor,
        indicador: determinarIndicadorRotacionCxC(rotacionCxCValor)
      };

      // 4. Días de Cobro = 365 / Rotación CxC
      const diasCobroValor = rotacionCxCValor > 0 ? 365 / rotacionCxCValor : 0;
      const diasCobro = {
        valor: diasCobroValor,
        indicador: determinarIndicadorDiasCobro(diasCobroValor)
      };

      // 5. Rotación de Cuentas por Pagar = Compras / CxP Promedio
      const rotacionCxPValor = cxpPromedio > 0 ? compras / cxpPromedio : 0;
      const rotacionCxP = {
        valor: rotacionCxPValor,
        indicador: determinarIndicadorRotacionCxP(rotacionCxPValor)
      };

      // 6. Días de Pago = 365 / Rotación CxP
      const diasPagoValor = rotacionCxPValor > 0 ? 365 / rotacionCxPValor : 0;
      const diasPago = {
        valor: diasPagoValor,
        indicador: determinarIndicadorDiasPago(diasPagoValor)
      };

      // 7. Ciclo de Conversión de Efectivo = Días Inventario + Días Cobro - Días Pago
      const cicloCajaValor = diasInventarioValor + diasCobroValor - diasPagoValor;
      const cicloCaja = {
        valor: cicloCajaValor,
        indicador: determinarIndicadorCicloCaja(cicloCajaValor)
      };

      console.log('📈 Ratios de eficiencia calculados:', {
        rotacionInventario: rotacionInventarioValor.toFixed(2),
        diasInventario: diasInventarioValor.toFixed(0),
        rotacionCxC: rotacionCxCValor.toFixed(2),
        diasCobro: diasCobroValor.toFixed(0),
        rotacionCxP: rotacionCxPValor.toFixed(2),
        diasPago: diasPagoValor.toFixed(0),
        cicloCaja: cicloCajaValor.toFixed(0)
      });

      return {
        // Valores base
        ventas,
        cmv,
        compras,
        inventarioPromedio,
        cxcPromedio,
        cxpPromedio,
        // Componentes de balance
        inventarioInicio,
        inventarioFin,
        cxcInicio,
        cxcFin,
        cxpInicio,
        cxpFin,
        // Ratios calculados
        rotacionInventario,
        diasInventario,
        rotacionCxC,
        diasCobro,
        rotacionCxP,
        diasPago,
        cicloCaja,
        // Metadata
        fechaDesde: fechaInicio,
        fechaHasta: fechaFin
      };

    } catch (error) {
      console.error('❌ Error calculando ratios de eficiencia:', error);
      throw error;
    }
  }
};

// Hook personalizado para Ratios Financieros
export function useRatiosFinancieros() {
  const [ratios, setRatios] = useState(null);
  const [ratioSobrecompra, setRatioSobrecompra] = useState(null);
  const [ratiosRentabilidad, setRatiosRentabilidad] = useState(null);
  const [ratiosEficiencia, setRatiosEficiencia] = useState(null);
  const [datosDebug, setDatosDebug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);
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

  // Función unificada para calcular TODOS los ratios de período en paralelo
  const calcularRatiosPeriodo = async (fechaDesde, fechaHasta) => {
    console.log('🚀 Calculando TODOS los ratios de período en paralelo:', { fechaDesde, fechaHasta });
    setLoadingPeriodo(true);
    setError(null);

    try {
      // Calcular todos los ratios en paralelo con Promise.all
      const [rentabilidad, eficiencia, sobrecompra] = await Promise.all([
        ratiosFinancierosService.calcularRatiosRentabilidad(fechaDesde, fechaHasta),
        ratiosFinancierosService.calcularRatiosEficiencia(fechaDesde, fechaHasta),
        ratiosFinancierosService.calcularRatioSobrecompra(fechaDesde, fechaHasta)
      ]);

      // Actualizar todos los estados juntos
      setRatiosRentabilidad(rentabilidad);
      setRatiosEficiencia(eficiencia);
      setRatioSobrecompra(sobrecompra);

      console.log('✅ Todos los ratios de período calculados exitosamente');
    } catch (err) {
      console.error('❌ Error calculando ratios de período:', err);
      setError(err.message || 'Error calculando ratios de período');
    } finally {
      setLoadingPeriodo(false);
    }
  };

  // Funciones individuales (deprecated - mantener para compatibilidad pero usar calcularRatiosPeriodo)
  const calcularRentabilidad = async (fechaDesde, fechaHasta) => {
    await calcularRatiosPeriodo(fechaDesde, fechaHasta);
  };

  const calcularEficiencia = async (fechaDesde, fechaHasta) => {
    await calcularRatiosPeriodo(fechaDesde, fechaHasta);
  };

  // Calcular automáticamente al montar (fecha actual)
  useEffect(() => {
    console.log('🚀 Iniciando cálculo de ratios financieros...');

    const inicializar = async () => {
      // Calcular liquidez primero
      await calcularRatios();

      // Generar datos de debug para el período inicial (mes actual completo)
      const hoy = new Date();
      const fechaHasta = hoy.getFullYear() + '-' +
                         String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
                         String(hoy.getDate()).padStart(2, '0');

      // Primer día del mes actual
      const fechaDesdeDate = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const fechaDesde = fechaDesdeDate.getFullYear() + '-' +
                         String(fechaDesdeDate.getMonth() + 1).padStart(2, '0') + '-' +
                         String(fechaDesdeDate.getDate()).padStart(2, '0');

      console.log(`📅 Calculando ratios de período inicial: ${fechaDesde} al ${fechaHasta}`);

      // Calcular ratios de período y debug en paralelo
      await Promise.all([
        calcularRatiosPeriodo(fechaDesde, fechaHasta),
        generarDatosDebug(fechaDesde, fechaHasta)
      ]);
    };

    inicializar();
  }, []);

  // Función para recalcular ratio de sobrecompra con período específico (deprecated)
  const calcularSobrecompra = async (fechaDesde, fechaHasta) => {
    await calcularRatiosPeriodo(fechaDesde, fechaHasta);
  };

  // Función para generar datos de debug
  const generarDatosDebug = async (fechaDesde, fechaHasta) => {
    try {
      console.log('🔍 Generando datos de debug...', { fechaDesde, fechaHasta });

      // Obtener asientos del período
      const { data: asientos, error: errorAsientos } = await supabase
        .from('asientos_contables')
        .select('id')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta);

      if (errorAsientos) throw errorAsientos;
      if (!asientos || asientos.length === 0) return null;

      const asientoIds = asientos.map(a => a.id);

      // Obtener movimientos
      const BATCH_SIZE = 200;
      let todosLosMovimientos = [];

      for (let i = 0; i < asientoIds.length; i += BATCH_SIZE) {
        const batch = asientoIds.slice(i, i + BATCH_SIZE);
        const { data: movimientosBatch, error: errorBatch } = await supabase
          .from('movimientos_contables')
          .select(`
            *,
            plan_cuentas (id, codigo, nombre, tipo, categoria)
          `)
          .in('asiento_id', batch);

        if (errorBatch) throw errorBatch;
        todosLosMovimientos = todosLosMovimientos.concat(movimientosBatch);
      }

      // Obtener balance para activo/pasivo corriente e inventario
      const balance = await estadoSituacionPatrimonialService.getBalanceGeneral(fechaHasta);

      // Función auxiliar para agrupar movimientos por cuenta
      const agruparPorCuenta = (movimientos, filtro) => {
        const cuentasMap = {};
        const filtrar = typeof filtro === 'function' ? filtro : (mov) => mov.plan_cuentas?.codigo?.startsWith(filtro);

        movimientos.filter(filtrar).forEach(mov => {
          const cuenta = mov.plan_cuentas;
          if (!cuenta) return;

          if (!cuentasMap[cuenta.id]) {
            cuentasMap[cuenta.id] = {
              codigo: cuenta.codigo,
              nombre: cuenta.nombre,
              tipo: cuenta.tipo,
              debe: 0,
              haber: 0,
              saldo: 0
            };
          }

          cuentasMap[cuenta.id].debe += parseFloat(mov.debe || 0);
          cuentasMap[cuenta.id].haber += parseFloat(mov.haber || 0);
        });

        // Calcular saldos usando la función centralizada
        const cuentas = Object.values(cuentasMap).map(cuenta => ({
          ...cuenta,
          saldo: calcularSaldoCuenta(cuenta.debe, cuenta.haber, cuenta.tipo)
        }));

        const totalDebitos = cuentas.reduce((sum, c) => sum + c.debe, 0);
        const totalCreditos = cuentas.reduce((sum, c) => sum + c.haber, 0);
        const saldo = cuentas.reduce((sum, c) => sum + c.saldo, 0);

        return { cuentas, totalDebitos, totalCreditos, saldo };
      };

      // Función auxiliar para balance
      const agruparPorBalance = (cuentasDetalle) => {
        const cuentas = cuentasDetalle.map(item => ({
          codigo: item.cuenta.codigo,
          nombre: item.cuenta.nombre,
          tipo: item.cuenta.tipo,
          debe: item.debe,
          haber: item.haber,
          saldo: item.saldo
        }));

        const totalDebitos = cuentas.reduce((sum, c) => sum + c.debe, 0);
        const totalCreditos = cuentas.reduce((sum, c) => sum + c.haber, 0);
        const saldo = cuentas.reduce((sum, c) => sum + c.saldo, 0);

        return { cuentas, totalDebitos, totalCreditos, saldo };
      };

      // Generar datos para cada categoría
      const debug = {
        activo_corriente: agruparPorBalance(
          balance.activosDetalle.filter(item => estadoSituacionPatrimonialService.esActivoCorriente(item.cuenta))
        ),
        pasivo_corriente: agruparPorBalance(
          balance.pasivosDetalle.filter(item => estadoSituacionPatrimonialService.esPasivoCorriente(item.cuenta))
        ),
        inventario: agruparPorBalance(
          balance.activosDetalle.filter(item =>
            estadoSituacionPatrimonialService.esActivoCorriente(item.cuenta) && esInventario(item.cuenta)
          )
        ),
        ventas: agruparPorCuenta(todosLosMovimientos, '4.1'),
        cmv: agruparPorCuenta(todosLosMovimientos, '5.0'),
        gastos_operativos: agruparPorCuenta(todosLosMovimientos, '5.1'),
        compras: agruparPorCuenta(todosLosMovimientos, '1.1.04.01') // Solo 1.1.04.01.x (Bienes de Cambio - Mercaderías)
      };

      setDatosDebug(debug);
      console.log('✅ Datos de debug generados:', debug);
    } catch (err) {
      console.error('❌ Error generando datos de debug:', err);
    }
  };

  return {
    ratios,
    ratioSobrecompra,
    ratiosRentabilidad,
    ratiosEficiencia,
    datosDebug,
    loading,
    loadingPeriodo,
    error,
    refetch: calcularRatios,
    calcularRatiosPeriodo,
    calcularRentabilidad,
    calcularEficiencia,
    calcularSobrecompra,
    generarDatosDebug
  };
}
