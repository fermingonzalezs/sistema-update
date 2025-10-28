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

      // Calcular componentes principales usando función centralizada
      const ventas = calcularTotalCategoria(movimientos, '4.1'); // Ventas
      const cmv = Math.abs(calcularTotalCategoria(movimientos, '5.0')); // CMV (valor absoluto)
      const gastosOperativos = Math.abs(calcularTotalCategoria(movimientos, '5.1')); // Gastos operativos (5.1.xx)

      // Calcular EBIT (Earnings Before Interest and Taxes)
      const ebit = ventas - cmv - gastosOperativos;

      // Calcular Resultado Neto (simplificado: EBIT sin ajustar por intereses e impuestos)
      // En tu caso, el resultado neto es el EBIT ya que no tienes cuentas de intereses/impuestos separadas
      const resultadoNeto = ebit;
      const resultadoNetoAnualizado = resultadoNeto * factorAnualizacion;

      console.log('💰 Componentes de rentabilidad:', {
        ventas: ventas.toFixed(2),
        cmv: cmv.toFixed(2),
        gastosOperativos: gastosOperativos.toFixed(2),
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
        activoInicio: balanceInicio.totalActivos.toFixed(2),
        activoFin: balanceFin.totalActivos.toFixed(2),
        activoPromedio: activoTotal.toFixed(2),
        patrimonioInicio: balanceInicio.totalPatrimonio.toFixed(2),
        patrimonioFin: balanceFin.totalPatrimonio.toFixed(2),
        patrimonioPromedio: patrimonioNeto.toFixed(2)
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
  }
};

// Hook personalizado para Ratios Financieros
export function useRatiosFinancieros() {
  const [ratios, setRatios] = useState(null);
  const [ratioSobrecompra, setRatioSobrecompra] = useState(null);
  const [ratiosRentabilidad, setRatiosRentabilidad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRentabilidad, setLoadingRentabilidad] = useState(false);
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

  // Función para calcular ratios de rentabilidad con período personalizado
  const calcularRentabilidad = async (fechaDesde, fechaHasta) => {
    setLoadingRentabilidad(true);
    setError(null);

    try {
      const rentabilidad = await ratiosFinancierosService.calcularRatiosRentabilidad(fechaDesde, fechaHasta);
      setRatiosRentabilidad(rentabilidad);
      console.log('✅ Ratios de rentabilidad calculados exitosamente');
    } catch (err) {
      console.error('Error calculando ratios de rentabilidad:', err);
      setError(err.message || 'Error calculando ratios de rentabilidad');
    } finally {
      setLoadingRentabilidad(false);
    }
  };

  // Calcular automáticamente al montar (fecha actual)
  useEffect(() => {
    console.log('🚀 Iniciando cálculo de ratios financieros...');
    calcularRatios();
  }, []);

  // Función para recalcular ratio de sobrecompra con período específico
  const calcularSobrecompra = async (fechaDesde, fechaHasta) => {
    try {
      console.log('📊 Calculando ratio de sobrecompra para período:', { fechaDesde, fechaHasta });
      const sobrecompra = await ratiosFinancierosService.calcularRatioSobrecompra(fechaDesde, fechaHasta);
      setRatioSobrecompra(sobrecompra);
    } catch (err) {
      console.error('Error calculando ratio de sobrecompra:', err);
      setError(err.message);
    }
  };

  return {
    ratios,
    ratioSobrecompra,
    ratiosRentabilidad,
    loading,
    loadingRentabilidad,
    error,
    refetch: calcularRatios,
    calcularRentabilidad,
    calcularSobrecompra
  };
}
