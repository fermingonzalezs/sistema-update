/**
 * Utilidades para cálculo estandarizado de saldos contables
 *
 * Este módulo centraliza la lógica de cálculo de saldos para garantizar
 * consistencia entre todos los reportes contables del sistema.
 */

/**
 * Calcula el saldo de una cuenta según su naturaleza contable
 *
 * CUENTAS DEUDORAS (Activos y Gastos): saldo = debe - haber
 * CUENTAS ACREEDORAS (Pasivos, Patrimonio, Ingresos): saldo = haber - debe
 *
 * @param {number} debe - Total del debe
 * @param {number} haber - Total del haber
 * @param {string} tipoCuenta - Tipo de cuenta ('activo', 'pasivo', 'patrimonio', 'resultado positivo', 'resultado negativo')
 * @returns {number} Saldo de la cuenta (positivo si es normal, negativo si es anormal)
 */
export const calcularSaldoCuenta = (debe, haber, tipoCuenta) => {
  const debeNum = parseFloat(debe || 0);
  const haberNum = parseFloat(haber || 0);

  // CUENTAS DEUDORAS: Debe - Haber
  // Aumentan con débitos, disminuyen con créditos
  if (tipoCuenta === 'activo' || tipoCuenta === 'resultado negativo') {
    return debeNum - haberNum;
  }

  // CUENTAS ACREEDORAS: Haber - Debe
  // Aumentan con créditos, disminuyen con débitos
  if (tipoCuenta === 'pasivo' || tipoCuenta === 'patrimonio' || tipoCuenta === 'resultado positivo') {
    return haberNum - debeNum;
  }

  // Fallback para tipos de cuenta no reconocidos
  console.warn(`⚠️ Tipo de cuenta desconocido: "${tipoCuenta}". Usando cálculo por defecto (debe - haber).`);
  return debeNum - haberNum;
};

/**
 * Determina si una cuenta es de naturaleza deudora
 *
 * @param {string} tipoCuenta - Tipo de cuenta
 * @returns {boolean} true si es deudora
 */
export const esCuentaDeudora = (tipoCuenta) => {
  return tipoCuenta === 'activo' || tipoCuenta === 'resultado negativo';
};

/**
 * Determina si una cuenta es de naturaleza acreedora
 *
 * @param {string} tipoCuenta - Tipo de cuenta
 * @returns {boolean} true si es acreedora
 */
export const esCuentaAcreedora = (tipoCuenta) => {
  return tipoCuenta === 'pasivo' ||
         tipoCuenta === 'patrimonio' ||
         tipoCuenta === 'resultado positivo';
};

/**
 * Detecta si un saldo es anormal para el tipo de cuenta
 *
 * Un saldo negativo en contabilidad indica un error o situación irregular:
 * - Activo negativo: Error contable (ej: caja negativa)
 * - Pasivo negativo: Error contable (ej: proveedor con saldo a favor)
 * - Patrimonio negativo: Situación de quiebra técnica
 *
 * @param {number} saldo - Saldo calculado
 * @param {string} tipoCuenta - Tipo de cuenta (opcional, para validaciones adicionales)
 * @returns {boolean} true si el saldo es anormal
 */
export const esSaldoAnormal = (saldo) => {
  return saldo < 0;
};

/**
 * Obtiene el nombre legible de la naturaleza de la cuenta
 *
 * @param {string} tipoCuenta - Tipo de cuenta
 * @returns {string} 'Deudora' o 'Acreedora'
 */
export const getNaturalezaCuenta = (tipoCuenta) => {
  if (esCuentaDeudora(tipoCuenta)) return 'Deudora';
  if (esCuentaAcreedora(tipoCuenta)) return 'Acreedora';
  return 'Desconocida';
};

/**
 * Clasifica un saldo como deudor o acreedor según su signo y tipo de cuenta
 *
 * @param {number} saldo - Saldo calculado
 * @param {string} tipoCuenta - Tipo de cuenta
 * @returns {object} { esDeudor: boolean, esAcreedor: boolean }
 */
export const clasificarSaldo = (saldo, tipoCuenta) => {
  if (saldo > 0) {
    // Saldo positivo
    if (esCuentaDeudora(tipoCuenta)) {
      return { esDeudor: true, esAcreedor: false };
    } else {
      return { esDeudor: false, esAcreedor: true };
    }
  } else if (saldo < 0) {
    // Saldo negativo (anormal)
    if (esCuentaDeudora(tipoCuenta)) {
      return { esDeudor: false, esAcreedor: true };
    } else {
      return { esDeudor: true, esAcreedor: false };
    }
  }

  // Saldo cero
  return { esDeudor: false, esAcreedor: false };
};

