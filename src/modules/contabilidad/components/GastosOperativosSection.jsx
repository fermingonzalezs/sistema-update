import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, DollarSign, Calendar, Filter, FileText, CheckCircle, Clock } from 'lucide-react';
import { useGastosOperativos } from '../hooks/useGastosOperativos.js';
import { cotizacionSimple } from '../../../services/cotizacionSimpleService';
import { asientoAutomaticoService } from '../../../services/asientoAutomaticoService';
import { conversionService } from '../../../services/conversionService';
import { formatearMonedaGeneral } from '../../../shared/utils/formatters';

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
  const [cotizacionActual, setCotizacionActual] = useState(null);
  const [cuentasPago, setCuentasPago] = useState([]);
  
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: ''
  });

  const [formData, setFormData] = useState({
    fecha_gasto: new Date().toISOString().split('T')[0],
    categoria: '',
    descripcion: '',
    monto: '',
    moneda: 'USD', // 'USD' o 'ARS'
    cotizacion_manual: '', // Solo para ARS
    cuenta_pago_id: '', // Cuenta desde donde se paga
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

  useEffect(() => {
    console.log('🚀 Iniciando carga de gastos operativos...');
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      // Cargar gastos
      await fetchGastos(filtros);
      
      // Cargar cotización actual
      const cotizacion = await cotizacionSimple.obtenerCotizacion();
      setCotizacionActual(cotizacion);
      
      // Cargar todas las cuentas disponibles
      const cuentas = await conversionService.obtenerCuentasConMoneda();
      console.log('📋 Cuentas cargadas para selector:', cuentas);
      setCuentasPago(cuentas); // Mostrar todas las cuentas disponibles
      
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    }
  };

  const nuevoGasto = () => {
    setGastoSeleccionado(null);
    setFormData({
      fecha_gasto: new Date().toISOString().split('T')[0],
      categoria: '',
      descripcion: '',
      monto: '',
      moneda: 'USD',
      cotizacion_manual: '',
      cuenta_pago_id: '',
      observaciones: ''
    });
    setShowModal(true);
  };

  const editarGasto = (gasto) => {
    setGastoSeleccionado(gasto);
    setFormData({
      fecha_gasto: gasto.fecha_gasto,
      categoria: gasto.categoria || '',
      descripcion: gasto.descripcion,
      monto: gasto.monto.toString(),
      moneda: gasto.moneda || 'USD',
      cotizacion_manual: gasto.cotizacion_manual || '',
      cuenta_pago_id: gasto.cuenta_pago_id || '',
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
      if (!formData.cuenta_pago_id) {
        alert('Debe seleccionar la cuenta de pago');
        return;
      }
      if (formData.moneda === 'ARS' && (!formData.cotizacion_manual || parseFloat(formData.cotizacion_manual) <= 0)) {
        alert('Para gastos en ARS debe especificar la cotización');
        return;
      }

      const gastoData = {
        ...formData,
        monto: parseFloat(formData.monto),
        cotizacion_manual: formData.moneda === 'ARS' ? parseFloat(formData.cotizacion_manual) : null
      };

      let gastoCreado;
      if (gastoSeleccionado) {
        gastoCreado = await actualizarGasto(gastoSeleccionado.id, gastoData);
        alert('✅ Gasto actualizado exitosamente');
      } else {
        gastoCreado = await crearGasto(gastoData);
        alert('✅ Gasto creado exitosamente');
      }

      // Generar asiento automático
      if (!gastoSeleccionado) { // Solo para gastos nuevos
        try {
          console.log('🚀 Intentando generar asiento automático para:', gastoCreado);
          await generarAsientoAutomatico(gastoCreado || { ...gastoData, id: Date.now() });
          alert('📝 Asiento contable creado como borrador - Revisar en "Asientos Contables"');
        } catch (asientoError) {
          console.error('❌ Error generando asiento:', asientoError);
          alert('⚠️ Gasto guardado pero no se pudo generar el asiento automático: ' + asientoError.message);
        }
      }
      
      setShowModal(false);
      await fetchGastos(filtros); // Refrescar lista
      
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const generarAsientoAutomatico = async (gasto) => {
    try {
      const gastoParaAsiento = {
        id: gasto.id,
        fecha: gasto.fecha_gasto,
        descripcion: gasto.descripcion,
        monto: gasto.monto,
        moneda: gasto.moneda,
        cotizacion_manual: gasto.cotizacion_manual,
        cuenta_pago_id: gasto.cuenta_pago_id,
        categoria: gasto.categoria || 'operativo',
        usuario: 'Usuario'
      };

      await asientoAutomaticoService.crearAsientoGasto(gastoParaAsiento);
      console.log('✅ Asiento automático creado para el gasto');
      
    } catch (error) {
      console.error('❌ Error creando asiento automático:', error);
      throw error;
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
    setFiltros({ fechaDesde: '', fechaHasta: '' });
    fetchGastos({});
  };

  const usarCotizacionAutomatica = async () => {
    try {
      const cotizacion = await cotizacionSimple.forzarActualizacion();
      setFormData(prev => ({
        ...prev,
        cotizacion_manual: cotizacion.valor.toString()
      }));
      setCotizacionActual(cotizacion);
    } catch (err) {
      alert('❌ Error obteniendo cotización: ' + err.message);
    }
  };

  const formatearMoneda = (valor, moneda = 'USD') => {
    return formatearMonedaGeneral(valor, moneda);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const calcularTotales = () => {
    const totalUSD = gastos
      .filter(g => g.moneda === 'USD')
      .reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);
    
    const totalARS = gastos
      .filter(g => g.moneda === 'ARS')
      .reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);
    
    return { totalUSD, totalARS };
  };

  const { totalUSD, totalARS } = calcularTotales();

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
        <div className="bg-gradient-to-r from-orange-600 to-red-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <DollarSign size={28} />
              <div>
                <h2 className="text-4xl font-bold">Gastos Operativos</h2>
                <p className="text-orange-100 mt-1">Registro de gastos en ARS y USD con asientos automáticos</p>
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

        {/* Estadísticas */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Total USD</div>
                  <div className="text-xl font-bold text-green-600">{formatearMoneda(totalUSD, 'USD')}</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Total ARS</div>
                  <div className="text-xl font-bold text-blue-600">{formatearMoneda(totalARS, 'ARS')}</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-600">Total Gastos</div>
                  <div className="text-xl font-bold text-purple-600">{gastos.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={aplicarFiltros}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-2"
              >
                <Filter size={16} />
                Filtrar
              </button>
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de gastos */}
        <div className="p-6">
          {error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <span className="text-red-800">{error}</span>
            </div>
          ) : gastos.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No hay gastos registrados</p>
              <p className="text-gray-400">Haz clic en "Nuevo Gasto" para comenzar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Categoría</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Descripción</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Monto</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((gasto) => (
                    <tr key={gasto.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatearFecha(gasto.fecha_gasto)}
                      </td>
                      <td className="py-3 px-4">
                        {gasto.categoria && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            categorias.find(c => c.value === gasto.categoria)?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            {categorias.find(c => c.value === gasto.categoria)?.label || gasto.categoria}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{gasto.descripcion}</div>
                        {gasto.observaciones && (
                          <div className="text-xs text-gray-500 mt-1">{gasto.observaciones}</div>
                        )}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="font-bold text-lg">
                          {formatearMoneda(gasto.monto, gasto.moneda || 'USD')}
                        </div>
                        {gasto.moneda === 'ARS' && gasto.cotizacion_manual && (
                          <div className="text-xs text-gray-500">
                            Cotización: ${gasto.cotizacion_manual}
                            <br />
                            USD: {formatearMonedaGeneral(gasto.monto / gasto.cotizacion_manual, 'USD')}
                          </div>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => editarGasto(gasto)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => confirmarEliminar(gasto)}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
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

      {/* Modal Nuevo/Editar Gasto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                  {gastoSeleccionado ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Gasto *
                </label>
                <input
                  type="date"
                  value={formData.fecha_gasto}
                  onChange={(e) => setFormData({ ...formData, fecha_gasto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias.map(categoria => (
                    <option key={categoria.value} value={categoria.value}>
                      {categoria.label}
                    </option>
                  ))}
                </select>
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
                  placeholder="Descripción del gasto..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              {/* Moneda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, moneda: 'USD', cotizacion_manual: '' })}
                    className={`px-4 py-2 rounded border-2 transition-colors ${
                      formData.moneda === 'USD'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    💵 USD
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, moneda: 'ARS' })}
                    className={`px-4 py-2 rounded border-2 transition-colors ${
                      formData.moneda === 'ARS'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    🇦🇷 ARS
                  </button>
                </div>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto en {formData.moneda} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    placeholder={`0.00 ${formData.moneda}`}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Cotización (solo para ARS) */}
              {formData.moneda === 'ARS' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Cotización USD *
                    </label>
                    {cotizacionActual && (
                      <button
                        type="button"
                        onClick={usarCotizacionAutomatica}
                        className="text-xs text-green-600 hover:text-green-800 underline"
                      >
                        Usar actual: ${cotizacionActual.valor}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cotizacion_manual}
                      onChange={(e) => setFormData({ ...formData, cotizacion_manual: e.target.value })}
                      placeholder="Ej: 1200.00"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Cuenta de Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuenta de Pago *
                </label>
                <select
                  value={formData.cuenta_pago_id}
                  onChange={(e) => setFormData({ ...formData, cuenta_pago_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="">Seleccionar cuenta...</option>
                  {cuentasPago.map(cuenta => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {cuenta.codigo} - {cuenta.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Cuenta desde donde se pagó el gasto
                </p>
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Vista previa de conversión */}
              {formData.moneda === 'ARS' && formData.monto && formData.cotizacion_manual && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-800 mb-1">Conversión a USD</div>
                  <div className="text-sm text-blue-700">
                    ${parseFloat(formData.monto).toLocaleString()} ARS ÷ ${formData.cotizacion_manual} = ${(parseFloat(formData.monto) / parseFloat(formData.cotizacion_manual)).toFixed(4)} USD
                  </div>
                </div>
              )}

              {/* Información sobre asiento automático */}
              {!gastoSeleccionado && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Asiento Automático</span>
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Se generará automáticamente un asiento contable como borrador para revisión
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarGasto}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  {gastoSeleccionado ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GastosOperativosSection;