import React, { useState, useEffect } from 'react';
import { X, Filter, ChevronDown } from 'lucide-react';
import { useCatalogoUnificado } from '../hooks/useCatalogoUnificado';
import { cotizacionSimple } from '../../../services/cotizacionSimpleService';

// Función para formatear precios en USD sin decimales con prefijo U$
const formatPriceUSD = (price) => {
  const numPrice = parseFloat(price) || 0;
  return `U$${Math.round(numPrice)}`;
};

// Función para generar copy compacto unificado
const generateUnifiedCopy = (producto, categoria, cotizacionDolar) => {
  let copy = '';
  
  switch (categoria) {
    case 'notebooks':
      const modelo = producto.modelo || '';
      const procesador = producto.procesador || '';
      const ram = producto.ram ? `${producto.ram}GB RAM` : '';
      const tipoRam = producto.tipo_ram ? `${producto.tipo_ram}` : '';
      const ssd = producto.ssd ? `${producto.ssd}GB SSD` : '';
      const hdd = producto.hdd ? `${producto.hdd}GB HDD` : '';
      const pantalla = producto.pantalla ? `${producto.pantalla}"` : '';
      const resolucion = producto.resolucion || '';
      const refresh = producto.refresh_rate ? `${producto.refresh_rate}` : '';
      const touchscreen = producto.touchscreen ? 'Touchscreen' : '';
      const gpu = producto.gpu || '';
      const vram = producto.vram ? `${producto.vram}GB VRAM` : '';
      const so = producto.so || '';
      const teclado = producto.teclado || '';
      const idiomaTeclado = producto.idioma_teclado || '';
      const color = producto.color || '';
      const bateria = producto.bateria || '';
      const duracionBateria = producto.duracion_bateria || '';
      const sucursal = producto.sucursal ? producto.sucursal.replace('_', ' ').toUpperCase() : '';
      const fallas = producto.fallas ? `Fallas: ${producto.fallas}` : '';
      
      const memoria = [ram, tipoRam].filter(Boolean).join(' ');
      const almacenamiento = [ssd, hdd].filter(Boolean).join(' + ');
      const infoPantalla = [pantalla, refresh, resolucion, touchscreen].filter(Boolean).join(' ');
      const infoGpu = [gpu, vram].filter(Boolean).join(' ');
      const infoTeclado = [teclado, idiomaTeclado].filter(Boolean).join(' ');
      const infoBateria = [bateria, duracionBateria].filter(Boolean).join(' ');
      const infoGeneral = [so, infoTeclado, color, infoBateria, sucursal, fallas].filter(Boolean).join(' - ');
      
      copy = [modelo, procesador, memoria, almacenamiento, infoPantalla, infoGpu, infoGeneral]
        .filter(Boolean)
        .join(' - ');
      break;

    case 'celulares':
      copy = [
        producto.marca,
        producto.modelo,
        producto.capacidad || '',
        producto.condicion ? `Estado: ${producto.condicion}` : '',
        producto.estado ? `Condición: ${producto.estado}` : '',
        producto.bateria ? `Batería: ${producto.bateria}` : '',
        producto.color ? `Color: ${producto.color}` : '',
        producto.garantia_update ? `Garantía: ${producto.garantia_update}` : '',
        producto.sucursal ? producto.sucursal.replace('_', ' ').toUpperCase() : ''
      ].filter(Boolean).join(' - ');
      break;

    case 'otros':
      copy = [
        producto.descripcion_producto,
        producto.marca,
        producto.categoria,
        producto.especificaciones_otro || '',
        producto.modelo_otro || '',
        producto.ubicacion_otro ? producto.ubicacion_otro.replace('_', ' ').toUpperCase() : ''
      ].filter(Boolean).join(' - ');
      break;
    
    // Nuevas categorías de productos unificados
    case 'desktop':
      const specs = producto.especificaciones || {};
      copy = [
        producto.nombre,
        producto.marca,
        specs.procesador || '',
        specs.ram || '',
        specs.almacenamiento || '',
        specs.gpu || '',
        producto.ubicacion ? producto.ubicacion.replace('_', ' ').toUpperCase() : ''
      ].filter(Boolean).join(' - ');
      break;
      
    case 'tablets':
      const tabletSpecs = producto.especificaciones || {};
      copy = [
        producto.nombre,
        producto.marca,
        tabletSpecs.pantalla || '',
        tabletSpecs.procesador || '',
        tabletSpecs.almacenamiento || '',
        tabletSpecs.bateria || '',
        producto.ubicacion ? producto.ubicacion.replace('_', ' ').toUpperCase() : ''
      ].filter(Boolean).join(' - ');
      break;
      
    case 'gpu':
      const gpuSpecs = producto.especificaciones || {};
      copy = [
        producto.nombre,
        producto.marca,
        gpuSpecs.memoria || '',
        gpuSpecs.boost_clock || '',
        gpuSpecs.tdp || '',
        gpuSpecs.conectores || '',
        producto.ubicacion ? producto.ubicacion.replace('_', ' ').toUpperCase() : ''
      ].filter(Boolean).join(' - ');
      break;
      
    case 'apple':
      const appleSpecs = producto.especificaciones || {};
      copy = [
        producto.nombre,
        producto.marca,
        appleSpecs.procesador || '',
        appleSpecs.almacenamiento || '',
        appleSpecs.pantalla || '',
        appleSpecs.color || '',
        producto.ubicacion ? producto.ubicacion.replace('_', ' ').toUpperCase() : ''
      ].filter(Boolean).join(' - ');
      break;
      
    case 'componentes':
      const componenteSpecs = producto.especificaciones || {};
      copy = [
        producto.nombre,
        producto.marca,
        componenteSpecs.capacidad || componenteSpecs.nucleos || componenteSpecs.potencia || '',
        componenteSpecs.frecuencia || componenteSpecs.socket || componenteSpecs.certificacion || '',
        componenteSpecs.tipo || componenteSpecs.interfaz || componenteSpecs.modular || '',
        producto.ubicacion ? producto.ubicacion.replace('_', ' ').toUpperCase() : ''
      ].filter(Boolean).join(' - ');
      break;
      
    case 'audio':
      const audioSpecs = producto.especificaciones || {};
      copy = [
        producto.nombre,
        producto.marca,
        audioSpecs.tipo || audioSpecs.configuracion || '',
        audioSpecs.drivers || audioSpecs.potencia || '',
        audioSpecs.conectividad || audioSpecs.impedancia || '',
        audioSpecs.peso || audioSpecs.dimensiones || '',
        producto.ubicacion ? producto.ubicacion.replace('_', ' ').toUpperCase() : ''
      ].filter(Boolean).join(' - ');
      break;

    default:
      // Para categorías específicas de "otros" (ej: otros-placas-de-video)
      if (categoria.startsWith('otros-')) {
        copy = [
          producto.descripcion_producto,
          producto.marca,
          producto.especificaciones_otro || '',
          producto.modelo_otro || '',
          producto.ubicacion_otro ? producto.ubicacion_otro.replace('_', ' ').toUpperCase() : ''
        ].filter(Boolean).join(' - ');
      } else {
        copy = producto.modelo || producto.descripcion_producto || 'Producto sin descripción';
      }
  }

  return copy;
};

