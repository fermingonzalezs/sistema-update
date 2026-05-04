import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export const useCuentasAPagar = () => {
  const [servicios, setServicios] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServicios = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('servicios_sucursal')
      .select('*')
      .order('sucursal')
      .order('nombre');
    if (!err) setServicios(data || []);
  }, []);

  const fetchCuentas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('cuentas_a_pagar')
        .select('*, servicios_sucursal(*)')
        .order('fecha_vencimiento', { ascending: true });
      if (err) throw err;
      setCuentas(data || []);
    } catch (err) {
      console.error('Error al cargar cuentas a pagar:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addServicio = async (data) => {
    try {
      const { data: nuevo, error: err } = await supabase
        .from('servicios_sucursal')
        .insert([data])
        .select()
        .single();
      if (err) throw err;
      setServicios(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      return { success: true, data: nuevo };
    } catch (err) {
      console.error('Error al crear servicio:', err);
      return { success: false, error: err.message };
    }
  };

  const updateServicio = async (id, data) => {
    try {
      const { error: err } = await supabase
        .from('servicios_sucursal')
        .update(data)
        .eq('id', id);
      if (err) throw err;
      setServicios(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      return { success: true };
    } catch (err) {
      console.error('Error al actualizar servicio:', err);
      return { success: false, error: err.message };
    }
  };

  const addCuenta = async (data) => {
    try {
      const { data: nueva, error: err } = await supabase
        .from('cuentas_a_pagar')
        .insert([data])
        .select('*, servicios_sucursal(*)')
        .single();
      if (err) throw err;
      setCuentas(prev => [...prev, nueva]);
      return { success: true, data: nueva };
    } catch (err) {
      console.error('Error al crear cuenta:', err);
      return { success: false, error: err.message };
    }
  };

  const updateCuenta = async (id, data) => {
    try {
      const { error: err } = await supabase
        .from('cuentas_a_pagar')
        .update(data)
        .eq('id', id);
      if (err) throw err;
      setCuentas(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      return { success: true };
    } catch (err) {
      console.error('Error al actualizar cuenta:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteCuenta = async (id) => {
    try {
      const { error: err } = await supabase
        .from('cuentas_a_pagar')
        .delete()
        .eq('id', id);
      if (err) throw err;
      setCuentas(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error al eliminar cuenta:', err);
      return { success: false, error: err.message };
    }
  };

  const marcarPagada = async (id, { fecha_pago, metodo_pago, cuenta_contable, cotizacion_pago, monto_usd }) => {
    try {
      const updateData = { estado: 'pagada', fecha_pago, metodo_pago, cuenta_contable };
      if (cotizacion_pago) updateData.cotizacion_pago = cotizacion_pago;
      if (monto_usd !== undefined) updateData.monto_usd = Math.round(monto_usd * 100) / 100;
      const { error: err } = await supabase
        .from('cuentas_a_pagar')
        .update(updateData)
        .eq('id', id);
      if (err) throw err;
      setCuentas(prev => prev.map(c => c.id === id ? { ...c, ...updateData } : c));
      return { success: true };
    } catch (err) {
      console.error('Error al marcar pagada:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchServicios();
    fetchCuentas();
  }, [fetchServicios, fetchCuentas]);

  return {
    servicios,
    cuentas,
    loading,
    error,
    fetchServicios,
    fetchCuentas,
    addServicio,
    updateServicio,
    addCuenta,
    updateCuenta,
    deleteCuenta,
    marcarPagada
  };
};
