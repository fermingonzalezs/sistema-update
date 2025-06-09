import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, DollarSign, Calendar, Filter, FileText } from 'lucide-react';
import { useGastosOperativos } from '../hooks/useGastosOperativos.js';

const GastosOperativosSection = () => {
  const {
    gastos,
    loading,
    error,
    fetchGastos,
    crearGasto,
    actualizarGasto,
    eliminarGasto
  } = useGastosOperativos();

  const [showModal, setShowModal] = useState(false);
  const [gastoSeleccionado, setGastoSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    categoria: ''
  });

  const [formData, setFormData] = useState({
    fecha_gasto: new Date().toISOString().split('T')[0],
    categoria: '',
    subcategoria: '',
    descripcion: '',
    proveedor_nombre: '',
    numero_comprobante: '',
    monto: '',
    metodo_pago: 'efectivo',
    estado: 'pagado',
    observaciones: ''
  });

  // Categorías disponibles
  const categorias = [
    { value: 'proveedor', label: 'Proveedores (Mercadería)', color: 'bg-blue-100 text-blue-800' },
    { value: 'servicios', label: 'Servicios Básicos', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'alquiler', label: 'Alquiler y Expensas', color: 'bg-purple-100 text-purple-800' },
    { value: 'sueldos', label: 'Sueldos y Cargas', color: 'bg-green-100 text-green-800' },
    { value: 'impuestos', label: 'Impuestos y Tasas', color: 'bg-red-100 text-red-800' },
    { value: 'transporte', label: 'Transporte', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'marketing', label: 'Marketing', color: 'bg-pink-100 text-pink-800' },
    { value: 'mantenimiento', label: 'Mantenimiento', color: 'bg-orange-100 text-orange-800' },
    { value: 'administrativos', label: 'Gastos Administrativos', color: 'bg-gray-100 text-gray-800' },
    { value: 'otros', label: 'Otros Gastos', color: 'bg-teal-100 text-teal-800' }
  ];

  const metodosPago = [
    'efectivo',
    'transferencia', 
    'tarjeta_credito',
    'tarjeta_debito',
    'debito_automatico',
    'cheque'
  ];

  useEffect(() => {
    console.log('🚀 Iniciando carga de gastos operativos...');
    fetchGastos(filtros);
  }, []);

  const nuevoGasto = () => {
    setGastoSeleccionado(null);
    setFormData({
      fecha_gasto: new Date().toISOString().split('T')[0],
      categoria: '',
      subcategoria: '',
      descripcion: '',
      proveedor_nombre: '',
      numero_comprobante: '',
      monto: '',
      metodo_pago: 'efectivo',
      estado: 'pagado',
      observaciones: ''
    });
    setShowModal(true);
  };

  const editarGasto = (gasto) => {
    setGastoSeleccionado(gasto);
    setFormData({
      fecha_gasto: gasto.fecha_gasto,
      categoria: gasto.categoria,
      subcategoria: gasto.subcategoria || '',
      descripcion: gasto.descripcion,
      proveedor_nombre: gasto.proveedor_nombre || '',
      numero_comprobante: gasto.numero_comprobante || '',
      monto: gasto.monto.toString(),
      metodo_pago: gasto.metodo_pago,
      estado: gasto.estado,
      observaciones: gasto.observaciones || ''
    });
    setShowModal(true);
  };

  const guardarGasto = async () => {
    try {
      // Validaciones
      if (!formData.fecha_gasto) {
        alert('La fecha es obligatoria');
        return;
      }
      if (!formData.categoria) {
        alert('La categoría es obligatoria');
        return;
      }
      if (!formData.descripcion.trim()) {
        alert('La descripción es obligatoria');
        return;
      }
      if (!formData.monto || parseFloat(formData.monto) <= 0) {
        alert('El monto debe ser mayor a 0');
        return;
      }

      if (gastoSeleccionado) {
        await actualizarGasto(gastoSeleccionado.id, formData);
        alert('✅ Gasto actualizado exitosamente');
      } else {
        await crearGasto(formData);
        alert('✅ Gasto creado exitosamente');
      }
      
      setShowModal(false);
      fetchGastos(filtros); // Refrescar lista
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const confirmarEliminar = (gasto) => {
    if (confirm(`¿Está seguro de eliminar el gasto "${gasto.descripcion}"?`)) {
      eliminarGasto(gasto.id);
    }
  };

  const aplicarFiltros = () => {
    fetchGastos(filtros);
  };

  const limpiarFiltros = () => {
    setFiltros({ fechaDesde: '', fechaHasta: '', categoria: '' });
    fetchGastos({});
  };

  const getCategoriaInfo = (categoria) => {
    return categorias.find(c => c.value === categoria) || 
           { label: categoria, color: 'bg-gray-100 text-gray-800' };
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const totalGastos = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Cargando gastos operativos...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <DollarSign size={28} />
              <div>
                <h2 className="text-4xl font-bold">Gastos Operativos</h2>
                <p className="text-orange-100 mt-1">Gestión de gastos y proveedores</p>
              </div>
            </div>
            <button
              onClick={nuevoGasto}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-50 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Nuevo Gasto
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={filtros.categoria}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={aplicarFiltros}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm flex items-center gap-2"
              >
                <Filter size={16} />
                Filtrar
              </button>
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-orange-50 p-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Total de gastos mostrados:</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatearMoneda(totalGastos)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Cantidad de registros:</div>
              <div className="text-xl font-semibold text-gray-800">{gastos.length}</div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
            <div className="flex items-center">
              <AlertCircle className="text-red-600 mr-2" size={20} />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Lista de gastos */}
        <div className="p-6">
          {gastos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-orange-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-orange-700">Categoría</th>
                    <th className="text-left py-3 px-4 font-medium text-orange-700">Descripción</th>
                    <th className="text-left py-3 px-4 font-medium text-orange-700">Proveedor</th>
                    <th className="text-right py-3 px-4 font-medium text-orange-700">Monto</th>
                    <th className="text-center py-3 px-4 font-medium text-orange-700">Método</th>
                    <th className="text-center py-3 px-4 font-medium text-orange-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((gasto) => {
                    const categoriaInfo = getCategoriaInfo(gasto.categoria);
                    return (
                      <tr key={gasto.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatearFecha(gasto.fecha_gasto)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoriaInfo.color}`}>
                            {categoriaInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{gasto.descripcion}</div>
                          {gasto.subcategoria && (
                            <div className="text-xs text-gray-500">{gasto.subcategoria}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {gasto.proveedor_nombre || '-'}
                        </td>
                        <td className="text-right py-3 px-4 font-bold text-red-600">
                          {formatearMoneda(gasto.monto)}
                        </td>
                        <td className="text-center py-3 px-4 text-xs text-gray-500">
                          {gasto.metodo_pago.replace('_', ' ')}
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => editarGasto(gasto)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Editar gasto"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => confirmarEliminar(gasto)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Eliminar gasto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No hay gastos registrados</p>
              <button
                onClick={nuevoGasto}
                className="text-orange-600 hover:underline"
              >
                Registrar primer gasto
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar gasto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {gastoSeleccionado ? <Edit2 size={20} /> : <Plus size={20} />}
                  {gastoSeleccionado ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Primera fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha del Gasto *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_gasto}
                    onChange={(e) => setFormData({ ...formData, fecha_gasto: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categorias.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Segunda fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategoría
                  </label>
                  <input
                    type="text"
                    value={formData.subcategoria}
                    onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                    placeholder="Ej: electricidad, gas, etc."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.monto}
                      onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del gasto"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Tercera fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor_nombre}
                    onChange={(e) => setFormData({ ...formData, proveedor_nombre: e.target.value })}
                    placeholder="Nombre del proveedor"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° Comprobante
                  </label>
                  <input
                    type="text"
                    value={formData.numero_comprobante}
                    onChange={(e) => setFormData({ ...formData, numero_comprobante: e.target.value })}
                    placeholder="Número de factura/recibo"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Cuarta fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {metodosPago.map(metodo => (
                      <option key={metodo} value={metodo}>
                        {metodo.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={16} className="inline mr-2" />
                Cancelar
              </button>
              <button
                onClick={guardarGasto}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GastosOperativosSection;