// Modal de detalle unificado
const ModalDetalleUnificado = ({ open, producto, categoria, onClose, cotizacionDolar }) => {
  if (!open || !producto) return null;

  const renderCamposPorCategoria = () => {
    switch (categoria) {
      case 'notebooks':
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Hardware</h3>
              <div className="space-y-2 text-slate-900">
                <div><strong>Procesador:</strong> {producto.procesador}</div>
                <div><strong>RAM:</strong> {producto.ram} {producto.tipo_ram}</div>
                <div><strong>SSD:</strong> {producto.ssd}</div>
                <div><strong>HDD:</strong> {producto.hdd}</div>
                <div><strong>GPU:</strong> {producto.gpu}</div>
                <div><strong>VRAM:</strong> {producto.vram}</div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Pantalla</h3>
              <div className="space-y-2 text-slate-900">
                <div><strong>Tamaño:</strong> {producto.pantalla}"</div>
                <div><strong>Resolución:</strong> {producto.resolucion}</div>
                <div><strong>Refresh Rate:</strong> {producto.refresh_rate}</div>
                <div><strong>Touchscreen:</strong> {producto.touchscreen || 'No'}</div>
              </div>
            </div>
          </>
        );

      case 'celulares':
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Especificaciones</h3>
              <div className="space-y-2 text-slate-900">
                <div><strong>Capacidad:</strong> {producto.capacidad}</div>
                <div><strong>Condición:</strong> {producto.condicion}</div>
                <div><strong>Estado:</strong> {producto.estado}</div>
                <div><strong>Batería:</strong> {producto.bateria}</div>
                <div><strong>Ciclos:</strong> {producto.ciclos}</div>
                <div><strong>Color:</strong> {producto.color}</div>
                <div><strong>Garantía Update:</strong> {producto.garantia_update}</div>
                <div><strong>Garantía Oficial:</strong> {producto.garantia_oficial}</div>
                {producto.fallas && <div><strong>Fallas:</strong> {producto.fallas}</div>}
              </div>
            </div>
          </>
        );

      case 'otros':
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Descripción del Producto</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-800 text-lg leading-relaxed">
                  {producto.descripcion_producto}
                </p>
              </div>
            </div>
          </>
        );
      
      case 'desktop':
        const desktopSpecs = producto.especificaciones || {};
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Especificaciones Hardware</h3>
              <div className="space-y-2 text-slate-900">
                <div><strong>Procesador:</strong> {desktopSpecs.procesador || 'N/A'}</div>
                <div><strong>RAM:</strong> {desktopSpecs.ram || 'N/A'}</div>
                <div><strong>Almacenamiento:</strong> {desktopSpecs.almacenamiento || 'N/A'}</div>
                <div><strong>GPU:</strong> {desktopSpecs.gpu || 'N/A'}</div>
                <div><strong>Motherboard:</strong> {desktopSpecs.motherboard || 'N/A'}</div>
                <div><strong>Fuente:</strong> {desktopSpecs.fuente || 'N/A'}</div>
                <div><strong>Gabinete:</strong> {desktopSpecs.gabinete || 'N/A'}</div>
              </div>
            </div>
          </>
        );
      
      case 'tablets':
        const tabletSpecs = producto.especificaciones || {};
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Especificaciones Técnicas</h3>
              <div className="space-y-2 text-slate-900">
                <div><strong>Pantalla:</strong> {tabletSpecs.pantalla || 'N/A'}</div>
                <div><strong>Resolución:</strong> {tabletSpecs.resolucion || 'N/A'}</div>
                <div><strong>Procesador:</strong> {tabletSpecs.procesador || 'N/A'}</div>
                <div><strong>Almacenamiento:</strong> {tabletSpecs.almacenamiento || 'N/A'}</div>
                <div><strong>RAM:</strong> {tabletSpecs.ram || 'N/A'}</div>
                <div><strong>Batería:</strong> {tabletSpecs.bateria || 'N/A'}</div>
                <div><strong>Peso:</strong> {tabletSpecs.peso || 'N/A'}</div>
                <div><strong>Color:</strong> {tabletSpecs.color || 'N/A'}</div>
              </div>
            </div>
          </>
        );
      
      case 'gpu':
        const gpuSpecs = producto.especificaciones || {};
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Especificaciones GPU</h3>
              <div className="space-y-2 text-slate-900">
                <div><strong>Memoria:</strong> {gpuSpecs.memoria || 'N/A'}</div>
                <div><strong>Bus:</strong> {gpuSpecs.bus || 'N/A'}</div>
                <div><strong>Boost Clock:</strong> {gpuSpecs.boost_clock || 'N/A'}</div>
                <div><strong>TDP:</strong> {gpuSpecs.tdp || 'N/A'}</div>
                <div><strong>Conectores:</strong> {gpuSpecs.conectores || 'N/A'}</div>
                <div><strong>Puertos:</strong> {gpuSpecs.puertos || 'N/A'}</div>
                <div><strong>Arquitectura:</strong> {gpuSpecs.arquitectura || 'N/A'}</div>
              </div>
            </div>
          </>
        );
      
      case 'apple':
        const appleSpecs = producto.especificaciones || {};
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Especificaciones Apple</h3>
              <div className="space-y-2 text-slate-900">
                <div><strong>Procesador:</strong> {appleSpecs.procesador || appleSpecs.chip || 'N/A'}</div>
                <div><strong>Almacenamiento:</strong> {appleSpecs.almacenamiento || 'N/A'}</div>
                <div><strong>RAM:</strong> {appleSpecs.ram || 'N/A'}</div>
                <div><strong>Pantalla:</strong> {appleSpecs.pantalla || 'N/A'}</div>
                <div><strong>Resolución:</strong> {appleSpecs.resolucion || 'N/A'}</div>
                <div><strong>Batería:</strong> {appleSpecs.bateria || 'N/A'}</div>
                <div><strong>Color:</strong> {appleSpecs.color || 'N/A'}</div>
                <div><strong>Peso:</strong> {appleSpecs.peso || 'N/A'}</div>
              </div>
            </div>
          </>
        );
      
      case 'componentes':
        const componenteSpecs = producto.especificaciones || {};
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Especificaciones Técnicas</h3>
              <div className="space-y-2 text-slate-900">
                {componenteSpecs.nucleos && <div><strong>Núcleos:</strong> {componenteSpecs.nucleos}</div>}
                {componenteSpecs.threads && <div><strong>Threads:</strong> {componenteSpecs.threads}</div>}
                {componenteSpecs.base_clock && <div><strong>Base Clock:</strong> {componenteSpecs.base_clock}</div>}
                {componenteSpecs.boost_clock && <div><strong>Boost Clock:</strong> {componenteSpecs.boost_clock}</div>}
                {componenteSpecs.socket && <div><strong>Socket:</strong> {componenteSpecs.socket}</div>}
                {componenteSpecs.capacidad && <div><strong>Capacidad:</strong> {componenteSpecs.capacidad}</div>}
                {componenteSpecs.tipo && <div><strong>Tipo:</strong> {componenteSpecs.tipo}</div>}
                {componenteSpecs.frecuencia && <div><strong>Frecuencia:</strong> {componenteSpecs.frecuencia}</div>}
                {componenteSpecs.interfaz && <div><strong>Interfaz:</strong> {componenteSpecs.interfaz}</div>}
                {componenteSpecs.potencia && <div><strong>Potencia:</strong> {componenteSpecs.potencia}</div>}
                {componenteSpecs.certificacion && <div><strong>Certificación:</strong> {componenteSpecs.certificacion}</div>}
                {componenteSpecs.modular && <div><strong>Modular:</strong> {componenteSpecs.modular}</div>}
              </div>
            </div>
          </>
        );
      
      case 'audio':
        const audioSpecs = producto.especificaciones || {};
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Especificaciones Audio</h3>
              <div className="space-y-2 text-slate-900">
                <div><strong>Tipo:</strong> {audioSpecs.tipo || audioSpecs.configuracion || 'N/A'}</div>
                <div><strong>Drivers:</strong> {audioSpecs.drivers || 'N/A'}</div>
                <div><strong>Potencia:</strong> {audioSpecs.potencia || 'N/A'}</div>
                <div><strong>Conectividad:</strong> {audioSpecs.conectividad || 'N/A'}</div>
                <div><strong>Impedancia:</strong> {audioSpecs.impedancia || 'N/A'}</div>
                <div><strong>Respuesta Freq:</strong> {audioSpecs.respuesta_freq || 'N/A'}</div>
                <div><strong>Peso:</strong> {audioSpecs.peso || 'N/A'}</div>
                <div><strong>Color:</strong> {audioSpecs.color || 'N/A'}</div>
              </div>
            </div>
          </>
        );

      default:
        return <div>Información no disponible</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-hidden flex">
        
        {/* Panel izquierdo */}
        <div className="w-1/3 bg-slate-800 text-white p-6 border-r-4 border-slate-800">
          <div className="space-y-6">
            
            <div className="text-center pb-4 border-b border-slate-600">
              <h2 className="text-xl font-bold">{producto.modelo || producto.descripcion_producto}</h2>
              <p className="text-slate-300 text-sm">{producto.marca}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-200">CONDICIÓN</h3>
              <div className="bg-slate-700 p-3 rounded-lg">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  producto.condicion === 'excelente' ? 'bg-green-600 text-white' :
                  producto.condicion === 'muy bueno' ? 'bg-blue-600 text-white' :
                  producto.condicion === 'bueno' ? 'bg-yellow-600 text-white' :
                  producto.condicion === 'regular' ? 'bg-orange-600 text-white' :
                  producto.condicion === 'malo' ? 'bg-red-600 text-white' :
                  'bg-slate-600 text-white'
                }`}>
                  {producto.condicion?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-200">UBICACIÓN</h3>
              <div className="bg-slate-700 p-3 rounded-lg">
                <p className="text-white font-medium">
                  {(producto.sucursal || producto.ubicacion || producto.ubicacion_otro || 'N/A')?.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>

            {(producto.garantia_update || producto.garantia) && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-200">GARANTÍA</h3>
                <div className="bg-slate-700 p-3 rounded-lg space-y-2">
                  {producto.garantia_update && (
                    <div>
                      <span className="text-slate-300">Update:</span>
                      <span className="text-white ml-2 font-medium">{producto.garantia_update}</span>
                    </div>
                  )}
                  {producto.garantia_oficial && (
                    <div>
                      <span className="text-slate-300">Oficial:</span>
                      <span className="text-white ml-2 font-medium">{producto.garantia_oficial}</span>
                    </div>
                  )}
                  {producto.garantia && !producto.garantia_update && (
                    <div>
                      <span className="text-white font-medium">{producto.garantia}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <p className="text-slate-300 text-sm">Precio de Venta</p>
              <p className="text-2xl font-bold text-green-400">{formatPriceUSD(producto.precio_venta_usd)}</p>
              <p className="text-slate-300 text-sm">
                ${Math.round(producto.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}
              </p>
            </div>

          </div>
        </div>

        {/* Panel derecho */}
        <div className="w-2/3 bg-white p-6 overflow-y-auto">
          
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-slate-900">Información Completa</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-slate-600 px-3 py-2 rounded">Información Básica</h3>
              <div className="space-y-2 text-slate-900">
                <div><strong>Serial:</strong> {producto.serial || 'N/A'}</div>
                <div><strong>Fecha Ingreso:</strong> {producto.fecha_ingreso || 'N/A'}</div>
                {producto.fallas && <div><strong>Fallas:</strong> {producto.fallas}</div>}
              </div>
            </div>

            {renderCamposPorCategoria()}

          </div>
        </div>
      </div>
    </div>
  );
};

const Catalogo = ({ onAddToCart }) => {
  const {
    categoriaActiva,
    categoriaConfig,
    categorias,
    datos,
    loading,
    error,
    filtros,
    ordenamiento,
    valoresUnicos,
    cambiarCategoria,
    actualizarFiltro,
    limpiarFiltros,
    actualizarOrdenamiento,
    eliminarProducto,
    totalProductos,
    productosFiltrados,
    hayFiltrosActivos
  } = useCatalogoUnificado();

  const [cotizacionDolar, setCotizacionDolar] = useState(1000);
  const [modalDetalle, setModalDetalle] = useState({ open: false, producto: null });

  // Cargar cotización
  useEffect(() => {
    const cargarCotizacion = async () => {
      try {
        const cotizacionData = await cotizacionSimple.obtenerCotizacion();
        setCotizacionDolar(cotizacionData.valor);
      } catch (error) {
        console.error('❌ Error cargando cotización:', error);
      }
    };

    cargarCotizacion();
    const interval = setInterval(cargarCotizacion, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const generateCopy = (producto, usePesos = false) => {
    const precio = usePesos 
      ? `$${Math.round(producto.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}`
      : formatPriceUSD(producto.precio_venta_usd);
    
    const infoBase = generateUnifiedCopy(producto, categoriaActiva, cotizacionDolar);
    return `${infoBase} - Estado: ${producto.condicion} - Precio: ${precio}`;
  };

  const handleAddToCart = (producto) => {
    if (onAddToCart) {
      // Determinar el tipo según la categoría activa
      let tipo = 'computadora'; // default
      if (categoriaActiva === 'celulares') {
        tipo = 'celular';
      } else if (categoriaActiva === 'otros' || categoriaActiva.startsWith('otros-')) {
        tipo = 'otro';
      } else if (['desktop', 'tablets', 'gpu', 'apple', 'componentes', 'audio'].includes(categoriaActiva)) {
        tipo = 'producto'; // Nuevo tipo para productos unificados
      }
      
      onAddToCart(producto, tipo);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-gray-900 to-black p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Filter size={28} />
              <div>
                <h2 className="text-2xl font-bold">Catálogo</h2>
                <p className="text-gray-300 mt-1">Inventario unificado con filtros inteligentes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de categorías */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Categorías de Productos</h3>
          <div className="text-sm text-slate-600">
            {productosFiltrados} de {totalProductos} productos
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {Object.values(categorias).map((cat) => (
            <button
              key={cat.id}
              onClick={() => cambiarCategoria(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                categoriaActiva === cat.id
                  ? 'bg-gray-800 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="font-medium">{cat.label}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                categoriaActiva === cat.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}>
                {cat.data?.length || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Filtros</h3>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X size={14} />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          
          {/* Ordenamiento */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ordenar por</label>
            <select
              value={ordenamiento.campo}
              onChange={(e) => actualizarOrdenamiento(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="">Sin ordenar</option>
              {categoriaConfig?.camposOrdenamiento?.map(campo => (
                <option key={campo.value} value={campo.value}>
                  {campo.label}
                </option>
              ))}
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Marca</label>
            <select
              value={filtros.marca}
              onChange={(e) => actualizarFiltro('marca', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="">Todas</option>
              {valoresUnicos.marcas?.map(marca => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </select>
          </div>

          {/* Condición */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Condición</label>
            <select
              value={filtros.condicion}
              onChange={(e) => actualizarFiltro('condicion', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="">Todas</option>
              {valoresUnicos.condiciones?.map(condicion => (
                <option key={condicion} value={condicion}>{condicion.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Sucursal/Ubicación */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ubicación</label>
            <select
              value={filtros.sucursal}
              onChange={(e) => actualizarFiltro('sucursal', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="">Todas</option>
              {valoresUnicos.sucursales?.map(sucursal => (
                <option key={sucursal} value={sucursal}>
                  {sucursal.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Categoría para "otros" */}
          {categoriaActiva === 'otros' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={filtros.categoria}
                onChange={(e) => actualizarFiltro('categoria', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">Todas</option>
                {valoresUnicos.categorias?.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
          )}

          {/* Precio máximo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Precio máximo</label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={filtros.precioMax || 0}
                onChange={(e) => actualizarFiltro('precioMax', e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-xs text-center text-gray-600">
                {filtros.precioMax ? `U$${filtros.precioMax}` : 'Sin límite'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Lista de productos */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
            <span className="text-lg">Cargando {categoriaConfig?.label?.toLowerCase()}...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-800 font-medium">Error al cargar {categoriaConfig?.label?.toLowerCase()}</p>
          <p className="text-gray-700 text-sm mt-1">{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-3">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-black rounded-lg p-4 grid grid-cols-12 gap-4">
            <div className="col-span-4 text-sm font-bold text-white uppercase">Información del Producto</div>
            <div className="col-span-2 text-sm font-bold text-white uppercase">Condición</div>
            <div className="col-span-2 text-sm font-bold text-white uppercase">Precio</div>
            <div className="col-span-2 text-center text-sm font-bold text-white uppercase">Copys</div>
            <div className="col-span-2 text-center text-sm font-bold text-white uppercase">Acciones</div>
          </div>
          
          {/* Productos */}
          {datos.map((producto) => (
            <div 
              key={producto.id} 
              className="group cursor-pointer hover:bg-black hover:text-white hover:border-gray-700 transition-colors duration-200 border border-gray-200 rounded-lg p-4 bg-white grid grid-cols-12 gap-4 items-center shadow-sm hover:shadow-md"
              onClick={() => setModalDetalle({ open: true, producto })}
            >
              {/* Información del producto */}
              <div className="col-span-4">
                <div className="text-sm font-medium">
                  {generateUnifiedCopy(producto, categoriaActiva, cotizacionDolar)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {producto.descripcion && <span>{producto.descripcion}</span>}
                  {producto.stock > 0 && <span className="ml-2 text-green-600">Stock: {producto.stock}</span>}
                </div>
              </div>
              
              {/* Condición */}
              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  producto.condicion === 'excelente' ? 'bg-green-100 text-green-800' :
                  producto.condicion === 'muy bueno' ? 'bg-blue-100 text-blue-800' :
                  producto.condicion === 'bueno' ? 'bg-yellow-100 text-yellow-800' :
                  producto.condicion === 'regular' ? 'bg-orange-100 text-orange-800' :
                  producto.condicion === 'malo' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {producto.condicion?.toUpperCase() || 'N/A'}
                </span>
              </div>
              
              {/* Precio */}
              <div className="col-span-2">
                <div className="text-lg font-bold text-gray-900 group-hover:text-white">
                  {formatPriceUSD(producto.precio_venta_usd)}
                </div>
                <div className="text-xs text-gray-500 group-hover:text-gray-300">
                  ${Math.round(producto.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}
                </div>
              </div>
              
              {/* Copys */}
              <div className="col-span-2 flex justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => navigator.clipboard.writeText(generateCopy(producto, false))}
                  className="px-2 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                  title="Copiar información USD"
                >
                  📋 USD
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(generateCopy(producto, true))}
                  className="px-2 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                  title="Copiar información Pesos"
                >
                  📋 ARS
                </button>
              </div>

              {/* Acciones */}
              <div className="col-span-2 flex justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleAddToCart(producto)}
                  className="px-2 py-1 bg-gray-300 text-gray-800 text-xs rounded-lg hover:bg-gray-400 transition-colors"
                  title="Agregar al carrito"
                >
                  🛒
                </button>
                <button
                  onClick={() => alert('Función de editar próximamente')}
                  className="px-2 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                  title="Editar producto"
                >
                  ✏️
                </button>
                <button
                  onClick={() => eliminarProducto(producto.id)}
                  className="px-2 py-1 bg-gray-700 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
                  title="Eliminar producto"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          
          {datos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron productos con los filtros aplicados
            </div>
          )}
        </div>
      )}

      {/* Modal de detalle */}
      <ModalDetalleUnificado
        open={modalDetalle.open}
        producto={modalDetalle.producto}
        categoria={categoriaActiva}
        onClose={() => setModalDetalle({ open: false, producto: null })}
        cotizacionDolar={cotizacionDolar}
      />
    </div>
  );
};

export default Catalogo;