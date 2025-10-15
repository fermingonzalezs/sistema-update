// src/modules/contabilidad/hooks/useCuentasCorrientes.js
import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';

export const cuentasCorrientesService = {
  // Obtener todos los saldos de cuentas corrientes (query directo)
  async getSaldos() {
    console.log('📡 Obteniendo saldos de cuentas corrientes...');

    // Obtener todos los clientes con sus movimientos
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select(`
        id,
        nombre,
        apellido,
        cuentas_corrientes (
          monto,
          tipo_movimiento,
          fecha_operacion,
          created_at
        )
      `);

    if (clientesError) {
      console.error('❌ Error obteniendo clientes:', clientesError);
      throw clientesError;
    }

    // Procesar saldos en JavaScript
    const saldosCalculados = clientes.map(cliente => {
      const movimientos = cliente.cuentas_corrientes || [];

      // Calcular saldo total
      const saldoTotal = movimientos.reduce((acc, mov) => {
        if (mov.tipo_movimiento === 'debe') {
          return acc + parseFloat(mov.monto);
        } else if (mov.tipo_movimiento === 'haber') {
          return acc - parseFloat(mov.monto);
        }
        return acc;
      }, 0);

      // Obtener último movimiento
      const ultimoMovimiento = movimientos.length > 0
        ? movimientos.reduce((ultimo, mov) => {
            const fechaMov = new Date(mov.fecha_operacion);
            const fechaUltimo = new Date(ultimo.fecha_operacion);
            return fechaMov > fechaUltimo ? mov : ultimo;
          }).fecha_operacion
        : null;

      return {
        cliente_id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        saldo_total: saldoTotal.toFixed(2),
        total_movimientos: movimientos.length,
        ultimo_movimiento: ultimoMovimiento
      };
    })
    // Filtrar solo clientes que tienen movimientos o saldo diferente de 0
    .filter(cliente => cliente.total_movimientos > 0 || parseFloat(cliente.saldo_total) !== 0)
    // Ordenar por saldo total descendente
    .sort((a, b) => parseFloat(b.saldo_total) - parseFloat(a.saldo_total));

    console.log(`✅ ${saldosCalculados.length} saldos calculados`);
    return saldosCalculados;
  },

  // Obtener movimientos de un cliente específico
  async getMovimientosCliente(clienteId) {
    console.log('📡 Obteniendo movimientos del cliente:', clienteId);
    
    const { data, error } = await supabase
      .from('cuentas_corrientes')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error obteniendo movimientos:', error);
      throw error;
    }
    
    console.log(`✅ ${data.length} movimientos obtenidos para cliente ${clienteId}`);
    return data;
  },

  // Obtener estadísticas generales (basado en getSaldos)
  async getEstadisticas() {
    console.log('📊 Calculando estadísticas de cuentas corrientes...');

    // Obtener saldos calculados
    const saldos = await this.getSaldos();

    // Separar clientes por tipo de saldo
    const clientesConDeudaPositiva = saldos.filter(cliente => parseFloat(cliente.saldo_total) > 0); // Nos deben
    const clientesConDeudaNegativa = saldos.filter(cliente => parseFloat(cliente.saldo_total) < 0); // Les debemos
    const clientesSaldados = saldos.filter(cliente => parseFloat(cliente.saldo_total) === 0 && cliente.total_movimientos > 0); // Saldados con movimientos

    const clientesConDeuda = clientesConDeudaPositiva.length;
    const clientesAQuienesDedemos = clientesConDeudaNegativa.length;

    // Calcular totales
    const totalQueNosDeben = clientesConDeudaPositiva.reduce((sum, cliente) => sum + parseFloat(cliente.saldo_total || 0), 0);
    const totalQueDebemos = Math.abs(clientesConDeudaNegativa.reduce((sum, cliente) => sum + parseFloat(cliente.saldo_total || 0), 0));

    const estadisticas = {
      clientesConDeuda, // Clientes con saldo positivo (nos deben)
      clientesAQuienesDedemos, // Clientes con saldo negativo (les debemos)
      clientesSaldados: clientesSaldados.length,
      totalQueNosDeben, // Total que nos deben (saldos positivos)
      totalQueDebemos // Total que debemos (saldos negativos, en positivo)
    };

    console.log('✅ Estadísticas calculadas:', estadisticas);
    return estadisticas;
  },

  // Registrar pago recibido de un cliente
  async registrarPagoRecibido(clienteId, monto, concepto, observaciones = null) {
    console.log('💰 Registrando pago recibido:', { clienteId, monto, concepto });

    const { data, error } = await supabase
      .from('cuentas_corrientes')
      .insert([{
        cliente_id: clienteId,
        tipo_movimiento: 'haber', // El cliente nos paga
        tipo_operacion: 'pago_recibido',
        concepto: concepto || 'Pago recibido',
        monto: monto,
        fecha_operacion: obtenerFechaLocal(),
        estado: 'pendiente',
        comprobante: null,
        observaciones: observaciones,
        created_by: 'Usuario'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error registrando pago:', error);
      throw error;
    }

    console.log('✅ Pago registrado:', data);
    return data;
  },

  // Registrar nueva deuda (alguien nos debe)
  async registrarNuevaDeuda(clienteId, monto, concepto, observaciones = null) {
    console.log('📈 Registrando nueva deuda:', { clienteId, monto, concepto });

    const { data, error } = await supabase
      .from('cuentas_corrientes')
      .insert([{
        cliente_id: clienteId,
        tipo_movimiento: 'debe', // El cliente nos debe
        tipo_operacion: 'cargo_manual',
        concepto: concepto || 'Deuda agregada',
        monto: monto,
        fecha_operacion: obtenerFechaLocal(),
        estado: 'pendiente',
        comprobante: null,
        observaciones: observaciones,
        created_by: 'Usuario'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error registrando deuda:', error);
      throw error;
    }

    console.log('✅ Deuda registrada:', data);
    return data;
  },

  // Registrar pago realizado por Update
  async registrarPagoRealizado(clienteId, monto, concepto, observaciones = null) {
    console.log('💸 Registrando pago realizado por Update:', { clienteId, monto, concepto });

    const { data, error } = await supabase
      .from('cuentas_corrientes')
      .insert([{
        cliente_id: clienteId,
        tipo_movimiento: 'haber', // Update paga (reduce deuda que Update tiene)
        tipo_operacion: 'pago_recibido', // Update realiza un pago
        concepto: concepto || 'Pago realizado por Update',
        monto: monto,
        fecha_operacion: obtenerFechaLocal(),
        estado: 'pagado',
        comprobante: null,
        observaciones: observaciones,
        created_by: 'Usuario'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error registrando pago de Update:', error);
      throw error;
    }

    console.log('✅ Pago de Update registrado:', data);
    return data;
  },

  // Registrar deuda que Update toma
  async registrarDeudaUpdate(clienteId, monto, concepto, observaciones = null) {
    console.log('📈 Registrando deuda que Update toma:', { clienteId, monto, concepto });

    const { data, error } = await supabase
      .from('cuentas_corrientes')
      .insert([{
        cliente_id: clienteId,
        tipo_movimiento: 'haber', // Update debe (tiene deuda con el proveedor)
        tipo_operacion: 'cargo_manual', // Deuda contraída
        concepto: concepto || 'Deuda contraída por Update',
        monto: monto,
        fecha_operacion: obtenerFechaLocal(),
        estado: 'pendiente',
        comprobante: null,
        observaciones: observaciones,
        created_by: 'Usuario'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error registrando deuda de Update:', error);
      throw error;
    }

    console.log('✅ Deuda de Update registrada:', data);
    return data;
  },

  // Obtener TODOS los movimientos con datos del cliente
  async getTodosMovimientos() {
    console.log('📡 Obteniendo todos los movimientos...');

    const { data, error } = await supabase
      .from('cuentas_corrientes')
      .select(`
        *,
        clientes:cliente_id (
          nombre,
          apellido
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo todos los movimientos:', error);
      throw error;
    }

    // Transformar datos para que coincidan con la estructura esperada
    const movimientosFormateados = data.map(movimiento => ({
      ...movimiento,
      nombre_cliente: movimiento.clientes?.nombre || 'N/A',
      apellido_cliente: movimiento.clientes?.apellido || 'N/A'
    }));

    console.log(`✅ ${movimientosFormateados.length} movimientos obtenidos`);
    return movimientosFormateados;
  },

  // Eliminar movimiento de cuenta corriente
  async eliminarMovimiento(movimientoId) {
    console.log('🗑️ Eliminando movimiento:', movimientoId);

    const { data, error } = await supabase
      .from('cuentas_corrientes')
      .delete()
      .eq('id', movimientoId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error eliminando movimiento:', error);
      throw error;
    }

    console.log('✅ Movimiento eliminado:', data);
    return data;
  },

  // Editar movimiento de cuenta corriente
  async editarMovimiento(movimientoId, nuevosDatos) {
    console.log('✏️ Editando movimiento:', movimientoId, nuevosDatos);

    // Solo permitir editar campos seguros
    const camposEditables = {
      monto: nuevosDatos.monto,
      concepto: nuevosDatos.concepto,
      observaciones: nuevosDatos.observaciones,
      fecha_operacion: nuevosDatos.fecha_operacion
    };

    // Limpiar campos undefined
    Object.keys(camposEditables).forEach(key => {
      if (camposEditables[key] === undefined) {
        delete camposEditables[key];
      }
    });

    const { data, error } = await supabase
      .from('cuentas_corrientes')
      .update(camposEditables)
      .eq('id', movimientoId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error editando movimiento:', error);
      throw error;
    }

    console.log('✅ Movimiento editado:', data);
    return data;
  }
};

// Hook para usar cuentas corrientes
export function useCuentasCorrientes() {
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSaldos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cuentasCorrientesService.getSaldos();
      setSaldos(data);
    } catch (err) {
      console.error('Error en useCuentasCorrientes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMovimientosCliente = useCallback(async (clienteId) => {
    try {
      setError(null);
      return await cuentasCorrientesService.getMovimientosCliente(clienteId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getEstadisticas = useCallback(async () => {
    try {
      setError(null);
      return await cuentasCorrientesService.getEstadisticas();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const registrarPagoRecibido = useCallback(async (clienteId, monto, concepto, observaciones) => {
    try {
      setError(null);
      const pago = await cuentasCorrientesService.registrarPagoRecibido(clienteId, monto, concepto, observaciones);
      // Refrescar saldos después del pago
      await fetchSaldos();
      return pago;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchSaldos]);

  const registrarNuevaDeuda = useCallback(async (clienteId, monto, concepto, observaciones) => {
    try {
      setError(null);
      const deuda = await cuentasCorrientesService.registrarNuevaDeuda(clienteId, monto, concepto, observaciones);
      // Refrescar saldos después de agregar deuda
      await fetchSaldos();
      return deuda;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchSaldos]);

  const registrarPagoRealizado = useCallback(async (clienteId, monto, concepto, observaciones) => {
    try {
      setError(null);
      const pago = await cuentasCorrientesService.registrarPagoRealizado(clienteId, monto, concepto, observaciones);
      // Refrescar saldos después del pago
      await fetchSaldos();
      return pago;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchSaldos]);

  const registrarDeudaUpdate = useCallback(async (clienteId, monto, concepto, observaciones) => {
    try {
      setError(null);
      const deuda = await cuentasCorrientesService.registrarDeudaUpdate(clienteId, monto, concepto, observaciones);
      // Refrescar saldos después de agregar deuda de Update
      await fetchSaldos();
      return deuda;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchSaldos]);

  const fetchTodosMovimientos = useCallback(async () => {
    try {
      setError(null);
      return await cuentasCorrientesService.getTodosMovimientos();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const eliminarMovimiento = useCallback(async (movimientoId) => {
    try {
      setError(null);
      const resultado = await cuentasCorrientesService.eliminarMovimiento(movimientoId);
      // Refrescar saldos después de eliminar
      await fetchSaldos();
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchSaldos]);

  const editarMovimiento = useCallback(async (movimientoId, nuevosDatos) => {
    try {
      setError(null);
      const resultado = await cuentasCorrientesService.editarMovimiento(movimientoId, nuevosDatos);
      // Refrescar saldos después de editar
      await fetchSaldos();
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchSaldos]);

  return {
    saldos,
    loading,
    error,
    fetchSaldos,
    fetchMovimientosCliente,
    fetchTodosMovimientos,
    getEstadisticas,
    registrarPagoRecibido,
    registrarNuevaDeuda,
    registrarPagoRealizado,
    registrarDeudaUpdate,
    eliminarMovimiento,
    editarMovimiento
  };
}