import React, { useState, useEffect, useCallback } from "react";
import { X, Search, Copy, Check, List } from "lucide-react";
import { useCatalogoUnificado } from "../../ventas/hooks/useCatalogoUnificado";
import { cotizacionService } from "../../../shared/services/cotizacionService";
import { formatearMonto } from "../../../shared/utils/formatters";
import { generateCopy } from "../../../shared/utils/copyGenerator";
import ProductModal from "../../../shared/components/base/ProductModal";
import {
  CATEGORIAS_OTROS_ARRAY,
  getCategoriaLabel,
} from "../../../shared/constants/categoryConstants";

const CONDICIONES_EXCLUIDAS = ["uso_oficina", "reservado", "reparacion", "consignacion"];

const INFO_COL1 = `📍 SUCURSALES

LA PLATA: 44 N° 862 1/2 PISO 4 E/ 12 Y PLAZA PASO
Lun, Mar, Mié, Vie: 9 a 16hs | Jue: 9 a 14hs

CABA: BARTOLOMÉ MITRE 797 PISO 14 OFICINA 1
Lun a Vie: 9 a 18hs | Sáb: 9 a 13hs`;

const INFO_COL2 = `⚠️ SOLO ATENDEMOS CON CITA PREVIA
Para sacar un turno necesitamos: nombre completo, día, horario, equipo a retirar y método de pago.

💳 MÉTODOS DE PAGO:
• Efectivo (pesos o dólares)
• Transferencia pesos (3% de recargo)
• Criptomonedas (USDT TRC20 o Binance)
• Tarjeta de crédito (35-50% de recargo en 3-6 cuotas)`;

const INFO_IMPORTANTE = `📍 SUCURSALES\n\nLA PLATA: 44 N° 862 1/2 PISO 4 E/ 12 Y PLAZA PASO\nLun, Mar, Mié, Vie: 9 a 16hs | Jue: 9 a 14hs\n\nCABA: BARTOLOMÉ MITRE 797 PISO 14 OFICINA 1\nLun a Vie: 9 a 18hs | Sáb: 9 a 13hs\n\n⚠️ SOLO ATENDEMOS CON CITA PREVIA\nPara sacar un turno necesitamos: nombre completo, día, horario, equipo a retirar y método de pago.\n\n💳 MÉTODOS DE PAGO:\n• Efectivo (pesos o dólares)\n• Transferencia pesos (3% de recargo)\n• Criptomonedas (USDT TRC20 o Binance)\n• Tarjeta de crédito (35-50% de recargo en 3-6 cuotas)`;

// Precio al que el revendedor compra (nuestro precio de venta menos el descuento)
const calcularPrecioCompraReventa = (producto, categoriaActiva) => {
  const venta = parseFloat(producto.precio_venta_usd) || 0;
  const tipo = producto._tipoProducto;

  if (categoriaActiva === "notebooks" || tipo === "notebooks") {
    return venta - 20;
  } else if (categoriaActiva === "celulares" || tipo === "celulares") {
    return venta - 20;
  } else {
    const subcat = (producto.categoria || "").toUpperCase();
    if (subcat.includes("WATCH")) return venta - 10;
    if (subcat.includes("TABLET") || subcat.includes("IPAD")) return venta - 20;
    const costo =
      parseFloat(producto.costo_total_usd) ||
      parseFloat(producto.precio_costo_total) ||
      0;
    const ganancia = venta - costo;
    return venta - ganancia * 0.2;
  }
};

// Precio al que el revendedor vende (nuestro precio de venta + margen extra)
const calcularPrecioVentaReventa = (producto, extraUSD = 0) => {
  const venta = parseFloat(producto.precio_venta_usd) || 0;
  return venta + extraUSD;
};

const getCondicionColor = (condicion) => {
  const c = (condicion || "").toLowerCase();
  if (c === "nuevo") return "bg-emerald-100 text-emerald-700";
  if (c === "refurbished" || c === "reacondicionado") return "bg-blue-100 text-blue-700";
  if (c === "usado") return "bg-yellow-100 text-yellow-700";
  if (c === "prestado") return "bg-cyan-100 text-cyan-700";
  if (c === "sin_reparacion") return "bg-slate-100 text-slate-600";
  return "bg-slate-100 text-slate-700";
};

const formatSucursal = (sucursal) => {
  const s = (sucursal || "").toLowerCase();
  if (s === "la_plata") return "La Plata";
  if (s === "mitre") return "Mitre";
  return null;
};

