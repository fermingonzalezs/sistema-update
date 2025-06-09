// src/lib/cuentasCorrientes.js
import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export const useCuentasCorrientes = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 📋 Obtener todos los saldos de clientes
  const fetchSaldos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Obteniendo saldos de cuentas corrientes...');
      
      const { data, error: fetchError } = await supabase
        .from('saldos_cuentas_corrientes')
        .select('*')
        .order('saldo_total', { ascending: false });

      if (fetchError) throw fetchError;

      console.log('✅ Saldos obtenidos:', data?.length || 0);
      setSaldos(data || []);
      
    } catch (err) {
      console.error('❌ Error obteniendo saldos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 📝 Obtener movimientos de un cliente específico
  const fetchMovimientosCliente = useCallback(async (clienteId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Obteniendo movimientos del cliente:', clienteId);
      
      const { data, error: fetchError } = await supabase
        .rpc('get_movimientos_cliente', { cliente_int: clienteId });

      if (fetchError) throw fetchError;

      console.log('✅ Movimientos obtenidos:', data?.length || 0);
      setMovimientos(data || []);
      return data || [];
      
    } catch (err) {
      console.error('❌ Error obteniendo movimientos:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 💰 Registrar venta en cuenta corriente
  const registrarVentaFiado = useCallback(async (ventaData) => {
    try {
      console.log('🔄 Registrando venta fiado...', ventaData);
      
      const movimientoData = {
        cliente_id: ventaData.cliente_id,
        tipo_movimiento: 'debe', // El cliente nos debe
        tipo_operacion: 'venta_fiado',
        concepto: `Venta productos - ${ventaData.numeroTransaccion}`,
        monto: ventaData.total,
        fecha_operacion: new Date().toISOString().split('T')[0],
        referencia_venta_id: ventaData.venta_id,
        comprobante: ventaData.numeroTransaccion,
        observaciones: ventaData.observaciones || null,
        created_by: ventaData.vendedor || 'Sistema'
      };

      const { data, error: insertError } = await supabase
        .from('cuentas_corrientes')
        .insert([movimientoData])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('✅ Venta fiado registrada:', data);
      
      // Actualizar saldos
      await fetchSaldos();
      
      return data;
      
    } catch (err) {
      console.error('❌ Error registrando venta fiado:', err);
      throw err;
    }
  }, [fetchSaldos]);

  // 💳 Registrar pago recibido
  const registrarPagoRecibido = useCallback(async (pagoData) => {
    try {
      console.log('🔄 Registrando pago recibido...', pagoData);
      
      const movimientoData = {
        cliente_id: pagoData.cliente_id,
        tipo_movimiento: 'haber', // Reducimos lo que nos debe
        tipo_operacion: 'pago_recibido',
        concepto: pagoData.concepto || 'Pago recibido',
        monto: pagoData.monto,
        fecha_operacion: pagoData.fecha || new Date().toISOString().split('T')[0],
        comprobante: pagoData.comprobante || null,
        observaciones: pagoData.observaciones || null,
        created_by: pagoData.created_by || 'Sistema'
      };

      const { data, error: insertError } = await supabase
        .from('cuentas_corrientes')
        .insert([movimientoData])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('✅ Pago registrado:', data);
      
      // Actualizar saldos
      await fetchSaldos();
      
      return data;
      
    } catch (err) {
      console.error('❌ Error registrando pago:', err);
      throw err;
    }
  }, [fetchSaldos]);

  // ➕ Registrar cargo manual
  const registrarCargoManual = useCallback(async (cargoData) => {
    try {
      console.log('🔄 Registrando cargo manual...', cargoData);
      
      const movimientoData = {
        cliente_id: cargoData.cliente_id,
        tipo_movimiento: 'debe', // El cliente nos debe más
        tipo_operacion: 'cargo_manual',
        concepto: cargoData.concepto,
        monto: cargoData.monto,
        fecha_operacion: cargoData.fecha || new Date().toISOString().split('T')[0],
        comprobante: cargoData.comprobante || null,
        observaciones: cargoData.observaciones || null,
        created_by: cargoData.created_by || 'Sistema'
      };

      const { data, error: insertError } = await supabase
        .from('cuentas_corrientes')
        .insert([movimientoData])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('✅ Cargo registrado:', data);
      
      // Actualizar saldos
      await fetchSaldos();
      
      return data;
      
    } catch (err) {
      console.error('❌ Error registrando cargo:', err);
      throw err;
    }
  }, [fetchSaldos]);

  // 🗑️ Eliminar movimiento
  const eliminarMovimiento = useCallback(async (movimientoId) => {
    try {
      console.log('🔄 Eliminando movimiento:', movimientoId);
      
      const { error: deleteError } = await supabase
        .from('cuentas_corrientes')
        .delete()
        .eq('id', movimientoId);

      if (deleteError) throw deleteError;

      console.log('✅ Movimiento eliminado');
      
      // Actualizar saldos
      await fetchSaldos();
      
    } catch (err) {
      console.error('❌ Error eliminando movimiento:', err);
      throw err;
    }
  }, [fetchSaldos]);

  // 📊 Obtener estadísticas generales
  const getEstadisticas = useCallback(async () => {
    try {
      const { data: stats, error: statsError } = await supabase
        .from('saldos_cuentas_corrientes')
        .select('saldo_total');

      if (statsError) throw statsError;

      const totalPorCobrar = stats
        .filter(s => s.saldo_total > 0)
        .reduce((sum, s) => sum + parseFloat(s.saldo_total || 0), 0);

      const totalPorPagar = Math.abs(stats
        .filter(s => s.saldo_total < 0)
        .reduce((sum, s) => sum + parseFloat(s.saldo_total || 0), 0));

      const clientesConDeuda = stats.filter(s => s.saldo_total !== 0).length;

      return {
        totalPorCobrar,
        totalPorPagar,
        saldoNeto: totalPorCobrar - totalPorPagar,
        clientesConDeuda,
        totalClientes: stats.length
      };

    } catch (err) {
      console.error('❌ Error obteniendo estadísticas:', err);
      return {
        totalPorCobrar: 0,
        totalPorPagar: 0,
        saldoNeto: 0,
        clientesConDeuda: 0,
        totalClientes: 0
      };
    }
  }, []);

  return {
    // Estados
    movimientos,
    saldos,
    loading,
    error,

    // Funciones principales
    fetchSaldos,
    fetchMovimientosCliente,
    registrarVentaFiado,
    registrarPagoRecibido,
    registrarCargoManual,
    eliminarMovimiento,
    getEstadisticas
  };
};