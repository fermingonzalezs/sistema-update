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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className={`p-4 rounded-t-lg text-white ${
          tipo === 'entrada' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {tipo === 'entrada' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
            {tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Selección de repuesto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repuesto *
            </label>
            <select
              value={formData.repuesto_id}
              onChange={(e) => setFormData(prev => ({ ...prev, repuesto_id: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
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
              <p className="text-xs text-gray-500 mt-1">
                Stock disponible: {repuestoSeleccionado.cantidad} unidades
              </p>
            )}
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad *
            </label>
            <input
              type="number"
              min="1"
              max={tipo === 'salida' && repuestoSeleccionado ? repuestoSeleccionado.cantidad : undefined}
              value={formData.cantidad}
              onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Ingrese cantidad"
              required
            />
          </div>

          {/* Reparación (solo para salidas) */}
          {tipo === 'salida' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reparación (opcional)
              </label>
              <select
                value={formData.reparacion_id}
                onChange={(e) => setFormData(prev => ({ ...prev, reparacion_id: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo *
            </label>
            <select
              value={formData.motivo}
              onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows="2"
              placeholder="Comentarios adicionales..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className={`flex-1 text-white px-4 py-2 rounded font-medium ${
                tipo === 'entrada' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-400"
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

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Package size={28} />
              <div>
                <h2 className="text-4xl font-bold">Movimientos de Repuestos</h2>
                <p className="text-blue-100 mt-1">Gestión de entradas y salidas de inventario</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMostrarFormulario('entrada')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
              >
                <ArrowUp size={16} />
                Entrada
              </button>
              <button
                onClick={() => setMostrarFormulario('salida')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium"
              >
                <ArrowDown size={16} />
                Salida
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="bg-gray-50 p-4 border-b">
            <h3 className="font-semibold text-gray-800 mb-3">Estadísticas del Mes</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{estadisticas.totalMovimientos}</div>
                <div className="text-sm text-gray-600">Total Movimientos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{estadisticas.entradas}</div>
                <div className="text-sm text-gray-600">Entradas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{estadisticas.salidas}</div>
                <div className="text-sm text-gray-600">Salidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{estadisticas.cantidadEntradas}</div>
                <div className="text-sm text-gray-600">Unidades Entrada</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{estadisticas.cantidadSalidas}</div>
                <div className="text-sm text-gray-600">Unidades Salida</div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={filtros.tipo_movimiento}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipo_movimiento: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="salida">Salidas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repuesto</label>
              <select
                value={filtros.repuesto_id}
                onChange={(e) => setFiltros(prev => ({ ...prev, repuesto_id: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_desde: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_hasta: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={aplicarFiltros}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-1"
              >
                <Filter size={16} />
                Filtrar
              </button>
              <button
                onClick={limpiarFiltros}
                className="bg-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-400"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando movimientos...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <span className="text-red-800">{error}</span>
            </div>
          ) : movimientos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Repuesto</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Cantidad</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Motivo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reparación</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((movimiento) => (
                    <tr key={movimiento.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        {formatearFecha(movimiento.fecha_movimiento)}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1 ${
                          movimiento.tipo_movimiento === 'entrada' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
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
                          <div className="font-medium text-sm">
                            {movimiento.repuestos?.item || 'Repuesto eliminado'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {movimiento.repuestos?.categoria}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 font-medium">
                        <span className={movimiento.tipo_movimiento === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                          {movimiento.tipo_movimiento === 'entrada' ? '+' : '-'}{movimiento.cantidad}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 text-sm">
                        <div>
                          <span className="text-gray-500">{movimiento.stock_anterior}</span>
                          <span className="mx-1">→</span>
                          <span className="font-medium">{movimiento.stock_nuevo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{movimiento.motivo}</td>
                      <td className="py-3 px-4 text-sm">
                        {movimiento.reparaciones ? (
                          <span className="text-blue-600">
                            {movimiento.reparaciones.numero}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{movimiento.usuario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No hay movimientos registrados</p>
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