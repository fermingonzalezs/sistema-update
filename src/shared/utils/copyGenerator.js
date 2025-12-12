// copyGenerator.js - Sistema unificado de generación de copys
// Unifica la lógica de Listas.jsx y Catalogo.jsx con múltiples versiones

import { formatearMonto } from './formatters';

/**
 * Tipos de copys disponibles:
 * VERSIONES COMERCIALES (para Listas y botones copy):
 * - 'notebook_comercial': 💻 MODELO - PANTALLA - PROCESADOR - MEMORIA TIPO - SSD - HDD - RESOLUCION HZ - GPU VRAM - BATERIA DURACION - PRECIO
 * - 'celular_comercial': 📱 MODELO - CAPACIDAD - COLOR - BATERIA - ESTADO - PRECIO
 * - 'otro_comercial': 📦 MODELO - DESCRIPCION - PRECIO
 *
 * VERSIONES COMPLETAS (para Catálogo - uso interno):
 * - 'notebook_completo': MODELO - PANTALLA - PROCESADOR - MEMORIA TIPO - SSD - HDD - RESOLUCION HZ - GPU VRAM - BATERIA DURACION (sin emoji, sin precio)
 * - 'celular_completo': MODELO - CAPACIDAD - COLOR - BATERIA - ESTADO (sin emoji, sin precio)
 * - 'otro_completo': MODELO - DESCRIPCION (sin emoji, sin precio)
 *
 * VERSIONES DOCUMENTOS (para Recibos, Garantías, Emails - SIN observaciones/notas):
 * - 'notebook_documento': MODELO - PANTALLA - PROCESADOR - RAM - SSD/HDD - GPU - BATERIA - ESTADO - COLOR - IDIOMA
 * - 'celular_documento': MODELO - COLOR - CAPACIDAD - BATERIA - ESTADO
 * - 'otro_documento': NOMBRE_PRODUCTO (solo nombre, sin descripción ni observaciones)
 */

// Configuraciones por defecto para cada tipo
const TYPE_DEFAULTS = {
  // VERSIONES COMERCIALES - Para Listas y copy buttons
  notebook_comercial: {
    includeEmojis: true,
    includePrice: true,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'simple'
  },
  celular_comercial: {
    includeEmojis: true,
    includePrice: true,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'simple'
  },
  otro_comercial: {
    includeEmojis: true,
    includePrice: true,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'simple'
  },

  // VERSIONES COMPLETAS - Para Catálogo información interna
  notebook_completo: {
    includeEmojis: false,
    includePrice: false,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'completo'
  },
  celular_completo: {
    includeEmojis: false,
    includePrice: false,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'completo'
  },
  otro_completo: {
    includeEmojis: false,
    includePrice: false,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'completo'
  },

  // VERSIONES DOCUMENTOS - Para Recibos, Garantías, Emails (SIN observaciones/notas)
  notebook_documento: {
    includeEmojis: false,
    includePrice: false,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'documento'
  },
  celular_documento: {
    includeEmojis: false,
    includePrice: false,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'documento'
  },
  otro_documento: {
    includeEmojis: false,
    includePrice: false,
    includeTechnicalDetails: false, // Solo nombre, sin detalles técnicos
    separator: ' - ',
    maxLength: null,
    style: 'documento'
  },

  // Alias para compatibilidad
  notebook: {
    includeEmojis: true,
    includePrice: true,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'simple'
  },
  celular: {
    includeEmojis: true,
    includePrice: true,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'simple'
  },
  otro: {
    includeEmojis: true,
    includePrice: true,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'simple'
  }
};

/**
 * Función principal para generar copys unificados
 * @param {Object} producto - Objeto del producto
 * @param {Object} options - Opciones de configuración
 * @returns {string} Copy generado
 */
export const generateCopy = (producto, options = {}) => {
  // Determinar tipo de copy y configuración
  const tipo = options.tipo || determinarTipoCopy(producto, options.categoria);
  const config = {
    ...TYPE_DEFAULTS[tipo],
    ...options
  };

  // Generar copy según tipo
  let copy = '';
  switch (tipo) {
    case 'notebook':
    case 'notebook_simple': // Retrocompatibilidad
    case 'notebook_comercial':
    case 'notebook_completo':
    case 'notebook_documento':
      copy = generateNotebookCopy(producto, config);
      break;
    case 'celular':
    case 'celular_simple': // Retrocompatibilidad
    case 'celular_comercial':
    case 'celular_completo':
    case 'celular_documento':
      copy = generateCelularCopy(producto, config);
      break;
    case 'otro':
    case 'otro_simple': // Retrocompatibilidad
    case 'otro_comercial':
    case 'otro_completo':
    case 'otro_documento':
      copy = generateOtroCopy(producto, config);
      break;
    default:
      copy = generateGenericCopy(producto, config);
  }

  // Aplicar límite de caracteres si existe
  if (config.maxLength && copy.length > config.maxLength) {
    copy = copy.substring(0, config.maxLength - 3) + '...';
  }

  return copy;
};

