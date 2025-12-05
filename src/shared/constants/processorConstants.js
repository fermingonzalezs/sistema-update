/**
 * Constantes para líneas de procesadores
 * Sigue el mismo patrón que productConstants.js
 */

// Valores normalizados de líneas de procesador
export const LINEAS_PROCESADOR = {
  // Intel Core
  I3: 'i3',
  I5: 'i5',
  I7: 'i7',
  I9: 'i9',
  // AMD Ryzen
  R3: 'r3',
  R5: 'r5',
  R7: 'r7',
  R9: 'r9',
  // Apple M-series
  M1: 'm1',
  M2: 'm2',
  M3: 'm3',
  M4: 'm4',
  M5: 'm5',
  // Otros
  OTRO: 'otro'
};

// Array con todos los valores posibles
export const LINEAS_PROCESADOR_ARRAY = [
  'i3', 'i5', 'i7', 'i9',
  'r3', 'r5', 'r7', 'r9',
  'm1', 'm2', 'm3', 'm4', 'm5',
  'otro'
];

// Labels para mostrar en la interfaz
export const LINEAS_PROCESADOR_LABELS = {
  i3: 'Intel Core i3',
  i5: 'Intel Core i5',
  i7: 'Intel Core i7',
  i9: 'Intel Core i9',
  r3: 'AMD Ryzen 3',
  r5: 'AMD Ryzen 5',
  r7: 'AMD Ryzen 7',
  r9: 'AMD Ryzen 9',
  m1: 'Apple M1',
  m2: 'Apple M2',
  m3: 'Apple M3',
  m4: 'Apple M4',
  m5: 'Apple M5',
  otro: 'Otro'
};

// Colores para badges (siguiendo paleta del proyecto: emerald/slate)
export const LINEAS_PROCESADOR_COLORES = {
  // Intel - azules
  i3: 'bg-blue-100 text-blue-700',
  i5: 'bg-blue-200 text-blue-800',
  i7: 'bg-blue-300 text-blue-900',
  i9: 'bg-emerald-200 text-emerald-900',
  // AMD - rojos
  r3: 'bg-red-100 text-red-700',
  r5: 'bg-red-200 text-red-800',
  r7: 'bg-red-300 text-red-900',
  r9: 'bg-red-400 text-red-950',
  // Apple - grises/slate
  m1: 'bg-slate-100 text-slate-700',
  m2: 'bg-slate-200 text-slate-800',
  m3: 'bg-slate-300 text-slate-900',
  m4: 'bg-slate-400 text-slate-950',
  m5: 'bg-slate-500 text-white',
  // Otros
  otro: 'bg-gray-100 text-gray-700'
};

// Agrupados por fabricante (útil para filtros)
export const LINEAS_PROCESADOR_POR_FABRICANTE = {
  Intel: [LINEAS_PROCESADOR.I3, LINEAS_PROCESADOR.I5, LINEAS_PROCESADOR.I7, LINEAS_PROCESADOR.I9],
  AMD: [LINEAS_PROCESADOR.R3, LINEAS_PROCESADOR.R5, LINEAS_PROCESADOR.R7, LINEAS_PROCESADOR.R9],
  Apple: [LINEAS_PROCESADOR.M1, LINEAS_PROCESADOR.M2, LINEAS_PROCESADOR.M3, LINEAS_PROCESADOR.M4, LINEAS_PROCESADOR.M5],
  Otro: [LINEAS_PROCESADOR.OTRO]
};

// Helper functions

/**
 * Obtiene el label de una línea de procesador
 * @param {string} linea - Código de línea de procesador
 * @returns {string} Label formateado
 */
export const getLineaProcesadorLabel = (linea) => {
  if (!linea) return 'No especificado';
  return LINEAS_PROCESADOR_LABELS[linea.toLowerCase()] || linea.toUpperCase();
};

/**
 * Obtiene la clase de color para una línea de procesador
 * @param {string} linea - Código de línea de procesador
 * @returns {string} Clases CSS de Tailwind
 */
export const getLineaProcesadorColor = (linea) => {
  if (!linea) return 'bg-gray-100 text-gray-700';
  return LINEAS_PROCESADOR_COLORES[linea.toLowerCase()] || 'bg-gray-100 text-gray-700';
};

/**
 * Valida si una línea de procesador es válida
 * @param {string} linea - Código de línea de procesador
 * @returns {boolean} True si es válida
 */
export const isValidLineaProcesador = (linea) => {
  if (!linea) return false;
  return LINEAS_PROCESADOR_ARRAY.includes(linea.toLowerCase());
};

/**
 * Obtiene el fabricante de una línea de procesador
 * @param {string} linea - Código de línea de procesador
 * @returns {string} Nombre del fabricante
 */
export const getFabricanteByLinea = (linea) => {
  if (!linea) return 'Otro';
  const lineaLower = linea.toLowerCase();

  if ([LINEAS_PROCESADOR.I3, LINEAS_PROCESADOR.I5, LINEAS_PROCESADOR.I7, LINEAS_PROCESADOR.I9].includes(lineaLower)) {
    return 'Intel';
  }
  if ([LINEAS_PROCESADOR.R3, LINEAS_PROCESADOR.R5, LINEAS_PROCESADOR.R7, LINEAS_PROCESADOR.R9].includes(lineaLower)) {
    return 'AMD';
  }
  if ([LINEAS_PROCESADOR.M1, LINEAS_PROCESADOR.M2, LINEAS_PROCESADOR.M3, LINEAS_PROCESADOR.M4, LINEAS_PROCESADOR.M5].includes(lineaLower)) {
    return 'Apple';
  }
  return 'Otro';
};
