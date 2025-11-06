import emailjs from '@emailjs/browser';

/**
 * Inicializa EmailJS con la clave pública
 * Se ejecuta una sola vez al cargar el módulo
 */
const inicializarEmailJS = () => {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (!publicKey) {
    console.warn('⚠️ VITE_EMAILJS_PUBLIC_KEY no está configurada en .env');
    return false;
  }
  try {
    emailjs.init(publicKey);
    console.log('✅ EmailJS inicializado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando EmailJS:', error);
    return false;
  }
};

// Inicializar al cargar el módulo
const emailJSListo = inicializarEmailJS();

/**
 * Convierte un blob a base64
 * @param {Blob} blob - El blob a convertir
 * @returns {Promise<string>} String en base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Extraer la parte base64 (sin el prefijo "data:application/pdf;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convierte un blob a un array de bytes
 * @param {Blob} blob - El blob a convertir
 * @returns {Promise<Uint8Array>} Array de bytes
 */
const blobToByteArray = async (blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
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
 * Envía garantías por email usando EmailJS
 * Genera un solo email con múltiples PDFs adjuntos
 * @param {Object} config - Configuración del envío
 * @param {string} config.destinatario - Email del cliente
 * @param {string} config.nombreCliente - Nombre completo del cliente
 * @param {Array<Object>} config.garantias - Array de objetos con datos de garantías
 * @param {Blob} config.garantias[].pdf - Blob del PDF
 * @param {string} config.garantias[].nombreArchivo - Nombre del archivo
 * @param {string} config.garantias[].producto - Nombre del producto
 * @param {string} config.garantias[].numeroSerie - Número de serie
 * @returns {Promise<Object>} Resultado del envío {success: boolean, response?: Object, error?: string}
 */
export const enviarGarantiasPorEmail = async (config) => {
  try {
    // Validar configuración
    if (!emailJSListo) {
      throw new Error('EmailJS no está inicializado. Verifica VITE_EMAILJS_PUBLIC_KEY en .env');
    }

    const {
      destinatario,
      nombreCliente,
      garantias = []
    } = config;

    // Validar email
    if (!destinatario || !esEmailValido(destinatario)) {
      console.warn('⚠️ Email inválido o no proporcionado:', destinatario);
      return {
        success: false,
        error: 'Email inválido',
        skipped: true // Flag para indicar que fue skipped silenciosamente
      };
    }

    // Validar que hay garantías para enviar
    if (!garantias || garantias.length === 0) {
      throw new Error('No hay garantías para enviar');
    }

    console.log(`📧 Preparando envío de ${garantias.length} garantía(s) a ${destinatario}`);

    // Verificar que los archivos de entorno están configurados
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

    if (!serviceId || !templateId) {
      throw new Error(
        'Credenciales de EmailJS no configuradas. ' +
        'Asegúrate de tener VITE_EMAILJS_SERVICE_ID y VITE_EMAILJS_TEMPLATE_ID en .env'
      );
    }

    // Convertir PDFs a base64 para adjuntar
    const archivosBase64 = [];
    const listaProductos = [];

    for (let i = 0; i < garantias.length; i++) {
      const garantia = garantias[i];

      try {
        const base64 = await blobToBase64(garantia.pdf);
        archivosBase64.push({
          nombre: garantia.nombreArchivo,
          contenido: base64
        });
        listaProductos.push(`${i + 1}. ${garantia.producto} (${garantia.numeroSerie})`);
        console.log(`✅ PDF ${i + 1}/${garantias.length} convertido a base64`);
      } catch (error) {
        console.error(`❌ Error convertiendo PDF ${i + 1}:`, error);
        throw error;
      }
    }

    // Preparar parámetros del email
    // EmailJS tiene un límite de tamaño, así que usamos una estrategia:
    // - Enviamos los PDFs como base64 en campos separados si hay múltiples
    // - O en un campo si hay uno solo
    const templateParams = {
      to_email: destinatario,
      to_name: nombreCliente,
      productos_lista: listaProductos.join('\n'),
      cantidad_garantias: garantias.length,
      fecha: new Date().toLocaleDateString('es-AR'),
      // Archivos base64 (limitado a 2 archivos por restricción de EmailJS)
      archivo_1_nombre: archivosBase64[0]?.nombre || '',
      archivo_1_base64: archivosBase64[0]?.contenido || '',
      archivo_2_nombre: archivosBase64[1]?.nombre || '',
      archivo_2_base64: archivosBase64[1]?.contenido || '',
      archivo_3_nombre: archivosBase64[2]?.nombre || '',
      archivo_3_base64: archivosBase64[2]?.contenido || '',
    };

    console.log('🚀 Enviando email a través de EmailJS...');

    // Enviar email
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );

    console.log('✅ Email enviado exitosamente', {
      messageId: response.text,
      destinatario,
      garantias: garantias.length
    });

    return {
      success: true,
      response,
      archivosEnviados: garantias.length
    };

  } catch (error) {
    console.error('❌ Error enviando email de garantía:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al enviar el email'
    };
  }
};

/**
 * Versión simplificada para enviar una sola garantía
 * (por si se necesita en el futuro)
 * @param {Object} config - Configuración del envío
 * @returns {Promise<Object>} Resultado del envío
 */
export const enviarGarantiaSimple = async (config) => {
  const {
    destinatario,
    nombreCliente,
    pdfBlob,
    nombreArchivo,
    producto,
    numeroSerie
  } = config;

  return enviarGarantiasPorEmail({
    destinatario,
    nombreCliente,
    garantias: [
      {
        pdf: pdfBlob,
        nombreArchivo,
        producto,
        numeroSerie
      }
    ]
  });
};
