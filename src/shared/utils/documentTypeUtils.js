/**
 * Utilidades para determinar el tipo de documento a generar según el método de pago
 */

/**
 * Determina el tipo de documento a generar basado en el método de pago
 * @param {string} metodoPago - El método de pago de la transacción
 * @returns {Object} Objeto con información del tipo de documento
 */
export const determinarTipoDocumento = (metodoPago) => {
  if (!metodoPago) {
    return {
      tipo: 'RECIBO',
      subtitulo: 'Comprobante de Venta',
      esCredito: false
    };
  }

  const metodoNormalizado = metodoPago.toLowerCase().replace(/[_\s]/g, '');

  switch (metodoNormalizado) {
    case 'cuentacorriente':
    case 'cuenta_corriente':
      return {
        tipo: 'PAGARÉ',
        subtitulo: 'Documento de Crédito',
        esCredito: true
      };
    
    default:
      return {
        tipo: 'RECIBO',
        subtitulo: 'Comprobante de Venta',
        esCredito: false
      };
  }
};

/**
 * Calcula la fecha de vencimiento para un pagaré (30 días desde la fecha de venta)
 * @param {string|Date} fechaVenta - Fecha de la venta
 * @returns {string} Fecha de vencimiento formateada DD/MM/YYYY
 */
export const calcularFechaVencimiento = (fechaVenta) => {
  const fecha = new Date(fechaVenta);
  fecha.setDate(fecha.getDate() + 30); // 30 días de plazo
  
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Genera el texto legal apropiado para un pagaré
 * @param {number} monto - Monto del pagaré
 * @param {string} moneda - Moneda (USD/ARS)
 * @param {string} fechaVencimiento - Fecha de vencimiento
 * @param {string} clienteNombre - Nombre del cliente deudor
 * @returns {string} Texto legal del pagaré
 */
export const generarTextoLegalPagare = (monto, moneda, fechaVencimiento, clienteNombre) => {
  const montoFormateado = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(monto);

  const simboloMoneda = moneda === 'USD' ? 'dólares estadounidenses' : 'pesos argentinos';
  const montoTexto = moneda === 'USD' ? `US$ ${montoFormateado}` : `$ ${montoFormateado}`;

  return `Por el presente PAGARÉ me obligo a pagar incondicionalmente a UPDATE TECH WW SRL la suma de ${montoTexto} (${simboloMoneda}) el día ${fechaVencimiento}, valor recibido a mi entera satisfacción. Este documento se rige por las disposiciones de la Ley de Títulos Valores y legislación comercial vigente.`;
};

/**
 * Obtiene el texto del botón apropiado según el método de pago
 * @param {string} metodoPago - El método de pago de la transacción
 * @returns {string} Texto para el botón
 */
export const obtenerTextoBoton = (metodoPago) => {
  const tipoDoc = determinarTipoDocumento(metodoPago);
  return tipoDoc.tipo === 'PAGARÉ' ? 'Pagaré' : 'Recibo';
};