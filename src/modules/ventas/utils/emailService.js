import { supabase } from '../../../lib/supabase';

/**
 * Convierte un Blob a base64 para enviar a la Edge Function
 * @param {Blob} blob - El blob a convertir
 * @returns {Promise<string>} String en base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Valida si un email es válido
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
const esEmailValido = (email) => {
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regexEmail.test(email);
};

/**
 * Envía email con PDFs adjuntos (recibo + garantías) usando Supabase Edge Function + Resend
 * @param {Object} config - Configuración del envío
 * @param {string} config.destinatario - Email del cliente
 * @param {string} config.nombreCliente - Nombre completo del cliente
 * @param {Blob} config.reciboPDF - PDF del recibo de venta
 * @param {Array<Blob>} config.garantiasPDF - Array de PDFs de garantías
 * @param {Array<Object>} config.productos - Array con info de productos para el mensaje
 * @param {string} config.numeroTransaccion - Número de transacción
 * @param {number} config.totalVenta - Total de la venta
 * @param {Object} config.transaccion - Objeto completo de la transacción
 * @returns {Promise<Object>} Resultado del envío
 */
export const enviarVentaPorEmail = async (config) => {
  try {
    const {
      destinatario,
      nombreCliente,
      reciboPDF,
      garantiasPDF = [],
      productos = [],
      numeroTransaccion,
      totalVenta,
      transaccion
    } = config;

    // Validar email
    if (!destinatario || !esEmailValido(destinatario)) {
      console.warn('⚠️ Email inválido o no proporcionado:', destinatario);
      return {
        success: false,
        error: 'Email inválido',
        skipped: true
      };
    }

    console.log(`📧 Preparando envío de venta a ${destinatario}`);

    // Convertir PDFs a base64
    const reciboBase64 = reciboPDF ? await blobToBase64(reciboPDF) : null;
    const garantiasBase64 = await Promise.all(
      garantiasPDF.map(pdf => blobToBase64(pdf))
    );

    // Formatear datos del recibo
    const moneda = transaccion?.moneda_pago || 'USD';
    const formatearMoneda = (valor) => {
      const numero = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(valor);
      return moneda === 'USD' ? `US$ ${numero}` : `$ ${numero}`;
    };

    // Convertir items al formato del recibo
    const items = (transaccion?.venta_items || []).map(item => ({
      description: item.copy_documento || item.copy || 'Producto sin especificar',
      quantity: item.cantidad || 1,
      unit: 'Un.',
      unitPrice: item.precio_unitario || 0,
      amount: item.precio_total || 0,
      serial: item.serial_producto || null
    }));

    // Calcular subtotal
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const descuento = transaccion?.descuento || 0;

    // Preparar datos para la Edge Function
    const payload = {
      destinatario,
      nombreCliente,
      numeroTransaccion,
      totalVenta: formatearMoneda(totalVenta),
      productos,
      fecha: new Date(transaccion?.fecha_venta || new Date()).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      ubicacion: transaccion?.ubicacion || 'la_plata', // Ubicación de la sucursal
      reciboPDF: reciboBase64,
      garantiasPDF: garantiasBase64,
      // Datos adicionales para el template HTML completo
      items,
      subtotal,
      descuento,
      moneda,
      clienteDireccion: transaccion?.cliente_direccion || 'Dirección no disponible',
      clienteTelefono: transaccion?.cliente_telefono || '',
      clienteEmail: transaccion?.cliente_email || destinatario
    };

    console.log('🚀 Enviando email a través de Supabase Edge Function...');

    // Llamar a la Edge Function
    const { data, error } = await supabase.functions.invoke('send-receipt-email', {
      body: payload
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Error desconocido al enviar email');
    }

    console.log('✅ Email enviado exitosamente', {
      messageId: data.messageId,
      destinatario,
      adjuntos: 1 + garantiasBase64.length
    });

    return {
      success: true,
      response: data,
      adjuntosEnviados: 1 + garantiasBase64.length
    };

  } catch (error) {
    console.error('❌ Error enviando email de venta:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al enviar el email'
    };
  }
};
