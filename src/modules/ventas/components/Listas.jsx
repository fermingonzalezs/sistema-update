import React, { useState, useEffect } from 'react';
import { 
  Copy, Monitor, Smartphone, Box, Search, 
  Check, FileText, Edit2, Save, X, Filter, Zap
} from 'lucide-react';
import { generateCopy } from '../../../shared/utils/copyGenerator';

const Listas = ({ computers, celulares, otros, loading, error }) => {
  const [tipoActivo, setTipoActivo] = useState('computadora');
  const [busqueda, setBusqueda] = useState('');
  const [productosConCopy, setProductosConCopy] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [copiados, setCopiados] = useState(new Set());
  
  // Mensajes personalizables por tipo
  const [mensajes, setMensajes] = useState({
    computadora: {
      inicial: '🔥 NOTEBOOKS DISPONIBLES 🔥',
      final: '🛡️ GARANTÍAS\nProductos nuevos 6 meses.\nProductos reacondicionados 3 meses.\n\n💳 MÉTODOS DE PAGO\nEfectivo (pesos o dólares)\nTransferencia (+5%)\nTarjeta de crédito (+30% en hasta 3 cuotas)\nCriptomonedas\n\n🏢 OFICINAS\nTenemos dos sucursales, una en el centro de La Plata y otra en Microcentro (CABA).'
    },
    celular: {
      inicial: '📱 CELULARES DISPONIBLES 📱',
      final: '🛡️ GARANTÍAS\nProductos nuevos 6 meses.\nProductos reacondicionados 3 meses.\n\n💳 MÉTODOS DE PAGO\nEfectivo (pesos o dólares)\nTransferencia (+5%)\nTarjeta de crédito (+30% en hasta 3 cuotas)\nCriptomonedas\n\n🏢 OFICINAS\nTenemos dos sucursales, una en el centro de La Plata y otra en Microcentro (CABA).'
    },
    otro: {
      inicial: '📦 ACCESORIOS Y MÁS 📦',
      final: '🛡️ GARANTÍAS\nProductos nuevos 6 meses.\nProductos reacondicionados 3 meses.\n\n💳 MÉTODOS DE PAGO\nEfectivo (pesos o dólares)\nTransferencia (+5%)\nTarjeta de crédito (+30% en hasta 3 cuotas)\nCriptomonedas\n\n🏢 OFICINAS\nTenemos dos sucursales, una en el centro de La Plata y otra en Microcentro (CABA).'
    }
  });

  const [editandoMensaje, setEditandoMensaje] = useState(null);
  const [mensajeTemp, setMensajeTemp] = useState('');
  
  // Estados para filtros avanzados
  const [modoFiltros, setModoFiltros] = useState(false);
  const [filtroExcluirMarca, setFiltroExcluirMarca] = useState('');
  const [filtros, setFiltros] = useState({
    marca: '',
    condicion: '',
    precioMax: '',
    ramMin: '',
    almacenamientoMin: '',
    pantalla: '',
    idioma: ''
  });

  // Función para extraer números de strings (ej: "16GB" -> 16, "512GB SSD" -> 512)
  const extractNumber = (str) => {
    if (!str) return 0;
    const match = str.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Obtener productos del tipo activo
  const getProductosActivos = () => {
    switch (tipoActivo) {
      case 'computadora': 
        return computers.map(p => ({ ...p, tipo: 'computadora' }));
      case 'celular': 
        return celulares.map(p => ({ ...p, tipo: 'celular' }));
      case 'otro': 
        return otros.map(p => ({ ...p, tipo: 'otro' }));
      default: 
        return [];
    }
  };

  // Generar copys cuando cambien los productos o tipo activo
  useEffect(() => {
    const productos = getProductosActivos();
    const productosConCopyGenerado = productos.map(producto => ({
      ...producto,
      copy: generateCopy(producto, { version: 'listas' })
    }));
    setProductosConCopy(productosConCopyGenerado);
    setSeleccionados(new Set()); // Limpiar selección al cambiar tipo
  }, [tipoActivo, computers, celulares, otros]);

  // Las funciones de generación de copy ahora están unificadas en copyGenerator.js

  // Filtrar productos con filtros avanzados
  const productosFiltrados = productosConCopy.filter(producto => {
    // Filtro por búsqueda
    const cumpleBusqueda = busqueda === '' || 
      (producto.modelo && producto.modelo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (producto.descripcion_producto && producto.descripcion_producto.toLowerCase().includes(busqueda.toLowerCase())) ||
      (producto.serial && producto.serial.toLowerCase().includes(busqueda.toLowerCase()));

    if (!modoFiltros) return cumpleBusqueda;

    // Filtros avanzados solo se aplican si están activos
    const cumpleMarca = filtros.marca === '' || (producto.marca && producto.marca.toLowerCase() === filtros.marca.toLowerCase());
    const cumpleExclusionMarca = filtroExcluirMarca === '' || !producto.marca || producto.marca.toLowerCase() !== filtroExcluirMarca.toLowerCase();
    const cumpleCondicion = filtros.condicion === '' || (producto.condicion && producto.condicion.toLowerCase() === filtros.condicion.toLowerCase());
    
    // Debug temporal
    if (filtros.marca === 'Apple' && filtros.condicion === 'nueva') {
      console.log('🍎 Debug Apple Nueva:', {
        modelo: producto.modelo,
        marca: producto.marca,
        condicion: producto.condicion,
        cumpleMarca,
        cumpleCondicion,
        cumpleBusqueda
      });
    }
    
    const cumpleFiltros = 
      cumpleMarca &&
      cumpleExclusionMarca &&
      cumpleCondicion &&
      // Filtro por precio
      (filtros.precioMax === '' || (producto.precio_venta_usd <= parseFloat(filtros.precioMax))) &&
      // Filtro por RAM (solo para computadoras)
      (tipoActivo !== 'computadora' || filtros.ramMin === '' || extractNumber(producto.ram || producto.memoria_ram) >= parseInt(filtros.ramMin)) &&
      // Filtro por almacenamiento (SSD para computadoras, capacidad para celulares)
      (filtros.almacenamientoMin === '' || extractNumber(producto.ssd || producto.capacidad) >= parseInt(filtros.almacenamientoMin)) &&
      // Filtro por pantalla
      (filtros.pantalla === '' || (producto.pantalla && producto.pantalla.toLowerCase().includes(filtros.pantalla.toLowerCase()))) &&
      // Filtro por idioma
      (filtros.idioma === '' || (producto.idioma_teclado && producto.idioma_teclado.toLowerCase().includes(filtros.idioma.toLowerCase())));

    return cumpleBusqueda && cumpleFiltros;
  });

  // Manejar selección de productos
  const toggleSeleccion = (productoId) => {
    const nuevaSeleccion = new Set(seleccionados);
    if (nuevaSeleccion.has(productoId)) {
      nuevaSeleccion.delete(productoId);
    } else {
      nuevaSeleccion.add(productoId);
    }
    setSeleccionados(nuevaSeleccion);
  };

  const seleccionarTodos = () => {
    if (seleccionados.size === productosFiltrados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(productosFiltrados.map(p => p.id)));
    }
  };

  // Generar lista completa con mensajes
  const generarListaCompleta = () => {
    const productosSeleccionados = productosConCopy.filter(p => seleccionados.has(p.id));
    const copysSeleccionados = productosSeleccionados.map(p => p.copy);
    
    const lista = [
      mensajes[tipoActivo].inicial,
      '',
      ...copysSeleccionados,
      '',
      mensajes[tipoActivo].final
    ].join('\n');
    
    return lista;
  };

  // Copiar lista completa al portapapeles
  const copiarListaCompleta = async () => {
    if (seleccionados.size === 0) return;
    
    try {
      const lista = generarListaCompleta();
      await navigator.clipboard.writeText(lista);
      setCopiados(prev => new Set([...prev, 'lista-completa']));
      
      setTimeout(() => {
        setCopiados(prev => {
          const nuevos = new Set(prev);
          nuevos.delete('lista-completa');
          return nuevos;
        });
      }, 2000);
    } catch (err) {
      console.error('Error copiando lista:', err);
    }
  };

  // Manejar edición de mensajes
  const iniciarEdicionMensaje = (tipo, tipoMensaje) => {
    setEditandoMensaje(`${tipo}-${tipoMensaje}`);
    setMensajeTemp(mensajes[tipo][tipoMensaje]);
  };

  const guardarMensaje = (tipo, tipoMensaje) => {
    setMensajes(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [tipoMensaje]: mensajeTemp
      }
    }));
    setEditandoMensaje(null);
    setMensajeTemp('');
  };

  const cancelarEdicionMensaje = () => {
    setEditandoMensaje(null);
    setMensajeTemp('');
  };

  // Funciones para filtros prearmados
  const aplicarFiltroiPhoneUsado = () => {
    setTipoActivo('celular');
    setModoFiltros(true);
    setFiltros({
      marca: 'Apple',
      condicion: 'usada',
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: ''
    });
    setBusqueda('iPhone');
  };

  const aplicarFiltroiPhoneNuevo = () => {
    setTipoActivo('celular');
    setModoFiltros(true);
    setFiltros({
      marca: 'Apple',
      condicion: 'nueva',
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: ''
    });
    setBusqueda('iPhone');
  };

  const aplicarFiltroMacBooksNuevas = () => {
    setTipoActivo('computadora');
    setModoFiltros(true);
    setFiltros({
      marca: 'Apple',
      condicion: 'nueva',
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: ''
    });
    setBusqueda(''); // Eliminar búsqueda específica
    setFiltroExcluirMarca(''); // Limpiar exclusiones
  };

  const aplicarFiltroMacBooksUsadas = () => {
    setTipoActivo('computadora');
    setModoFiltros(true);
    setFiltros({
      marca: 'Apple',
      condicion: 'usada',
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: ''
    });
    setBusqueda(''); // Eliminar búsqueda específica
    setFiltroExcluirMarca(''); // Limpiar exclusiones
  };

  const aplicarFiltroWindowsNuevas = () => {
    setTipoActivo('computadora');
    setModoFiltros(true);
    setFiltros({
      marca: '',
      condicion: 'nueva',
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: ''
    });
    setBusqueda('');
    // Aplicar filtro especial para excluir Apple
    setFiltroExcluirMarca('Apple');
  };

  const aplicarFiltroWindowsUsadas = () => {
    setTipoActivo('computadora');
    setModoFiltros(true);
    setFiltros({
      marca: '',
      condicion: 'usada',
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: ''
    });
    setBusqueda('');
    // Aplicar filtro especial para excluir Apple
    setFiltroExcluirMarca('Apple');
  };

  const limpiarFiltros = () => {
    setFiltros({
      marca: '',
      condicion: '',
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: ''
    });
    setBusqueda('');
    setModoFiltros(false);
    setFiltroExcluirMarca('');
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Obtener valores únicos del stock actual
  const getUniqueValues = () => {
    const productos = getProductosActivos();
    
    const marcas = [...new Set(productos.map(p => p.marca).filter(Boolean))].sort();
    const condiciones = [...new Set(productos.map(p => p.condicion).filter(Boolean))].sort();
    const pantallas = [...new Set(productos.map(p => p.pantalla).filter(Boolean))].sort();
    const idiomas = [...new Set(productos.map(p => p.idioma_teclado).filter(Boolean))].sort();
    
    return { marcas, condiciones, pantallas, idiomas };
  };

  // Obtener configuración de cada tipo
  const getTipoConfig = (tipo) => {
    switch (tipo) {
      case 'computadora':
        return { 
          label: 'Notebooks', 
          icon: Monitor, 
          color: 'blue',
          bgColor: 'bg-blue-500',
          borderColor: 'border-black-500',
          textColor: 'text-white-600'
        };
      case 'celular':
        return { 
          label: 'Celulares', 
          icon: Smartphone, 
          color: 'green',
          bgColor: 'bg-green-500',
          borderColor: 'border-green-500',
          textColor: 'text-green-600'
        };
      case 'otro':
        return { 
          label: 'Otros', 
          icon: Box, 
          color: 'purple',
          bgColor: 'bg-purple-500',
          borderColor: 'border-purple-500',
          textColor: 'text-purple-600'
        };
      default:
        return { 
          label: 'Productos', 
          icon: FileText, 
          color: 'gray',
          bgColor: 'bg-gray-500',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-600'
        };
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="ml-2 text-slate-600">Cargando productos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const tipoConfig = getTipoConfig(tipoActivo);

  return (
    <div className="p-0">
      

      {/* Tabs para tipos de productos */}
      <div className="bg-slate-800 p-6 rounded border border-slate-200 mb-6">
        <div className="flex space-x-1 bg-slate-700 p-1 rounded">
          {['computadora', 'celular', 'otro'].map((tipo) => {
            const config = getTipoConfig(tipo);
            const Icon = config.icon;
            return (
              <button
                key={tipo}
                onClick={() => setTipoActivo(tipo)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded transition-colors ${
                  tipoActivo === tipo
                    ? 'bg-emerald-600 text-white'
                    : 'text-white hover:text-slate-800 hover:bg-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{config.label}</span>
                <span className="text-sm opacity-75">
                  ({tipo === 'computadora' ? computers.length : 
                    tipo === 'celular' ? celulares.length : otros.length})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sección de filtros avanzados y presets */}
      <div className="bg-white p-6 rounded border border-slate-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Selección por Filtros</span>
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setModoFiltros(!modoFiltros)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                modoFiltros 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {modoFiltros ? 'Filtros Activos' : 'Activar Filtros'}
            </button>
            {modoFiltros && (
              <button
                onClick={limpiarFiltros}
                className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm font-medium hover:bg-slate-200"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Filtros prearmados */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center space-x-1">
            <Zap className="w-4 h-4" />
            <span>Filtros Prearmados</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {/* Filtros para celulares */}
            <button
              onClick={aplicarFiltroiPhoneUsado}
              className="px-3 py-2 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-700 transition-colors flex items-center space-x-1"
            >
              <Smartphone className="w-4 h-4" />
              <span>iPhone Usados</span>
            </button>
            <button
              onClick={aplicarFiltroiPhoneNuevo}
              className="px-3 py-2 bg-slate-800 text-white  rounded text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center space-x-1"
            >
              <Smartphone className="w-4 h-4" />
              <span>iPhone Nuevos</span>
            </button>
            
            {/* Filtros para notebooks */}
            <button
              onClick={aplicarFiltroMacBooksNuevas}
              className="px-3 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center space-x-1"
            >
              <Monitor className="w-4 h-4" />
              <span>MacBooks Nuevas</span>
            </button>
            <button
              onClick={aplicarFiltroMacBooksUsadas}
              className="px-3 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-slate-700 transition-colors flex items-center space-x-1"
            >
              <Monitor className="w-4 h-4" />
              <span>MacBooks Usadas</span>
            </button>
            <button
              onClick={aplicarFiltroWindowsNuevas}
              className="px-3 py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center space-x-1"
            >
              <Monitor className="w-4 h-4" />
              <span>Windows Nuevas</span>
            </button>
            <button
              onClick={aplicarFiltroWindowsUsadas}
              className="px-3 py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700 transition-colors flex items-center space-x-1"
            >
              <Monitor className="w-4 h-4" />
              <span>Windows Usadas</span>
            </button>
          </div>
        </div>

        {/* Filtros personalizables - Solo para computadoras y celulares */}
        {modoFiltros && tipoActivo !== 'otro' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Marca</label>
              <select
                value={filtros.marca}
                onChange={(e) => handleFiltroChange('marca', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todas</option>
                {getUniqueValues().marcas.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Condición</label>
              <select
                value={filtros.condicion}
                onChange={(e) => handleFiltroChange('condicion', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todas</option>
                {getUniqueValues().condiciones.map(condicion => (
                  <option key={condicion} value={condicion}>{condicion.charAt(0).toUpperCase() + condicion.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Precio Max USD</label>
              <input
                type="number"
                value={filtros.precioMax}
                onChange={(e) => handleFiltroChange('precioMax', e.target.value)}
                placeholder="999999"
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {tipoActivo === 'computadora' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">RAM Min (GB)</label>
                <input
                  type="number"
                  value={filtros.ramMin}
                  onChange={(e) => handleFiltroChange('ramMin', e.target.value)}
                  placeholder="4"
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {tipoActivo === 'computadora' ? 'SSD Min (GB)' : 'Capacidad Min (GB)'}
              </label>
              <input
                type="number"
                value={filtros.almacenamientoMin}
                onChange={(e) => handleFiltroChange('almacenamientoMin', e.target.value)}
                placeholder="128"
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Pantalla</label>
              <select
                value={filtros.pantalla}
                onChange={(e) => handleFiltroChange('pantalla', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todas</option>
                {getUniqueValues().pantallas.map(pantalla => (
                  <option key={pantalla} value={pantalla}>{pantalla}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Idioma</label>
              <select
                value={filtros.idioma}
                onChange={(e) => handleFiltroChange('idioma', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todos</option>
                {getUniqueValues().idiomas.map(idioma => (
                  <option key={idioma} value={idioma}>{idioma}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay filtros disponibles para otros productos */}
        {modoFiltros && tipoActivo === 'otro' && (
          <div className="text-center py-8 text-slate-500">
            <p>Los filtros avanzados no están disponibles para otros productos.</p>
            <p>Usa la búsqueda por texto para filtrar elementos.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Configuración de mensajes */}
        <div className="space-y-6">
          {/* Mensaje inicial */}
          <div className="bg-white p-6 rounded border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Mensaje Inicial</h3>
              <button
                onClick={() => iniciarEdicionMensaje(tipoActivo, 'inicial')}
                className="text-slate-500 hover:text-slate-700"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            
            {editandoMensaje === `${tipoActivo}-inicial` ? (
              <div className="space-y-3">
                <textarea
                  value={mensajeTemp}
                  onChange={(e) => setMensajeTemp(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="3"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => guardarMensaje(tipoActivo, 'inicial')}
                    className="px-3 py-1 bg-emerald-600 text-white rounded text-sm flex items-center space-x-1 hover:bg-emerald-700 transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={cancelarEdicionMensaje}
                    className="px-3 py-1 bg-slate-600 text-white rounded text-sm flex items-center space-x-1 hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded text-sm whitespace-pre-line">
                {mensajes[tipoActivo].inicial}
              </div>
            )}
          </div>

          {/* Mensaje final */}
          <div className="bg-white p-6 rounded border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Mensaje Final</h3>
              <button
                onClick={() => iniciarEdicionMensaje(tipoActivo, 'final')}
                className="text-slate-500 hover:text-slate-700"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            
            {editandoMensaje === `${tipoActivo}-final` ? (
              <div className="space-y-3">
                <textarea
                  value={mensajeTemp}
                  onChange={(e) => setMensajeTemp(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows="4"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => guardarMensaje(tipoActivo, 'final')}
                    className="px-3 py-1 bg-emerald-600 text-white rounded text-sm flex items-center space-x-1 hover:bg-emerald-700 transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={cancelarEdicionMensaje}
                    className="px-3 py-1 bg-slate-600 text-white rounded text-sm flex items-center space-x-1 hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded text-sm whitespace-pre-line">
                {mensajes[tipoActivo].final}
              </div>
            )}
          </div>

          {/* Botón para copiar lista */}
          {seleccionados.size > 0 && (
            <div className="bg-white p-6 rounded border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4">Lista Generada</h3>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">
                  {seleccionados.size} producto{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}
                </div>
                <button
                  onClick={copiarListaCompleta}
                  className={`w-full py-3 px-4 rounded font-medium transition-colors flex items-center justify-center space-x-2 ${
                    copiados.has('lista-completa')
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {copiados.has('lista-completa') ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>{copiados.has('lista-completa') ? 'Lista Copiada!' : 'Copiar Lista Completa'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: Tabla de productos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Búsqueda y controles */}
          <div className="bg-white p-6 rounded border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">
                {tipoConfig.label} Disponibles ({productosFiltrados.length})
              </h3>
              <button
                onClick={seleccionarTodos}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  seleccionados.size === productosFiltrados.length && productosFiltrados.length > 0
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {seleccionados.size === productosFiltrados.length && productosFiltrados.length > 0 
                  ? 'Deseleccionar Todos' 
                  : 'Seleccionar Todos'
                }
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Buscar ${tipoConfig.label.toLowerCase()}...`}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="bg-white rounded border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase w-12">
                      <input
                        type="checkbox"
                        checked={seleccionados.size === productosFiltrados.length && productosFiltrados.length > 0}
                        onChange={seleccionarTodos}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Serial</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Modelo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Copy</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {productosFiltrados.map((producto) => (
                    <tr key={producto.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={seleccionados.has(producto.id)}
                          onChange={() => toggleSeleccion(producto.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-800">
                        {producto.serial || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                        {producto.modelo || producto.descripcion_producto}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800">
                        <div className="max-w-md truncate" title={producto.copy}>
                          {producto.copy}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {productosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <tipoConfig.icon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No se encontraron {tipoConfig.label.toLowerCase()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Listas;