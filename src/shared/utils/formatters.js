// Utilidades de formateo para el sistema contable
// src/shared/utils/formatters.js

/**
 * Formatea números para mostrar en el libro diario
 * Los USD aparecen con U$ y los ARS con $
 * Siempre 2 decimales
 */
export const formatearMonedaLibroDiario = (valor, esUSD = true) => {
  const numero = parseFloat(valor || 0).toFixed(2);
  const formateado = parseFloat(numero).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return esUSD ? `U$${formateado}` : `$${formateado}`;
};

/**
 * Formatea números para mostrar en interfaz general
 * USD sin decimales, ARS sin decimales
 */
export const formatearMonedaGeneral = (valor, moneda = 'USD') => {
  const numero = parseFloat(valor || 0);
  const formateado = numero.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  if (moneda === 'USD') {
    return `U$${formateado}`;
  } else if (moneda === 'ARS') {
    return `$${formateado}`;
  }
  
  return `U$${formateado}`; // Por defecto USD
};

/**
 * Formatea números para mostrar en reportes
 * Con separadores de miles y 2 decimales
 */
export const formatearNumeroReporte = (valor) => {
  return parseFloat(valor || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formatea fechas para mostrar en el sistema
 */
export const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-AR');
};

/**
 * Formatea fechas para inputs type="date"
 */
export const formatearFechaInput = (fecha) => {
  return new Date(fecha).toISOString().split('T')[0];
};

/**
 * Determina si un valor es USD o ARS basado en contexto
 */
export const esMonedaUSD = (cuenta, monto, contexto = 'general') => {
  // En el libro diario, todos los valores se consideran USD
  if (contexto === 'libro-diario') {
    return true;
  }
  
  // En otros contextos, verificar la cuenta
  if (cuenta && cuenta.moneda_original) {
    return cuenta.moneda_original === 'USD';
  }
  
  // Por defecto, asumir USD
  return true;
};

export default {
  formatearMonedaLibroDiario,
  formatearMonedaGeneral,
  formatearNumeroReporte,
  formatearFecha,
  formatearFechaInput,
  esMonedaUSD
};