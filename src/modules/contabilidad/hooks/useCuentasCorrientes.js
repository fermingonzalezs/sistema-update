// src/modules/contabilidad/hooks/useCuentasCorrientes.js
import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export const cuentasCorrientesService = {
  // Obtener todos los saldos de cuentas corrientes
  async getSaldos() {
    console.log('📡 Obteniendo saldos de cuentas corrientes...');
    
    const { data, error } = await supabase
      .from('saldos_cuentas_corrientes')
      .select('*')
      .order('saldo_total', { ascending: false });
    
    if (error) {
      console.error('❌ Error obteniendo saldos:', error);
      throw error;
    }
    
    console.log(`✅ ${data.length} saldos obtenidos`);
    return data;
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

  // Obtener estadísticas generales
  async getEstadisticas() {
    console.log('📊 Calculando estadísticas de cuentas corrientes...');
    
    const { data, error } = await supabase
      .from('saldos_cuentas_corrientes')
      .select('saldo_total, total_movimientos');
    
    if (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
    
    const totalClientes = data.length;
    const clientesConDeuda = data.filter(cliente => parseFloat(cliente.saldo_total) > 0).length;
    const totalDeuda = data.reduce((sum, cliente) => sum + parseFloat(cliente.saldo_total || 0), 0);
    const totalMovimientos = data.reduce((sum, cliente) => sum + parseInt(cliente.total_movimientos || 0), 0);
    
    // Calcular clientes saldados: aquellos que tienen movimientos pero saldo = 0
    const { data: clientesSaldadosData, error: saldadosError } = await supabase
      .from('saldos_cuentas_corrientes')
      .select('cliente_id')
      .eq('saldo_total', 0)
      .gt('total_movimientos', 0); // Que tengan al menos un movimiento

    if (saldadosError) {
      console.error('Error obteniendo clientes saldados:', saldadosError);
    }

    const clientesSaldados = clientesSaldadosData?.length || 0;

    const estadisticas = {
      totalClientes,
      clientesConDeuda,
      clientesSaldados,
      totalDeuda,
      totalMovimientos
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
        fecha_operacion: new Date().toISOString().split('T')[0],
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
        fecha_operacion: new Date().toISOString().split('T')[0],
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
        fecha_operacion: new Date().toISOString().split('T')[0],
        estado: 'completado',
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
        fecha_operacion: new Date().toISOString().split('T')[0],
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

  return {
    saldos,
    loading,
    error,
    fetchSaldos,
    fetchMovimientosCliente,
    getEstadisticas,
    registrarPagoRecibido,
    registrarNuevaDeuda,
    registrarPagoRealizado,
    registrarDeudaUpdate
  };
}