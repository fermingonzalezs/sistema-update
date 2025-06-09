import React, { useState, useEffect } from 'react';
import { 
  Copy, Monitor, Smartphone, Box, Search, 
  Check, FileText, Edit2, Save, X
} from 'lucide-react';

const CopysSection = ({ computers, celulares, otros, loading, error }) => {
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
    
    partes.push('📱' + (cel.modelo || 'Sin modelo'));
    
    if (cel.procesador) partes.push(`Procesador: ${cel.procesador}`);
    if (cel.capacidad) partes.push(`Capacidad: ${cel.capacidad}`);
    if (cel.memoria_ram) partes.push(`RAM: ${cel.memoria_ram}`);
    if (cel.pantalla) partes.push(`Pantalla: ${cel.pantalla}`);
    if (cel.sistema_operativo) partes.push(`SO: ${cel.sistema_operativo}`);
    if (cel.color) partes.push(`Color: ${cel.color}`);
    if (cel.condicion) partes.push(`Condición: ${cel.condicion.toUpperCase()}`);
    if (cel.estado_estetico) partes.push(`Estado: ${getEstadoLetra(cel.estado_estetico)}`);
    if (cel.ciclos > 0) partes.push(`Ciclos: ${cel.ciclos}`);
    if (cel.garantia) partes.push(`Garantía: ${cel.garantia}`);
    if (cel.precio_venta_usd > 0) partes.push(`$${cel.precio_venta_usd}`);
    
    return partes.join(' - ');
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

  // Filtrar productos
  const productosFiltrados = productosConCopy.filter(producto => {
    const cumpleBusqueda = busqueda === '' || 
      (producto.modelo && producto.modelo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (producto.descripcion_producto && producto.descripcion_producto.toLowerCase().includes(busqueda.toLowerCase())) ||
      (producto.serial && producto.serial.toLowerCase().includes(busqueda.toLowerCase()));

    return cumpleBusqueda;
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
      <div className="mb-8 bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-8 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-4xl font-bold text-white drop-shadow">Generador de Copys</h2>
          <p className="text-white/80 text-xl mt-2">Genera textos para publicar productos en redes</p>
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

export default CopysSection;