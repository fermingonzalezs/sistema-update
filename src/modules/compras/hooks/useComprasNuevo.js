import { useState } from 'react';
import { comprasService } from '../services/comprasService';
import { stockIntegrationService } from '../services/stockIntegrationService';

export const useCompras = () => {
  const [reciboActual, setReciboActual] = useState(null);
  const [itemsCarrito, setItemsCarrito] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const crearRecibo = async (datosRecibo) => {
    setLoading(true);
    setError(null);

    try {
      const { success, data, error: serviceError } = await comprasService.createRecibo(
        datosRecibo.proveedor,
        datosRecibo.fecha,
        datosRecibo.descripcion
      );

      if (!success) throw new Error(serviceError);

      setReciboActual(data);
      setItemsCarrito([]);
      setSuccessMessage('✅ Recibo creado. Comienza a agregar productos.');

      return { success: true, data };
    } catch (err) {
      const mensaje = err.message || 'Error al crear recibo';
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const agregarItemAlCarrito = async (itemData) => {
    setLoading(true);
    setError(null);

    try {
      if (!reciboActual) {
        throw new Error('No hay recibo activo');
      }

      const { success, data, error: serviceError } = await comprasService.addItemToRecibo(
        reciboActual.id,
        itemData
      );

      if (!success) throw new Error(serviceError);

      setItemsCarrito(prev => [data, ...prev]);
      setSuccessMessage(`✅ Producto agregado al carrito (${itemsCarrito.length + 1} items)`);

      return { success: true, data };
    } catch (err) {
      const mensaje = err.message || 'Error al agregar producto';
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const editarItemDelCarrito = async (itemId, itemDataActualizado) => {
    setLoading(true);
    setError(null);

    try {
      const { success, data, error: serviceError } = await comprasService.updateItem(
        itemId,
        itemDataActualizado
      );

      if (!success) throw new Error(serviceError);

      setItemsCarrito(prev =>
        prev.map(item => item.id === itemId ? data : item)
      );
      setSuccessMessage('✅ Producto actualizado');

      return { success: true, data };
    } catch (err) {
      const mensaje = err.message || 'Error al actualizar producto';
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const eliminarItemDelCarrito = async (itemId) => {
    setLoading(true);
    setError(null);

    try {
      const { success, error: serviceError } = await comprasService.removeItem(itemId);

      if (!success) throw new Error(serviceError);

      setItemsCarrito(prev => prev.filter(item => item.id !== itemId));
      setSuccessMessage('✅ Producto removido del carrito');

      return { success: true };
    } catch (err) {
      const mensaje = err.message || 'Error al eliminar producto';
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const procesarRecibo = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!reciboActual) {
        throw new Error('No hay recibo activo');
      }

      if (itemsCarrito.length === 0) {
        throw new Error('El carrito está vacío');
      }

      let procesadosStock = 0;
      let procesadosTesteo = 0;
      let errores = [];

      for (const item of itemsCarrito) {
        try {
          let resultado;

          if (item.destino === 'stock') {
            resultado = await stockIntegrationService.procesarItemAStock(item);

            if (resultado.success) {
              await comprasService.marcarItemComoProcesado(item.id, resultado.id);
              procesadosStock++;
            } else {
              throw new Error(resultado.error);
            }
          } else if (item.destino === 'testeo') {
            resultado = await stockIntegrationService.procesarItemATesteo(item);

            if (resultado.success) {
              await comprasService.marcarItemComoProcesado(item.id, resultado.id);
              procesadosTesteo++;
            } else {
              throw new Error(resultado.error);
            }
          }
        } catch (itemError) {
          errores.push({
            item: item.datos_producto.modelo || item.datos_producto.nombre_producto,
            error: itemError.message
          });

          await comprasService.marcarItemComoError(item.id, itemError.message);
        }
      }

      await comprasService.marcarReciboComoProcessado(reciboActual.id);

      setReciboActual(null);
      setItemsCarrito([]);

      const mensaje = `✅ Recibo procesado: ${procesadosStock} items a stock, ${procesadosTesteo} a testeo`;
      setSuccessMessage(mensaje);

      return {
        success: true,
        resumen: {
          procesadosStock,
          procesadosTesteo,
          errores,
          tieneErrores: errores.length > 0
        }
      };
    } catch (err) {
      const mensaje = err.message || 'Error al procesar recibo';
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const cancelarRecibo = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!reciboActual) {
        throw new Error('No hay recibo activo');
      }

      const { success, error: serviceError } = await comprasService.cancelRecibo(
        reciboActual.id
      );

      if (!success) throw new Error(serviceError);

      setReciboActual(null);
      setItemsCarrito([]);
      setSuccessMessage('✅ Recibo cancelado');

      return { success: true };
    } catch (err) {
      const mensaje = err.message || 'Error al cancelar recibo';
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const recargarRecibo = async (reciboId) => {
    setLoading(true);
    setError(null);

    try {
      const { success, data, error: serviceError } = await comprasService.getReciboWithItems(
        reciboId
      );

      if (!success) throw new Error(serviceError);

      setReciboActual({
        id: data.id,
        proveedor: data.proveedor,
        fecha: data.fecha,
        descripcion: data.descripcion,
        estado: data.estado
      });
      setItemsCarrito(data.items || []);

      return { success: true, data };
    } catch (err) {
      const mensaje = err.message || 'Error al recargar recibo';
      setError(mensaje);
      return { success: false, error: mensaje };
    } finally {
      setLoading(false);
    }
  };

  const limpiarMensajes = () => {
    setError(null);
    setSuccessMessage(null);
  };

  return {
    reciboActual,
    itemsCarrito,
    loading,
    error,
    successMessage,
    crearRecibo,
    agregarItemAlCarrito,
    editarItemDelCarrito,
    eliminarItemDelCarrito,
    procesarRecibo,
    cancelarRecibo,
    recargarRecibo,
    limpiarMensajes
  };
};