/**
 * Formatea un saldo para mostrar en reportes contables
 *
 * @param {number} saldo - Saldo a formatear
 * @param {object} opciones - Opciones de formato
 * @param {boolean} opciones.mostrarSigno - Mostrar signo negativo si aplica
 * @param {boolean} opciones.usarAbsoluto - Usar valor absoluto
 * @returns {number} Saldo formateado
 */
export const formatearSaldoParaReporte = (saldo, opciones = {}) => {
  const { mostrarSigno = false, usarAbsoluto = true } = opciones;

  if (usarAbsoluto && !mostrarSigno) {
    return Math.abs(saldo);
  }

  return saldo;
};

/**
 * Calcula el total de una categoría de cuentas a partir de movimientos contables
 *
 * IMPORTANTE: Esta es la función CENTRALIZADA para todos los cálculos de totales.
 * Debe usarse en TODOS los módulos (Ratios, Estado de Resultados, Análisis, etc.)
 *
 * @param {Array} movimientos - Array de movimientos contables con plan_cuentas incluido
 * @param {string|Function} filtroCuentas - Código que debe iniciar la cuenta (ej: '5.0') o función de filtro
 * @returns {number} Total calculado según la naturaleza de las cuentas
 *
 * @example
 * // CMV (Costo de Mercadería Vendida) - Categoría 5.0
 * const cmv = calcularTotalCategoria(movimientos, '5.0');
 *
 * @example
 * // Compras (Bienes de Cambio) - Categoría 1.1.04
 * const compras = calcularTotalCategoria(movimientos, '1.1.04');
 *
 * @example
 * // Filtro personalizado
 * const total = calcularTotalCategoria(movimientos, (mov) =>
 *   mov.plan_cuentas?.codigo?.startsWith('6.1')
 * );
 */
export const calcularTotalCategoria = (movimientos, filtroCuentas) => {
  // Agrupar movimientos por cuenta
  const cuentasAgrupadas = {};

  // Determinar función de filtro
  const filtrar = typeof filtroCuentas === 'function'
    ? filtroCuentas
    : (mov) => mov.plan_cuentas?.codigo?.startsWith(filtroCuentas);

  movimientos.filter(filtrar).forEach(mov => {
    const cuenta = mov.plan_cuentas;
    if (!cuenta || !cuenta.tipo) return;

    if (!cuentasAgrupadas[cuenta.id]) {
      cuentasAgrupadas[cuenta.id] = {
        cuenta,
        debe: 0,
        haber: 0
      };
    }

    cuentasAgrupadas[cuenta.id].debe += parseFloat(mov.debe || 0);
    cuentasAgrupadas[cuenta.id].haber += parseFloat(mov.haber || 0);
  });

  // Calcular total usando la función estandarizada
  let total = 0;
  Object.values(cuentasAgrupadas).forEach(item => {
    const saldo = calcularSaldoCuenta(item.debe, item.haber, item.cuenta.tipo);
    total += saldo;
  });

  return total;
};

/**
 * Calcula solo los DÉBITOS de una categoría de cuentas
 *
 * Esta función es útil para calcular ratios de sobrecompra donde necesitamos:
 * - Compras (débitos de Bienes de Cambio 1.1.04.xx)
 * - CMV (débitos de CMV 5.0.xx)
 *
 * A diferencia de calcularTotalCategoria que calcula el saldo neto (debe - haber),
 * esta función suma ÚNICAMENTE los débitos sin restar el haber.
 *
 * @param {Array} movimientos - Array de movimientos contables con plan_cuentas incluido
 * @param {string|Function} filtroCuentas - Código exacto de cuenta o función de filtro
 * @returns {number} Total de débitos
 *
 * @example
 * // Débitos de Notebooks Nuevas (código exacto)
 * const comprasNotebooks = calcularDebitos(movimientos, '1.1.04.01.01');
 *
 * @example
 * // Débitos con función de filtro personalizada
 * const cmvTotal = calcularDebitos(movimientos, (mov) =>
 *   mov.plan_cuentas?.codigo?.startsWith('5.0')
 * );
 */
export const calcularDebitos = (movimientos, filtroCuentas) => {
  // Determinar función de filtro
  const filtrar = typeof filtroCuentas === 'function'
    ? filtroCuentas
    : (mov) => mov.plan_cuentas?.codigo === filtroCuentas; // Igualdad exacta

  // Sumar solo los débitos de los movimientos que cumplen el filtro
  let totalDebitos = 0;

  movimientos.filter(filtrar).forEach(mov => {
    totalDebitos += parseFloat(mov.debe || 0);
  });

  return totalDebitos;
};
