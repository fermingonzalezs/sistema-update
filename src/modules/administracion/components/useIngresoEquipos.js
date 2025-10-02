import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useIngresoEquipos = () => {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener historial de ingresos
  const fetchIngresos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ingresos_equipos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      setIngresos(data || []);
    } catch (err) {
      console.error('Error fetching ingresos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Registrar nuevo ingreso
  const registrarIngreso = async (ingresoData) => {
    try {
      const { data, error } = await supabase
        .from('ingresos_equipos')
        .insert([ingresoData])
        .select()
        .single();

      if (error) throw error;
      
      // Actualizar lista local
      setIngresos(prev => [data, ...prev]);
      
      return { success: true, data };
    } catch (err) {
      console.error('Error registrando ingreso:', err);
      return { success: false, error: err.message };
    }
  };

  // Actualizar estado de ingreso
  const actualizarEstadoIngreso = async (id, nuevoEstado, referenciaInventarioId = null) => {
    try {
      const updateData = { estado: nuevoEstado };
      if (referenciaInventarioId) {
        updateData.referencia_inventario_id = referenciaInventarioId;
      }

      const { data, error } = await supabase
        .from('ingresos_equipos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar lista local
      setIngresos(prev => 
        prev.map(ingreso => 
          ingreso.id === id ? { ...ingreso, ...updateData } : ingreso
        )
      );

      return { success: true, data };
    } catch (err) {
      console.error('Error actualizando estado:', err);
      return { success: false, error: err.message };
    }
  };

  // Obtener ingresos pendientes de testeo
  const getIngresosPendientesTesteo = () => {
    return ingresos.filter(ingreso => 
      ingreso.destino === 'testeo' && 
      (ingreso.estado === 'pendiente' || ingreso.estado === 'en_testeo')
    );
  };

  // Función helper para generar descripción completa
  const generarDescripcionCompleta = (tipoProducto, datos) => {
    switch (tipoProducto) {
      case 'notebook':
        return `${datos.marca || ''} ${datos.modelo || ''} - ${datos.procesador || ''} / ${datos.ram || ''}GB RAM / ${datos.ssd || ''}GB SSD${datos.hdd ? ` + ${datos.hdd}GB HDD` : ''} / ${datos.pantalla || ''}"`;
      
      case 'celular':
        return `${datos.marca || ''} ${datos.modelo || ''} - ${datos.capacidad || ''} / ${datos.color || ''} / Batería: ${datos.porcentaje_bateria || ''}%`;
      
      case 'otro':
        const nombre = datos.nombre_producto || datos.descripcion_producto || 'Sin nombre';
        const categoria = datos.categoria || 'Accesorio';
        const marca = datos.marca ? ` ${datos.marca}` : '';
        const descripcion = datos.descripcion ? ` - ${datos.descripcion}` : '';
        return `${categoria} -${marca} ${nombre}${descripcion}`;
      
      default:
        return JSON.stringify(datos);
    }
  };

  // Marcar un ingreso como aprobado
  const marcarComoAprobado = async (id) => {
    return await actualizarEstadoIngreso(id, 'aprobado');
  };

  useEffect(() => {
    fetchIngresos();
  }, []);

  return {
    ingresos,
    loading,
    error,
    fetchIngresos,
    registrarIngreso,
    actualizarEstadoIngreso,
    getIngresosPendientesTesteo,
    generarDescripcionCompleta,
    marcarComoAprobado
  };
};