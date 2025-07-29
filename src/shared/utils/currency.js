// Utilidades de conversión de moneda unificadas
// src/shared/utils/currency.js

/**
 * Valida que una cotización sea razonable
 */
export const validarCotizacion = (cotizacion) => {
  return typeof cotizacion === 'number' && 
         cotizacion > 0 && 
         cotizacion < 10000 && 
         !isNaN(cotizacion);
};

/**
 * Valida rango de cotización para prevenir errores
 */
export const validarRangoCotizacion = (cotizacion) => {
  if (!cotizacion || cotizacion <= 0) {
    throw new Error('Cotización inválida. Debe ser mayor a 0');
  }
  
  if (cotizacion < 500 || cotizacion > 10000) {
    throw new Error('Cotización fuera del rango válido (500-10000)');
  }
  
  return true;
};

/**
 * Convierte ARS a USD usando cotización específica
 */
export const convertirARSaUSD = (montoARS, cotizacion) => {
  if (!montoARS || montoARS < 0) {
    throw new Error('Monto en ARS inválido');
  }
  
  validarRangoCotizacion(cotizacion);
  
  return parseFloat((montoARS / cotizacion).toFixed(4));
};

/**
 * Convierte USD a ARS usando cotización específica
 */
export const convertirUSDaARS = (montoUSD, cotizacion) => {
  if (!montoUSD || montoUSD < 0) {
    throw new Error('Monto en USD inválido');
  }
  
  validarRangoCotizacion(cotizacion);
  
  return parseFloat((montoUSD * cotizacion).toFixed(2));
};

/**
 * Crea resultado estándar de conversión ARS → USD
 */
export const crearResultadoConversionARS = (montoARS, cotizacion, fuente = 'MANUAL') => {
  const montoUSD = convertirARSaUSD(montoARS, cotizacion);
  
  return {
    montoOriginalARS: montoARS,
    montoUSD: montoUSD,
    cotizacionUsada: cotizacion,
    fuenteCotizacion: fuente,
    timestamp: new Date().toISOString()
  };
};

/**
 * Crea resultado estándar de conversión USD → ARS
 */
export const crearResultadoConversionUSD = (montoUSD, cotizacion, fuente = 'MANUAL') => {
  const montoARS = convertirUSDaARS(montoUSD, cotizacion);
  
  return {
    montoOriginalUSD: montoUSD,
    montoARS: montoARS,
    cotizacionUsada: cotizacion,
    fuenteCotizacion: fuente,
    timestamp: new Date().toISOString()
  };
};

/**
 * Valida que un asiento esté balanceado en USD
 */
export const validarBalanceUSD = (movimientos, tolerancia = 0.01) => {
  const totalDebe = movimientos.reduce((sum, mov) => sum + (parseFloat(mov.debe) || 0), 0);
  const totalHaber = movimientos.reduce((sum, mov) => sum + (parseFloat(mov.haber) || 0), 0);
  const diferencia = Math.abs(totalDebe - totalHaber);
  const balanceado = diferencia <= tolerancia;

  const resultado = {
    totalDebe: parseFloat(totalDebe.toFixed(4)),
    totalHaber: parseFloat(totalHaber.toFixed(4)),
    diferencia: parseFloat(diferencia.toFixed(4)),
    balanceado: balanceado
  };

  if (!balanceado) {
    throw new Error(
      `Asiento no balanceado en USD:\n` +
      `Debe: $${resultado.totalDebe.toFixed(4)} USD\n` +
      `Haber: $${resultado.totalHaber.toFixed(4)} USD\n` +
      `Diferencia: $${resultado.diferencia.toFixed(4)} USD`
    );
  }

  return resultado;
};

/**
 * Calcula cotización promedio ponderada por monto
 */
export const calcularCotizacionPromedio = (movimientos) => {
  const movimientosConCotizacion = movimientos.filter(mov => 
    mov.cuenta?.requiere_cotizacion && mov.cotizacion
  );
  
  if (movimientosConCotizacion.length === 0) {
    return null;
  }
  
  let sumaPonderada = 0;
  let sumaMontos = 0;
  
  movimientosConCotizacion.forEach(mov => {
    const peso = mov.monto || 0;
    sumaPonderada += (mov.cotizacion * peso);
    sumaMontos += peso;
  });
  
  return sumaMontos > 0 ? sumaPonderada / sumaMontos : null;
};

/**
 * Determina si una cuenta requiere conversión a USD
 */
export const requiereConversion = (cuenta) => {
  return cuenta?.requiere_cotizacion || cuenta?.moneda_original === 'ARS';
};

/**
 * Prepara movimiento contable con o sin conversión
 */
export const prepararMovimientoContable = (movimientoData, cuenta, cotizacion = null) => {
  const { monto, tipo } = movimientoData; // tipo: 'debe' o 'haber'
  
  if (requiereConversion(cuenta)) {
    if (!cotizacion) {
      throw new Error(`Cuenta "${cuenta.nombre}" requiere cotización para convertir ARS a USD`);
    }
    
    const conversion = crearResultadoConversionARS(monto, cotizacion);
    
    return {
      cuenta_id: cuenta.id,
      debe: tipo === 'debe' ? conversion.montoUSD : 0,
      haber: tipo === 'haber' ? conversion.montoUSD : 0,
      monto_original_ars: conversion.montoOriginalARS,
      cotizacion_manual: conversion.cotizacionUsada,
      observaciones_cambio: `Convertido: ${monto} ARS → ${conversion.montoUSD.toFixed(4)} USD (cotización: ${conversion.cotizacionUsada})`
    };
  } else {
    return {
      cuenta_id: cuenta.id,
      debe: tipo === 'debe' ? monto : 0,
      haber: tipo === 'haber' ? monto : 0
      // No agregar campos de conversión para cuentas USD (constraint check)
    };
  }
};

export default {
  validarCotizacion,
  validarRangoCotizacion,
  convertirARSaUSD,
  convertirUSDaARS,
  crearResultadoConversionARS,
  crearResultadoConversionUSD,
  validarBalanceUSD,
  calcularCotizacionPromedio,
  requiereConversion,
  prepararMovimientoContable
};