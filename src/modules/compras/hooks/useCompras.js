import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useImportaciones = () => {
  const [importaciones, setImportaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar importaciones con sus items
  const cargarImportaciones = async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('importaciones')
        .select(`
          *,
          importaciones_items(*)
        `)
        .order('fecha', { ascending: false });

      if (queryError) throw queryError;

      console.log('DEBUG: Importaciones cargadas:', data);
      setImportaciones(data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando importaciones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar
  useEffect(() => {
    cargarImportaciones();
  }, []);

  // Crear nueva importación (recibo + items)
  const crearImportacion = async (datosImportacion, items) => {
    try {
      setLoading(true);

      // 1. Crear importación (recibo)
      const importacionData = {
        proveedor: datosImportacion.proveedor,
        fecha: datosImportacion.fecha,
        numero_seguimiento: datosImportacion.numero_seguimiento,
        logistica_empresa: datosImportacion.logistica_empresa,
        descripcion: datosImportacion.descripcion,
        observaciones: datosImportacion.observaciones,
        fecha_estimada_ingreso: datosImportacion.fecha_estimada_ingreso,
        costos_logistica_usd: datosImportacion.costos_logistica_usd || 0,
        envio_usa_usd: datosImportacion.envio_usa_usd || 0,
        envio_arg_usd: datosImportacion.envio_arg_usd || 0,
        estado: 'en_camino'
      };

      const { data: importacionCreada, error: importacionError } = await supabase
        .from('importaciones')
        .insert([importacionData])
        .select();

      if (importacionError) throw importacionError;
      const importacionId = importacionCreada[0].id;

      // 2. Crear items de la importación
      const itemsData = items.map(item => {
        const cantidad = parseInt(item.cantidad) || 1;
        const precioUnitario = parseFloat(item.precio_unitario) || 0;
        const pesoUnitario = parseFloat(item.peso_estimado_unitario) || 0;
        const montoTotal = cantidad * precioUnitario;
        const pesoTotal = pesoUnitario > 0 ? pesoUnitario * cantidad : null;

        return {
          importacion_id: importacionId,
          item: item.item,
          cantidad: cantidad,
          precio_unitario: precioUnitario,
          monto: montoTotal,
          peso_unitario_kg: pesoUnitario,
          peso_estimado_kg: pesoTotal,
          moneda: datosImportacion.moneda || 'USD',
          link_producto: item.link_producto,
          observaciones: item.observaciones
        };
      });

      const { data: itemsCreados, error: itemsError } = await supabase
        .from('importaciones_items')
        .insert(itemsData)
        .select();

      if (itemsError) throw itemsError;

      await cargarImportaciones();
      return { success: true, data: { ...importacionCreada[0], importaciones_items: itemsCreados } };
    } catch (err) {
      console.error('Error creando importación:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar importación
  const actualizarImportacion = async (id, datosActualizados) => {
    try {
      setLoading(true);

      const { data, error: updateError } = await supabase
        .from('importaciones')
        .update(datosActualizados)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;

      setImportaciones(prev =>
        prev.map(imp => imp.id === id ? { ...imp, ...data[0] } : imp)
      );

      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error actualizando importación:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar item de importación
  const actualizarItemImportacion = async (itemId, datosActualizados) => {
    try {
      const { data, error: updateError } = await supabase
        .from('importaciones_items')
        .update(datosActualizados)
        .eq('id', itemId)
        .select();

      if (updateError) throw updateError;

      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error actualizando item de importación:', err);
      return { success: false, error: err.message };
    }
  };

  // Eliminar importación (cascada elimina items automáticamente)
  const eliminarImportacion = async (id) => {
    try {
      setLoading(true);

      const { error: deleteError } = await supabase
        .from('importaciones')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setImportaciones(prev => prev.filter(imp => imp.id !== id));

      return { success: true };
    } catch (err) {
      console.error('Error eliminando importación:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de importación
  const cambiarEstado = async (id, nuevoEstado) => {
    return actualizarImportacion(id, { estado: nuevoEstado });
  };

  // Recepcionar importación y pasar a compras
  const recepcionarImportacion = async (importacionId, datosRecepcion) => {
    try {
      setLoading(true);

      // 1. Obtener importación y sus items
      const { data: importacion, error: fetchError } = await supabase
        .from('importaciones')
        .select('*, importaciones_items(*)')
        .eq('id', importacionId)
        .single();

      if (fetchError) throw fetchError;

      if (!importacion || !importacion.importaciones_items || importacion.importaciones_items.length === 0) {
        throw new Error('No se encontraron items para esta importación');
      }

      // 2. Crear compras a partir de los items de importación
      const comprasData = importacion.importaciones_items.map(item => ({
        item: item.item,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        monto: item.monto,
        proveedor: importacion.proveedor,
        caja_pago: 'importacion',
        descripcion: importacion.descripcion,
        fecha: datosRecepcion.fechaRecepcion,
        metodo_pago: 'importacion',
        observaciones: item.observaciones,
        moneda: item.moneda,
        serial: null,
        estado: 'ingresado'
      }));

      const { data: comprasCreadas, error: comprasError } = await supabase
        .from('compras')
        .insert(comprasData)
        .select();

      if (comprasError) throw comprasError;

      // 3. Actualizar estado de importación a recibido
      const { error: estadoError } = await supabase
        .from('importaciones')
        .update({
          estado: 'recibido',
          fecha_ingreso_real: datosRecepcion.fechaRecepcion
        })
        .eq('id', importacionId);

      if (estadoError) throw estadoError;

      await cargarImportaciones();
      return { success: true, data: comprasCreadas };
    } catch (err) {
      console.error('Error recepcionando importación:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    importaciones,
    loading,
    error,
    cargarImportaciones,
    crearImportacion,
    actualizarImportacion,
    actualizarItemImportacion,
    eliminarImportacion,
    cambiarEstado,
    recepcionarImportacion
  };
};
