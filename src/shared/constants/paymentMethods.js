/**
 * Constantes unificadas de métodos de pago
 * Fuente única de verdad para todos los selectores del sistema
 */

export const METODOS_PAGO = [
    { value: 'efectivo_pesos', label: '💵 Efectivo en Pesos' },
    { value: 'dolares_billete', label: '💸 Dólares Billete' },
    { value: 'transferencia', label: '🏦 Transferencia' },
    { value: 'transferencia_wire', label: '🌐 Transferencia Wire' },
    { value: 'criptomonedas', label: '₿ Criptomonedas' },
    { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
    { value: 'mercaderia', label: '📦 Mercadería' },
    { value: 'cuenta_corriente', label: '🏷️ Cuenta Corriente' },
    { value: 'cliente_abona', label: '👤 Cliente Abona' }
];

/**
 * Mapa de valores a labels para mostrar el nombre
 * legible de un método de pago dado su valor.
 */
export const METODOS_PAGO_MAP = METODOS_PAGO.reduce((acc, m) => {
    acc[m.value] = m.label;
    return acc;
}, {});

/**
 * Obtener el label legible de un método de pago
 * @param {string} value - Valor del método de pago (ej: 'efectivo_pesos')
 * @returns {string} Label con emoji (ej: '💵 Efectivo en Pesos')
 */
export const getMetodoPagoLabel = (value) => {
    return METODOS_PAGO_MAP[value] || value;
};
