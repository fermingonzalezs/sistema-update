// Utilidades para manejo de jerarquía del Plan de Cuentas

/**
 * Construye un árbol jerárquico a partir de un array plano de cuentas
 * @param {Array} cuentas - Array plano de cuentas con padre_id
 * @returns {Array} Árbol jerárquico
 */
export const buildAccountTree = (cuentas) => {
  if (!cuentas || !Array.isArray(cuentas)) return [];

  // Crear mapa para acceso rápido por ID
  const cuentasMap = new Map();
  cuentas.forEach(cuenta => {
    cuentasMap.set(cuenta.id, { ...cuenta, children: [] });
  });

  // Construir árbol
  const tree = [];
  cuentas.forEach(cuenta => {
    const nodoActual = cuentasMap.get(cuenta.id);
    
    if (cuenta.padre_id === null) {
      // Nodo raíz
      tree.push(nodoActual);
    } else {
      // Nodo hijo - agregar al padre
      const padre = cuentasMap.get(cuenta.padre_id);
      if (padre) {
        padre.children.push(nodoActual);
      }
    }
  });

  return tree;
};

/**
 * Obtiene todos los descendientes de una cuenta (incluyéndola)
 * @param {Object} cuenta - Cuenta padre
 * @param {Array} todasLasCuentas - Array de todas las cuentas
 * @returns {Array} Array de descendientes
 */
export const getDescendants = (cuenta, todasLasCuentas) => {
  const descendants = [cuenta];
  
  const hijos = todasLasCuentas.filter(c => c.padre_id === cuenta.id);
  hijos.forEach(hijo => {
    descendants.push(...getDescendants(hijo, todasLasCuentas));
  });
  
  return descendants;
};

/**
 * Obtiene la ruta completa (breadcrumb) de una cuenta
 * @param {Object} cuenta - Cuenta objetivo
 * @param {Array} todasLasCuentas - Array de todas las cuentas
 * @returns {Array} Array de cuentas desde raíz hasta la cuenta
 */
export const getAccountPath = (cuenta, todasLasCuentas) => {
  const path = [];
  let cuentaActual = cuenta;
  
  while (cuentaActual) {
    path.unshift(cuentaActual);
    cuentaActual = todasLasCuentas.find(c => c.id === cuentaActual.padre_id);
  }
  
  return path;
};

/**
 * Valida que un código de cuenta sea válido según la jerarquía
 * @param {string} codigo - Código a validar
 * @param {number} nivel - Nivel jerárquico esperado
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateAccountCode = (codigo, nivel) => {
  if (!codigo || typeof codigo !== 'string') {
    return { isValid: false, message: 'El código es obligatorio' };
  }

  const parts = codigo.split('.');
  
  if (parts.length !== nivel) {
    return { 
      isValid: false, 
      message: `El código debe tener ${nivel} nivel(es). Ej: ${generateExampleCode(nivel)}` 
    };
  }

  // Validar que cada parte sea numérica
  for (let i = 0; i < parts.length; i++) {
    if (!/^\d+$/.test(parts[i])) {
      return { 
        isValid: false, 
        message: `Cada parte del código debe ser numérica. Encontrado: "${parts[i]}"` 
      };
    }
  }

  return { isValid: true, message: '' };
};

/**
 * Genera un código de ejemplo para el nivel especificado
 * @param {number} nivel - Nivel jerárquico
 * @returns {string} Código de ejemplo
 */
const generateExampleCode = (nivel) => {
  const examples = {
    1: '1',
    2: '1.1',
    3: '1.1.01',
    4: '1.1.01.01',
    5: '1.1.01.01.01'
  };
  return examples[nivel] || '1.1.01.01.01';
};

/**
 * Filtra cuentas por criterios múltiples
 * @param {Array} cuentas - Array de cuentas
 * @param {Object} filtros - Objeto con filtros
 * @returns {Array} Cuentas filtradas
 */
