import React from 'react';
import { X } from 'lucide-react';
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
  onVerFotos = null, // Callback para ver fotos del producto
  onCopyUSD = null, // Callback para copiar info en USD
  onCopyPesos = null, // Callback para copiar info en Pesos
  onVender = null, // Callback para agregar al carrito
  onEditar = null, // Callback para editar producto
  onCopyMarketplace = null // Callback para copiar texto de marketplace
}) => {
  if (!isOpen || !producto) return null;

  // Configuración de campos por tipo de producto
  const configCampos = {
    celular: {
      informacion: [
        { key: 'ingreso', label: 'Fecha Ingreso' },
        { key: 'marca', label: 'Marca' },
        { key: 'capacidad', label: 'Capacidad' },
        { key: 'color', label: 'Color' },
        { key: 'fallas', label: 'Notas', opcional: true }
      ],
      estado: [
        { key: 'estado', label: 'Estado General' },
        { key: 'bateria', label: 'Batería' },
        { key: 'ciclos', label: 'Ciclos', opcional: true }
      ]
    },
    notebook: {
      informacion: [
        { key: 'ingreso', label: 'Fecha Ingreso' },
        { key: 'marca', label: 'Marca' },
        { key: 'procesador', label: 'Procesador' },
        { key: 'ram', label: 'Memoria', custom: true }, // Renderizado personalizado
        { key: 'ssd', label: 'SSD' },
        { key: 'hdd', label: 'HDD', opcional: true },
        { key: 'color', label: 'Color', opcional: true },
        { key: 'idioma_teclado', label: 'Teclado', opcional: true }
      ],
      estado: [
        { key: 'so', label: 'Sistema Operativo' },
        { key: 'pantalla', label: 'Pantalla' },
        { key: 'resolucion', label: 'Resolución' },
        { key: 'placa_video', label: 'Placa de Video' },
        { key: 'bateria', label: 'Batería' },
        { key: 'fallas', label: 'Notas' }
      ]
    },
    otro: {
      informacion: [
        { key: 'categoria', label: 'Categoría' },
        { key: 'marca', label: 'Marca', opcional: true },
        { key: 'descripcion', label: 'Descripción', opcional: true },
        { key: 'ingreso', label: 'Fecha Ingreso' },
        { key: 'condicion', label: 'Condición' },
        { key: 'garantia', label: 'Garantía', opcional: true }
      ],
      estado: []
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

    let displayValue = valor || 'N/A';

    // Renderizado personalizado para memoria (RAM + tipo_ram + slots)
    if (campo.key === 'ram' && campo.custom && tipoProducto === 'notebook') {
      const ram = producto.ram || 'N/A';
      const tipoRam = producto.tipo_ram;
      const slots = producto.slots;

      let memoriaCompleta = ram;
      if (tipoRam) {
        memoriaCompleta += ` ${tipoRam}`;
      }
      if (slots) {
        memoriaCompleta += ` (Slots: ${slots})`;
      }

      return (
        <div key={campo.key}>
          <strong>{campo.label}:</strong> {memoriaCompleta}
        </div>
      );
    }

    // Poner en mayúscula la condición
    if (campo.key === 'condicion') {
      displayValue = (valor || 'N/A').toUpperCase();
    }

    // Formatear fechas
    if (campo.key === 'ingreso') {
      try {
        // Asegurar que la fecha se interprete correctamente en la zona horaria local
        const date = new Date(valor + 'T00:00:00');
        if (!isNaN(date)) {
          displayValue = date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      } catch (e) {
        console.error("Error al formatear la fecha:", valor, e);
      }
    }

    // Para productos tipo "otro", mostrar todo en mayúsculas
    if (tipoProducto === 'otro' && typeof displayValue === 'string' && campo.key !== 'ingreso') {
      displayValue = displayValue.toUpperCase();
    }

    return (
      <div key={campo.key}>
        <strong>{campo.label}:</strong> {displayValue}
      </div>
    );
  };

  // Obtener precios según tipo de producto
  // ✅ Notebooks: usar precio_costo_total (incluye envíos/repuestos)
  // ✅ Celulares: usar costo_total_usd (incluye envíos/repuestos)
  // ✅ Otros: usar precio_compra_usd
  const precioCompra = tipoProducto === 'notebook'
    ? (producto.precio_costo_total || producto.precio_costo_usd || 0)
    : tipoProducto === 'celular'
      ? (producto.costo_total_usd || producto.precio_compra_usd || 0)
      : (producto.precio_compra_usd || 0);
  const precioVenta = producto.precio_venta_usd || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" style={{ cursor: 'default' }}>
      <div className="bg-white rounded overflow-hidden flex flex-col w-300 max-h-[90vh]" style={{ userSelect: 'none', cursor: 'default' }}>

        {/* Contenido principal con paneles */}
        <div className="flex flex-1 overflow-hidden">
          {/* Panel izquierdo - Información clave */}
          <div className="w-1/4 bg-slate-800 text-white p-6 border-r-4 border-slate-800 flex flex-col" style={{ userSelect: 'none', cursor: 'default' }}>
          <div className="space-y-8">
            
            {/* Condición */}
            <div className='text-center bg-slate-700 p-3 rounded'>
              <h3 className="text-sm font-semibold mb-1 bg-slate-600 rounded-full p-1 mb-2 text-slate-200 text-center">CONDICIÓN</h3>
              <span className="font-semibold text-white">
                {(producto.condicion || producto.estado || 'N/A').toUpperCase()}
              </span>
            </div>

            {/* Serial - Solo para notebooks y celulares */}
            {(tipoProducto === 'notebook' || tipoProducto === 'celular') && producto.serial && (
              <div className='text-center bg-slate-700 p-3 rounded'>
                <h3 className="text-sm font-semibold mb-1 bg-slate-600 rounded-full p-1 mb-2 text-slate-200 text-center">SERIAL</h3>
                <span className="font-semibold text-white text-sm break-all">
                  {producto.serial}
                </span>
              </div>
            )}

            {/* Ubicación (Oculto para 'otro') */}
            {tipoProducto !== 'otro' && (
              <div className='text-center bg-slate-700 p-3 rounded'>
                <h3 className="text-sm font-semibold mb-1 bg-slate-600 rounded-full p-1 mb-2 text-slate-200 text-center">UBICACIÓN</h3>
                <span className="font-semibold text-white">
                  {(producto.sucursal || producto.ubicacion || producto.ubicacion_otro || 'N/A')
                    .replace('_', ' ').toUpperCase()}
                </span>
              </div>
            )}

            {/* Cantidad - Solo para 'otro' */}
            {tipoProducto === 'otro' && (
              <div className='text-center bg-slate-700 p-3 rounded'>
                <h3 className="text-sm font-semibold mb-1 bg-slate-600 rounded-full p-1 mb-2 text-slate-200 text-center">CANTIDAD</h3>
                <span className="font-semibold text-white">
                  {`${(producto.cantidad_la_plata || 0) + (producto.cantidad_mitre || 0)} unidades`}
                </span>
              </div>
            )}

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

          {/* Ver Fotos */}
          {producto.fotos && (
            <div className="mt-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(producto.fotos, '_blank');
                }}
                className="w-full px-4 py-3 text-white text-sm font-medium rounded bg-slate-600 hover:bg-slate-700 transition-colors"
              >
                Fotos
              </button>
            </div>
          )}
        </div>

        {/* Panel derecho - Detalles y precios */}
        <div className="p-6 overflow-y-auto flex-1" style={{ userSelect: 'none', cursor: 'default' }}>
          
          {/* Header con título y botón cerrar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-semibold text-slate-800 ${tipoProducto === 'otro' ? 'uppercase' : ''}`}>
              {nombreProducto}
            </h2>
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
                {camposConfig.informacion?.map(campo => {
                  // Para celulares nuevos, no mostrar notas
                  if (
                    tipoProducto === 'celular' &&
                    producto.condicion?.toLowerCase() === 'nuevo' &&
                    campo.key === 'fallas'
                  ) {
                    return null;
                  }
                  return renderField(campo, producto[campo.key]);
                })}
              </div>
            </div>

            {/* Columna Estado / Stock */}
            {tipoProducto === 'otro' ? (
              <div className="space-y-4">
                <h3 className="text-lg text-center font-semibold text-white bg-slate-800 px-3 py-2 rounded">
                  Stock
                </h3>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                  <div>
                    <strong>Cantidad La Plata:</strong> {producto.cantidad_la_plata || 0}
                  </div>
                  <div>
                    <strong>Cantidad Mitre:</strong> {producto.cantidad_mitre || 0}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg text-center font-semibold text-white bg-slate-800 px-3 py-2 rounded">
                  Estado
                </h3>
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  {camposConfig.estado?.map(campo => {
                    const isNew = producto.condicion?.toLowerCase() === 'nuevo';

                    // Lógica para Notebooks
                    if (tipoProducto === 'notebook') {
                      if (isNew && (campo.key === 'bateria' || campo.key === 'fallas')) {
                        return null;
                      }
                      if (campo.key === 'placa_video') {
                        const placa = producto.placa_video;
                        const vram = producto.vram;
                        let displayValue = '';
                        if (placa && vram) {
                          displayValue = `${placa} - ${vram}`;
                        } else if (placa) {
                          displayValue = placa;
                        }
                        if (!displayValue) return null;
                        return renderField(campo, displayValue);
                      }
                    }

                    // Lógica para Celulares
                    if (tipoProducto === 'celular') {
                      const fieldsToHideWhenNew = ['estado', 'bateria', 'ciclos', 'garantia'];
                      if (isNew && fieldsToHideWhenNew.includes(campo.key)) {
                        return null;
                      }
                    }

                    return renderField(campo, producto[campo.key]);
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Sección de precios */}
          <div className="space-y-4 text-center mb-6">
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

          {/* Botones de Acciones */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white bg-slate-800 px-3 py-2 rounded mb-4 text-center">
              ACCIONES
            </h3>
            <div className="flex gap-3 flex-wrap">

              {/* Copiar Pesos */}
              {onCopyPesos && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyPesos(producto, tipoProducto);
                  }}
                  className="flex-1 min-w-[120px] px-4 py-3 text-white text-sm font-medium rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                >
                  Copy pesos
                </button>
              )}

              {/* Copiar Dólares */}
              {onCopyUSD && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyUSD(producto, tipoProducto);
                  }}
                  className="flex-1 min-w-[120px] px-4 py-3 text-white text-sm font-medium rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                >
                  Copy dólares
                </button>
              )}

              {/* Copy Marketplace */}
              {onCopyMarketplace && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyMarketplace(producto, tipoProducto);
                  }}
                  className="flex-1 min-w-[120px] px-4 py-3 text-white text-sm font-medium rounded bg-slate-600 hover:bg-slate-700 transition-colors"
                >
                  Copy mplace
                </button>
              )}

              {/* Vender */}
              {onVender && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVender(producto);
                  }}
                  className="flex-1 min-w-[120px] px-4 py-3 text-white text-sm font-medium rounded bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  Vender
                </button>
              )}

              {/* Editar */}
              {onEditar && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditar(producto);
                  }}
                  className="flex-1 min-w-[120px] px-4 py-3 text-white text-sm font-medium rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Editar
                </button>
              )}

            </div>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;