/**
 * Determinar tipo de copy basado en datos y categoría
 */
const determinarTipoCopy = (producto, categoria) => {
  if (categoria) {
    // Si se proporciona categoría explícita
    switch (categoria) {
      case 'notebooks': return 'notebook_completo'; // Para catálogo (uso interno)
      case 'celulares': return 'celular_completo';
      case 'otros': return 'otro_completo';
      default: return categoria.startsWith('otros-') ? 'otro_completo' : 'otro_completo';
    }
  }

  // Auto-determinar por campos del producto (por defecto versión comercial para Listas)
  if (producto.tipo) {
    switch (producto.tipo) {
      case 'computadora': return 'notebook_comercial';
      case 'celular': return 'celular_comercial';
      case 'otro': return 'otro_comercial';
      default: return 'otro_comercial';
    }
  }

  if (producto.procesador && (producto.ram || producto.memoria_ram)) {
    return 'notebook_comercial';
  }

  if (producto.capacidad && producto.modelo && producto.marca) {
    return 'celular_comercial';
  }

  return 'otro_comercial';
};

/**
 * Convertir estado estético a letra (para compatibilidad con Listas.jsx)
 */
const getEstadoLetra = (estado) => {
  if (!estado) return '';

  switch (estado.toLowerCase()) {
    case 'nuevo': return 'A++';
    case 'excelente': return 'A+';
    case 'muy bueno': return 'A';
    case 'bueno': return 'B';
    case 'regular': return 'C';
    default: return estado;
  }
};

/**
 * Capitalizar primera letra de un string
 */
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Helper function to check if SSD/HDD value represents valid storage
 * Handles both numeric values and string values like "256GB", "1TB", "512", etc.
 */
const hasValidStorage = (value) => {
  if (!value) return false;

  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === '') return false;

  // Handle 'N/A' and similar invalid values
  if (typeof value === 'string') {
    const cleanValue = value.trim().toLowerCase();
    if (cleanValue === 'n/a' || cleanValue === 'na' || cleanValue === '-' || cleanValue === 'ninguno' || cleanValue === 'sin') {
      return false;
    }

    // Extract numeric part from strings like "256GB", "1TB", "512", etc.
    const numericMatch = cleanValue.match(/(\d+(?:\.\d+)?)/);
    if (numericMatch) {
      const numericValue = parseFloat(numericMatch[1]);
      return numericValue > 0;
    }

    // If it's a string but no numeric match, consider it invalid
    return false;
  }

  // Handle numeric values
  if (typeof value === 'number') {
    return value > 0;
  }

  return false;
};

/**
 * Generar copy para notebooks
 * NUEVAS: 💻 MODELO - PANTALLA - PROCESADOR - MEMORIA - ALMACENAMIENTO - CONDICION - PRECIO
 * USADAS/REFURBISHED: 💻 MODELO - PANTALLA - PROCESADOR - MEMORIA - ALMACENAMIENTO - 🔋 BATERIA DURACION - CONDICION - ESTADO ESTÉTICO - PRECIO
 */
