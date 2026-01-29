// src/modules/contabilidad/components/CuentasAuxiliaresSection.jsx
import React, { useState } from 'react';
import {
  Calculator,
  Plus,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Download,
  BarChart3,
  DollarSign,
  Minus,
  TrendingUp,
  TrendingDown,
  CheckCircle
} from 'lucide-react';
import { formatearMonto, obtenerFechaLocal } from '../../../shared/utils/formatters';
import { useCuentasAuxiliares } from '../hooks/useCuentasAuxiliares';
import { supabase } from '../../../lib/supabase';

const CuentasAuxiliaresSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);

  // Hook para datos reales
  const {
    cuentas,
    loading,
    error,
    getCuentaById,
    createCuenta,
    deleteCuenta,
    addItem
  } = useCuentasAuxiliares();

  // Estado para modal de nueva cuenta auxiliar
  const [showNuevaCuenta, setShowNuevaCuenta] = useState(false);
  const [planCuentas, setPlanCuentas] = useState([]);
  const [loadingPlanCuentas, setLoadingPlanCuentas] = useState(false);

  // Cargar plan de cuentas para el selector
  const cargarPlanCuentas = async () => {
    try {
      setLoadingPlanCuentas(true);
      const { data, error } = await supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('activa', true)
        .eq('imputable', true) // Solo cuentas imputables pueden tener auxiliares
        .order('codigo');

      if (error) throw error;
      setPlanCuentas(data);
    } catch (error) {
      console.error('Error cargando plan de cuentas:', error);
    } finally {
      setLoadingPlanCuentas(false);
    }
  };

  // Cargar plan de cuentas al abrir modal
  const handleNuevaCuenta = () => {
    setShowNuevaCuenta(true);
    cargarPlanCuentas();
  };

  // Calcular totales de movimientos (items)
  const calcularTotalesMovimientos = (movimientos) => {
    if (!movimientos || !Array.isArray(movimientos)) {
      return { ingresos: 0, egresos: 0, saldo: 0 };
    }
    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);
    const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);
    const saldo = ingresos - egresos;
    return { ingresos, egresos, saldo };
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'balanceado':
        return 'text-emerald-600 bg-emerald-100';
      case 'desbalanceado':
        return 'text-slate-800 bg-slate-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'balanceado':
        return <CheckCircle className="w-4 h-4" />;
      case 'desbalanceado':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getDiferenciaColor = (diferencia) => {
    if (diferencia === 0) return 'text-emerald-600';
    if (diferencia > 0) return 'text-emerald-600';
    return 'text-slate-800';
  };

  const formatFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleVerDetalles = async (cuenta) => {
    try {
      // Si ya está seleccionada, la deselecciona
      if (selectedCuenta && selectedCuenta.id === cuenta.id) {
        setSelectedCuenta(null);
        return;
      }

      const cuentaCompleta = await getCuentaById(cuenta.id);
      setSelectedCuenta(cuentaCompleta);
    } catch (error) {
      console.error('Error obteniendo detalles de cuenta:', error);
    }
  };

  const handleEliminarCuenta = async (cuenta) => {
    const confirmacion = window.confirm(
      `¿Está seguro que desea eliminar la cuenta auxiliar "${cuenta.nombre || cuenta.cuenta?.nombre}"?\n\n` +
      `Esta acción eliminará:\n` +
      `- La cuenta auxiliar\n` +
      `- Todos sus movimientos (${cuenta.items_count || 0} movimientos)\n\n` +
      `Esta acción NO se puede deshacer.`
    );

    if (!confirmacion) return;

    try {
      await deleteCuenta(cuenta.id);

      // Si la cuenta eliminada estaba seleccionada, deseleccionarla
      if (selectedCuenta && selectedCuenta.id === cuenta.id) {
        setSelectedCuenta(null);
      }

      alert('✅ Cuenta auxiliar eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      alert('❌ Error al eliminar la cuenta: ' + error.message);
    }
  };

  // Solo mostrar mensaje si no hay cuentas
  const mostrarMensajeVacio = cuentas.length === 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded border border-slate-200 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando cuentas auxiliares...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded border border-slate-200 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Error al cargar datos</h3>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-800 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Calculator size={28} />
            <div>
              <h2 className="text-2xl font-semibold">Cuentas Auxiliares</h2>
              <p className="text-gray-300 mt-1">Control de movimientos por cuenta auxiliar</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleNuevaCuenta}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nueva Cuenta Auxiliar
            </button>
          </div>
        </div>
      </div>


      {/* Filtros */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar Cuenta
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cuenta, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600">
              <option value="">Todos los estados</option>
              <option value="balanceado">Balanceado</option>
              <option value="desbalanceado">Desbalanceado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600">
              <option value="">Todos los tipos</option>
              <option value="activo">Activos</option>
              <option value="pasivo">Pasivos</option>
              <option value="resultado">Resultados</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm">
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Cuentas Auxiliares */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Cuentas con Movimientos Auxiliares</h3>
          </div>
        </div>

        {mostrarMensajeVacio ? (
          <div className="p-8 text-center">
            <Calculator className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay cuentas auxiliares</h3>
            <p className="text-slate-600 mb-4">
              Comienza agregando cuentas del plan de cuentas para llevar un control de movimientos detallado.
            </p>
            <button
              onClick={handleNuevaCuenta}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded flex items-center space-x-2 mx-auto transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Primera Cuenta</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Cuenta
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Saldo Contable
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Total Ingresos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Total Egresos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Saldo Auxiliar
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Diferencia
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Movimientos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cuentas.map((cuenta, index) => {
                  return (
                    <tr key={cuenta.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 text-sm text-slate-800">
                        <div>
                          <div className="font-medium">{cuenta.cuenta?.codigo || 'Sin código'}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {cuenta.cuenta?.nombre || cuenta.nombre || 'Sin nombre'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-center">
                        {formatearMonto(cuenta.cuenta?.saldo_contable || 0, 'USD')}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="font-medium text-slate-800">
                          {formatearMonto(cuenta.total_ingresos || 0, 'USD')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="font-medium text-slate-800">
                          {formatearMonto(cuenta.total_egresos || 0, 'USD')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="font-medium text-slate-800">
                          {formatearMonto(cuenta.total_auxiliar || 0, 'USD')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`font-medium ${Math.abs(cuenta.diferencia || 0) < 0.01
                            ? 'text-emerald-600'
                            : cuenta.diferencia < 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}>
                          {Math.abs(cuenta.diferencia || 0) < 0.01
                            ? 'Balanceado'
                            : `${cuenta.diferencia < 0 ? '+' : '-'} ${formatearMonto(Math.abs(cuenta.diferencia || 0), 'USD')}`
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-center">
                        {cuenta.items_count || 0} movimientos
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleVerDetalles(cuenta)}
                            className={`transition-colors ${selectedCuenta && selectedCuenta.id === cuenta.id
                                ? 'text-emerald-800 bg-emerald-100 p-1 rounded'
                                : 'text-emerald-600 hover:text-emerald-800'
                              }`}
                            title={selectedCuenta && selectedCuenta.id === cuenta.id ? 'Ocultar movimientos' : 'Ver movimientos'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarCuenta(cuenta)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Eliminar cuenta y todos sus movimientos"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumen expandible de cuenta seleccionada */}
      {selectedCuenta && (
        <div className="bg-white rounded border border-slate-200 mt-4">
          {/* Header del resumen */}
          <div className="p-4 bg-slate-800 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Resumen de Movimientos</h3>
                <p className="text-slate-300 text-sm">
                  {selectedCuenta.plan_cuentas?.codigo || selectedCuenta.cuenta?.codigo || 'Sin código'} - {selectedCuenta.plan_cuentas?.nombre || selectedCuenta.cuenta?.nombre || selectedCuenta.nombre || 'Sin nombre'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCuenta(null)}
                className="text-slate-300 hover:text-white p-2 rounded hover:bg-slate-700 transition-colors"
                title="Cerrar resumen"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tarjetas de totales */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-slate-600" />
                  <div className="text-sm text-slate-600">Saldo Contable</div>
                </div>
                <div className="text-xl font-semibold text-slate-800 mt-2">
                  {formatearMonto(selectedCuenta.cuenta?.saldo_contable || 0, 'USD')}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-slate-600" />
                  <div className="text-sm text-slate-600">Total Ingresos</div>
                </div>
                <div className="text-xl font-semibold text-slate-800 mt-2">
                  {formatearMonto(calcularTotalesMovimientos(selectedCuenta.items).ingresos, 'USD')}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-slate-600" />
                  <div className="text-sm text-slate-600">Total Egresos</div>
                </div>
                <div className="text-xl font-semibold text-slate-800 mt-2">
                  {formatearMonto(calcularTotalesMovimientos(selectedCuenta.items).egresos, 'USD')}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-slate-600" />
                  <div className="text-sm text-slate-600">Saldo Auxiliar</div>
                </div>
                <div className="text-xl font-semibold text-slate-800 mt-2">
                  {formatearMonto(calcularTotalesMovimientos(selectedCuenta.items).saldo, 'USD')}
                </div>
              </div>
            </div>

            {/* Filtros de movimientos */}
            <div className="bg-gray-50 p-4 rounded border border-slate-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600">
                    <option value="">Todos</option>
                    <option value="ingreso">Solo Ingresos</option>
                    <option value="egreso">Solo Egresos</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm">
                    Filtrar
                  </button>
                  <button
                    onClick={() => setShowNuevoMovimiento(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center space-x-2 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla de movimientos estilo libro diario - Ingresos y Egresos separados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna Egresos */}
              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="bg-slate-800 text-white p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-5 h-5" />
                    <h4 className="font-semibold text-lg">EGRESOS</h4>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700 text-white sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Monto</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedCuenta.items && selectedCuenta.items
                        .filter(m => m.tipo === 'egreso')
                        .map((movimiento, index) => (
                          <tr key={movimiento.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-4 py-3 text-sm text-slate-800">
                              {formatFecha(movimiento.fecha)}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-800">
                              {movimiento.descripcion}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-800 text-center font-medium">
                              {formatearMonto(movimiento.monto, 'USD')}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <div className="flex justify-center space-x-2">
                                <button className="text-slate-600 hover:text-slate-800 transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button className="text-slate-600 hover:text-slate-800 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {(!selectedCuenta.items || selectedCuenta.items.filter(m => m.tipo === 'egreso').length === 0) && (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                            No hay egresos registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-800 text-white p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">TOTAL EGRESOS:</span>
                    <span className="text-sm font-semibold">
                      {formatearMonto(calcularTotalesMovimientos(selectedCuenta.items).egresos, 'USD')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Columna Ingresos */}
              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="bg-slate-800 text-white p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <h4 className="font-semibold text-lg">INGRESOS</h4>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700 text-white sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Monto</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedCuenta.items && selectedCuenta.items
                        .filter(m => m.tipo === 'ingreso')
                        .map((movimiento, index) => (
                          <tr key={movimiento.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-4 py-3 text-sm text-slate-800">
                              {formatFecha(movimiento.fecha)}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-800">
                              {movimiento.descripcion}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-800 text-center font-medium">
                              {formatearMonto(movimiento.monto, 'USD')}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <div className="flex justify-center space-x-2">
                                <button className="text-slate-600 hover:text-slate-800 transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button className="text-slate-600 hover:text-slate-800 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {(!selectedCuenta.items || selectedCuenta.items.filter(m => m.tipo === 'ingreso').length === 0) && (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                            No hay ingresos registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-800 text-white p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">TOTAL INGRESOS:</span>
                    <span className="text-sm font-semibold">
                      {formatearMonto(calcularTotalesMovimientos(selectedCuenta.items).ingresos, 'USD')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen final */}
            <div className="bg-white border border-slate-200 rounded mt-6">
              <div className="bg-slate-800 text-white p-4">
                <h4 className="font-semibold text-lg">RESUMEN GENERAL</h4>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-sm text-slate-600">Total Ingresos</div>
                    <div className="text-xl font-semibold text-emerald-600">
                      {formatearMonto(calcularTotalesMovimientos(selectedCuenta.items).ingresos, 'USD')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-600">Total Egresos</div>
                    <div className="text-xl font-semibold text-red-600">
                      {formatearMonto(calcularTotalesMovimientos(selectedCuenta.items).egresos, 'USD')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-600">Saldo Neto</div>
                    <div className={`text-xl font-semibold ${calcularTotalesMovimientos(selectedCuenta.items).saldo >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                      }`}>
                      {formatearMonto(calcularTotalesMovimientos(selectedCuenta.items).saldo, 'USD')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal para Nueva Cuenta Auxiliar */}
      {showNuevaCuenta && (
        <ModalNuevaCuentaAuxiliar
          isOpen={showNuevaCuenta}
          onClose={() => setShowNuevaCuenta(false)}
          planCuentas={planCuentas}
          loadingPlanCuentas={loadingPlanCuentas}
          onCrear={createCuenta}
        />
      )}

      {/* Modal para Nuevo Movimiento */}
      {showNuevoMovimiento && selectedCuenta && (
        <ModalNuevoMovimiento
          isOpen={showNuevoMovimiento}
          onClose={() => setShowNuevoMovimiento(false)}
          cuenta={selectedCuenta}
          onAgregar={addItem}
        />
      )}
    </div>
  );
};

// Componente Modal para Nueva Cuenta Auxiliar
const ModalNuevaCuentaAuxiliar = ({ isOpen, onClose, planCuentas, loadingPlanCuentas, onCrear }) => {
  const [formData, setFormData] = useState({
    cuenta_id: '',
    nombre: '',
    descripcion: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cuenta_id) {
      setError('Debe seleccionar una cuenta del plan de cuentas');
      return;
    }

    if (!formData.nombre.trim()) {
      setError('El nombre de la cuenta auxiliar es obligatorio');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await onCrear({
        cuenta_id: parseInt(formData.cuenta_id),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null
      });

      // Limpiar formulario y cerrar modal
      setFormData({ cuenta_id: '', nombre: '', descripcion: '' });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cuentaSeleccionada = planCuentas.find(c => c.id.toString() === formData.cuenta_id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Nueva Cuenta Auxiliar</h3>
            <p className="text-slate-300 mt-1">Agregar cuenta del plan para control auxiliar</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded hover:bg-slate-700 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Selector de Cuenta */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cuenta del Plan de Cuentas *
            </label>
            {loadingPlanCuentas ? (
              <div className="border border-slate-200 rounded p-3 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <span className="text-sm text-slate-600">Cargando cuentas...</span>
              </div>
            ) : (
              <select
                value={formData.cuenta_id}
                onChange={(e) => setFormData(prev => ({ ...prev, cuenta_id: e.target.value }))}
                className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="">Seleccionar cuenta...</option>
                {planCuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.codigo} - {cuenta.nombre}
                  </option>
                ))}
              </select>
            )}
            {cuentaSeleccionada && (
              <p className="mt-2 text-sm text-slate-600">
                Tipo: <span className="font-medium">{cuentaSeleccionada.tipo}</span>
              </p>
            )}
          </div>

          {/* Nombre de la Cuenta Auxiliar */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre de la Cuenta Auxiliar *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Inventario Sucursal La Plata"
              className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              maxLength={255}
            />
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción adicional de la cuenta auxiliar..."
              rows={3}
              className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              maxLength={500}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.cuenta_id || !formData.nombre.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Crear Cuenta Auxiliar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente Modal para Nuevo Movimiento
const ModalNuevoMovimiento = ({ isOpen, onClose, cuenta, onAgregar }) => {
  const [formData, setFormData] = useState({
    fecha: obtenerFechaLocal(),
    descripcion: '',
    tipo: '',
    monto: '',
    referencia: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }

    if (!formData.tipo) {
      setError('Debe seleccionar el tipo de movimiento');
      return;
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (!formData.fecha) {
      setError('La fecha es obligatoria');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const movimientoData = {
        fecha: formData.fecha,
        descripcion: formData.descripcion.trim(),
        tipo: formData.tipo,
        monto: parseFloat(formData.monto),
        referencia: formData.referencia?.trim() || null
      };

      // En el futuro, esto llamará al servicio para agregar el movimiento
      await onAgregar(cuenta.id, movimientoData);

      // Limpiar formulario y cerrar modal
      setFormData({
        fecha: obtenerFechaLocal(),
        descripcion: '',
        tipo: '',
        monto: '',
        referencia: ''
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Nuevo Movimiento</h3>
            <p className="text-slate-300 mt-1">
              {cuenta.plan_cuentas?.codigo || cuenta.cuenta?.codigo || 'Sin código'} - {cuenta.plan_cuentas?.nombre || cuenta.cuenta?.nombre || cuenta.nombre || 'Sin nombre'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded hover:bg-slate-700 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Movimiento *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="">Seleccionar tipo...</option>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción *
              </label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Ej: Venta de equipos computación"
                className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                maxLength={255}
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Monto (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            {/* Referencia */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Referencia (Opcional)
              </label>
              <input
                type="text"
                value={formData.referencia}
                onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                placeholder="Ej: FAC-001-2024"
                className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                maxLength={100}
              />
            </div>
          </div>

          {/* Indicador visual del tipo */}
          {formData.tipo && formData.monto && (
            <div className={`mt-4 p-4 border rounded ${formData.tipo === 'ingreso'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {formData.tipo === 'ingreso' ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Movimiento de Ingreso</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Movimiento de Egreso</span>
                    </>
                  )}
                </div>
                <span className={`text-lg font-semibold ${formData.tipo === 'ingreso' ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                  {formatearMonto(parseFloat(formData.monto || 0), 'USD')}
                </span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.descripcion.trim() || !formData.tipo || !formData.monto || !formData.fecha}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Agregando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Agregar Movimiento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CuentasAuxiliaresSection;