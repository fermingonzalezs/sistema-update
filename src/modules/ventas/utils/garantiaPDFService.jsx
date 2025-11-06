import { pdf } from '@react-pdf/renderer';
import GarantiaPDF from '../../../shared/components/pdf/GarantiaPDF';

/**
 * Genera un blob de PDF de garantía para un producto
 * @param {Object} datosGarantia - Objeto con los datos de la garantía
 * @param {string} datosGarantia.producto - Nombre/modelo del producto
 * @param {string} datosGarantia.numeroSerie - Número de serie del producto
 * @param {string} datosGarantia.cliente - Nombre completo del cliente
 * @param {string} datosGarantia.fechaCompra - Fecha de compra (formato legible)
 * @param {string} datosGarantia.plazoGarantia - Plazo de garantía
 * @returns {Promise<Blob>} Blob del PDF de garantía
 */
export const generarGarantiaPDFBlob = async (datosGarantia) => {
  try {
    const {
      producto = '',
      numeroSerie = '',
      cliente = '',
      fechaCompra = '',
      plazoGarantia = ''
    } = datosGarantia;

    console.log('📄 Generando PDF de garantía:', {
      producto,
      numeroSerie,
      cliente,
      fechaCompra,
      plazoGarantia
    });

    // Generar el blob del PDF
    const blob = await pdf(
      <GarantiaPDF
        producto={producto}
        numeroSerie={numeroSerie}
        cliente={cliente}
        fechaCompra={fechaCompra}
        plazoGarantia={plazoGarantia}
      />
    ).toBlob();

    console.log('✅ PDF de garantía generado exitosamente, tamaño:', blob.size, 'bytes');
    return blob;
  } catch (error) {
    console.error('❌ Error generando PDF de garantía:', error);
    throw new Error(`Error generando PDF de garantía: ${error.message}`);
  }
};

/**
 * Genera el nombre de archivo para la garantía
 * @param {Object} params - Parámetros para el nombre
 * @param {string} params.cliente - Nombre del cliente
 * @param {string} params.numeroSerie - Número de serie
 * @returns {string} Nombre del archivo
 */
export const generarNombreArchivoGarantia = ({ cliente = '', numeroSerie = '' }) => {
  const clienteNombre = cliente.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const numeroSerieLimpio = numeroSerie.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
  const fecha = new Date().toISOString().split('T')[0];
  return `garantia_${clienteNombre}_${numeroSerieLimpio}_${fecha}.pdf`;
};
