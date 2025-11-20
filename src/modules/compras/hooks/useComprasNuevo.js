import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { comprasLocalesService } from '../services/comprasLocalesService';

/**
 * Hook para gestionar recibos de compras locales
 * Maneja creación, edición, eliminación y procesamiento de recibos
 */
export const useComprasNuevo = () => {
  const [reciboActual, setReciboActual] = useState(null);
  const [itemsCarrito, setItemsCarrito] = useState([]);
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Cargar todos los recibos del sistema
   */
  const cargarRecibos = async () => {
    try {
      setLoading(true);
      setError(null);

      const recibosConItems = await comprasLocalesService.getAllRecibos();
      setRecibos(recibosConItems);
    } catch (err) {
      console.error('Error cargando recibos:', err);
      setError(`Error al cargar recibos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crear un nuevo recibo (vacío, sin items)
   */
  const crearRecibo = async (datosRecibo) => {
    try {
      setLoading(true);
      setError(null);

      const reciboCreado = await comprasLocalesService.crearRecibo(datosRecibo, []);

      setReciboActual(reciboCreado);
      setItemsCarrito([]);
      setSuccessMessage('Recibo creado exitosamente');

      return { success: true, data: reciboCreado };
    } catch (err) {
      console.error('Error creando recibo:', err);
      setError(`Error al crear recibo: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Agregar un item al carrito (sin guardar en BD)
   */
  const agregarItemAlCarrito = async (item) => {
    try {
      setError(null);

      const nuevoItem = {
        id: `temp_${Date.now()}`,
        ...item,
        estado: 'pendiente'
      };

      setItemsCarrito(prev => [...prev, nuevoItem]);
      setSuccessMessage('Producto agregado al carrito');

      return { success: true };
    } catch (err) {
      console.error('Error agregando item:', err);
      setError(`Error al agregar producto: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  /**
   * Editar un item del carrito
   */
  const editarItemDelCarrito = async (itemId, datosActualizados) => {
    try {
      setError(null);

      setItemsCarrito(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, ...datosActualizados } : item
        )
      );
      setSuccessMessage('Producto actualizado');

      return { success: true };
    } catch (err) {
      console.error('Error editando item:', err);
      setError(`Error al editar producto: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  /**
   * Eliminar un item del carrito
   */
  const eliminarItemDelCarrito = async (itemId) => {
    try {
      setError(null);

      setItemsCarrito(prev => prev.filter(item => item.id !== itemId));
      setSuccessMessage('Producto eliminado');

      return { success: true };
    } catch (err) {
      console.error('Error eliminando item:', err);
      setError(`Error al eliminar producto: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  /**
   * Procesar el recibo: guardar todos los items en la BD y cambiar estado a 'procesado'
   */
  const procesarRecibo = async () => {
    try {
      if (!reciboActual) {
        throw new Error('No hay recibo activo');
      }

      if (itemsCarrito.length === 0) {
        throw new Error('El carrito está vacío');
      }

      setLoading(true);
      setError(null);

      // Filtrar items temporales (son los que aún no se guardaron)
      const itemsParaGuardar = itemsCarrito
        .filter(item => item.id.toString().startsWith('temp_'))
        .map(item => ({
          producto: item.datos_producto?.nombre_producto || item.datos_producto?.modelo || 'Producto',
          cantidad: 1,
          serial: item.datos_producto?.serial || null,
          precio_unitario: 0,
          descripcion: `${item.tipo_producto} - ${item.destino}`
        }));

      // Actualizar recibo con los items
      const reciboActualizado = await comprasLocalesService.updateRecibo(
        reciboActual.id,
        reciboActual,
        itemsParaGuardar
      );

      // Procesar el recibo
      const reciboProcesado = await comprasLocalesService.procesarRecibo(reciboActual.id);

      // Contar cuántos items fueron a stock vs testeo
      const cantStock = itemsCarrito.filter(i => i.destino === 'stock').length;
      const cantTesteo = itemsCarrito.filter(i => i.destino === 'testeo').length;

      setReciboActual(null);
      setItemsCarrito([]);

      // Recargar recibos
      await cargarRecibos();

      setSuccessMessage('Recibo procesado exitosamente');

      return {
        success: true,
        resumen: {
          procesadosStock: cantStock,
          procesadosTesteo: cantTesteo,
          total: itemsCarrito.length
        }
      };
    } catch (err) {
      console.error('Error procesando recibo:', err);
      setError(`Error al procesar recibo: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancelar el recibo actual (eliminar sin guardar items)
   */
  const cancelarRecibo = async () => {
    try {
      if (!reciboActual) {
        throw new Error('No hay recibo activo');
      }

      setLoading(true);
      setError(null);

      await comprasLocalesService.deleteRecibo(reciboActual.id);

      setReciboActual(null);
      setItemsCarrito([]);
      setSuccessMessage('Recibo cancelado');

      return { success: true };
    } catch (err) {
      console.error('Error cancelando recibo:', err);
      setError(`Error al cancelar recibo: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Limpiar mensajes
   */
  const limpiarMensajes = () => {
    setError(null);
    setSuccessMessage('');
  };

  /**
   * Cargar recibos al montar el componente
   */
  useEffect(() => {
    cargarRecibos();
  }, []);

  return {
    reciboActual,
    itemsCarrito,
    recibos,
    loading,
    error,
    successMessage,
    crearRecibo,
    agregarItemAlCarrito,
    editarItemDelCarrito,
    eliminarItemDelCarrito,
    procesarRecibo,
    cancelarRecibo,
    limpiarMensajes,
    cargarRecibos
  };
};