const generateNotebookCopy = (comp, config) => {
  const partes = [];

  // Determinar si es nueva o usada/refurbished
  const condicion = (comp.condicion || '').toLowerCase();
  const esNueva = condicion === 'nuevo' || condicion === 'nueva';

  // Emoji solo en versión simple
  if (config.includeEmojis) {
    partes.push('💻');
  }

  // 1. MODELO (tal como está en la base de datos)
  const modelo = comp.modelo || 'Sin modelo';
  partes.push(modelo);

  // 2. PANTALLA Y RESOLUCIÓN JUNTAS (Movido antes de procesador)
  let pantallaResolucion = '';
  if (comp.pantalla) {
    pantallaResolucion = String(comp.pantalla);
    // Agregar comillas si no las tiene y no dice "pulgadas"
    if (!pantallaResolucion.includes('"') && !pantallaResolucion.toLowerCase().includes('pulgadas')) {
      pantallaResolucion += '"';
    }
  }
  if (comp.resolucion || comp.hz || comp.frecuencia) {
    let resolucionCompleta = '';
    if (comp.resolucion) {
      // Para MacBooks, mostrar solo los números de resolución
      if (comp.resolucion.toLowerCase().includes('macbook')) {
        // Extraer números de resolución de RESOLUCIONES_LABELS
        const RESOLUCIONES_NUMEROS = {
          'MacBook Air 13"': '2560x1664',
          'MacBook Air 15"': '2880x1864',
          'MacBook Pro 14"': '3024x1964',
          'MacBook Pro 16"': '3456x2234'
        };
        resolucionCompleta = RESOLUCIONES_NUMEROS[comp.resolucion] || comp.resolucion;
      } else {
        // Para Windows, mantener la etiqueta (FHD, QHD, etc.)
        resolucionCompleta = comp.resolucion;
      }
    }
    if (comp.hz || comp.frecuencia) {
      const hz = comp.hz || comp.frecuencia;
      resolucionCompleta += resolucionCompleta ? ` ${hz}HZ` : `${hz}HZ`;
    }
    if (resolucionCompleta) {
      partes.push(pantallaResolucion ? `${pantallaResolucion} ${resolucionCompleta}` : resolucionCompleta);
    }
  } else if (pantallaResolucion) {
    partes.push(pantallaResolucion);
  }

  // 3. PROCESADOR
  if (comp.procesador) {
    partes.push(comp.procesador);
  }

  // 4. MEMORIA
  if (comp.memoria_ram || comp.ram) {
    const ram = comp.memoria_ram || comp.ram;
    const tipoRam = comp.tipo_ram || 'DDR4';
    // Limpiar duplicaciones: quitar "GB" si ya viene en el valor
    const ramLimpio = String(ram).replace(/GB/gi, '');
    partes.push(`${ramLimpio}GB ${tipoRam}`);
  }

  // 5. ALMACENAMIENTO
  const almacenamientos = [];
  if (hasValidStorage(comp.ssd)) {
    const ssdLimpio = String(comp.ssd).replace(/GB/gi, '').replace(/TB/gi, '');
    const unit = String(comp.ssd).toLowerCase().includes('tb') ? 'TB' : 'GB';
    almacenamientos.push(`${ssdLimpio}${unit} SSD`);
  }
  if (hasValidStorage(comp.hdd)) {
    const hddLimpio = String(comp.hdd).replace(/GB/gi, '').replace(/TB/gi, '');
    const unit = String(comp.hdd).toLowerCase().includes('tb') ? 'TB' : 'GB';
    almacenamientos.push(`${hddLimpio}${unit} HDD`);
  }
  if (almacenamientos.length > 0) {
    partes.push(almacenamientos.join(' + '));
  }

  // 6. GPU VRAM (AL FINAL, después de almacenamiento)
  if (comp.placa_video || comp.placa_de_video || comp.gpu) {
    let gpu = comp.placa_video || comp.placa_de_video || comp.gpu;
    // Verificar si vram existe y no está vacío
    if (comp.vram && comp.vram !== '' && comp.vram !== 'N/A' && comp.vram !== null) {
      // Limpiar duplicaciones: quitar "GB" si ya viene en el valor
      const vramLimpio = String(comp.vram).replace(/GB/gi, '').trim();
      // Solo agregar si vramLimpio no está vacío y es un número válido
      if (vramLimpio && !isNaN(parseFloat(vramLimpio))) {
        gpu += ` ${vramLimpio}GB`;
      }
    }
    partes.push(gpu);
  }

  // 7. BATERÍA - SOLO para USADAS/REFURBISHED
  if (!esNueva) {
    // Batería con emoji 🔋
    let bateriaInfo = '';
    if (comp.porcentaje_de_bateria || comp.bateria) {
      const bateria = comp.porcentaje_de_bateria || comp.bateria;
      const bateriaLimpio = String(bateria).replace(/%/g, '').trim();
      bateriaInfo = `🔋${bateriaLimpio}%`;
    }
    if (comp.duracion_bateria && comp.duracion_bateria > 0) {
      const duracion = comp.duracion_bateria;
      const duracionLimpio = String(duracion).replace(/H/gi, '').trim();
      bateriaInfo += bateriaInfo ? ` ${duracionLimpio}H` : `🔋${duracionLimpio}H`;
    }
    if (bateriaInfo) {
      partes.push(bateriaInfo);
    }
  }

  // 8. CONDICION - SIEMPRE
  if (comp.condicion) {
    partes.push(capitalize(comp.condicion));
  }

  // 9. ESTADO ESTÉTICO - SOLO para USADAS/REFURBISHED
  if (!esNueva && comp.estado) {
    partes.push(comp.estado);
  }

  // 10. COLOR - SIEMPRE (antes del precio, tanto en simple como completo)
  if (comp.color) {
    partes.push(comp.color);
  }

  // 11. IDIOMA TECLADO - SIEMPRE (después del color, antes del precio)
  if (comp.idioma || comp.idioma_teclado) {
    const idioma = comp.idioma || comp.idioma_teclado;
    partes.push(idioma);
  }

  // CAMPOS ADICIONALES SOLO EN VERSIÓN COMPLETA (NO en documento)
  if (config.style === 'completo') {
    // 12. SISTEMA OPERATIVO
    if (comp.sistema_operativo || comp.so) {
      const so = comp.sistema_operativo || comp.so;
      partes.push(so);
    }

    // 13. NOTAS - Removidas según requerimientos

    // 14. OBSERVACIONES
    if (comp.observaciones || comp.notas || comp.comentarios) {
      const obs = comp.observaciones || comp.notas || comp.comentarios;
      partes.push(`Observaciones: ${obs}`);
    }

    // 15. GARANTIA - Removida del copy según requerimientos

    // 16. SUCURSAL - Removida del copy, ahora se muestra en columna separada
  }

  // VERSIÓN DOCUMENTO: Sin observaciones, notas, SO adicional
  // Ya tiene: MODELO - PANTALLA - PROCESADOR - RAM - SSD/HDD - GPU - BATERÍA - ESTADO - COLOR - IDIOMA

  // 15. PRECIO (solo en versión simple)
  if (config.includePrice) {
    if (comp.precio_venta_usd) {
      partes.push(formatearMonto(comp.precio_venta_usd, 'USD', true));
    } else {
      partes.push('CONSULTAR');
    }
  }

  // Unir las partes
  if (config.includeEmojis) {
    // Para versión simple: emoji seguido del resto sin separador
    return partes[0] + ' ' + partes.slice(1).join(' - ');
  } else {
    // Para versión completa: normal con separadores
    return partes.join(' - ');
  }
};

