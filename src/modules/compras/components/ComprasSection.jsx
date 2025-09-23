import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, ShoppingBag, DollarSign, Package, FileText, Calendar, Building2, Laptop } from 'lucide-react';
import { useCompras } from '../hooks/useCompras';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';

const ComprasSection = () => {
  const { compras, loading, error, createCompra, updateCompra, deleteCompra } = useCompras();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoCompra, setEditandoCompra] = useState(null);
  const [formData, setFormData] = useState({
    item: '',
    cantidad: 1,
    serial: '',
    moneda: 'USD',
    cotizacion: '',
    monto: '',
    proveedor: '',
    caja_pago: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  // Estados para filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');

  const limpiarFormulario = () => {
    setFormData({
      item: '',
      cantidad: 1,
      serial: '',
      moneda: 'USD',
      cotizacion: '',
      monto: '',
      proveedor: '',
      caja_pago: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0]
    });
    setEditandoCompra(null);
    setMostrarFormulario(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validaciones
      if (!formData.item.trim()) {
        alert('El ítem es requerido');
        return;
      }
      if (!formData.monto || parseFloat(formData.monto) <= 0) {
        alert('El monto debe ser mayor a 0');
        return;
      }
      if (!formData.proveedor.trim()) {
        alert('El proveedor es requerido');
        return;
      }
      if (!formData.caja_pago.trim()) {
        alert('La caja es requerida');
        return;
      }
      if (formData.moneda === 'ARS' && (!formData.cotizacion || parseFloat(formData.cotizacion) <= 0)) {
        alert('La cotización es requerida para moneda ARS');
        return;
      }

      const compraData = {
        ...formData,
        cantidad: parseInt(formData.cantidad) || 1,
        monto: parseFloat(formData.monto),
        cotizacion: formData.moneda === 'ARS' ? parseFloat(formData.cotizacion) : null,
        serial: formData.serial.trim() || null
      };

      if (editandoCompra) {
        await updateCompra(editandoCompra.id, compraData);
      } else {
        await createCompra(compraData);
      }

      limpiarFormulario();
    } catch (error) {
      alert('Error al guardar la compra: ' + error.message);
    }
  };

  const handleEditar = (compra) => {
    setFormData({
      item: compra.item,
      cantidad: compra.cantidad,
      serial: compra.serial || '',
      moneda: compra.moneda,
      cotizacion: compra.cotizacion || '',
      monto: compra.monto,
      proveedor: compra.proveedor,
      caja_pago: compra.caja_pago,
      descripcion: compra.descripcion || '',
      fecha: compra.fecha
    });
    setEditandoCompra(compra);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta compra?')) {
      try {
        await deleteCompra(id);
      } catch (error) {
        alert('Error al eliminar la compra: ' + error.message);
      }
    }
  };

  const formatearMonto = (monto, moneda) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const calcularMontoUSD = (montoARS, cotizacion) => {
    if (!montoARS || !cotizacion) return 0;
    return Math.round(parseFloat(montoARS) / parseFloat(cotizacion));
  };

  // Filtrar compras
  const comprasFiltradas = compras.filter(compra => {
    // Filtro por fecha desde
    if (filtroFechaDesde && compra.fecha < filtroFechaDesde) return false;

    // Filtro por fecha hasta
    if (filtroFechaHasta && compra.fecha > filtroFechaHasta) return false;

    // Filtro por proveedor
    if (filtroProveedor && !compra.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase())) return false;

    return true;
  });

  // Obtener proveedores únicos para el filtro
  const proveedoresUnicos = [...new Set(compras.map(compra => compra.proveedor))].sort();

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroProveedor('');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-800 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ShoppingBag size={28} />
            <div>
              <p className="text-gray-300 mt-1">Registro de compras</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              {mostrarFormulario ? 'Ocultar Formulario' : 'Nueva Compra'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información Básica */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="border-b border-slate-200">
              <div className="flex items-center p-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-slate-800">Información Básica</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Ítem */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ítem *
                  </label>
                  <input
                    type="text"
                    value={formData.item}
                    onChange={(e) => setFormData(prev => ({ ...prev, item: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Descripción del producto/servicio"
                    required
                  />
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cantidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Serial */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Serial (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.serial}
                    onChange={(e) => setFormData(prev => ({ ...prev, serial: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Número de serie"
                  />
                </div>

                {/* Proveedor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor}
                    onChange={(e) => setFormData(prev => ({ ...prev, proveedor: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Nombre del proveedor"
                    required
                  />
                </div>

                {/* Caja */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Caja *
                  </label>
                  <input
                    type="text"
                    value={formData.caja_pago}
                    onChange={(e) => setFormData(prev => ({ ...prev, caja_pago: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Método/lugar de pago"
                    required
                  />
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Descripción - ocupa 2 casillas */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Descripción adicional..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información Comercial */}
          <div className="bg-emerald-50 border border-slate-200 rounded">
            <div className="border-b border-slate-200 bg-emerald-50">
              <div className="flex items-center p-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-slate-800">Información Comercial</h3>
              </div>
            </div>
            <div className="p-4 bg-emerald-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Moneda */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Moneda *
                  </label>
                  <select
                    value={formData.moneda}
                    onChange={(e) => setFormData(prev => ({ ...prev, moneda: e.target.value, cotizacion: e.target.value === 'USD' ? '' : prev.cotizacion }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {formData.moneda === 'ARS' ? 'Monto en ARS *' : 'Monto en USD *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monto}
                      onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                      className="w-full border border-slate-200 rounded px-8 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Cotización (solo si es ARS) */}
                {formData.moneda === 'ARS' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cotización USD/ARS *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cotizacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, cotizacion: e.target.value }))}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                      placeholder="Ej: 1150"
                    />
                  </div>
                )}

                {/* Monto USD (solo si es ARS) - mostrar calculado */}
                {formData.moneda === 'ARS' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Monto en USD
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400">$</span>
                      <input
                        type="text"
                        value={formData.monto && formData.cotizacion ?
                          calcularMontoUSD(formData.monto, formData.cotizacion) : '0'
                        }
                        className="w-full border border-slate-200 rounded px-8 py-2 bg-slate-100 text-slate-500"
                        readOnly
                        placeholder="Se calcula automáticamente"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={limpiarFormulario}
              className="flex items-center space-x-1 bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded text-sm transition-colors"
            >
              <Save className="w-3 h-3" />
              <span>{editandoCompra ? 'Actualizar' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor
            </label>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            >
              <option value="">Todos los proveedores</option>
              {proveedoresUnicos.map(proveedor => (
                <option key={proveedor} value={proveedor}>{proveedor}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-black text-sm"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de compras */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">
              Historial
            </h3>
            <p className="text-sm text-slate-600">
              {comprasFiltradas.length} de {compras.length} compras
            </p>
          </div>
        </div>

        {compras.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>No hay compras registradas</p>
            <p className="text-sm">Haz clic en "Nueva Compra" para comenzar</p>
          </div>
        ) : comprasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>No hay compras que coincidan con los filtros</p>
            <p className="text-sm">Ajusta los filtros o limpia la búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Ítem</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cantidad</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Serial</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Caja</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comprasFiltradas.map((compra, index) => (
                  <tr key={compra.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {new Date(compra.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      <div className="font-medium">{compra.item}</div>
                      {compra.descripcion && (
                        <div className="text-xs text-slate-500 mt-1">{compra.descripcion}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 text-center">
                      {compra.cantidad}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-center">
                      {compra.serial || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="font-medium text-slate-800">
                        {formatearMonto(compra.monto, compra.moneda)}
                      </div>
                      {compra.moneda === 'ARS' && compra.cotizacion && (
                        <div className="text-xs text-slate-500">
                          USD ${calcularMontoUSD(compra.monto, compra.cotizacion)} (${compra.cotizacion})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {compra.proveedor}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {compra.caja_pago}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditar(compra)}
                          className="text-emerald-600 hover:text-emerald-800 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(compra.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default ComprasSection;