// ListasRevendedores.jsx - Generador de listas para revendedores con descuento 30% sobre ganancia
import React, { useState, useEffect, useMemo } from 'react';
import { Users, Copy, Check, DollarSign, Search, Monitor, Smartphone, Edit2, Save, X } from 'lucide-react';
import { generateCopy } from '../../../shared/utils/copyGenerator';
import { cotizacionService } from '../../../shared/services/cotizacionService';
import { CATEGORIAS_OTROS_LABELS, CATEGORIAS_OTROS_ARRAY, normalizeCategoria } from '../../../shared/constants/categoryConstants';

const ListasRevendedores = ({ computers = [], celulares = [], otros = [], loading, error }) => {
  // Estados de tipos incluidos - todas las categorías individuales
  const [tiposIncluidos, setTiposIncluidos] = useState({
    notebooks: true,
    celulares: true,
    ...CATEGORIAS_OTROS_ARRAY.reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
  });

  // Mensajes personalizables
  const [mensajeInicial, setMensajeInicial] = useState('🔥 LISTA REVENDEDORES 🔥\n💰 Precios mayoristas Update Tech');
  const [mensajeFinal, setMensajeFinal] = useState('⚠️ Precios válidos por 24hs\n📦 Sujetos a disponibilidad de stock\n🛡️ Garantía 1 mes productos usados, 3 meses productos nuevos\n💵 Aceptamos pagos en efectivo, transferencia (+3%) y USDT\n❌ No aceptamos billetes manchados, escritos, rotos, cambio ni cara chica');
  const [incluirMensajeInicial, setIncluirMensajeInicial] = useState(true);
  const [incluirMensajeFinal, setIncluirMensajeFinal] = useState(true);
  const [editandoMensaje, setEditandoMensaje] = useState(null);
  const [mensajeTemp, setMensajeTemp] = useState('');

  // Modo de aumento: 'descuento' (% sobre ganancia) o 'gananciaFija' (monto fijo para todas las categorías)
  const [modoAumento, setModoAumento] = useState('descuento');

  // Descuento sobre ganancia (porcentaje) - usado cuando modoAumento = 'descuento'
  const [porcentajeDescuento, setPorcentajeDescuento] = useState(30);

  // Ganancia fija (USD) - usado cuando modoAumento = 'gananciaFija'
  const [gananciaFija, setGananciaFija] = useState(50);

  // Moneda y cotización
  const [cotizacionDolar, setCotizacionDolar] = useState(1000);
  const [monedaPrecio, setMonedaPrecio] = useState('USD');

  // Selección de productos
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [copiados, setCopiados] = useState(new Set());

  // Búsqueda y ordenamiento
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState({ campo: 'precioRevendedor', direccion: 'asc' });

  // Espaciado
  const [espaciadoDoble, setEspaciadoDoble] = useState(false);

  // Cargar cotización al montar
  useEffect(() => {
    const cargarCotizacion = async () => {
      try {
        const cotizacion = await cotizacionService.obtenerCotizacionActual();
        if (cotizacion?.valor) {
          setCotizacionDolar(cotizacion.valor);
        }
      } catch (err) {
        console.error('Error cargando cotización:', err);
      }
    };
    cargarCotizacion();
  }, []);

  // Calcular precio revendedor según el modo de aumento
  const calcularPrecioRevendedor = (producto, tipo, categoria = null) => {
    const precioVenta = parseFloat(producto.precio_venta_usd) || 0;
    let costo = 0;
    if (tipo === 'computadora') {
      costo = parseFloat(producto.precio_costo_total) || parseFloat(producto.precio_costo_usd) || 0;
    } else {
      costo = parseFloat(producto.costo_total_usd) || parseFloat(producto.precio_compra_usd) || 0;
    }

    if (modoAumento === 'descuento') {
      // Modo descuento: precio venta - X% de la ganancia
      const ganancia = precioVenta - costo;
      const descuento = ganancia * (porcentajeDescuento / 100);
      return Math.round(precioVenta - descuento);
    } else {
      // Modo ganancia fija: costo + ganancia fija
      return Math.round(costo + gananciaFija);
    }
  };

  // Generar copy con precio revendedor
  const generarCopyRevendedor = (producto, tipo, categoria = null) => {
    const precioRevendedor = calcularPrecioRevendedor(producto, tipo, categoria);

    let tipoCopy;
    switch (tipo) {
      case 'computadora': tipoCopy = 'notebook_comercial'; break;
      case 'celular': tipoCopy = 'celular_comercial'; break;
      default: tipoCopy = 'otro_comercial';
    }

    const copyBase = generateCopy(producto, { tipo: tipoCopy });

    // Reemplazar precio en el copy
    if (monedaPrecio === 'USD') {
      const precioFormateado = `U$${precioRevendedor.toLocaleString('es-AR')}`;
      return copyBase.replace(/U\$[\d.,]+/g, precioFormateado);
    } else {
      const precioARS = Math.round(precioRevendedor * cotizacionDolar);
      const precioFormateado = `$${precioARS.toLocaleString('es-AR')}`;
      return copyBase.replace(/U\$[\d.,]+/g, precioFormateado);
    }
  };

  // Unificar todos los productos con copy
  const productosUnificados = useMemo(() => {
    const productos = [];
    const condicionesPermitidas = ['nuevo', 'nueva', 'usado', 'usada', 'refurbished', 'reacondicionado', 'reacondicionada'];

    // Notebooks
    if (tiposIncluidos.notebooks) {
      computers.forEach(comp => {
        const condicion = (comp.condicion || '').toLowerCase();
        if (condicionesPermitidas.includes(condicion)) {
          const costo = parseFloat(comp.precio_costo_total) || parseFloat(comp.precio_costo_usd) || 0;
          const precioVenta = parseFloat(comp.precio_venta_usd) || 0;
          const ganancia = precioVenta - costo;
          const precioRevendedor = calcularPrecioRevendedor(comp, 'computadora');
          const gananciaConDescuento = precioRevendedor - costo;

          productos.push({
            ...comp,
            tipo: 'computadora',
            tipoLabel: 'Notebook',
            costo,
            precioVenta,
            ganancia,
            precioRevendedor,
            gananciaConDescuento,
            copy: generarCopyRevendedor(comp, 'computadora')
          });
        }
      });
    }

    // Celulares
    if (tiposIncluidos.celulares) {
      celulares.forEach(cel => {
        const condicion = (cel.condicion || '').toLowerCase();
        if (condicionesPermitidas.includes(condicion)) {
          const costo = parseFloat(cel.costo_total_usd) || parseFloat(cel.precio_compra_usd) || 0;
          const precioVenta = parseFloat(cel.precio_venta_usd) || 0;
          const ganancia = precioVenta - costo;
          const precioRevendedor = calcularPrecioRevendedor(cel, 'celular');
          const gananciaConDescuento = precioRevendedor - costo;

          productos.push({
            ...cel,
            tipo: 'celular',
            tipoLabel: 'Celular',
            costo,
            precioVenta,
            ganancia,
            precioRevendedor,
            gananciaConDescuento,
            copy: generarCopyRevendedor(cel, 'celular')
          });
        }
      });
    }

    // Otros - filtrar por categoría (solo si la categoría está activa)
    otros.forEach(otro => {
      // Normalizar la categoría para que coincida con las opciones del filtro
      const categoriaRaw = otro.categoria || '';
      // Si no tiene categoría, no mostrar (evita que caigan en ACCESORIOS por defecto)
      if (!categoriaRaw.trim()) return;

      const categoria = normalizeCategoria(categoriaRaw);

      // Solo mostrar si la categoría normalizada está incluida en los filtros
      if (!tiposIncluidos[categoria]) return;

      const condicion = (otro.condicion || '').toLowerCase();
      if (condicionesPermitidas.includes(condicion)) {
        const costo = parseFloat(otro.costo_total_usd) || parseFloat(otro.precio_compra_usd) || 0;
        const precioVenta = parseFloat(otro.precio_venta_usd) || 0;
        const ganancia = precioVenta - costo;
        const precioRevendedor = calcularPrecioRevendedor(otro, 'otro', categoria);
        const gananciaConDescuento = precioRevendedor - costo;

        productos.push({
          ...otro,
          tipo: 'otro',
          tipoLabel: CATEGORIAS_OTROS_LABELS[categoria] || categoria,
          costo,
          precioVenta,
          ganancia,
          precioRevendedor,
          gananciaConDescuento,
          copy: generarCopyRevendedor(otro, 'otro', categoria)
        });
      }
    });

    return productos;
  }, [computers, celulares, otros, tiposIncluidos, monedaPrecio, cotizacionDolar, porcentajeDescuento, modoAumento, gananciaFija]);

  // Filtrar y ordenar
  const productosFiltradosYOrdenados = useMemo(() => {
    let resultado = [...productosUnificados];

    // Búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(p =>
        p.copy?.toLowerCase().includes(termino) ||
        p.marca?.toLowerCase().includes(termino) ||
        p.modelo?.toLowerCase().includes(termino) ||
        p.nombre_producto?.toLowerCase().includes(termino)
      );
    }

    // Ordenamiento
    if (ordenamiento.campo) {
      resultado.sort((a, b) => {
        let valorA = a[ordenamiento.campo];
        let valorB = b[ordenamiento.campo];

        // Asegurar que sean números para campos numéricos
        if (['costo', 'precioVenta', 'ganancia', 'precioRevendedor', 'gananciaConDescuento'].includes(ordenamiento.campo)) {
          valorA = parseFloat(valorA) || 0;
          valorB = parseFloat(valorB) || 0;
        }

        if (typeof valorA === 'string' && typeof valorB === 'string') {
          return ordenamiento.direccion === 'asc'
            ? valorA.localeCompare(valorB)
            : valorB.localeCompare(valorA);
        }

        return ordenamiento.direccion === 'asc'
          ? valorA - valorB
          : valorB - valorA;
      });
    }

    return resultado;
  }, [productosUnificados, busqueda, ordenamiento]);

  // Toggle selección
  const toggleSeleccion = (id) => {
    setSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  };

  // Seleccionar todos
  const seleccionarTodos = () => {
    if (seleccionados.size === productosFiltradosYOrdenados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(productosFiltradosYOrdenados.map(p => p.id)));
    }
  };

  // Toggle tipo
  const toggleTipoIncluido = (tipo) => {
    setTiposIncluidos(prev => ({ ...prev, [tipo]: !prev[tipo] }));
    setSeleccionados(new Set());
  };

  // Seleccionar/Deseleccionar todas las categorías
  const toggleTodasCategorias = () => {
    const todasActivas = Object.values(tiposIncluidos).every(v => v);
    const nuevoValor = !todasActivas;
    setTiposIncluidos({
      notebooks: nuevoValor,
      celulares: nuevoValor,
      ...CATEGORIAS_OTROS_ARRAY.reduce((acc, cat) => ({ ...acc, [cat]: nuevoValor }), {})
    });
    setSeleccionados(new Set());
  };

  // Edición de mensajes
  const iniciarEdicionMensaje = (cual) => {
    setEditandoMensaje(cual);
    setMensajeTemp(cual === 'inicial' ? mensajeInicial : mensajeFinal);
  };

  const guardarMensaje = (cual) => {
    if (cual === 'inicial') {
      setMensajeInicial(mensajeTemp);
    } else {
      setMensajeFinal(mensajeTemp);
    }
    setEditandoMensaje(null);
    setMensajeTemp('');
  };

  const cancelarEdicionMensaje = () => {
    setEditandoMensaje(null);
    setMensajeTemp('');
  };

  // Emojis por categoría
  const EMOJI_CATEGORIAS = {
    'Notebook': '💻',
    'Celular': '📱',
    'Desktop': '🖥️',
    'Accesorios': '🔌',
    'Monitores': '🖥️',
    'Componentes': '⚙️',
    'Fundas/Templados': '🛡️',
    'Tablets': '📱',
    'Mouse/Teclados': '🖱️',
    'Audio': '🎧',
    'Almacenamiento': '💾',
    'Cámaras': '📷',
    'Consolas': '🎮',
    'Gaming': '🎮',
    'Drones': '🚁',
    'Watches': '⌚',
    'Placas de Video': '🎨',
    'Streaming': '📺',
    'Redes': '📡',
    'Bags/Cases': '🎒',
    'Cables/Cargadores': '🔌',
    'Memoria': '💾',
    'Repuestos': '🔧'
  };

  // Generar lista completa agrupada por categoría
  const generarListaCompleta = () => {
    const separador = espaciadoDoble ? '\n\n' : '\n';
    const partes = [];

    // Mensaje inicial
    if (incluirMensajeInicial && mensajeInicial.trim()) {
      partes.push(mensajeInicial.trim());
      partes.push('');
    }

    // Obtener productos seleccionados
    const productosSeleccionados = productosFiltradosYOrdenados.filter(p => seleccionados.has(p.id));

    // Agrupar por tipoLabel (categoría visual)
    const productosPorCategoria = {};
    productosSeleccionados.forEach(producto => {
      const categoria = producto.tipoLabel || 'Otros';
      if (!productosPorCategoria[categoria]) {
        productosPorCategoria[categoria] = [];
      }
      productosPorCategoria[categoria].push(producto);
    });

    // Ordenar categorías alfabéticamente
    const categoriasOrdenadas = Object.keys(productosPorCategoria).sort();

    // Generar contenido por categoría
    categoriasOrdenadas.forEach((categoria, index) => {
      // Título de categoría con emoji
      const emoji = EMOJI_CATEGORIAS[categoria] || '📦';
      partes.push(`*_${emoji} ${categoria.toUpperCase()}_*`);

      // Productos de esta categoría
      const copysCategoria = productosPorCategoria[categoria].map(p => p.copy);
      partes.push(copysCategoria.join(separador));

      // Separación entre categorías (excepto la última)
      if (index < categoriasOrdenadas.length - 1) {
        partes.push('');
      }
    });

    // Mensaje final
    if (incluirMensajeFinal && mensajeFinal.trim()) {
      partes.push('');
      partes.push(mensajeFinal.trim());
    }

    return partes.join('\n');
  };

  // Copiar al portapapeles
  const copiarListaCompleta = async () => {
    if (seleccionados.size === 0) {
      alert('Selecciona al menos un producto');
      return;
    }

    const lista = generarListaCompleta();

    try {
      await navigator.clipboard.writeText(lista);
      setCopiados(new Set(['lista-completa']));
      setTimeout(() => setCopiados(new Set()), 2000);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = lista;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiados(new Set(['lista-completa']));
      setTimeout(() => setCopiados(new Set()), 2000);
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
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Categorías - todas con botones toggle */}
      <div className="bg-white rounded border border-slate-200">
        <div className="px-4 py-3 bg-slate-800 text-white flex items-center justify-between">
          <h3 className="text-sm font-semibold">Categorías</h3>
          <button
            onClick={toggleTodasCategorias}
            className="px-3 py-1 rounded text-xs font-medium bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            {Object.values(tiposIncluidos).every(v => v) ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
          </button>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {/* Notebooks */}
            <button
              onClick={() => toggleTipoIncluido('notebooks')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${tiposIncluidos.notebooks
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <Monitor size={14} />
              <span>Notebooks</span>
            </button>

            {/* Celulares */}
            <button
              onClick={() => toggleTipoIncluido('celulares')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${tiposIncluidos.celulares
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <Smartphone size={14} />
              <span>Celulares</span>
            </button>

            {/* Todas las categorías de Otros */}
            {CATEGORIAS_OTROS_ARRAY.map(cat => (
              <button
                key={cat}
                onClick={() => toggleTipoIncluido(cat)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${tiposIncluidos[cat]
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {CATEGORIAS_OTROS_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Layout principal: 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna izquierda: Configuración */}
        <div className="space-y-4">
          {/* Configuración */}
          <div className="bg-white rounded border border-slate-200">
            <div className="px-4 py-2 bg-slate-800 text-white border-b border-slate-700">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <DollarSign size={14} />
                Configuración
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Moneda */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Moneda</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMonedaPrecio('USD')}
                    className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${monedaPrecio === 'USD'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    USD
                  </button>
                  <button
                    onClick={() => setMonedaPrecio('ARS')}
                    className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${monedaPrecio === 'ARS'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    ARS
                  </button>
                </div>
                {monedaPrecio === 'ARS' && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">Cotización:</span>
                    <input
                      type="number"
                      value={cotizacionDolar}
                      onChange={(e) => setCotizacionDolar(parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-slate-200 rounded text-sm text-center"
                    />
                  </div>
                )}
              </div>

              {/* Modo de Aumento */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Aumento</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModoAumento('descuento')}
                    className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${modoAumento === 'descuento'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    Descuento %
                  </button>
                  <button
                    onClick={() => setModoAumento('gananciaFija')}
                    className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${modoAumento === 'gananciaFija'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    Ganancia Fija
                  </button>
                </div>
              </div>

              {/* Opción según modo seleccionado */}
              {modoAumento === 'descuento' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Descuento sobre Ganancia</label>
                  <div className="grid grid-cols-5 gap-1">
                    {[10, 15, 20, 25, 30].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setPorcentajeDescuento(pct)}
                        className={`py-2 rounded text-sm font-medium transition-colors ${porcentajeDescuento === pct
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Ganancia Fija (USD)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">U$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={gananciaFija}
                      onChange={(e) => setGananciaFija(parseInt(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm text-center"
                      placeholder="50"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Precio = Costo + Ganancia Fija</p>
                </div>
              )}

              {/* Espaciado */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Espaciado</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEspaciadoDoble(false)}
                    className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${!espaciadoDoble
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    Simple
                  </button>
                  <button
                    onClick={() => setEspaciadoDoble(true)}
                    className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${espaciadoDoble
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    Doble
                  </button>
                </div>
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
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${incluirMensajeInicial ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300'
                      }`}
                  >
                    {incluirMensajeInicial ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => iniciarEdicionMensaje('inicial')} className="text-white hover:text-emerald-400">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              {editandoMensaje === 'inicial' ? (
                <div className="space-y-3">
                  <textarea
                    value={mensajeTemp}
                    onChange={(e) => setMensajeTemp(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded text-sm"
                    rows="3"
                    placeholder="Escribe un mensaje inicial..."
                  />
                  <div className="flex space-x-2">
                    <button onClick={() => guardarMensaje('inicial')} className="px-3 py-1 bg-emerald-600 text-white rounded text-sm flex items-center space-x-1">
                      <Save className="w-3 h-3" /><span>Guardar</span>
                    </button>
                    <button onClick={cancelarEdicionMensaje} className="px-3 py-1 bg-slate-600 text-white rounded text-sm flex items-center space-x-1">
                      <X className="w-3 h-3" /><span>Cancelar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded text-sm whitespace-pre-line text-slate-700">
                  {mensajeInicial || <span className="text-slate-400 italic">Sin mensaje inicial</span>}
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
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${incluirMensajeFinal ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300'
                      }`}
                  >
                    {incluirMensajeFinal ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => iniciarEdicionMensaje('final')} className="text-white hover:text-emerald-400">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              {editandoMensaje === 'final' ? (
                <div className="space-y-3">
                  <textarea
                    value={mensajeTemp}
                    onChange={(e) => setMensajeTemp(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded text-sm"
                    rows="5"
                  />
                  <div className="flex space-x-2">
                    <button onClick={() => guardarMensaje('final')} className="px-3 py-1 bg-emerald-600 text-white rounded text-sm flex items-center space-x-1">
                      <Save className="w-3 h-3" /><span>Guardar</span>
                    </button>
                    <button onClick={cancelarEdicionMensaje} className="px-3 py-1 bg-slate-600 text-white rounded text-sm flex items-center space-x-1">
                      <X className="w-3 h-3" /><span>Cancelar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded text-sm whitespace-pre-line text-slate-700">
                  {mensajeFinal}
                </div>
              )}
            </div>
          </div>

          {/* Botón copiar lista */}
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
                  className={`w-full py-3 px-4 rounded font-medium transition-colors flex items-center justify-center space-x-2 ${copiados.has('lista-completa')
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
                  <span>Productos Disponibles</span>
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <select
                  value={`${ordenamiento.campo}_${ordenamiento.direccion}`}
                  onChange={(e) => {
                    const [campo, dir] = e.target.value.split('_');
                    setOrdenamiento({ campo, direccion: dir });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                >
                  <option value="precioRevendedor_asc">Precio menor a mayor</option>
                  <option value="precioRevendedor_desc">Precio mayor a menor</option>
                  <option value="tipoLabel_asc">Categoría A-Z</option>
                  <option value="tipoLabel_desc">Categoría Z-A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        checked={seleccionados.size === productosFiltradosYOrdenados.length && productosFiltradosYOrdenados.length > 0}
                        onChange={seleccionarTodos}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider">COPY</th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">Costo</th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">P.Venta</th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">P.Reventa</th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider w-24">Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {productosFiltradosYOrdenados.map((producto, index) => (
                    <tr
                      key={producto.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-emerald-50 transition-colors cursor-pointer`}
                      onClick={() => toggleSeleccion(producto.id)}
                    >
                      <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={seleccionados.has(producto.id)}
                          onChange={() => toggleSeleccion(producto.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-2 py-2 text-xs text-slate-700 font-mono text-left">
                        <div className="whitespace-pre-wrap break-words max-w-lg">
                          {producto.copy}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-center text-slate-600">
                        U${Math.round(producto.costo).toLocaleString('es-AR')}
                      </td>
                      <td className="px-3 py-2 text-sm text-center text-slate-800">
                        U${Math.round(producto.precioVenta).toLocaleString('es-AR')}
                      </td>
                      <td className="px-3 py-2 text-sm text-center font-bold text-blue-700">
                        U${producto.precioRevendedor.toLocaleString('es-AR')}
                      </td>
                      <td className="px-3 py-2 text-sm text-center font-medium text-emerald-600">
                        U${Math.round(producto.gananciaConDescuento).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {productosFiltradosYOrdenados.length === 0 && (
              <div className="text-center py-12 bg-white">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListasRevendedores;
