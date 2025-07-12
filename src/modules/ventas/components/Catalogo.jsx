import React, { useState, useEffect } from 'react';
import { X, Filter, ChevronDown } from 'lucide-react';
import { useCatalogoUnificado } from '../hooks/useCatalogoUnificado';
import { cotizacionSimple } from '../../../services/cotizacionSimpleService';
import OtrosModal from './OtrosModal';
import NotebooksModal from './NotebooksModal';
import CelularesModal from './CelularesModal';

// Función para formatear precios en USD sin decimales con prefijo U$

  const formatPriceUSD = (price) => {
  const numPrice = parseFloat(price) || 0;
  return `U${Math.round(numPrice)}`;
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
        producto.nombre_producto,
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
          producto.nombre_producto,
          producto.marca,
          producto.especificaciones_otro || '',
          producto.modelo_otro || '',
          producto.ubicacion_otro ? producto.ubicacion_otro.replace('_', ' ').toUpperCase() : ''
        ].filter(Boolean).join(' - ');
      } else {
        copy = producto.modelo || producto.nombre_producto || 'Producto sin descripción';
      }
  }

  return copy;
};

// Modal de detalle unificado

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
      ? `${Math.round(producto.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}`
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
    <div className="p-0">

      {/* Selector de categorías */}
      <div className="mb-4 bg-slate-800 rounded border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Categorías de Productos</h3>
          <div className="text-sm text-white">
            {productosFiltrados} de {totalProductos} productos
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {Object.values(categorias).map((cat) => (
            <button
              key={cat.id}
              onClick={() => cambiarCategoria(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
                categoriaActiva === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-white hover:bg-slate-200'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="font-medium">{cat.label}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                categoriaActiva === cat.id
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-slate-300 text-slate-800'
              }`}>
                {cat.data?.length || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 bg-white rounded border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Filtros</h3>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center space-x-1 px-3 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-700 transition-colors"
            >
              <X size={14} />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          
          {/* Ordenamiento */}
          <div>
            <label className="block text-xs font-medium text-slate-800 mb-1">Ordenar por</label>
            <select
              value={ordenamiento.campo}
              onChange={(e) => actualizarOrdenamiento(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Marca</label>
            <select
              value={filtros.marca}
              onChange={(e) => actualizarFiltro('marca', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todas</option>
              {valoresUnicos.marcas?.map(marca => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </select>
          </div>

          {/* Condición */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Condición</label>
            <select
              value={filtros.condicion}
              onChange={(e) => actualizarFiltro('condicion', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todas</option>
              {valoresUnicos.condiciones?.map(condicion => (
                <option key={condicion} value={condicion}>{condicion.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Sucursal/Ubicación */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Ubicación</label>
            <select
              value={filtros.sucursal}
              onChange={(e) => actualizarFiltro('sucursal', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
              <select
                value={filtros.categoria}
                onChange={(e) => actualizarFiltro('categoria', e.target.value)}
                className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Precio máximo</label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={filtros.precioMax || 0}
                onChange={(e) => actualizarFiltro('precioMax', e.target.value)}
                className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer slider"
              />
              <div className="text-xs text-center text-slate-600">
                {filtros.precioMax ? `U${filtros.precioMax}` : 'Sin límite'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Lista de productos */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-slate-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
            <span className="text-lg">Cargando {categoriaConfig?.label?.toLowerCase()}...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-slate-100 border border-slate-200 rounded p-4 text-center">
          <p className="text-slate-800 font-medium">Error al cargar {categoriaConfig?.label?.toLowerCase()}</p>
          <p className="text-slate-700 text-sm mt-1">{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-3">
          {/* Header */}
          <div className="rounded p-4 grid grid-cols-12 gap-4 bg-slate-800">
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
              className="group cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors duration-200 border border-slate-200 rounded p-4 bg-white grid grid-cols-12 gap-4 items-center shadow-sm hover:shadow-md"
              onClick={() => setModalDetalle({ open: true, producto })}
            >
              {/* Información del producto */}
              <div className="col-span-4">
                {categoriaActiva === 'otros' ? (
                  <div>
                    <div className="text-sm font-medium">
                      {producto.nombre_producto}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {producto.descripcion}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-medium">
                      {generateUnifiedCopy(producto, categoriaActiva, cotizacionDolar)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {producto.descripcion && <span>{producto.descripcion}</span>}
                      {producto.stock > 0 && <span className="ml-2 text-emerald-600">Stock: {producto.stock}</span>}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Condición */}
              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  producto.condicion === 'excelente' ? 'bg-emerald-100 text-emerald-800' :
                  producto.condicion === 'muy bueno' ? 'bg-slate-100 text-slate-800' :
                  producto.condicion === 'bueno' ? 'bg-slate-100 text-slate-800' :
                  producto.condicion === 'regular' ? 'bg-slate-100 text-slate-800' :
                  producto.condicion === 'malo' ? 'bg-slate-100 text-slate-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {producto.condicion?.toUpperCase() || 'N/A'}
                </span>
              </div>
              
              {/* Precio */}
              <div className="col-span-2">
                <div className="text-lg font-bold text-slate-800">
                  {formatPriceUSD(producto.precio_venta_usd)}
                </div>
                <div className="text-xs text-slate-500">
                  ${Math.round(producto.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}
                </div>
              </div>
              
              {/* Copys */}
              <div className="col-span-2 flex justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => navigator.clipboard.writeText(generateCopy(producto, false))}
                  className="px-2 py-1 text-white text-[5px] rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                  title="Copiar información USD"
                >
                  USD
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(generateCopy(producto, true))}
                  className="px-2 py-1 text-white text-[10px] rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                  title="Copiar información Pesos"
                >
                  ARS
                </button>
              </div>

              {/* Acciones */}
              <div className="col-span-2 flex justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleAddToCart(producto)}
                  className="px-2 py-1 text-white text-xs rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                  title="Agregar al carrito"
                >
                  <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                  </svg>
                </button>
                <button
                  onClick={() => alert('Función de editar próximamente')}
                  className="px-2 py-1 text-white text-xs rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                  title="Editar producto"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                </button>
                <button
                  onClick={() => eliminarProducto(producto.id)}
                  className="px-2 py-1 text-white text-xs rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                  title="Eliminar producto"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          {datos.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No se encontraron productos con los filtros aplicados
            </div>
          )}
        </div>
      )}

      {/* Modal de detalle */}
      {categoriaActiva === 'notebooks' && (
        <NotebooksModal
          isOpen={modalDetalle.open}
          producto={modalDetalle.producto}
          onClose={() => setModalDetalle({ open: false, producto: null })}
          cotizacionDolar={cotizacionDolar}
        />
      )}

      {categoriaActiva === 'celulares' && (
        <CelularesModal
          isOpen={modalDetalle.open}
          producto={modalDetalle.producto}
          onClose={() => setModalDetalle({ open: false, producto: null })}
          cotizacionDolar={cotizacionDolar}
        />
      )}

      {(categoriaActiva !== 'notebooks' && categoriaActiva !== 'celulares') && (
        <OtrosModal
          isOpen={modalDetalle.open}
          producto={modalDetalle.producto}
          onClose={() => setModalDetalle({ open: false, producto: null })}
          cotizacionDolar={cotizacionDolar}
        />
      )}
    </div>
  );
};

export default Catalogo;
