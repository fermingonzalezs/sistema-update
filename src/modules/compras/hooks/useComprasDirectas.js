import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useCompras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar compras directas/nacionales
  const cargarCompras = async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('compras')
        .select('*')
        .order('fecha', { ascending: false });

      if (queryError) throw queryError;

      setCompras(data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando compras:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar
  useEffect(() => {
    cargarCompras();
  }, []);

  // Crear nueva compra directa
  const crearCompra = async (datosCompra) => {
    try {
      setLoading(true);

      const compraData = {
        item: datosCompra.item,
        cantidad: datosCompra.cantidad || 1,
        precio_unitario: datosCompra.precio_unitario || 0,
        monto: datosCompra.monto,
        proveedor: datosCompra.proveedor,
        caja_pago: datosCompra.caja_pago,
        descripcion: datosCompra.descripcion,
        fecha: datosCompra.fecha || new Date().toISOString().split('T')[0],
        metodo_pago: datosCompra.metodo_pago,
        observaciones: datosCompra.observaciones,
        moneda: datosCompra.moneda || 'USD',
        serial: datosCompra.serial || null,
        estado: datosCompra.estado || 'ingresado'
      };

      const { data, error: insertError } = await supabase
        .from('compras')
        .insert([compraData])
        .select();

      if (insertError) throw insertError;

      setCompras(prev => [data[0], ...prev]);
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error creando compra:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar compra
  const actualizarCompra = async (id, datosActualizados) => {
    try {
      setLoading(true);

      const { data, error: updateError } = await supabase
        .from('compras')
        .update(datosActualizados)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;

      setCompras(prev =>
        prev.map(compra => compra.id === id ? data[0] : compra)
      );

      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error actualizando compra:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Eliminar compra
  const eliminarCompra = async (id) => {
    try {
      setLoading(true);

      const { error: deleteError } = await supabase
        .from('compras')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCompras(prev => prev.filter(compra => compra.id !== id));

      return { success: true };
    } catch (err) {
      console.error('Error eliminando compra:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    compras,
    loading,
    error,
    cargarCompras,
    crearCompra,
    actualizarCompra,
    eliminarCompra
  };
};
