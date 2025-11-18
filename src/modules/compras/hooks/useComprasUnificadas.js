import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useComprasUnificadas = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar compras de la tabla unificada
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

  // Cargar compras al montar el componente
  useEffect(() => {
    cargarCompras();
  }, []);

  // Crear nueva compra
  const crearCompra = async (datosCompra) => {
    try {
      setLoading(true);

      const cantidad = datosCompra.cantidad || 1;
      const precioUnitario = datosCompra.precio_unitario || (datosCompra.monto ? datosCompra.monto / cantidad : 0);
      const pesoUnitario = datosCompra.peso_unitario_kg || null;

      const compraData = {
        tipo_compra: datosCompra.tipo_compra || 'nacional',
        item: datosCompra.item,
        cantidad: cantidad,
        precio_unitario: precioUnitario,
        proveedor: datosCompra.proveedor,
        monto: datosCompra.monto,
        moneda: datosCompra.moneda || 'USD',
        fecha: datosCompra.fecha || new Date().toISOString().split('T')[0],
        metodo_pago: datosCompra.metodo_pago,
        caja_pago: datosCompra.caja_pago,
        descripcion: datosCompra.descripcion,
        observaciones: datosCompra.observaciones,

        // Campos de pesos unitarios y totales
        peso_unitario_kg: pesoUnitario,
        peso_estimado_kg: pesoUnitario && cantidad ? pesoUnitario * cantidad : datosCompra.peso_estimado_kg || null,

        // Campos de importación
        logistica_empresa: datosCompra.logistica_empresa || null,
        numero_seguimiento: datosCompra.numero_seguimiento || null,
        peso_real_kg: datosCompra.peso_real_kg || null,
        fecha_estimada_ingreso: datosCompra.fecha_estimada_ingreso || null,
        fecha_ingreso_real: datosCompra.fecha_ingreso_real || null,
        fecha_aprobacion_compra: datosCompra.fecha_aprobacion_compra || null,
        costos_logistica_usd: datosCompra.costos_logistica_usd || 0,
        envio_usa_usd: datosCompra.envio_usa_usd || 0,
        envio_arg_usd: datosCompra.envio_arg_usd || 0,
        impuestos_porcentaje: datosCompra.impuestos_porcentaje || 0,
        precio_por_kg: datosCompra.precio_por_kg || null,
        link_producto: datosCompra.link_producto || null,

        // Campos estándar
        estado: datosCompra.estado || 'ingresado',
        cotizacion: datosCompra.cotizacion || null,
        costo_adicional: datosCompra.costo_adicional || 0,
        serial: datosCompra.serial || null
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

  // Actualizar compra existente
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

  // Obtener compras por tipo
  const obtenerComprasPorTipo = (tipo) => {
    return compras.filter(compra => compra.tipo_compra === tipo);
  };

  // Calcular total de compras
  const calcularTotalCompras = () => {
    return compras.reduce((sum, compra) => sum + parseFloat(compra.monto || 0), 0);
  };

  // Calcular total por tipo
  const calcularTotalPorTipo = (tipo) => {
    return obtenerComprasPorTipo(tipo).reduce(
      (sum, compra) => sum + parseFloat(compra.monto || 0),
      0
    );
  };

  // Calcular costos adicionales totales (logística para importaciones)
  const calcularCostosLogistica = (tipo) => {
    return obtenerComprasPorTipo(tipo).reduce((sum, compra) => {
      const costos = parseFloat(compra.costos_logistica_usd || 0) +
                     parseFloat(compra.envio_usa_usd || 0) +
                     parseFloat(compra.envio_arg_usd || 0);
      return sum + costos;
    }, 0);
  };

  // Obtener resumen por proveedor
  const obtenerResumenPorProveedor = () => {
    const resumen = {};

    compras.forEach(compra => {
      if (!resumen[compra.proveedor]) {
        resumen[compra.proveedor] = {
          proveedor: compra.proveedor,
          total: 0,
          cantidad: 0,
          items: []
        };
      }

      resumen[compra.proveedor].total += parseFloat(compra.monto || 0);
      resumen[compra.proveedor].cantidad += 1;
      resumen[compra.proveedor].items.push(compra.item);
    });

    return Object.values(resumen);
  };

  return {
    compras,
    loading,
    error,
    cargarCompras,
    crearCompra,
    actualizarCompra,
    eliminarCompra,
    obtenerComprasPorTipo,
    calcularTotalCompras,
    calcularTotalPorTipo,
    calcularCostosLogistica,
    obtenerResumenPorProveedor
  };
};
