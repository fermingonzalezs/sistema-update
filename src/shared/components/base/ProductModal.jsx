import React from 'react';
import { X, Camera } from 'lucide-react';
import { formatearMonto } from '../../utils/formatters';

/**
 * ProductModal - Modal genérico para productos
 * Unifica CelularesModal, NotebooksModal y OtrosModal
 * 
 * Cumple con el sistema de diseño CLAUDE.md:
 * - Colores: slate-800, emerald-600, blanco
 * - Bordes: rounded (4px únicamente)
 * - Espaciado: sistema de 8px
 */
const ProductModal = ({ 
  producto, 
  isOpen, 
  onClose, 
  cotizacionDolar,
  tipoProducto = 'general', // 'celular', 'notebook', 'otro'
  campos = {}, // Configuración de campos a mostrar por tipo
  onVerFotos = null // Callback para ver fotos del producto
}) => {
  if (!isOpen || !producto) return null;

  // Configuración de campos por tipo de producto
  const configCampos = {
    celular: {
      informacion: [
        { key: 'serial', label: 'Serial' },
        { key: 'fecha_ingreso', label: 'Fecha Ingreso' },
        { key: 'marca', label: 'Marca' },
        { key: 'capacidad', label: 'Capacidad' },
        { key: 'color', label: 'Color' },
        { key: 'fallas', label: 'Fallas', opcional: true }
      ],
      estado: [
        { key: 'estado', label: 'Estado General' },
        { key: 'bateria', label: 'Batería' },
        { key: 'ciclos', label: 'Ciclos' },
        { key: 'garantia_update', label: 'Garantía Update' },
        { key: 'garantia_oficial', label: 'Garantía Oficial' }
      ]
    },
    notebook: {
      informacion: [
        { key: 'serial', label: 'Serial' },
        { key: 'ingreso', label: 'Fecha Ingreso' },
        { key: 'marca', label: 'Marca' },
        { key: 'procesador', label: 'Procesador' },
        { key: 'ram', label: 'RAM' },
        { key: 'ssd', label: 'SSD' },
        { key: 'hdd', label: 'HDD', opcional: true }
      ],
      estado: [
        { key: 'so', label: 'Sistema Operativo' },
        { key: 'pantalla', label: 'Pantalla' },
        { key: 'resolucion', label: 'Resolución' },
        { key: 'placa_video', label: 'Placa de Video' },
        { key: 'bateria', label: 'Batería' },
        { key: 'fallas', label: 'Fallas' }
      ]
    },
    otro: {
      informacion: [
        { key: 'serial', label: 'Serial' },
        { key: 'ingreso', label: 'Fecha Ingreso' },
        { key: 'marca', label: 'Marca' },
        { key: 'categoria', label: 'Categoría' },
        { key: 'subcategoria', label: 'Subcategoría' },
        { key: 'descripcion', label: 'Descripción', opcional: true }
      ],
      estado: [
        { key: 'estado', label: 'Estado' },
        { key: 'funcionalidad', label: 'Funcionalidad' },
        { key: 'accesorios', label: 'Accesorios', opcional: true },
        { key: 'garantia_update', label: 'Garantía Update' },
        { key: 'fallas', label: 'Fallas', opcional: true }
      ]
    }
  };

  // Usar configuración personalizada o por defecto
  const camposConfig = campos[tipoProducto] || configCampos[tipoProducto] || configCampos.otro;

  // Funciones de formateo (unificadas del análisis anterior)
  const formatPriceUSD = (price) => {
    const numPrice = parseFloat(price) || 0;
    return formatearMonto(numPrice, 'USD');
  };

  const formatPriceARS = (price, cotizacion) => {
    const numPrice = parseFloat(price) || 0;
    const arsPrice = Math.round(numPrice * cotizacion);
    return formatearMonto(arsPrice, 'ARS');
  };

  // Obtener nombre del producto
  const nombreProducto = producto.modelo || producto.nombre_producto || producto.descripcion || 'Producto';

  // Renderizar campo de información
  const renderField = (campo, valor) => {
    if (!valor && campo.opcional) return null;
    return (
      <div key={campo.key}>
        <strong>{campo.label}:</strong> {valor || 'N/A'}
      </div>
    );
  };

  // Obtener precios según tipo de producto
  // ✅ Notebooks: usar precio_costo_total (incluye envíos/repuestos)
  // ✅ Celulares/Otros: usar precio_compra_usd
  const precioCompra = tipoProducto === 'notebook'
    ? (producto.precio_costo_total || producto.precio_costo_usd || 0)
    : (producto.precio_compra_usd || 0);
  const precioVenta = producto.precio_venta_usd || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded overflow-hidden flex w-300 max-h-[80vh]">
        
        {/* Panel izquierdo - Información clave */}
        <div className="w-1/4 bg-slate-800 text-white p-6 border-r-4 border-slate-800">
          <div className="space-y-8">
            
            {/* Condición */}
            <div className='text-center bg-slate-700 p-3 rounded'>
              <h3 className="text-sm font-semibold mb-1 bg-slate-600 rounded-full p-1 mb-2 text-slate-200 text-center">CONDICIÓN</h3>
              <span className="font-semibold text-white">
                {(producto.condicion || producto.estado || 'N/A').toUpperCase()}
              </span>
            </div>

            {/* Ubicación */}
            <div className='text-center bg-slate-700 p-3 rounded'>
              <h3 className="text-sm font-semibold mb-1 bg-slate-600 rounded-full p-1 mb-2 text-slate-200 text-center">UBICACIÓN</h3>
              <span className="font-semibold text-white">
                {(producto.sucursal || producto.ubicacion || producto.ubicacion_otro || 'N/A')
                  .replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Cantidad */}
            <div className='text-center bg-slate-700 p-3 rounded'>
              <h3 className="text-sm font-semibold mb-1 bg-slate-600 rounded-full p-1 mb-2 text-slate-200 text-center">CANTIDAD</h3>
              <span className="font-semibold text-white">
                {(producto.cantidad || '1') + ' unidades'}
              </span>
            </div>

            {/* Garantía (si existe) */}
            {(producto.garantia_update || producto.garantia_oficial || producto.garantia) && (
              <div className='text-center bg-slate-700 p-3 rounded'>
                <h3 className="text-sm font-semibold mb-1 bg-slate-600 rounded-full p-1 mb-2 text-slate-200 text-center">GARANTÍA</h3>
                <span className="font-semibold text-white">
                  {producto.garantia_update || producto.garantia_oficial || producto.garantia}
                </span>
              </div>
            )}

          </div>
        </div>

        {/* Panel derecho - Detalles y precios */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Header con título y botón cerrar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-800">{nombreProducto}</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Información detallada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Columna Información */}
            <div className="space-y-4">
              <h3 className="text-lg text-center font-semibold text-white bg-slate-800 px-3 py-2 rounded">
                Información
              </h3>
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                {camposConfig.informacion?.map(campo => 
                  renderField(campo, producto[campo.key])
                )}
              </div>
            </div>

            {/* Columna Estado */}
            <div className="space-y-4">
              <h3 className="text-lg text-center font-semibold text-white bg-slate-800 px-3 py-2 rounded">
                Estado
              </h3>
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                {camposConfig.estado?.map(campo => 
                  renderField(campo, producto[campo.key])
                )}
              </div>
            </div>

          </div>

          {/* Sección de precios */}
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-semibold text-white bg-emerald-600 px-3 py-2 rounded">
              PRECIOS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Tarjeta Compra */}
              <div className="rounded bg-slate-800 py-4">
                <div className="rounded-full bg-slate-700 text-center p-1 m-3">
                  <h4 className="text-sm text-slate-200 font-semibold">COMPRA</h4>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-white">
                    {formatPriceUSD(precioCompra)}
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    {formatPriceARS(precioCompra, cotizacionDolar)}
                  </p>
                </div>
              </div>

              {/* Tarjeta Venta */}
              <div className="rounded bg-slate-800 py-4">
                <div className="rounded-full bg-slate-700 text-center p-1 m-3">
                  <h4 className="text-sm text-slate-200 font-semibold">VENTA</h4>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-white">
                    {formatPriceUSD(precioVenta)}
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    {formatPriceARS(precioVenta, cotizacionDolar)}
                  </p>
                </div>
              </div>

              {/* Tarjeta Ganancia */}
              <div className="rounded bg-slate-800 py-4">
                <div className="rounded-full bg-slate-700 text-center p-1 m-3">
                  <h4 className="text-sm text-slate-200 font-semibold">GANANCIA</h4>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-white">
                    {formatPriceUSD(precioVenta - precioCompra)}
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    {formatPriceARS(precioVenta - precioCompra, cotizacionDolar)}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Botón Ver Fotos - Esquina inferior izquierda */}
          {onVerFotos && (
            <div className="flex justify-start mt-6">
              <button
                onClick={() => onVerFotos(producto, tipoProducto)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded transition-colors flex items-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Ver Fotos</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductModal;