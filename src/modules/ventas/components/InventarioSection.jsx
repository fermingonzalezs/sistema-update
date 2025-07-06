import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trash2, Filter, X, ChevronDown, Shield, Eye, Monitor, Cpu, HardDrive } from 'lucide-react';
import FotoProductoAvanzado from '../../../components/FotoProductoAvanzado';
import { cotizacionSimple } from '../../../services/cotizacionSimpleService';

// Función para formatear precios en USD sin decimales con prefijo U$
const formatPriceUSD = (price) => {
  const numPrice = parseFloat(price) || 0;
  return `U$${Math.round(numPrice)}`;
};

// Función para generar copy compacto con toda la información disponible
const generateCompactCopy = (computer) => {
  const modelo = computer.modelo || '';
  const procesador = computer.procesador || '';
  const ram = computer.ram ? `${computer.ram}GB RAM` : '';
  const tipoRam = computer.tipo_ram ? `${computer.tipo_ram}` : '';
  const ssd = computer.ssd ? `${computer.ssd}GB SSD` : '';
  const hdd = computer.hdd ? `${computer.hdd}GB HDD` : '';
  const pantalla = computer.pantalla ? `${computer.pantalla}"` : '';
  const resolucion = computer.resolucion || '';
  const refresh = computer.refresh_rate ? `${computer.refresh_rate}` : '';
  const touchscreen = computer.touchscreen ? 'Touchscreen' : '';
  const gpu = computer.gpu || '';
  const vram = computer.vram ? `${computer.vram}GB VRAM` : '';
  const so = computer.so || '';
  const teclado = computer.teclado || '';
  const idiomaTeclado = computer.idioma_teclado || '';
  const color = computer.color || '';
  const bateria = computer.bateria || '';
  const duracionBateria = computer.duracion_bateria || '';
  const sucursal = computer.sucursal ? computer.sucursal.replace('_', ' ').toUpperCase() : '';
  const fallas = computer.fallas ? `Fallas: ${computer.fallas}` : '';
  
  // Construir memoria
  const memoria = [ram, tipoRam].filter(Boolean).join(' ');
  
  // Construir almacenamiento
  const almacenamiento = [ssd, hdd].filter(Boolean).join(' + ');
  
  // Construir pantalla con todas las características
  const infoPantalla = [pantalla, refresh, resolucion, touchscreen].filter(Boolean).join(' ');
  
  // Construir GPU
  const infoGpu = [gpu, vram].filter(Boolean).join(' ');
  
  // Construir teclado
  const infoTeclado = [teclado, idiomaTeclado].filter(Boolean).join(' ');
  
  // Construir batería
  const infoBateria = [bateria, duracionBateria].filter(Boolean).join(' ');
  
  // Construir info general con más detalles
  const infoGeneral = [so, infoTeclado, color, infoBateria, sucursal, fallas].filter(Boolean).join(' - ');
  
  return [modelo, procesador, memoria, almacenamiento, infoPantalla, infoGpu, infoGeneral]
    .filter(Boolean)
    .join(' - ');
};

