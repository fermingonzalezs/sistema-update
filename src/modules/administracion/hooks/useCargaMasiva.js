// useCargaMasiva.js - Hook para carga masiva de equipos
import { useState, useCallback } from 'react';
import { useCelulares } from '../../ventas/hooks/useCelulares';
import { useInventario } from '../../ventas/hooks/useInventario';
import { useOtros } from '../../ventas/hooks/useOtros';
import { supabase } from '../../../lib/supabase';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';
import { CATEGORIAS_OTROS } from '../../../shared/constants/categoryConstants';
import {
    validarFormatoSerial,
    validarUnicidadLocal,
    obtenerTabla,
    formatearErrorDB
} from '../utils/validacionesMasivas';

export const useCargaMasiva = (tipoEquipo) => {
    const [validando, setValidando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
    const [resultado, setResultado] = useState(null);

    // Hooks de cada tipo de equipo
    const { addCelular } = useCelulares();
    const { addComputer } = useInventario();
    const { addOtro } = useOtros();

    // Seleccionar función de guardado según tipo
    const obtenerFuncionGuardado = useCallback(() => {
        switch (tipoEquipo) {
            case 'celular': return addCelular;
            case 'notebook': return addComputer;
            case 'otro': return addOtro;
            default: return null;
        }
    }, [tipoEquipo, addCelular, addComputer, addOtro]);

    /**
     * Validar un serial individual contra la base de datos
     */
    const validarSerialEnDB = useCallback(async (serial, tabla) => {
        try {
            const { data, error } = await supabase
                .from(tabla)
                .select('serial')
                .ilike('serial', serial.trim())
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                return { valido: false, error: 'Serial ya existe en inventario' };
            }

            return { valido: true, error: null };
        } catch (err) {
            console.error('Error validando serial en DB:', err);
            return { valido: false, error: 'Error al validar en base de datos' };
        }
    }, []);

    /**
     * Validar un serial completo (formato + unicidad local + DB)
     */
    const validarSerial = useCallback(async (serial, serialesLocales) => {
        // Validar formato
        const formatoResult = validarFormatoSerial(serial);
        if (!formatoResult.valido) {
            return formatoResult;
        }

        // Validar unicidad local
        if (!validarUnicidadLocal(serial, serialesLocales)) {
            return { valido: false, error: 'Serial repetido en esta lista' };
        }

        // Validar unicidad en DB
        const tabla = obtenerTabla(tipoEquipo);
        const dbResult = await validarSerialEnDB(serial, tabla);

        return dbResult;
    }, [tipoEquipo, validarSerialEnDB]);

    /**
     * Validar todos los seriales de la lista
     */
    const validarTodosSeriales = useCallback(async (seriales) => {
        console.log('🔍 [VALIDACION] Iniciando validación de seriales...');
        console.log('🔍 [VALIDACION] Seriales a validar:', seriales);

        setValidando(true);

        const resultados = await Promise.all(
            seriales.map(async (item) => {
                if (!item.serial.trim()) {
                    console.log(`🔍 [VALIDACION] Serial vacío: ${item.id}`);
                    return { ...item, valido: false, error: 'Serial requerido' };
                }

                console.log(`🔍 [VALIDACION] Validando serial: ${item.serial}`);
                const resultado = await validarSerial(item.serial, seriales);
                console.log(`🔍 [VALIDACION] Resultado para ${item.serial}:`, resultado);

                return {
                    ...item,
                    valido: resultado.valido,
                    error: resultado.error
                };
            })
        );

        console.log('✅ [VALIDACION] Validación completada. Resultados:', resultados);
        setValidando(false);
        return resultados;
    }, [validarSerial]);

    /**
     * Crear registro de ingreso en ingreso_equipos
     */
    const crearRegistroIngreso = useCallback(async (tipoProducto, equipoId, datosComunes, serial, usuario) => {
        try {
            // Generar descripción del equipo según tipo
            let descripcion = '';
            if (tipoProducto === 'notebook') {
                descripcion = `${datosComunes.marca || ''} ${datosComunes.modelo || ''} - ${datosComunes.procesador || ''}, RAM ${datosComunes.ram || 0}GB, SSD ${datosComunes.ssd || 0}GB`.trim();
            } else if (tipoProducto === 'celular') {
                descripcion = `${datosComunes.marca || ''} ${datosComunes.modelo || ''} - ${datosComunes.capacidad || 0}GB, ${datosComunes.color || ''}`.trim();
            } else {
                descripcion = `${datosComunes.nombre_producto || ''} - ${datosComunes.descripcion || ''}`.trim();
            }

            // Obtener precio de compra según tipo de producto
            const precioCompra = datosComunes.precio_costo_usd || datosComunes.precio_compra_usd || 0;

            // Obtener nombre del proveedor si hay proveedor_id
            let nombreProveedor = null;
            if (datosComunes.proveedor_id) {
                try {
                    const { data: proveedor, error: proveedorError } = await supabase
                        .from('proveedores')
                        .select('nombre')
                        .eq('id', datosComunes.proveedor_id)
                        .single();

                    if (!proveedorError && proveedor) {
                        nombreProveedor = proveedor.nombre;
                    }
                } catch (err) {
                    console.error('Error obteniendo proveedor:', err);
                }
            }

            // Preparar datos del registro de ingreso
            const registroIngreso = {
                tipo_producto: tipoProducto,
                descripcion_completa: descripcion,
                precio_compra: precioCompra,
                proveedor: nombreProveedor,
                proveedor_id: datosComunes.proveedor_id || null,
                garantias: datosComunes.garantia || datosComunes.garantia_oficial || null,
                destino: 'stock', // Carga masiva siempre va directo a stock
                usuario_ingreso: usuario || 'Sistema',
                referencia_inventario_id: equipoId,
                estado: 'completado', // Ya está en stock
                fecha: obtenerFechaLocal(),
                notas: `Carga masiva - Serial: ${serial}`
            };

            // Insertar en ingreso_equipos
            const { data, error } = await supabase
                .from('ingresos_equipos')
                .insert([registroIngreso])
                .select()
                .single();

            if (error) {
                console.error('Error creando registro de ingreso:', error);
                // No lanzar error para no bloquear el proceso principal
            }

            return data;
        } catch (error) {
            console.error('Error en crearRegistroIngreso:', error);
            // No lanzar error para no bloquear el proceso principal
            return null;
        }
    }, []);

    /**
     * Guardar equipos masivamente
     * Estrategia: Mejor esfuerzo - guarda lo que puede
     */
    const guardarEquiposMasivos = useCallback(async (datosComunes, seriales, usuario = null) => {
        console.log('🚀 [CARGA MASIVA] Iniciando guardado masivo...');
        console.log('📦 [CARGA MASIVA] Tipo equipo:', tipoEquipo);
        console.log('📋 [CARGA MASIVA] Datos comunes:', datosComunes);
        console.log('📋 [CARGA MASIVA] Seriales recibidos:', seriales);

        setGuardando(true);
        setResultado(null);

        const funcionGuardado = obtenerFuncionGuardado();
        console.log('🔧 [CARGA MASIVA] Función de guardado obtenida:', funcionGuardado ? 'OK' : 'NULL');

        if (!funcionGuardado) {
            setGuardando(false);
            throw new Error('Tipo de equipo no soportado');
        }

        const exitosos = [];
        const fallidos = [];
        const idsCreados = [];
        const serialesValidos = seriales.filter(s => s.valido && !s.error);

        console.log('✅ [CARGA MASIVA] Seriales válidos encontrados:', serialesValidos.length);
        console.log('📋 [CARGA MASIVA] Detalle seriales válidos:', serialesValidos.map(s => ({ serial: s.serial, valido: s.valido, error: s.error })));

        setProgreso({ actual: 0, total: serialesValidos.length });

        // Preparar fecha de ingreso
        const fechaIngreso = datosComunes.ingreso || obtenerFechaLocal();

        // Iterar por cada serial válido
        for (let i = 0; i < serialesValidos.length; i++) {
            const item = serialesValidos[i];
            console.log(`📝 [CARGA MASIVA] Procesando serial ${i + 1}/${serialesValidos.length}: ${item.serial}`);

            try {
                // Preparar datos completos - merge datos comunes con valores individuales del item
                let datosCompletos = {
                    ...datosComunes,
                    serial: item.serial.toUpperCase().trim(),
                    ingreso: fechaIngreso,
                    // Sobrescribir con valores individuales si existen
                    ...(item.color !== undefined && item.color !== '' && { color: item.color }),
                    ...(item.precio_compra_usd !== undefined && item.precio_compra_usd !== '' && { precio_compra_usd: item.precio_compra_usd }),
                    ...(item.precio_costo_usd !== undefined && item.precio_costo_usd !== '' && { precio_costo_usd: item.precio_costo_usd }),
                    ...(item.costos_adicionales !== undefined && item.costos_adicionales !== '' && { costos_adicionales: item.costos_adicionales }),
                    ...(item.envios_repuestos !== undefined && item.envios_repuestos !== '' && { envios_repuestos: item.envios_repuestos }),
                    ...(item.precio_venta_usd !== undefined && item.precio_venta_usd !== '' && { precio_venta_usd: item.precio_venta_usd }),
                    // Para celulares: agregar porcentaje de batería (por defecto 100%)
                    ...(tipoEquipo === 'celular' && { bateria: `${item.bateria ?? 100}%` })
                };

                // Para tipo "otro" con categoría DESKTOP o TABLETS, procesar especificaciones
                if (tipoEquipo === 'otro') {
                    const isDesktop = datosComunes.categoria === CATEGORIAS_OTROS.DESKTOP;
                    const isTablet = datosComunes.categoria === CATEGORIAS_OTROS.TABLETS;

                    if (isDesktop) {
                        // Concatenar especificaciones de Desktop en descripcion
                        const specs = [
                            datosComunes.procesador && `Procesador: ${datosComunes.procesador}`,
                            datosComunes.motherboard && `Motherboard: ${datosComunes.motherboard}`,
                            datosComunes.memoria && `Memoria: ${datosComunes.memoria}`,
                            datosComunes.gpu && `Placa de video: ${datosComunes.gpu}`,
                            datosComunes.ssd && `SSD: ${datosComunes.ssd}`,
                            datosComunes.hdd && `HDD: ${datosComunes.hdd}`,
                            datosComunes.gabinete && `Gabinete: ${datosComunes.gabinete}`,
                            datosComunes.fuente && `Fuente: ${datosComunes.fuente}`
                        ].filter(Boolean);

                        let descripcion = specs.join(' - ');
                        if (datosComunes.observaciones?.trim()) {
                            descripcion = descripcion ? `${descripcion} - ${datosComunes.observaciones}` : datosComunes.observaciones;
                        }

                        // Usar modelo como nombre_producto para Desktop
                        datosCompletos = {
                            ...datosCompletos,
                            nombre_producto: `${datosComunes.marca || ''} ${datosComunes.modelo || ''}`.trim() || datosComunes.modelo,
                            descripcion: descripcion
                        };
                    } else if (isTablet) {
                        // Concatenar especificaciones de Tablet en descripcion
                        const specs = [
                            datosComunes.capacidad_almacenamiento && `Almacenamiento: ${datosComunes.capacidad_almacenamiento}`,
                            datosComunes.tamano_pantalla && `Pantalla: ${datosComunes.tamano_pantalla}`,
                            datosComunes.conectividad && `Conectividad: ${datosComunes.conectividad}`,
                            datosComunes.color && `Color: ${datosComunes.color}`
                        ].filter(Boolean);

                        let descripcion = specs.join(' - ');
                        if (datosComunes.observaciones?.trim()) {
                            descripcion = descripcion ? `${descripcion} - ${datosComunes.observaciones}` : datosComunes.observaciones;
                        }

                        // Usar modelo como nombre_producto para Tablet
                        datosCompletos = {
                            ...datosCompletos,
                            nombre_producto: `${datosComunes.marca || ''} ${datosComunes.modelo || ''}`.trim() || datosComunes.modelo,
                            descripcion: descripcion
                        };
                    }
                }

                console.log(`💾 [CARGA MASIVA] Datos a guardar para ${item.serial}:`, datosCompletos);

                // Guardar usando el servicio correspondiente
                console.log(`🔄 [CARGA MASIVA] Llamando a función de guardado para ${item.serial}...`);
                const nuevoEquipo = await funcionGuardado(datosCompletos);
                console.log(`✅ [CARGA MASIVA] Resultado de guardado para ${item.serial}:`, nuevoEquipo);

                // ✅ Crear registro en ingreso_equipos
                if (nuevoEquipo?.id) {
                    await crearRegistroIngreso(
                        tipoEquipo,
                        nuevoEquipo.id,
                        datosComunes,
                        item.serial,
                        usuario
                    );
                }

                exitosos.push({
                    serial: item.serial,
                    id: nuevoEquipo?.id
                });

                if (nuevoEquipo?.id) {
                    idsCreados.push(nuevoEquipo.id);
                }

            } catch (error) {
                console.error(`❌ [CARGA MASIVA] Error guardando ${item.serial}:`, error);
                console.error(`❌ [CARGA MASIVA] Error detalle:`, error.message, error.stack);
                fallidos.push({
                    serial: item.serial,
                    error: formatearErrorDB(error)
                });
            }

            setProgreso({ actual: i + 1, total: serialesValidos.length });
        }

        console.log('📊 [CARGA MASIVA] Resumen: exitosos=', exitosos.length, 'fallidos=', fallidos.length);

        // Agregar seriales inválidos a fallidos
        seriales.filter(s => !s.valido || s.error).forEach(item => {
            fallidos.push({
                serial: item.serial || '(vacío)',
                error: item.error || 'Serial inválido'
            });
        });

        // Preparar resultado final
        const resultadoFinal = {
            exitosos: exitosos.length,
            fallidos: fallidos.length,
            detalleExitosos: exitosos,
            detalleFallidos: fallidos,
            idsCreados
        };

        setResultado(resultadoFinal);
        setGuardando(false);

        return resultadoFinal;
    }, [obtenerFuncionGuardado, tipoEquipo, crearRegistroIngreso]);

    /**
     * Rollback: eliminar equipos creados en caso de error crítico
     */
    const rollbackEquipos = useCallback(async (ids) => {
        if (!ids || ids.length === 0) return;

        const tabla = obtenerTabla(tipoEquipo);

        try {
            const { error } = await supabase
                .from(tabla)
                .delete()
                .in('id', ids);

            if (error) throw error;
            console.log('Rollback completado exitosamente');
        } catch (error) {
            console.error('Error en rollback:', error);
        }
    }, [tipoEquipo]);

    /**
     * Resetear estado
     */
    const resetear = useCallback(() => {
        setValidando(false);
        setGuardando(false);
        setProgreso({ actual: 0, total: 0 });
        setResultado(null);
    }, []);

    return {
        // Estados
        validando,
        guardando,
        progreso,
        resultado,

        // Funciones
        validarSerial,
        validarTodosSeriales,
        guardarEquiposMasivos,
        rollbackEquipos,
        resetear
    };
};