export const filterAccounts = (cuentas, filtros) => {
  if (!cuentas || !Array.isArray(cuentas)) return [];
  
  return cuentas.filter(cuenta => {
    // Filtro por nivel
    if (filtros.nivel && cuenta.nivel !== filtros.nivel) return false;
    
    // Filtro por categoría
    if (filtros.categoria && cuenta.categoria !== filtros.categoria) return false;
    
    // Filtro por tipo contable
    if (filtros.tipo && cuenta.tipo !== filtros.tipo) return false;
    
    // Filtro por moneda
    if (filtros.moneda && cuenta.moneda_original !== filtros.moneda) return false;
    
    // Filtro por imputabilidad
    if (filtros.imputable !== undefined && cuenta.imputable !== filtros.imputable) return false;
    
    // Filtro por búsqueda de texto
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      const coincide = 
        cuenta.codigo.toLowerCase().includes(busqueda) ||
        cuenta.nombre.toLowerCase().includes(busqueda);
      if (!coincide) return false;
    }
    
    return true;
  });
};

/**
 * Obtiene solo las cuentas imputables (que pueden tener movimientos)
 * @param {Array} cuentas - Array de cuentas
 * @returns {Array} Solo cuentas imputables
 */
export const getImputables = (cuentas) => {
  return cuentas.filter(cuenta => cuenta.imputable === true);
};

/**
 * Obtiene cuentas por nivel específico
 * @param {Array} cuentas - Array de cuentas
 * @param {number} nivel - Nivel a filtrar
 * @returns {Array} Cuentas del nivel especificado
 */
export const getAccountsByLevel = (cuentas, nivel) => {
  return cuentas.filter(cuenta => cuenta.nivel === nivel);
};

/**
 * Encuentra la cuenta padre de una cuenta dada
 * @param {Object} cuenta - Cuenta hijo
 * @param {Array} todasLasCuentas - Array de todas las cuentas
 * @returns {Object|null} Cuenta padre o null
 */
export const getParentAccount = (cuenta, todasLasCuentas) => {
  if (!cuenta.padre_id) return null;
  return todasLasCuentas.find(c => c.id === cuenta.padre_id);
};

/**
 * Verifica si una cuenta tiene hijos
 * @param {Object} cuenta - Cuenta a verificar
 * @param {Array} todasLasCuentas - Array de todas las cuentas
 * @returns {boolean} True si tiene hijos
 */
export const hasChildren = (cuenta, todasLasCuentas) => {
  return todasLasCuentas.some(c => c.padre_id === cuenta.id);
};

/**
 * Obtiene los hijos directos de una cuenta
 * @param {Object} cuenta - Cuenta padre
 * @param {Array} todasLasCuentas - Array de todas las cuentas
 * @returns {Array} Array de cuentas hijas
 */
export const getDirectChildren = (cuenta, todasLasCuentas) => {
  return todasLasCuentas.filter(c => c.padre_id === cuenta.id);
};

/**
 * Ordena cuentas por código de forma natural
 * @param {Array} cuentas - Array de cuentas a ordenar
 * @returns {Array} Cuentas ordenadas
 */
export const sortAccountsByCode = (cuentas) => {
  return [...cuentas].sort((a, b) => {
    // Dividir códigos en partes numéricas para comparación natural
    const partsA = a.codigo.split('.').map(Number);
    const partsB = b.codigo.split('.').map(Number);
    
    const maxLength = Math.max(partsA.length, partsB.length);
    
    for (let i = 0; i < maxLength; i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      
      if (partA !== partB) {
        return partA - partB;
      }
    }
    
    return 0;
  });
};

/**
 * Genera el próximo código disponible para un nivel dado
 * @param {Array} cuentas - Array de cuentas existentes
 * @param {string} codigoPadre - Código del padre (null para nivel 1)
 * @returns {string} Próximo código disponible
 */