/**
 * Generar copy para celulares
 * NUEVOS: 📱 MODELO - CAPACIDAD - COLOR - CONDICION - PRECIO
 * USADOS/REFURBISHED: 📱 MODELO - CAPACIDAD - COLOR - 🔋 BATERIA - CONDICION - ESTADO ESTÉTICO - PRECIO
 */
const generateCelularCopy = (cel, config) => {
  const partes = [];

  // Determinar si es nuevo o usado/refurbished
  const condicion = (cel.condicion || '').toLowerCase();
  const esNuevo = condicion === 'nuevo' || condicion === 'nueva';

  // Emoji solo en versión simple
  if (config.includeEmojis) {
    partes.push('📱');
  }

  // IMEI/SERIAL removido del copy - ahora se muestra en columna separada

  // 1. MODELO (tal como está en la base de datos)
  const modelo = cel.modelo || 'Sin modelo';
  partes.push(modelo);

  // 2. COLOR (Movido antes de capacidad)
  if (cel.color) {
    partes.push(cel.color);
  }

  // 3. CAPACIDAD
  if (cel.capacidad) {
    // Convertir a string primero por si es numérico
    const capacidadStr = String(cel.capacidad);
    // Agregar 'GB' si no está presente
    const capacidadFinal = capacidadStr.toUpperCase().includes('GB') ? capacidadStr : `${capacidadStr}GB`;
    partes.push(capacidadFinal);
  }

  // 4. BATERÍA - SOLO para USADOS/REFURBISH (antes del precio)
  if (!esNuevo) {
    // Batería con emoji 🔋
    let bateriaInfo = '';
    if (cel.bateria || cel.porcentaje_de_bateria) {
      const bateria = cel.bateria || cel.porcentaje_de_bateria;
      const bateriaLimpio = String(bateria).replace(/%/g, '').trim();
      bateriaInfo = `🔋${bateriaLimpio}%`;
    }
    if (cel.ciclos_bateria && cel.ciclos_bateria > 0) {
      const ciclos = cel.ciclos_bateria;
      bateriaInfo += bateriaInfo ? ` ${ciclos} ciclos` : `🔋${ciclos} ciclos`;
    }
    if (bateriaInfo) {
      partes.push(bateriaInfo);
    }
  }

  // 5. CONDICION - SIEMPRE
  if (cel.condicion) {
    partes.push(capitalize(cel.condicion));
  }

  // 6. ESTADO ESTÉTICO - SOLO para USADOS/REFURBISHED
  if (!esNuevo && cel.estado) {
    partes.push(cel.estado);
  }

  // 7. CAMPOS ADICIONALES - Removidos según nuevos requerimientos

  // CAMPOS ADICIONALES SOLO EN VERSIÓN COMPLETA (NO en documento)
  if (config.style === 'completo') {
    // 7. NOTAS - Removidas según requerimientos

    // 8. OBSERVACIONES
    if (cel.observaciones || cel.notas || cel.comentarios) {
      const obs = cel.observaciones || cel.notas || cel.comentarios;
      partes.push(`Observaciones: ${obs}`);
    }

    // 9. GARANTIA - Removida del copy según requerimientos

    // 10. SUCURSAL - Removida del copy, ahora se muestra en columna separada

    // 11. PROVEEDOR
    if (cel.proveedor || cel.importador) {
      const proveedor = cel.proveedor || cel.importador;
      partes.push(`Proveedor: ${proveedor}`);
    }
  }

  // 8. OBSERVACIONES - Para versión comercial (simple) y completa
  if (config.style === 'simple' && (cel.observaciones || cel.notas || cel.comentarios)) {
    const obs = cel.observaciones || cel.notas || cel.comentarios;
    partes.push(obs);
  }

  // 9. FALLAS/NOTAS - Para versión comercial (simple) ANTES del precio
  if (config.style === 'simple' && cel.fallas && cel.fallas.trim()) {
    partes.push(cel.fallas);
  }

  // VERSIÓN DOCUMENTO: Sin observaciones, notas, proveedor
  // Ya tiene: MODELO - COLOR - CAPACIDAD - BATERÍA - ESTADO

  // 10. PRECIO (solo en versión simple)
  if (config.includePrice) {
    if (cel.precio_venta_usd) {
      partes.push(formatearMonto(cel.precio_venta_usd, 'USD', true));
    } else {
      partes.push('CONSULTAR');
    }
  }

  // Unir las partes
  if (config.includeEmojis) {
    // Para versión simple: emoji seguido del resto sin separador
    return partes[0] + ' ' + partes.slice(1).join(' - ');
  } else {
    // Para versión completa: normal con separadores
    return partes.join(' - ');
  }
};

