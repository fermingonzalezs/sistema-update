import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useRecibos = () => {
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar todos los recibos con sus items
  const fetchRecibos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar recibos con información del cliente
      const { data: recibosData, error: recibosError } = await supabase
        .from('recibos')
        .select(`
          *,
          clientes (
            nombre,
            apellido,
            telefono,
            email
          )
        `)
        .order('fecha', { ascending: false });

      if (recibosError) throw recibosError;

      // Cargar items de cada recibo
      const recibosConItems = await Promise.all(
        recibosData.map(async (recibo) => {
          const { data: items, error: itemsError } = await supabase
            .from('recibos_items')
            .select('*')
            .eq('recibo_id', recibo.id)
            .order('orden', { ascending: true });

          if (itemsError) throw itemsError;

          return {
            ...recibo,
            items: items || []
          };
        })
      );

      setRecibos(recibosConItems);
    } catch (err) {
      console.error('Error al cargar recibos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generar número de recibo automático
  const generarNumeroRecibo = async () => {
    try {
      const year = new Date().getFullYear();

      // Buscar el último número de recibo del año actual
      const { data, error } = await supabase
        .from('recibos')
        .select('numero_recibo')
        .like('numero_recibo', `REC-${year}-%`)
        .order('numero_recibo', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        // Extraer el número y sumar 1
        const ultimoNumero = data[0].numero_recibo;
        const numero = parseInt(ultimoNumero.split('-')[2]) + 1;
        return `REC-${year}-${numero.toString().padStart(4, '0')}`;
      } else {
        // Primer recibo del año
        return `REC-${year}-0001`;
      }
    } catch (err) {
      console.error('Error al generar número de recibo:', err);
      throw err;
    }
  };

  // Crear nuevo recibo con sus items
  const crearRecibo = async (reciboData) => {
    try {
      setError(null);

      // Generar número de recibo
      const numeroRecibo = await generarNumeroRecibo();

      // Preparar datos del recibo
      const nuevoRecibo = {
        numero_recibo: numeroRecibo,
        fecha: reciboData.fecha || new Date().toISOString(),
        cliente_id: reciboData.cliente_id,
        cliente_nombre: reciboData.cliente_nombre,
        cliente_direccion: reciboData.cliente_direccion || '',
        cliente_telefono: reciboData.cliente_telefono || '',
        cliente_email: reciboData.cliente_email || '',
        metodo_pago: reciboData.metodo_pago || 'efectivo',
        moneda: reciboData.moneda || 'USD',
        descuento: reciboData.descuento || 0,
        total: reciboData.total,
        created_by: reciboData.created_by || ''
      };

      // Insertar recibo
      const { data: reciboInsertado, error: reciboError } = await supabase
        .from('recibos')
        .insert([nuevoRecibo])
        .select()
        .single();

      if (reciboError) throw reciboError;

      // Insertar items
      if (reciboData.items && reciboData.items.length > 0) {
        const itemsConReciboId = reciboData.items.map((item, index) => ({
          recibo_id: reciboInsertado.id,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          precio_total: item.precio_total,
          orden: index
        }));

        const { error: itemsError } = await supabase
          .from('recibos_items')
          .insert(itemsConReciboId);

        if (itemsError) throw itemsError;
      }

      // Recargar recibos
      await fetchRecibos();

      return { success: true, recibo: reciboInsertado };
    } catch (err) {
      console.error('Error al crear recibo:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Eliminar recibo
  const eliminarRecibo = async (reciboId) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('recibos')
        .delete()
        .eq('id', reciboId);

      if (error) throw error;

      // Recargar recibos
      await fetchRecibos();

      return { success: true };
    } catch (err) {
      console.error('Error al eliminar recibo:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Obtener un recibo específico con sus items
  const obtenerRecibo = async (reciboId) => {
    try {
      const { data: recibo, error: reciboError } = await supabase
        .from('recibos')
        .select('*')
        .eq('id', reciboId)
        .single();

      if (reciboError) throw reciboError;

      const { data: items, error: itemsError } = await supabase
        .from('recibos_items')
        .select('*')
        .eq('recibo_id', reciboId)
        .order('orden', { ascending: true });

      if (itemsError) throw itemsError;

      return {
        ...recibo,
        items: items || []
      };
    } catch (err) {
      console.error('Error al obtener recibo:', err);
      throw err;
    }
  };

  // Cargar recibos al montar el componente
  useEffect(() => {
    fetchRecibos();
  }, []);

  return {
    recibos,
    loading,
    error,
    crearRecibo,
    eliminarRecibo,
    obtenerRecibo,
    refetch: fetchRecibos
  };
};
