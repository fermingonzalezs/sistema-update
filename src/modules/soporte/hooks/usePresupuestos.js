import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import jsPDF from 'jspdf';

export const presupuestosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('presupuestos_reparacion')
      .select('*, reparaciones:reparacion_id(*)')
      .order('fecha_creacion', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getById(id) {
    // Presupuesto + servicios + repuestos
    const { data, error } = await supabase
      .from('presupuestos_reparacion')
      .select(`*,
        servicios:presupuesto_servicios(*),
        repuestos:presupuesto_repuestos(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  async create(presupuestoData) {
    // Inserta presupuesto + servicios + repuestos en transacción
    const { servicios, repuestos, ...presupuesto } = presupuestoData;
    const result = await supabase.rpc('crear_presupuesto_completo', {
      presupuesto: presupuesto,
      servicios: servicios,
      repuestos: repuestos
    });
    if (result.error) throw result.error;
    return result.data;
  },
  async cambiarEstado(id, estado) {
    const { data, error } = await supabase
      .from('presupuestos_reparacion')
      .update({ estado })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id) {
    const { error } = await supabase
      .from('presupuestos_reparacion')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },
  async generarNumeroPresupuesto() {
    // Ejemplo: PRES-2025-001
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('presupuestos_reparacion')
      .select('numero_presupuesto')
      .ilike('numero_presupuesto', `PRES-${year}-%`);
    if (error) throw error;
    const nums = (data || []).map(p => parseInt(p.numero_presupuesto.split('-')[2], 10)).filter(n => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `PRES-${year}-${String(next).padStart(3, '0')}`;
  },
  calcularTotales(servicios, repuestos, margenGanancia) {
    const subtotalServicios = servicios.reduce((sum, s) => sum + (s.precio_unitario * s.cantidad), 0);
    const repuestosStock = repuestos.filter(r => !r.es_tercero);
    const repuestosTerceros = repuestos.filter(r => r.es_tercero);
    const subtotalRepuestos = repuestosStock.reduce((sum, r) => sum + (r.precio_costo * r.cantidad), 0);
    const subtotalTerceros = repuestosTerceros.reduce((sum, r) => sum + (r.precio_costo * r.cantidad), 0);
    const costoTotal = subtotalServicios + subtotalRepuestos + subtotalTerceros;
    const precioFinal = costoTotal + (costoTotal * margenGanancia / 100);
    return { subtotalServicios, subtotalRepuestos, subtotalTerceros, costoTotal, precioFinal };
  },
  async generarPDF(presupuestoCompleto) {
    // Genera PDF profesional con jsPDF
    const doc = new jsPDF();
    const p = presupuestoCompleto;
    doc.setFontSize(18);
    doc.text('UPDATE TECH - Presupuesto de Reparación', 15, 20);
    doc.setFontSize(12);
    doc.text(`Presupuesto: ${p.numero_presupuesto}`, 15, 30);
    doc.text(`Fecha: ${p.fecha_creacion}`, 120, 30);
    doc.text(`Cliente: ${p.reparaciones.cliente_nombre}`, 15, 40);
    doc.text(`Equipo: ${p.reparaciones.equipo_marca} ${p.reparaciones.equipo_modelo} (${p.reparaciones.equipo_serial})`, 15, 48);
    doc.text(`Problema: ${p.reparaciones.problema_reportado}`, 15, 56);
    doc.text('Servicios:', 15, 68);
    let y = 74;
    doc.setFontSize(10);
    p.servicios.forEach(s => {
      doc.text(`- ${s.nombre_servicio} (${s.cantidad} x $${s.precio_unitario}) = $${s.precio_total}`, 18, y);
      y += 6;
    });
    y += 2;
    doc.setFontSize(12);
    doc.text('Repuestos:', 15, y);
    y += 6;
    doc.setFontSize(10);
    p.repuestos.forEach(r => {
      doc.text(`- ${r.nombre_repuesto} (${r.cantidad} x $${r.precio_costo})${r.es_tercero ? ' [Tercero]' : ''}`, 18, y);
      y += 6;
    });
    y += 2;
    doc.setFontSize(12);
    doc.text('Totales:', 15, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Subtotal servicios: $${p.subtotal_servicios}`, 18, y);
    y += 5;
    doc.text(`Subtotal repuestos: $${p.subtotal_repuestos}`, 18, y);
    y += 5;
    doc.text(`Subtotal repuestos terceros: $${p.subtotal_repuestos_terceros}`, 18, y);
    y += 5;
    doc.text(`Costo total: $${p.costo_total}`, 18, y);
    y += 5;
    doc.text(`Margen de ganancia: ${p.margen_ganancia}%`, 18, y);
    y += 5;
    doc.text(`Precio final: $${p.precio_final}`, 18, y);
    y += 10;
    doc.setFontSize(9);
    doc.text('Validez: ' + (p.validez_dias || 7) + ' días. Sujeto a disponibilidad de repuestos. Consulte condiciones.', 15, y);
    y += 5;
    doc.text('Contacto: info@updatetech.com.ar | Tel: 221-123-4567', 15, y);
    doc.save(`Presupuesto_${p.numero_presupuesto}.pdf`);
  },
  async getEstadisticas() {
    const { data, error } = await supabase.rpc('presupuestos_stats');
    if (error) throw error;
    return data;
  }
};

export function usePresupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPresupuestos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await presupuestosService.getAll();
      setPresupuestos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearPresupuesto = async (presupuestoData) => {
    setLoading(true);
    setError(null);
    try {
      const nuevo = await presupuestosService.create(presupuestoData);
      setPresupuestos(p => [nuevo, ...p]);
      return nuevo;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id, estado) => {
    setLoading(true);
    setError(null);
    try {
      const actualizado = await presupuestosService.cambiarEstado(id, estado);
      setPresupuestos(p => p.map(pr => pr.id === id ? actualizado : pr));
      return actualizado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const eliminarPresupuesto = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await presupuestosService.delete(id);
      setPresupuestos(p => p.filter(pr => pr.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const obtenerPresupuestoCompleto = async (id) => {
    setLoading(true);
    setError(null);
    try {
      return await presupuestosService.getById(id);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generarPDF = async (presupuestoCompleto) => {
    try {
      await presupuestosService.generarPDF(presupuestoCompleto);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchPresupuestos();
  }, [fetchPresupuestos]);

  return {
    presupuestos,
    loading,
    error,
    fetchPresupuestos,
    crearPresupuesto,
    cambiarEstado,
    eliminarPresupuesto,
    obtenerPresupuestoCompleto,
    generarPDF
  };
}
