import React, { useState, useEffect } from 'react';
import { 
  Copy, Monitor, Smartphone, Box, Search, 
  Check, FileText, Edit2, Save, X, Filter, Zap
} from 'lucide-react';
import { generateCopy } from '../../../shared/utils/copyGenerator';
import { supabase } from '../../../lib/supabase';

const Listas = ({ computers, celulares, otros, loading, error }) => {
  const [tipoActivo, setTipoActivo] = useState('computadora');
  const [busqueda, setBusqueda] = useState('');
  const [productosConCopy, setProductosConCopy] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [copiados, setCopiados] = useState(new Set());
  const [estadosDisponibles, setEstadosDisponibles] = useState({
    celulares: [],
    notebooks: []
  });

  // Estado para ordenamiento
  const [ordenamiento, setOrdenamiento] = useState({
    campo: 'precio_venta_usd', // Por defecto ordenar por precio
    direccion: 'asc' // 'asc' o 'desc'
  });

  // Mensajes personalizables por tipo
  const [mensajes, setMensajes] = useState({
    computadora: {
      inicial: '🔥 NOTEBOOKS DISPONIBLES 🔥',
      final: '🛡️ GARANTÍAS\n Productos nuevos: 6 meses\n Productos usados o reacondicionados: 3 meses\n\n💳 MÉTODOS DE PAGO\n Efectivo (pesos o dólares)\n Transferencia (+5%)\n Tarjeta de crédito (+40% en hasta 3 cuotas)\n Criptomonedas (USDT 0%)\n\n🏢 OFICINAS\n Tenemos dos  sucursales con seguridad privada: \nLa Plata centro y Microcentro (CABA)\n SOLO ATENDEMOS CON CITA PREVIA\n\n⚠️ AVISO IMPORTANTE\n NO ACEPTAMOS BILLETES MANCHADOS, ESCRITOS, ROTOS, CON SELLOS, CAMBIO, NI CARA CHICA\n'
    },
    celular: {
      inicial: '📱 CELULARES DISPONIBLES 📱',
      final: '✅ EQUIPOS ORIGINALES DE APPLE\n 100% Nuevos\n Sellados en caja\n Garantía oficial de Apple\n La garantía se gestiona directamente con Apple sin excepción\n\n🛡️ GARANTÍAS\n Productos nuevos: garantía oficial.\n Productos usados o reacondicionados: 1 mes\n\n💳 MÉTODOS DE PAGO\n Efectivo (pesos o dólares)\n Transferencia (+5%)\n Tarjeta de crédito (+40% en hasta 3 cuotas)\n Criptomonedas (USDT 0%)\n\n🏢 OFICINAS\n Tenemos dos  sucursales con seguridad privada: \nLa Plata centro y Microcentro (CABA)\n SOLO ATENDEMOS CON CITA PREVIA\n\n⚠️ AVISO IMPORTANTE\n NO ACEPTAMOS BILLETES MANCHADOS, ESCRITOS, ROTOS, CON SELLOS, CAMBIO, NI CARA CHICA\n'
    },
    otro: {
      inicial: '📦 ACCESORIOS Y MÁS 📦',
      final: '🛡️ GARANTÍAS\n Productos nuevos: 6 meses\n Productos usados o reacondicionados: 3 meses\n\n💳 MÉTODOS DE PAGO\n Efectivo (pesos o dólares)\n Transferencia (+5%)\n Tarjeta de crédito (+40% en hasta 3 cuotas)\n Criptomonedas (USDT 0%)\n\n🏢 OFICINAS\n Tenemos dos  sucursales con seguridad privada: \nLa Plata centro y Microcentro (CABA)\n SOLO ATENDEMOS CON CITA PREVIA\n\n⚠️ AVISO IMPORTANTE\n NO ACEPTAMOS BILLETES MANCHADOS, ESCRITOS, ROTOS, CON SELLOS, CAMBIO, NI CARA CHICA\n'
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
    estado: '',
    categoria: '',
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

  // Cargar estados disponibles al inicializar
  useEffect(() => {
    const cargarEstadosDisponibles = async () => {
      try {
        const [celularesRes, notebooksRes] = await Promise.all([
          supabase.from('celulares').select('estado').not('estado', 'is', null).neq('estado', ''),
          supabase.from('inventario').select('estado').not('estado', 'is', null).neq('estado', '')
        ]);

        const estadosCelulares = [...new Set(celularesRes.data?.map(item => item.estado) || [])].sort();
        const estadosNotebooks = [...new Set(notebooksRes.data?.map(item => item.estado) || [])].sort();

        setEstadosDisponibles({
          celulares: estadosCelulares,
          notebooks: estadosNotebooks
        });
      } catch (error) {
        console.error('Error cargando estados:', error);
      }
    };

    cargarEstadosDisponibles();
  }, []);

  // Generar copys cuando cambien los productos o tipo activo
  useEffect(() => {
    const productos = getProductosActivos();
    const productosConCopyGenerado = productos.map(producto => ({
      ...producto,
      copy: generateCopy(producto, { version: 'listas' })
    }));
    setProductosConCopy(productosConCopyGenerado);
    setSeleccionados(new Set()); // Limpiar selección al cambiar tipo
    
    // Limpiar filtro de estado al cambiar tipo
    setFiltros(prev => ({ ...prev, estado: '' }));
  }, [tipoActivo, computers, celulares, otros]);

  // Las funciones de generación de copy ahora están unificadas en copyGenerator.js

  // Función auxiliar para normalizar condiciones
  const normalizarCondicion = (condicion) => {
    if (!condicion) return '';
    const cond = condicion.toLowerCase();
    // Mapear variaciones comunes
    if (cond === 'nuevo' || cond === 'nueva') return 'nuevo';
    if (cond === 'usado' || cond === 'usada') return 'usado';
    if (cond === 'reacondicionado' || cond === 'reacondicionada') return 'reacondicionado';
    return cond;
  };

  // Función para cambiar ordenamiento
  const actualizarOrdenamiento = (campo) => {
    setOrdenamiento(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filtrar productos con filtros avanzados
  let productosFiltrados = productosConCopy.filter(producto => {
    // FILTRO PRINCIPAL: Solo mostrar condiciones permitidas para listas
    const condicionesPermitidas = ['nuevo', 'nueva', 'pc_escritorio', 'reacondicionado', 'reacondicionada', 'usado', 'usada'];
    const condicionProducto = (producto.condicion || '').toLowerCase();
    
    const cumpleCondicionPermitida = condicionesPermitidas.includes(condicionProducto);
    
    // Si no cumple la condición permitida, no mostrar el producto
    if (!cumpleCondicionPermitida) {
      return false;
    }

    // Filtro por búsqueda - adaptado para diferentes tipos de productos
    let searchFields = [];
    
    if (producto.tipo === 'otro') {
      // Para productos "otros": usar nombre_producto (modelo), descripcion, id (serial)
      searchFields = [
        producto.nombre_producto,
        producto.descripcion,
        String(producto.id), // ID como serial
        producto.categoria
      ];
    } else {
      // Para notebooks y celulares: mantener estructura original
      searchFields = [
        producto.modelo,
        producto.descripcion_producto,
        producto.serial,
        producto.marca
      ];
    }
    
    const cumpleBusqueda = busqueda === '' || 
      searchFields.some(field => field && field.toLowerCase().includes(busqueda.toLowerCase()));

    if (!modoFiltros) return cumpleBusqueda;

    // Filtros avanzados solo se aplican si están activos
    const cumpleMarca = filtros.marca === '' || (producto.marca && producto.marca.toLowerCase() === filtros.marca.toLowerCase());
    const cumpleExclusionMarca = filtroExcluirMarca === '' || !producto.marca || producto.marca.toLowerCase() !== filtroExcluirMarca.toLowerCase();
    
    // Usar normalización para condiciones
    const condicionNormalizada = normalizarCondicion(producto.condicion);
    const condicionFiltro = normalizarCondicion(filtros.condicion);
    const cumpleCondicion = filtros.condicion === '' || condicionNormalizada === condicionFiltro;
    
    // Filtro por estado (para celulares y notebooks)
    const cumpleEstado = filtros.estado === '' || (producto.estado && producto.estado === filtros.estado);
    
    // Filtro por categoría (solo para productos "otros")
    const cumpleCategoria = filtros.categoria === '' || (producto.tipo === 'otro' && producto.categoria === filtros.categoria);
    
    // Debug temporal para troubleshooting
    if (filtros.marca && filtros.condicion && producto.marca) {
      console.log('🔍 Debug Filtro:', {
        producto: producto.modelo || producto.descripcion_producto,
        marcaProducto: producto.marca,
        marcaFiltro: filtros.marca,
        condicionNormalizada,
        condicionFiltro,
        cumpleMarca,
        cumpleCondicion,
        cumpleExclusionMarca,
        exclusion: filtroExcluirMarca
      });
    }
    
    const cumpleFiltros = 
      cumpleMarca &&
      cumpleExclusionMarca &&
      cumpleCondicion &&
      cumpleEstado &&
      cumpleCategoria &&
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

  // Aplicar ordenamiento
  if (ordenamiento.campo) {
    productosFiltrados = [...productosFiltrados].sort((a, b) => {
      let valorA = a[ordenamiento.campo];
      let valorB = b[ordenamiento.campo];

      // Manejar precios
      if (ordenamiento.campo === 'precio_venta_usd') {
        valorA = parseFloat(valorA) || 0;
        valorB = parseFloat(valorB) || 0;
      }

      // Manejar fechas
      if (ordenamiento.campo === 'fecha_ingreso' || ordenamiento.campo === 'created_at') {
        valorA = new Date(valorA || 0).getTime();
        valorB = new Date(valorB || 0).getTime();
      }

      // Normalizar strings
      if (typeof valorA === 'string') valorA = valorA.toLowerCase();
      if (typeof valorB === 'string') valorB = valorB.toLowerCase();

      if (valorA < valorB) return ordenamiento.direccion === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordenamiento.direccion === 'asc' ? 1 : -1;
      return 0;
    });
  }

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

  // Función de fallback para copiar usando el método legacy
  const copiarTextoFallback = (texto) => {
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      console.error('❌ Error en execCommand:', err);
    }
    
    document.body.removeChild(textArea);
    return success;
  };

  // Copiar lista completa al portapapeles
  const copiarListaCompleta = async () => {
    console.log('🔄 Botón copiar lista presionado. Productos seleccionados:', seleccionados.size);
    
    if (seleccionados.size === 0) {
      console.log('❌ No hay productos seleccionados');
      alert('Por favor selecciona al menos un producto');
      return;
    }
    
    try {
      const lista = generarListaCompleta();
      console.log('📋 Lista generada:', lista.substring(0, 100) + '...');
      
      let copiado = false;
      
      // Intentar primero con la API moderna del clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(lista);
          copiado = true;
          console.log('✅ Lista copiada con navigator.clipboard');
        } catch (clipboardErr) {
          console.warn('⚠️ Clipboard API falló, usando fallback:', clipboardErr);
          copiado = copiarTextoFallback(lista);
        }
      } else {
        // Usar método de fallback directamente si la API no está disponible
        console.log('📝 Using fallback copy method');
        copiado = copiarTextoFallback(lista);
      }
      
      if (copiado) {
        setCopiados(prev => new Set([...prev, 'lista-completa']));
        console.log('✅ Lista copiada al portapapeles exitosamente');
        
        setTimeout(() => {
          setCopiados(prev => {
            const nuevos = new Set(prev);
            nuevos.delete('lista-completa');
            return nuevos;
          });
        }, 2000);
      } else {
        throw new Error('No se pudo copiar el texto al portapapeles');
      }
      
    } catch (err) {
      console.error('❌ Error copiando lista:', err);
      
      // Como último recurso, mostrar el texto en un modal para copia manual
      const lista = generarListaCompleta();
      const shouldShowModal = window.confirm(
        'No se pudo copiar automáticamente al portapapeles. ¿Quieres ver el texto para copiarlo manualmente?'
      );
      
      if (shouldShowModal) {
        // Crear un modal simple con el texto
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
          background: white;
          padding: 20px;
          border-radius: 8px;
          max-width: 600px;
          max-height: 80%;
          overflow-y: auto;
          position: relative;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Cerrar';
        closeBtn.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          background: #ef4444;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        `;
        
        const textArea = document.createElement('textarea');
        textArea.value = lista;
        textArea.style.cssText = `
          width: 100%;
          height: 300px;
          font-family: monospace;
          font-size: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 10px;
          margin-top: 30px;
        `;
        textArea.readOnly = true;
        
        const instruction = document.createElement('p');
        instruction.textContent = 'Selecciona todo el texto (Ctrl+A) y cópialo (Ctrl+C):';
        instruction.style.marginBottom = '10px';
        
        closeBtn.onclick = () => document.body.removeChild(modal);
        modal.onclick = (e) => {
          if (e.target === modal) document.body.removeChild(modal);
        };
        
        content.appendChild(closeBtn);
        content.appendChild(instruction);
        content.appendChild(textArea);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Seleccionar todo el texto automáticamente
        textArea.focus();
        textArea.select();
      }
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
      condicion: 'usado', // Usar 'usado' normalizado
      estado: '',
      categoria: '',
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: ''
    });
    setBusqueda('iPhone');
    setFiltroExcluirMarca(''); // Limpiar exclusión
  };

  const aplicarFiltroiPhoneNuevo = () => {
    setTipoActivo('celular');
    setModoFiltros(true);
    setFiltros({
      marca: 'Apple',
      condicion: 'nuevo', // Usar 'nuevo' normalizado
      estado: '',
      categoria: '',
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: ''
    });
    setBusqueda('iPhone');
    setFiltroExcluirMarca(''); // Limpiar exclusión
  };

  const aplicarFiltroMacBooksNuevas = () => {
    setTipoActivo('computadora');
    setModoFiltros(true);
    setFiltros({
      marca: 'Apple',
      condicion: 'nuevo', // Usar 'nuevo' normalizado
      estado: '',
      categoria: '',
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
      condicion: 'usado', // Usar 'usado' normalizado
      estado: '',
      categoria: '',
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
      condicion: 'nuevo', // Usar 'nuevo' normalizado
      estado: '',
      categoria: '',
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
      condicion: 'usado', // Usar 'usado' normalizado
      estado: '',
      categoria: '',
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
      estado: '',
      categoria: '',
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
    
    // Para categorías de OTROS, usar solo productos de tipo "otro"
    const categoriasOtros = tipoActivo === 'otro' 
      ? [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort()
      : [];
    
    return { marcas, condiciones, pantallas, idiomas, categoriasOtros };
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
    <div className="space-y-4">
      {/* Tabs para tipos de productos */}
      <div className="bg-white rounded border border-slate-200">
        <div className="p-4">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded">
            {['computadora', 'celular', 'otro'].map((tipo) => {
              const config = getTipoConfig(tipo);
              const Icon = config.icon;
              return (
                <button
                  key={tipo}
                  onClick={() => setTipoActivo(tipo)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded transition-colors ${
                    tipoActivo === tipo
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{config.label}</span>
                  <span className={`text-sm px-2 py-0.5 rounded ${
                    tipoActivo === tipo
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tipo === 'computadora' ? computers.length :
                      tipo === 'celular' ? celulares.length : otros.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sección de filtros avanzados y presets */}
      <div className="bg-white rounded border border-slate-200">
        <div className="px-4 py-3 bg-slate-800 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <h3 className="text-base font-semibold">Filtros y Selección</h3>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setModoFiltros(!modoFiltros)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  modoFiltros
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {modoFiltros ? 'Filtros Activos' : 'Activar Filtros'}
              </button>
              {modoFiltros && (
                <button
                  onClick={limpiarFiltros}
                  className="px-3 py-1.5 bg-slate-700 text-white rounded text-sm font-medium hover:bg-slate-600 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-200">

          {/* Filtros prearmados */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Filtros Rápidos</span>
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
              className="px-3 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center space-x-1"
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
              className="px-3 py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700 transition-colors flex items-center space-x-1"
            >
              <Monitor className="w-4 h-4" />
              <span>MacBooks Usadas</span>
            </button>
            <button
              onClick={aplicarFiltroWindowsNuevas}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <Monitor className="w-4 h-4" />
              <span>Windows Nuevas</span>
            </button>
            <button
              onClick={aplicarFiltroWindowsUsadas}
              className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-1"
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

            {(tipoActivo === 'computadora' || tipoActivo === 'celular') && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                <select
                  value={filtros.estado}
                  onChange={(e) => handleFiltroChange('estado', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Todos</option>
                  {(tipoActivo === 'computadora' ? estadosDisponibles.notebooks : estadosDisponibles.celulares).map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
            )}

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

        {/* Filtros para productos OTROS */}
        {modoFiltros && tipoActivo === 'otro' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
              <select
                value={filtros.categoria}
                onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todas las categorías</option>
                {getUniqueValues().categoriasOtros.map(categoria => (
                  <option key={categoria} value={categoria}>
                    {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
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
          </div>
        )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna izquierda: Configuración de mensajes */}
        <div className="space-y-4">
          {/* Mensaje inicial */}
          <div className="bg-white rounded border border-slate-200">
            <div className="px-4 py-2 bg-slate-800 text-white border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Mensaje Inicial</h3>
                <button
                  onClick={() => iniciarEdicionMensaje(tipoActivo, 'inicial')}
                  className="text-white hover:text-emerald-400 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
            
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
              <div className="bg-slate-50 p-4 rounded text-sm whitespace-pre-line text-slate-700">
                {mensajes[tipoActivo].inicial}
              </div>
            )}
            </div>
          </div>

          {/* Mensaje final */}
          <div className="bg-white rounded border border-slate-200">
            <div className="px-4 py-2 bg-slate-800 text-white border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Mensaje Final</h3>
                <button
                  onClick={() => iniciarEdicionMensaje(tipoActivo, 'final')}
                  className="text-white hover:text-emerald-400 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
            
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
              <div className="bg-slate-50 p-4 rounded text-sm whitespace-pre-line text-slate-700">
                {mensajes[tipoActivo].final}
              </div>
            )}
            </div>
          </div>

          {/* Botón para copiar lista */}
          {seleccionados.size > 0 && (
            <div className="bg-white rounded border border-slate-200">
              <div className="px-4 py-2 bg-emerald-600 text-white border-b border-emerald-700">
                <h3 className="text-sm font-semibold flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Lista Generada</span>
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                  <p className="text-xs font-medium text-emerald-800">
                    {seleccionados.size} producto{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={copiarListaCompleta}
                  className={`w-full py-3 px-4 rounded font-medium transition-colors flex items-center justify-center space-x-2 relative z-20 ${
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
        <div className="lg:col-span-2 space-y-4">
          {/* Búsqueda y controles */}
          <div className="bg-white rounded border border-slate-200">
            <div className="px-4 py-3 bg-slate-800 text-white border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>{tipoConfig.label} Disponibles</span>
                  <span className="bg-emerald-600 px-2 py-0.5 rounded text-xs">
                    {productosFiltrados.length}
                  </span>
                </h3>
                <button
                  onClick={seleccionarTodos}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    seleccionados.size === productosFiltrados.length && productosFiltrados.length > 0
                      ? 'bg-slate-700 text-white hover:bg-slate-600'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {seleccionados.size === productosFiltrados.length && productosFiltrados.length > 0
                    ? 'Deseleccionar Todos'
                    : 'Seleccionar Todos'
                  }
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Búsqueda */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={`Buscar ${tipoConfig.label.toLowerCase()}...`}
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Ordenamiento */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ordenar por</label>
                  <select
                    value={ordenamiento.campo}
                    onChange={(e) => actualizarOrdenamiento(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Sin ordenar</option>
                    <option value="modelo">Modelo</option>
                    <option value="marca">Marca</option>
                    <option value="precio_venta_usd">Precio</option>
                    <option value="condicion">Condición</option>
                    <option value="fecha_ingreso">Fecha Ingreso</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="bg-white rounded border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={seleccionados.size === productosFiltrados.length && productosFiltrados.length > 0}
                        onChange={seleccionarTodos}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[100px]">Serial</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[150px]">Modelo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[80px]">Precio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[500px]">Copy del Producto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {productosFiltrados.map((producto, index) => (
                    <tr key={producto.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-emerald-50 transition-colors`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={seleccionados.has(producto.id)}
                          onChange={() => toggleSeleccion(producto.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-700">
                        {producto.tipo === 'otro' ? producto.id : (producto.serial || 'N/A')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800">
                        {producto.tipo === 'otro' ? (producto.nombre_producto || 'N/A') : (producto.modelo || producto.descripcion_producto)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold text-emerald-700">
                        USD {Math.round(producto.precio_venta_usd || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-mono">
                        <div className="whitespace-pre-wrap break-words">
                          {producto.copy}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {productosFiltrados.length === 0 && (
              <div className="text-center py-12 bg-white">
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