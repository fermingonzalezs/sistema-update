import React, { useState, useEffect } from 'react';
import { 
  Copy, Monitor, Smartphone, Box, Search, 
  Check, FileText, Edit2, Save, X, Filter, Zap
} from 'lucide-react';

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
      final: '💬 Consultas por WhatsApp\n📱 Aceptamos todas las tarjetas\n🚚 Envíos a todo el país'
    },
    celular: {
      inicial: '📱 CELULARES DISPONIBLES 📱',
      final: '💬 Consultas por WhatsApp\n📱 Aceptamos todas las tarjetas\n🚚 Envíos a todo el país'
    },
    otro: {
      inicial: '📦 ACCESORIOS Y MÁS 📦',
      final: '💬 Consultas por WhatsApp\n📱 Aceptamos todas las tarjetas\n🚚 Envíos a todo el país'
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
      copy: generarCopy(producto)
    }));
    setProductosConCopy(productosConCopyGenerado);
    setSeleccionados(new Set()); // Limpiar selección al cambiar tipo
  }, [tipoActivo, computers, celulares, otros]);

  // Función para generar copy completo
  const generarCopy = (producto) => {
    const { tipo } = producto;
    
    if (tipo === 'computadora') {
      return generarCopyComputadora(producto);
    } else if (tipo === 'celular') {
      return generarCopyCelular(producto);
    } else if (tipo === 'otro') {
      return generarCopyOtro(producto);
    }
    
    return 'Producto sin copy configurado';
  };

  // Copy para computadoras
  const generarCopyComputadora = (comp) => {
    const partes = [];
    
    partes.push('💻' + (comp.modelo || 'Sin modelo'));
    
    if (comp.procesador) partes.push(`Procesador: ${comp.procesador}`);
    if (comp.memoria_ram) partes.push(`Memoria RAM: ${comp.memoria_ram}`);
    if (comp.ssd && comp.ssd !== 'N/A') partes.push(`SSD: ${comp.ssd}`);
    if (comp.hdd && comp.hdd !== 'N/A') partes.push(`HDD: ${comp.hdd}`);
    if (comp.pantalla) partes.push(`Pantalla: ${comp.pantalla}`);
    if (comp.resolucion) partes.push(`${comp.resolucion}`);
    if (comp.sistema_operativo) partes.push(`Sistema operativo: ${comp.sistema_operativo}`);
    if (comp.placa_de_video) partes.push(`Placa de video: ${comp.placa_de_video}`);
    if (comp.porcentaje_de_bateria > 0) partes.push(`Batería: ${comp.porcentaje_de_bateria}%`);
    if (comp.duracion_de_bateria) partes.push(`Duración: ${comp.duracion_de_bateria}`);
    if (comp.color) partes.push(`Color: ${comp.color}`);
    if (comp.idioma) partes.push(`Idioma: ${comp.idioma}`);
    if (comp.condicion) partes.push(`Condición: ${comp.condicion.toUpperCase()}`);
    if (comp.estado_estetico) partes.push(`Estado: ${getEstadoLetra(comp.estado_estetico)}`);
    if (comp.garantia) partes.push(`Garantía: ${comp.garantia}`);
    if (comp.precio_venta_usd > 0) partes.push(`$${comp.precio_venta_usd}`);
    
    return partes.join(' - ');
  };

  // Copy para celulares
  const generarCopyCelular = (cel) => {
    const partes = [];
    
    // Emoji del teléfono + modelo
    partes.push('📱' + (cel.modelo || 'Sin modelo'));
    
    // Capacidad de almacenamiento
    if (cel.capacidad) partes.push(cel.capacidad);
    
    // Color
    if (cel.color) partes.push(cel.color.toUpperCase());
    
    // Batería con emoji
    if (cel.bateria) partes.push(`🔋${cel.bateria}%`);
    
    // Condición en mayúsculas
    if (cel.condicion) partes.push(cel.condicion.toUpperCase());
    
    // Precio con formato US
    if (cel.precio_venta_usd > 0) partes.push(`U$${cel.precio_venta_usd}`);
    
    return partes.join(' ');
  };

  // Copy para otros productos
  const generarCopyOtro = (otro) => {
    const partes = [];
    
    partes.push('📦' + (otro.descripcion_producto || 'Sin descripción'));
    
    if (otro.marca) partes.push(`Marca: ${otro.marca}`);
    if (otro.modelo) partes.push(`Modelo: ${otro.modelo}`);
    if (otro.color) partes.push(`Color: ${otro.color}`);
    if (otro.condicion) partes.push(`Condición: ${otro.condicion.toUpperCase()}`);
    if (otro.estado_estetico) partes.push(`Estado: ${getEstadoLetra(otro.estado_estetico)}`);
    if (otro.cantidad > 1) partes.push(`Stock: ${otro.cantidad} unidades`);
    if (otro.garantia) partes.push(`Garantía: ${otro.garantia}`);
    if (otro.precio_venta_usd > 0) partes.push(`$${otro.precio_venta_usd}`);
    
    return partes.join(' - ');
  };

  // Convertir estado estético a letra
  const getEstadoLetra = (estado) => {
    if (!estado) return 'N/A';
    
    switch (estado.toLowerCase()) {
      case 'nuevo': return 'A++';
      case 'excelente': return 'A+';
      case 'muy bueno': return 'A';
      case 'bueno': return 'B';
      case 'regular': return 'C';
      default: return estado;
    }
  };

  // Filtrar productos con filtros avanzados
  const productosFiltrados = productosConCopy.filter(producto => {
    // Filtro por búsqueda
    const cumpleBusqueda = busqueda === '' || 
      (producto.modelo && producto.modelo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (producto.descripcion_producto && producto.descripcion_producto.toLowerCase().includes(busqueda.toLowerCase())) ||
      (producto.serial && producto.serial.toLowerCase().includes(busqueda.toLowerCase()));

    if (!modoFiltros) return cumpleBusqueda;

    // Filtros avanzados solo se aplican si están activos
    const cumpleFiltros = 
      // Filtro por marca
      (filtros.marca === '' || (producto.marca && producto.marca.toLowerCase() === filtros.marca.toLowerCase())) &&
      // Filtro para excluir marca específica (usado para Windows)
      (filtroExcluirMarca === '' || !producto.marca || producto.marca.toLowerCase() !== filtroExcluirMarca.toLowerCase()) &&
      // Filtro por condición
      (filtros.condicion === '' || (producto.condicion && producto.condicion.toLowerCase() === filtros.condicion.toLowerCase())) &&
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

  // Función para extraer números de strings (ej: "16GB" -> 16, "512GB SSD" -> 512)
  const extractNumber = (str) => {
    if (!str) return 0;
    const match = str.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

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
      condicion: 'usado',
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
      condicion: 'nuevo',
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
      condicion: 'nuevo',
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: ''
    });
    setBusqueda('MacBook');
  };

  const aplicarFiltroMacBooksUsadas = () => {
    setTipoActivo('computadora');
    setModoFiltros(true);
    setFiltros({
      marca: 'Apple',
      condicion: 'usado',
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: ''
    });
    setBusqueda('MacBook');
  };

  const aplicarFiltroWindowsNuevas = () => {
    setTipoActivo('computadora');
    setModoFiltros(true);
    setFiltros({
      marca: '',
      condicion: 'nuevo',
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
      condicion: 'usado',
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
          borderColor: 'border-blue-500',
          textColor: 'text-blue-600'
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Cargando productos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const tipoConfig = getTipoConfig(tipoActivo);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-gray-900 to-black p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText size={28} />
              <div>
                <h2 className="text-2xl font-bold">Listas</h2>
                <p className="text-gray-300 mt-1">Genera textos para publicar productos en redes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs para tipos de productos */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {['computadora', 'celular', 'otro'].map((tipo) => {
          const config = getTipoConfig(tipo);
          const Icon = config.icon;
          return (
            <button
              key={tipo}
              onClick={() => setTipoActivo(tipo)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all ${
                tipoActivo === tipo
                  ? `${config.bgColor} text-white shadow-md`
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white'
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

      {/* Sección de filtros avanzados y presets */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Selección por Filtros</span>
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setModoFiltros(!modoFiltros)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                modoFiltros 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {modoFiltros ? 'Filtros Activos' : 'Activar Filtros'}
            </button>
            {modoFiltros && (
              <button
                onClick={limpiarFiltros}
                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Filtros prearmados */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
            <Zap className="w-4 h-4" />
            <span>Filtros Prearmados</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {/* Filtros para celulares */}
            <button
              onClick={aplicarFiltroiPhoneUsado}
              className="px-3 py-2 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-900 transition-colors flex items-center space-x-1"
            >
              <Smartphone className="w-4 h-4" />
              <span>iPhone Usados</span>
            </button>
            <button
              onClick={aplicarFiltroiPhoneNuevo}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <Smartphone className="w-4 h-4" />
              <span>iPhone Nuevos</span>
            </button>
            
            {/* Filtros para notebooks */}
            <button
              onClick={aplicarFiltroMacBooksNuevas}
              className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1"
            >
              <Monitor className="w-4 h-4" />
              <span>MacBooks Nuevas</span>
            </button>
            <button
              onClick={aplicarFiltroMacBooksUsadas}
              className="px-3 py-2 bg-gray-700 text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors flex items-center space-x-1"
            >
              <Monitor className="w-4 h-4" />
              <span>MacBooks Usadas</span>
            </button>
            <button
              onClick={aplicarFiltroWindowsNuevas}
              className="px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-1"
            >
              <Monitor className="w-4 h-4" />
              <span>Windows Nuevas</span>
            </button>
            <button
              onClick={aplicarFiltroWindowsUsadas}
              className="px-3 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 transition-colors flex items-center space-x-1"
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Marca</label>
              <select
                value={filtros.marca}
                onChange={(e) => handleFiltroChange('marca', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Todas</option>
                {getUniqueValues().marcas.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Condición</label>
              <select
                value={filtros.condicion}
                onChange={(e) => handleFiltroChange('condicion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Todas</option>
                {getUniqueValues().condiciones.map(condicion => (
                  <option key={condicion} value={condicion}>{condicion.charAt(0).toUpperCase() + condicion.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Precio Max USD</label>
              <input
                type="number"
                value={filtros.precioMax}
                onChange={(e) => handleFiltroChange('precioMax', e.target.value)}
                placeholder="999999"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            {tipoActivo === 'computadora' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">RAM Min (GB)</label>
                <input
                  type="number"
                  value={filtros.ramMin}
                  onChange={(e) => handleFiltroChange('ramMin', e.target.value)}
                  placeholder="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {tipoActivo === 'computadora' ? 'SSD Min (GB)' : 'Capacidad Min (GB)'}
              </label>
              <input
                type="number"
                value={filtros.almacenamientoMin}
                onChange={(e) => handleFiltroChange('almacenamientoMin', e.target.value)}
                placeholder="128"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pantalla</label>
              <select
                value={filtros.pantalla}
                onChange={(e) => handleFiltroChange('pantalla', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Todas</option>
                {getUniqueValues().pantallas.map(pantalla => (
                  <option key={pantalla} value={pantalla}>{pantalla}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Idioma</label>
              <select
                value={filtros.idioma}
                onChange={(e) => handleFiltroChange('idioma', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
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
          <div className="text-center py-8 text-gray-500">
            <p>Los filtros avanzados no están disponibles para otros productos.</p>
            <p>Usa la búsqueda por texto para filtrar elementos.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Configuración de mensajes */}
        <div className="space-y-6">
          {/* Mensaje inicial */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Mensaje Inicial</h3>
              <button
                onClick={() => iniciarEdicionMensaje(tipoActivo, 'inicial')}
                className="text-gray-500 hover:text-gray-700"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            
            {editandoMensaje === `${tipoActivo}-inicial` ? (
              <div className="space-y-3">
                <textarea
                  value={mensajeTemp}
                  onChange={(e) => setMensajeTemp(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  rows="3"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => guardarMensaje(tipoActivo, 'inicial')}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center space-x-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={cancelarEdicionMensaje}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm flex items-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">
                {mensajes[tipoActivo].inicial}
              </div>
            )}
          </div>

          {/* Mensaje final */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Mensaje Final</h3>
              <button
                onClick={() => iniciarEdicionMensaje(tipoActivo, 'final')}
                className="text-gray-500 hover:text-gray-700"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            
            {editandoMensaje === `${tipoActivo}-final` ? (
              <div className="space-y-3">
                <textarea
                  value={mensajeTemp}
                  onChange={(e) => setMensajeTemp(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  rows="4"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => guardarMensaje(tipoActivo, 'final')}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center space-x-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={cancelarEdicionMensaje}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm flex items-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">
                {mensajes[tipoActivo].final}
              </div>
            )}
          </div>

          {/* Botón para copiar lista */}
          {seleccionados.size > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">Lista Generada</h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  {seleccionados.size} producto{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}
                </div>
                <button
                  onClick={copiarListaCompleta}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                    copiados.has('lista-completa')
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : `${tipoConfig.bgColor} text-white hover:opacity-90`
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
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                {tipoConfig.label} Disponibles ({productosFiltrados.length})
              </h3>
              <button
                onClick={seleccionarTodos}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  seleccionados.size === productosFiltrados.length && productosFiltrados.length > 0
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : `${tipoConfig.bgColor} text-white hover:opacity-90`
                }`}
              >
                {seleccionados.size === productosFiltrados.length && productosFiltrados.length > 0 
                  ? 'Deseleccionar Todos' 
                  : 'Seleccionar Todos'
                }
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Buscar ${tipoConfig.label.toLowerCase()}...`}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                      <input
                        type="checkbox"
                        checked={seleccionados.size === productosFiltrados.length && productosFiltrados.length > 0}
                        onChange={seleccionarTodos}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Copy</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productosFiltrados.map((producto) => (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={seleccionados.has(producto.id)}
                          onChange={() => toggleSeleccion(producto.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {producto.serial || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {producto.modelo || producto.descripcion_producto}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
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
                <tipoConfig.icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron {tipoConfig.label.toLowerCase()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Listas;