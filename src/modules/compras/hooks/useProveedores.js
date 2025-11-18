import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar proveedores de la tabla
  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre', { ascending: true });

      if (queryError) throw queryError;
      setProveedores(data || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando proveedores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar proveedores al montar el componente
  useEffect(() => {
    cargarProveedores();
  }, []);

  // Crear nuevo proveedor
  const crearProveedor = async (datosProveedor) => {
    try {
      setLoading(true);

      const proveedorData = {
        nombre: datosProveedor.nombre,
        email: datosProveedor.email || datosProveedor.mail || null,
        telefono: datosProveedor.telefono || null,
        pais: datosProveedor.pais || null,
        direccion: datosProveedor.direccion || null,
        barrio: datosProveedor.barrio || null,
        notas: datosProveedor.notas || null,
        cliente_id: datosProveedor.cliente_id || null
      };

      const { data, error: insertError } = await supabase
        .from('proveedores')
        .insert([proveedorData])
        .select();

      if (insertError) throw insertError;

      setProveedores(prev => [data[0], ...prev]);
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error creando proveedor:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar proveedor existente
  const actualizarProveedor = async (id, datosActualizados) => {
    try {
      setLoading(true);

      const { data, error: updateError } = await supabase
        .from('proveedores')
        .update(datosActualizados)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;

      setProveedores(prev =>
        prev.map(prov => prov.id === id ? data[0] : prov)
      );

      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error actualizando proveedor:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Eliminar proveedor
  const eliminarProveedor = async (id) => {
    try {
      setLoading(true);

      const { error: deleteError } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setProveedores(prev => prev.filter(prov => prov.id !== id));

      return { success: true };
    } catch (err) {
      console.error('Error eliminando proveedor:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Obtener un proveedor por ID
  const obtenerProveedor = async (id) => {
    try {
      const { data, error: queryError } = await supabase
        .from('proveedores')
        .select('*')
        .eq('id', id)
        .single();

      if (queryError) throw queryError;
      return { success: true, data };
    } catch (err) {
      console.error('Error obteniendo proveedor:', err);
      return { success: false, error: err.message };
    }
  };

  // Obtener proveedores por país
  const obtenerPorPais = (pais) => {
    return proveedores.filter(p => p.pais === pais);
  };

  // Obtener proveedores activos
  const obtenerActivos = () => {
    return proveedores.filter(p => p.activo);
  };

  return {
    proveedores,
    loading,
    error,
    cargarProveedores,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    obtenerProveedor,
    obtenerPorPais,
    obtenerActivos
  };
};