// Modal de detalle completo
const ModalDetalle = ({ open, producto, onClose, cotizacionDolar }) => {
  if (!open || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-hidden flex">
        
        {/* Panel izquierdo - Información clave con borde gris oscuro */}
        <div className="w-1/3 bg-gray-800 text-white p-6 border-r-4 border-gray-800">
          <div className="space-y-6">
            
            {/* Header */}
            <div className="text-center pb-4 border-b border-gray-600">
              <h2 className="text-xl font-bold">{producto.modelo}</h2>
              <p className="text-gray-300 text-sm">{producto.marca}</p>
            </div>

            {/* Condición */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-200">CONDICIÓN</h3>
              <div className="bg-gray-700 p-3 rounded-lg">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  producto.condicion === 'excelente' ? 'bg-green-600 text-white' :
                  producto.condicion === 'muy bueno' ? 'bg-blue-600 text-white' :
                  producto.condicion === 'bueno' ? 'bg-yellow-600 text-white' :
                  producto.condicion === 'regular' ? 'bg-orange-600 text-white' :
                  producto.condicion === 'malo' ? 'bg-red-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {producto.condicion?.toUpperCase() || 'N/A'}
                </span>
              </div>
            </div>

            {/* Sucursal */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-200">SUCURSAL</h3>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-white font-medium">
                  {producto.sucursal?.replace('_', ' ').toUpperCase() || 'N/A'}
                </p>
              </div>
            </div>

            {/* Garantía */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-200">GARANTÍA</h3>
              <div className="bg-gray-700 p-3 rounded-lg space-y-2">
                <div>
                  <span className="text-gray-300">Update:</span>
                  <span className="text-white ml-2 font-medium">{producto.garantia_update || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-300">Oficial:</span>
                  <span className="text-white ml-2 font-medium">{producto.garantia_oficial || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Precio destacado */}
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-gray-300 text-sm">Precio de Venta</p>
              <p className="text-2xl font-bold text-green-400">{formatPriceUSD(producto.precio_venta_usd)}</p>
              <p className="text-gray-300 text-sm">
                ${Math.round(producto.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}
              </p>
            </div>

          </div>
        </div>

        {/* Panel derecho - Resto de información con fondo blanco */}
        <div className="w-2/3 bg-white p-6 overflow-y-auto">
          
          {/* Header con botón cerrar */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-black">Especificaciones Completas</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-gray-600 px-3 py-2 rounded">Información Básica</h3>
              <div className="space-y-2 text-black">
                <div><strong>Serial:</strong> {producto.serial}</div>
                <div><strong>Fecha Ingreso:</strong> {producto.fecha_ingreso}</div>
                <div><strong>Fallas:</strong> {producto.fallas || 'Ninguna'}</div>
              </div>
            </div>

            {/* Especificaciones técnicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-gray-600 px-3 py-2 rounded">Hardware</h3>
              <div className="space-y-2 text-black">
                <div><strong>Procesador:</strong> {producto.procesador}</div>
                <div><strong>RAM:</strong> {producto.ram} {producto.tipo_ram}</div>
                <div><strong>Slots RAM:</strong> {producto.slots_ram}</div>
                <div><strong>SSD:</strong> {producto.ssd}</div>
                <div><strong>HDD:</strong> {producto.hdd}</div>
                <div><strong>Sistema Operativo:</strong> {producto.so}</div>
              </div>
            </div>

            {/* Pantalla y GPU */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-gray-600 px-3 py-2 rounded">Pantalla y Gráficos</h3>
              <div className="space-y-2 text-black">
                <div><strong>Pantalla:</strong> {producto.pantalla}"</div>
                <div><strong>Resolución:</strong> {producto.resolucion}</div>
                <div><strong>Refresh Rate:</strong> {producto.refresh_rate}</div>
                <div><strong>Touchscreen:</strong> {producto.touchscreen}</div>
                <div><strong>GPU:</strong> {producto.gpu}</div>
                <div><strong>VRAM:</strong> {producto.vram}</div>
              </div>
            </div>

            {/* Otros detalles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white bg-gray-600 px-3 py-2 rounded">Detalles Físicos</h3>
              <div className="space-y-2 text-black">
                <div><strong>Teclado:</strong> {producto.teclado}</div>
                <div><strong>Idioma Teclado:</strong> {producto.idioma_teclado}</div>
                <div><strong>Color:</strong> {producto.color}</div>
                <div><strong>Batería:</strong> {producto.bateria}</div>
                <div><strong>Duración Batería:</strong> {producto.duracion_bateria}</div>
              </div>
            </div>

            {/* Información comercial */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold text-white bg-gray-600 px-3 py-2 rounded">Información Comercial</h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="rounded overflow-hidden h-24 flex flex-col">
                  <div className="bg-gray-600 px-3 py-2 text-center flex-none h-12 flex items-center justify-center">
                    <strong className="text-white text-sm leading-tight">PRECIO COMPRA</strong>
                  </div>
                  <div className="bg-white px-3 py-2 text-center flex-1 flex items-center justify-center">
                    <div className="text-black font-bold text-xl">{formatPriceUSD(producto.precio_compra_usd)}</div>
                  </div>
                </div>
                <div className="rounded overflow-hidden h-24 flex flex-col">
                  <div className="bg-gray-600 px-3 py-2 text-center flex-none h-12 flex items-center justify-center">
                    <strong className="text-white text-sm leading-tight">GASTOS IMPORTACIÓN</strong>
                  </div>
                  <div className="bg-white px-3 py-2 text-center flex-1 flex items-center justify-center">
                    <div className="text-black font-bold text-xl">{formatPriceUSD(producto.gastos_importacion)}</div>
                  </div>
                </div>
                <div className="rounded overflow-hidden h-24 flex flex-col">
                  <div className="bg-gray-600 px-3 py-2 text-center flex-none h-12 flex items-center justify-center">
                    <strong className="text-white text-sm leading-tight">REPUESTOS</strong>
                  </div>
                  <div className="bg-white px-3 py-2 text-center flex-1 flex items-center justify-center">
                    <div className="text-black font-bold text-xl">{formatPriceUSD(producto.gastos_reparacion || 0)}</div>
                  </div>
                </div>
                <div className="rounded overflow-hidden h-24 flex flex-col">
                  <div className="bg-gray-600 px-3 py-2 text-center flex-none h-12 flex items-center justify-center">
                    <strong className="text-white text-sm leading-tight">COMPRA TOTAL</strong>
                  </div>
                  <div className="bg-white px-3 py-2 text-center flex-1 flex items-center justify-center">
                    <div className="text-black font-bold text-xl">{formatPriceUSD(producto.precio_compra_total)}</div>
                  </div>
                </div>
                <div className="rounded overflow-hidden h-24 flex flex-col">
                  <div className="bg-gray-600 px-3 py-2 text-center flex-none h-12 flex items-center justify-center">
                    <strong className="text-white text-sm leading-tight">GANANCIA</strong>
                  </div>
                  <div className="bg-white px-3 py-2 text-center flex-1 flex items-center justify-center">
                    <div className="text-black font-bold text-xl">
                      {formatPriceUSD((producto.precio_venta_usd || 0) - (producto.precio_compra_total || 0))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const InventarioSection = ({ computers, loading, error, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [cotizacionDolar, setCotizacionDolar] = useState(1000);
  const [modalDetalle, setModalDetalle] = useState({ open: false, producto: null });

  // Estados para filtros y ordenamiento
  const [filters, setFilters] = useState({
    sucursal: '',
    condicion: '',
    marca: '',
    precioMax: ''
  });
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Cargar cotización al montar el componente
  useEffect(() => {
    cargarCotizacion();
    const interval = setInterval(cargarCotizacion, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const cargarCotizacion = async () => {
    try {
      const cotizacionData = await cotizacionSimple.obtenerCotizacion();
      setCotizacionDolar(cotizacionData.valor);
    } catch (error) {
      console.error('❌ Error cargando cotización:', error);
    }
  };

  // Función para generar copy completo (mantener la función original)
  const generateCopy = (computer, usePesos = false) => {
    const precio = usePesos 
      ? `$${Math.round(computer.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}`
      : formatPriceUSD(computer.precio_venta_usd);
    
    return `💻 ${computer.modelo} - ${computer.procesador} - ${computer.ram}GB RAM ${computer.tipo_ram} - ${computer.ssd}GB SSD - ${computer.pantalla}" ${computer.resolucion} - ${computer.gpu} ${computer.vram}GB - ${computer.so} - Estado: ${computer.condicion} - Precio: ${precio}`;
  };

  // Filtros y ordenamiento (mantener lógica original)
  const uniqueValues = useMemo(() => {
    const sucursales = [...new Set(computers.map(c => c.sucursal).filter(Boolean))];
    const condiciones = [...new Set(computers.map(c => c.condicion).filter(Boolean))];
    const marcas = [...new Set(computers.map(c => c.marca).filter(Boolean))];
    const precioMax = Math.max(...computers.map(c => parseFloat(c.precio_venta_usd) || 0));
    
    return { sucursales, condiciones, marcas, precioMax };
  }, [computers]);

  const filteredAndSortedComputers = useMemo(() => {
    let filtered = computers.filter(computer => {
      const cumpleSucursal = !filters.sucursal || computer.sucursal === filters.sucursal;
      const cumpleCondicion = !filters.condicion || computer.condicion === filters.condicion;
      const cumpleMarca = !filters.marca || computer.marca === filters.marca;
      const cumplePrecio = !filters.precioMax || parseFloat(computer.precio_venta_usd) <= parseFloat(filters.precioMax);
      
      return cumpleSucursal && cumpleCondicion && cumpleMarca && cumplePrecio;
    });

    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (sortBy === 'precio_venta_usd') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        }
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [computers, filters, sortBy, sortOrder]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => {
    setFilters({ sucursal: '', condicion: '', marca: '', precioMax: '' });
    setSortBy('');
  };

  const sortOptions = [
    { value: '', label: 'Sin ordenar' },
    { value: 'modelo', label: 'Modelo' },
    { value: 'marca', label: 'Marca' },
    { value: 'precio_venta_usd', label: 'Precio' },
    { value: 'condicion', label: 'Condición' },
    { value: 'fecha_ingreso', label: 'Fecha Ingreso' }
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-8 shadow-lg">
        <div>
          <h2 className="text-4xl font-bold text-white drop-shadow">Inventario de Notebooks</h2>
          <p className="text-white/80 text-xl mt-2">Vista compacta con información detallada</p>
        </div>
      </div>

      {loading && <p className="text-blue-600">Cargando desde Supabase...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      
      {!loading && !error && (
        <>
          {/* Controles de filtrado y ordenamiento */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <p className="font-semibold text-green-600">
                  ✅ {filteredAndSortedComputers.length} de {computers.length} computadoras
                </p>
                {(Object.values(filters).some(f => f) || sortBy) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    <X size={14} />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>
              
              <div className="text-sm text-gray-600 flex items-center space-x-4">
                <span>💡 Haz clic en una fila para ver información completa</span>
                <span>🖱️ Hover para resaltar</span>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-end space-x-4">
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Ordenar por</label>
                <div className="flex space-x-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md text-sm min-w-[130px]"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {sortBy && (
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-2 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                      title={`Orden ${sortOrder === 'asc' ? 'ascendente' : 'descendente'}`}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Sucursal</label>
                <select
                  value={filters.sucursal}
                  onChange={(e) => handleFilterChange('sucursal', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm min-w-[140px]"
                >
                  <option value="">Todas</option>
                  {uniqueValues.sucursales.map(sucursal => (
                    <option key={sucursal} value={sucursal}>
                      {sucursal.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Condición</label>
                <select
                  value={filters.condicion}
                  onChange={(e) => handleFilterChange('condicion', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm min-w-[140px]"
                >
                  <option value="">Todas</option>
                  {uniqueValues.condiciones.map(condicion => (
                    <option key={condicion} value={condicion}>
                      {condicion.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Marca</label>
                <select
                  value={filters.marca}
                  onChange={(e) => handleFilterChange('marca', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm min-w-[140px]"
                >
                  <option value="">Todas</option>
                  {uniqueValues.marcas.map(marca => (
                    <option key={marca} value={marca}>
                      {marca.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Precio máximo</label>
                <input
                  type="number"
                  value={filters.precioMax}
                  onChange={(e) => handleFilterChange('precioMax', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm w-32"
                  placeholder="USD"
                />
              </div>
            </div>
          </div>
          
          {/* Nueva tabla compacta */}
          <div className="space-y-3">
            {/* Header de la tabla */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-4 grid grid-cols-12 gap-4">
              <div className="col-span-6 text-sm font-bold text-white uppercase">Información del Equipo</div>
              <div className="col-span-2 text-sm font-bold text-white uppercase">Condición</div>
              <div className="col-span-2 text-sm font-bold text-white uppercase">Precio</div>
              <div className="col-span-2 text-center text-sm font-bold text-white uppercase">Acciones</div>
            </div>
            
            {/* Filas de datos */}
            {filteredAndSortedComputers.map((computer, index) => (
              <div 
                key={computer.id} 
                className="group cursor-pointer hover:bg-gray-800 hover:text-white transition-colors duration-200 border border-gray-200 rounded-lg p-4 bg-white grid grid-cols-12 gap-4 items-center shadow-sm"
                onClick={() => setModalDetalle({ open: true, producto: computer })}
              >
                {/* Columna de información del equipo */}
                <div className="col-span-6">
                  <div className="text-sm font-medium">
                    {generateCompactCopy(computer)}
                  </div>
                </div>
                
                {/* Columna de condición */}
                <div className="col-span-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    computer.condicion === 'excelente' ? 'bg-green-100 text-green-800' :
                    computer.condicion === 'muy bueno' ? 'bg-blue-100 text-blue-800' :
                    computer.condicion === 'bueno' ? 'bg-yellow-100 text-yellow-800' :
                    computer.condicion === 'regular' ? 'bg-orange-100 text-orange-800' :
                    computer.condicion === 'malo' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {computer.condicion?.toUpperCase() || 'N/A'}
                  </span>
                </div>
                
                {/* Columna de precio */}
                <div className="col-span-2">
                  <div className="text-lg font-bold text-black group-hover:text-white">
                    {formatPriceUSD(computer.precio_venta_usd)}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-white">
                    ${Math.round(computer.precio_venta_usd * cotizacionDolar).toLocaleString('es-AR')}
                  </div>
                </div>
                
                {/* Columna de acciones */}
                <div className="col-span-2 flex justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigator.clipboard.writeText(generateCopy(computer, false))}
                    className="px-2 py-1 text-white text-xs rounded transition-colors"
                    style={{ backgroundColor: '#1A7654' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#155a42'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#1A7654'}
                    title="Copiar información USD"
                  >
                    📋 USD
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(generateCopy(computer, true))}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    title="Copiar información Pesos"
                  >
                    📋 ARS
                  </button>
                  <button
                    onClick={() => onDelete(computer.id)}
                    className="px-2 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal de detalle completo */}
      <ModalDetalle
        open={modalDetalle.open}
        producto={modalDetalle.producto}
        onClose={() => setModalDetalle({ open: false, producto: null })}
        cotizacionDolar={cotizacionDolar}
      />
    </div>
  );
};

export default InventarioSection;