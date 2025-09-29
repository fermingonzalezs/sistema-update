import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ShoppingBag, DollarSign, Package, FileText, Calendar, Building2, Laptop, Minus } from 'lucide-react';
import { useCompras } from '../hooks/useCompras';
import { cotizacionService } from '../../../shared/services/cotizacionService';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';

const ComprasSection = () => {
  const { compras, loading, error, createCompra, updateCompra, deleteCompra } = useCompras();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cotizacionDolar, setCotizacionDolar] = useState(1000);

  // Estados del recibo (header)
  const [reciboData, setReciboData] = useState({
    proveedor: '',
    metodoPago: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    moneda: 'USD',
    cotizacion: 1000
  });

  // Estados de los items
  const [items, setItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState({
    serial: '',
    descripcion: '',
    cantidad: 1,
    precioUnitario: '',
    agregarSeparado: false // true = una fila por unidad, false = una fila con cantidad total
  });

  // Estados para filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');

  // Cargar cotización al montar el componente
  useEffect(() => {
    const cargarCotizacion = async () => {
      try {
        const cotizacionData = await cotizacionService.obtenerCotizacionActual();
        const valorCotizacion = cotizacionData.valor || cotizacionData.promedio || 1000;
        setCotizacionDolar(valorCotizacion);
        setReciboData(prev => ({ ...prev, cotizacion: valorCotizacion }));
      } catch (error) {
        console.error('Error cargando cotización:', error);
        setCotizacionDolar(1000);
      }
    };
    cargarCotizacion();
  }, []);

  const limpiarFormulario = () => {
    setReciboData({
      proveedor: '',
      metodoPago: '',
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      moneda: 'USD',
      cotizacion: cotizacionDolar
    });
    setItems([]);
    setNuevoItem({
      serial: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: '',
      agregarSeparado: false
    });
    setMostrarFormulario(false);
  };

  // Funciones para manejar items
  const agregarItem = () => {
    // Validaciones
    if (!nuevoItem.descripcion.trim()) {
      alert('La descripción del item es requerida');
      return;
    }
    if (!nuevoItem.precioUnitario || parseInt(nuevoItem.precioUnitario) <= 0) {
      alert('El precio unitario debe ser mayor a 0');
      return;
    }
    if (!nuevoItem.cantidad || parseInt(nuevoItem.cantidad) <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    const cantidad = parseInt(nuevoItem.cantidad);
    const precioUnitario = parseInt(nuevoItem.precioUnitario);

    if (nuevoItem.agregarSeparado) {
      // Agregar una fila por cada unidad
      const nuevosItems = [];
      for (let i = 0; i < cantidad; i++) {
        nuevosItems.push({
          id: Date.now() + i, // ID temporal único
          serial: nuevoItem.serial.trim() || '',
          descripcion: nuevoItem.descripcion.trim(),
          cantidad: 1,
          precioUnitario: precioUnitario,
          total: precioUnitario
        });
      }
      setItems(prev => [...prev, ...nuevosItems]);
    } else {
      // Agregar una sola fila con la cantidad total
      const item = {
        id: Date.now(),
        serial: nuevoItem.serial.trim() || '',
        descripcion: nuevoItem.descripcion.trim(),
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        total: cantidad * precioUnitario
      };
      setItems(prev => [...prev, item]);
    }

    setNuevoItem({
      serial: '',
      descripcion: '',
      cantidad: 1,
      precioUnitario: '',
      agregarSeparado: false
    });
  };

  const eliminarItem = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const editarItem = (itemId, nuevosDatos) => {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, ...nuevosDatos, total: nuevosDatos.cantidad * nuevosDatos.precioUnitario }
        : item
    ));
  };

  // Calcular total del recibo
  const totalRecibo = items.reduce((acc, item) => acc + item.total, 0);

  // Convertir monto a USD si es necesario
  const convertirAUSD = (monto) => {
    if (reciboData.moneda === 'ARS') {
      return monto / reciboData.cotizacion;
    }
    return monto;
  };

  const handleGuardarRecibo = async () => {
    try {
      // Validaciones del recibo
      if (!reciboData.proveedor.trim()) {
        alert('El proveedor es requerido');
        return;
      }
      if (!reciboData.metodoPago.trim()) {
        alert('El método de pago es requerido');
        return;
      }
      if (items.length === 0) {
        alert('Debe agregar al menos un item al recibo');
        return;
      }
      if (reciboData.moneda === 'ARS' && (!reciboData.cotizacion || parseFloat(reciboData.cotizacion) <= 0)) {
        alert('La cotización es requerida para moneda ARS');
        return;
      }

      // TODO: Implementar guardado del recibo completo
      console.log('Recibo a guardar:', {
        header: reciboData,
        items: items,
        totalRecibo: totalRecibo,
        totalUSD: convertirAUSD(totalRecibo)
      });

      alert('✅ Recibo guardado exitosamente (funcionalidad pendiente)');
      limpiarFormulario();
    } catch (error) {
      alert('Error al guardar el recibo: ' + error.message);
    }
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
              className="bg-slate-700 text-white px-6 py-3 rounded-lg hover:bg-slate-800 flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              {mostrarFormulario ? 'Ocultar Formulario' : 'Nuevo Recibo'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Formulario de Recibo */}
      {mostrarFormulario && (
        <div className="space-y-6">
          {/* HEADER DEL RECIBO */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="p-4 bg-slate-800 text-white">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Nuevo Recibo de Compra</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Proveedor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    value={reciboData.proveedor}
                    onChange={(e) => setReciboData(prev => ({ ...prev, proveedor: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Nombre del proveedor"
                    required
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={reciboData.metodoPago}
                    onChange={(e) => setReciboData(prev => ({ ...prev, metodoPago: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Seleccionar método...</option>
                    <option value="efectivo_pesos">💵 Efectivo en Pesos</option>
                    <option value="dolares_billete">💸 Dólares Billete</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="criptomonedas">₿ Criptomonedas</option>
                    <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
                    <option value="cuenta_corriente">🏷️ Cuenta Corriente</option>
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={reciboData.fecha}
                    onChange={(e) => setReciboData(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Moneda */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Moneda *
                  </label>
                  <select
                    value={reciboData.moneda}
                    onChange={(e) => setReciboData(prev => ({
                      ...prev,
                      moneda: e.target.value,
                      cotizacion: e.target.value === 'USD' ? 1 : cotizacionDolar
                    }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>

                {/* Cotización (solo si es ARS) */}
                {reciboData.moneda === 'ARS' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cotización USD/ARS *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={reciboData.cotizacion}
                      onChange={(e) => setReciboData(prev => ({ ...prev, cotizacion: parseFloat(e.target.value) }))}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                      placeholder="Ej: 1150"
                    />
                  </div>
                )}

                {/* Descripción */}
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción General
                  </label>
                  <textarea
                    rows={2}
                    value={reciboData.descripcion}
                    onChange={(e) => setReciboData(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Descripción general del recibo..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ITEMS DEL RECIBO */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="p-4 bg-slate-800 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">Items del Recibo</h3>
                </div>
                <span className="text-slate-300 text-sm">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Formulario para agregar item */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Serial/ID
                  </label>
                  <input
                    type="text"
                    value={nuevoItem.serial}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, serial: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                    placeholder="Opcional"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    value={nuevoItem.descripcion}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                    placeholder="Descripción del item"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoItem.cantidad}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, cantidad: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Precio Unit. * ({reciboData.moneda})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={nuevoItem.precioUnitario}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, precioUnitario: e.target.value }))}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Agregar como
                  </label>
                  <select
                    value={nuevoItem.agregarSeparado}
                    onChange={(e) => setNuevoItem(prev => ({ ...prev, agregarSeparado: e.target.value === 'true' }))}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                  >
                    <option value="false">Fila única</option>
                    <option value="true">Filas separadas</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="w-full bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla de items */}
            <div className="overflow-x-auto">
              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No hay items agregados</p>
                  <p className="text-sm">Agregue items usando el formulario de arriba</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Serial</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cantidad</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Precio Unit.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {item.serial || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {item.descripcion}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-800">
                          {item.cantidad}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-800">
                          ${item.precioUnitario} {reciboData.moneda}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800">
                          ${item.total} {reciboData.moneda}
                          {reciboData.moneda === 'ARS' && (
                            <div className="text-xs text-slate-500">
                              USD ${convertirAUSD(item.total)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => eliminarItem(item.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                            title="Eliminar item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Footer con total */}
                  <tfoot className="bg-slate-800 text-white">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-sm font-semibold">TOTAL DEL RECIBO</td>
                      <td className="px-4 py-3 text-center text-lg font-bold">
                        ${totalRecibo} {reciboData.moneda}
                        {reciboData.moneda === 'ARS' && (
                          <div className="text-sm text-slate-300">
                            USD ${convertirAUSD(totalRecibo)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

          {/* Botones del recibo */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={limpiarFormulario}
              className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
            <button
              type="button"
              onClick={handleGuardarRecibo}
              disabled={items.length === 0}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Recibo</span>
            </button>
          </div>
        </div>
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