// src/modules/contabilidad/services/cuentasAuxiliaresService.js
import { supabase } from '../../../lib/supabase';

// 📊 SERVICE: Operaciones de cuentas auxiliares con tabla relacional
export const cuentasAuxiliaresService = {
  // 📋 Obtener todas las cuentas auxiliares con información del plan de cuentas
  async getAll() {
    try {
      console.log('📡 Obteniendo cuentas auxiliares...');

      // Obtener las cuentas auxiliares con info del plan
      const { data: cuentasData, error: cuentasError } = await supabase
        .from('cuentas_auxiliares')
        .select(`
          *,
          plan_cuentas:cuenta_id(
            codigo,
            nombre,
            tipo
          )
        `)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (cuentasError) throw cuentasError;

      // Para cada cuenta, obtener sus asientos y calcular totales
      const cuentasConDatos = await Promise.all(
        cuentasData.map(async (cuenta) => {
          // Obtener asientos auxiliares de esta cuenta
          const { data: asientos, error: asientosError } = await supabase
            .from('asientos_auxiliares')
            .select('*')
            .eq('cuenta_auxiliar_id', cuenta.id)
            .order('fecha', { ascending: false });

          if (asientosError) {
            console.error('Error obteniendo asientos:', asientosError);
          }

          const asientosArray = asientos || [];

          // Calcular totales de ingresos y egresos
          const totalIngresos = asientosArray
            .filter(a => a.tipo === 'ingreso')
            .reduce((sum, a) => sum + parseFloat(a.monto || 0), 0);

          const totalEgresos = asientosArray
            .filter(a => a.tipo === 'egreso')
            .reduce((sum, a) => sum + parseFloat(a.monto || 0), 0);

          const totalAuxiliar = totalIngresos - totalEgresos;

          // Obtener saldo contable de movimientos_contables
          let saldoContable = 0;
          if (cuenta.cuenta_id) {
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

          const diferencia = saldoContable - totalAuxiliar;

          return {
            id: cuenta.id,
            cuenta_id: cuenta.cuenta_id,
            cuenta: {
              codigo: cuenta.plan_cuentas?.codigo || '',
              nombre: cuenta.plan_cuentas?.nombre || '',
              tipo: cuenta.plan_cuentas?.tipo || '',
              saldo_contable: saldoContable
            },
            nombre: cuenta.nombre,
            descripcion: cuenta.descripcion,
            total_ingresos: totalIngresos,
            total_egresos: totalEgresos,
            total_auxiliar: totalAuxiliar,
            diferencia: diferencia,
            items_count: asientosArray.length,
            ultima_actualizacion: cuenta.updated_at?.split('T')[0] || cuenta.created_at?.split('T')[0],
            estado: Math.abs(diferencia) < 0.01 ? 'balanceado' : 'desbalanceado',
            created_at: cuenta.created_at,
            updated_at: cuenta.updated_at
          };
        })
      );

      console.log(`✅ ${cuentasConDatos.length} cuentas auxiliares obtenidas`);
      return cuentasConDatos;
    } catch (error) {
      console.error('❌ Error obteniendo cuentas auxiliares:', error);
      throw error;
    }
  },

  // 👤 Obtener cuenta auxiliar por ID con todos sus asientos (items)
  async getById(id) {
    try {
      console.log('👤 Obteniendo cuenta auxiliar ID:', id);

      // Obtener cuenta auxiliar
      const { data: cuenta, error: cuentaError } = await supabase
        .from('cuentas_auxiliares')
        .select(`
          *,
          plan_cuentas:cuenta_id(
            codigo,
            nombre,
            tipo
          )
        `)
        .eq('id', id)
        .single();

      if (cuentaError) throw cuentaError;

      // Obtener todos los asientos auxiliares de esta cuenta
      const { data: asientos, error: asientosError } = await supabase
        .from('asientos_auxiliares')
        .select('*')
        .eq('cuenta_auxiliar_id', id)
        .order('fecha', { ascending: false });

      if (asientosError) throw asientosError;

      // Obtener saldo contable
      let saldoContable = 0;
      if (cuenta.cuenta_id) {
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

      // Transformar asientos a formato "items" para el frontend
      const items = (asientos || []).map(asiento => ({
        id: asiento.id,
        fecha: asiento.fecha,
        descripcion: asiento.descripcion,
        tipo: asiento.tipo,
        monto: parseFloat(asiento.monto),
        referencia: asiento.referencia,
        usuario: asiento.usuario,
        created_at: asiento.created_at,
        updated_at: asiento.updated_at
      }));

      console.log('✅ Cuenta auxiliar obtenida:', cuenta.nombre, `con ${items.length} items`);

      return {
        ...cuenta,
        cuenta: {
          codigo: cuenta.plan_cuentas?.codigo || '',
          nombre: cuenta.plan_cuentas?.nombre || '',
          tipo: cuenta.plan_cuentas?.tipo || '',
          saldo_contable: saldoContable
        },
        items // Array de asientos transformados como "items"
      };
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
          descripcion: cuentaData.descripcion?.trim() || null
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
          descripcion: cuentaData.descripcion?.trim() || null
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

  // 📦 Agregar asiento (item) a cuenta auxiliar
  async addItem(cuentaId, itemData) {
    try {
      console.log('📦 Agregando asiento a cuenta auxiliar:', cuentaId);

      // Validaciones
      if (!itemData.fecha || !itemData.descripcion || !itemData.tipo || !itemData.monto) {
        throw new Error('Todos los campos son obligatorios: fecha, descripcion, tipo, monto');
      }

      if (!['ingreso', 'egreso'].includes(itemData.tipo)) {
        throw new Error('El tipo debe ser "ingreso" o "egreso"');
      }

      if (parseFloat(itemData.monto) <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      // Insertar asiento auxiliar en la tabla
      const { data, error } = await supabase
        .from('asientos_auxiliares')
        .insert([{
          cuenta_auxiliar_id: cuentaId,
          fecha: itemData.fecha,
          descripcion: itemData.descripcion.trim(),
          tipo: itemData.tipo,
          monto: parseFloat(itemData.monto),
          referencia: itemData.referencia?.trim() || null,
          usuario: itemData.usuario || 'sistema'
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Asiento agregado exitosamente');

      // Retornar la cuenta completa actualizada
      return await this.getById(cuentaId);
    } catch (error) {
      console.error('❌ Error agregando asiento:', error);
      throw error;
    }
  },

  // ✏️ Actualizar asiento (item) específico
  async updateItem(cuentaId, itemId, itemData) {
    try {
      console.log('✏️ Actualizando asiento:', itemId);

      const updateData = {};

      if (itemData.fecha) updateData.fecha = itemData.fecha;
      if (itemData.descripcion) updateData.descripcion = itemData.descripcion.trim();
      if (itemData.tipo && ['ingreso', 'egreso'].includes(itemData.tipo)) {
        updateData.tipo = itemData.tipo;
      }
      if (itemData.monto && parseFloat(itemData.monto) > 0) {
        updateData.monto = parseFloat(itemData.monto);
      }
      if (itemData.referencia !== undefined) {
        updateData.referencia = itemData.referencia?.trim() || null;
      }

      const { data, error } = await supabase
        .from('asientos_auxiliares')
        .update(updateData)
        .eq('id', itemId)
        .eq('cuenta_auxiliar_id', cuentaId) // Seguridad: verificar que pertenece a la cuenta
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Asiento actualizado exitosamente');

      // Retornar la cuenta completa actualizada
      return await this.getById(cuentaId);
    } catch (error) {
      console.error('❌ Error actualizando asiento:', error);
      throw error;
    }
  },

  // 🗑️ Eliminar asiento (item) de cuenta auxiliar
  async removeItem(cuentaId, itemId) {
    try {
      console.log('🗑️ Eliminando asiento:', itemId);

      const { error } = await supabase
        .from('asientos_auxiliares')
        .delete()
        .eq('id', itemId)
        .eq('cuenta_auxiliar_id', cuentaId); // Seguridad: verificar que pertenece a la cuenta

      if (error) throw error;

      console.log('✅ Asiento eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando asiento:', error);
      throw error;
    }
  },

  // 📊 Obtener estadísticas generales
  async getEstadisticas() {
    try {
      console.log('📊 Calculando estadísticas de cuentas auxiliares...');

      // Contar cuentas activas
      const { data: cuentas, error: errorCuentas } = await supabase
        .from('cuentas_auxiliares')
        .select('id')
        .eq('activo', true);

      if (errorCuentas) throw errorCuentas;

      const totalCuentas = cuentas.length;

      // Contar asientos por cuenta
      const { data: asientos, error: errorAsientos } = await supabase
        .from('asientos_auxiliares')
        .select('cuenta_auxiliar_id, monto, tipo');

      if (errorAsientos) throw errorAsientos;

      // Agrupar por cuenta
      const asientosPorCuenta = {};
      let totalGeneral = 0;

      asientos.forEach(asiento => {
        if (!asientosPorCuenta[asiento.cuenta_auxiliar_id]) {
          asientosPorCuenta[asiento.cuenta_auxiliar_id] = [];
        }
        asientosPorCuenta[asiento.cuenta_auxiliar_id].push(asiento);

        // Sumar al total general
        const monto = parseFloat(asiento.monto || 0);
        totalGeneral += asiento.tipo === 'ingreso' ? monto : -monto;
      });

      const cuentasConItems = Object.keys(asientosPorCuenta).length;
      const cuentasSinItems = totalCuentas - cuentasConItems;

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
