// copyGenerator.js - Sistema unificado de generación de copys
// Unifica la lógica de Listas.jsx y Catalogo.jsx con múltiples versiones

import { formatearMonto } from './formatters';

/**
 * Tipos de copys disponibles:
 * VERSIONES SIMPLES (para Listas y botones copy):
 * - 'notebook_simple': 💻 MODELO - PANTALLA - PROCESADOR - MEMORIA TIPO - SSD - HDD - RESOLUCION HZ - GPU VRAM - BATERIA DURACION - PRECIO
 * - 'celular_simple': 📱 MODELO - CAPACIDAD - COLOR - BATERIA - ESTADO - PRECIO
 * - 'otro_simple': 📦 MODELO - DESCRIPCION - PRECIO
 * 
 * VERSIONES COMPLETAS (para Catálogo - uso interno):
 * - 'notebook_completo': MODELO - PANTALLA - PROCESADOR - MEMORIA TIPO - SSD - HDD - RESOLUCION HZ - GPU VRAM - BATERIA DURACION (sin emoji, sin precio)
 * - 'celular_completo': MODELO - CAPACIDAD - COLOR - BATERIA - ESTADO (sin emoji, sin precio)
 * - 'otro_completo': MODELO - DESCRIPCION (sin emoji, sin precio)
 */

