import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useIngresoEquipos = () => {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener historial de ingresos con datos relacionados de inventario
  const fetchIngresos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ingresos_equipos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Enriquecer con datos de subcategoría desde las tablas de inventario
      const ingresosEnriquecidos = await Promise.all(
        (data || []).map(async (ingreso) => {
          let subcategoria = null;

          if (ingreso.referencia_inventario_id) {
            try {
              if (ingreso.tipo_producto === 'notebook') {
                const { data: notebook } = await supabase
                  .from('inventario')
                  .select('categoria')
                  .eq('id', ingreso.referencia_inventario_id)
                  .single();
                subcategoria = notebook?.categoria || null;
              } else if (ingreso.tipo_producto === 'celular') {
                const { data: celular } = await supabase
                  .from('celulares')
                  .select('categoria')
                  .eq('id', ingreso.referencia_inventario_id)
                  .single();
                subcategoria = celular?.categoria || null;
              } else if (ingreso.tipo_producto === 'otro') {
                const { data: otro } = await supabase
                  .from('otros')
                  .select('categoria')
                  .eq('id', ingreso.referencia_inventario_id)
                  .single();
                subcategoria = otro?.categoria || null;
              }
            } catch (err) {
              console.error('Error fetching subcategoria:', err);
            }
          }

          return {
            ...ingreso,
            subcategoria
          };
        })
      );

      setIngresos(ingresosEnriquecidos);
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
        let modeloNotebook = datos.modelo || '';
        if (datos.marca && modeloNotebook.toLowerCase().startsWith(datos.marca.toLowerCase())) {
          modeloNotebook = modeloNotebook.substring(datos.marca.length).trim();
        }
        return `${modeloNotebook} - ${datos.pantalla || ''}" - ${datos.procesador || ''} - ${datos.ram || ''}GB RAM - ${datos.ssd || ''}GB SSD${datos.hdd ? ` + ${datos.hdd}GB HDD` : ''}`;

      case 'celular':
        let modeloCelular = datos.modelo || '';
        if (datos.marca && modeloCelular.toLowerCase().startsWith(datos.marca.toLowerCase())) {
          modeloCelular = modeloCelular.substring(datos.marca.length).trim();
        }
        return `${modeloCelular} - ${datos.color || ''} - ${datos.capacidad || ''} - Batería: ${datos.porcentaje_bateria || datos.bateria || ''}%`;

      case 'otro':
        const nombre = datos.nombre_producto || datos.descripcion_producto || 'Sin nombre';
        const descripcion = datos.descripcion ? ` - ${datos.descripcion}` : '';
        const cantidadTotal = (parseInt(datos.cantidad_la_plata) || 0) + (parseInt(datos.cantidad_mitre) || 0);
        return `${nombre}${descripcion} - Cantidad: ${cantidadTotal}`;

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