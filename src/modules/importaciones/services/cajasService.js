import { supabase } from '../../../lib/supabase.js';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';

const cajasService = {
  // 📋 Obtener todas las cajas con sus items y recibos
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('importaciones_cajas')
        .select(`
          *,
          importaciones_items (
            id,
            item,
            cantidad,
            color,
            almacenamiento,
            costo_final_unitario_usd,
            precio_unitario_usd,
            peso_estimado_unitario_kg,
            peso_real_unitario_kg,
            costo_envio_usd,
            costo_financiero_usd,
            recibo_id,
            importaciones_recibos (
              id,
              numero_recibo,
              estado,
              observaciones,
              porcentaje_financiero,
              proveedores (nombre)
            )
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // 📋 Obtener caja por ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('importaciones_cajas')
        .select(`
          *,
          importaciones_items (
            id,
            item,
            cantidad,
            color,
            almacenamiento,
            costo_final_unitario_usd,
            precio_unitario_usd,
            peso_estimado_unitario_kg,
            peso_real_unitario_kg,
            costo_envio_usd,
            costo_financiero_usd,
            recibo_id,
            importaciones_recibos (
              id,
              numero_recibo,
              estado,
              fecha_compra,
              observaciones,
              porcentaje_financiero,
              proveedores (nombre)
            )
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // ➕ Crear nueva caja con número automático (solo descripción y observaciones)
  async crearCaja(data) {
    try {
      const anio = new Date().getFullYear();
      const { data: numeroCaja, error: fnError } = await supabase
        .rpc('obtener_proximo_numero_caja', { p_ano: anio });
      if (fnError) throw fnError;
      if (!numeroCaja) throw new Error('No se pudo generar el número de caja');

      const { data: cajaCreada, error } = await supabase
        .from('importaciones_cajas')
        .insert([{
          numero_caja: numeroCaja,
          descripcion: data.descripcion?.trim() || null,
          observaciones: data.observaciones?.trim() || null,
          estado: 'abierta'
        }])
        .select()
        .single();
      if (error) throw error;
      return cajaCreada;
    } catch (error) {
      throw error;
    }
  },

  // ✏️ Actualizar caja
  async actualizarCaja(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('importaciones_cajas')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // 🗑️ Eliminar caja (solo si sin items)
  async deleteCaja(id) {
    try {
      const { count, error: countError } = await supabase
        .from('importaciones_items')
        .select('id', { count: 'exact', head: true })
        .eq('caja_id', id);
      if (countError) throw countError;
      if (count > 0) throw new Error(`La caja tiene ${count} item(s) asignados. Desasignálos antes de eliminarla.`);

      const { error } = await supabase
        .from('importaciones_cajas')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  },

  // 📦 Asignar items a una caja
  async asignarItems(cajaId, itemIds) {
    try {
      if (!itemIds || itemIds.length === 0) return;
      const { error } = await supabase
        .from('importaciones_items')
        .update({ caja_id: cajaId })
        .in('id', itemIds);
      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  },

  // 🔓 Desasignar items de una caja
  async desasignarItems(itemIds) {
    try {
      if (!itemIds || itemIds.length === 0) return;
      const { error } = await supabase
        .from('importaciones_items')
        .update({ caja_id: null })
        .in('id', itemIds);
      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  },

  // 🇦🇷 Recepcionar caja: distribuir costos de courier por peso entre TODOS los items de la caja
  async recepcionarCaja(cajaId, datosRecepcion) {
    try {
      const {
        fecha_recepcion,
        peso_sin_caja_kg,
        peso_total_con_caja_kg,
        precio_por_kg_usd,
        pago_courier_usd,
        costo_picking_shipping_usd,
        pesosReales   // { [itemId]: pesoUnitarioReal }
      } = datosRecepcion;

      if (!fecha_recepcion) {
        throw new Error('La fecha de recepción es obligatoria');
      }

      // Obtener caja completa con items
      const caja = await this.getById(cajaId);
      if (!caja) throw new Error('Caja no encontrada');

      const items = caja.importaciones_items || [];
      if (items.length === 0) throw new Error('La caja no tiene items');

      const costoTotalImportacion =
        parseFloat(pago_courier_usd || 0) + parseFloat(costo_picking_shipping_usd || 0);

      // Calcular peso total real de TODOS los items de la caja
      let totalPesoReal = 0;
      const pesosMap = {};
      for (const item of items) {
        const pesoIngresado = parseFloat(pesosReales?.[item.id]);
        const pesoUnitario = !isNaN(pesoIngresado) ? pesoIngresado : parseFloat(item.peso_estimado_unitario_kg || 0);
        pesosMap[item.id] = pesoUnitario;
        totalPesoReal += pesoUnitario * (item.cantidad || 1);
      }

      // Distribuir costos por peso entre TODOS los items de la caja
      for (const item of items) {
        const pesoUnitario = pesosMap[item.id];
        const pesoTotalItem = pesoUnitario * (item.cantidad || 1);
        const proporcionPeso = totalPesoReal > 0 ? pesoTotalItem / totalPesoReal : 0;

        const costoEnvioTotal = proporcionPeso * costoTotalImportacion;
        const costoEnvioUnitario = (item.cantidad || 1) > 0 ? costoEnvioTotal / item.cantidad : 0;

        // Porcentaje financiero del recibo padre
        const porcentajeFinanciero = parseFloat(item.importaciones_recibos?.porcentaje_financiero || 0);
        const costoFinancieroUnitario = parseFloat(item.precio_unitario_usd || 0) * porcentajeFinanciero / 100;

        const costoTotalUnitario = costoEnvioUnitario + costoFinancieroUnitario;
        const costoFinalUnitario = parseFloat(item.precio_unitario_usd || 0) + costoTotalUnitario;

        const { error } = await supabase
          .from('importaciones_items')
          .update({
            peso_real_unitario_kg: parseFloat(pesoUnitario),
            costo_envio_usd: parseFloat(costoEnvioUnitario),
            costo_financiero_usd: parseFloat(costoFinancieroUnitario),
            costos_adicionales_usd: parseFloat(costoTotalUnitario),
            costo_final_unitario_usd: parseFloat(costoFinalUnitario)
          })
          .eq('id', item.id);
        if (error) throw error;
      }

      // Marcar como recepcionado solo los recibos donde TODOS sus items ya tienen caja asignada
      const reciboIds = [...new Set(items.map(i => i.recibo_id).filter(Boolean))];
      for (const reciboId of reciboIds) {
        const { data: todosItems, error: checkError } = await supabase
          .from('importaciones_items')
          .select('id, caja_id')
          .eq('recibo_id', reciboId);
        if (checkError) throw checkError;
        const hayItemsSinCaja = (todosItems || []).some(i => !i.caja_id);
        if (!hayItemsSinCaja) {
          const { error: recibosError } = await supabase
            .from('importaciones_recibos')
            .update({ estado: 'recepcionado', fecha_recepcion_argentina: fecha_recepcion })
            .eq('id', reciboId);
          if (recibosError) throw recibosError;
        }
      }

      // Marcar la caja como recepcionada con datos de recepción
      const { data: cajaActualizada, error: cajaError } = await supabase
        .from('importaciones_cajas')
        .update({
          estado: 'recepcionada',
          fecha_recepcion,
          peso_total_con_caja_kg: parseFloat(peso_total_con_caja_kg || 0),
          peso_sin_caja_kg: peso_sin_caja_kg ? parseFloat(peso_sin_caja_kg) : null,
          precio_por_kg_usd: parseFloat(precio_por_kg_usd || 0),
          pago_courier_usd: parseFloat(pago_courier_usd || 0),
          costo_picking_shipping_usd: parseFloat(costo_picking_shipping_usd || 0),
          costo_total_usd: parseFloat(costoTotalImportacion),
          updated_at: new Date().toISOString()
        })
        .eq('id', cajaId)
        .select()
        .single();
      if (cajaError) throw cajaError;
      if (!cajaActualizada) throw new Error('No se pudo actualizar el ingreso a estado recepcionada');

      return await this.getById(cajaId);
    } catch (error) {
      throw error;
    }
  },

  // 🆕 Crear ingreso completo: caja + asignar items + distribuir costos + marcar courier clientes
  async crearIngreso({ descripcion, observaciones, itemIds, datosRecepcion, pesosReales, courierClienteRecibos }) {
    try {
      let result = null;

      // — Items normales (importacion / courier_empresa) —
      if (itemIds && itemIds.length > 0) {
        // 1. Crear la caja con número automático
        const anio = new Date().getFullYear();
        const { data: numeroCaja, error: fnError } = await supabase
          .rpc('obtener_proximo_numero_caja', { p_ano: anio });
        if (fnError) throw fnError;
        if (!numeroCaja) throw new Error('No se pudo generar el número de ingreso');

        const { data: caja, error: cajaError } = await supabase
          .from('importaciones_cajas')
          .insert([{
            numero_caja: numeroCaja,
            descripcion: descripcion?.trim() || null,
            observaciones: observaciones?.trim() || null,
            estado: 'abierta'
          }])
          .select()
          .single();
        if (cajaError) throw cajaError;

        // 2. Asignar items a la caja (convertir a número porque id es bigint)
        const itemIdsNumericos = itemIds.map(id => Number(id));
        const { error: asignarError } = await supabase
          .from('importaciones_items')
          .update({ caja_id: caja.id })
          .in('id', itemIdsNumericos);
        if (asignarError) throw asignarError;

        // 3. Recepcionar (distribuir costos de courier por peso)
        result = await this.recepcionarCaja(caja.id, { ...datosRecepcion, pesosReales });
      }

      // — Servicios courier a cargo del cliente —
      if (courierClienteRecibos && courierClienteRecibos.length > 0) {
        const fecha = datosRecepcion?.fecha_recepcion || new Date().toISOString().split('T')[0];
        const reciboIds = courierClienteRecibos.map(r => r.reciboId);
        const { error: courierError } = await supabase
          .from('importaciones_recibos')
          .update({
            estado: 'recepcionado',
            fecha_recepcion_argentina: fecha
          })
          .in('id', reciboIds);
        if (courierError) throw courierError;
      }

      return result;
    } catch (error) {
      throw error;
    }
  },

  // 🗑️ Eliminar ingreso: resetea items, revierte recibos si corresponde, borra la caja
  async eliminarIngreso(cajaId) {
    try {
      // Obtener caja con sus items para saber qué recibos afecta
      const caja = await this.getById(cajaId);
      if (!caja) throw new Error('Ingreso no encontrado');

      const reciboIdsAfectados = [...new Set(
        (caja.importaciones_items || []).map(i => i.recibo_id).filter(Boolean)
      )];

      // Resetear todos los items de la caja (costo_financiero_usd NO se toca — se calcula al crear la importación)
      const { error: resetError } = await supabase
        .from('importaciones_items')
        .update({
          caja_id: null,
          peso_real_unitario_kg: null,
          costo_envio_usd: null,
          costos_adicionales_usd: null,
          costo_final_unitario_usd: null
        })
        .eq('caja_id', cajaId);
      if (resetError) throw resetError;

      // Para cada recibo afectado: si ningún item queda asignado a alguna caja → revertir a en_deposito_usa
      for (const reciboId of reciboIdsAfectados) {
        const { data: todosItems, error: checkError } = await supabase
          .from('importaciones_items')
          .select('id, caja_id')
          .eq('recibo_id', reciboId);
        if (checkError) throw checkError;
        const hayItemsAsignados = (todosItems || []).some(i => i.caja_id != null);
        if (!hayItemsAsignados) {
          const { error: revertError } = await supabase
            .from('importaciones_recibos')
            .update({ estado: 'en_deposito_usa', fecha_recepcion_argentina: null })
            .eq('id', reciboId);
          if (revertError) throw revertError;
        }
      }

      // Eliminar la caja
      const { error: deleteError } = await supabase
        .from('importaciones_cajas')
        .delete()
        .eq('id', cajaId);
      if (deleteError) throw deleteError;

      return true;
    } catch (error) {
      throw error;
    }
  }
};

export default cajasService;
