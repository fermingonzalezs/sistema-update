import { supabase } from '../../../lib/supabase';

/**
 * Servicio para operaciones de compras locales
 * Maneja recibos y items de compras
 */

export const comprasLocalesService = {
  /**
   * Genera el próximo número de recibo en formato YYYY-##
   * Ejemplo: "2025-01", "2025-02", etc.
   */
  async generarNumeroRecibo() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const prefijo = `${anio}-`;

    // Obtener el último recibo del año actual
    const { data, error } = await supabase
      .from('compras_recibos')
      .select('numero_recibo')
      .like('numero_recibo', `${prefijo}%`)
      .order('numero_recibo', { ascending: false })
      .limit(1)
      .single();

    let numeroSecuencia = 1;

    if (data && data.numero_recibo) {
      // Extraer número secuencial del último recibo
      const partes = data.numero_recibo.split('-');
      const ultimoNumero = parseInt(partes[1], 10);
      numeroSecuencia = ultimoNumero + 1;
    }

    // Formatear con ceros a la izquierda (01, 02, 03, etc.)
    const numeroFormato = String(numeroSecuencia).padStart(2, '0');
    return `${prefijo}${numeroFormato}`;
  },

  /**
   * Crear un nuevo recibo con sus items
   * Maneja la transacción: crea recibo primero, luego items
   * Usa historico_compras para almacenar los items
   */
  async crearRecibo(reciboData, items = []) {
    try {
      // Generar número de recibo
      const numeroRecibo = await this.generarNumeroRecibo();

      const datosRecibo = {
        numero_recibo: numeroRecibo,
        proveedor: reciboData.proveedor,
        fecha: reciboData.fecha_compra,
        metodo_pago: reciboData.metodo_pago,
        descripcion: reciboData.observaciones || null,
        estado: 'borrador',
        created_at: new Date().toISOString()
      };

      // Insertar recibo
      const { data: reciboCreado, error: errorRecibo } = await supabase
        .from('compras_recibos')
        .insert([datosRecibo])
        .select()
        .single();

      if (errorRecibo) throw errorRecibo;

      // Insertar items si los hay
      let itemsCreados = [];
      if (items.length > 0) {
        const datosItems = items.map(item => ({
          recibo_id: reciboCreado.id,
          producto: item.producto,
          cantidad: parseInt(item.cantidad),
          serial: item.serial || null,
          precio_unitario: parseFloat(item.precio_unitario),
          precio_total: parseInt(item.cantidad) * parseFloat(item.precio_unitario),
          descripcion: item.descripcion || null,
          created_at: new Date().toISOString()
        }));

        const { data: items_insertados, error: errorItems } = await supabase
          .from('compra_items')
          .insert(datosItems)
          .select();

        if (errorItems) throw errorItems;
        itemsCreados = items_insertados;
      }

      return {
        ...reciboCreado,
        compras_items: itemsCreados
      };
    } catch (error) {
      console.error('Error creando recibo:', error);
      throw error;
    }
  },

  /**
   * Obtener un recibo específico con sus items
   */
  async getReciboConItems(id) {
    try {
      // Obtener el recibo
      const { data: recibo, error: errorRecibo } = await supabase
        .from('compras_recibos')
        .select('*')
        .eq('id', id)
        .single();

      if (errorRecibo) throw errorRecibo;

      // Obtener los items
      const { data: items, error: errorItems } = await supabase
        .from('compra_items')
        .select('*')
        .eq('recibo_id', id)
        .order('created_at', { ascending: true });

      if (errorItems) throw errorItems;

      return {
        ...recibo,
        compras_items: items || []
      };
    } catch (error) {
      console.error('Error obteniendo recibo:', error);
      throw error;
    }
  },

  /**
   * Obtener todos los recibos con sus items
   */
  async getAllRecibos() {
    try {
      // Obtener todos los recibos
      const { data: recibos, error: errorRecibos } = await supabase
        .from('compras_recibos')
        .select('*')
        .order('created_at', { ascending: false });

      if (errorRecibos) throw errorRecibos;

      // Obtener todos los items y agrupar por recibo_id
      const { data: items, error: errorItems } = await supabase
        .from('compra_items')
        .select('*');

      if (errorItems) throw errorItems;

      // Mapear items a sus recibos correspondientes
      const itemsPorRecibo = {};
      (items || []).forEach(item => {
        if (!itemsPorRecibo[item.recibo_id]) {
          itemsPorRecibo[item.recibo_id] = [];
        }
        itemsPorRecibo[item.recibo_id].push(item);
      });

      // Agregar items a cada recibo
      return (recibos || []).map(recibo => ({
        ...recibo,
        compras_items: itemsPorRecibo[recibo.id] || []
      }));
    } catch (error) {
      console.error('Error obteniendo recibos:', error);
      throw error;
    }
  },

  /**
   * Actualizar un recibo y sus items
   * Elimina items viejos y crea nuevos
   */
  async updateRecibo(id, reciboData, items = []) {
    try {
      // Actualizar recibo
      const { error: errorUpdate } = await supabase
        .from('compras_recibos')
        .update({
          proveedor: reciboData.proveedor,
          fecha: reciboData.fecha_compra,
          metodo_pago: reciboData.metodo_pago,
          descripcion: reciboData.observaciones || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (errorUpdate) throw errorUpdate;

      // Eliminar items viejos
      const { error: errorDeleteItems } = await supabase
        .from('compra_items')
        .delete()
        .eq('recibo_id', id);

      if (errorDeleteItems) throw errorDeleteItems;

      // Insertar nuevos items
      let itemsActualizados = [];
      if (items.length > 0) {
        const datosItems = items.map(item => ({
          recibo_id: id,
          producto: item.producto,
          cantidad: parseInt(item.cantidad),
          serial: item.serial || null,
          precio_unitario: parseFloat(item.precio_unitario),
          precio_total: parseInt(item.cantidad) * parseFloat(item.precio_unitario),
          descripcion: item.descripcion || null,
          created_at: new Date().toISOString()
        }));

        const { data: items_insertados, error: errorItems } = await supabase
          .from('compra_items')
          .insert(datosItems)
          .select();

        if (errorItems) throw errorItems;
        itemsActualizados = items_insertados;
      }

      const { data: reciboActualizado } = await this.getReciboConItems(id);

      return reciboActualizado;
    } catch (error) {
      console.error('Error actualizando recibo:', error);
      throw error;
    }
  },

  /**
   * Cambiar estado de recibo de 'borrador' a 'procesado'
   */
  async procesarRecibo(id) {
    try {
      const { data, error } = await supabase
        .from('compras_recibos')
        .update({
          estado: 'procesado',
          fecha_procesamiento: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error procesando recibo:', error);
      throw error;
    }
  },

  /**
   * Eliminar un recibo y todos sus items (cascade)
   */
  async deleteRecibo(id) {
    try {
      const { error } = await supabase
        .from('compras_recibos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error eliminando recibo:', error);
      throw error;
    }
  },

  /**
   * Eliminar un item específico
   */
  async deleteItem(itemId) {
    try {
      const { error } = await supabase
        .from('compra_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error eliminando item:', error);
      throw error;
    }
  }
};
