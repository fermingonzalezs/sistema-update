import { supabase } from '../../../lib/supabase.js';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';

const importacionesService = {
  // 📋 Obtener todos los recibos
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('importaciones_recibos')
        .select(`
          *,
          proveedores (id, nombre, email, telefono),
          clientes (id, nombre, apellido, email),
          importaciones_items (*)
        `)
        .order('fecha_compra', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // 📋 Obtener recibo por ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('importaciones_recibos')
        .select(`
          *,
          proveedores (id, nombre, email, telefono),
          clientes (id, nombre, apellido, email),
          importaciones_items (*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // 📋 Obtener por estado
  async getByEstado(estado) {
    try {
      const { data, error } = await supabase
        .from('importaciones_recibos')
        .select(`
          *,
          proveedores (id, nombre, email, telefono),
          clientes (id, nombre, apellido, email),
          importaciones_items (*)
        `)
        .eq('estado', estado)
        .order('fecha_compra', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // ➕ Crear nuevo recibo con items
  async crearRecibo(reciboData, items) {
    try {
      // Validar datos requeridos
      if (!reciboData.proveedor_id || !reciboData.metodo_pago || !items || items.length === 0) {
        throw new Error('Proveedor, método de pago e items son obligatorios');
      }

      // Generar número de recibo: YYYY-00X
      const anio = new Date(reciboData.fecha_compra).getFullYear();

      // Obtener el próximo número para este año
      const { data: ultimoRecibo, error: ultimoError } = await supabase
        .from('importaciones_recibos')
        .select('numero_recibo')
        .like('numero_recibo', `${anio}-%`)
        .order('numero_recibo', { ascending: false })
        .limit(1);

      let proximoNumero = 1;
      if (ultimoRecibo && ultimoRecibo.length > 0) {
        const ultimoNumeroStr = ultimoRecibo[0].numero_recibo.split('-')[1];
        proximoNumero = parseInt(ultimoNumeroStr) + 1;
      }

      const numeroRecibo = `${anio}-${String(proximoNumero).padStart(2, '0')}`;

      // Crear recibo
      const { data: reciboCreado, error: reciboError } = await supabase
        .from('importaciones_recibos')
        .insert([{
          numero_recibo: numeroRecibo,
          proveedor_id: reciboData.proveedor_id,
          cliente_id: reciboData.cliente_id || null,
          fecha_compra: reciboData.fecha_compra,
          metodo_pago: reciboData.metodo_pago,
          tracking_number: reciboData.tracking_number?.trim() || null,
          empresa_logistica: reciboData.empresa_logistica?.trim() || null,
          fecha_estimada_ingreso: reciboData.fecha_estimada_ingreso || null,
          observaciones: reciboData.observaciones?.trim() || null,
          estado: 'en_transito_usa'
        }])
        .select()
        .single();

      if (reciboError) throw reciboError;

      // Crear items
      const itemsParaInsertar = items.map(item => ({
        recibo_id: reciboCreado.id,
        item: item.item.trim(),
        cantidad: parseInt(item.cantidad),
        precio_unitario_usd: parseFloat(item.precio_unitario_usd),
        peso_estimado_unitario_kg: parseFloat(item.peso_estimado_unitario_kg),
        link_producto: item.link_producto?.trim() || null,
        observaciones: item.observaciones?.trim() || null
      }));

      const { data: itemsCreados, error: itemsError } = await supabase
        .from('importaciones_items')
        .insert(itemsParaInsertar)
        .select();

      if (itemsError) throw itemsError;

      // Obtener el recibo completo con relaciones
      return await this.getById(reciboCreado.id);
    } catch (error) {
      throw error;
    }
  },

  // ✏️ Actualizar recibo
  async updateRecibo(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('importaciones_recibos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  },

  // 📦 Marcar como llegó a depósito USA
  async marcarEnDepositoUSA(id, fechaIngreso) {
    try {
      return await this.updateRecibo(id, {
        estado: 'en_deposito_usa',
        fecha_ingreso_deposito_usa: fechaIngreso || obtenerFechaLocal()
      });
    } catch (error) {
      throw error;
    }
  },

  // ➡️ Avanzar a siguiente estado (para estados intermedios sin modal)
  async avanzarEstado(id, nuevoEstado) {
    try {
      return await this.updateRecibo(id, {
        estado: nuevoEstado
      });
    } catch (error) {
      throw error;
    }
  },

  // 🇦🇷 Recepcionar en Argentina y calcular costos (distribuir por PESO)
  async recepcionarEnArgentina(id, datosRecepcion) {
    try {
      // Validar datos
      if (!datosRecepcion.fecha_recepcion || !datosRecepcion.peso_sin_caja_kg || !datosRecepcion.precio_por_kg_usd) {
        throw new Error('Fecha, peso sin caja y precio por kg son obligatorios');
      }

      // Obtener recibo actual y sus items
      const recibo = await this.getById(id);
      if (!recibo) throw new Error('Recibo no encontrado');

      // Calcular costo total de importación
      const costoTotalImportacion =
        (datosRecepcion.pago_courier_usd || 0) +
        (datosRecepcion.costo_picking_shipping_usd || 0);

      // Calcular peso total REAL basado en los pesos unitarios ingresados
      let totalPesoReal = 0;
      const pesosRealesUnitarios = {};

      for (const item of recibo.importaciones_items) {
        const pesoRealUnitario = parseFloat(datosRecepcion.pesosReales[item.id]) || 0;
        pesosRealesUnitarios[item.id] = pesoRealUnitario;
        totalPesoReal += pesoRealUnitario * item.cantidad;
      }

      // Asegurar que totalPesoReal sea un número válido
      totalPesoReal = parseFloat(totalPesoReal) || 0;
      const costoTotalImportacionNumerico = parseFloat(costoTotalImportacion) || 0;

      // Actualizar cada item con costos distribuidos PROPORCIONALMENTE AL PESO REAL
      const itemsActualizados = recibo.importaciones_items.map(item => {
        const pesoRealUnitario = pesosRealesUnitarios[item.id];
        const pesoRealTotal = pesoRealUnitario * item.cantidad;
        const proporcionPeso = totalPesoReal > 0 ? pesoRealTotal / totalPesoReal : 0;
        const costoAdicionalTotal = proporcionPeso * costoTotalImportacionNumerico;
        const costoAdicionalUnitario = item.cantidad > 0 ? costoAdicionalTotal / item.cantidad : 0;
        const precioUnitarioConCostos = parseFloat(item.precio_unitario_usd) + parseFloat(costoAdicionalUnitario);

        return {
          id: item.id,
          peso_real_unitario_kg: parseFloat(pesoRealUnitario),
          costos_adicionales_usd: parseFloat(costoAdicionalUnitario),
          costo_final_unitario_usd: parseFloat(precioUnitarioConCostos)
        };
      });

      // Actualizar items en BD
      for (const itemActualizado of itemsActualizados) {
        const { error } = await supabase
          .from('importaciones_items')
          .update({
            peso_real_unitario_kg: itemActualizado.peso_real_unitario_kg,
            costos_adicionales_usd: itemActualizado.costos_adicionales_usd,
            costo_final_unitario_usd: itemActualizado.costo_final_unitario_usd
          })
          .eq('id', itemActualizado.id);

        if (error) throw error;
      }

      // Actualizar recibo
      return await this.updateRecibo(id, {
        estado: 'recepcionado',
        fecha_recepcion_argentina: datosRecepcion.fecha_recepcion,
        peso_total_con_caja_kg: parseFloat(datosRecepcion.peso_total_con_caja_kg),
        peso_sin_caja_kg: parseFloat(datosRecepcion.peso_sin_caja_kg),
        precio_por_kg_usd: parseFloat(datosRecepcion.precio_por_kg_usd),
        pago_courier_usd: parseFloat(datosRecepcion.pago_courier_usd || 0),
        costo_picking_shipping_usd: parseFloat(datosRecepcion.costo_picking_shipping_usd || 0),
        costo_total_importacion_usd: costoTotalImportacion
      });
    } catch (error) {
      throw error;
    }
  },

  // 🗑️ Eliminar recibo y sus items
  async deleteRecibo(id) {
    try {
      const { error } = await supabase
        .from('importaciones_recibos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  },

  // 📊 Obtener estadísticas
  async getEstadisticas() {
    try {
      const { data, error } = await supabase
        .from('importaciones_recibos')
        .select('estado, importaciones_items(precio_total_usd)');
      if (error) throw error;

      const stats = {
        total: data.length,
        enTransitoUSA: data.filter(r => r.estado === 'en_transito_usa').length,
        enDepositoUSA: data.filter(r => r.estado === 'en_deposito_usa').length,
        enVueloInternacional: data.filter(r => r.estado === 'en_vuelo_internacional').length,
        enDepositoARG: data.filter(r => r.estado === 'en_deposito_arg').length,
        recepcionadas: data.filter(r => r.estado === 'recepcionado').length,
        totalInvertido: data.reduce((sum, recibo) => {
          return sum + (recibo.importaciones_items || []).reduce((itemSum, item) =>
            itemSum + (item.precio_total_usd || 0), 0);
        }, 0)
      };
      return stats;
    } catch (error) {
      throw error;
    }
  },

  // 🛒 Pasar importación a compras
  async pasarACompras(reciboEditado, itemsEditados, reciboOriginal) {
    try {
      // Validar datos
      if (!reciboEditado.proveedor || !reciboEditado.fecha) {
        throw new Error('Proveedor y fecha son obligatorios');
      }

      if (!itemsEditados || itemsEditados.length === 0) {
        throw new Error('Debe haber al menos un item');
      }

      // 1. Crear recibo en compras_recibos
      const { data: reciboCompra, error: reciboError } = await supabase
        .from('compras_recibos')
        .insert([{
          proveedor: reciboEditado.proveedor,
          fecha: reciboEditado.fecha,
          estado: 'procesado',
          descripcion: reciboEditado.descripcion || '',
          fecha_procesamiento: new Date().toISOString()
        }])
        .select()
        .single();

      if (reciboError) throw reciboError;

      // 2. Crear items en compras_items (vinculados al recibo)
      const comprasItems = itemsEditados.map(item => {
        const itemObj = {
          recibo_id: reciboCompra.id,
          item: item.item,
          cantidad: parseInt(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario_final),
          monto: parseFloat(item.cantidad) * parseFloat(item.precio_unitario_final),
          proveedor: reciboEditado.proveedor,
          fecha: reciboEditado.fecha,
          tipo_compra: 'importacion',
          estado: 'ingresado',
          moneda: 'USD',
          metodo_pago: reciboEditado.metodo_pago,
          caja_pago: 'importacion',
          importacion_recibo_id: reciboOriginal.id,
          costos_logistica_usd: parseFloat(item.costos_adicionales_usd)
        };

        // Solo agregar campos opcionales si tienen valor
        if (item.observaciones) itemObj.observaciones = item.observaciones;
        if (item.link_producto) itemObj.link_producto = item.link_producto;
        if (reciboOriginal.tracking_number) itemObj.numero_seguimiento = reciboOriginal.tracking_number;
        if (reciboOriginal.empresa_logistica) itemObj.logistica_empresa = reciboOriginal.empresa_logistica;

        return itemObj;
      });

      const { data: comprasCreadas, error: comprasError } = await supabase
        .from('compras_items')
        .insert(comprasItems)
        .select();

      if (comprasError) throw comprasError;

      return {
        success: true,
        reciboCompra: reciboCompra.id,
        itemsCreados: comprasCreadas.length,
        total: comprasCreadas.reduce((sum, item) => sum + (item.monto || 0), 0)
      };
    } catch (error) {
      throw error;
    }
  }
};

export default importacionesService;
