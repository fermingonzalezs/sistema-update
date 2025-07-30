import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Minus, FileText, Filter, RefreshCw, 
  Eye, AlertCircle, ArrowUpDown, Calculator, Trash2, Save, X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useMovimientosRepuestosEquipos } from '../hooks/useMovimientosRepuestosEquipos';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { formatearMonto } from '../../../shared/utils/formatters';

// Componente para el modal de nuevo movimiento
const ModalNuevoMovimiento = ({ onSubmit, onCancel, repuestos }) => {
  const [formData, setFormData] = useState({
    serial_equipo: '',
    motivo: '',
    descripcion: '',
    entradas: Array.from({ length: 5 }, () => ({ repuesto_id: '', cantidad: 0 })),
    salidas: Array.from({ length: 5 }, () => ({ repuesto_id: '', cantidad: 0 }))
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.serial_equipo.trim()) {
      alert('El serial del equipo es obligatorio');
      return;
    }
    if (!formData.motivo) {
      alert('El motivo es obligatorio');
      return;
    }

    // Filtrar entradas y salidas que tengan datos válidos
    const entradasValidas = formData.entradas.filter(e => e.repuesto_id && e.cantidad > 0);
    const salidasValidas = formData.salidas.filter(s => s.repuesto_id && s.cantidad > 0);

    if (entradasValidas.length === 0 && salidasValidas.length === 0) {
      alert('Debe agregar al menos una entrada o salida');
      return;
    }

    onSubmit({
      ...formData,
      entradas: entradasValidas,
      salidas: salidasValidas
    });
  };

  const actualizarEntrada = (index, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      entradas: prev.entradas.map((entrada, i) => 
        i === index ? { ...entrada, [campo]: valor } : entrada
      )
    }));
  };

  const actualizarSalida = (index, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      salidas: prev.salidas.map((salida, i) => 
        i === index ? { ...salida, [campo]: valor } : salida
      )
    }));
  };

  const limpiarEntrada = (index) => {
    actualizarEntrada(index, 'repuesto_id', '');
    actualizarEntrada(index, 'cantidad', 0);
  };

  const limpiarSalida = (index) => {
    actualizarSalida(index, 'repuesto_id', '');
    actualizarSalida(index, 'cantidad', 0);
  };

  const calcularTotalEntradas = () => {
    return formData.entradas.reduce((total, entrada) => {
      if (entrada.repuesto_id && entrada.cantidad > 0) {
        const repuesto = repuestos.find(r => r.id.toString() === entrada.repuesto_id);
        return total + (repuesto ? repuesto.precio_compra_usd * entrada.cantidad : 0);
      }
      return total;
    }, 0);
  };

  const calcularTotalSalidas = () => {
    return formData.salidas.reduce((total, salida) => {
      if (salida.repuesto_id && salida.cantidad > 0) {
        const repuesto = repuestos.find(r => r.id.toString() === salida.repuesto_id);
        return total + (repuesto ? repuesto.precio_compra_usd * salida.cantidad : 0);
      }
      return total;
    }, 0);
  };

  const totalEntradas = calcularTotalEntradas();
  const totalSalidas = calcularTotalSalidas();
  const resultadoFinal = totalEntradas - totalSalidas;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 bg-slate-800 text-white sticky top-0">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <ArrowUpDown size={24} />
            Nuevo Movimiento de Repuestos
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Información del equipo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Serial del Equipo *
              </label>
              <input
                type="text"
                value={formData.serial_equipo}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_equipo: e.target.value }))}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
                placeholder="Ej: DL123456"
                required
              />
            </div>
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
                <option value="UPGRADE">UPGRADE</option>
                <option value="REPARACION">REPARACION</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
                placeholder="Descripción del trabajo..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entradas */}
            <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
              <h4 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                <Plus size={18} />
                Entradas (Repuestos que se agregaron)
              </h4>
              <div className="space-y-3">
                {formData.entradas.map((entrada, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500 w-4">{index + 1}</span>
                    <select
                      value={entrada.repuesto_id}
                      onChange={(e) => actualizarEntrada(index, 'repuesto_id', e.target.value)}
                      className="w-64 border border-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">Seleccionar repuesto...</option>
                      {repuestos.map(repuesto => (
                        <option key={repuesto.id} value={repuesto.id}>
                          {repuesto.nombre_producto} - ${repuesto.precio_compra_usd?.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={entrada.cantidad}
                      onChange={(e) => actualizarEntrada(index, 'cantidad', parseInt(e.target.value) || 0)}
                      className="w-20 border border-slate-200 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-600"
                      placeholder="Cant"
                    />
                    <button
                      type="button"
                      onClick={() => limpiarEntrada(index)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200">
                <div className="text-sm font-medium text-emerald-800">
                  Total Entradas: ${totalEntradas.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Salidas */}
            <div className="bg-slate-50 border border-slate-200 rounded p-4">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Minus size={18} />
                Salidas (Repuestos que se quitaron)
              </h4>
              <div className="space-y-3">
                {formData.salidas.map((salida, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500 w-4">{index + 1}</span>
                    <select
                      value={salida.repuesto_id}
                      onChange={(e) => actualizarSalida(index, 'repuesto_id', e.target.value)}
                      className="w-64 border border-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">Seleccionar repuesto...</option>
                      {repuestos.map(repuesto => (
                        <option key={repuesto.id} value={repuesto.id}>
                          {repuesto.nombre_producto} - ${repuesto.precio_compra_usd?.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={salida.cantidad}
                      onChange={(e) => actualizarSalida(index, 'cantidad', parseInt(e.target.value) || 0)}
                      className="w-20 border border-slate-200 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-600"
                      placeholder="Cant"
                    />
                    <button
                      type="button"
                      onClick={() => limpiarSalida(index)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="text-sm font-medium text-slate-800">
                  Total Salidas: ${totalSalidas.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Resultado final */}
          <div className="mt-6 bg-white border border-slate-200 rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-800">Resultado Final:</span>
              <span className={`text-2xl font-bold ${
                resultadoFinal >= 0 ? 'text-emerald-600' : 'text-slate-600'
              }`}>
                ${resultadoFinal.toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-slate-600 mt-1">
              (Entradas - Salidas = ${totalEntradas.toFixed(2)} - ${totalSalidas.toFixed(2)})
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Guardar Movimiento
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-600 text-white px-4 py-3 rounded font-medium hover:bg-slate-700 transition-colors"
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
    crearMovimiento,
    obtenerEstadisticas
  } = useMovimientosRepuestosEquipos();

  const [repuestos, setRepuestos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtros, setFiltros] = useState({
    serial_equipo: '',
    motivo: '',
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
        .order('nombre_producto');
      setRepuestos(repuestosData || []);

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
      console.log('🔄 Enviando datos del movimiento:', data);
      const resultado = await crearMovimiento(data);
      console.log('✅ Movimiento creado con éxito:', resultado);
      setMostrarModal(false);
      alert('✅ Movimiento registrado exitosamente');
      cargarDatos(); // Recargar datos
    } catch (err) {
      console.error('❌ Error completo creando movimiento:', err);
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
      serial_equipo: '',
      motivo: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    await obtenerMovimientos();
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR');
  };

  const parsearMovimientos = (jsonString) => {
    try {
      return JSON.parse(jsonString) || [];
    } catch {
      return [];
    }
  };

  return (
    <div className="">
      {/* Header obligatorio según estándares */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ArrowUpDown className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Movimientos de Repuestos</h2>
                <p className="text-slate-300 mt-1">Gestión de cambios en equipos por upgrade o reparación</p>
              </div>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nuevo Movimiento
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="bg-white rounded border border-slate-200 mb-4">
          <div className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Estadísticas del Mes</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Tarjeta
                icon={Package}
                titulo="Total Movimientos"
                valor={estadisticas.totalMovimientos}
              />
              <Tarjeta
                icon={Plus}
                titulo="Total Entradas"
                valor={formatearMonto(estadisticas.totalEntradas, 'USD')}
              />
              <Tarjeta
                icon={Minus}
                titulo="Total Salidas"
                valor={formatearMonto(estadisticas.totalSalidas, 'USD')}
              />
              <Tarjeta
                icon={Calculator}
                titulo="Resultado Neto"
                valor={formatearMonto(estadisticas.resultadoTotal, 'USD')}
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        {/* Filtros */}
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Serial</label>
              <input
                type="text"
                value={filtros.serial_equipo}
                onChange={(e) => setFiltros(prev => ({ ...prev, serial_equipo: e.target.value }))}
                placeholder="Buscar por serial..."
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Motivo</label>
              <select
                value={filtros.motivo}
                onChange={(e) => setFiltros(prev => ({ ...prev, motivo: e.target.value }))}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">Todos</option>
                <option value="UPGRADE">UPGRADE</option>
                <option value="REPARACION">REPARACION</option>
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
                    <th className="text-left py-3 px-4 font-medium text-white">Serial</th>
                    <th className="text-center py-3 px-4 font-medium text-white">Motivo</th>
                    <th className="text-left py-3 px-4 font-medium text-white">Descripción</th>
                    <th className="text-right py-3 px-4 font-medium text-white">Entradas</th>
                    <th className="text-right py-3 px-4 font-medium text-white">Salidas</th>
                    <th className="text-right py-3 px-4 font-medium text-white">Resultado</th>
                    <th className="text-center py-3 px-4 font-medium text-white">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((movimiento) => {
                    const entradas = parsearMovimientos(movimiento.entradas);
                    const salidas = parsearMovimientos(movimiento.salidas);
                    
                    return (
                      <tr key={movimiento.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm">
                          {formatearFecha(movimiento.fecha_movimiento)}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-slate-900">
                          {movimiento.serial_equipo}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            movimiento.motivo === 'UPGRADE' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {movimiento.motivo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-800 max-w-xs truncate">
                          {movimiento.descripcion || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <div className="text-emerald-600 font-medium">
                            ${movimiento.total_entradas?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {entradas.length} items
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <div className="text-slate-600 font-medium">
                            ${movimiento.total_salidas?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {salidas.length} items
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className={`font-bold ${
                            movimiento.resultado_final >= 0 ? 'text-emerald-600' : 'text-slate-600'
                          }`}>
                            ${movimiento.resultado_final?.toFixed(2) || '0.00'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-center text-slate-800">
                          {movimiento.usuario}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ArrowUpDown size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">No hay movimientos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <ModalNuevoMovimiento
          onSubmit={handleSubmitMovimiento}
          onCancel={() => setMostrarModal(false)}
          repuestos={repuestos}
        />
      )}
    </div>
  );
};

export default MovimientosRepuestosSection;