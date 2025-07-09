import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, Trash2, Star, Edit2, Save, X, 
  AlertCircle, CheckCircle, Image, Eye, Monitor, 
  Smartphone, Box, Search, BarChart3, TrendingUp,
  Loader2,AlertTriangle, Plus, Filter
} from 'lucide-react';
import { fotosService } from '../hooks/useFotos';

const GestionFotos = ({ computers, celulares, otros, loading, error }) => {
  // Estados para estadísticas y productos
  const [estadisticas, setEstadisticas] = useState({
    totalProductos: 0,
    conFotos: 0,
    sinFotos: 0,
    conPrincipal: 0,
    porcentajeCompleto: 0
  });
  
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [fotosPorProducto, setFotosPorProducto] = useState({});

  // Estados para subida de archivos
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState('');
  const [fotosProductoActual, setFotosProductoActual] = useState([]);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [editandoDescripcion, setEditandoDescripcion] = useState(null);
  const [descripcionTemp, setDescripcionTemp] = useState('');
  const fileInputRef = useRef(null);

  // Combinar todos los productos
  const todosLosProductos = [
    ...computers.map(p => ({ ...p, tipo: 'computadora', nombre: p.modelo })),
    ...celulares.map(p => ({ ...p, tipo: 'celular', nombre: p.modelo })),
    ...otros.map(p => ({ ...p, tipo: 'otro', nombre: p.descripcion_producto }))
  ];

  // Cargar estadísticas al montar
  useEffect(() => {
    cargarEstadisticas();
  }, [computers, celulares, otros]);

  // Cargar fotos cuando se selecciona un producto
  useEffect(() => {
    if (productoSeleccionado) {
      cargarFotosProducto();
    }
  }, [productoSeleccionado]);

  const cargarEstadisticas = async () => {
    try {
      const stats = await fotosService.getEstadisticasFotos();
      setEstadisticas(stats);
      
      // Cargar fotos de productos para la tabla
      const fotosMap = {};
      for (const producto of todosLosProductos.slice(0, 30)) {
        try {
          const fotos = await fotosService.getFotosByProducto(producto.id, producto.tipo);
          fotosMap[`${producto.tipo}_${producto.id}`] = {
            cantidad: fotos.length,
            tienePrincipal: fotos.some(f => f.es_principal),
            fotoPrincipal: fotos.find(f => f.es_principal)?.url_foto
          };
        } catch (err) {
          console.warn(`Error cargando fotos para ${producto.tipo} ${producto.id}:`, err);
        }
      }
      setFotosPorProducto(fotosMap);
      
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  const cargarFotosProducto = async () => {
    if (!productoSeleccionado) return;
    
    try {
      const fotos = await fotosService.getFotosByProducto(
        productoSeleccionado.id, 
        productoSeleccionado.tipo
      );
      setFotosProductoActual(fotos);
    } catch (err) {
      setErrorSubida('Error cargando fotos: ' + err.message);
    }
  };

  // Manejar selección de archivos
  const manejarSeleccionArchivos = (event) => {
    if (!productoSeleccionado) {
      setErrorSubida('Primero selecciona un producto de la tabla');
      return;
    }

    const archivos = Array.from(event.target.files);
    
    archivos.forEach(archivo => {
      if (archivo.type.startsWith('image/')) {
        subirFoto(archivo);
      } else {
        setErrorSubida('Solo se permiten archivos de imagen');
      }
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const subirFoto = async (archivo, descripcion = '') => {
    if (!productoSeleccionado) {
      setErrorSubida('Selecciona un producto primero');
      return;
    }

    if (fotosProductoActual.length >= 5) {
      setErrorSubida('No se pueden subir más de 5 fotos por producto');
      return;
    }

    try {
      setSubiendo(true);
      setErrorSubida('');
      
      // Preview inmediato
      const reader = new FileReader();
      reader.onload = (e) => {
        const fotoTemp = {
          id: `temp_${Date.now()}`,
          url_foto: e.target.result,
          nombre_archivo: archivo.name,
          tamaño_archivo: archivo.size,
          descripcion: descripcion,
          es_principal: fotosProductoActual.length === 0,
          subiendo: true
        };
        setFotosProductoActual(prev => [...prev, fotoTemp]);
      };
      reader.readAsDataURL(archivo);
      
      // Subida real
      const nuevaFoto = await fotosService.subirFoto(
        archivo, 
        productoSeleccionado.id, 
        productoSeleccionado.tipo, 
        descripcion, 
        fotosProductoActual.length === 0
      );
      
      // Reemplazar temporal con real
      setFotosProductoActual(prev => prev.map(foto => 
        foto.id.toString().startsWith('temp_') && foto.nombre_archivo === archivo.name
          ? nuevaFoto
          : foto
      ));
      
      // Actualizar estadísticas
      actualizarFotosEnTabla(productoSeleccionado, [...fotosProductoActual.filter(f => !f.subiendo), nuevaFoto]);
      
    } catch (err) {
      setErrorSubida('Error subiendo foto: ' + err.message);
      setFotosProductoActual(prev => prev.filter(foto => 
        !(foto.id.toString().startsWith('temp_') && foto.nombre_archivo === archivo.name)
      ));
    } finally {
      setSubiendo(false);
    }
  };

  const eliminarFoto = async (fotoId) => {
    if (fotoId.toString().startsWith('temp_')) {
      setFotosProductoActual(prev => prev.filter(foto => foto.id !== fotoId));
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar esta foto?')) return;

    try {
      await fotosService.eliminarFoto(fotoId);
      const nuevasFotos = fotosProductoActual.filter(foto => foto.id !== fotoId);
      setFotosProductoActual(nuevasFotos);
      actualizarFotosEnTabla(productoSeleccionado, nuevasFotos);
    } catch (err) {
      setErrorSubida('Error eliminando foto: ' + err.message);
    }
  };

  const marcarComoPrincipal = async (fotoId) => {
    if (fotoId.toString().startsWith('temp_')) return;

    try {
      await fotosService.marcarComoPrincipal(fotoId);
      const fotosActualizadas = fotosProductoActual.map(foto => ({
        ...foto,
        es_principal: foto.id === fotoId
      }));
      setFotosProductoActual(fotosActualizadas);
      actualizarFotosEnTabla(productoSeleccionado, fotosActualizadas);
    } catch (err) {
      setErrorSubida('Error marcando como principal: ' + err.message);
    }
  };

  const actualizarDescripcion = async (fotoId, nuevaDescripcion) => {
    if (fotoId.toString().startsWith('temp_')) {
      setEditandoDescripcion(null);
      return;
    }

    try {
      await fotosService.actualizarDescripcion(fotoId, nuevaDescripcion);
      const fotosActualizadas = fotosProductoActual.map(foto => 
        foto.id === fotoId ? { ...foto, descripcion: nuevaDescripcion } : foto
      );
      setFotosProductoActual(fotosActualizadas);
      setEditandoDescripcion(null);
    } catch (err) {
      setErrorSubida('Error actualizando descripción: ' + err.message);
    }
  };

  const actualizarFotosEnTabla = (producto, fotos) => {
    setFotosPorProducto(prev => ({
      ...prev,
      [`${producto.tipo}_${producto.id}`]: {
        cantidad: fotos.length,
        tienePrincipal: fotos.some(f => f.es_principal),
        fotoPrincipal: fotos.find(f => f.es_principal)?.url_foto
      }
    }));
  };

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setErrorSubida('');
    setFotosProductoActual([]);
  };

  // Filtrar productos
  const productosFiltrados = todosLosProductos.filter(producto => {
    const fotos = fotosPorProducto[`${producto.tipo}_${producto.id}`];
    const cantidadFotos = fotos?.cantidad || 0;
    const tienePrincipal = fotos?.tienePrincipal || false;

    const cumpleTipo = filtroTipo === 'todos' || producto.tipo === filtroTipo;
    
    let cumpleEstado = true;
    if (filtroEstado !== 'todos') {
      switch (filtroEstado) {
        case 'sin_fotos': cumpleEstado = cantidadFotos === 0; break;
        case 'insuficientes': cumpleEstado = cantidadFotos > 0 && cantidadFotos < 2; break;
        case 'sin_principal': cumpleEstado = cantidadFotos > 0 && !tienePrincipal; break;
        case 'completas': cumpleEstado = cantidadFotos >= 2 && tienePrincipal; break;
      }
    }

    const cumpleBusqueda = busqueda === '' || 
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (producto.serial && producto.serial.toLowerCase().includes(busqueda.toLowerCase()));

    return cumpleTipo && cumpleEstado && cumpleBusqueda;
  });

  const getEstadoProducto = (producto) => {
    const fotos = fotosPorProducto[`${producto.tipo}_${producto.id}`];
    const cantidadFotos = fotos?.cantidad || 0;
    const tienePrincipal = fotos?.tienePrincipal || false;

    if (cantidadFotos === 0) {
      return { color: 'text-red-600 bg-red-50', texto: 'Sin fotos', icono: AlertTriangle };
    }
    if (cantidadFotos < 2) {
      return { color: 'text-orange-600 bg-orange-50', texto: `${cantidadFotos} foto${cantidadFotos !== 1 ? 's' : ''}`, icono: Camera };
    }
    if (!tienePrincipal) {
      return { color: 'text-yellow-600 bg-yellow-50', texto: 'Sin principal', icono: AlertTriangle };
    }
    return { color: 'text-green-600 bg-green-50', texto: `${cantidadFotos} fotos ✓`, icono: CheckCircle };
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4 text-blue-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-green-600" />;
      case 'otro': return <Box className="w-4 h-4 text-purple-600" />;
      default: return null;
    }
  };

  const formatearTamaño = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando productos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
        <div className="p-4 text-white" style={{backgroundColor: '#262626'}}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Camera size={28} />
              <div>
                <h2 className="text-2xl font-bold">Gestión de Fotos</h2>
                <p className="text-gray-300 mt-1">Sistema de gestión de fotos para productos</p>
              </div>
            </div>
            <button
              onClick={cargarEstadisticas}
              className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Actualizar Stats
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Productos</p>
              <p className="text-3xl font-bold">{estadisticas.totalProductos}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Sin Fotos</p>
              <p className="text-3xl font-bold">{estadisticas.sinFotos}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Con Fotos</p>
              <p className="text-3xl font-bold">{estadisticas.conFotos}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">% Completado</p>
              <p className="text-3xl font-bold">{estadisticas.porcentajeCompleto}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Sección de subida de fotos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Upload className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Subir Fotos</h3>
              <p className="text-sm text-gray-600">
                {productoSeleccionado 
                  ? `Seleccionado: ${productoSeleccionado.nombre}` 
                  : 'Selecciona un producto de la tabla para subir fotos'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!productoSeleccionado || subiendo || fotosProductoActual.length >= 5}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                !productoSeleccionado || subiendo || fotosProductoActual.length >= 5
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{subiendo ? 'Subiendo...' : 'Subir Fotos'}</span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={manejarSeleccionArchivos}
          className="hidden"
        />

        {errorSubida && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">{errorSubida}</span>
              <button onClick={() => setErrorSubida('')} className="ml-auto text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Fotos del producto seleccionado */}
        {productoSeleccionado && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-700">
                Fotos de {productoSeleccionado.nombre} ({fotosProductoActual.filter(f => !f.subiendo).length}/5)
              </h4>
              <button
                onClick={() => {
                  setProductoSeleccionado(null);
                  setFotosProductoActual([]);
                  setErrorSubida('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {fotosProductoActual.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {fotosProductoActual.map((foto, index) => (
                  <div key={foto.id} className={`relative group border-2 rounded-lg overflow-hidden ${
                    foto.es_principal ? 'border-yellow-400' : 'border-gray-200'
                  }`}>
                    {foto.es_principal && !foto.subiendo && (
                      <div className="absolute top-1 left-1 z-10">
                        <div className="bg-yellow-500 text-white px-1 py-0.5 rounded text-xs flex items-center">
                          <Star className="w-2 h-2 mr-1 fill-current" />
                          Principal
                        </div>
                      </div>
                    )}

                    {foto.subiendo && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      </div>
                    )}

                    <div className="aspect-square bg-gray-100">
                      <img
                        src={foto.url_foto}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => !foto.subiendo && setVistaPrevia(foto)}
                        onError={(e) => {
                          console.error('Error cargando imagen:', foto.url_foto);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500" style={{display: 'none'}}>
                        <div className="text-center">
                          <Image className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs">Error cargando</span>
                        </div>
                      </div>
                    </div>

                    {!foto.subiendo && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                          <button
                            onClick={() => setVistaPrevia(foto)}
                            className="p-1 bg-white text-gray-700 rounded"
                            title="Ver"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {!foto.es_principal && (
                            <button
                              onClick={() => marcarComoPrincipal(foto.id)}
                              className="p-1 bg-yellow-500 text-white rounded"
                              title="Marcar como principal"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => eliminarFoto(foto.id)}
                            className="p-1 bg-red-500 text-white rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No hay fotos para este producto</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Haz clic aquí para subir la primera foto
                </button>
              </div>
            )}

            {/* Botón Finalizar - Solo aparece si hay fotos */}
            {fotosProductoActual.filter(f => !f.subiendo).length > 0 && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setProductoSeleccionado(null);
                    setFotosProductoActual([]);
                    setErrorSubida('');
                    // Recargar estadísticas para actualizar la tabla
                    cargarEstadisticas();
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Finalizar</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar producto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Modelo o serial..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="computadora">Computadoras</option>
              <option value="celular">Celulares</option>
              <option value="otro">Otros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="sin_fotos">Sin fotos</option>
              <option value="insuficientes">Fotos insuficientes</option>
              <option value="sin_principal">Sin foto principal</option>
              <option value="completas">Fotos completas</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => { setBusqueda(''); setFiltroTipo('todos'); setFiltroEstado('todos'); }}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Productos ({productosFiltrados.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado Fotos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vista Previa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productosFiltrados.slice(0, 50).map((producto) => {
                const estado = getEstadoProducto(producto);
                const fotos = fotosPorProducto[`${producto.tipo}_${producto.id}`];
                const isSelected = productoSeleccionado?.id === producto.id && productoSeleccionado?.tipo === producto.tipo;
                
                return (
                  <tr 
                    key={`${producto.tipo}-${producto.id}`} 
                    className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    onClick={() => seleccionarProducto(producto)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getIconoTipo(producto.tipo)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {producto.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            Serial: {producto.serial || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-sm text-gray-600">
                        {producto.tipo}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estado.color}`}>
                        <estado.icono className="w-3 h-3 mr-1" />
                        {estado.texto}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {fotos?.fotoPrincipal ? (
                        <img
                          src={fotos.fotoPrincipal}
                          alt="Vista previa"
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                          <Image className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          seleccionarProducto(producto);
                        }}
                        className={`px-3 py-1 rounded transition-colors flex items-center space-x-1 ${
                          isSelected 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isSelected ? 'Seleccionado' : 'Seleccionar'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {productosFiltrados.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No se encontraron productos con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Modal de vista previa */}
      {vistaPrevia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-medium">
                {vistaPrevia.descripcion || `Foto de ${productoSeleccionado?.nombre}`}
              </h4>
              <div className="flex items-center space-x-2">
                {editandoDescripcion === vistaPrevia.id ? (
                  <>
                    <input
                      type="text"
                      value={descripcionTemp}
                      onChange={(e) => setDescripcionTemp(e.target.value)}
                      placeholder="Descripción..."
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          actualizarDescripcion(vistaPrevia.id, descripcionTemp);
                        }
                      }}
                    />
                    <button
                      onClick={() => actualizarDescripcion(vistaPrevia.id, descripcionTemp)}
                      className="p-1 text-green-600 hover:text-green-800"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditandoDescripcion(null);
                        setDescripcionTemp('');
                      }}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditandoDescripcion(vistaPrevia.id);
                      setDescripcionTemp(vistaPrevia.descripcion || '');
                    }}
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Editar descripción"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setVistaPrevia(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <img
                src={vistaPrevia.url_foto}
                alt={vistaPrevia.descripcion}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
                onError={(e) => {
                  console.error('Error en vista previa:', vistaPrevia.url_foto);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-64 flex items-center justify-center bg-gray-100 text-gray-500">
                <div className="text-center">
                  <Image className="w-12 h-12 mx-auto mb-2" />
                  <p>Error cargando la imagen</p>
                  <p className="text-sm">URL: {vistaPrevia.url_foto}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 text-sm text-gray-600 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span>{vistaPrevia.nombre_archivo}</span>
                <span>{formatearTamaño(vistaPrevia.tamaño_archivo)}</span>
                {vistaPrevia.es_principal && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Principal
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {!vistaPrevia.es_principal && !vistaPrevia.id.toString().startsWith('temp_') && (
                  <button
                    onClick={() => marcarComoPrincipal(vistaPrevia.id)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors flex items-center space-x-1"
                  >
                    <Star className="w-4 h-4" />
                    <span>Marcar como Principal</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    eliminarFoto(vistaPrevia.id);
                    setVistaPrevia(null);
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionFotos;