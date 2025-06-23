import React, { useState, useEffect } from 'react';
import { Shield, Search, Download, Mail, BarChart3, Package, CheckCircle, XCircle, Monitor, Smartphone, Box, Eye } from 'lucide-react';
import { useGarantias } from '../hooks/useGarantias';
import { abrirGarantiaPDF } from '../../../components/GarantiaPDF_NUEVO';

const GarantiasSection = () => {
  const {
    garantias,
    estadisticas,
    loading,
    error,
    fetchGarantias,
    buscarPorSerial,
    buscarPorCliente,
    refrescarDatos
  } = useGarantias();

  // Estados para filtros y búsqueda
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipoBusqueda: 'serial', // 'serial' o 'cliente'
    tipoProducto: 'todos',
    estadoGarantia: 'todos'
  });

  const [descargando, setDescargando] = useState(null);

  // Cargar datos al inicializar
  useEffect(() => {
    console.log('🚀 Cargando sección de garantías...');
    refrescarDatos();
  }, []);

  // Aplicar filtros localmente
  const garantiasFiltradas = garantias.filter(garantia => {
    let cumpleFiltro = true;

    // Filtro de búsqueda
    if (filtros.busqueda.trim()) {
      const busqueda = filtros.busqueda.toLowerCase();
      if (filtros.tipoBusqueda === 'serial') {
        cumpleFiltro = garantia.serial_producto?.toLowerCase().includes(busqueda);
      } else {
        cumpleFiltro = garantia.cliente_nombre?.toLowerCase().includes(busqueda);
      }
    }

    // Filtro por tipo de producto
    if (filtros.tipoProducto !== 'todos') {
      cumpleFiltro = cumpleFiltro && garantia.tipo_producto === filtros.tipoProducto;
    }

    // Filtro por estado de garantía
    if (filtros.estadoGarantia !== 'todos') {
      cumpleFiltro = cumpleFiltro && garantia.estado_garantia === filtros.estadoGarantia;
    }

    return cumpleFiltro;
  });

  // Handlers
  const handleBuscar = async () => {
    if (!filtros.busqueda.trim()) {
      await fetchGarantias();
      return;
    }

    if (filtros.tipoBusqueda === 'serial') {
      await buscarPorSerial(filtros.busqueda);
    } else {
      await buscarPorCliente(filtros.busqueda);
    }
  };

  const manejarAbrirGarantia = async (garantia) => {
    setDescargando(garantia.id);
    
    try {
      const producto = {
        modelo: garantia.modelo_producto,
        serial: garantia.serial_producto,
        precio_venta_usd: garantia.precio_total,
        garantia_update: garantia.plazo_garantia
      };

      const cliente = {
        nombre: garantia.cliente_nombre,
        telefono: garantia.cliente_telefono,
        email: garantia.cliente_email,
        dni: garantia.cliente_dni,
        direccion: garantia.cliente_direccion
      };

      const datosVenta = {
        numeroTransaccion: garantia.numero_transaccion,
        fechaVenta: garantia.fecha_venta,
        vendedor: garantia.vendedor,
        vendedorCompleto: garantia.vendedor, // Aquí podrías mapear a nombre completo si tienes la data
        metodoPago: garantia.metodo_pago,
        totalPesos: garantia.total_pesos, // Si está disponible
        cotizacionDolar: garantia.cotizacion_dolar // Si está disponible
      };

      const resultado = await abrirGarantiaPDF(producto, cliente, datosVenta);
      
      if (resultado.success) {
        // Mostrar mensaje de éxito brevemente
        setTimeout(() => {
          console.log('✅ PDF de garantía:', resultado.mensaje);
        }, 100);
      } else {
        alert('❌ Error al generar la garantía: ' + resultado.error);
      }
    } catch (error) {
      console.error('Error generando garantía:', error);
      alert('❌ Error al generar la garantía. Intente nuevamente.');
    } finally {
      setDescargando(null);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const getIconoProducto = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4 text-blue-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-green-600" />;
      default: return <Box className="w-4 h-4 text-purple-600" />;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Activa': return 'text-green-600 bg-green-100';
      case 'Vencida': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando garantías...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Shield size={28} />
              <div>
                <h2 className="text-4xl font-bold">Gestión de Garantías</h2>
                <p className="text-blue-100 mt-1">Control y administración de garantías de productos</p>
              </div>
            </div>
            <button
              onClick={refrescarDatos}
              className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Dashboard de Estadísticas */}
        {estadisticas && (
          <div className="p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-500 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Garantías</p>
                    <p className="text-2xl font-bold">{estadisticas.totalGarantias || 0}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-green-500 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Garantías Activas</p>
                    <p className="text-2xl font-bold">{estadisticas.garantiasActivas || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-red-500 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Garantías Vencidas</p>
                    <p className="text-2xl font-bold">{estadisticas.garantiasVencidas || 0}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-200" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Tipo de búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por</label>
              <select
                value={filtros.tipoBusqueda}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipoBusqueda: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="serial">Número de Serie</option>
                <option value="cliente">Nombre Cliente</option>
              </select>
            </div>

            {/* Campo de búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filtros.tipoBusqueda === 'serial' ? 'Serial' : 'Cliente'}
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  placeholder={filtros.tipoBusqueda === 'serial' ? 'Ej: DL123456' : 'Ej: Juan Pérez'}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                />
                <button
                  onClick={handleBuscar}
                  className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filtro por tipo de producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Producto</label>
              <select
                value={filtros.tipoProducto}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipoProducto: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="todos">Todos</option>
                <option value="computadora">Computadoras</option>
                <option value="celular">Celulares</option>
                <option value="otro">Otros</option>
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filtros.estadoGarantia}
                onChange={(e) => setFiltros(prev => ({ ...prev, estadoGarantia: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="todos">Todos</option>
                <option value="Activa">Activas</option>
                <option value="Vencida">Vencidas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Tabla de Garantías */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Compra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Garantía</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {garantiasFiltradas.map((garantia) => (
                <tr key={garantia.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{garantia.cliente_nombre}</div>
                      <div className="text-sm text-gray-500">{garantia.cliente_telefono}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getIconoProducto(garantia.tipo_producto)}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{garantia.modelo_producto}</div>
                        <div className="text-sm text-gray-500 capitalize">{garantia.tipo_producto}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">{garantia.serial_producto}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatearFecha(garantia.fecha_venta)}</div>
                    <div className="text-sm text-gray-500">#{garantia.numero_transaccion}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{garantia.tipo_garantia || 'Update'}</div>
                    <div className="text-sm text-gray-500">
                      Vence: {formatearFecha(garantia.fecha_vencimiento)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {garantia.dias_restantes > 0 ? `${garantia.dias_restantes} días restantes` : 'Vencida'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(garantia.estado_garantia)}`}>
                      {garantia.estado_garantia}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => manejarAbrirGarantia(garantia)}
                        disabled={descargando === garantia.id}
                        className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50 disabled:opacity-50"
                        title="Ver certificado de garantía"
                      >
                        {descargando === garantia.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {garantiasFiltradas.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No se encontraron garantías</p>
              <p className="text-sm text-gray-500">Intenta modificar los filtros de búsqueda</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <p className="text-sm text-gray-600">
            Mostrando {garantiasFiltradas.length} de {garantias.length} garantías
          </p>
        </div>
      </div>
    </div>
  );
};

export default GarantiasSection;