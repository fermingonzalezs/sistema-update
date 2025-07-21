import React, { useState, useEffect } from 'react';
import { Shield, Search, Download, Mail, BarChart3, Package, CheckCircle, XCircle, Monitor, Smartphone, Box, Eye } from 'lucide-react';
import { useGarantias } from '../../../lib/useGarantiasFix';
import { generarYDescargarGarantiaProducto as abrirGarantiaPDF } from '../../../components/GarantiaPDF_NewStyle';
import LoadingSpinner from '../../../shared/components/base/LoadingSpinner';
import Tarjeta from '../../../shared/components/layout/Tarjeta';
import { formatearMonto } from '../../../shared/utils/formatters';

const GarantiasSection = () => {
  const {
    garantias,
    estadisticas,
    valorEquiposGarantizados,
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
    tipoBusqueda: 'cliente', // 'serial' o 'cliente'
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
        numero_serie: garantia.serial_producto,
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
      case 'computadora': return <Monitor className="w-4 h-4 text-slate-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-slate-600" />;
      default: return <Box className="w-4 h-4 text-slate-600" />;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Activa': return 'text-slate-800 bg-slate-100';
      case 'Vencida': return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando garantías..." size="medium" />;
  }

  return (
    <div className="bg-slate-50 w-full min-w-0">
      <div className="bg-white rounded border border-slate-200 mb-6">
        {/* Header */}
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Gestión de Garantías</h2>
                <p className="text-slate-300 mt-1">Control y administración de garantías de productos</p>
              </div>
            </div>
            <button
              onClick={refrescarDatos}
              className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600 transition-colors flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Dashboard de Estadísticas usando Tarjeta */}
        {estadisticas && (
          <div className="p-6 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Tarjeta 
                icon={Package}
                titulo="Total Garantías"
                valor={estadisticas.totalGarantias || 0}
              />
              <Tarjeta 
                icon={CheckCircle}
                titulo="Garantías Activas"
                valor={estadisticas.garantiasActivas || 0}
              />
              <Tarjeta 
                icon={XCircle}
                titulo="Garantías Vencidas"
                valor={estadisticas.garantiasVencidas || 0}
              />
              <Tarjeta 
                icon={BarChart3}
                titulo="Valor Equipos Garantizados"
                valor={formatearMonto(valorEquiposGarantizados, 'USD')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filtros y Búsqueda */}
      <div className="p-6 bg-white border border-slate-200 rounded mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tipo de búsqueda */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Buscar por</label>
            <select
              value={filtros.tipoBusqueda}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipoBusqueda: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="serial">Número de Serie</option>
              <option value="cliente">Nombre Cliente</option>
            </select>
          </div>

          {/* Campo de búsqueda */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {filtros.tipoBusqueda === 'serial' ? 'Serial' : 'Cliente'}
            </label>
            <div className="flex">
              <input
                type="text"
                value={filtros.busqueda}
                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                placeholder={filtros.tipoBusqueda === 'serial' ? 'Ej: DL123456' : 'Ej: Juan Pérez'}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-l text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
              />
              <button
                onClick={handleBuscar}
                className="px-3 py-2 bg-slate-600 text-white rounded-r hover:bg-slate-700 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filtro por tipo de producto */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Producto</label>
            <select
              value={filtros.tipoProducto}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipoProducto: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="todos">Todos</option>
              <option value="computadora">Computadoras</option>
              <option value="celular">Celulares</option>
              <option value="otro">Otros</option>
            </select>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select
              value={filtros.estadoGarantia}
              onChange={(e) => setFiltros(prev => ({ ...prev, estadoGarantia: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
        <div className="p-4 bg-slate-100 border-l-4 border-slate-400 rounded mb-6">
          <span className="text-slate-800">{error}</span>
        </div>
      )}

      {/* Tabla de Garantías - Responsiva */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        {/* Vista de tabla para desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Serial</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Garantía</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {garantiasFiltradas.map((garantia) => (
                <tr key={garantia.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-slate-900 truncate">{garantia.cliente_nombre}</div>
                      <div className="text-sm text-slate-500 truncate">{garantia.cliente_telefono}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center max-w-xs">
                      {getIconoProducto(garantia.tipo_producto)}
                      <div className="ml-2 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{garantia.modelo_producto}</div>
                        <div className="text-sm text-slate-500 capitalize truncate">{garantia.tipo_producto}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-mono text-slate-900 max-w-28 truncate" title={garantia.serial_producto}>{garantia.serial_producto}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">{formatearFecha(garantia.fecha_venta)}</div>
                    <div className="text-sm text-slate-500 truncate">#{garantia.numero_transaccion}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-900">{garantia.tipo_garantia || 'Update'}</div>
                    <div className="text-sm text-slate-500">
                      {formatearFecha(garantia.fecha_vencimiento)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {garantia.dias_restantes > 0 ? `${garantia.dias_restantes}d` : 'Vencida'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getEstadoColor(garantia.estado_garantia)}`}>
                      {garantia.estado_garantia}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => manejarAbrirGarantia(garantia)}
                      disabled={descargando === garantia.id}
                      className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-100 disabled:opacity-50"
                      title="Ver certificado de garantía"
                    >
                      {descargando === garantia.id ? (
                        <LoadingSpinner size="small" showText={false} />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista de cards para móviles */}
        <div className="md:hidden">
          {garantiasFiltradas.map((garantia) => (
            <div key={garantia.id} className="border-b border-slate-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  {getIconoProducto(garantia.tipo_producto)}
                  <div>
                    <div className="text-sm font-medium text-slate-900">{garantia.cliente_nombre}</div>
                    <div className="text-xs text-slate-500">{garantia.cliente_telefono}</div>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getEstadoColor(garantia.estado_garantia)}`}>
                  {garantia.estado_garantia}
                </span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-slate-900">{garantia.modelo_producto}</div>
                  <div className="text-xs text-slate-500 capitalize">{garantia.tipo_producto}</div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-slate-500">Serial:</div>
                    <div className="text-sm font-mono text-slate-900">{garantia.serial_producto}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Vence:</div>
                    <div className="text-sm text-slate-900">{formatearFecha(garantia.fecha_vencimiento)}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-slate-500">
                    #{garantia.numero_transaccion} • {formatearFecha(garantia.fecha_venta)}
                  </div>
                  <button
                    onClick={() => manejarAbrirGarantia(garantia)}
                    disabled={descargando === garantia.id}
                    className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-100 disabled:opacity-50"
                    title="Ver certificado de garantía"
                  >
                    {descargando === garantia.id ? (
                      <LoadingSpinner size="small" showText={false} />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

          {garantiasFiltradas.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600">No se encontraron garantías</p>
              <p className="text-sm text-slate-500">Intenta modificar los filtros de búsqueda</p>
            </div>
          )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Mostrando {garantiasFiltradas.length} de {garantias.length} garantías
          </p>
        </div>
      </div>
    </div>
  );
};

export default GarantiasSection;
