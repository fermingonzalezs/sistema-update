// src/components/CuentasCorrientesSection.jsx
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Search,
  Plus,
  Eye,
  DollarSign,
  Calendar,
  X,
  Calculator
} from 'lucide-react';
import { useCuentasCorrientes } from '../lib/cuentasCorrientes.js';
import ClienteSelector from './ClienteSelector';

const CuentasCorrientesSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSaldo, setFiltroSaldo] = useState('todos'); // 'todos', 'deudores', 'acreedores', 'saldados'
  const [estadisticas, setEstadisticas] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState(null); // 'pago', 'cargo', 'ajuste'

  const {
    saldos,
    loading,
    error,
    fetchSaldos,
    fetchMovimientosCliente,
    getEstadisticas,
    registrarPagoRecibido,
    registrarCargoManual
  } = useCuentasCorrientes();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchSaldos();
    const stats = await getEstadisticas();
    setEstadisticas(stats);
  };

// 🔧 Componente Modal Unificado para Movimientos
const MovimientoModal = ({ tipo, onClose, onSuccess, registrarPagoRecibido, registrarCargoManual }) => {
  const [loading, setLoading] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    monto: '',
    concepto: '',
    comprobante: '',
    observaciones: ''
  });

  const tipoConfig = {
    pago: {
      titulo: 'Registrar Pago Recibido',
      descripcion: 'El cliente nos paga una deuda pendiente',
      color: 'green',
      icon: TrendingDown,
      conceptoPlaceholder: 'Pago recibido'
    },
    cargo: {
      titulo: 'Registrar Cargo Manual',
      descripcion: 'Agregar una deuda al cliente',
      color: 'orange', 
      icon: TrendingUp,
      conceptoPlaceholder: 'Cargo por servicio adicional'
    },
    ajuste: {
      titulo: 'Ajuste de Cuenta',
      descripcion: 'Corrección o ajuste contable',
      color: 'blue',
      icon: Calculator,
      conceptoPlaceholder: 'Ajuste contable'
    }
  };

  const config = tipoConfig[tipo];
  const Icon = config.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente');
      return;
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      alert('Debe ingresar un monto válido');
      return;
    }

    setLoading(true);
    
    try {
      const movimientoData = {
        cliente_id: clienteSeleccionado.id,
        monto: parseFloat(formData.monto),
        concepto: formData.concepto || config.conceptoPlaceholder,
        comprobante: formData.comprobante,
        observaciones: formData.observaciones,
        fecha: new Date().toISOString().split('T')[0],
        created_by: 'Usuario' // TODO: Obtener del contexto de usuario
      };

      if (tipo === 'pago') {
        await registrarPagoRecibido(movimientoData);
        alert('✅ Pago registrado exitosamente');
      } else if (tipo === 'cargo') {
        await registrarCargoManual(movimientoData);
        alert('✅ Cargo registrado exitosamente');
      } else {
        // TODO: Implementar ajustes
        alert('⚠️ Funcionalidad de ajustes próximamente');
      }

      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error registrando movimiento:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 bg-${config.color}-100 rounded-lg`}>
                <Icon className={`w-6 h-6 text-${config.color}-600`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{config.titulo}</h3>
                <p className="text-sm text-gray-500">{config.descripcion}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <ClienteSelector
              selectedCliente={clienteSeleccionado}
              onSelectCliente={setClienteSeleccionado}
              required={true}
            />
          </div>

          {/* Monto */}
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
                onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Concepto
            </label>
            <input
              type="text"
              value={formData.concepto}
              onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={config.conceptoPlaceholder}
            />
          </div>

          {/* Comprobante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprobante
            </label>
            <input
              type="text"
              value={formData.comprobante}
              onChange={(e) => setFormData(prev => ({ ...prev, comprobante: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Número de recibo, transferencia, etc."
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observaciones adicionales..."
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !clienteSeleccionado}
              className={`flex-1 px-4 py-3 bg-${config.color}-600 text-white rounded-lg hover:bg-${config.color}-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Icon className="w-4 h-4" />
                  <span>Registrar {tipo === 'pago' ? 'Pago' : tipo === 'cargo' ? 'Cargo' : 'Ajuste'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

  // Filtrar clientes según búsqueda y filtro de saldo
  const clientesFiltrados = saldos.filter(cliente => {
    // Filtro por texto
    const cumpleBusqueda = !searchTerm || 
      `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por tipo de saldo
    let cumpleFiltro = true;
    switch (filtroSaldo) {
      case 'deudores':
        cumpleFiltro = parseFloat(cliente.saldo_total || 0) > 0;
        break;
      case 'acreedores':
        cumpleFiltro = parseFloat(cliente.saldo_total || 0) < 0;
        break;
      case 'saldados':
        cumpleFiltro = parseFloat(cliente.saldo_total || 0) === 0;
        break;
      default: // 'todos'
        cumpleFiltro = true;
    }

    return cumpleBusqueda && cumpleFiltro;
  });

  const formatSaldo = (saldo) => {
    const valor = parseFloat(saldo || 0);
    const isPositivo = valor > 0;
    const isNegativo = valor < 0;
    
    return {
      valor: Math.abs(valor),
      texto: isPositivo ? 'Nos debe' : isNegativo ? 'Le debemos' : 'Saldado',
      color: isPositivo ? 'text-green-600' : isNegativo ? 'text-red-600' : 'text-gray-500',
      bgColor: isPositivo ? 'bg-green-50' : isNegativo ? 'bg-red-50' : 'bg-gray-50'
    };
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'Sin movimientos';
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const handleVerMovimientos = async (cliente) => {
    setClienteSeleccionado(cliente);
    await fetchMovimientosCliente(cliente.cliente_id);
  };

  const handleSelectTipoMovimiento = (tipo) => {
    setTipoMovimiento(tipo);
    setShowNuevoMovimiento(false); // Cerrar el selector
  };

  const handleCerrarMovimiento = () => {
    setTipoMovimiento(null);
    setShowNuevoMovimiento(false);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Cuentas Corrientes</h2>
        </div>
        <button 
          onClick={() => setShowNuevoMovimiento(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Movimiento</span>
        </button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total por Cobrar</p>
                <p className="text-2xl font-bold text-green-600">
                  ${estadisticas.totalPorCobrar.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total por Pagar</p>
                <p className="text-2xl font-bold text-red-600">
                  ${estadisticas.totalPorPagar.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Saldo Neto</p>
                <p className={`text-2xl font-bold ${
                  estadisticas.saldoNeto >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${estadisticas.saldoNeto.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Clientes con Deuda</p>
                <p className="text-2xl font-bold text-purple-600">
                  {estadisticas.clientesConDeuda}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtro de saldo */}
          <div>
            <select
              value={filtroSaldo}
              onChange={(e) => setFiltroSaldo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos los clientes</option>
              <option value="deudores">Solo deudores (nos deben)</option>
              <option value="acreedores">Solo acreedores (les debemos)</option>
              <option value="saldados">Solo saldados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">
            {loading ? 'Cargando...' : `${clientesFiltrados.length} clientes`}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando cuentas corrientes...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Error: {error}</p>
            <button 
              onClick={loadData}
              className="mt-2 text-blue-600 hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No se encontraron clientes</p>
            <p className="text-sm text-gray-400">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay movimientos en cuentas corrientes'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {clientesFiltrados.map((cliente) => {
              const saldoInfo = formatSaldo(cliente.saldo_total);
              
              return (
                <div key={cliente.cliente_id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {cliente.nombre} {cliente.apellido}
                        </h4>
                        
                        {/* Saldo */}
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${saldoInfo.bgColor} ${saldoInfo.color}`}>
                          {saldoInfo.texto}: ${saldoInfo.valor.toFixed(2)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Último mov: {formatFecha(cliente.ultimo_movimiento)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <CreditCard className="w-4 h-4" />
                          <span>Movimientos: {cliente.total_movimientos || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleVerMovimientos(cliente)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver movimientos"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Registrar pago"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de movimientos del cliente - Simple por ahora */}
      {clienteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  Movimientos de {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                </h3>
                <button
                  onClick={() => setClienteSeleccionado(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-center text-gray-500">
                Lista de movimientos próximamente...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Movimiento - Selector */}
      {showNuevoMovimiento && !tipoMovimiento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Nuevo Movimiento</h3>
                <button
                  onClick={() => setShowNuevoMovimiento(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <button
                  onClick={() => handleSelectTipoMovimiento('pago')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Registrar Pago Recibido</h4>
                      <p className="text-sm text-gray-500">Cliente nos paga una deuda</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectTipoMovimiento('cargo')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Registrar Cargo Manual</h4>
                      <p className="text-sm text-gray-500">Agregar deuda a un cliente</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectTipoMovimiento('ajuste')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calculator className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Ajuste de Cuenta</h4>
                      <p className="text-sm text-gray-500">Corrección o ajuste contable</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Unificado para Movimientos */}
      {tipoMovimiento && (
        <MovimientoModal 
          tipo={tipoMovimiento}
          onClose={handleCerrarMovimiento}
          onSuccess={loadData}
          registrarPagoRecibido={registrarPagoRecibido}
          registrarCargoManual={registrarCargoManual}
        />
      )}
    </div>
  );
};

export default CuentasCorrientesSection;