// Configuraciones por defecto para cada tipo
const TYPE_DEFAULTS = {
  // VERSIONES SIMPLES - Para Listas y copy buttons
  notebook_simple: {
    includeEmojis: true,
    includePrice: true,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'simple'
  },
  celular_simple: {
    includeEmojis: true,
    includePrice: true,
    includeTechnicalDetails: true,
    separator: ' - ',
    maxLength: null,
    style: 'simple'
  },
  otro_simple: {
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
    case 'notebook_simple':
    case 'notebook_completo':
      copy = generateNotebookCopy(producto, config);
      break;
    case 'celular':
    case 'celular_simple':
    case 'celular_completo':
      copy = generateCelularCopy(producto, config);
      break;
    case 'otro':
    case 'otro_simple':
    case 'otro_completo':
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

  // Auto-determinar por campos del producto (por defecto versión simple para Listas)
  if (producto.tipo) {
    switch (producto.tipo) {
      case 'computadora': return 'notebook_simple';
      case 'celular': return 'celular_simple';
      case 'otro': return 'otro_simple';
      default: return 'otro_simple';
    }
  }
  
  if (producto.procesador && (producto.ram || producto.memoria_ram)) {
    return 'notebook_simple';
  }
  
  if (producto.capacidad && producto.modelo && producto.marca) {
    return 'celular_simple';
  }
  
  return 'otro_simple';
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
 * NUEVAS: 💻 MODELO - PROCESADOR - MEMORIA - ALMACENAMIENTO - PANTALLA - PRECIO
 * USADAS/REFURBISHED: 💻 MODELO - PROCESADOR - MEMORIA - ALMACENAMIENTO - PANTALLA - 🔋 BATERIA DURACION - ESTADO ESTÉTICO - PRECIO
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

  // 1. MODELO
  const modelo = comp.modelo || 'Sin modelo';
  partes.push(modelo.toUpperCase());

  // 2. PROCESADOR
  if (comp.procesador) {
    partes.push(comp.procesador.toUpperCase());
  }

  // 3. MEMORIA
  if (comp.memoria_ram || comp.ram) {
    const ram = comp.memoria_ram || comp.ram;
    const tipoRam = comp.tipo_ram || 'DDR4';
    // Limpiar duplicaciones: quitar "GB" si ya viene en el valor
    const ramLimpio = String(ram).replace(/GB/gi, '');
    partes.push(`${ramLimpio}GB ${tipoRam}`.toUpperCase());
  }

  // 4. ALMACENAMIENTO (después de memoria, antes de pantalla)
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

  // 5. PANTALLA Y RESOLUCIÓN JUNTAS
  let pantallaResolucion = '';
  if (comp.pantalla) {
    // Mostrar el texto exactamente como se cargó, sin agregar comillas
    pantallaResolucion = String(comp.pantalla);
  }
  if (comp.resolucion || comp.hz || comp.frecuencia) {
    let resolucionCompleta = '';
    if (comp.resolucion) {
      resolucionCompleta = comp.resolucion.toUpperCase();
    }
    if (comp.hz || comp.frecuencia) {
      const hz = comp.hz || comp.frecuencia;
      resolucionCompleta += resolucionCompleta ? ` ${hz}HZ` : `${hz}HZ`;
    }
    if (resolucionCompleta) {
      pantallaResolucion += pantallaResolucion ? ` ${resolucionCompleta}` : resolucionCompleta;
    }
  }
  if (pantallaResolucion) {
    partes.push(pantallaResolucion);
  }

  // 6. GPU VRAM (AL FINAL, después de pantalla)
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
    partes.push(gpu.toUpperCase());
  }

  // 7. BATERÍA Y ESTADO - SOLO para USADAS/REFURBISHED (antes del precio)
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

    // Estado estético
    if (comp.estado) {
      const estado = comp.estado.toUpperCase();
      partes.push(estado);
    }
  }

  // 8. COLOR - SIEMPRE (antes del precio, tanto en simple como completo)
  if (comp.color) {
    if (config.style === 'completo') {
      partes.push(comp.color.charAt(0).toUpperCase() + comp.color.slice(1).toLowerCase());
    } else {
      partes.push(comp.color.toUpperCase());
    }
  }

  // 9. IDIOMA TECLADO - SIEMPRE (después del color, antes del precio)
  if (comp.idioma || comp.idioma_teclado) {
    const idioma = comp.idioma || comp.idioma_teclado;
    if (config.style === 'completo') {
      partes.push(idioma.charAt(0).toUpperCase() + idioma.slice(1).toLowerCase());
    } else {
      partes.push(idioma.toUpperCase());
    }
  }

  // CAMPOS ADICIONALES SOLO EN VERSIÓN COMPLETA
  if (config.style === 'completo') {
    // 11. SISTEMA OPERATIVO
    if (comp.sistema_operativo || comp.so) {
      const so = comp.sistema_operativo || comp.so;
      partes.push(so.toUpperCase());
    }

    // 12. COLOR
    if (comp.color) {
      partes.push(comp.color.charAt(0).toUpperCase() + comp.color.slice(1).toLowerCase());
    }

    // 13. IDIOMA
    if (comp.idioma || comp.idioma_teclado) {
      const idioma = comp.idioma || comp.idioma_teclado;
      partes.push(idioma.charAt(0).toUpperCase() + idioma.slice(1).toLowerCase());
    }

    // 14. NOTAS (antes Fallas) - Solo mostrar si tiene contenido
    if (comp.fallas || comp.problemas || comp.defectos) {
      const notas = comp.fallas || comp.problemas || comp.defectos;
      // Verificar que no esté vacío o sea "ninguna"
      const notasLimpio = notas.trim().toLowerCase();
      if (notasLimpio && notasLimpio !== 'ninguna' && notasLimpio !== 'ninguno' && notasLimpio !== 'n/a') {
        partes.push(`Notas: ${notas.charAt(0).toUpperCase() + notas.slice(1).toLowerCase()}`);
      }
    }

    // 15. OBSERVACIONES
    if (comp.observaciones || comp.notas || comp.comentarios) {
      const obs = comp.observaciones || comp.notas || comp.comentarios;
      partes.push(`Observaciones: ${obs.charAt(0).toUpperCase() + obs.slice(1).toLowerCase()}`);
    }

    // 16. GARANTIA - Removida del copy según requerimientos

    // 17. SUCURSAL - Removida del copy, ahora se muestra en columna separada
  }

  // 11. PRECIO (solo en versión simple)
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
 * NUEVOS: 📱 MODELO - CAPACIDAD - COLOR - PRECIO (sin batería, sin estado)
 * USADOS/REFURBISHED: 📱 MODELO - CAPACIDAD - COLOR - 🔋 BATERIA - ESTADO ESTÉTICO - PRECIO
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

  // 1. MODELO (sin marca al principio)
  const modelo = cel.modelo || 'Sin modelo';
  partes.push(modelo.toUpperCase());

  // 2. CAPACIDAD
  if (cel.capacidad) {
    // La capacidad ya viene formateada (ej: "256GB"), no agregar más unidades
    partes.push(cel.capacidad.toUpperCase());
  }

  // 3. COLOR
  if (cel.color) {
    if (config.style === 'completo') {
      partes.push(cel.color.charAt(0).toUpperCase() + cel.color.slice(1).toLowerCase());
    } else {
      partes.push(cel.color.toUpperCase());
    }
  }

  // 4. BATERÍA Y ESTADO - SOLO para USADOS/REFURBISH (antes del precio)
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

    // Estado estético
    if (cel.estado) {
      const estado = cel.estado.toUpperCase();
      partes.push(estado);
    }
  }

  // 5. CAMPOS ADICIONALES - Removidos según nuevos requerimientos
  
  // CAMPOS ADICIONALES SOLO EN VERSIÓN COMPLETA
  if (config.style === 'completo') {
    // 6. NOTAS (antes Fallas) - Solo mostrar si tiene contenido
    if (cel.fallas || cel.problemas || cel.defectos) {
      const notas = cel.fallas || cel.problemas || cel.defectos;
      // Verificar que no esté vacío o sea "ninguna"
      const notasLimpio = notas.trim().toLowerCase();
      if (notasLimpio && notasLimpio !== 'ninguna' && notasLimpio !== 'ninguno' && notasLimpio !== 'n/a') {
        partes.push(`Notas: ${notas.charAt(0).toUpperCase() + notas.slice(1).toLowerCase()}`);
      }
    }
    
    // 7. OBSERVACIONES
    if (cel.observaciones || cel.notas || cel.comentarios) {
      const obs = cel.observaciones || cel.notas || cel.comentarios;
      partes.push(`Observaciones: ${obs.charAt(0).toUpperCase() + obs.slice(1).toLowerCase()}`);
    }
    
    // 8. GARANTIA - Removida del copy según requerimientos
    
    // 9. SUCURSAL - Removida del copy, ahora se muestra en columna separada
    
    // 10. PROVEEDOR
    if (cel.proveedor || cel.importador) {
      const proveedor = cel.proveedor || cel.importador;
      partes.push(`Proveedor: ${proveedor.charAt(0).toUpperCase() + proveedor.slice(1).toLowerCase()}`);
    }
  }
  
  // 6. PRECIO (solo en versión simple)
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
 * SIMPLE: [EMOJI CATEGORÍA] NOMBRE_PRODUCTO - PRECIO
 * COMPLETO: CODIGO - MODELO - DESCRIPCION - CATEGORIA - COLOR - ESTADO - FALLAS - OBSERVACIONES
 */
const generateOtroCopy = (otro, config) => {
  const partes = [];

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
  partes.push(nombreProducto.toUpperCase());

  // Para versión SIMPLE: solo EMOJI - NOMBRE - PRECIO (sin descripción, sin especificaciones)
  // Para versión COMPLETA: agregar campos adicionales
  if (config.style === 'completo') {
    // 2. DESCRIPCION (solo si es diferente del nombre)
    if (otro.descripcion && otro.descripcion !== otro.nombre_producto) {
      partes.push(otro.descripcion.charAt(0).toUpperCase() + otro.descripcion.slice(1).toLowerCase());
    }
  }
  
  // CAMPOS ADICIONALES SOLO EN VERSIÓN COMPLETA
  if (config.style === 'completo') {
    // 3. CATEGORIA
    if (otro.categoria) {
      partes.push(otro.categoria.charAt(0).toUpperCase() + otro.categoria.slice(1).toLowerCase());
    }
    
    // 4. COLOR
    if (otro.color) {
      partes.push(otro.color.charAt(0).toUpperCase() + otro.color.slice(1).toLowerCase());
    }
    
    // 5. ESTADO
    if (otro.condicion || otro.estado) {
      const estado = otro.condicion || otro.estado;
      partes.push(estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase());
    }
    
    // 6. NOTAS (antes Fallas) - Solo mostrar si tiene contenido
    if (otro.fallas || otro.problemas || otro.defectos) {
      const notas = otro.fallas || otro.problemas || otro.defectos;
      // Verificar que no esté vacío o sea "ninguna"
      const notasLimpio = notas.trim().toLowerCase();
      if (notasLimpio && notasLimpio !== 'ninguna' && notasLimpio !== 'ninguno' && notasLimpio !== 'n/a') {
        partes.push(`Notas: ${notas.charAt(0).toUpperCase() + notas.slice(1).toLowerCase()}`);
      }
    }
    
    // 7. OBSERVACIONES
    if (otro.observaciones || otro.notas || otro.comentarios) {
      const obs = otro.observaciones || otro.notas || otro.comentarios;
      partes.push(`Observaciones: ${obs.charAt(0).toUpperCase() + obs.slice(1).toLowerCase()}`);
    }
    
    // 8. GARANTIA - Removida del copy según requerimientos
    
    // 9. SUCURSAL - Removida del copy, ahora se muestra en columna separada
  }
  
  // 3. PRECIO (solo en versión simple)
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
  return generateCopy({ ...comp, tipo: 'computadora' }, { tipo: 'notebook_simple' });
};

export const generarCopyCelular = (cel) => {
  return generateCopy({ ...cel, tipo: 'celular' }, { tipo: 'celular_simple' });
};

export const generarCopyOtro = (otro) => {
  return generateCopy({ ...otro, tipo: 'otro' }, { tipo: 'otro_simple' });
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

// FUNCIONES PARA VERSIONES SIMPLES (Listas + botones copy)
export const generateNotebookSimple = (producto) => {
  return generateCopy(producto, { tipo: 'notebook_simple' });
};

export const generateCelularSimple = (producto) => {
  return generateCopy(producto, { tipo: 'celular_simple' });
};

export const generateOtroSimple = (producto) => {
  return generateCopy(producto, { tipo: 'otro_simple' });
};

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

export default generateCopy;