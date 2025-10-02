/**
 * Constantes para normalización de productos
 * Define valores permitidos para CONDICION, ESTADO y UBICACION
 * en todas las categorías de productos (notebooks, celulares, otros)
 */

// ===== CONDICIÓN (Estado Funcional) =====
export const CONDICIONES = {
  NUEVO: 'nuevo',
  USADO: 'usado',
  REFURBISHED: 'refurbished',
  REPARACION: 'reparacion',
  RESERVADO: 'reservado',
  PRESTADO: 'prestado',
  SIN_REPARACION: 'sin_reparacion',
  USO_OFICINA: 'uso_oficina'
};

export const CONDICIONES_ARRAY = Object.values(CONDICIONES);

export const CONDICIONES_LABELS = {
  [CONDICIONES.NUEVO]: 'NUEVO',
  [CONDICIONES.USADO]: 'USADO',
  [CONDICIONES.REFURBISHED]: 'REFURBISHED',
  [CONDICIONES.REPARACION]: 'REPARACIÓN',
  [CONDICIONES.RESERVADO]: 'RESERVADO',
  [CONDICIONES.PRESTADO]: 'PRESTADO',
  [CONDICIONES.SIN_REPARACION]: 'SIN REPARACIÓN',
  [CONDICIONES.USO_OFICINA]: 'USO OFICINA'
};

export const CONDICIONES_COLORES = {
  [CONDICIONES.NUEVO]: 'bg-emerald-100 text-emerald-700',
  [CONDICIONES.USADO]: 'bg-yellow-100 text-yellow-700',
  [CONDICIONES.REFURBISHED]: 'bg-blue-100 text-blue-700',
  [CONDICIONES.REPARACION]: 'bg-red-100 text-red-700',
  [CONDICIONES.RESERVADO]: 'bg-purple-100 text-purple-700',
  [CONDICIONES.PRESTADO]: 'bg-cyan-100 text-cyan-700',
  [CONDICIONES.SIN_REPARACION]: 'bg-gray-100 text-gray-700',
  [CONDICIONES.USO_OFICINA]: 'bg-orange-100 text-orange-700'
};

// ===== ESTADO (Estado Estético) =====
export const ESTADOS = {
  A_PLUS: 'A+',
  A: 'A',
  A_MINUS: 'A-',
  B_PLUS: 'B+',
  B: 'B'
};

export const ESTADOS_ARRAY = Object.values(ESTADOS);

export const ESTADOS_LABELS = {
  [ESTADOS.A_PLUS]: 'A+ (Excelente)',
  [ESTADOS.A]: 'A (Muy Bueno)',
  [ESTADOS.A_MINUS]: 'A- (Bueno)',
  [ESTADOS.B_PLUS]: 'B+ (Regular)',
  [ESTADOS.B]: 'B (Funcional)'
};

export const ESTADOS_COLORES = {
  [ESTADOS.A_PLUS]: 'bg-emerald-100 text-emerald-700',
  [ESTADOS.A]: 'bg-blue-100 text-blue-700',
  [ESTADOS.A_MINUS]: 'bg-yellow-100 text-yellow-700',
  [ESTADOS.B_PLUS]: 'bg-orange-100 text-orange-700',
  [ESTADOS.B]: 'bg-gray-100 text-gray-700'
};

// ===== UBICACIÓN (Sucursal) =====
export const UBICACIONES = {
  LA_PLATA: 'la_plata',
  MITRE: 'mitre',
  RSN_IDM_FIXCENTER: 'rsn_idm_fixcenter'
};

export const UBICACIONES_ARRAY = Object.values(UBICACIONES);

export const UBICACIONES_LABELS = {
  [UBICACIONES.LA_PLATA]: 'LA PLATA',
  [UBICACIONES.MITRE]: 'MITRE',
  [UBICACIONES.RSN_IDM_FIXCENTER]: 'RSN/IDM/FIXCENTER'
};

// ===== FUNCIONES HELPER =====

/**
 * Obtiene las clases CSS de color para una condición
 * @param {string} condicion - Valor de condición
 * @returns {string} Clases CSS de Tailwind
 */
export const getCondicionColor = (condicion) => {
  if (!condicion) return 'bg-slate-100 text-slate-700';
  return CONDICIONES_COLORES[condicion.toLowerCase()] || 'bg-slate-100 text-slate-700';
};

