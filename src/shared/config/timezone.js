/**
 * Configuración de zona horaria para toda la aplicación
 * Sistema Update opera en Argentina (UTC-3)
 *
 * PROBLEMA: JavaScript en el navegador usa la zona horaria del sistema operativo.
 * Si el servidor/DB está en UTC y el cliente en Argentina, puede haber desfases.
 *
 * SOLUCIÓN: Este módulo centraliza todas las operaciones de fecha/hora para
 * asegurar consistencia en toda la aplicación.
 */

// Zona horaria de Argentina (UTC-3 o UTC-3 DST según la época)
export const TIMEZONE_ARGENTINA = 'America/Argentina/Buenos_Aires';

/**
 * Obtiene la fecha y hora actual en Argentina como objeto Date
 * @returns {Date} Fecha/hora actual en Argentina
 */
export const obtenerFechaHoraArgentina = () => {
  return new Date();
};

/**
 * Obtiene la fecha actual en Argentina en formato YYYY-MM-DD
 * Evita problemas de conversión UTC
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const obtenerFechaArgentina = () => {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, '0');
  const day = String(ahora.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene timestamp actual para campos created_at/updated_at
 * Retorna ISO string que Supabase/PostgreSQL interpreta correctamente
 * @returns {string} Timestamp en formato ISO
 */
export const obtenerTimestampActual = () => {
  return new Date().toISOString();
};

/**
 * Convierte una fecha YYYY-MM-DD a Date en zona horaria local (Argentina)
 * IMPORTANTE: NO usar new Date('2024-01-23') porque interpreta como UTC
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @returns {Date|null} Objeto Date en zona local o null si inválida
 */
export const parsearFechaLocal = (fechaString) => {
  if (!fechaString) return null;
  const [year, month, day] = fechaString.split('-').map(num => parseInt(num, 10));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

/**
 * Convierte Date a formato YYYY-MM-DD en zona local
 * Útil para inputs type="date" y almacenamiento en DB
 * @param {Date} fecha - Objeto Date
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const formatearFechaLocal = (fecha) => {
  if (!fecha || !(fecha instanceof Date)) return '';
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formatea fecha para mostrar al usuario (DD/MM/YYYY)
 * @param {string|Date} fecha - Fecha en formato YYYY-MM-DD o Date
 * @returns {string} Fecha formateada DD/MM/YYYY
 */
export const formatearFechaDisplay = (fecha) => {
  if (!fecha) return '';

  // Si es string YYYY-MM-DD, parsearlo localmente
  if (typeof fecha === 'string') {
    const fechaObj = parsearFechaLocal(fecha);
    if (!fechaObj) return '';
    return fechaObj.toLocaleDateString('es-AR');
  }

  // Si es Date, formatear directamente
  if (fecha instanceof Date) {
    return fecha.toLocaleDateString('es-AR');
  }

  return '';
};

/**
 * Formatea timestamp completo para mostrar (DD/MM/YYYY HH:mm:ss)
 * @param {string|Date} timestamp - Timestamp ISO o Date
 * @returns {string} Timestamp formateado
 */
export const formatearTimestampDisplay = (timestamp) => {
  if (!timestamp) return '';

  const fecha = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) return '';

  const fechaParte = fecha.toLocaleDateString('es-AR');
  const horaParte = fecha.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return `${fechaParte} ${horaParte}`;
};

/**
 * Calcula diferencia en días entre dos fechas
 * @param {string|Date} fecha1 - Primera fecha
 * @param {string|Date} fecha2 - Segunda fecha
 * @returns {number} Diferencia en días
 */
export const diferenciaEnDias = (fecha1, fecha2) => {
  const d1 = typeof fecha1 === 'string' ? parsearFechaLocal(fecha1) : fecha1;
  const d2 = typeof fecha2 === 'string' ? parsearFechaLocal(fecha2) : fecha2;

  if (!d1 || !d2) return 0;

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Suma días a una fecha
 * @param {string|Date} fecha - Fecha base
 * @param {number} dias - Días a sumar (puede ser negativo)
 * @returns {string} Nueva fecha en formato YYYY-MM-DD
 */
export const sumarDias = (fecha, dias) => {
  const fechaObj = typeof fecha === 'string' ? parsearFechaLocal(fecha) : new Date(fecha);
  if (!fechaObj) return '';

  fechaObj.setDate(fechaObj.getDate() + dias);
  return formatearFechaLocal(fechaObj);
};

/**
 * Obtiene el primer día del mes actual
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const primerDiaMesActual = () => {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`;
};

/**
 * Obtiene el último día del mes actual
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const ultimoDiaMesActual = () => {
  const ahora = new Date();
  const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
  return formatearFechaLocal(ultimoDia);
};

/**
 * Valida si una fecha es válida
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @returns {boolean} true si es válida
 */
export const esFechaValida = (fechaString) => {
  if (!fechaString) return false;
  const fecha = parsearFechaLocal(fechaString);
  return fecha !== null && !isNaN(fecha.getTime());
};

export default {
  TIMEZONE_ARGENTINA,
  obtenerFechaHoraArgentina,
  obtenerFechaArgentina,
  obtenerTimestampActual,
  parsearFechaLocal,
  formatearFechaLocal,
  formatearFechaDisplay,
  formatearTimestampDisplay,
  diferenciaEnDias,
  sumarDias,
  primerDiaMesActual,
  ultimoDiaMesActual,
  esFechaValida
};
