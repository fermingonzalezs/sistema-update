// Constantes para los estados de importaciones

export const ESTADOS_IMPORTACION = {
  EN_TRANSITO_USA: 'en_transito_usa',
  EN_DEPOSITO_USA: 'en_deposito_usa',
  EN_VUELO_INTERNACIONAL: 'en_vuelo_internacional',
  EN_DEPOSITO_ARG: 'en_deposito_arg',
  RECEPCIONADO: 'recepcionado'
};

export const LABELS_ESTADOS = {
  [ESTADOS_IMPORTACION.EN_TRANSITO_USA]: 'EN TRÁNSITO USA',
  [ESTADOS_IMPORTACION.EN_DEPOSITO_USA]: 'EN DEPÓSITO USA',
  [ESTADOS_IMPORTACION.EN_VUELO_INTERNACIONAL]: 'EN VUELO INTERNACIONAL',
  [ESTADOS_IMPORTACION.EN_DEPOSITO_ARG]: 'EN DEPÓSITO ARG',
  [ESTADOS_IMPORTACION.RECEPCIONADO]: 'RECEPCIONADO'
};

export const COLORES_ESTADOS = {
  [ESTADOS_IMPORTACION.EN_TRANSITO_USA]: 'bg-yellow-100 text-yellow-800',
  [ESTADOS_IMPORTACION.EN_DEPOSITO_USA]: 'bg-blue-100 text-blue-800',
  [ESTADOS_IMPORTACION.EN_VUELO_INTERNACIONAL]: 'bg-purple-100 text-purple-800',
  [ESTADOS_IMPORTACION.EN_DEPOSITO_ARG]: 'bg-indigo-100 text-indigo-800',
  [ESTADOS_IMPORTACION.RECEPCIONADO]: 'bg-green-100 text-green-800'
};

/**
 * Obtiene el siguiente estado en el flujo de importaciones
 * @param {string} estadoActual - El estado actual del recibo
 * @returns {string|null} El siguiente estado o null si ya está en el último
 */
export const obtenerSiguienteEstado = (estadoActual) => {
  const flujo = [
    ESTADOS_IMPORTACION.EN_TRANSITO_USA,
    ESTADOS_IMPORTACION.EN_DEPOSITO_USA,
    ESTADOS_IMPORTACION.EN_VUELO_INTERNACIONAL,
    ESTADOS_IMPORTACION.EN_DEPOSITO_ARG,
    ESTADOS_IMPORTACION.RECEPCIONADO
  ];

  const indiceActual = flujo.indexOf(estadoActual);
  if (indiceActual === -1 || indiceActual === flujo.length - 1) {
    return null; // No hay siguiente o ya está en el último
  }

  return flujo[indiceActual + 1];
};

/**
 * Obtiene el nombre del ícono de Lucide React para el siguiente estado
 * @param {string} estadoActual - El estado actual del recibo
 * @returns {string} El nombre del ícono
 */
export const obtenerIconoSiguienteEstado = (estadoActual) => {
  const siguienteEstado = obtenerSiguienteEstado(estadoActual);

  const iconos = {
    [ESTADOS_IMPORTACION.EN_DEPOSITO_USA]: 'Package',      // Llega a depósito USA
    [ESTADOS_IMPORTACION.EN_VUELO_INTERNACIONAL]: 'Plane', // Sube al avión
    [ESTADOS_IMPORTACION.EN_DEPOSITO_ARG]: 'Home',         // Llega a Argentina
    [ESTADOS_IMPORTACION.RECEPCIONADO]: 'Check'            // Se recepciona
  };

  return iconos[siguienteEstado] || 'ArrowRight';
};

/**
 * Obtiene el label del siguiente estado para mostrar en el botón
 * @param {string} estadoActual - El estado actual del recibo
 * @returns {string} El label del siguiente paso
 */
export const obtenerLabelSiguienteEstado = (estadoActual) => {
  const siguienteEstado = obtenerSiguienteEstado(estadoActual);
  return siguienteEstado ? LABELS_ESTADOS[siguienteEstado] : '';
};

/**
 * Obtiene el estado anterior en el flujo de importaciones
 * @param {string} estadoActual - El estado actual del recibo
 * @returns {string|null} El estado anterior o null si ya está en el primero
 */
export const obtenerEstadoAnterior = (estadoActual) => {
  const flujo = [
    ESTADOS_IMPORTACION.EN_TRANSITO_USA,
    ESTADOS_IMPORTACION.EN_DEPOSITO_USA,
    ESTADOS_IMPORTACION.EN_VUELO_INTERNACIONAL,
    ESTADOS_IMPORTACION.EN_DEPOSITO_ARG,
    ESTADOS_IMPORTACION.RECEPCIONADO
  ];

  const indiceActual = flujo.indexOf(estadoActual);
  if (indiceActual <= 0) {
    return null; // No hay anterior o ya está en el primero
  }

  return flujo[indiceActual - 1];
};

/**
 * Obtiene el nombre del ícono de Lucide React para el estado anterior
 * @param {string} estadoActual - El estado actual del recibo
 * @returns {string} El nombre del ícono
 */
export const obtenerIconoEstadoAnterior = (estadoActual) => {
  const estadoAnterior = obtenerEstadoAnterior(estadoActual);

  const iconos = {
    [ESTADOS_IMPORTACION.EN_TRANSITO_USA]: 'TrendingUp',     // Vuelve a tránsito USA
    [ESTADOS_IMPORTACION.EN_DEPOSITO_USA]: 'Package',        // Vuelve a depósito USA
    [ESTADOS_IMPORTACION.EN_VUELO_INTERNACIONAL]: 'Plane',   // Vuelve al avión
    [ESTADOS_IMPORTACION.EN_DEPOSITO_ARG]: 'Home'            // Vuelve a depósito ARG
  };

  return iconos[estadoAnterior] || 'ArrowLeft';
};

/**
 * Obtiene el label del estado anterior para mostrar en el botón
 * @param {string} estadoActual - El estado actual del recibo
 * @returns {string} El label del estado anterior
 */
export const obtenerLabelEstadoAnterior = (estadoActual) => {
  const estadoAnterior = obtenerEstadoAnterior(estadoActual);
  return estadoAnterior ? LABELS_ESTADOS[estadoAnterior] : '';
};
