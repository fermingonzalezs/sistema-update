import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useImportacionesRecibos = () => {
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar recibos de importación
  const cargarRecibos = async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('compras_recibos')
        .select(`
          *,
          items:compras_items(*)
        `)
        .eq('estado', 'importacion')
        .order('fecha', { ascending: false });

      if (queryError) throw queryError;
      setRecibos(data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando recibos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar recibos al montar el componente
  useEffect(() => {
    cargarRecibos();
  }, []);

  // Crear nueva importación (recibo + items)
  const crearImportacion = async (datosRecibo, items) => {
    try {
      setLoading(true);

      // 1. Crear recibo de importación
      const reciboData = {
        proveedor: datosRecibo.proveedor,
        fecha: datosRecibo.fecha,
        descripcion: datosRecibo.observaciones || '',
        estado: 'importacion'
      };

      const { data: reciboCreado, error: reciboError } = await supabase
        .from('compras_recibos')
        .insert([reciboData])
        .select();

      if (reciboError) throw reciboError;
      const reciboId = reciboCreado[0].id;

      // 2. Crear items asociados
      const itemsData = items.map(item => ({
        recibo_id: reciboId,
        tipo_producto: 'importacion',
        datos_producto: {
          item: item.item,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          peso_estimado_unitario: item.peso_estimado_unitario,
          // Datos adicionales de importación
          numero_seguimiento: datosRecibo.numero_seguimiento,
          logistica_empresa: datosRecibo.logistica_empresa,
          peso_estimado_kg: item.cantidad * item.peso_estimado_unitario,
          fecha_estimada_ingreso: datosRecibo.fecha_estimada_ingreso,
          metodo_pago: datosRecibo.metodo_pago,
          moneda: datosRecibo.moneda
        },
        destino: 'importacion',
        estado_item: 'en_camino'
      }));

      const { error: itemsError } = await supabase
        .from('compras_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      // Recargar para obtener los datos con items
      await cargarRecibos();
      return { success: true, data: reciboCreado[0] };
    } catch (err) {
      console.error('Error creando importación:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar recibo de importación
  const actualizarRecibo = async (reciboId, datosActualizados) => {
    try {
      setLoading(true);

      const { data, error: updateError } = await supabase
        .from('compras_recibos')
        .update(datosActualizados)
        .eq('id', reciboId)
        .select();

      if (updateError) throw updateError;

      setRecibos(prev =>
        prev.map(recibo => recibo.id === reciboId ? { ...recibo, ...data[0] } : recibo)
      );

      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error actualizando recibo:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar item de importación
  const actualizarItem = async (itemId, datosActualizados) => {
    try {
      const { data, error: updateError } = await supabase
        .from('compras_items')
        .update(datosActualizados)
        .eq('id', itemId)
        .select();

      if (updateError) throw updateError;

      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error actualizando item:', err);
      return { success: false, error: err.message };
    }
  };

  // Eliminar recibo y sus items
  const eliminarRecibo = async (reciboId) => {
    try {
      setLoading(true);

      // Eliminar items primero
      const { error: itemsError } = await supabase
        .from('compras_items')
        .delete()
        .eq('recibo_id', reciboId);

      if (itemsError) throw itemsError;

      // Luego eliminar recibo
      const { error: reciboError } = await supabase
        .from('compras_recibos')
        .delete()
        .eq('id', reciboId);

      if (reciboError) throw reciboError;

      setRecibos(prev => prev.filter(recibo => recibo.id !== reciboId));

      return { success: true };
    } catch (err) {
      console.error('Error eliminando recibo:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Recepcionar importación
  const recepcionarImportacion = async (reciboId, datosRecepcion) => {
    try {
      setLoading(true);

      // Obtener el recibo y sus items
      const { data: recibo, error: fetchError } = await supabase
        .from('compras_recibos')
        .select(`
          *,
          items:compras_items(*)
        `)
        .eq('id', reciboId)
        .single();

      if (fetchError) throw fetchError;

      // Calcular costos adicionales por item
      const totalPesoEstimado = recibo.items.reduce((sum, item) => {
        const datosItem = item.datos_producto;
        return sum + (datosItem.peso_estimado_unitario * datosItem.cantidad);
      }, 0);

      const costoTotalAdicional = datosRecepcion.pagoCourier + datosRecepcion.costoPickingShipping;

      // Actualizar cada item con datos de recepción
      for (const item of recibo.items) {
        const datosItem = item.datos_producto;
        const costoAdicionalItem = totalPesoEstimado > 0
          ? ((datosItem.peso_estimado_unitario / totalPesoEstimado) * costoTotalAdicional)
          : 0;

        await actualizarItem(item.id, {
          estado_item: 'recibido',
          datos_producto: {
            ...datosItem,
            fecha_ingreso_real: datosRecepcion.fechaRecepcion,
            peso_real_kg: datosRecepcion.pesoConCaja,
            peso_sin_caja: datosRecepcion.pesoSinCaja,
            precio_por_kg: datosRecepcion.precioPorKg,
            pago_courier: datosRecepcion.pagoCourier,
            costo_picking_shipping: datosRecepcion.costoPickingShipping,
            costo_adicional: costoAdicionalItem
          }
        });
      }

      // Actualizar estado del recibo
      await actualizarRecibo(reciboId, {
        estado: 'recibido'
      });

      await cargarRecibos();
      return { success: true };
    } catch (err) {
      console.error('Error recepcionando importación:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    recibos,
    loading,
    error,
    cargarRecibos,
    crearImportacion,
    actualizarRecibo,
    actualizarItem,
    eliminarRecibo,
    recepcionarImportacion
  };
};
