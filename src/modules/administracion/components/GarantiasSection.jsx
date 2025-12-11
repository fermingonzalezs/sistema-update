import React, { useState, useEffect } from 'react';
import { Shield, Filter, Download, BarChart3, Package, CheckCircle, XCircle, Monitor, Smartphone, Box, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useGarantias } from '../../../lib/useGarantiasFix';
import { generarYDescargarGarantiaProducto as abrirGarantiaPDF } from '../../soporte/components/pdf/GarantiaPDF';
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
    // Abrir ventana INMEDIATAMENTE (síncrono con el click)
    const ventanaGarantia = window.open('about:blank', '_blank');

    if (!ventanaGarantia) {
      alert('⚠️ Por favor, permite los popups para ver la garantía en una nueva pestaña.');
      return;
    }

    // Mostrar mensaje de carga en la ventana
    ventanaGarantia.document.write(`
      <html>
        <head>
          <title>Generando Garantía...</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f3f4f6;
            }
            .loader {
              text-align: center;
            }
            .spinner {
              border: 4px solid #e5e7eb;
              border-top: 4px solid #10b981;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h2 {
              color: #1e293b;
              margin: 0 0 10px 0;
            }
            p {
              color: #64748b;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <h2>Generando garantía...</h2>
            <p>Por favor espera un momento</p>
          </div>
        </body>
      </html>
    `);

    setDescargando(garantia.id);

    try {
      console.log('📄 Datos de garantía originales:', garantia);

      const producto = {
        copy: garantia.copy || garantia.modelo_producto || '', // Copy completo con condición incluida
        copy_documento: garantia.copy_documento || garantia.copy || garantia.modelo_producto || '', // Copy limpio para documentos
        tipo_producto: garantia.tipo_producto, // Tipo para saber cómo formatear
        serial_producto: garantia.serial_producto, // Serial para incluir en descripción
        numero_serie: garantia.serial_producto,
        precio_venta_usd: garantia.precio_total,
        garantia: garantia.garantia || garantia.garantia_texto || 'N/A' // Usar el campo garantia o garantia_texto
      };

      console.log('📄 Objeto producto para PDF:', producto);

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
        vendedorCompleto: garantia.vendedor,
        // Remover metodoPago y totales para no mostrarlos en el PDF
        // metodoPago: garantia.metodo_pago,
        // totalPesos: garantia.total_pesos,
        // cotizacionDolar: garantia.cotizacion_dolar
      };

      const resultado = await abrirGarantiaPDF(producto, cliente, datosVenta, ventanaGarantia);

      if (resultado.success) {
        console.log('✅ PDF de garantía:', resultado.mensaje);
      } else {
        alert('❌ Error al generar la garantía: ' + resultado.error);
        if (ventanaGarantia && !ventanaGarantia.closed) {
          ventanaGarantia.close();
        }
      }
    } catch (error) {
      console.error('Error generando garantía:', error);
      alert('❌ Error al generar la garantía. Intente nuevamente.');
      if (ventanaGarantia && !ventanaGarantia.closed) {
        ventanaGarantia.close();
      }
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
      case 'Activa': return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      case 'Vencida': return 'text-slate-700 bg-slate-100 border border-slate-300';
      default: return 'text-slate-600 bg-slate-100 border border-slate-200';
    }
  };

  const getProductDescription = (garantia) => {
    // Prioridad: copy_documento > copy > modelo_producto
    return (garantia.copy_documento && garantia.copy_documento.trim())
      ? garantia.copy_documento
      : (garantia.copy || garantia.modelo_producto || 'Producto sin especificar');
  };

  if (loading) {
    return <LoadingSpinner text="Cargando garantías..." size="medium" />;
  }

  return (
    <div className="bg-slate-50 w-full min-w-0 p-4 md:p-6">
      {/* Header Principal */}
      <div className="bg-white rounded border border-slate-200 mb-6 overflow-hidden">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-600 rounded flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Gestión de Garantías</h2>
                <p className="text-slate-300 text-sm mt-1">Administración y seguimiento de cobertura de productos</p>
              </div>
            </div>
            <button
              onClick={refrescarDatos}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center space-x-2 transition-colors duration-200"
              title="Actualizar datos"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="p-6 border-t border-slate-200 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Tarjeta
                icon={Package}
                titulo="Total"
                valor={estadisticas.totalGarantias || 0}
              />
              <Tarjeta
                icon={CheckCircle}
                titulo="Activas"
                valor={estadisticas.garantiasActivas || 0}
              />
              <Tarjeta
                icon={XCircle}
                titulo="Vencidas"
                valor={estadisticas.garantiasVencidas || 0}
              />
              <Tarjeta
                icon={BarChart3}
                titulo="Valor Total USD"
                valor={formatearMonto(valorEquiposGarantizados, 'USD')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded border border-slate-200 mb-6 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center space-x-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Filtros</h3>
        </div>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tipo de búsqueda */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Buscar por</label>
              <select
                value={filtros.tipoBusqueda}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipoBusqueda: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="serial">Número de Serie</option>
                <option value="cliente">Nombre Cliente</option>
              </select>
            </div>

            {/* Campo de búsqueda */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                {filtros.tipoBusqueda === 'serial' ? 'Serial' : 'Cliente'}
              </label>
              <input
                type="text"
                value={filtros.busqueda}
                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                placeholder={filtros.tipoBusqueda === 'serial' ? 'Ej: DL123456' : 'Ej: Juan Pérez'}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
              />
            </div>

            {/* Filtro por tipo de producto */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Tipo Producto</label>
              <select
                value={filtros.tipoProducto}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipoProducto: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="todos">Todos</option>
                <option value="computadora">Computadoras</option>
                <option value="celular">Celulares</option>
                <option value="otro">Otros</option>
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Estado</label>
              <select
                value={filtros.estadoGarantia}
                onChange={(e) => setFiltros(prev => ({ ...prev, estadoGarantia: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="todos">Todos</option>
                <option value="Activa">Activas</option>
                <option value="Vencida">Vencidas</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-slate-100 border border-slate-300 rounded mb-6 text-slate-800">
          <p className="text-sm font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* Tabla de Garantías */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        {/* Vista de tabla para desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Producto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Serial</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Garantía</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {garantiasFiltradas.map((garantia, idx) => (
                <tr key={garantia.id} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-white'} style={{ transition: 'background-color 0.15s' }}>
                  <td className="px-4 py-3 text-center">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{garantia.cliente_nombre}</div>
                      <div className="text-xs text-slate-500 mt-1">{garantia.cliente_telefono}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center max-w-xs">
                      <div className="flex-shrink-0">
                        {getIconoProducto(garantia.tipo_producto)}
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 truncate" title={getProductDescription(garantia)}>{getProductDescription(garantia)}</div>
                        <div className="text-xs text-slate-500 capitalize truncate">{garantia.tipo_producto}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded inline-block">{garantia.serial_producto}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm font-medium text-slate-900">{formatearFecha(garantia.fecha_venta)}</div>
                    <div className="text-xs text-slate-500 mt-1">#{garantia.numero_transaccion}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm font-medium text-slate-900">{garantia.garantia_texto || 'N/A'}</div>
                    <div className="text-xs text-slate-500 mt-1">Vence: {formatearFecha(garantia.fecha_vencimiento)}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded ${getEstadoColor(garantia.estado_garantia)}`}>
                      {garantia.estado_garantia}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => manejarAbrirGarantia(garantia)}
                      disabled={descargando === garantia.id}
                      className="inline-flex items-center justify-center space-x-1 px-3 py-2 rounded text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                      title="Ver certificado de garantía"
                    >
                      {descargando === garantia.id ? (
                        <LoadingSpinner size="small" showText={false} />
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-medium">Ver</span>
                        </>
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
            <div key={garantia.id} className="border-b border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  {getIconoProducto(garantia.tipo_producto)}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">{garantia.cliente_nombre}</div>
                    <div className="text-xs text-slate-500 mt-1">{garantia.cliente_telefono}</div>
                  </div>
                </div>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded flex-shrink-0 ${getEstadoColor(garantia.estado_garantia)}`}>
                  {garantia.estado_garantia}
                </span>
              </div>

              <div className="space-y-3 mt-3 pt-3 border-t border-slate-200">
                <div>
                  <div className="text-sm font-medium text-slate-900 break-words">{getProductDescription(garantia)}</div>
                  <div className="text-xs text-slate-500 capitalize mt-1">{garantia.tipo_producto}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-600 uppercase">Serial</div>
                    <div className="text-sm font-mono text-slate-900 mt-1">{garantia.serial_producto}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-600 uppercase">Vence</div>
                    <div className="text-sm text-slate-900 mt-1">{formatearFecha(garantia.fecha_vencimiento)}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    #{garantia.numero_transaccion}
                  </div>
                  <button
                    onClick={() => manejarAbrirGarantia(garantia)}
                    disabled={descargando === garantia.id}
                    className="inline-flex items-center justify-center space-x-1 px-3 py-2 rounded text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    {descargando === garantia.id ? (
                      <LoadingSpinner size="small" showText={false} />
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-medium">Ver</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {garantiasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="text-slate-700 font-medium">No se encontraron garantías</p>
            <p className="text-slate-500 text-sm mt-1">Intenta modificar los filtros de búsqueda</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{garantiasFiltradas.length}</span> de <span className="font-semibold text-slate-800">{garantias.length}</span> garantías
          </p>
        </div>
      </div>
    </div>
  );
};

export default GarantiasSection;