/**
 * Obtiene las clases CSS de color para un estado estético
 * @param {string} estado - Valor de estado
 * @returns {string} Clases CSS de Tailwind
 */
export const getEstadoColor = (estado) => {
  if (!estado) return 'bg-slate-100 text-slate-700';
  return ESTADOS_COLORES[estado.toUpperCase()] || 'bg-slate-100 text-slate-700';
};

/**
 * Obtiene el label display para una condición
 * @param {string} condicion - Valor de condición
 * @returns {string} Label para mostrar
 */
export const getCondicionLabel = (condicion) => {
  if (!condicion) return 'N/A';
  return CONDICIONES_LABELS[condicion.toLowerCase()] || condicion.toUpperCase();
};

/**
 * Obtiene el label display para un estado
 * @param {string} estado - Valor de estado
 * @returns {string} Label para mostrar
 */
export const getEstadoLabel = (estado) => {
  if (!estado) return 'N/A';
  return ESTADOS_LABELS[estado.toUpperCase()] || estado;
};

/**
 * Obtiene el label display para una ubicación
 * @param {string} ubicacion - Valor de ubicación
 * @returns {string} Label para mostrar
 */
export const getUbicacionLabel = (ubicacion) => {
  if (!ubicacion) return 'N/A';
  return UBICACIONES_LABELS[ubicacion.toLowerCase()] || ubicacion.toUpperCase();
};

/**
 * Valida si una condición es válida
 * @param {string} condicion - Valor a validar
 * @returns {boolean} True si es válida
 */
export const isValidCondicion = (condicion) => {
  return CONDICIONES_ARRAY.includes(condicion);
};

/**
 * Valida si un estado es válido
 * @param {string} estado - Valor a validar
 * @returns {boolean} True si es válido
 */
export const isValidEstado = (estado) => {
  return ESTADOS_ARRAY.includes(estado);
};

/**
 * Valida si una ubicación es válida
 * @param {string} ubicacion - Valor a validar
 * @returns {boolean} True si es válida
 */
export const isValidUbicacion = (ubicacion) => {
  return UBICACIONES_ARRAY.includes(ubicacion);
};

/**
 * Normaliza un valor de condición legacy
 * @param {string} condicion - Valor original
 * @returns {string} Valor normalizado
 */
export const normalizeCondicion = (condicion) => {
  if (!condicion) return CONDICIONES.USADO;

  const normalized = condicion.toLowerCase().trim();

  // Mapeo de valores legacy
  const legacyMap = {
    'reparación': CONDICIONES.REPARACION,
    'reacondicionado': CONDICIONES.REFURBISHED,
    'sin reparación': CONDICIONES.SIN_REPARACION,
    'sin_reparación': CONDICIONES.SIN_REPARACION,
    'en_preparacion': CONDICIONES.REPARACION,
    'otro': CONDICIONES.USADO
  };

  return legacyMap[normalized] || normalized;
};

/**
 * Normaliza un valor de ubicación legacy
 * @param {string} ubicacion - Valor original
 * @returns {string} Valor normalizado
 */
export const normalizeUbicacion = (ubicacion) => {
  if (!ubicacion) return UBICACIONES.LA_PLATA;

  const normalized = ubicacion.toLowerCase().trim();

  // Mapeo de valores legacy (todo en minúsculas porque normalized ya está en minúsculas)
  const legacyMap = {
    'la plata': UBICACIONES.LA_PLATA,
    'mitre': UBICACIONES.MITRE,
    'rsn/idm/fixcenter': UBICACIONES.RSN_IDM_FIXCENTER,
    'la_plata': UBICACIONES.LA_PLATA,
    'rsn_idm_fixcenter': UBICACIONES.RSN_IDM_FIXCENTER
  };

  return legacyMap[normalized] || normalized;
};

/**
 * Normaliza un valor de estado estético
 * @param {string} estado - Valor original
 * @returns {string} Valor normalizado
 */
export const normalizeEstado = (estado) => {
  if (!estado) return null;

  const normalized = estado.toUpperCase().trim();

  // Los valores válidos son: A+, A, A-, B+, B
  const validEstados = ['A+', 'A', 'A-', 'B+', 'B'];

  if (validEstados.includes(normalized)) {
    return normalized;
  }

  return null;
};