/**
 * Obtener emoji según categoría del producto
 */
const getCategoriaEmoji = (categoria) => {
  if (!categoria) return '📦';

  const categoriaUpper = categoria.toUpperCase();

  const emojiMap = {
    'ACCESORIOS': '🔧',
    'MONITORES': '🖥️',
    'COMPONENTES': '⚡',
    'FUNDAS_TEMPLADOS': '🛡️',
    'TABLETS': '📱',
    'APPLE': '🍎',
    'MOUSE_TECLADOS': '⌨️',
    'AUDIO': '🎧',
    'ALMACENAMIENTO': '💾',
    'CAMARAS': '📷',
    'CONSOLAS': '🎮',
    'GAMING': '🎯',
    'DRONES': '🚁',
    'WATCHES': '⌚',
    'PLACAS_VIDEO': '🎨',
    'STREAMING': '📡',
    'REDES': '🌐',
    'BAGS_CASES': '💼',
    'CABLES_CARGADORES': '🔌',
    'REPUESTOS': '🔩'
  };

  return emojiMap[categoriaUpper] || '📦';
};

/**
 * Generar copy para otros productos
 * SIMPLE: [EMOJI CATEGORÍA] NOMBRE_PRODUCTO - CONDICION - PRECIO
 * COMPLETO: CODIGO - MODELO - DESCRIPCION - CATEGORIA - COLOR - CONDICION - ESTADO - FALLAS - OBSERVACIONES
 */
