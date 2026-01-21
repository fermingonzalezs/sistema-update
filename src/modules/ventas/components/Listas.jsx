import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy, Monitor, Smartphone, Box, Search,
  Check, FileText, Edit2, Save, X, Filter, Zap, DollarSign
} from 'lucide-react';
import { generateCopy } from '../../../shared/utils/copyGenerator';
import { supabase } from '../../../lib/supabase';
import { LINEAS_PROCESADOR_LABELS } from '../../../shared/constants/processorConstants';
import { cotizacionService } from '../../../shared/services/cotizacionService';

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
      final: '🛡️ GARANTÍAS\n Productos nuevos: 6 meses\n Productos usados o reacondicionados: 3 meses\n\n💳 MÉTODOS DE PAGO\n Efectivo (pesos o dólares)\n Transferencia (+5%)\n Tarjeta de crédito (+40% en hasta 3 cuotas)\n Criptomonedas (USDT 0%)\n\n🏢 OFICINAS\n Tenemos dos  sucursales con seguridad privada: \nLa Plata centro y Microcentro (CABA)\n Solo atendemos con cita previa.\n\n⚠️ AVISO IMPORTANTE\n No aceptamos billetes manchados, escritos, rotos, con sellos, cambio, ni cara chica.\n'
    },
    celular: {
      inicial: '📱 CELULARES DISPONIBLES 📱',
      final: '🛡️ GARANTÍAS\n Productos nuevos: garantía oficial (se gestiona con Apple) \n Productos usados o reacondicionados: 1 mes\n\n💳 MÉTODOS DE PAGO\n Efectivo (pesos o dólares)\n Transferencia (+5%)\n Tarjeta de crédito (+40% en hasta 3 cuotas)\n Criptomonedas (USDT 0%)\n\n🏢 OFICINAS\n Tenemos dos  sucursales con seguridad privada: \nLa Plata centro y Microcentro (CABA)\n Solo atendemos con cita previa.\n\n⚠️ AVISO IMPORTANTE\n No aceptamos billetes manchados, escritos, rotos, con sellos, cambio, ni cara chica.\n'
    },
    otro: {
      inicial: '📦 ACCESORIOS Y MÁS 📦',
      final: '🛡️ GARANTÍAS\n Productos nuevos: 6 meses\n Productos usados o reacondicionados: 1 mes\n\n💳 MÉTODOS DE PAGO\n Efectivo (pesos o dólares)\n Transferencia (+5%)\n Tarjeta de crédito (+40% en hasta 3 cuotas)\n Criptomonedas (USDT 0%)\n\n🏢 OFICINAS\n Tenemos dos  sucursales con seguridad privada: \nLa Plata centro y Microcentro (CABA)\n Solo atendemos con cita previa.\n\n⚠️ AVISO IMPORTANTE\n No aceptamos billetes manchados, escritos, rotos, con sellos, cambio, ni cara chica.\n'
    }
  });

  const [editandoMensaje, setEditandoMensaje] = useState(null);
  const [mensajeTemp, setMensajeTemp] = useState('');

  // Estados para moneda y cotización
  const [cotizacionDolar, setCotizacionDolar] = useState(1000);
  const [monedaPrecio, setMonedaPrecio] = useState('USD'); // 'USD' o 'ARS'

  // Estados para incluir/excluir mensajes
  const [incluirMensajeInicial, setIncluirMensajeInicial] = useState(true);
  const [incluirMensajeFinal, setIncluirMensajeFinal] = useState(true);

  // Estado para espaciado doble entre productos
  const [espaciadoDoble, setEspaciadoDoble] = useState(false);

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
    idioma: '',
    lineaProcesador: ''
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

  // Cargar cotización del dólar
  useEffect(() => {
    const cargarCotizacion = async () => {
      try {
        const cotizacionData = await cotizacionService.obtenerCotizacionActual();
        setCotizacionDolar(cotizacionData.valor || cotizacionData.promedio || 1000);
      } catch (error) {
        console.error('Error cargando cotización:', error);
        setCotizacionDolar(1000); // Valor por defecto
      }
    };
    cargarCotizacion();
  }, []);

  // Generar copys cuando cambien los productos o tipo activo
  useEffect(() => {
    const productos = getProductosActivos();
    const productosConCopyGenerado = productos.map(producto => {
      // Determinar el tipo de copy comercial según el tipo de producto
      let tipoCopy;
      switch (producto.tipo) {
        case 'computadora':
          tipoCopy = 'notebook_comercial';
          break;
        case 'celular':
          tipoCopy = 'celular_comercial';
          break;
        case 'otro':
          tipoCopy = 'otro_comercial';
          break;
        default:
          tipoCopy = null; // Auto-detectar
      }

      return {
        ...producto,
        copy: generateCopy(producto, { tipo: tipoCopy })
      };
    });
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

  const productosFiltradosYOrdenados = useMemo(() => {
    let productos = productosConCopy.filter(producto => {
      const condicionesPermitidas = ['nuevo', 'nueva', 'pc_escritorio', 'reacondicionado', 'reacondicionada', 'usado', 'usada'];
      const condicionProducto = (producto.condicion || '').toLowerCase();
      if (!condicionesPermitidas.includes(condicionProducto)) {
        return false;
      }

      let searchFields = [];
      if (producto.tipo === 'otro') {
        searchFields = [producto.nombre_producto, producto.descripcion, String(producto.id), producto.categoria];
      } else {
        searchFields = [producto.modelo, producto.descripcion_producto, producto.serial, producto.marca];
      }
      const cumpleBusqueda = busqueda === '' || searchFields.some(field => field && field.toLowerCase().includes(busqueda.toLowerCase()));

      if (!modoFiltros) return cumpleBusqueda;

      const cumpleMarca = filtros.marca === '' || (producto.marca && producto.marca.toLowerCase() === filtros.marca.toLowerCase());
      const cumpleExclusionMarca = filtroExcluirMarca === '' || !producto.marca || producto.marca.toLowerCase() !== filtroExcluirMarca.toLowerCase();

      const condicionNormalizada = normalizarCondicion(producto.condicion);
      const condicionFiltro = normalizarCondicion(filtros.condicion);
      const cumpleCondicion = filtros.condicion === '' || condicionNormalizada === condicionFiltro;

      const cumpleEstado = filtros.estado === '' || (producto.estado && producto.estado === filtros.estado);
      // Filtro de categoría: funciona para notebooks, celulares y otros
      const cumpleCategoria = filtros.categoria === '' || (producto.categoria && producto.categoria.toLowerCase() === filtros.categoria.toLowerCase());

      const cumpleFiltros =
        cumpleMarca &&
        cumpleExclusionMarca &&
        cumpleCondicion &&
        cumpleEstado &&
        cumpleCategoria &&
        (filtros.precioMax === '' || (producto.precio_venta_usd <= parseFloat(filtros.precioMax))) &&
        (tipoActivo !== 'computadora' || filtros.ramMin === '' || (producto.ram || producto.memoria_ram) >= parseInt(filtros.ramMin)) &&
        (filtros.almacenamientoMin === '' || (producto.ssd || producto.capacidad) >= parseInt(filtros.almacenamientoMin)) &&
        (filtros.pantalla === '' || (producto.pantalla && producto.pantalla.toString().includes(filtros.pantalla))) &&
        (filtros.idioma === '' || (producto.idioma_teclado && producto.idioma_teclado.toLowerCase().includes(filtros.idioma.toLowerCase()))) &&
        (filtros.lineaProcesador === '' || (producto.linea_procesador === filtros.lineaProcesador));

      return cumpleBusqueda && cumpleFiltros;
    });

    if (ordenamiento.campo) {
      productos.sort((a, b) => {
        let valorA = a[ordenamiento.campo];
        let valorB = b[ordenamiento.campo];

        if (ordenamiento.campo === 'precio_venta_usd') {
          valorA = parseFloat(valorA) || 0;
          valorB = parseFloat(valorB) || 0;
        }

        if (ordenamiento.campo === 'fecha_ingreso' || ordenamiento.campo === 'created_at') {
          valorA = new Date(valorA || 0).getTime();
          valorB = new Date(valorB || 0).getTime();
        }

        if (typeof valorA === 'string') {
          valorA = valorA.toLowerCase();
        }
        if (typeof valorB === 'string') {
          valorB = valorB.toLowerCase();
        }

        if (valorA < valorB) return ordenamiento.direccion === 'asc' ? -1 : 1;
        if (valorA > valorB) return ordenamiento.direccion === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return productos;
  }, [productosConCopy, busqueda, modoFiltros, filtros, filtroExcluirMarca, ordenamiento, tipoActivo]);

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
    if (seleccionados.size === productosFiltradosYOrdenados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(productosFiltradosYOrdenados.map(p => p.id)));
    }
  };



  // Función para convertir precio USD a ARS en un copy
  const convertirPrecioEnCopy = (copy, producto) => {
    if (monedaPrecio === 'USD') {
      return copy;
    }

    // Convertir U$X.XXX a $X.XXX.XXX (formato pesos argentinos)
    const precioUSD = producto.precio_venta_usd;
    if (!precioUSD) return copy;

    const precioARS = Math.round(precioUSD * cotizacionDolar);
    const precioFormateadoARS = `$${precioARS.toLocaleString('es-AR')}`;

    // El formato del copy es "U$1.234" - buscar ese patrón
    // También buscar "USD X" por si acaso
    let resultado = copy.replace(/U\$[\d.,]+/g, precioFormateadoARS);
    resultado = resultado.replace(/USD\s*[\d.,]+/gi, precioFormateadoARS);

    return resultado;
  };

  // Generar lista completa con mensajes
  const generarListaCompleta = () => {
    const productosSeleccionados = productosFiltradosYOrdenados.filter(p => seleccionados.has(p.id));

    // Convertir precios si es necesario
    const copysSeleccionados = productosSeleccionados.map(p => convertirPrecioEnCopy(p.copy, p));

    const partes = [];

    // Agregar mensaje inicial si está habilitado
    if (incluirMensajeInicial && mensajes[tipoActivo].inicial) {
      partes.push(mensajes[tipoActivo].inicial);
      partes.push('');
    }

    // Agregar productos con espaciado simple o doble
    const separador = espaciadoDoble ? '\n\n' : '\n';
    partes.push(copysSeleccionados.join(separador));

    // Agregar mensaje final si está habilitado
    if (incluirMensajeFinal && mensajes[tipoActivo].final) {
      partes.push('');
      partes.push(mensajes[tipoActivo].final);
    }

    return partes.join('\n');
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
      categoria: 'iphone', // ✅ Filtrar específicamente por categoría iphone
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: '',
      lineaProcesador: ''
    });
    setBusqueda('');
    setFiltroExcluirMarca(''); // Limpiar exclusión
  };

  const aplicarFiltroiPhoneNuevo = () => {
    setTipoActivo('celular');
    setModoFiltros(true);
    setFiltros({
      marca: 'Apple',
      condicion: 'nuevo', // Usar 'nuevo' normalizado
      estado: '',
      categoria: 'iphone', // ✅ Filtrar específicamente por categoría iphone
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: '',
      lineaProcesador: ''
    });
    setBusqueda('');
    setFiltroExcluirMarca(''); // Limpiar exclusión
  };

  const aplicarFiltroMacBooksNuevas = () => {
    setTipoActivo('computadora');
    setModoFiltros(true);
    setFiltros({
      marca: 'Apple',
      condicion: 'nuevo', // Usar 'nuevo' normalizado
      estado: '',
      categoria: 'macbook', // ✅ Filtrar específicamente por categoría macbook
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: '',
      lineaProcesador: ''
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
      categoria: 'macbook', // ✅ Filtrar específicamente por categoría macbook
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: '',
      lineaProcesador: ''
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
      categoria: 'windows', // ✅ Filtrar específicamente por categoría windows
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: '',
      lineaProcesador: ''
    });
    setBusqueda('');
    setFiltroExcluirMarca(''); // Ya no necesitamos excluir Apple porque filtramos por categoría
  };

  const aplicarFiltroWindowsUsadas = () => {
    setTipoActivo('computadora');
    setModoFiltros(true);
    setFiltros({
      marca: '',
      condicion: 'usado', // Usar 'usado' normalizado
      estado: '',
      categoria: 'windows', // ✅ Filtrar específicamente por categoría windows
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: '',
      lineaProcesador: ''
    });
    setBusqueda('');
    setFiltroExcluirMarca(''); // Ya no necesitamos excluir Apple porque filtramos por categoría
  };

  // Nuevos filtros para Gaming
  const aplicarFiltroGamingNuevas = () => {
    setTipoActivo('computadora');
    setModoFiltros(true);
    setFiltros({
      marca: '',
      condicion: 'nuevo',
      estado: '',
      categoria: 'gaming', // ✅ Filtrar por categoría gaming
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: '',
      lineaProcesador: ''
    });
    setBusqueda('');
    setFiltroExcluirMarca('');
  };

  const aplicarFiltroGamingUsadas = () => {
    setTipoActivo('computadora');
    setModoFiltros(true);
    setFiltros({
      marca: '',
      condicion: 'usado',
      estado: '',
      categoria: 'gaming', // ✅ Filtrar por categoría gaming
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: '',
      lineaProcesador: ''
    });
    setBusqueda('');
    setFiltroExcluirMarca('');
  };

  // Nuevo filtro para Android
  const aplicarFiltroAndroid = () => {
    setTipoActivo('celular');
    setModoFiltros(true);
    setFiltros({
      marca: '',
      condicion: '',
      estado: '',
      categoria: 'android', // ✅ Filtrar por categoría android
      precioMax: '',
      ramMin: '',
      almacenamientoMin: '',
      pantalla: '',
      idioma: '',
      lineaProcesador: ''
    });
    setBusqueda('');
    setFiltroExcluirMarca('');
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
      idioma: '',
      lineaProcesador: ''
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
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded transition-colors ${tipoActivo === tipo
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{config.label}</span>
                  <span className={`text-sm px-2 py-0.5 rounded ${tipoActivo === tipo
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
            <h3 className="text-base font-semibold">Filtros</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setModoFiltros(!modoFiltros)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${modoFiltros
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
          {/* Botones de filtros rápidos */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={aplicarFiltroiPhoneUsado}
              className="px-3 py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              iPhone Usados
            </button>
            <button
              onClick={aplicarFiltroiPhoneNuevo}
              className="px-3 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              iPhone Nuevos
            </button>
            <button
              onClick={aplicarFiltroMacBooksNuevas}
              className="px-3 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              MacBooks Nuevas
            </button>
            <button
              onClick={aplicarFiltroMacBooksUsadas}
              className="px-3 py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              MacBooks Usadas
            </button>
            <button
              onClick={aplicarFiltroWindowsNuevas}
              className="px-3 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Windows Nuevas
            </button>
            <button
              onClick={aplicarFiltroWindowsUsadas}
              className="px-3 py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Windows Usadas
            </button>
            <button
              onClick={aplicarFiltroGamingNuevas}
              className="px-3 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Gaming Nuevas
            </button>
            <button
              onClick={aplicarFiltroGamingUsadas}
              className="px-3 py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Gaming Usadas
            </button>
            <button
              onClick={aplicarFiltroAndroid}
              className="px-3 py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Android
            </button>
          </div>

          {/* Filtros personalizables - Solo para computadoras y celulares */}
          {modoFiltros && tipoActivo !== 'otro' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Filtro de Categoría */}
              {tipoActivo === 'computadora' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
                  <select
                    value={filtros.categoria}
                    onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Todas</option>
                    <option value="macbook">MacBook</option>
                    <option value="windows">Windows</option>
                    <option value="gaming">Gaming</option>
                    <option value="2-en-1">2-en-1</option>
                  </select>
                </div>
              )}

              {tipoActivo === 'celular' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
                  <select
                    value={filtros.categoria}
                    onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Todas</option>
                    <option value="iphone">iPhone</option>
                    <option value="android">Android</option>
                  </select>
                </div>
              )}

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
          {/* Selector de moneda */}
          <div className="bg-white rounded border border-slate-200">
            <div className="px-4 py-2 bg-slate-800 text-white border-b border-slate-700">
              <h3 className="text-sm font-semibold">Moneda</h3>
            </div>
            <div className="p-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setMonedaPrecio('USD')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${monedaPrecio === 'USD'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  USD (Dólares)
                </button>
                <button
                  onClick={() => setMonedaPrecio('ARS')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${monedaPrecio === 'ARS'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  ARS (Pesos)
                </button>
              </div>
            </div>
          </div>

          {/* Espaciado entre productos */}
          <div className="bg-white rounded border border-slate-200">
            <div className="px-4 py-2 bg-slate-800 text-white border-b border-slate-700">
              <h3 className="text-sm font-semibold">Espaciado</h3>
            </div>
            <div className="p-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setEspaciadoDoble(false)}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${!espaciadoDoble
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setEspaciadoDoble(true)}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${espaciadoDoble
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  Doble
                </button>
              </div>
            </div>
          </div>

          {/* Mensaje inicial */}
          <div className={`bg-white rounded border border-slate-200 ${!incluirMensajeInicial ? 'opacity-50' : ''}`}>
            <div className="px-4 py-2 bg-slate-800 text-white border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Mensaje Inicial</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIncluirMensajeInicial(!incluirMensajeInicial)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${incluirMensajeInicial
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-600 text-slate-300'
                      }`}
                  >
                    {incluirMensajeInicial ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => iniciarEdicionMensaje(tipoActivo, 'inicial')}
                    className="text-white hover:text-emerald-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
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
          <div className={`bg-white rounded border border-slate-200 ${!incluirMensajeFinal ? 'opacity-50' : ''}`}>
            <div className="px-4 py-2 bg-slate-800 text-white border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Mensaje Final</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIncluirMensajeFinal(!incluirMensajeFinal)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${incluirMensajeFinal
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-600 text-slate-300'
                      }`}
                  >
                    {incluirMensajeFinal ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => iniciarEdicionMensaje(tipoActivo, 'final')}
                    className="text-white hover:text-emerald-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">

              {editandoMensaje === `${tipoActivo}-final` ? (
                <div className="space-y-3">
                  <textarea
                    value={mensajeTemp}
                    onChange={(e) => setMensajeTemp(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows="15"
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
                  className={`w-full py-3 px-4 rounded font-medium transition-colors flex items-center justify-center space-x-2 relative z-20 ${copiados.has('lista-completa')
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
                  <span>{tipoConfig.label} Disponibles</span>
                  <span className="bg-emerald-600 px-2 py-0.5 rounded text-xs">
                    {productosFiltradosYOrdenados.length}
                  </span>
                </h3>
                <button
                  onClick={seleccionarTodos}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${seleccionados.size === productosFiltradosYOrdenados.length && productosFiltradosYOrdenados.length > 0
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                >
                  {seleccionados.size === productosFiltradosYOrdenados.length && productosFiltradosYOrdenados.length > 0
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
                  <select
                    value={ordenamiento.campo === 'precio_venta_usd' ? `precio_venta_usd_${ordenamiento.direccion}` : ordenamiento.campo}
                    onChange={(e) => {
                      const valor = e.target.value;
                      if (valor === 'precio_venta_usd_desc') {
                        setOrdenamiento({ campo: 'precio_venta_usd', direccion: 'desc' });
                      } else if (valor === 'precio_venta_usd_asc') {
                        setOrdenamiento({ campo: 'precio_venta_usd', direccion: 'asc' });
                      } else {
                        actualizarOrdenamiento(valor);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Sin ordenar</option>
                    <option value="modelo">Modelo</option>
                    <option value="marca">Marca</option>
                    <option value="precio_venta_usd_desc">Precio mayor a menor</option>
                    <option value="precio_venta_usd_asc">Precio menor a mayor</option>
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
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={seleccionados.size === productosFiltradosYOrdenados.length && productosFiltradosYOrdenados.length > 0}
                        onChange={seleccionarTodos}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[100px]">Serial</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[150px]">Modelo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[80px]">Precio</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[500px]">COPY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {productosFiltradosYOrdenados.map((producto, index) => (
                    <tr key={producto.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-emerald-50 transition-colors`}>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={seleccionados.has(producto.id)}
                          onChange={() => toggleSeleccion(producto.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-700 text-center">
                        {producto.tipo === 'otro' ? producto.id : (producto.serial || 'N/A')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800 text-left">
                        {producto.tipo === 'otro' ? (producto.nombre_producto || 'N/A') : (producto.modelo || producto.descripcion_producto)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold text-emerald-700">
                        {monedaPrecio === 'USD'
                          ? `USD ${Math.round(producto.precio_venta_usd || 0)}`
                          : `$${Math.round((producto.precio_venta_usd || 0) * cotizacionDolar).toLocaleString('es-AR')}`
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-mono text-left">
                        <div className="whitespace-pre-wrap break-words">
                          {convertirPrecioEnCopy(producto.copy, producto)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {productosFiltradosYOrdenados.length === 0 && (
              <div className="text-center py-12 bg-white">
                {React.createElement(tipoConfig.icon, { className: "w-12 h-12 text-slate-300 mx-auto mb-4" })}
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