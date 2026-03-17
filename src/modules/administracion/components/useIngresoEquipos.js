import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { generateCopy } from '../../../shared/utils/copyGenerator';

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
        .select(`
          *,
          proveedores:proveedor_id (
            nombre
          )
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Enriquecer con datos de subcategoria y serial desde las tablas de inventario
      const ingresosEnriquecidos = await Promise.all(
        (data || []).map(async (ingreso) => {
          let subcategoria = null;
          let serial = null;
          const color = ingreso.color || null;

          if (ingreso.referencia_inventario_id) {
            try {
              if (ingreso.tipo_producto === 'notebook') {
                const { data: notebook } = await supabase
                  .from('inventario')
                  .select('categoria, serial')
                  .eq('id', ingreso.referencia_inventario_id)
                  .single();
                subcategoria = notebook?.categoria || null;
                serial = notebook?.serial || null;
              } else if (ingreso.tipo_producto === 'celular') {
                const { data: celular } = await supabase
                  .from('celulares')
                  .select('categoria, serial')
                  .eq('id', ingreso.referencia_inventario_id)
                  .single();
                subcategoria = celular?.categoria || null;
                serial = celular?.serial || null;
              } else if (ingreso.tipo_producto === 'otro') {
                const { data: otro } = await supabase
                  .from('otros')
                  .select('categoria, serial')
                  .eq('id', ingreso.referencia_inventario_id)
                  .single();
                subcategoria = otro?.categoria || null;
                serial = otro?.serial || null;
              }
            } catch (err) {
              console.error('Error fetching subcategoria/serial:', err);
            }
          }

          // Intentar extraer serial del campo notas si no se encontró en inventario
          if (!serial && ingreso.notas) {
            const serialMatch = ingreso.notas.match(/Serial:\s*([^|]+)/i);
            if (serialMatch && serialMatch[1]?.trim() !== 'N/A') {
              serial = serialMatch[1].trim();
            }
          }

          return {
            ...ingreso,
            subcategoria,
            serial,
            color,
            // Si no hay proveedor en el campo (legacy), usar el nombre del JOIN
            proveedor: ingreso.proveedor || ingreso.proveedores?.nombre || null
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

  // Función helper para generar descripción completa usando el copyGenerator centralizado
  const generarDescripcionCompleta = (tipoProducto, datos) => {
    switch (tipoProducto) {
      case 'notebook':
        return generateCopy(datos, { tipo: 'notebook_completo' });
      case 'celular':
        return generateCopy(datos, { tipo: 'celular_completo' });
      case 'otro':
        return generateCopy(datos, { tipo: 'otro_completo' });
      default:
        return generateCopy(datos, { tipo: 'otro_completo' });
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