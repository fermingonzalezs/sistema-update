import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, ArrowDown, Package, Search, Calendar, 
  Plus, Minus, FileText, Filter, RefreshCw, 
  TrendingUp, TrendingDown, Eye, AlertCircle 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useMovimientosRepuestos } from '../hooks/useMovimientosRepuestos';

// Componente para formulario de entrada/salida
const FormularioMovimiento = ({ tipo, onSubmit, onCancel, repuestos, reparaciones }) => {
  const [formData, setFormData] = useState({
    repuesto_id: '',
    cantidad: '',
    motivo: '',
    observaciones: '',
    reparacion_id: '' // Solo para salidas
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.repuesto_id || !formData.cantidad || !formData.motivo) {
      alert('Complete todos los campos obligatorios');
      return;
    }

    if (parseInt(formData.cantidad) <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    onSubmit({
      ...formData,
      cantidad: parseInt(formData.cantidad),
      reparacion_id: formData.reparacion_id || null
    });
  };

  const repuestoSeleccionado = repuestos.find(r => r.id.toString() === formData.repuesto_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded border border-slate-200 max-w-md w-full m-4">
        <div className="p-4 rounded-t text-white bg-slate-800">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {tipo === 'entrada' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
            {tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Selección de repuesto */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">
              Repuesto *
            </label>
            <select
              value={formData.repuesto_id}
              onChange={(e) => setFormData(prev => ({ ...prev, repuesto_id: e.target.value }))}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              required
            >
              <option value="">Seleccionar repuesto...</option>
              {repuestos.map(repuesto => (
                <option key={repuesto.id} value={repuesto.id}>
                  {repuesto.item} ({repuesto.categoria}) - Stock: {repuesto.cantidad}
                </option>
              ))}
            </select>
            {repuestoSeleccionado && tipo === 'salida' && (
              <p className="text-xs text-slate-500 mt-1">
                Stock disponible: {repuestoSeleccionado.cantidad} unidades
              </p>
            )}
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">
              Cantidad *
            </label>
            <input
              type="number"
              min="1"
              max={tipo === 'salida' && repuestoSeleccionado ? repuestoSeleccionado.cantidad : undefined}
              value={formData.cantidad}
              onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              placeholder="Ingrese cantidad"
              required
            />
          </div>

          {/* Reparación (solo para salidas) */}
          {tipo === 'salida' && (
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Reparación (opcional)
              </label>
              <select
                value={formData.reparacion_id}
                onChange={(e) => setFormData(prev => ({ ...prev, reparacion_id: e.target.value }))}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">No asociar a reparación</option>
                {reparaciones.map(reparacion => (
                  <option key={reparacion.id} value={reparacion.id}>
                    {reparacion.numero} - {reparacion.cliente_nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">
              Motivo *
            </label>
            <select
              value={formData.motivo}
              onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              required
            >
              <option value="">Seleccionar motivo...</option>
              {tipo === 'entrada' ? (
                <>
                  <option value="Compra de inventario">Compra de inventario</option>
                  <option value="Devolución de cliente">Devolución de cliente</option>
                  <option value="Ajuste de inventario">Ajuste de inventario</option>
                  <option value="Garantía del proveedor">Garantía del proveedor</option>
                  <option value="Otro">Otro</option>
                </>
              ) : (
                <>
                  <option value="Uso en reparación">Uso en reparación</option>
                  <option value="Venta directa">Venta directa</option>
                  <option value="Repuesto defectuoso">Repuesto defectuoso</option>
                  <option value="Ajuste de inventario">Ajuste de inventario</option>
                  <option value="Otro">Otro</option>
                </>
              )}
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              rows="2"
              placeholder="Comentarios adicionales..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 text-white px-4 py-2 rounded font-medium bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              {tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-600 text-white px-4 py-2 rounded font-medium hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principal
const MovimientosRepuestosSection = () => {
  const {
    movimientos,
    loading,
    error,
    obtenerMovimientos,
    registrarEntrada,
    registrarSalida,
    obtenerEstadisticas
  } = useMovimientosRepuestos();

  const [repuestos, setRepuestos] = useState([]);
  const [reparaciones, setReparaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(null); // 'entrada' | 'salida' | null
  const [filtros, setFiltros] = useState({
    tipo_movimiento: '',
    repuesto_id: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar repuestos disponibles
      const { data: repuestosData } = await supabase
        .from('repuestos')
        .select('*')
        .eq('disponible', true)
        .order('item');
      setRepuestos(repuestosData || []);

      // Cargar reparaciones activas
      const { data: reparacionesData } = await supabase
        .from('reparaciones')
        .select('id, numero, cliente_nombre')
        .in('estado', ['ingresado', 'diagnosticando', 'presupuestado', 'aprobado', 'reparando'])
        .order('created_at', { ascending: false })
        .limit(50);
      setReparaciones(reparacionesData || []);

      // Cargar movimientos
      await obtenerMovimientos();

      // Cargar estadísticas del mes actual
      const fechaInicio = new Date();
      fechaInicio.setDate(1);
      const stats = await obtenerEstadisticas(fechaInicio.toISOString(), null);
      setEstadisticas(stats);

    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  };

  const handleSubmitMovimiento = async (data) => {
    try {
      if (mostrarFormulario === 'entrada') {
        await registrarEntrada(data);
        alert('✅ Entrada registrada exitosamente');
      } else if (mostrarFormulario === 'salida') {
        await registrarSalida(data);
        alert('✅ Salida registrada exitosamente');
      }
      
      setMostrarFormulario(null);
      cargarDatos(); // Recargar datos
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const aplicarFiltros = async () => {
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(([key, value]) => value !== '')
    );
    await obtenerMovimientos(filtrosLimpios);
  };

  const limpiarFiltros = async () => {
    setFiltros({
      tipo_movimiento: '',
      repuesto_id: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    await obtenerMovimientos();
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR');
  };

  const obtenerNumeroReparacion = (reparacionId) => {
    if (!reparacionId) return null;
    const reparacion = reparaciones.find(r => r.id === reparacionId);
    return reparacion ? reparacion.numero : `#${reparacionId}`;
  };

  return (
    <div className="">
      {/* Header obligatorio según estándares */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Movimientos de Repuestos</h2>
                <p className="text-slate-300 mt-1">Gestión de entradas y salidas de inventario</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMostrarFormulario('entrada')}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
              >
                <ArrowUp size={16} />
                Entrada
              </button>
              <button
                onClick={() => setMostrarFormulario('salida')}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
              >
                <ArrowDown size={16} />
                Salida
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded border border-slate-200 overflow-hidden">

        {/* Estadísticas */}
        {estadisticas && (
          <div className="bg-slate-50 p-6 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Estadísticas del Mes</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Movimientos</p>
                    <p className="text-2xl font-bold text-slate-800">{estadisticas.totalMovimientos}</p>
                  </div>
                  <Package className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <div className="bg-white p-4 rounded border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Entradas</p>
                    <p className="text-2xl font-bold text-emerald-600">{estadisticas.entradas}</p>
                  </div>
                  <ArrowUp className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <div className="bg-white p-4 rounded border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Salidas</p>
                    <p className="text-2xl font-bold text-slate-600">{estadisticas.salidas}</p>
                  </div>
                  <ArrowDown className="w-8 h-8 text-slate-600" />
                </div>
              </div>
              <div className="bg-white p-4 rounded border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Unidades Entrada</p>
                    <p className="text-2xl font-bold text-emerald-600">{estadisticas.cantidadEntradas}</p>
                  </div>
                  <Plus className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <div className="bg-white p-4 rounded border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Unidades Salida</p>
                    <p className="text-2xl font-bold text-slate-600">{estadisticas.cantidadSalidas}</p>
                  </div>
                  <Minus className="w-8 h-8 text-slate-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Tipo</label>
              <select
                value={filtros.tipo_movimiento}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipo_movimiento: e.target.value }))}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="salida">Salidas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Repuesto</label>
              <select
                value={filtros.repuesto_id}
                onChange={(e) => setFiltros(prev => ({ ...prev, repuesto_id: e.target.value }))}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">Todos</option>
                {repuestos.map(repuesto => (
                  <option key={repuesto.id} value={repuesto.id}>
                    {repuesto.item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Desde</label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_desde: e.target.value }))}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_hasta: e.target.value }))}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={aplicarFiltros}
                className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-700 flex items-center justify-center gap-1 transition-colors"
              >
                <Filter size={16} />
                Filtrar
              </button>
              <button
                onClick={limpiarFiltros}
                className="bg-slate-600 text-white px-3 py-2 rounded hover:bg-slate-700 transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Lista de movimientos */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <span className="ml-3 text-slate-600">Cargando movimientos...</span>
            </div>
          ) : error ? (
            <div className="bg-slate-50 border-l-4 border-slate-400 p-4">
              <span className="text-slate-800">{error}</span>
            </div>
          ) : movimientos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border border-slate-200 rounded">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-white">Fecha</th>
                    <th className="text-center py-3 px-4 font-medium text-white">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-white">Repuesto</th>
                    <th className="text-center py-3 px-4 font-medium text-white">Cantidad</th>
                    <th className="text-center py-3 px-4 font-medium text-white">Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-white">Motivo</th>
                    <th className="text-left py-3 px-4 font-medium text-white">Reparación</th>
                    <th className="text-left py-3 px-4 font-medium text-white">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((movimiento) => (
                    <tr key={movimiento.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm">
                        {formatearFecha(movimiento.fecha_movimiento)}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1 ${
                          movimiento.tipo_movimiento === 'entrada' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {movimiento.tipo_movimiento === 'entrada' ? (
                            <ArrowUp size={12} />
                          ) : (
                            <ArrowDown size={12} />
                          )}
                          {movimiento.tipo_movimiento}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-sm text-slate-900">
                            {movimiento.repuestos?.item || 'Repuesto eliminado'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {movimiento.repuestos?.categoria}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 font-medium">
                        <span className={movimiento.tipo_movimiento === 'entrada' ? 'text-emerald-600' : 'text-slate-600'}>
                          {movimiento.tipo_movimiento === 'entrada' ? '+' : '-'}{movimiento.cantidad}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 text-sm">
                        <div>
                          <span className="text-slate-500">{movimiento.stock_anterior}</span>
                          <span className="mx-1">→</span>
                          <span className="font-medium text-slate-800">{movimiento.stock_nuevo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800">{movimiento.motivo}</td>
                      <td className="py-3 px-4 text-sm">
                        {movimiento.reparacion_id ? (
                          <span className="text-emerald-600">
                            {obtenerNumeroReparacion(movimiento.reparacion_id)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800">{movimiento.usuario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No hay movimientos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Formulario modal */}
      {mostrarFormulario && (
        <FormularioMovimiento
          tipo={mostrarFormulario}
          onSubmit={handleSubmitMovimiento}
          onCancel={() => setMostrarFormulario(null)}
          repuestos={repuestos}
          reparaciones={reparaciones}
        />
      )}
    </div>
  );
};

export default MovimientosRepuestosSection;