export const generateNextCode = (cuentas, codigoPadre = null) => {
  let codigosExistentes;
  
  if (codigoPadre === null) {
    // Nivel 1 - buscar códigos como "1", "2", "3"
    codigosExistentes = cuentas
      .filter(c => c.nivel === 1)
      .map(c => parseInt(c.codigo))
      .filter(n => !isNaN(n));
  } else {
    // Niveles inferiores - buscar códigos que empiecen con el padre
    const patron = new RegExp(`^${codigoPadre.replace(/\./g, '\\.')}\\.(.+)$`);
    codigosExistentes = cuentas
      .map(c => c.codigo.match(patron))
      .filter(match => match !== null)
      .map(match => {
        const ultimaParte = match[1].split('.')[0];
        return parseInt(ultimaParte);
      })
      .filter(n => !isNaN(n));
  }
  
  const maxCodigo = codigosExistentes.length > 0 ? Math.max(...codigosExistentes) : 0;
  const siguienteCodigo = String(maxCodigo + 1).padStart(2, '0');
  
  return codigoPadre === null ? siguienteCodigo : `${codigoPadre}.${siguienteCodigo}`;
};

/**
 * Determina la configuración para una nueva subcuenta basada en el padre
 * @param {Object} cuentaPadre - Cuenta padre
 * @param {Array} todasLasCuentas - Array de todas las cuentas
 * @param {boolean} tipoSeleccionado - Optional: 'imputable' o 'categoria' para override manual
 * @returns {Object} Configuración para la nueva cuenta
 */
export const getSubcuentaConfig = (cuentaPadre, todasLasCuentas, tipoSeleccionado = null) => {
  const nuevoNivel = cuentaPadre.nivel + 1;
  const nuevoCodigo = generateNextCode(todasLasCuentas, cuentaPadre.codigo);
  
  // Determinar si debe ser imputable
  let esImputable;
  let categoria;
  
  if (tipoSeleccionado !== null) {
    // Override manual: el usuario eligió específicamente el tipo
    esImputable = tipoSeleccionado === 'imputable';
    categoria = esImputable ? 'CUENTA' : (nuevoNivel === 2 ? 'SUBCATEGORIA' : 'CATEGORIA');
  } else {
    // Lógica automática por nivel (comportamiento original)
    // Nivel 1-3: categorías (no imputables)
    // Nivel 4+: cuentas imputables
    esImputable = nuevoNivel >= 4;
    categoria = esImputable ? 'CUENTA' : (nuevoNivel === 2 ? 'SUBCATEGORIA' : 'PRINCIPAL');
  }
  
  return {
    padre_id: cuentaPadre.id,
    codigo: nuevoCodigo,
    tipo: cuentaPadre.tipo,
    nivel: nuevoNivel,
    categoria: categoria,
    imputable: esImputable,
    moneda_original: cuentaPadre.moneda_original || 'USD',
    requiere_cotizacion: cuentaPadre.requiere_cotizacion || false
  };
};

/**
 * Valida que se pueda eliminar una cuenta (no tiene hijos ni movimientos)
 * @param {Object} cuenta - Cuenta a validar
 * @param {Array} todasLasCuentas - Array de todas las cuentas
 * @returns {Object} { canDelete: boolean, reason: string }
 */
export const validateAccountDeletion = (cuenta, todasLasCuentas) => {
  // Verificar si tiene hijos
  const tieneHijos = hasChildren(cuenta, todasLasCuentas);
  if (tieneHijos) {
    const cantidadHijos = getDirectChildren(cuenta, todasLasCuentas).length;
    return {
      canDelete: false,
      reason: `No se puede eliminar porque tiene ${cantidadHijos} subcuenta(s) asociada(s)`
    };
  }
  
  // Si llega aquí, se puede eliminar (movimientos se verifican en el backend)
  return {
    canDelete: true,
    reason: ''
  };
};