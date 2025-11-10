import { supabase } from '../../../lib/supabase';

export const comprasService = {
  // ============ RECIBOS ============

  /**
   * Crear nuevo recibo en estado borrador
   */
  async createRecibo(proveedor, fecha, descripcion = '') {
    try {
      const { data, error } = await supabase
        .from('compras_recibos')
        .insert({
          proveedor,
          fecha,
          descripcion,
          estado: 'borrador'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creando recibo:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener recibo con todos sus items
   */
  async getReciboWithItems(reciboId) {
    try {
      const { data: recibo, error: reciboError } = await supabase
        .from('compras_recibos')
        .select('*')
        .eq('id', reciboId)
        .single();

      if (reciboError) throw reciboError;

      const { data: items, error: itemsError } = await supabase
        .from('compras_items')
        .select('*')
        .eq('recibo_id', reciboId)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      return {
        success: true,
        data: {
          ...recibo,
          items: items || []
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo recibo:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener todos los recibos (con filtro opcional)
   */
  async getAllRecibos(filtros = {}) {
    try {
      let query = supabase
        .from('compras_recibos')
        .select('*, compras_items(count)');

      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }

      if (filtros.proveedor) {
        query = query.ilike('proveedor', `%${filtros.proveedor}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error obteniendo recibos:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cancelar recibo (elimina recibo e items)
   */
  async cancelRecibo(reciboId) {
    try {
      const { error } = await supabase
        .from('compras_recibos')
        .delete()
        .eq('id', reciboId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelando recibo:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Marcar recibo como procesado
   */
  async marcarReciboComoProcessado(reciboId) {
    try {
      const { error } = await supabase
        .from('compras_recibos')
        .update({
          estado: 'procesado',
          fecha_procesamiento: new Date().toISOString()
        })
        .eq('id', reciboId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error marcando recibo como procesado:', error);
      return { success: false, error: error.message };
    }
  },

  // ============ ITEMS ============

  /**
   * Agregar item al recibo
   */
  async addItemToRecibo(reciboId, itemData) {
    try {
      const { data, error } = await supabase
        .from('compras_items')
        .insert({
          recibo_id: reciboId,
          tipo_producto: itemData.tipo_producto,
          datos_producto: itemData.datos_producto,
          destino: itemData.destino,
          estado_item: 'pendiente'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error agregando item:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener items de un recibo
   */
  async getItemsByRecibo(reciboId) {
    try {
      const { data, error } = await supabase
        .from('compras_items')
        .select('*')
        .eq('recibo_id', reciboId)
        .eq('estado_item', 'pendiente')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Error obteniendo items:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Actualizar item (para editar antes de procesar)
   */
  async updateItem(itemId, itemData) {
    try {
      const { data, error } = await supabase
        .from('compras_items')
        .update({
          datos_producto: itemData.datos_producto,
          destino: itemData.destino
        })
        .eq('id', itemId)
        .eq('estado_item', 'pendiente')
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error actualizando item:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Eliminar item del recibo
   */
  async removeItem(itemId) {
    try {
      const { error } = await supabase
        .from('compras_items')
        .delete()
        .eq('id', itemId)
        .eq('estado_item', 'pendiente');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error eliminando item:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Marcar item como procesado con referencia
   */
  async marcarItemComoProcesado(itemId, referencia_inventario_id) {
    try {
      const { error } = await supabase
        .from('compras_items')
        .update({
          estado_item: 'procesado',
          referencia_inventario_id
        })
        .eq('id', itemId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error marcando item como procesado:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Marcar item como error
   */
  async marcarItemComoError(itemId, errorMsg) {
    try {
      const { error } = await supabase
        .from('compras_items')
        .update({
          estado_item: 'error',
          error_mensaje: errorMsg
        })
        .eq('id', itemId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Error marcando item como error:', error);
      return { success: false, error: error.message };
    }
  }
};
