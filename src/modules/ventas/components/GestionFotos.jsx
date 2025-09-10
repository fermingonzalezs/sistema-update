import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, Trash2, Star, Edit2, Save, X, 
  AlertCircle, CheckCircle, Image, Eye, Monitor, 
  Smartphone, Box, Search, BarChart3, TrendingUp,
  Loader2,AlertTriangle, Plus, Filter
} from 'lucide-react';
import { fotosService } from '../hooks/useFotos';
import Tarjeta from '../../../shared/components/layout/Tarjeta';

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

  // Combinar todos los productos y filtrar solo los disponibles
  const todosLosProductos = [
    ...computers.map(p => ({ ...p, tipo: 'computadora', nombre: p.modelo || 'Sin modelo' })),
    ...celulares.map(p => ({ ...p, tipo: 'celular', nombre: p.modelo || 'Sin modelo' })),
    ...otros.map(p => ({ ...p, tipo: 'otro', nombre: p.descripcion_producto || 'Sin descripción' }))
  ].filter(producto => {
    // Para productos "otros" que usan cantidad por sucursal
    if (producto.cantidad_la_plata !== undefined || producto.cantidad_mitre !== undefined) {
      return (producto.cantidad_la_plata || 0) + (producto.cantidad_mitre || 0) > 0;
    }
    // Para notebooks y celulares que usan el campo 'disponible'
    else if (producto.disponible !== undefined) {
      return producto.disponible !== false;
    }
    // Para productos sin sistema de stock definido, mostrar por defecto
    return true;
  });

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

  // Manejar descripción temporal cuando se edita
  useEffect(() => {
    if (editandoDescripcion && vistaPrevia) {
      setDescripcionTemp(vistaPrevia.descripcion || '');
    }
  }, [editandoDescripcion, vistaPrevia]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroTipo('todos');
    setFiltroEstado('todos');
  };

  const cancelarEdicion = () => {
    setEditandoDescripcion(null);
    setDescripcionTemp('');
  };

  const cargarEstadisticas = async () => {
    try {
      const stats = await fotosService.getEstadisticasFotos();
      setEstadisticas(stats);
      
      // Cargar fotos de productos para la tabla (limitado a 15 para mejorar performance)
      const fotosMap = {};
      const productosLimitados = todosLosProductos.slice(0, 15);
      
      // Cargar fotos de a 5 productos por vez para evitar sobrecargar
      for (let i = 0; i < productosLimitados.length; i += 5) {
        const batch = productosLimitados.slice(i, i + 5);
        const promises = batch.map(async (producto) => {
          try {
            const fotos = await fotosService.getFotosByProducto(producto.id, producto.tipo);
            return {
              key: `${producto.tipo}_${producto.id}`,
              data: {
                cantidad: fotos.length,
                tienePrincipal: fotos.some(f => f.es_principal),
                fotoPrincipal: fotos.find(f => f.es_principal)?.url_foto
              }
            };
          } catch (err) {
            return {
              key: `${producto.tipo}_${producto.id}`,
              data: { cantidad: 0, tienePrincipal: false, fotoPrincipal: null }
            };
          }
        });
        
        const results = await Promise.all(promises);
        results.forEach(result => {
          fotosMap[result.key] = result.data;
        });
      }
      
      setFotosPorProducto(fotosMap);
      
    } catch (err) {
      // Error cargando estadísticas
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
      // Cerrar vista previa si se elimina la foto que se está viendo
      if (vistaPrevia && vistaPrevia.id === fotoId) {
        setVistaPrevia(null);
      }
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
    if (!producto) {
      setVistaPrevia(null);
      setEditandoDescripcion(null);
      setDescripcionTemp('');
    }
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
      (producto.nombre && producto.nombre.toString().toLowerCase().includes(busqueda.toLowerCase())) ||
      (producto.serial && producto.serial.toString().toLowerCase().includes(busqueda.toLowerCase()));

    return cumpleTipo && cumpleEstado && cumpleBusqueda;
  });

  const getEstadoProducto = (producto) => {
    const fotos = fotosPorProducto[`${producto.tipo}_${producto.id}`];
    const cantidadFotos = fotos?.cantidad || 0;
    const tienePrincipal = fotos?.tienePrincipal || false;

    if (cantidadFotos === 0) {
      return { color: 'text-slate-600 bg-slate-50', texto: 'Sin fotos', icono: AlertTriangle };
    }
    if (cantidadFotos < 2) {
      return { color: 'text-slate-600 bg-slate-100', texto: `${cantidadFotos} foto${cantidadFotos !== 1 ? 's' : ''}`, icono: Camera };
    }
    if (!tienePrincipal) {
      return { color: 'text-slate-600 bg-slate-200', texto: 'Sin principal', icono: AlertTriangle };
    }
    return { color: 'text-emerald-600 bg-emerald-50', texto: `${cantidadFotos} fotos ✓`, icono: CheckCircle };
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'computadora': return <Monitor className="w-4 h-4 text-emerald-600" />;
      case 'celular': return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'otro': return <Box className="w-4 h-4 text-slate-600" />;
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
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-slate-600">Cargando productos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 space-y-4">

      

      {/* Sección de subida de fotos */}
      <div className="bg-white rounded border border-slate-200">
        <div className="bg-slate-800 flex items-center justify-between p-4">
          <div className=" flex items-center space-x-3">
            <div classn>
              <h2 className="text-lg font-semibold text-white">{productoSeleccionado 
                  ? `Seleccionado: ${productoSeleccionado.nombre}` 
                  : 'Selecciona un producto de la tabla para subir fotos'
                }</h2>
             
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!productoSeleccionado || subiendo || fotosProductoActual.length >= 5}
              className={`px-4 py-2 rounded flex items-center space-x-2 transition-colors ${
                !productoSeleccionado || subiendo || fotosProductoActual.length >= 5
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
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
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-600">{errorSubida}</span>
              <button onClick={() => setErrorSubida('')} className="ml-auto text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Fotos del producto seleccionado */}
        {productoSeleccionado && (
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-800">
                {productoSeleccionado.nombre} ({fotosProductoActual.filter(f => !f.subiendo).length}/5)
              </h4>
              <button
                onClick={() => setProductoSeleccionado(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {fotosProductoActual.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {fotosProductoActual.map((foto, index) => (
                  <div key={foto.id} className={`relative group border-2 rounded overflow-hidden ${
                    foto.es_principal ? 'border-emerald-400' : 'border-slate-200'
                  }`}>
                    {foto.es_principal && !foto.subiendo && (
                      <div className="absolute top-1 left-1 z-10">
                        <div className="bg-emerald-500 text-white px-1 py-0.5 rounded text-xs flex items-center">
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

                    <div className="aspect-square bg-slate-100 relative">
                      <img
                        src={foto.url_foto}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => !foto.subiendo && setVistaPrevia(foto)}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const errorDiv = e.target.parentElement.querySelector('.error-placeholder');
                          if (errorDiv) errorDiv.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          e.target.style.display = 'block';
                          const errorDiv = e.target.parentElement.querySelector('.error-placeholder');
                          if (errorDiv) errorDiv.style.display = 'none';
                        }}
                      />
                      <div className="error-placeholder absolute inset-0 w-full h-full flex items-center justify-center bg-slate-200 text-slate-500" style={{display: 'none'}}>
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
                            className="p-1 bg-white text-slate-700 rounded"
                            title="Ver"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {!foto.es_principal && (
                            <button
                              onClick={() => marcarComoPrincipal(foto.id)}
                              className="p-1 bg-emerald-500 text-white rounded"
                              title="Marcar como principal"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => eliminarFoto(foto.id)}
                            className="p-1 bg-slate-600 text-white rounded"
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
              <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded">
                <Image className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">No hay fotos para este producto</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-emerald-600 hover:text-emerald-800 text-sm"
                >
                  Haz clic aquí para subir la primera foto
                </button>
              </div>
            )}

            {/* Botón Finalizar - Solo aparece si hay fotos */}
            {fotosProductoActual.filter(f => !f.subiendo).length > 0 && (
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setProductoSeleccionado(null)}
                  className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Finalizar</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

        {/* Estadísticas de porcentajes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        <Tarjeta
          icon={Monitor}
          titulo="% Computadoras con Fotos"
          valor={`${estadisticas.porTipo?.computadora?.total > 0 
            ? Math.round((estadisticas.porTipo.computadora.conFotos / estadisticas.porTipo.computadora.total) * 100) 
            : 0}%`}
        />

        <Tarjeta
          icon={Smartphone}
          titulo="% Celulares con Fotos"
          valor={`${estadisticas.porTipo?.celular?.total > 0 
            ? Math.round((estadisticas.porTipo.celular.conFotos / estadisticas.porTipo.celular.total) * 100) 
            : 0}%`}
        />

        <Tarjeta
          icon={Box}
          titulo="% Otros con Fotos"
          valor={`${estadisticas.porTipo?.otro?.total > 0 
            ? Math.round((estadisticas.porTipo.otro.conFotos / estadisticas.porTipo.otro.total) * 100) 
            : 0}%`}
        />
        
        <Tarjeta
          icon={TrendingUp}
          titulo="% Total Equipos con Fotos"
          valor={`${estadisticas.totalProductos > 0 
            ? Math.round((estadisticas.conFotos / estadisticas.totalProductos) * 100) 
            : 0}%`}
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">Buscar producto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Modelo o serial..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="todos">Todos</option>
              <option value="computadora">Computadoras</option>
              <option value="celular">Celulares</option>
              <option value="otro">Otros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
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
              onClick={limpiarFiltros}
              className="w-full bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Productos ({productosFiltrados.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Estado Fotos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Vista Previa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {productosFiltrados.slice(0, 50).map((producto) => {
                const estado = getEstadoProducto(producto);
                const fotos = fotosPorProducto[`${producto.tipo}_${producto.id}`];
                const isSelected = productoSeleccionado?.id === producto.id && productoSeleccionado?.tipo === producto.tipo;
                
                return (
                  <tr 
                    key={`${producto.tipo}-${producto.id}`} 
                    className={`hover:bg-emerald-50 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''}`}
                    onClick={() => seleccionarProducto(producto)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getIconoTipo(producto.tipo)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-800">
                            {producto.nombre}
                          </div>
                          <div className="text-sm text-slate-500">
                            Serial: {producto.serial || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-sm text-slate-600">
                        {producto.tipo}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${estado.color}`}>
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
                        <div className="w-12 h-12 bg-slate-100 rounded border flex items-center justify-center">
                          <Image className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => seleccionarProducto(producto)}
                        className={`px-3 py-1 rounded transition-colors flex items-center space-x-1 ${
                          isSelected 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
          <div className="p-8 text-center text-slate-500">
            <Camera className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No se encontraron productos con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Modal de vista previa */}
      {vistaPrevia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-slate-200 relative max-w-4xl max-h-full overflow-hidden">
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
                      className="px-2 py-1 border border-slate-200 rounded text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          actualizarDescripcion(vistaPrevia.id, descripcionTemp);
                        }
                      }}
                    />
                    <button
                      onClick={() => actualizarDescripcion(vistaPrevia.id, descripcionTemp)}
                      className="p-1 text-emerald-600 hover:text-emerald-800"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="p-1 text-slate-600 hover:text-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditandoDescripcion(vistaPrevia.id)}
                    className="p-1 text-slate-600 hover:text-slate-800"
                    title="Editar descripción"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setVistaPrevia(null)}
                  className="p-1 hover:bg-slate-100 rounded"
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
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-64 flex items-center justify-center bg-slate-100 text-slate-500">
                <div className="text-center">
                  <Image className="w-12 h-12 mx-auto mb-2" />
                  <p>Error cargando la imagen</p>
                  <p className="text-sm">URL: {vistaPrevia.url_foto}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 text-sm text-slate-600 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span>{vistaPrevia.nombre_archivo}</span>
                <span>{formatearTamaño(vistaPrevia.tamaño_archivo)}</span>
                {vistaPrevia.es_principal && (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Principal
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {!vistaPrevia.es_principal && !vistaPrevia.id.toString().startsWith('temp_') && (
                  <button
                    onClick={() => marcarComoPrincipal(vistaPrevia.id)}
                    className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 transition-colors flex items-center space-x-1"
                  >
                    <Star className="w-4 h-4" />
                    <span>Marcar como Principal</span>
                  </button>
                )}
                <button
                  onClick={() => eliminarFoto(vistaPrevia.id)}
                  className="bg-slate-600 text-white px-3 py-1 rounded hover:bg-slate-700 transition-colors flex items-center space-x-1"
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