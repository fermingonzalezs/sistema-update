import { pdf } from '@react-pdf/renderer';
import ReciboVentaDocument, { convertirVentaARecibo } from '../components/pdf/ReciboVentaPDF_NewTab';
import GarantiaPDF from '../../soporte/components/pdf/GarantiaPDF';

/**
 * Genera el PDF del recibo de venta usando el nuevo formato
 * @param {Object} transaccion - Datos de la transacción
 * @param {Array} items - Items de la venta
 * @returns {Promise<Blob>} PDF en formato Blob
 */
export const generarReciboPDF = async (transaccion, items) => {
  try {
    console.log('📄 Generando PDF de recibo (nuevo formato)...', { transaccion, items });

    // Convertir datos de transacción al formato que espera el PDF
    const datosRecibo = convertirVentaARecibo(transaccion);

    // El nuevo componente genera el PDF usando pdf() internamente
    const pdfDocument = <ReciboVentaDocument data={datosRecibo} />;
    const blob = await pdf(pdfDocument).toBlob();

    console.log('✅ PDF de recibo generado (nuevo formato)');
    return blob;
  } catch (error) {
    console.error('❌ Error generando recibo PDF:', error);
    throw error;
  }
};

/**
 * Convierte datos de venta a formato de garantía para UN SOLO ITEM
 * @param {Object} transaccion - Datos completos de la transacción
 * @param {Object} item - Item individual de la venta
 * @returns {Object} Datos formateados para el PDF de garantía
 */
const convertirVentaAGarantiaIndividual = (transaccion, item) => {
  return {
    company: {
      name: "UPDATE TECH WW S.R.L",
      address: "Avenida 44 N° 862 1/2 Piso 4\nLa Plata, Buenos Aires, Argentina",
      phone: "+54 221 359-9837",
      cuit: "CUIT: 30-71850553-2"
    },
    invoice: {
      number: `GAR-${String(transaccion.numero_transaccion).padStart(6, '0')}`,
      date: new Date(transaccion.fecha_venta).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    client: {
      name: transaccion.cliente_nombre || 'Cliente No Especificado',
      address: transaccion.cliente_direccion || 'Dirección no disponible',
      phone: transaccion.cliente_telefono || '',
      email: transaccion.cliente_email || ''
    },
    items: [{
      description: item.copy_documento || item.copy || item.modelo_producto || 'Producto',
      quantity: item.cantidad || 1,
      unitPrice: item.precio_unitario || 0,
      amount: item.precio_total || 0,
      serial: item.serial_producto || null,
      garantia: item.garantia || 'No especificada'
    }],
    discount: 0, // No aplicamos descuento en garantías individuales
    moneda: transaccion.moneda_pago || 'USD',
    metodoPago: transaccion.metodo_pago || 'efectivo'
  };
};

/**
 * Genera PDFs de garantía - UN PDF POR CADA PRODUCTO VENDIDO
 * @param {Object} transaccion - Datos de la transacción
 * @param {Array} items - Items de la venta
 * @param {Object} cliente - Datos del cliente
 * @returns {Promise<Array<Blob>>} Array de PDFs en formato Blob (uno por item)
 */
export const generarGarantiasPDF = async (transaccion, items, cliente) => {
  try {
    console.log('📄 Generando PDFs de garantías (uno por producto)...', {
      totalItems: items.length,
      productos: items.map(i => i.copy_documento || i.copy || i.modelo_producto)
    });

    const garantiasPDFs = [];

    // Generar UN PDF por cada item vendido
    for (const item of items) {
      // Convertir solo este item específico a datos de garantía
      const datosGarantia = convertirVentaAGarantiaIndividual(transaccion, item);

      console.log(`  📝 Generando garantía para: ${item.copy_documento || item.copy || item.modelo_producto}`);

      // Generar PDF de garantía con solo este item
      const pdfDocument = <GarantiaPDF data={datosGarantia} />;
      const blob = await pdf(pdfDocument).toBlob();
      garantiasPDFs.push(blob);
    }

    console.log(`✅ ${garantiasPDFs.length} PDF(s) de garantía generados (uno por producto)`);
    return garantiasPDFs;
  } catch (error) {
    console.error('❌ Error generando garantías PDF:', error);
    throw error;
  }
};

/**
 * Genera todos los PDFs necesarios para una venta (recibo + garantías)
 * @param {Object} transaccion - Datos de la transacción completa
 * @param {Object} cliente - Datos completos del cliente
 * @returns {Promise<Object>} Objeto con recibo y garantías: { reciboPDF, garantiasPDF }
 */
export const generarPDFsVenta = async (transaccion, cliente) => {
  try {
    console.log('📦 Generando todos los PDFs de la venta...', { transaccion, cliente });

    const items = transaccion.venta_items || [];

    // Generar en paralelo para mayor velocidad
    const [reciboPDF, garantiasPDF] = await Promise.all([
      generarReciboPDF(transaccion, items),
      generarGarantiasPDF(transaccion, items, cliente)
    ]);

    console.log('✅ Todos los PDFs generados exitosamente');

    return {
      reciboPDF,
      garantiasPDF,
      totalPDFs: 1 + garantiasPDF.length
    };
  } catch (error) {
    console.error('❌ Error generando PDFs de venta:', error);
    throw error;
  }
};

/**
 * Extrae información de productos para el email
 * @param {Array} items - Items de la venta
 * @returns {Array<Object>} Array con info simplificada de productos
 */
export const extraerInfoProductosParaEmail = (items) => {
  return items.map(item => ({
    nombre: (item.copy_documento || item.copy)?.split(' - ')[0] || item.tipo_producto,
    cantidad: item.cantidad,
    garantia: item.garantia
  }));
};
