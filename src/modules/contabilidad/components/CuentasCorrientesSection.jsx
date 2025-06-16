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
  Calculator,
  Building2,
  Minus,
  Edit3,
  UserPlus
} from 'lucide-react';
import { useCuentasCorrientes } from '../hooks/useCuentasCorrientes.js';
import ClienteSelector from '../../ventas/components/ClienteSelector';
import { formatearMonedaGeneral } from '../../../shared/utils/formatters';

const CuentasCorrientesSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSaldo, setFiltroSaldo] = useState('con_deuda'); // 'todos', 'deudores', 'acreedores', 'saldados', 'con_deuda'
  const [estadisticas, setEstadisticas] = useState(null);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState(null); // 'cobro', 'pago', 'ajustar_deuda', 'tomar_deuda'

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
const MovimientoModal = ({ tipo, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [formData, setFormData] = useState({
    monto: '',
    concepto: '',
    observaciones: ''
  });

  // Mock de cuentas del plan de cuentas - TODO: obtener del sistema real
  const cuentasDisponibles = [
    { id: '1', codigo: '1.1.01', nombre: 'Caja' },
    { id: '2', codigo: '1.1.02', nombre: 'Banco Nación c/c' },
    { id: '3', codigo: '1.1.03', nombre: 'Banco Provincia c/c' },
    { id: '4', codigo: '2.1.01', nombre: 'Proveedores' },
    { id: '5', codigo: '2.1.02', nombre: 'Préstamos' },
    { id: '6', codigo: '4.1.01', nombre: 'Gastos Operativos' }
  ];

  const tipoConfig = {
    cobro: {
      titulo: 'Registrar Cobro',
      descripcion: 'Alguien nos paga (reducir su deuda con nosotros)',
      color: 'green',
      icon: TrendingDown,
      conceptoPlaceholder: 'Pago recibido'
    },
    pago: {
      titulo: 'Registrar Pago',
      descripcion: 'Le pagamos a alguien (reducir nuestra deuda)',
      color: 'red', 
      icon: Minus,
      conceptoPlaceholder: 'Pago realizado'
    },
    ajustar_deuda: {
      titulo: 'Ajustar Deuda',
      descripcion: 'Cambiar el monto de deuda a un número fijo',
      color: 'blue',
      icon: Edit3,
      conceptoPlaceholder: 'Ajuste de deuda'
    },
    tomar_deuda: {
      titulo: 'Tomar Deuda',
      descripcion: 'Registrar cuánto tomamos de deuda con alguien',
      color: 'orange',
      icon: TrendingUp,
      conceptoPlaceholder: 'Deuda tomada'
    }
  };

  const config = tipoConfig[tipo];
  const Icon = config.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!personaSeleccionada) {
      alert('Debe seleccionar una persona');
      return;
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      alert('Debe ingresar un monto válido');
      return;
    }

    if (!cuentaSeleccionada) {
      alert('Debe seleccionar una cuenta del plan de cuentas');
      return;
    }

    setLoading(true);
    
    try {
      const movimientoData = {
        persona_id: personaSeleccionada.id,
        cuenta_id: cuentaSeleccionada,
        monto: parseFloat(formData.monto),
        concepto: formData.concepto || config.conceptoPlaceholder,
        observaciones: formData.observaciones,
        fecha: new Date().toISOString().split('T')[0],
        tipo: tipo,
        created_by: 'Usuario' // TODO: Obtener del contexto de usuario
      };

      // TODO: Implementar lógica de registro según tipo
      console.log('Movimiento a registrar:', movimientoData);
      
      if (tipo === 'cobro') {
        alert('✅ Cobro registrado exitosamente');
      } else if (tipo === 'pago') {
        alert('✅ Pago registrado exitosamente');
      } else if (tipo === 'ajustar_deuda') {
        alert('✅ Ajuste de deuda registrado exitosamente');
      } else if (tipo === 'tomar_deuda') {
        alert('✅ Deuda tomada registrada exitosamente');
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
              selectedCliente={personaSeleccionada}
              onSelectCliente={setPersonaSeleccionada}
              required={true}
              placeholder="Seleccionar cliente..."
            />
          </div>

          {/* Cuenta del Plan de Cuentas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cuenta del Plan de Cuentas *
            </label>
            <select
              value={cuentaSeleccionada}
              onChange={(e) => setCuentaSeleccionada(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar cuenta...</option>
              {cuentasDisponibles.map(cuenta => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.codigo} - {cuenta.nombre}
                </option>
              ))}
            </select>
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
              disabled={loading || !personaSeleccionada || !cuentaSeleccionada}
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
                  <span>Registrar {tipo === 'cobro' ? 'Cobro' : tipo === 'pago' ? 'Pago' : tipo === 'ajustar_deuda' ? 'Ajuste' : 'Deuda'}</span>
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
        cumpleFiltro = parseFloat(cliente.saldo_total || 0) < 0; // La empresa les debe
        break;
      case 'acreedores':
        cumpleFiltro = parseFloat(cliente.saldo_total || 0) > 0; // Nos deben a nosotros
        break;
      case 'saldados':
        cumpleFiltro = parseFloat(cliente.saldo_total || 0) === 0;
        break;
      case 'con_deuda':
        cumpleFiltro = parseFloat(cliente.saldo_total || 0) !== 0; // Solo con deuda (cualquier dirección)
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

  const handleVerMovimientos = async (persona) => {
    setPersonaSeleccionada(persona);
    await fetchMovimientosCliente(persona.cliente_id);
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
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl py-10 px-8">
        <div>
          <h2 className="text-4xl font-bold text-white">Cuentas Corrientes</h2>
          <p className="text-purple-100 mt-2 text-lg">Gestión de deudas de la empresa con personas</p>
        </div>
        <button 
          onClick={() => setShowNuevoMovimiento(true)}
          className="bg-white text-purple-700 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors font-bold shadow text-base flex items-center space-x-2"
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
              <div className="p-3 bg-red-100 rounded-lg">
                <Building2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Deudas de la Empresa</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatearMonedaGeneral(estadisticas.totalPorPagar, 'USD')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Créditos a Favor</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatearMonedaGeneral(estadisticas.totalPorCobrar, 'USD')}
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
                  estadisticas.saldoNeto <= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatearMonedaGeneral(Math.abs(estadisticas.saldoNeto), 'USD')}
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
                <p className="text-sm text-gray-600">Personas Registradas</p>
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
              <option value="con_deuda">Solo con deuda</option>
              <option value="deudores">Deudas de la empresa (les debemos)</option>
              <option value="acreedores">Créditos a favor (nos deben)</option>
              <option value="todos">Todas las personas</option>
              <option value="saldados">Saldados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de personas */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">
            {loading ? 'Cargando...' : `${clientesFiltrados.length} personas`}
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
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No se encontraron personas</p>
            <p className="text-sm text-gray-400">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay personas registradas en cuentas corrientes'}
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
                          {saldoInfo.texto}: {formatearMonedaGeneral(saldoInfo.valor, 'USD')}
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
                        onClick={() => setShowNuevoMovimiento(true)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Nuevo movimiento"
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

      {/* Modal de movimientos de la persona - Simple por ahora */}
      {personaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  Movimientos de {personaSeleccionada.nombre} {personaSeleccionada.apellido}
                </h3>
                <button
                  onClick={() => setPersonaSeleccionada(null)}
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
                  onClick={() => handleSelectTipoMovimiento('cobro')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Registrar Cobro</h4>
                      <p className="text-sm text-gray-500">Alguien nos paga (reducir su deuda con nosotros)</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectTipoMovimiento('pago')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Minus className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Registrar Pago</h4>
                      <p className="text-sm text-gray-500">Le pagamos a alguien (reducir nuestra deuda)</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectTipoMovimiento('ajustar_deuda')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Edit3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Ajustar Deuda</h4>
                      <p className="text-sm text-gray-500">Cambiar el monto de deuda a un número fijo</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectTipoMovimiento('tomar_deuda')}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Tomar Deuda</h4>
                      <p className="text-sm text-gray-500">Registrar cuánto tomamos de deuda con alguien</p>
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
        />
      )}
    </div>
  );
};

export default CuentasCorrientesSection;