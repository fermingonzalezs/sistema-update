// src/modules/contabilidad/services/cuentasAuxiliaresService.js
import { supabase } from '../../../lib/supabase';

// 📊 SERVICE: Operaciones de cuentas auxiliares
export const cuentasAuxiliaresService = {
  // 📋 Obtener todas las cuentas auxiliares con información del plan de cuentas
  async getAll() {
    try {
      console.log('📡 Obteniendo cuentas auxiliares...');

      // Primero obtener las cuentas auxiliares con info del plan
      const { data: cuentasData, error: cuentasError } = await supabase
        .from('cuentas_auxiliares')
        .select(`
          *,
          plan_cuentas:cuenta_id(
            codigo,
            nombre
          )
        `)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (cuentasError) throw cuentasError;

      // Obtener saldos contables para cada cuenta
      const cuentasConSaldos = await Promise.all(
        cuentasData.map(async (cuenta) => {
          let saldoContable = 0;

          if (cuenta.cuenta_id) {
            // Calcular saldo sumando movimientos contables
            const { data: movimientos, error: movError } = await supabase
              .from('movimientos_contables')
              .select('debe, haber')
              .eq('cuenta_id', cuenta.cuenta_id);

            if (!movError && movimientos) {
              saldoContable = movimientos.reduce((total, mov) => {
                return total + (parseFloat(mov.debe || 0) - parseFloat(mov.haber || 0));
              }, 0);
            }
          }

          const totalAuxiliar = parseFloat(cuenta.total_calculado || 0);
          const diferencia = saldoContable - totalAuxiliar;

          return {
            id: cuenta.id,
            cuenta: {
              codigo: cuenta.plan_cuentas?.codigo || '',
              nombre: cuenta.plan_cuentas?.nombre || '',
              saldo_contable: saldoContable
            },
            nombre: cuenta.nombre,
            descripcion: cuenta.descripcion,
            total_auxiliar: totalAuxiliar,
            diferencia: diferencia,
            items_count: Array.isArray(cuenta.items) ? cuenta.items.length : 0,
            ultima_actualizacion: cuenta.updated_at?.split('T')[0] || cuenta.created_at?.split('T')[0],
            // Calcular estado basado en diferencia
            estado: Math.abs(diferencia) < 0.01 ? 'balanceado' : 'desbalanceado',
            created_at: cuenta.created_at,
            updated_at: cuenta.updated_at
          };
        })
      );

      console.log(`✅ ${cuentasConSaldos.length} cuentas auxiliares obtenidas`);
      return cuentasConSaldos;
    } catch (error) {
      console.error('❌ Error obteniendo cuentas auxiliares:', error);
      throw error;
    }
  },

  // 👤 Obtener cuenta auxiliar por ID con todos sus items
  async getById(id) {
    try {
      console.log('👤 Obteniendo cuenta auxiliar ID:', id);

      const { data, error } = await supabase
        .from('cuentas_auxiliares')
        .select(`
          *,
          plan_cuentas:cuenta_id(
            codigo,
            nombre
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      console.log('✅ Cuenta auxiliar obtenida:', data.nombre);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo cuenta auxiliar:', error);
      throw error;
    }
  },

  // 🆕 Crear nueva cuenta auxiliar
  async create(cuentaData) {
    try {
      console.log('💾 Creando cuenta auxiliar:', cuentaData.nombre);

      // Validaciones básicas
      if (!cuentaData.cuenta_id || !cuentaData.nombre) {
        throw new Error('Cuenta ID y nombre son obligatorios');
      }

      const { data, error } = await supabase
        .from('cuentas_auxiliares')
        .insert([{
          cuenta_id: cuentaData.cuenta_id,
          nombre: cuentaData.nombre.trim(),
          descripcion: cuentaData.descripcion?.trim() || null,
          items: cuentaData.items || []
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Cuenta auxiliar creada exitosamente:', data.nombre);
      return data;
    } catch (error) {
      console.error('❌ Error creando cuenta auxiliar:', error);

      // Manejar errores específicos
      if (error.code === '23505') {
        throw new Error('Ya existe una cuenta auxiliar para esta cuenta contable');
      }

      throw error;
    }
  },

  // ✏️ Actualizar cuenta auxiliar existente
  async update(id, cuentaData) {
    try {
      console.log(`🔄 Actualizando cuenta auxiliar ID: ${id}`);

      const { data, error } = await supabase
        .from('cuentas_auxiliares')
        .update({
          nombre: cuentaData.nombre?.trim(),
          descripcion: cuentaData.descripcion?.trim() || null,
          items: cuentaData.items || []
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Cuenta auxiliar actualizada:', data.nombre);
      return data;
    } catch (error) {
      console.error('❌ Error actualizando cuenta auxiliar:', error);
      throw error;
    }
  },

  // 🗑️ Eliminar cuenta auxiliar (soft delete)
  async delete(id) {
    try {
      console.log(`🗑️ Eliminando cuenta auxiliar ID: ${id}`);

      const { data, error } = await supabase
        .from('cuentas_auxiliares')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Cuenta auxiliar eliminada (marcada como inactiva)');
      return data;
    } catch (error) {
      console.error('❌ Error eliminando cuenta auxiliar:', error);
      throw error;
    }
  },

  // 📦 Agregar item a cuenta auxiliar
  async addItem(cuentaId, item) {
    try {
      console.log('📦 Agregando item a cuenta auxiliar:', cuentaId);

      // Generar ID único para el item
      const itemWithId = {
        ...item,
        id: Date.now() + Math.random().toString(36).substring(2, 11),
        fecha_ingreso: item.fecha_ingreso || new Date().toISOString().split('T')[0],
        valor_total: parseFloat(item.cantidad || 1) * parseFloat(item.valor_unitario || 0)
      };

      // Obtener cuenta actual
      const { data: cuentaActual, error: errorGet } = await supabase
        .from('cuentas_auxiliares')
        .select('items')
        .eq('id', cuentaId)
        .single();

      if (errorGet) throw errorGet;

      // Agregar nuevo item al array
      const itemsActualizados = [...(cuentaActual.items || []), itemWithId];

      // Actualizar cuenta con nuevos items
      const { data, error } = await supabase
        .from('cuentas_auxiliares')
        .update({ items: itemsActualizados })
        .eq('id', cuentaId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Item agregado exitosamente');
      return data;
    } catch (error) {
      console.error('❌ Error agregando item:', error);
      throw error;
    }
  },

  // ✏️ Actualizar item específico en cuenta auxiliar
  async updateItem(cuentaId, itemId, itemData) {
    try {
      console.log('✏️ Actualizando item:', itemId);

      // Obtener cuenta actual
      const { data: cuentaActual, error: errorGet } = await supabase
        .from('cuentas_auxiliares')
        .select('items')
        .eq('id', cuentaId)
        .single();

      if (errorGet) throw errorGet;

      // Encontrar y actualizar el item
      const itemsActualizados = (cuentaActual.items || []).map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            ...itemData,
            valor_total: parseFloat(itemData.cantidad || item.cantidad || 1) * parseFloat(itemData.valor_unitario || item.valor_unitario || 0)
          };
        }
        return item;
      });

      // Actualizar cuenta con items modificados
      const { data, error } = await supabase
        .from('cuentas_auxiliares')
        .update({ items: itemsActualizados })
        .eq('id', cuentaId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Item actualizado exitosamente');
      return data;
    } catch (error) {
      console.error('❌ Error actualizando item:', error);
      throw error;
    }
  },

  // 🗑️ Eliminar item de cuenta auxiliar
  async removeItem(cuentaId, itemId) {
    try {
      console.log('🗑️ Eliminando item:', itemId);

      // Obtener cuenta actual
      const { data: cuentaActual, error: errorGet } = await supabase
        .from('cuentas_auxiliares')
        .select('items')
        .eq('id', cuentaId)
        .single();

      if (errorGet) throw errorGet;

      // Filtrar el item a eliminar
      const itemsActualizados = (cuentaActual.items || []).filter(item => item.id !== itemId);

      // Actualizar cuenta sin el item eliminado
      const { data, error } = await supabase
        .from('cuentas_auxiliares')
        .update({ items: itemsActualizados })
        .eq('id', cuentaId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Item eliminado exitosamente');
      return data;
    } catch (error) {
      console.error('❌ Error eliminando item:', error);
      throw error;
    }
  },

  // 📊 Obtener estadísticas generales
  async getEstadisticas() {
    try {
      console.log('📊 Calculando estadísticas de cuentas auxiliares...');

      const { data, error } = await supabase
        .from('cuentas_auxiliares')
        .select('total_calculado, items')
        .eq('activo', true);

      if (error) throw error;

      const totalCuentas = data.length;
      const cuentasConItems = data.filter(cuenta => Array.isArray(cuenta.items) && cuenta.items.length > 0).length;
      const cuentasSinItems = totalCuentas - cuentasConItems;
      const totalGeneral = data.reduce((sum, cuenta) => sum + parseFloat(cuenta.total_calculado || 0), 0);

      const estadisticas = {
        totalCuentas,
        cuentasConItems,
        cuentasSinItems,
        totalGeneral
      };

      console.log('✅ Estadísticas calculadas:', estadisticas);
      return estadisticas;
    } catch (error) {
      console.error('❌ Error calculando estadísticas:', error);
      throw error;
    }
  }
};