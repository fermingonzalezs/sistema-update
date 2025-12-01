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
 * Obtiene la fecha actual en formato YYYY-MM-DD en zona horaria local (Argentina)
 * Evita problemas de conversión UTC que pueden causar desfase de un día
 * Usar esta función en lugar de new Date().toISOString().split('T')[0]
 */
export const obtenerFechaLocal = () => {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
};

/**
 * Convierte una fecha en formato YYYY-MM-DD a un objeto Date en zona horaria local
 * Evita problemas de conversión UTC que causan desfase de fechas
 * USO: Para cumpleaños, fechas de nacimiento, o cualquier fecha sin hora específica
 *
 * PROBLEMA: new Date('2024-01-23') interpreta como UTC y puede restar un día
 * SOLUCIÓN: Separar componentes y crear Date en zona local
 *
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @returns {Date} Objeto Date en zona horaria local
 */
export const parseFechaLocal = (fechaString) => {
  if (!fechaString) return null;
  const [year, month, day] = fechaString.split('-').map(num => parseInt(num, 10));
  return new Date(year, month - 1, day); // month - 1 porque Date usa índice 0-11
};

/**
 * Convierte un objeto Date a formato YYYY-MM-DD en zona horaria local
 * Evita problemas de conversión UTC
 * USO: Para guardar fechas en la base de datos o inputs type="date"
 *
 * @param {Date} fecha - Objeto Date
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const formatearFechaParaInput = (fecha) => {
  if (!fecha) return '';
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formatea una fecha en formato YYYY-MM-DD a formato local (DD/MM/YYYY) sin problemas de zona horaria
 * Evita que new Date('2024-09-01') se interprete como UTC y reste un día
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada en formato DD/MM/YYYY
 */
export const formatearFechaReporte = (fechaString) => {
  if (!fechaString) return '';
  // Separar la fecha en partes para crear Date en zona local
  const [year, month, day] = fechaString.split('-');
  const fecha = new Date(year, month - 1, day);
  return fecha.toLocaleDateString('es-AR');
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

/**
 * Formatea montos con símbolo de moneda usando Intl.NumberFormat
 * Unifica el formateo de toda la aplicación
 */
export const formatearMonto = (monto, moneda = 'USD', mostrarSimbolo = true) => {
  if (!monto && monto !== 0) return mostrarSimbolo ? (moneda === 'USD' ? 'U$0' : '$0') : '0';
  
  const formatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  const montoFormateado = formatter.format(Math.abs(monto));
  const simbolo = moneda === 'USD' ? 'U$' : '$';
  
  if (!mostrarSimbolo) return montoFormateado;
  
  return `${simbolo}${montoFormateado}`;
};

/**
 * Formatea montos con decimales para reportes y cálculos precisos
 */
export const formatearMontoCompleto = (monto, moneda = 'USD') => {
  if (!monto && monto !== 0) return moneda === 'USD' ? 'U$0.0000' : '$0.00';
  
  const decimales = moneda === 'USD' ? 4 : 2;
  const formatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
  
  const simbolo = moneda === 'USD' ? 'U$' : '$';
  return `${simbolo}${formatter.format(monto)}`;
};

/**
 * Valida que un monto sea numérico y positivo
 */
export const validarMonto = (monto) => {
  const numero = parseFloat(monto);
  return !isNaN(numero) && numero >= 0;
};

export default {
  formatearMonedaLibroDiario,
  formatearMonedaGeneral,
  formatearNumeroReporte,
  formatearFecha,
  formatearFechaInput,
  obtenerFechaLocal,
  parseFechaLocal,
  formatearFechaParaInput,
  formatearFechaReporte,
  esMonedaUSD,
  formatearMonto,
  formatearMontoCompleto,
  validarMonto
};