const generateOtroCopy = (otro, config) => {
  const partes = [];

  // Determinar si es nuevo o usado/refurbished
  const condicion = (otro.condicion || '').toLowerCase();
  const esNuevo = condicion === 'nuevo' || condicion === 'nueva';

  // Emoji solo en versión simple - usar emoji según categoría
  if (config.includeEmojis) {
    const emoji = getCategoriaEmoji(otro.categoria);
    partes.push(emoji);
  }

  // CODIGO al principio (solo en versión completa)
  if (config.style === 'completo' && (otro.codigo || otro.codigo_producto || otro.sku)) {
    const codigo = otro.codigo || otro.codigo_producto || otro.sku;
    partes.push(codigo);
  }

  // 1. NOMBRE DEL PRODUCTO
  let nombreProducto = '';
  if (otro.nombre_producto) {
    nombreProducto = otro.nombre_producto;
  } else if (otro.marca && (otro.modelo || otro.modelo_otro)) {
    const modeloProducto = otro.modelo || otro.modelo_otro;
    nombreProducto = `${otro.marca} ${modeloProducto}`;
  } else if (otro.modelo || otro.modelo_otro) {
    nombreProducto = otro.modelo || otro.modelo_otro;
  } else if (otro.marca) {
    nombreProducto = otro.marca;
  } else {
    nombreProducto = otro.descripcion || 'Producto sin nombre';
  }
  partes.push(nombreProducto);

  // Para versión SIMPLE: solo EMOJI - NOMBRE - PRECIO (sin descripción, sin especificaciones)
  // Para versión COMPLETA: agregar campos adicionales
  // Para versión DOCUMENTO: SOLO NOMBRE (sin descripción, color, estado, notas, observaciones)
  if (config.style === 'completo') {
    // 2. DESCRIPCION (solo si es diferente del nombre)
    if (otro.descripcion && otro.descripcion !== otro.nombre_producto) {
      partes.push(otro.descripcion);
    }
  }

  // 3. CONDICION - SIEMPRE
  if (otro.condicion) {
    partes.push(capitalize(otro.condicion));
  }

  // 4. ESTADO - SOLO para USADOS/REFURBISHED
  if (!esNuevo && otro.estado) {
    partes.push(otro.estado);
  }

  // CAMPOS ADICIONALES SOLO EN VERSIÓN COMPLETA (NO en documento)
  if (config.style === 'completo') {
    // 5. COLOR
    if (otro.color) {
      partes.push(otro.color);
    }

    // 6. NOTAS - Removidas según requerimientos

    // 7. OBSERVACIONES
    if (otro.observaciones || otro.notas || otro.comentarios) {
      const obs = otro.observaciones || otro.notas || otro.comentarios;
      partes.push(`Observaciones: ${obs}`);
    }

    // 8. GARANTIA - Removida del copy según requerimientos

    // 9. SUCURSAL - Removida del copy, ahora se muestra en columna separada
  }

  // VERSIÓN DOCUMENTO: Solo NOMBRE_PRODUCTO
  // Sin descripción, color, estado, notas ni observaciones

  // 8. PRECIO (solo en versión simple)
  if (config.includePrice) {
    if (otro.precio_venta_usd) {
      partes.push(formatearMonto(otro.precio_venta_usd, 'USD', true));
    } else {
      partes.push('CONSULTAR');
    }
  }

  // Unir las partes
  if (config.includeEmojis) {
    // Para versión simple: emoji seguido del resto sin separador
    return partes[0] + ' ' + partes.slice(1).join(' - ');
  } else {
    // Para versión completa: normal con separadores
    return partes.join(' - ');
  }
};

// Las funciones para desktop, tablets, gpu, apple, componentes y audio
// se pueden manejar con generateOtroCopy ya que siguen el mismo patrón

/**
 * Generar copy genérico para productos no clasificados
 */
const generateGenericCopy = (producto, config) => {
  // Para productos no clasificados, usar la función de "otros"
  return generateOtroCopy(producto, config);
};

// Funciones wrapper para retrocompatibilidad

/**
 * Función wrapper para compatibilidad con Listas.jsx
 */
export const generarCopy = (producto) => {
  const tipo = determinarTipoCopy(producto);
  return generateCopy(producto, { tipo: tipo });
};

export const generarCopyComputadora = (comp) => {
  return generateCopy({ ...comp, tipo: 'computadora' }, { tipo: 'notebook_comercial' });
};

export const generarCopyCelular = (cel) => {
  return generateCopy({ ...cel, tipo: 'celular' }, { tipo: 'celular_comercial' });
};

export const generarCopyOtro = (otro) => {
  return generateCopy({ ...otro, tipo: 'otro' }, { tipo: 'otro_comercial' });
};

/**
 * Función wrapper para compatibilidad con Catalogo.jsx
 */
export const generateUnifiedCopy = (producto, categoria, cotizacionDolar) => {
  const tipo = determinarTipoCopy(producto, categoria);
  return generateCopy(producto, {
    tipo: tipo,
    categoria: categoria,
    cotizacionDolar: cotizacionDolar
  });
};

// FUNCIONES PARA VERSIONES COMERCIALES (Listas + botones copy)
export const generateNotebookComercial = (producto) => {
  return generateCopy(producto, { tipo: 'notebook_comercial' });
};

