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
  BarChart3
} from 'lucide-react';
import { formatearMonto } from '../../../shared/utils/formatters';
import { useCuentasAuxiliares } from '../hooks/useCuentasAuxiliares';
import { supabase } from '../../../lib/supabase';

const CuentasAuxiliaresSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [showDetalles, setShowDetalles] = useState(false);
  const [showNuevoItem, setShowNuevoItem] = useState(false);

  // Hook para datos reales
  const {
    cuentas,
    loading,
    error,
    getCuentaById,
    createCuenta,
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

  const itemsEjemplo = [
    {
      id: 1,
      descripcion: 'Notebook Lenovo ThinkPad E14',
      codigo_interno: 'NB-LP-001',
      cantidad: 3,
      valor_unitario: 850.00,
      valor_total: 2550.00,
      categoria: 'Notebooks',
      fecha_ingreso: '2024-01-10',
      estado: 'disponible'
    },
    {
      id: 2,
      descripcion: 'iPhone 13 128GB',
      codigo_interno: 'IP-LP-013',
      cantidad: 2,
      valor_unitario: 900.00,
      valor_total: 1800.00,
      categoria: 'Smartphones',
      fecha_ingreso: '2024-01-12',
      estado: 'disponible'
    },
    {
      id: 3,
      descripcion: 'Reparación pantalla Samsung',
      codigo_interno: 'REP-LP-045',
      cantidad: 1,
      valor_unitario: 120.00,
      valor_total: 120.00,
      categoria: 'Reparaciones',
      fecha_ingreso: '2024-01-15',
      estado: 'en_proceso'
    }
  ];

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
      const cuentaCompleta = await getCuentaById(cuenta.id);
      setSelectedCuenta(cuentaCompleta);
      setShowDetalles(true);
    } catch (error) {
      console.error('Error obteniendo detalles de cuenta:', error);
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
      <div className="bg-white rounded border border-slate-200">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Calculator className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Cuentas Auxiliares</h2>
                <p className="text-slate-300 mt-1">Control detallado de inventarios y auxiliares contables</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleNuevaCuenta}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Cuenta Auxiliar</span>
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Filtros */}
      <div className="bg-white rounded border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cuenta, código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Cuentas Auxiliares */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Cuentas con Auxiliares</h3>
        </div>

        {mostrarMensajeVacio ? (
          <div className="p-8 text-center">
            <Calculator className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay cuentas auxiliares</h3>
            <p className="text-slate-600 mb-4">
              Comienza agregando cuentas del plan de cuentas para llevar un control detallado.
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
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Cuenta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Saldo Contable
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total Auxiliar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Diferencia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actualización
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {cuentas.map((cuenta) => (
                  <tr key={cuenta.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {cuenta.cuenta?.codigo || 'Sin código'}
                        </div>
                        <div className="text-sm text-slate-500">
                          {cuenta.cuenta?.nombre || cuenta.nombre || 'Sin nombre'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800">
                      {formatearMonto(cuenta.cuenta?.saldo_contable || 0, 'USD')}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800">
                      {formatearMonto(cuenta.total_auxiliar || 0, 'USD')}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`${getDiferenciaColor(cuenta.diferencia || 0)} font-medium`}>
                        {Math.abs(cuenta.diferencia || 0) < 0.01 ? 'Balanceado' : formatearMonto(Math.abs(cuenta.diferencia || 0), 'USD')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${getEstadoColor(cuenta.estado || 'sin_items')}`}>
                        {getEstadoIcon(cuenta.estado || 'sin_items')}
                        <span className="capitalize">{cuenta.estado || 'sin_items'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-800">
                      {cuenta.items_count || 0} items
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {formatFecha(cuenta.updated_at?.split('T')[0] || cuenta.created_at?.split('T')[0] || new Date().toISOString().split('T')[0])}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVerDetalles(cuenta)}
                          className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-50 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-slate-600 hover:text-slate-800 p-1 rounded hover:bg-slate-50 transition-colors" title="Editar">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="text-slate-600 hover:text-slate-800 p-1 rounded hover:bg-slate-50 transition-colors" title="Reportes">
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {showDetalles && selectedCuenta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-200 max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Header del Modal */}
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">Detalle de Cuenta Auxiliar</h3>
                <p className="text-slate-300 mt-1">
                  {selectedCuenta.plan_cuentas?.codigo || selectedCuenta.cuenta?.codigo || 'Sin código'} - {selectedCuenta.plan_cuentas?.nombre || selectedCuenta.cuenta?.nombre || selectedCuenta.nombre || 'Sin nombre'}
                </p>
              </div>
              <button
                onClick={() => setShowDetalles(false)}
                className="text-slate-300 hover:text-white p-2 rounded hover:bg-slate-700 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <div className="text-sm text-slate-600">Saldo Contable</div>
                  <div className="text-xl font-semibold text-slate-800">
                    {formatearMonto(selectedCuenta.cuenta?.saldo_contable || 0, 'USD')}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <div className="text-sm text-slate-600">Total Auxiliar</div>
                  <div className="text-xl font-semibold text-slate-800">
                    {formatearMonto(selectedCuenta.total_auxiliar || 0, 'USD')}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <div className="text-sm text-slate-600">Diferencia</div>
                  <div className={`text-xl font-semibold ${getDiferenciaColor(selectedCuenta.diferencia || 0)}`}>
                    {(selectedCuenta.diferencia || 0) === 0 ? 'Balanceado' : formatearMonto(Math.abs(selectedCuenta.diferencia || 0), 'USD')}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-slate-800">Items del Auxiliar</h4>
                <button
                  onClick={() => setShowNuevoItem(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Item</span>
                </button>
              </div>

              {/* Tabla de Items */}
              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Valor Unit.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {(selectedCuenta.items || itemsEjemplo).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-800">
                            {item.descripcion}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {item.cantidad}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {formatearMonto(item.valor_unitario, 'USD')}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {formatearMonto(item.valor_total, 'USD')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button className="text-slate-600 hover:text-slate-800 p-1 rounded hover:bg-slate-50 transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button className="text-slate-600 hover:text-slate-800 p-1 rounded hover:bg-slate-50 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* Modal para Nuevo Item */}
      {showNuevoItem && selectedCuenta && (
        <ModalNuevoItem
          isOpen={showNuevoItem}
          onClose={() => setShowNuevoItem(false)}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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

// Componente Modal para Nuevo Item
const ModalNuevoItem = ({ isOpen, onClose, cuenta, onAgregar }) => {
  const [formData, setFormData] = useState({
    descripcion: '',
    cantidad: 1,
    valor_unitario: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }

    if (!formData.valor_unitario || parseFloat(formData.valor_unitario) <= 0) {
      setError('El valor unitario debe ser mayor a 0');
      return;
    }

    if (!formData.cantidad || parseFloat(formData.cantidad) <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const itemData = {
        descripcion: formData.descripcion.trim(),
        cantidad: parseFloat(formData.cantidad),
        valor_unitario: parseFloat(formData.valor_unitario),
        fecha_ingreso: new Date().toISOString().split('T')[0]
      };

      await onAgregar(cuenta.id, itemData);

      // Limpiar formulario y cerrar modal
      setFormData({
        descripcion: '',
        cantidad: 1,
        valor_unitario: 0
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const valorTotal = parseFloat(formData.cantidad || 0) * parseFloat(formData.valor_unitario || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Nuevo Item</h3>
            <p className="text-slate-300 mt-1">
              {cuenta.cuenta?.codigo} - {cuenta.cuenta?.nombre}
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
            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción *
              </label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Ej: Notebook Lenovo ThinkPad E14"
                className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                maxLength={255}
              />
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cantidad *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.cantidad}
                onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            {/* Valor Unitario */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Valor Unitario (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_unitario}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_unitario: e.target.value }))}
                className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Resumen de Valor Total */}
          {valorTotal > 0 && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Valor Total:</span>
                <span className="text-lg font-semibold text-slate-800">
                  {formatearMonto(valorTotal, 'USD')}
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
              disabled={submitting || !formData.descripcion.trim() || !formData.valor_unitario || !formData.cantidad}
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
                  <span>Agregar Item</span>
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