const getCategoriaEmoji = (categoria) => {
  const emojis = {
    DESKTOP: "💻", ACCESORIOS: "🔧", MONITORES: "🖥️", COMPONENTES: "⚡",
    FUNDAS_TEMPLADOS: "🛡️", TABLETS: "📱", MOUSE_TECLADOS: "⌨️", AUDIO: "🎧",
    ALMACENAMIENTO: "💾", CAMARAS: "📷", CONSOLAS: "🎮", GAMING: "🎯",
    DRONES: "🚁", WATCHES: "⌚", PLACAS_VIDEO: "🎨", STREAMING: "📡",
    REDES: "🌐", BAGS_CASES: "💼", CABLES_CARGADORES: "🔌", REPUESTOS: "🔩",
  };
  return emojis[categoria] || "📦";
};

const copiarTexto = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  }
};

const RevendedoresSection = () => {
  const {
    categoriaActiva,
    categoriaConfig,
    categorias,
    datos,
    datosSinFiltroSubcategoria,
    loading,
    error,
    filtros,
    ordenamiento,
    valoresUnicos,
    cambiarCategoria,
    actualizarFiltro,
    limpiarFiltros,
    actualizarOrdenamiento,
    totalProductos,
    hayFiltrosActivos,
  } = useCatalogoUnificado();

  const [cotizacionDolar, setCotizacionDolar] = useState(1000);
  const [modalDetalle, setModalDetalle] = useState({ open: false, producto: null });
  const [copiadoInfo, setCopiadoInfo] = useState(false);
  const [copiadoLista, setCopiadoLista] = useState(false);
  const [copiadoFila, setCopiadoFila] = useState(null); // "id-usd" | "id-ars"
  const [extraUSD, setExtraUSD] = useState(0);
  const [seleccionados, setSeleccionados] = useState(new Set());

  useEffect(() => {
    const cargarCotizacion = async () => {
      try {
        const cotizacionData = await cotizacionService.obtenerCotizacionActual();
        setCotizacionDolar(cotizacionData.valor);
      } catch (error) {
        console.error("Error cargando cotización:", error);
      }
    };
    cargarCotizacion();
    const interval = setInterval(cargarCotizacion, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Limpiar selección al cambiar categoría
  useEffect(() => {
    setSeleccionados(new Set());
  }, [categoriaActiva]);

  const datosFiltrados = datos.filter((p) => {
    const condicion = (p.condicion || "").toLowerCase();
    if (CONDICIONES_EXCLUIDAS.includes(condicion)) return false;
    const sucursal = (p.sucursal || p.ubicacion || "").toLowerCase();
    if (sucursal === "servicio_tecnico") return false;
    return true;
  });

  const contarPorSubcategoria = (subcategoria) => {
    if (!datosSinFiltroSubcategoria) return 0;
    const base = datosSinFiltroSubcategoria.filter((p) => {
      const condicion = (p.condicion || "").toLowerCase();
      if (CONDICIONES_EXCLUIDAS.includes(condicion)) return false;
      const sucursal = (p.sucursal || p.ubicacion || "").toLowerCase();
      if (sucursal === "servicio_tecnico") return false;
      return true;
    });
    if (categoriaActiva === "notebooks" || categoriaActiva === "celulares") {
      if (!subcategoria) return base.length;
      return base.filter((p) => p.categoria?.toLowerCase() === subcategoria.toLowerCase()).length;
    } else if (categoriaActiva === "otros") {
      if (!subcategoria) return base.length;
      return base.filter((p) => p.categoria?.toUpperCase() === subcategoria.toUpperCase()).length;
    } else if (categoriaActiva === "apple") {
      if (!subcategoria) return base.length;
      return base.filter((p) => p._tipoProducto === subcategoria).length;
    }
    return 0;
  };

  const getTipoProductoModal = (producto) => {
    if (categoriaActiva === "celulares") return "celular";
    if (categoriaActiva === "notebooks") return "notebook";
    if (categoriaActiva === "apple") {
      if (producto._tipoProducto === "celulares") return "celular";
      if (producto._tipoProducto === "notebooks") return "notebook";
      return "otro";
    }
    return "otro";
  };

  const getNombreProducto = (producto, esOtros, esCelular) => {
    if (esOtros) {
      return [producto.nombre_producto, producto.descripcion].filter(Boolean).join(" - ");
    }
    return generateCopy(producto, {
      tipo: esCelular ? "celular_completo" : "notebook_catalogo",
    });
  };

  const buildCopyText = (producto, enPesos) => {
    const esOtros =
      categoriaActiva === "otros" ||
      categoriaActiva.startsWith("otros-") ||
      (categoriaActiva === "apple" && producto._tipoProducto === "otros");
    const esCelular =
      categoriaActiva === "celulares" ||
      (categoriaActiva === "apple" && producto._tipoProducto === "celulares");
    const nombre = getNombreProducto(producto, esOtros, esCelular);
    const precio = calcularPrecioVentaReventa(producto, extraUSD);
    if (enPesos) {
      return `${nombre} - $${Math.round(precio * cotizacionDolar).toLocaleString("es-AR")}`;
    }
    return `${nombre} - U$D ${precio % 1 === 0 ? precio : precio.toFixed(2)}`;
  };

  const handleCopiarFila = async (e, producto, enPesos) => {
    e.stopPropagation();
    const key = `${producto.id}-${enPesos ? "ars" : "usd"}`;
    await copiarTexto(buildCopyText(producto, enPesos));
    setCopiadoFila(key);
    setTimeout(() => setCopiadoFila(null), 1500);
  };

  const handleCopiarInfo = async () => {
    await copiarTexto(INFO_IMPORTANTE);
    setCopiadoInfo(true);
    setTimeout(() => setCopiadoInfo(false), 2000);
  };

  const handleToggleSeleccion = (e, id) => {
    e.stopPropagation();
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleTodos = () => {
    if (seleccionados.size === datosFiltrados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(datosFiltrados.map((p) => p.id)));
    }
  };

  const handleCopiarLista = async () => {
    const productosSeleccionados = datosFiltrados.filter((p) => seleccionados.has(p.id));
    const lineas = productosSeleccionados.map((p, i) => {
      const esOtros =
        categoriaActiva === "otros" ||
        categoriaActiva.startsWith("otros-") ||
        (categoriaActiva === "apple" && p._tipoProducto === "otros");
      const esCelular =
        categoriaActiva === "celulares" ||
        (categoriaActiva === "apple" && p._tipoProducto === "celulares");
      const nombre = getNombreProducto(p, esOtros, esCelular);
      const precio = calcularPrecioVentaReventa(p, extraUSD);
      const usd = `U$D ${precio % 1 === 0 ? precio : precio.toFixed(2)}`;
      const ars = `$${Math.round(precio * cotizacionDolar).toLocaleString("es-AR")}`;
      return `${i + 1}. ${nombre} - ${usd} (${ars})`;
    });
    await copiarTexto(lineas.join("\n"));
    setCopiadoLista(true);
    setTimeout(() => setCopiadoLista(false), 2000);
  };

  const inputClasses =
    "w-full py-1.5 px-2 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:outline-none focus:border-slate-400";

  const thClass = "px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider";
  const thGreen = "px-3 py-2 text-center text-xs font-bold text-emerald-300 uppercase tracking-wider";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Cargando catálogo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const todosSeleccionados = datosFiltrados.length > 0 && seleccionados.size === datosFiltrados.length;

  return (
    <div className="p-0 space-y-4">
      {/* Información importante */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Información Importante</h3>
          <button
            onClick={handleCopiarInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded transition-colors"
          >
            {copiadoInfo ? <Check size={13} /> : <Copy size={13} />}
            {copiadoInfo ? "Copiado" : "Copiar"}
          </button>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <pre className="p-4 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{INFO_COL1}</pre>
          <pre className="p-4 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{INFO_COL2}</pre>
        </div>
      </div>

      {/* Selector de categorías y filtros */}
      <div className="bg-slate-800 rounded border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Categorías de Productos</h3>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center space-x-1 px-2 py-1 bg-slate-600 text-white text-xs rounded hover:bg-slate-700 transition-colors"
            >
              <X size={12} /><span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Tabs de categoría */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.values(categorias).map((cat) => (
            <button
              key={cat.id}
              onClick={() => cambiarCategoria(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${categoriaActiva === cat.id ? "bg-emerald-600 text-white" : "bg-slate-700 text-white hover:bg-slate-200"}`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="font-medium">{cat.label}</span>
              <span className={`text-xs px-2 py-1 rounded ${categoriaActiva === cat.id ? "bg-slate-200 text-slate-800" : "bg-slate-300 text-slate-800"}`}>
                {cat.data?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Subcategorías Notebooks */}
        {categoriaActiva === "notebooks" && (
          <div className="mt-3 pt-3 border-t border-slate-600 mb-3">
            <div className="flex flex-wrap gap-2">
              {[
                { value: "", label: "Todos", emoji: "📦" },
                { value: "macbook", label: "Macbook", emoji: "🍎" },
                { value: "windows", label: "Windows", emoji: "🪟" },
                { value: "2-en-1", label: "2-en-1", emoji: "🔄" },
                { value: "gaming", label: "Gaming", emoji: "🎮" },
              ].map((sub) => (
                <button key={sub.value} onClick={() => actualizarFiltro("categoria", sub.value)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm transition-colors ${filtros.categoria === sub.value ? "bg-emerald-600 text-white" : "bg-slate-700 text-white hover:bg-slate-600"}`}>
                  <span>{sub.emoji}</span><span>{sub.label}</span>
                  <span className={`text-xs px-2 py-1 rounded ${filtros.categoria === sub.value ? "bg-slate-200 text-slate-800" : "bg-slate-300 text-slate-800"}`}>{contarPorSubcategoria(sub.value)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subcategorías Celulares */}
        {categoriaActiva === "celulares" && (
          <div className="mt-3 pt-3 border-t border-slate-600 mb-3">
            <div className="flex flex-wrap gap-2">
              {[
                { value: "", label: "Todos", emoji: "📦" },
                { value: "iphone", label: "iPhone", emoji: "📱" },
                { value: "android", label: "Android", emoji: "🤖" },
              ].map((sub) => (
                <button key={sub.value} onClick={() => actualizarFiltro("categoria", sub.value)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm transition-colors ${filtros.categoria === sub.value ? "bg-emerald-600 text-white" : "bg-slate-700 text-white hover:bg-slate-600"}`}>
                  <span>{sub.emoji}</span><span>{sub.label}</span>
                  <span className={`text-xs px-2 py-1 rounded ${filtros.categoria === sub.value ? "bg-slate-200 text-slate-800" : "bg-slate-300 text-slate-800"}`}>{contarPorSubcategoria(sub.value)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subcategorías Otros */}
        {categoriaActiva === "otros" && (
          <div className="mt-3 pt-3 border-t border-slate-600 mb-3">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => actualizarFiltro("categoria", "")}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm transition-colors ${!filtros.categoria ? "bg-emerald-600 text-white" : "bg-slate-700 text-white hover:bg-slate-600"}`}>
                <span>📦</span><span>Todos</span>
                <span className={`text-xs px-2 py-1 rounded ${!filtros.categoria ? "bg-slate-200 text-slate-800" : "bg-slate-300 text-slate-800"}`}>{contarPorSubcategoria("")}</span>
              </button>
              {CATEGORIAS_OTROS_ARRAY.filter((cat) => contarPorSubcategoria(cat) > 0).map((cat) => (
                <button key={cat} onClick={() => actualizarFiltro("categoria", cat)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm transition-colors ${filtros.categoria === cat ? "bg-emerald-600 text-white" : "bg-slate-700 text-white hover:bg-slate-600"}`}>
                  <span>{getCategoriaEmoji(cat)}</span><span>{getCategoriaLabel(cat)}</span>
                  <span className={`text-xs px-2 py-1 rounded ${filtros.categoria === cat ? "bg-slate-200 text-slate-800" : "bg-slate-300 text-slate-800"}`}>{contarPorSubcategoria(cat)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subcategorías Apple */}
        {categoriaActiva === "apple" && categoriaConfig?.subcategorias && (
          <div className="mt-3 pt-3 border-t border-slate-600 mb-3">
            <div className="flex flex-wrap gap-2">
              {categoriaConfig.subcategorias.map((subcat) => (
                <button key={subcat.value} onClick={() => actualizarFiltro("subcategoria", subcat.value)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm transition-colors ${filtros.subcategoria === subcat.value ? "bg-emerald-600 text-white" : "bg-slate-700 text-white hover:bg-slate-600"}`}>
                  <span>{subcat.value === "notebooks" ? "💻" : subcat.value === "celulares" ? "📱" : "📦"}</span>
                  <span>{subcat.label}</span>
                  <span className={`text-xs px-2 py-1 rounded ${filtros.subcategoria === subcat.value ? "bg-slate-200 text-slate-800" : "bg-slate-300 text-slate-800"}`}>{contarPorSubcategoria(subcat.value)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="border-t border-slate-600 pt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input type="text" value={filtros.busqueda} onChange={(e) => actualizarFiltro("busqueda", e.target.value)} placeholder="Buscar..." className={`${inputClasses} pl-8`} />
              </div>
            </div>
            {valoresUnicos?.marcas?.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Marca</label>
                <select value={filtros.marca} onChange={(e) => actualizarFiltro("marca", e.target.value)} className={inputClasses}>
                  <option value="">Todas</option>
                  {valoresUnicos.marcas.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Condición</label>
              <select value={filtros.condicion} onChange={(e) => actualizarFiltro("condicion", e.target.value)} className={inputClasses}>
                <option value="">Todas</option>
                <option value="nuevo">Nuevo</option>
                <option value="usado">Usado</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Precio mín (USD)</label>
              <input type="number" value={filtros.precioMin} onChange={(e) => actualizarFiltro("precioMin", e.target.value)} placeholder="0"
                className={`${inputClasses} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Precio máx (USD)</label>
              <input type="number" value={filtros.precioMax} onChange={(e) => actualizarFiltro("precioMax", e.target.value)} placeholder="Sin límite"
                className={`${inputClasses} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Ordenar por</label>
              <select value={`${ordenamiento.campo}-${ordenamiento.direccion}`}
                onChange={(e) => { const [campo, direccion] = e.target.value.split("-"); actualizarOrdenamiento(campo, direccion); }}
                className={inputClasses}>
                <option value="-asc">Sin orden</option>
                <option value="precio_venta_usd-asc">Precio ↑</option>
                <option value="precio_venta_usd-desc">Precio ↓</option>
                <option value="marca-asc">Marca A-Z</option>
                <option value="marca-desc">Marca Z-A</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de acciones sobre la tabla */}
      <div className="bg-white border border-slate-200 rounded px-4 py-3 flex items-center justify-between gap-4">
        {/* Copiar lista */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {seleccionados.size > 0
              ? `${seleccionados.size} producto${seleccionados.size > 1 ? "s" : ""} seleccionado${seleccionados.size > 1 ? "s" : ""}`
              : "Ningún producto seleccionado"}
          </span>
          <button
            onClick={handleCopiarLista}
            disabled={seleccionados.size === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${seleccionados.size > 0 ? "bg-slate-700 hover:bg-slate-800 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
          >
            {copiadoLista ? <Check size={13} /> : <List size={13} />}
            {copiadoLista ? "Copiado" : "Copiar lista"}
          </button>
          {seleccionados.size > 0 && (
            <button onClick={() => setSeleccionados(new Set())} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Limpiar selección
            </button>
          )}
        </div>

        {/* Extra USD sobre precio reventa */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Agregar a P. Venta Reventa:</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={extraUSD === 0 ? "" : extraUSD}
              onChange={(e) => setExtraUSD(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-20 py-1.5 px-2 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-slate-500">USD</span>
            {extraUSD !== 0 && (
              <button onClick={() => setExtraUSD(0)} className="text-xs text-slate-400 hover:text-slate-600 ml-1">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          {datosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No hay productos disponibles con los filtros aplicados.
            </div>
          ) : (() => {
            const esOtros =
              categoriaActiva === "otros" || categoriaActiva.startsWith("otros-");

            return (
              <table className="w-full min-w-[1200px]">
                <thead className="bg-slate-800">
                  {esOtros ? (
                    <tr>
                      <th className="px-2 py-2 w-8">
                        <input type="checkbox" checked={todosSeleccionados} onChange={handleToggleTodos}
                          className="rounded cursor-pointer accent-emerald-600" />
                      </th>
                      <th className={`${thClass} text-left w-[18%]`}>Producto</th>
                      <th className={`${thClass} w-[5%]`}>Color</th>
                      <th className={`${thClass} w-[6%]`}>Serial</th>
                      <th className={`${thClass} w-[4%]`}>St. Mitre</th>
                      <th className={`${thClass} w-[4%]`}>St. LP</th>
                      <th className={`${thClass} w-[6%]`}>Condición</th>
                      <th className={`${thClass} w-[6%]`}>Garantía</th>
                      <th className={`${thClass} w-[7%]`}>P. Compra</th>
                      <th className={`${thClass} w-[8%]`}>P. Venta Update</th>
                      <th className={`${thGreen} w-[8%]`}>P. Compra Rev.</th>
                      <th className={`${thGreen} w-[8%]`}>P. Venta Rev.</th>
                      <th className={`${thGreen} w-[7%]`}>Ganancia</th>
                      <th className={`${thClass} w-[8%]`}>Copiar</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-2 py-2 w-8">
                        <input type="checkbox" checked={todosSeleccionados} onChange={handleToggleTodos}
                          className="rounded cursor-pointer accent-emerald-600" />
                      </th>
                      <th className={`${thClass} text-left w-[18%]`}>Producto</th>
                      <th className={`${thClass} w-[5%]`}>Color</th>
                      <th className={`${thClass} w-[5%]`}>Sucursal</th>
                      <th className={`${thClass} w-[6%]`}>Condición</th>
                      <th className={`${thClass} w-[7%]`}>Serial</th>
                      <th className={`${thClass} w-[6%]`}>Garantía</th>
                      <th className={`${thClass} w-[7%]`}>P. Compra</th>
                      <th className={`${thClass} w-[8%]`}>P. Venta Update</th>
                      <th className={`${thGreen} w-[8%]`}>P. Compra Rev.</th>
                      <th className={`${thGreen} w-[8%]`}>P. Venta Rev.</th>
                      <th className={`${thGreen} w-[7%]`}>Ganancia</th>
                      <th className={`${thClass} w-[8%]`}>Copiar</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datosFiltrados.map((producto, index) => {
                    const esFilaOtros =
                      categoriaActiva === "otros" ||
                      categoriaActiva.startsWith("otros-") ||
                      (categoriaActiva === "apple" && producto._tipoProducto === "otros");

                    const esCelular =
                      categoriaActiva === "celulares" ||
                      (categoriaActiva === "apple" && producto._tipoProducto === "celulares");

                    const precioVenta = parseFloat(producto.precio_venta_usd) || 0;
                    const precioCompra = esFilaOtros || esCelular
                      ? parseFloat(producto.costo_total_usd) || parseFloat(producto.precio_compra_usd) || 0
                      : parseFloat(producto.precio_costo_total) || parseFloat(producto.precio_costo_usd) || 0;
                    const condicion = producto.condicion || "";
                    const serial = producto.serial || (esCelular ? producto.imei : "") || "";
                    const garantia = esCelular
                      ? producto.garantia || "-"
                      : esFilaOtros
                      ? producto.garantia || "-"
                      : producto.garantia_update || producto.garantia_oficial || "-";

                    const precioCompraReventa = calcularPrecioCompraReventa(producto, categoriaActiva);
                    const precioVentaReventa = calcularPrecioVentaReventa(producto, extraUSD);
                    const ganancia = precioVentaReventa - precioCompraReventa;

                    const estaSeleccionado = seleccionados.has(producto.id);
                    const rowBg = estaSeleccionado
                      ? "bg-emerald-50"
                      : index % 2 === 0 ? "bg-white" : "bg-slate-50";

                    const keyUSD = `${producto.id}-usd`;
                    const keyARS = `${producto.id}-ars`;

                    const tdBase = `px-3 py-2 text-sm text-slate-800`;
                    const tdCenter = `px-3 py-2 text-sm text-center`;

                    return (
                      <tr
                        key={producto.id}
                        onClick={() => setModalDetalle({ open: true, producto })}
                        className={`cursor-pointer hover:bg-emerald-50 transition-colors ${rowBg}`}
                      >
                        {/* Checkbox */}
                        <td className="px-2 py-2 text-center" onClick={(e) => handleToggleSeleccion(e, producto.id)}>
                          <input type="checkbox" checked={estaSeleccionado} onChange={() => {}}
                            className="rounded cursor-pointer accent-emerald-600" />
                        </td>

                        {/* Producto */}
                        <td className={`${tdBase} font-medium uppercase`}>
                          {esFilaOtros ? (
                            <span>
                              {producto.nombre_producto || "SIN NOMBRE"}
                              {producto.descripcion && <span className="text-slate-500 font-normal"> - {producto.descripcion}</span>}
                            </span>
                          ) : (
                            generateCopy(producto, { tipo: esCelular ? "celular_completo" : "notebook_catalogo" })
                          )}
                        </td>

                        {/* Color */}
                        <td className={`${tdCenter} text-slate-600`}>{producto.color || "-"}</td>

                        {esFilaOtros ? (
                          <>
                            <td className={`${tdCenter} font-mono text-xs text-slate-600`} title={serial}>{serial || "-"}</td>
                            <td className={tdCenter}>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${(producto.cantidad_mitre || 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {producto.cantidad_mitre || 0}
                              </span>
                            </td>
                            <td className={tdCenter}>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${(producto.cantidad_la_plata || 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {producto.cantidad_la_plata || 0}
                              </span>
                            </td>
                          </>
                        ) : (
                          <td className={`${tdCenter} text-slate-600`}>{formatSucursal(producto.sucursal || producto.ubicacion) || "-"}</td>
                        )}

                        {/* Condición */}
                        <td className={tdCenter}>
                          <span className={`px-2 py-0.5 text-xs rounded font-medium ${getCondicionColor(condicion)}`}>
                            {condicion.toUpperCase() || "-"}
                          </span>
                        </td>

                        {/* Serial (notebooks/celulares) */}
                        {!esFilaOtros && (
                          <td className={`${tdCenter} font-mono text-xs text-slate-600`} title={serial}>{serial || "-"}</td>
                        )}

                        {/* Garantía */}
                        <td className={`${tdCenter} text-xs text-slate-600`}>{garantia}</td>

                        {/* Precio Compra */}
                        <td className={tdCenter}>
                          <div className="text-sm text-slate-600">{precioCompra > 0 ? formatearMonto(precioCompra, "USD") : "-"}</div>
                        </td>

                        {/* Precio Venta Update */}
                        <td className={tdCenter}>
                          <div className="text-sm font-medium text-slate-800">{formatearMonto(precioVenta, "USD")}</div>
                          <div className="text-xs text-slate-400">${Math.round(precioVenta * cotizacionDolar).toLocaleString("es-AR")}</div>
                        </td>

                        {/* Precio Compra Reventa */}
                        <td className={tdCenter}>
                          <div className="text-sm font-semibold text-emerald-700">{formatearMonto(precioCompraReventa, "USD")}</div>
                          <div className="text-xs text-slate-400">${Math.round(precioCompraReventa * cotizacionDolar).toLocaleString("es-AR")}</div>
                        </td>

                        {/* Precio Venta Reventa */}
                        <td className={tdCenter}>
                          <div className="text-sm font-bold text-emerald-600">{formatearMonto(precioVentaReventa, "USD")}</div>
                          <div className="text-xs text-slate-400">${Math.round(precioVentaReventa * cotizacionDolar).toLocaleString("es-AR")}</div>
                        </td>

                        {/* Ganancia */}
                        <td className={tdCenter}>
                          <div className={`text-sm font-bold ${ganancia >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatearMonto(ganancia, "USD")}</div>
                          <div className="text-xs text-slate-400">${Math.round(ganancia * cotizacionDolar).toLocaleString("es-AR")}</div>
                        </td>

                        {/* Botones copiar */}
                        <td className={tdCenter} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => handleCopiarFila(e, producto, false)}
                              title="Copiar en USD"
                              className={`w-9 h-8 text-xs font-bold rounded transition-colors flex items-center justify-center ${copiadoFila === keyUSD ? "bg-emerald-600 text-white" : "bg-slate-600 hover:bg-slate-700 text-white"}`}
                            >
                              {copiadoFila === keyUSD ? <Check size={12} /> : "U$"}
                            </button>
                            <button
                              onClick={(e) => handleCopiarFila(e, producto, true)}
                              title="Copiar en pesos"
                              className={`w-9 h-8 text-xs font-bold rounded transition-colors flex items-center justify-center ${copiadoFila === keyARS ? "bg-emerald-600 text-white" : "bg-slate-600 hover:bg-slate-700 text-white"}`}
                            >
                              {copiadoFila === keyARS ? <Check size={12} /> : "$"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>

      {/* Modal de detalle */}
      {modalDetalle.open && modalDetalle.producto && (
        <ProductModal
          producto={modalDetalle.producto}
          isOpen={modalDetalle.open}
          onClose={() => setModalDetalle({ open: false, producto: null })}
          cotizacionDolar={cotizacionDolar}
          tipoProducto={getTipoProductoModal(modalDetalle.producto)}
        />
      )}
    </div>
  );
};

export default RevendedoresSection;
