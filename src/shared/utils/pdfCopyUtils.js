/**
 * Utilidades para generar copys simplificados para PDFs (recibos y garantías)
 * Formatos (SIN SERIAL, el serial va en campo separado):
 * - Notebooks: MODELO - MEMORIA - ALMACENAMIENTO
 * - Celulares: MODELO - COLOR - ALMACENAMIENTO
 * - Otros: PRODUCTO - CONDICION
 */

/**
 * Detectar tipo de producto a partir del item de venta
 */
const detectarTipoProducto = (item) => {
  // Si tiene tipo_producto explícito
  if (item.tipo_producto) {
    return item.tipo_producto;
  }

  // Detectar por copy
  const copy = (item.copy || '').toLowerCase();
  if (copy.includes('💻') || copy.includes('procesador') || copy.includes('ram') || copy.includes('ssd')) {
    return 'computadora';
  }
  if (copy.includes('📱') || copy.includes('iphone') || copy.includes('samsung') || copy.includes('xiaomi')) {
    return 'celular';
  }

  return 'otro';
};

/**
 * Extraer información de un copy completo usando regex
 */
const extraerDatosDeCopy = (copy) => {
  const datos = {};

  // Remover emojis
  let copyLimpio = copy.replace(/💻|📱|📦/g, '').trim();

  // Extraer modelo (primera parte antes del primer -)
  const partes = copyLimpio.split(' - ');
  datos.modelo = partes[0] || '';

  // Buscar RAM/Memoria
  const ramMatch = copyLimpio.match(/(\d+GB)\s*(DDR\d|DDR|LPDDR\d)?/i);
  if (ramMatch) {
    datos.memoria = ramMatch[0].trim();
  }

  // Buscar almacenamiento (SSD/HDD)
  const almacenamientoMatch = copyLimpio.match(/(\d+(?:GB|TB))\s*(?:SSD|HDD)/gi);
  if (almacenamientoMatch) {
    datos.almacenamiento = almacenamientoMatch.join(' + ');
  } else {
    // Buscar solo capacidad para celulares
    const capacidadMatch = copyLimpio.match(/(\d+(?:GB|TB))(?!\s*(?:DDR|SSD|HDD))/i);
    if (capacidadMatch) {
      datos.almacenamiento = capacidadMatch[1];
    }
  }

  // Buscar color
  const colores = ['negro', 'blanco', 'azul', 'rojo', 'verde', 'gris', 'dorado', 'plateado', 'rosa', 'morado', 'gold', 'silver', 'black', 'white', 'blue', 'red', 'green', 'gray', 'grey', 'purple', 'pink'];
  for (const color of colores) {
    const regex = new RegExp(`\\b${color}\\b`, 'i');
    if (regex.test(copyLimpio)) {
      datos.color = copyLimpio.match(regex)[0];
      break;
    }
  }

  // Buscar condición
  const condiciones = ['nuevo', 'usado', 'refurbished', 'reacondicionado', 'consignacion', 'consignación'];
  for (const condicion of condiciones) {
    const regex = new RegExp(`\\b${condicion}\\b`, 'i');
    if (regex.test(copyLimpio)) {
      datos.condicion = copyLimpio.match(regex)[0];
      break;
    }
  }

  return datos;
};

/**
 * Normalizar condición
 */
const normalizarCondicion = (condicion) => {
  if (!condicion) return 'USADO';

  const cond = condicion.toLowerCase();
  if (cond === 'nuevo' || cond === 'nueva') return 'NUEVO';
  if (cond === 'refurbished' || cond === 'reacondicionado') return 'REFURBISHED';
  if (cond === 'consignacion' || cond === 'consignación') return 'CONSIGNACIÓN';
  return 'USADO';
};

/**
 * Generar copy simplificado para PDFs
 * @param {Object} item - Item de venta con copy_documento y datos
 * @returns {string} Copy limpio para documentos
 */
export const generarCopyParaPDF = (item) => {
  console.log('📄 [pdfCopyUtils] Generando copy para PDF. Item recibido:', item);

  // Usar copy_documento (para documentos limpios) si existe y no está vacío, si no usar copy
  // copy_documento ya está limpio y formateado correctamente, no necesita procesamiento adicional
  const copyFinal = (item.copy_documento && item.copy_documento.trim() !== '')
    ? item.copy_documento
    : (item.copy || 'Producto sin especificar');

  console.log('📄 [pdfCopyUtils] Copy final:', copyFinal);

  return copyFinal;
};

export default generarCopyParaPDF;
