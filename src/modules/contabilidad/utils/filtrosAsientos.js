/**
 * Funciones utilitarias para filtrar asientos de cierre de análisis financieros
 */

/**
 * Construye filtros para excluir asientos de cierre de análisis financieros
 * @param {Object} supabaseQuery - Query de Supabase a modificar
 * @returns {Object} - Query modificado con filtros aplicados
 */
export const excluirAsientosDeCierre = (supabaseQuery) => {
  return supabaseQuery.neq('tipo_asiento', 'cierre');
};

/**
 * Filtra asientos en arrays de datos ya obtenidos
 * @param {Array} asientos - Array de asientos
 * @returns {Array} - Asientos filtrados (sin cierres)
 */
export const filtrarAsientosSinCierre = (asientos) => {
  return asientos.filter(a => a.tipo_asiento !== 'cierre');
};

/**
 * Filtra movimientos contables excluyendo cierres
 * @param {Array} movimientos - Array de movimientos con asientos_contables relacionado
 * @returns {Array} - Movimientos filtrados
 */
export const filtrarMovimientosSinCierre = (movimientos) => {
  return movimientos.filter(m =>
    m.asientos_contables?.tipo_asiento !== 'cierre'
  );
};