export const generateCelularComercial = (producto) => {
  return generateCopy(producto, { tipo: 'celular_comercial' });
};

export const generateOtroComercial = (producto) => {
  return generateCopy(producto, { tipo: 'otro_comercial' });
};

// Alias para retrocompatibilidad
export const generateNotebookSimple = generateNotebookComercial;
export const generateCelularSimple = generateCelularComercial;
export const generateOtroSimple = generateOtroComercial;

// FUNCIONES PARA VERSIONES COMPLETAS (Catálogo información)
export const generateNotebookCompleto = (producto) => {
  return generateCopy(producto, { tipo: 'notebook_completo' });
};

export const generateCelularCompleto = (producto) => {
  return generateCopy(producto, { tipo: 'celular_completo' });
};

export const generateOtroCompleto = (producto) => {
  return generateCopy(producto, { tipo: 'otro_completo' });
};

// Alias para compatibilidad
export const generateNotebook = (producto) => {
  return generateCopy(producto, { tipo: 'notebook_simple' });
};

export const generateCelular = (producto) => {
  return generateCopy(producto, { tipo: 'celular_simple' });
};

export const generateOtro = (producto) => {
  return generateCopy(producto, { tipo: 'otro_simple' });
};

// ============================================================
// FUNCIONES PARA VENTA_ITEMS - TODOS LOS CAMPOS DE CADA TABLA
// Genera copy con todos los valores sin labels, separados por " - "
// ============================================================

/**
 * Genera copy con TODOS los campos de la tabla inventario (notebooks)
 * Solo valores, sin labels, ordenados por columnas de la tabla
 */
export const generateNotebookAllFields = (producto) => {
  const valores = [];

  // Orden: id, serial, modelo, marca, categoria, procesador, linea_procesador, ram, tipo_ram, slots,
  // ssd, hdd, pantalla, resolucion, refresh, touchscreen, so, placa_video, vram, 
  // idioma_teclado, teclado_retro, color, bateria, duracion, condicion, estado,
  // garantia_update, garantia_oficial, fallas, sucursal, ingreso, precio_costo_usd, envios_repuestos, precio_costo_total, precio_venta_usd

  if (producto.id !== undefined) valores.push(producto.id);
  if (producto.serial) valores.push(producto.serial);
  if (producto.modelo) valores.push(producto.modelo);
  if (producto.marca) valores.push(producto.marca);
  if (producto.categoria) valores.push(producto.categoria);
  if (producto.procesador) valores.push(producto.procesador);
  if (producto.linea_procesador) valores.push(producto.linea_procesador);
  if (producto.ram || producto.memoria_ram) valores.push(producto.ram || producto.memoria_ram);
  if (producto.tipo_ram) valores.push(producto.tipo_ram);
  if (producto.slots) valores.push(producto.slots);
  if (producto.ssd) valores.push(producto.ssd);
  if (producto.hdd) valores.push(producto.hdd);
  if (producto.pantalla) valores.push(producto.pantalla);
  if (producto.resolucion) valores.push(producto.resolucion);
  if (producto.refresh || producto.hz) valores.push(producto.refresh || producto.hz);
  if (producto.touchscreen !== undefined) valores.push(producto.touchscreen);
  if (producto.so || producto.sistema_operativo) valores.push(producto.so || producto.sistema_operativo);
  if (producto.placa_video || producto.placa_de_video || producto.gpu) valores.push(producto.placa_video || producto.placa_de_video || producto.gpu);
  if (producto.vram) valores.push(producto.vram);
  if (producto.idioma_teclado || producto.idioma) valores.push(producto.idioma_teclado || producto.idioma);
  if (producto.teclado_retro) valores.push(producto.teclado_retro);
  if (producto.color) valores.push(producto.color);
  if (producto.bateria || producto.porcentaje_de_bateria) valores.push(producto.bateria || producto.porcentaje_de_bateria);
  if (producto.duracion || producto.duracion_bateria) valores.push(producto.duracion || producto.duracion_bateria);
  if (producto.condicion) valores.push(capitalize(producto.condicion));
  if (producto.estado) valores.push(producto.estado);
  if (producto.garantia_update) valores.push(producto.garantia_update);
  if (producto.garantia_oficial) valores.push(producto.garantia_oficial);
  if (producto.fallas) valores.push(producto.fallas);
  if (producto.sucursal) valores.push(producto.sucursal);
  if (producto.ingreso) valores.push(producto.ingreso);
  if (producto.precio_costo_usd !== undefined) valores.push(producto.precio_costo_usd);
  if (producto.envios_repuestos !== undefined) valores.push(producto.envios_repuestos);
  if (producto.precio_costo_total !== undefined) valores.push(producto.precio_costo_total);
  if (producto.precio_venta_usd !== undefined) valores.push(producto.precio_venta_usd);

  return valores.join(' - ') || 'Sin información';
};

