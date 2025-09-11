// src/modules/contabilidad/utils/asientos-utils.js
// Utilidades para gestión de asientos contables - UPDATE WW SRL

/**
 * Número de días permitidos para editar un asiento contable
 * después de su creación
 */
export const DIAS_EDICION_PERMITIDOS = 30;

/**
 * Verifica si un asiento contable puede ser editado
 * basado en la fecha de creación y el rol del usuario
 * 
 * @param {string|Date} fechaCreacion - Fecha de creación del asiento
 * @param {string} userRole - Rol del usuario ('admin', 'contabilidad', etc.)
 * @returns {boolean} - True si el asiento puede ser editado
 */
export const isAsientoEditable = (fechaCreacion, userRole = null) => {
  try {
    // Los administradores siempre pueden editar
    if (userRole === 'admin') {
      return true;
    }
    
    // Calcular diferencia en días
    const ahora = new Date();
    const fechaCreacionDate = new Date(fechaCreacion);
    
    // Verificar que la fecha sea válida
    if (isNaN(fechaCreacionDate.getTime())) {
      console.warn('Fecha de creación inválida para validación de edición:', fechaCreacion);
      return false;
    }
    
    const diferenciaMilisegundos = ahora - fechaCreacionDate;
    const diferenciaDias = diferenciaMilisegundos / (1000 * 60 * 60 * 24);
    
    return diferenciaDias <= DIAS_EDICION_PERMITIDOS;
    
  } catch (error) {
    console.error('Error validando si asiento es editable:', error);
    return false;
  }
};

/**
 * Obtiene el número de días transcurridos desde la creación de un asiento
 * 
 * @param {string|Date} fechaCreacion - Fecha de creación del asiento
 * @returns {number} - Número de días transcurridos (redondeado)
 */
export const getDiasTranscurridos = (fechaCreacion) => {
  try {
    const ahora = new Date();
    const fechaCreacionDate = new Date(fechaCreacion);
    
    if (isNaN(fechaCreacionDate.getTime())) {
      return 0;
    }
    
    const diferenciaMilisegundos = ahora - fechaCreacionDate;
    const diferenciaDias = diferenciaMilisegundos / (1000 * 60 * 60 * 24);
    
    return Math.floor(diferenciaDias);
    
  } catch (error) {
    console.error('Error calculando días transcurridos:', error);
    return 0;
  }
};

/**
 * Obtiene el mensaje apropiado para mostrar al usuario
 * sobre el estado de editabilidad del asiento
 * 
 * @param {string|Date} fechaCreacion - Fecha de creación del asiento
 * @param {string} userRole - Rol del usuario
 * @returns {object} - Objeto con información sobre editabilidad
 */
export const getEstadoEditabilidad = (fechaCreacion, userRole = null) => {
  const esEditable = isAsientoEditable(fechaCreacion, userRole);
  const diasTranscurridos = getDiasTranscurridos(fechaCreacion);
  const diasRestantes = DIAS_EDICION_PERMITIDOS - diasTranscurridos;
  
  if (userRole === 'admin') {
    return {
      esEditable: true,
      mensaje: 'Editable (usuario administrador)',
      tipo: 'admin',
      diasRestantes: null
    };
  }
  
  if (esEditable) {
    return {
      esEditable: true,
      mensaje: `Editable (${diasRestantes} días restantes)`,
      tipo: 'editable',
      diasRestantes: diasRestantes
    };
  }
  
  return {
    esEditable: false,
    mensaje: `No editable (${diasTranscurridos} días transcurridos, límite: ${DIAS_EDICION_PERMITIDOS})`,
    tipo: 'no_editable',
    diasRestantes: 0
  };
};

/**
 * Prepara los datos de un asiento para edición
 * convirtiendo los movimientos al formato del formulario
 * 
 * @param {object} asiento - Asiento contable con sus movimientos
 * @returns {object} - Datos formateados para el formulario
 */
export const prepararDatosParaEdicion = (asiento, movimientos = []) => {
  return {
    fecha: asiento.fecha,
    descripcion: asiento.descripcion || '',
    movimientos: movimientos.map(movimiento => ({
      cuenta_id: movimiento.cuenta_id,
      cuenta: movimiento.plan_cuentas || null, // Objeto cuenta completo
      descripcion: movimiento.descripcion || '',
      debe: Number(movimiento.debe) || 0,
      haber: Number(movimiento.haber) || 0,
      cotizacion: movimiento.cotizacion ? Number(movimiento.cotizacion) : null
    }))
  };
};

/**
 * Valida que los datos de edición sean correctos antes del envío
 * 
 * @param {object} datosAsiento - Datos del asiento a validar
 * @returns {object} - Resultado de validación {valido: boolean, errores: array}
 */
export const validarDatosEdicion = (datosAsiento) => {
  const errores = [];
  
  // Validar fecha
  if (!datosAsiento.fecha) {
    errores.push('La fecha es obligatoria');
  }
  
  // Validar descripción
  if (!datosAsiento.descripcion || datosAsiento.descripcion.trim().length === 0) {
    errores.push('La descripción es obligatoria');
  }
  
  // Validar movimientos
  if (!datosAsiento.movimientos || datosAsiento.movimientos.length === 0) {
    errores.push('Debe tener al menos un movimiento contable');
  }
  
  if (datosAsiento.movimientos && datosAsiento.movimientos.length > 0) {
    // Validar que cada movimiento tenga cuenta
    const movimientosSinCuenta = datosAsiento.movimientos.filter(mov => !mov.cuenta_id);
    if (movimientosSinCuenta.length > 0) {
      errores.push('Todos los movimientos deben tener una cuenta seleccionada');
    }
    
    // Validar que cada movimiento tenga debe o haber
    const movimientosSinMonto = datosAsiento.movimientos.filter(mov => 
      (!mov.debe || mov.debe === 0) && (!mov.haber || mov.haber === 0)
    );
    if (movimientosSinMonto.length > 0) {
      errores.push('Todos los movimientos deben tener un monto en debe o haber');
    }
    
    // Validar balance (debe = haber) considerando conversiones a USD
    let totalDebeUSD = 0;
    let totalHaberUSD = 0;
    
    datosAsiento.movimientos.forEach(mov => {
      let debeUSD = Number(mov.debe) || 0;
      let haberUSD = Number(mov.haber) || 0;
      
      // NOTA: Los datos ya vienen convertidos desde guardarEdicion()
      // NO aplicar conversión aquí porque ya se hizo en guardarEdicion()
      
      // Aplicar redondeo consistente a 2 decimales
      debeUSD = Math.round(debeUSD * 100) / 100;
      haberUSD = Math.round(haberUSD * 100) / 100;
      
      totalDebeUSD += debeUSD;
      totalHaberUSD += haberUSD;
    });
    
    if (Math.abs(totalDebeUSD - totalHaberUSD) > 0.01) { // Tolerancia para decimales
      errores.push(`El asiento no está balanceado en USD. Debe: $${totalDebeUSD.toFixed(2)}, Haber: $${totalHaberUSD.toFixed(2)}`);
    }
  }
  
  return {
    valido: errores.length === 0,
    errores: errores
  };
};