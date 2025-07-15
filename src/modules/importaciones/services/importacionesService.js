// Servicio de importaciones migrado desde src/lib/importaciones.js
import { supabase } from '../../../lib/supabase.js';


const importacionesService = {
  // 📋 Obtener todas las importaciones activas
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('importaciones')
        .select(`*, clientes (id, nombre, apellido, email, telefono)`)
        .eq('activo', true)
        .order('fecha_creacion', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
  },
  async getByEstado(estado) {
    try {
      const { data, error } = await supabase
        .from('importaciones')
        .select(`*, clientes (id, nombre, apellido, email, telefono)`)
        .eq('activo', true)
        .eq('estado', estado)
        .order('fecha_creacion', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
  },
  async getPendientesCompra() {
    try {
      const { data, error } = await supabase
        .from('importaciones')
        .select(`*, clientes (id, nombre, apellido, email, telefono)`)
        .eq('activo', true)
        .eq('estado', 'pendiente_compra')
        .order('fecha_aprobacion', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
  },
  async createCotizacion(cotizacionData) {
    try {
      if (!cotizacionData.descripcion || !cotizacionData.cliente_id) {
        throw new Error('Descripción y cliente son obligatorios');
      }
      if (!cotizacionData.precio_compra_usd || !cotizacionData.peso_estimado_kg) {
        throw new Error('Precio de compra y peso son obligatorios');
      }
      const { data, error } = await supabase
        .from('importaciones')
        .insert([{
          cliente_id: cotizacionData.cliente_id,
          descripcion: cotizacionData.descripcion.trim(),
          link_producto: cotizacionData.link_producto?.trim() || null,
          proveedor_nombre: cotizacionData.proveedor_nombre?.trim() || null,
          precio_compra_usd: parseFloat(cotizacionData.precio_compra_usd),
          peso_estimado_kg: parseFloat(cotizacionData.peso_estimado_kg),
          impuestos_usa_porcentaje: parseFloat(cotizacionData.impuestos_usa_porcentaje || 0),
          envio_usa_fijo: parseFloat(cotizacionData.envio_usa_fijo || 0),
          envio_arg_fijo: parseFloat(cotizacionData.envio_arg_fijo || 0),
          precio_por_kg: parseFloat(cotizacionData.precio_por_kg),
          estado: 'cotizacion'
        }])
        .select(`*, clientes (id, nombre, apellido, email, telefono)`)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },
  async update(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('importaciones')
        .update(updateData)
        .eq('id', id)
        .select(`*, clientes (id, nombre, apellido, email, telefono)`)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },
  async aprobarCotizacion(id) {
    try {
      const updateData = {
        estado: 'pendiente_compra',
        fecha_aprobacion: new Date().toISOString()
      };
      return await this.update(id, updateData);
    } catch (error) {
      throw error;
    }
  },
  async marcarEnTransito(id, numeroSeguimiento) {
    try {
      const updateData = {
        estado: 'en_transito',
        numero_seguimiento: numeroSeguimiento?.trim() || null
      };
      return await this.update(id, updateData);
    } catch (error) {
      throw error;
    }
  },
  async finalizarImportacion(id, pesoReal, costosFinales) {
    try {
      const { data: importacionActual, error: getError } = await supabase
        .from('importaciones')
        .select('total_cotizado')
        .eq('id', id)
        .single();
      if (getError) throw getError;
      const diferencia = costosFinales - importacionActual.total_cotizado;
      const updateData = {
        estado: 'finalizada',
        peso_real_kg: parseFloat(pesoReal),
        costos_finales: parseFloat(costosFinales),
        diferencia_estimado_real: diferencia
      };
      return await this.update(id, updateData);
    } catch (error) {
      throw error;
    }
  },
  async delete(id) {
    try {
      const { data, error } = await supabase
        .from('importaciones')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },
  async getEstadisticas() {
    try {
      const { data, error } = await supabase
        .from('importaciones')
        .select('estado, total_cotizado, diferencia_estimado_real')
        .eq('activo', true);
      if (error) throw error;
      const stats = {
        total: data.length,
        cotizaciones: data.filter(i => i.estado === 'cotizacion').length,
        pendientes: data.filter(i => i.estado === 'pendiente_compra').length,
        enTransito: data.filter(i => i.estado === 'en_transito').length,
        finalizadas: data.filter(i => i.estado === 'finalizada').length,
        montoTotal: data.reduce((sum, i) => sum + (i.total_cotizado || 0), 0),
        diferenciasPromedio: data
          .filter(i => i.diferencia_estimado_real !== null)
          .reduce((sum, i, _, arr) => sum + (i.diferencia_estimado_real / arr.length), 0)
      };
      return stats;
    } catch (error) {
      throw error;
    }
  }
};

export default importacionesService;
