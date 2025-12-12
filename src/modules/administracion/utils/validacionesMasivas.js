// validacionesMasivas.js - Utilidades de validación para carga masiva
import { isValidCondicion, isValidEstado, isValidUbicacion } from '../../../shared/constants/productConstants';

/**
 * Validar datos comunes según tipo de equipo
 */
export const validarDatosComunes = (datos, tipoEquipo) => {
    const errores = {};

    // Validaciones para CELULARES
    if (tipoEquipo === 'celular') {
        if (!datos.modelo?.trim()) errores.modelo = 'Modelo requerido';
        if (!datos.marca?.trim()) errores.marca = 'Marca requerida';
        if (!datos.categoria) errores.categoria = 'Categoría requerida';

        if (!datos.precio_compra_usd || datos.precio_compra_usd <= 0) {
            errores.precio_compra_usd = 'Precio de compra inválido';
        }
        if (!datos.precio_venta_usd || datos.precio_venta_usd <= 0) {
            errores.precio_venta_usd = 'Precio de venta inválido';
        }

        // Validar condición normalizada
        if (datos.condicion && !isValidCondicion(datos.condicion)) {
            errores.condicion = 'Condición inválida';
        }

        // Estado solo requerido si no es "nuevo"
        if (datos.condicion !== 'nuevo' && datos.condicion !== 'nueva' && datos.estado) {
            if (!isValidEstado(datos.estado)) {
                errores.estado = 'Estado inválido';
            }
        }

        // Validar batería y ciclos si están presentes
        if (datos.bateria && !/^\d+%?$/.test(datos.bateria)) {
            errores.bateria = 'Formato: 85% o 85';
        }
        if (datos.ciclos !== undefined && datos.ciclos !== '' && (datos.ciclos < 0 || datos.ciclos > 10000)) {
            errores.ciclos = 'Ciclos entre 0 y 10000';
        }
    }

    // Validaciones para NOTEBOOKS
    if (tipoEquipo === 'notebook') {
        if (!datos.modelo?.trim()) errores.modelo = 'Modelo requerido';
        if (!datos.marca?.trim()) errores.marca = 'Marca requerida';

        if (!datos.precio_costo_usd || datos.precio_costo_usd <= 0) {
            errores.precio_costo_usd = 'Precio de costo inválido';
        }
        if (!datos.precio_venta_usd || datos.precio_venta_usd <= 0) {
            errores.precio_venta_usd = 'Precio de venta inválido';
        }

        if (datos.condicion && !isValidCondicion(datos.condicion)) {
            errores.condicion = 'Condición inválida';
        }

        // RAM debe ser numérico positivo
        if (datos.ram && (isNaN(parseInt(datos.ram)) || parseInt(datos.ram) < 0)) {
            errores.ram = 'RAM debe ser un número válido';
        }
    }

    // Validaciones para OTROS
    if (tipoEquipo === 'otro') {
        if (!datos.nombre_producto?.trim()) errores.nombre_producto = 'Nombre de producto requerido';
        if (!datos.categoria) errores.categoria = 'Categoría requerida';

        if (!datos.precio_compra_usd || datos.precio_compra_usd <= 0) {
            errores.precio_compra_usd = 'Precio de compra inválido';
        }
        if (!datos.precio_venta_usd || datos.precio_venta_usd <= 0) {
            errores.precio_venta_usd = 'Precio de venta inválido';
        }
    }

    // Validar sucursal si está presente
    if (datos.sucursal && !isValidUbicacion(datos.sucursal)) {
        errores.sucursal = 'Ubicación inválida';
    }

    return {
        valido: Object.keys(errores).length === 0,
        errores
    };
};

/**
 * Validar formato de serial
 */
export const validarFormatoSerial = (serial) => {
    if (!serial || serial.trim() === '') {
        return { valido: false, error: 'Serial requerido' };
    }

    const serialLimpio = serial.trim();

    // Mínimo 4 caracteres alfanuméricos (con guiones y underscores permitidos)
    if (serialLimpio.length < 4) {
        return { valido: false, error: 'Mínimo 4 caracteres' };
    }

    if (!/^[A-Z0-9\-_]+$/i.test(serialLimpio)) {
        return { valido: false, error: 'Solo caracteres alfanuméricos, guiones y underscores' };
    }

    return { valido: true, error: null };
};

/**
 * Validar unicidad de serial en lista local
 */
export const validarUnicidadLocal = (serial, listaSeriales) => {
    const serialUpper = serial.toUpperCase().trim();
    const count = listaSeriales.filter(s =>
        s.serial.toUpperCase().trim() === serialUpper
    ).length;

    return count <= 1;
};

/**
 * Formatear errores de Supabase a mensajes amigables
 */
export const formatearErrorDB = (error) => {
    const mensajesError = {
        'duplicate key value': 'Este serial ya existe en el inventario',
        'violates foreign key constraint': 'Datos relacionados inválidos',
        'invalid input syntax': 'Formato de datos inválido',
        'null value in column': 'Falta un campo requerido',
        'check constraint': 'Valor fuera de rango permitido'
    };

    for (const [clave, mensaje] of Object.entries(mensajesError)) {
        if (error.message?.toLowerCase().includes(clave.toLowerCase())) {
            return mensaje;
        }
    }

    return error.message || 'Error desconocido';
};

/**
 * Obtener tabla según tipo de equipo
 */
export const obtenerTabla = (tipoEquipo) => {
    const tablas = {
        celular: 'celulares',
        notebook: 'inventario',
        otro: 'otros'
    };
    return tablas[tipoEquipo] || 'otros';
};
