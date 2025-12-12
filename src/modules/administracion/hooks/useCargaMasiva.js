// useCargaMasiva.js - Hook para carga masiva de equipos
import { useState, useCallback } from 'react';
import { useCelulares } from '../../ventas/hooks/useCelulares';
import { useInventario } from '../../ventas/hooks/useInventario';
import { useOtros } from '../../ventas/hooks/useOtros';
import { supabase } from '../../../lib/supabase';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';
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
        setValidando(true);

        const resultados = await Promise.all(
            seriales.map(async (item) => {
                if (!item.serial.trim()) {
                    return { ...item, valido: false, error: 'Serial requerido' };
                }

                const resultado = await validarSerial(item.serial, seriales);
                return {
                    ...item,
                    valido: resultado.valido,
                    error: resultado.error
                };
            })
        );

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

            // Preparar datos del registro de ingreso
            const registroIngreso = {
                tipo_producto: tipoProducto,
                descripcion_completa: descripcion,
                precio_compra: precioCompra,
                proveedor: datosComunes.proveedor || null,
                garantias: datosComunes.garantia_update || datosComunes.garantia_oficial || datosComunes.garantia || null,
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
        setGuardando(true);
        setResultado(null);

        const funcionGuardado = obtenerFuncionGuardado();
        if (!funcionGuardado) {
            setGuardando(false);
            throw new Error('Tipo de equipo no soportado');
        }

        const exitosos = [];
        const fallidos = [];
        const idsCreados = [];
        const serialesValidos = seriales.filter(s => s.valido && !s.error);

        setProgreso({ actual: 0, total: serialesValidos.length });

        // Preparar fecha de ingreso
        const fechaIngreso = datosComunes.ingreso || obtenerFechaLocal();

        // Iterar por cada serial válido
        for (let i = 0; i < serialesValidos.length; i++) {
            const item = serialesValidos[i];

            try {
                // Preparar datos completos - merge datos comunes con valores individuales del item
                const datosCompletos = {
                    ...datosComunes,
                    serial: item.serial.toUpperCase().trim(),
                    ingreso: fechaIngreso,
                    // Sobrescribir con valores individuales si existen
                    ...(item.color !== undefined && item.color !== '' && { color: item.color }),
                    ...(item.precio_compra_usd !== undefined && item.precio_compra_usd !== '' && { precio_compra_usd: item.precio_compra_usd }),
                    ...(item.precio_costo_usd !== undefined && item.precio_costo_usd !== '' && { precio_costo_usd: item.precio_costo_usd }),
                    ...(item.costos_adicionales !== undefined && item.costos_adicionales !== '' && { costos_adicionales: item.costos_adicionales }),
                    ...(item.envios_repuestos !== undefined && item.envios_repuestos !== '' && { envios_repuestos: item.envios_repuestos }),
                    ...(item.precio_venta_usd !== undefined && item.precio_venta_usd !== '' && { precio_venta_usd: item.precio_venta_usd })
                };

                // Guardar usando el servicio correspondiente
                const nuevoEquipo = await funcionGuardado(datosCompletos);

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
                console.error(`Error guardando ${item.serial}:`, error);
                fallidos.push({
                    serial: item.serial,
                    error: formatearErrorDB(error)
                });
            }

            setProgreso({ actual: i + 1, total: serialesValidos.length });
        }

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