/**
 * Genera copy con TODOS los campos de la tabla celulares
 * Solo valores, sin labels, ordenados por columnas de la tabla
 */
export const generateCelularAllFields = (producto) => {
  const valores = [];

  // Orden: id, serial, modelo, marca, color, capacidad, ram, condicion, estado, bateria, ciclos,
  // fallas, observaciones, garantia, proveedor, sucursal, precio_compra_usd, costos_adicionales, costo_total_usd, precio_venta_usd

  if (producto.id !== undefined) valores.push(producto.id);
  if (producto.serial) valores.push(producto.serial);
  if (producto.modelo) valores.push(producto.modelo);
  if (producto.marca) valores.push(producto.marca);
  if (producto.color) valores.push(producto.color);
  if (producto.capacidad) valores.push(producto.capacidad);
  if (producto.ram) valores.push(producto.ram);
  if (producto.condicion) valores.push(capitalize(producto.condicion));
  if (producto.estado) valores.push(producto.estado);
  if (producto.bateria || producto.porcentaje_de_bateria) valores.push(producto.bateria || producto.porcentaje_de_bateria);
  if (producto.ciclos || producto.ciclos_bateria) valores.push(producto.ciclos || producto.ciclos_bateria);
  if (producto.fallas) valores.push(producto.fallas);
  if (producto.observaciones) valores.push(producto.observaciones);
  if (producto.garantia) valores.push(producto.garantia);
  if (producto.proveedor || producto.importador) valores.push(producto.proveedor || producto.importador);
  if (producto.sucursal) valores.push(producto.sucursal);
  if (producto.precio_compra_usd !== undefined) valores.push(producto.precio_compra_usd);
  if (producto.costos_adicionales !== undefined) valores.push(producto.costos_adicionales);
  if (producto.costo_total_usd !== undefined) valores.push(producto.costo_total_usd);
  if (producto.precio_venta_usd !== undefined) valores.push(producto.precio_venta_usd);

  return valores.join(' - ') || 'Sin información';
};

/**
 * Genera copy con TODOS los campos de la tabla otros
 * Solo valores, sin labels, ordenados por columnas de la tabla
 */
export const generateOtroAllFields = (producto) => {
  const valores = [];

  // Orden: id, serial, codigo, nombre_producto, descripcion, categoria, marca, modelo, condicion, estado,
  // color, fallas, observaciones, garantia, sucursal, cantidad_la_plata, cantidad_mitre,
  // precio_compra_usd, costos_adicionales, costo_total_usd, precio_venta_usd

  if (producto.id !== undefined) valores.push(producto.id);
  if (producto.serial) valores.push(producto.serial);
  if (producto.codigo || producto.codigo_producto || producto.sku) valores.push(producto.codigo || producto.codigo_producto || producto.sku);
  if (producto.nombre_producto) valores.push(producto.nombre_producto);
  if (producto.descripcion) valores.push(producto.descripcion);
  if (producto.categoria) valores.push(producto.categoria);
  if (producto.marca) valores.push(producto.marca);
  if (producto.modelo || producto.modelo_otro) valores.push(producto.modelo || producto.modelo_otro);
  if (producto.condicion) valores.push(capitalize(producto.condicion));
  if (producto.estado) valores.push(producto.estado);
  if (producto.color) valores.push(producto.color);
  if (producto.fallas) valores.push(producto.fallas);
  if (producto.observaciones) valores.push(producto.observaciones);
  if (producto.garantia) valores.push(producto.garantia);
  if (producto.sucursal) valores.push(producto.sucursal);
  if (producto.cantidad_la_plata !== undefined) valores.push(producto.cantidad_la_plata);
  if (producto.cantidad_mitre !== undefined) valores.push(producto.cantidad_mitre);
  if (producto.precio_compra_usd !== undefined) valores.push(producto.precio_compra_usd);
  if (producto.costos_adicionales !== undefined) valores.push(producto.costos_adicionales);
  if (producto.costo_total_usd !== undefined) valores.push(producto.costo_total_usd);
  if (producto.precio_venta_usd !== undefined) valores.push(producto.precio_venta_usd);

  return valores.join(' - ') || 'Sin información';
};

export default generateCopy;