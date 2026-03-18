import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Monitor, Smartphone, Box, Calculator, Save,
  ChevronDown, ChevronUp, CheckCircle, Clock, FileText,
  AlertTriangle, X, History, Play, StopCircle, Trash2,
  Eye, Wrench, ClipboardList
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { obtenerFechaArgentina, obtenerTimestampActual, formatearTimestampDisplay } from '../../../shared/config/timezone';
import { generateCopy } from '../../../shared/utils/copyGenerator';
import { useAuthContext } from '../../../context/AuthContext';
import { generarRecuentoSesionPDF } from '../pdf/RecuentoSesionPDF';

const SUCURSALES = [
  { id: 'la_plata', label: 'LA PLATA' },
  { id: 'mitre', label: 'MITRE' },
];

const CATEGORIAS = [
  { id: 'notebooks', label: 'NOTEBOOKS', icon: Monitor },
  { id: 'celulares', label: 'CELULARES', icon: Smartphone },
  { id: 'otros', label: 'OTROS', icon: Box },
];

const SUCURSAL_LABELS = {
  la_plata: 'LA PLATA',
  mitre: 'MITRE',
  servicio_tecnico: 'SERVICIO TÉCNICO',
};

const CATEGORIA_OTROS_LABELS = {
  DESKTOP: 'Desktop',
  ACCESORIOS: 'Accesorios',
  MONITORES: 'Monitores',
  COMPONENTES: 'Componentes',
  FUNDAS_TEMPLADOS: 'Fundas y Templados',
  TABLETS: 'Tablets',
  MOUSE_TECLADOS: 'Mouse y Teclados',
  AUDIO: 'Audio',
  ALMACENAMIENTO: 'Almacenamiento',
  CAMARAS: 'Cámaras',
  CONSOLAS: 'Consolas',
  GAMING: 'Gaming',
  DRONES: 'Drones',
  WATCHES: 'Watches',
  PLACAS_VIDEO: 'Placas de Video',
  STREAMING: 'Streaming',
  REDES: 'Redes',
  BAGS_CASES: 'Bags y Cases',
  CABLES_CARGADORES: 'Cables y Cargadores',
  MEMORIA: 'Memoria',
  REPUESTOS: 'Repuestos',
};

const formatCategoriaNombre = (sub, categoria) => {
  if (categoria === 'otros') {
    return CATEGORIA_OTROS_LABELS[sub] || sub.replace(/_/g, ' ');
  }
  return sub;
};

// ── DB helpers ────────────────────────────────────────────────────────────────
async function fetchInventarioPorCategoria(sucursal, categoria) {
  const suc = sucursal?.toLowerCase();

  if (categoria === 'notebooks') {
    let q = supabase.from('inventario').select('*').neq('condicion', 'consignacion');
    if (suc) q = q.eq('sucursal', suc);
    const { data } = await q;
    return (data || []).sort((a, b) => (a.modelo || '').localeCompare(b.modelo || ''));
  }

  if (categoria === 'celulares') {
    let q = supabase.from('celulares').select('*').neq('condicion', 'consignacion');
    if (suc) q = q.eq('sucursal', suc);
    const { data } = await q;
    return (data || []).sort((a, b) => (a.modelo || '').localeCompare(b.modelo || ''));
  }

  if (categoria === 'otros') {
    const { data } = await supabase.from('otros').select('*').neq('condicion', 'consignacion');
    let items = data || [];
    if (suc) {
      items = items.filter(o =>
        suc === 'la_plata' ? (o.cantidad_la_plata || 0) > 0
        : suc === 'mitre'  ? (o.cantidad_mitre   || 0) > 0
        : true
      );
    }
    return items.sort((a, b) => (a.nombre_producto || '').localeCompare(b.nombre_producto || ''));
  }

  return [];
}

function getStockSistema(item, sucursal, categoria) {
  if (categoria === 'otros') {
    if (sucursal === 'la_plata') return item.cantidad_la_plata || 0;
    if (sucursal === 'mitre') return item.cantidad_mitre || 0;
    return (item.cantidad_la_plata || 0) + (item.cantidad_mitre || 0);
  }
  return 1;
}

function getPrecioCompra(item, categoria) {
  if (categoria === 'notebooks') return item.precio_costo_usd || 0;
  return item.precio_compra_usd || 0;
}

function getSubcategoria(item, categoria) {
  if (categoria === 'notebooks') return (item.categoria || 'GENERAL').toUpperCase();
  if (categoria === 'celulares') return (item.categoria || 'SIN CATEGORÍA').toUpperCase();
  return (item.categoria || 'OTROS').toUpperCase();
}

function buildProductoContado(item, stockContado, stockSistema, categoria, obs) {
  return {
    id:           item.id,
    nombre:       generateCopy(item) || item.modelo || item.nombre_producto || '',
    subcategoria: getSubcategoria(item, categoria),
    serial:       item.serial || '',
    stockSistema,
    stockContado: parseInt(stockContado) || 0,
    diferencia:   (parseInt(stockContado) || 0) - stockSistema,
    precioCompra: getPrecioCompra(item, categoria),
    precioVenta:  item.precio_venta_usd || 0,
    condicion:    item.condicion || '',
    observaciones: obs || '',
  };
}

// ── Componente ────────────────────────────────────────────────────────────────
const RecuentoStockSection = () => {
  const { user } = useAuthContext();

  const [vista, setVista] = useState('main'); // 'main' | 'contar' | 'historial'

  // Sesión activa
  const [sesionActual, setSesionActual] = useState(null);
  const [recuentosDeSesion, setRecuentosDeSesion] = useState([]);

  // Nueva sesión
  const [sucursalNuevaSesion, setSucursalNuevaSesion] = useState('la_plata');
  const [creandoSesion, setCreandoSesion] = useState(false);

  // Conteos previos por categoría (para mostrar en las tarjetas)
  const [conteosPrevios, setConteosPrevios] = useState({});

  // Categoría siendo contada
  const [categoriaActual, setCategoriaActual] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [conteos, setConteos] = useState({});
  const [obsItems, setObsItems] = useState({});
  const [comentariosSobrantes, setComentariosSobrantes] = useState({}); // { subcategoria: texto }
  const [busqueda, setBusqueda] = useState('');
  const [expandedCat, setExpandedCat] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Resolución de diferencias
  const [sesionResolviendo, setSesionResolviendo] = useState(null);
  const [recuentosResolviendo, setRecuentosResolviendo] = useState([]);
  const [acciones, setAcciones] = useState({}); // { "categoria-id": accion }
  const [aplicando, setAplicando] = useState(false);

  // Modal confirmación finalizar
  const [modalFinalizar, setModalFinalizar] = useState(false);

  // Historial
  const [sesiones, setSesiones] = useState([]);
  const [resumenSesiones, setResumenSesiones] = useState({});
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [sesionResumen, setSesionResumen] = useState(null);
  const [recuentosSesionResumen, setRecuentosSesionResumen] = useState([]);
  const [sesionVerResolucion, setSesionVerResolucion] = useState(null);
  const [recuentosVerResolucion, setRecuentosVerResolucion] = useState([]);

  // ── Cargar sesiones ───────────────────────────────────────────────────────
  const cargarSesiones = useCallback(async () => {
    setLoadingSesiones(true);
    try {
      const { data: sesionesData } = await supabase
        .from('recuentos_sesiones')
        .select('*')
        .order('id', { ascending: false })
        .limit(30);
      const sesionesArr = sesionesData || [];
      setSesiones(sesionesArr);

      if (sesionesArr.length > 0) {
        const ids = sesionesArr.map(s => s.id);
        const { data: recuentos } = await supabase
          .from('recuentos_stock')
          .select('sesion_id, categoria, productos_contados, diferencias_encontradas')
          .in('sesion_id', ids);

        const mapa = {};
        (recuentos || []).forEach(r => {
          if (!mapa[r.sesion_id]) mapa[r.sesion_id] = { categorias: new Set(), productos: 0, diferencias: 0 };
          mapa[r.sesion_id].categorias.add(r.categoria);
          mapa[r.sesion_id].productos += (r.productos_contados || []).length;
          mapa[r.sesion_id].diferencias += (r.diferencias_encontradas || []).length;
        });
        setResumenSesiones(mapa);
      }
    } finally {
      setLoadingSesiones(false);
    }
  }, []);

  const cargarRecuentosDeSesion = async (sesionId) => {
    const { data } = await supabase
      .from('recuentos_stock')
      .select('*')
      .eq('sesion_id', sesionId);
    setRecuentosDeSesion(data || []);
    return data || [];
  };

  const cargarConteosPrevios = async (sucursal) => {
    const suc = sucursal?.toLowerCase();
    const [{ data: notebooks }, { data: celulares }, { data: otros }] = await Promise.all([
      supabase.from('inventario').select('id').neq('condicion', 'consignacion').eq('sucursal', suc),
      supabase.from('celulares').select('id').neq('condicion', 'consignacion').eq('sucursal', suc),
      supabase.from('otros').select('cantidad_la_plata, cantidad_mitre').neq('condicion', 'consignacion'),
    ]);

    const otrosFiltrados = (otros || []).filter(o =>
      suc === 'la_plata' ? (o.cantidad_la_plata || 0) > 0
      : suc === 'mitre'  ? (o.cantidad_mitre   || 0) > 0
      : true
    );
    const unidadesOtros = otrosFiltrados.reduce((sum, o) =>
      sum + (suc === 'la_plata' ? (o.cantidad_la_plata || 0) : (o.cantidad_mitre || 0)), 0
    );

    setConteosPrevios({
      notebooks: { productos: (notebooks || []).length, unidades: (notebooks || []).length },
      celulares: { productos: (celulares || []).length, unidades: (celulares || []).length },
      otros:     { productos: otrosFiltrados.length,    unidades: unidadesOtros },
    });
  };

  useEffect(() => {
    const buscarSesionActiva = async () => {
      const usuarioActual = user?.user_metadata?.nombre || user?.user_metadata?.username || user?.email || 'usuario';
      const { data } = await supabase
        .from('recuentos_sesiones')
        .select('*')
        .eq('estado', 'en_progreso')
        .eq('usuario', usuarioActual)
        .order('id', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setSesionActual(data[0]);
        await cargarRecuentosDeSesion(data[0].id);
        await cargarConteosPrevios(data[0].sucursal);
      }
    };
    buscarSesionActiva();
    cargarSesiones();
  }, []);

  // ── Iniciar sesión ────────────────────────────────────────────────────────
  const iniciarSesion = async () => {
    setCreandoSesion(true);
    try {
      const { data, error } = await supabase
        .from('recuentos_sesiones')
        .insert([{
          sucursal: sucursalNuevaSesion,
          fecha: obtenerFechaArgentina(),
          timestamp_inicio: obtenerTimestampActual(),
          usuario: user?.user_metadata?.nombre || user?.user_metadata?.username || user?.email || 'usuario',
          estado: 'en_progreso',
        }])
        .select()
        .single();
      if (error) throw error;
      setSesionActual(data);
      setRecuentosDeSesion([]);
      await cargarConteosPrevios(data.sucursal);
    } catch (e) {
      alert('Error iniciando sesión: ' + e.message);
    } finally {
      setCreandoSesion(false);
    }
  };

  // ── Seleccionar categoría ─────────────────────────────────────────────────
  const seleccionarCategoria = async (catId) => {
    setCategoriaActual(catId);
    setConteos({});
    setObsItems({});
    setComentariosSobrantes({});
    setBusqueda('');
    setExpandedCat(null);
    setLoadingInv(true);
    setVista('contar');
    try {
      const items = await fetchInventarioPorCategoria(sesionActual.sucursal, catId);
      setInventario(items);
      const conteoInicial = {};
      items.forEach(item => {
        conteoInicial[item.id] = String(getStockSistema(item, sesionActual.sucursal, catId));
      });
      setConteos(conteoInicial);
    } finally {
      setLoadingInv(false);
    }
  };

  // ── Guardar categoría ─────────────────────────────────────────────────────
  const guardarCategoria = async () => {
    setGuardando(true);
    try {
      const productosContados = inventario.map(item => {
        const stockSistema = getStockSistema(item, sesionActual.sucursal, categoriaActual);
        const stockContado = conteos[item.id] !== undefined ? parseInt(conteos[item.id]) : stockSistema;
        return buildProductoContado(item, stockContado, stockSistema, categoriaActual, obsItems[item.id]);
      });

      const diferencias = productosContados.filter(p => p.diferencia !== 0);

      // Si ya fue contada esta categoría, reemplazar
      await supabase
        .from('recuentos_stock')
        .delete()
        .eq('sesion_id', sesionActual.id)
        .eq('categoria', categoriaActual);

      const { error } = await supabase.from('recuentos_stock').insert([{
        sesion_id:               sesionActual.id,
        sucursal:                sesionActual.sucursal,
        categoria:               categoriaActual,
        fecha_recuento:          obtenerFechaArgentina(),
        timestamp_recuento:      new Date().toISOString(),
        tipo_recuento:           'sesion',
        productos_contados:      productosContados,
        diferencias_encontradas: diferencias,
        estado:                  diferencias.length > 0 ? 'con_diferencias' : 'sin_diferencias',
        usuario_recuento:        user?.user_metadata?.nombre || user?.user_metadata?.username || user?.email || 'usuario',
        comentarios_sobrantes:   comentariosSobrantes,
      }]);

      if (error) throw error;

      const recuentosActualizados = await cargarRecuentosDeSesion(sesionActual.id);

      // Auto-finalizar si todas las categorías están contadas
      const categoriasContadas = new Set(recuentosActualizados.map(r => r.categoria));
      if (CATEGORIAS.every(c => categoriasContadas.has(c.id))) {
        await supabase
          .from('recuentos_sesiones')
          .update({ estado: 'finalizado' })
          .eq('id', sesionActual.id);
        setSesionActual(null);
        await cargarSesiones();
      }

      setVista('main');
      setCategoriaActual(null);
    } catch (e) {
      alert('Error guardando: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  // ── Finalizar manual ──────────────────────────────────────────────────────
  const handleFinalizarManual = () => {
    if (recuentosDeSesion.length === 0) {
      alert('Contá al menos una categoría antes de finalizar.');
      return;
    }
    setModalFinalizar(true);
  };

  const confirmarFinalizar = async () => {
    setModalFinalizar(false);
    await supabase
      .from('recuentos_sesiones')
      .update({ estado: 'finalizado' })
      .eq('id', sesionActual.id);
    setSesionActual(null);
    setCategoriaActual(null);
    setConteosPrevios({});
    setVista('main');
    await cargarSesiones();
  };

  // ── Cancelar sesión ───────────────────────────────────────────────────────
  const handleCancelarSesion = async () => {
    if (!window.confirm('¿Cancelar la sesión? Se eliminarán todos los datos contados hasta ahora. Esta acción no se puede deshacer.')) return;
    await supabase.from('recuentos_stock').delete().eq('sesion_id', sesionActual.id);
    await supabase.from('recuentos_sesiones').delete().eq('id', sesionActual.id);
    setSesionActual(null);
    setCategoriaActual(null);
    setRecuentosDeSesion([]);
    setConteosPrevios({});
    setVista('main');
  };

  // ── Generar PDF ───────────────────────────────────────────────────────────
  const generarPDF = async (sesion) => {
    setGenerandoPDF(sesion.id);
    try {
      const { data: recuentos } = await supabase
        .from('recuentos_stock')
        .select('*')
        .eq('sesion_id', sesion.id);
      if (!recuentos || recuentos.length === 0) {
        alert('Esta sesión no tiene categorías contadas.');
        return;
      }
      await generarRecuentoSesionPDF(sesion, recuentos);
    } catch (e) {
      alert('Error generando PDF: ' + e.message);
    } finally {
      setGenerandoPDF(null);
    }
  };

  // ── Resolver diferencias ──────────────────────────────────────────────────
  const abrirResolucion = async (sesion) => {
    const { data } = await supabase
      .from('recuentos_stock')
      .select('*')
      .eq('sesion_id', sesion.id);
    const recuentos = data || [];
    const accionesIniciales = {};
    recuentos.forEach(r => {
      (r.diferencias_encontradas || []).forEach(d => {
        const key = `${r.categoria}-${d.id}`;
          accionesIniciales[key] = 'ninguna';
      });
    });
    setRecuentosResolviendo(recuentos);
    setAcciones(accionesIniciales);
    setSesionResolviendo(sesion);
  };

  const aplicarResoluciones = async () => {
    setAplicando(true);
    try {
      for (const recuento of recuentosResolviendo) {
        if ((recuento.diferencias_encontradas || []).length === 0) continue;
        const resolucionesRecuento = {};

        for (const d of recuento.diferencias_encontradas) {
          const key = `${recuento.categoria}-${d.id}`;
          const accion = acciones[key];
          resolucionesRecuento[d.id] = { accion, nombre: d.nombre };

          if (recuento.categoria === 'notebooks' && accion === 'perdido') {
            await supabase.from('inventario').update({ condicion: 'perdido' }).eq('id', d.id);
          } else if (recuento.categoria === 'celulares' && accion === 'perdido') {
            await supabase.from('celulares').update({ condicion: 'perdido' }).eq('id', d.id);
          } else if (recuento.categoria === 'otros') {
            const sucursal = sesionResolviendo.sucursal;
            const colActual = sucursal === 'la_plata' ? 'cantidad_la_plata' : 'cantidad_mitre';
            const colOtra   = sucursal === 'la_plata' ? 'cantidad_mitre' : 'cantidad_la_plata';
            const { data: item } = await supabase.from('otros').select('cantidad_la_plata, cantidad_mitre').eq('id', d.id).single();
            if (!item) continue;

            if (accion === 'descontar' || accion === 'ajustar') {
              await supabase.from('otros').update({ [colActual]: d.stockContado }).eq('id', d.id);
            } else if (accion === 'pasar_sucursal') {
              const nuevaActual = Math.max(0, (item[colActual] || 0) + d.diferencia);
              const nuevaOtra   = (item[colOtra] || 0) + Math.abs(d.diferencia);
              await supabase.from('otros').update({ [colActual]: nuevaActual, [colOtra]: nuevaOtra }).eq('id', d.id);
            }
            // 'perdido' en otros: sin cambio en stock
          }
        }

        await supabase.from('recuentos_stock')
          .update({ resoluciones: resolucionesRecuento })
          .eq('id', recuento.id);
      }

      await supabase.from('recuentos_sesiones').update({ resuelta: true }).eq('id', sesionResolviendo.id);
      setSesionResolviendo(null);
      setRecuentosResolviendo([]);
      setAcciones({});
      await cargarSesiones();
    } catch (e) {
      alert('Error aplicando resoluciones: ' + e.message);
    } finally {
      setAplicando(false);
    }
  };

  // ── Ver resolución ────────────────────────────────────────────────────────
  const abrirVerResolucion = async (sesion) => {
    const { data } = await supabase
      .from('recuentos_stock')
      .select('*')
      .eq('sesion_id', sesion.id);
    setRecuentosVerResolucion(data || []);
    setSesionVerResolucion(sesion);
  };

  // ── Eliminar sesión ───────────────────────────────────────────────────────
  const eliminarSesion = async () => {
    if (!confirmEliminar) return;
    setEliminando(true);
    try {
      await supabase.from('recuentos_stock').delete().eq('sesion_id', confirmEliminar.id);
      await supabase.from('recuentos_sesiones').delete().eq('id', confirmEliminar.id);
      setConfirmEliminar(null);
      await cargarSesiones();
    } catch (e) {
      alert('Error eliminando: ' + e.message);
    } finally {
      setEliminando(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const categoriasContadas = new Set(recuentosDeSesion.map(r => r.categoria));

  const inventarioFiltrado = busqueda.trim()
    ? inventario.filter(item => {
        const txt = [item.modelo, item.nombre_producto, item.marca, item.procesador, item.capacidad, item.color]
          .filter(Boolean).join(' ').toLowerCase();
        return txt.includes(busqueda.toLowerCase());
      })
    : inventario;

  const inventarioAgrupado = inventarioFiltrado.reduce((acc, item) => {
    const sub = getSubcategoria(item, categoriaActual);
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(item);
    return acc;
  }, {});

  // ── Vista: contar categoría ───────────────────────────────────────────────
  if (vista === 'contar' && categoriaActual) {
    const catInfo = CATEGORIAS.find(c => c.id === categoriaActual);
    const Icon = catInfo?.icon || Box;
    const totalDifs = inventario.reduce((sum, item) => {
      const cont = parseInt(conteos[item.id]);
      const sis = getStockSistema(item, sesionActual?.sucursal, categoriaActual);
      return sum + (isNaN(cont) ? 0 : Math.abs(cont - sis));
    }, 0);

    return (
      <div>
        {/* Header */}
        <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon size={22} />
            <div>
              <h2 className="text-lg font-semibold">{catInfo?.label} — {SUCURSAL_LABELS[sesionActual?.sucursal]}</h2>
              <p className="text-slate-300 text-xs">{inventario.length} productos · {totalDifs} diferencias</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded px-3 py-1.5 text-sm w-48"
            />
            <button
              onClick={guardarCategoria}
              disabled={guardando}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {guardando ? 'Guardando...' : 'Guardar categoría'}
            </button>
            <button
              onClick={() => { setVista('main'); setCategoriaActual(null); }}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {loadingInv ? (
          <div className="p-12 text-center text-slate-500">Cargando inventario...</div>
        ) : inventario.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No hay productos en esta categoría para esta sucursal.</div>
        ) : (
          <div className="border border-slate-200">
            {Object.entries(inventarioAgrupado).sort(([a],[b]) => a.localeCompare(b)).map(([sub, items]) => {
              const isOpen = expandedCat === sub;
              const subDifs = items.filter(i => {
                const cont = parseInt(conteos[i.id]);
                const sis = getStockSistema(i, sesionActual?.sucursal, categoriaActual);
                return !isNaN(cont) && cont !== sis;
              }).length;
              return (
                <div key={sub} className="mt-2">
                  <button
                    onClick={() => setExpandedCat(isOpen ? null : sub)}
                    className="w-full px-6 py-4 bg-slate-700 border-l-4 border-l-slate-400 text-white flex justify-between items-center hover:bg-slate-600 transition-colors"
                  >
                    <span className="text-sm font-semibold uppercase tracking-wide">{formatCategoriaNombre(sub, categoriaActual)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-slate-500 px-2 py-0.5 rounded">{items.length} productos</span>
                      {subDifs > 0 && <span className="text-xs bg-amber-500 px-2 py-0.5 rounded">{subDifs} diferencias</span>}
                      {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>
                  </button>

                  {isOpen && (
                    <>
                    <table className="w-full">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Producto</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-600 uppercase w-36">Serial</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-600 uppercase w-24">Stock</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-600 uppercase w-32">Recuento</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-600 uppercase w-20">Diferencia</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-600 uppercase">Observaciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => {
                          const sis = getStockSistema(item, sesionActual?.sucursal, categoriaActual);
                          const cont = parseInt(conteos[item.id]);
                          const dif = isNaN(cont) ? null : cont - sis;
                          const rowBg = dif === null ? (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50')
                            : dif === 0 ? 'bg-emerald-50' : dif < 0 ? 'bg-red-50' : 'bg-amber-50';
                          return (
                            <tr key={item.id} className={rowBg}>
                              <td className="px-4 py-2 text-sm text-slate-800">
                                <div className="font-medium">{item.modelo || item.nombre_producto}</div>
                                <div className="text-xs text-slate-500">{generateCopy(item)}</div>
                              </td>
                              <td className="px-4 py-2 text-center text-xs text-slate-500 font-mono">{item.serial || '—'}</td>
                              <td className="px-4 py-2 text-center text-sm text-slate-600">{sis}</td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={conteos[item.id] ?? ''}
                                  onChange={e => setConteos(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  className="w-24 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 text-center"
                                />
                              </td>
                              <td className="px-4 py-2 text-center text-sm font-semibold">
                                {dif === null ? '—'
                                  : dif === 0 ? <span className="text-emerald-600">✓</span>
                                  : <span className={dif < 0 ? 'text-red-600' : 'text-amber-600'}>{dif > 0 ? `+${dif}` : dif}</span>}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="text"
                                  value={obsItems[item.id] || ''}
                                  onChange={e => setObsItems(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  placeholder="Nota opcional..."
                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-slate-400"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center gap-3">
                      <span className="text-xs text-slate-500 shrink-0">Sobrantes / items de más:</span>
                      <input
                        type="text"
                        value={comentariosSobrantes[sub] || ''}
                        onChange={e => setComentariosSobrantes(prev => ({ ...prev, [sub]: e.target.value }))}
                        placeholder="Anotá acá si hay productos físicos que no están en el sistema..."
                        className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Modal finalizar ───────────────────────────────────────────────────────
  const ModalFinalizar = () => {
    const totalProductos = recuentosDeSesion.reduce((sum, r) => sum + (r.productos_contados || []).length, 0);
    const totalDiferencias = recuentosDeSesion.reduce((sum, r) => sum + (r.diferencias_encontradas || []).length, 0);
    const categoriasFaltantes = CATEGORIAS.filter(c => !categoriasContadas.has(c.id));

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded border border-slate-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header modal */}
          <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StopCircle size={22} />
              <h3 className="text-lg font-semibold">Finalizar sesión de recuento</h3>
            </div>
            <button onClick={() => setModalFinalizar(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Info sesión */}
            <div className="bg-slate-50 border border-slate-200 rounded p-4 grid grid-cols-3 text-sm text-center">
              <div>
                <p className="text-slate-500 text-xs uppercase font-medium mb-0.5">Sucursal</p>
                <p className="font-semibold text-slate-800">{SUCURSAL_LABELS[sesionActual?.sucursal]}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase font-medium mb-0.5">Fecha y hora</p>
                <p className="font-semibold text-slate-800">
                  {sesionActual?.timestamp_inicio ? formatearTimestampDisplay(sesionActual.timestamp_inicio) : sesionActual?.fecha}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase font-medium mb-0.5">Usuario</p>
                <p className="font-semibold text-slate-800">{sesionActual?.usuario}</p>
              </div>
            </div>

            {/* Resumen por categoría */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Resumen por categoría</h4>
              <table className="w-full">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Categoría</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Productos</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Sin diferencias</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Con diferencias</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {CATEGORIAS.map((cat, idx) => {
                    const rec = recuentosDeSesion.find(r => r.categoria === cat.id);
                    if (!rec) {
                      return (
                        <tr key={cat.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-4 py-2 text-sm text-slate-800 font-medium text-center">{cat.label}</td>
                          <td className="px-4 py-2 text-center text-sm text-slate-400" colSpan={3}>—</td>
                          <td className="px-4 py-2 text-center">
                            <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Sin contar</span>
                          </td>
                        </tr>
                      );
                    }
                    const contados = (rec.productos_contados || []).length;
                    const difs = (rec.diferencias_encontradas || []).length;
                    return (
                      <tr key={cat.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-2 text-sm text-slate-800 font-medium text-center">{cat.label}</td>
                        <td className="px-4 py-2 text-center text-sm text-slate-700">{contados}</td>
                        <td className="px-4 py-2 text-center text-sm text-emerald-700 font-medium">{contados - difs}</td>
                        <td className="px-4 py-2 text-center text-sm font-medium">
                          {difs > 0 ? <span className="text-amber-600">{difs}</span> : <span className="text-emerald-600">0</span>}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {difs > 0
                            ? <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded"><AlertTriangle size={10}/>Con diferencias</span>
                            : <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded"><CheckCircle size={10}/>OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-800 text-white">
                  <tr>
                    <td className="px-4 py-2 text-sm font-semibold">TOTALES</td>
                    <td className="px-4 py-2 text-center text-sm font-semibold">{totalProductos}</td>
                    <td className="px-4 py-2 text-center text-sm font-semibold">{totalProductos - totalDiferencias}</td>
                    <td className="px-4 py-2 text-center text-sm font-semibold">{totalDiferencias}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Aviso categorías sin contar */}
            {categoriasFaltantes.length > 0 && (
              <div className="bg-slate-100 border border-slate-200 rounded p-3">
                <p className="text-sm text-slate-600 text-center">
                  Las siguientes categorías no fueron contadas:{' '}
                  <span className="font-medium text-slate-700">{categoriasFaltantes.map(c => c.label).join(', ')}</span>.
                  Podés finalizar igual, pero quedarán sin registrar.
                </p>
              </div>
            )}

            {/* Diferencias detalle */}
            {totalDiferencias > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Diferencias detectadas ({totalDiferencias})
                </h4>
                <div className="border border-slate-200 rounded overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800 text-white sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase">Categoría</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase">Producto</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Sis.</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Cont.</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase">Dif.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {recuentosDeSesion.flatMap(r =>
                        (r.diferencias_encontradas || []).map((d, idx) => (
                          <tr key={`${r.categoria}-${idx}`} className={d.diferencia < 0 ? 'bg-red-50' : 'bg-amber-50'}>
                            <td className="px-3 py-1.5 text-xs text-slate-600 uppercase">{r.categoria}</td>
                            <td className="px-3 py-1.5 text-sm text-slate-800">{d.nombre}</td>
                            <td className="px-3 py-1.5 text-center text-sm text-slate-600">{d.stockSistema}</td>
                            <td className="px-3 py-1.5 text-center text-sm font-medium text-slate-800">{d.stockContado}</td>
                            <td className="px-3 py-1.5 text-center text-sm font-bold">
                              <span className={d.diferencia < 0 ? 'text-red-600' : 'text-amber-600'}>
                                {d.diferencia > 0 ? `+${d.diferencia}` : d.diferencia}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                onClick={() => setModalFinalizar(false)}
                className="px-5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarFinalizar}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <CheckCircle size={16} />
                Confirmar y finalizar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <div className="space-y-0">
      {/* Modal finalizar */}
      {modalFinalizar && <ModalFinalizar />}

      {/* Modal ver resumen de sesión del historial */}
      {sesionResumen && (() => {
        const totalProductos = recuentosSesionResumen.reduce((s, r) => s + (r.productos_contados || []).length, 0);
        const totalDiferencias = recuentosSesionResumen.reduce((s, r) => s + (r.diferencias_encontradas || []).length, 0);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded border border-slate-200 w-full max-w-xl mx-4">
              <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye size={20} />
                  <div>
                    <h3 className="text-base font-semibold">Resumen del recuento</h3>
                    <p className="text-slate-300 text-xs">{SUCURSAL_LABELS[sesionResumen.sucursal]} · {sesionResumen.timestamp_inicio ? formatearTimestampDisplay(sesionResumen.timestamp_inicio).split(' ')[0].replace(/\//g, '-') : sesionResumen.fecha}</p>
                  </div>
                </div>
                <button onClick={() => setSesionResumen(null)} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded p-4 grid grid-cols-3 text-sm text-center">
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-medium mb-0.5">Usuario</p>
                    <p className="font-semibold text-slate-800">{sesionResumen.usuario?.split('@')[0] || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-medium mb-0.5">Productos</p>
                    <p className="font-semibold text-slate-800">{totalProductos}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-medium mb-0.5">Diferencias</p>
                    <p className={`font-semibold ${totalDiferencias > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{totalDiferencias}</p>
                  </div>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Categoría</th>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Productos</th>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Diferencias</th>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {CATEGORIAS.map((cat, idx) => {
                      const rec = recuentosSesionResumen.find(r => r.categoria === cat.id);
                      const contados = rec ? (rec.productos_contados || []).length : null;
                      const difs = rec ? (rec.diferencias_encontradas || []).length : null;
                      return (
                        <tr key={cat.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-4 py-2 text-sm text-slate-800 font-medium text-center">{cat.label}</td>
                          <td className="px-4 py-2 text-center text-sm text-slate-600">{contados ?? '—'}</td>
                          <td className="px-4 py-2 text-center text-sm font-medium">
                            {difs === null ? <span className="text-slate-400">—</span>
                              : difs > 0 ? <span className="text-amber-600">{difs}</span>
                              : <span className="text-emerald-600">0</span>}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {rec
                              ? difs > 0
                                ? <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded"><AlertTriangle size={10}/>Con diferencias</span>
                                : <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded"><CheckCircle size={10}/>OK</span>
                              : <span className="text-xs text-slate-400">Sin contar</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-800 text-white">
                    <tr>
                      <td className="px-4 py-2 text-sm font-semibold text-center">TOTALES</td>
                      <td className="px-4 py-2 text-sm font-semibold text-center">{totalProductos}</td>
                      <td className="px-4 py-2 text-sm font-semibold text-center">{totalDiferencias}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
                <div className="flex justify-end pt-1">
                  <button onClick={() => setSesionResumen(null)} className="px-5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors">Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal ver resolución */}
      {sesionVerResolucion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded border border-slate-200 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <ClipboardList size={20} />
                <div>
                  <h3 className="text-base font-semibold">Resolución de diferencias</h3>
                  <p className="text-slate-300 text-xs">{SUCURSAL_LABELS[sesionVerResolucion.sucursal]} · {sesionVerResolucion.timestamp_inicio ? formatearTimestampDisplay(sesionVerResolucion.timestamp_inicio).split(' ')[0].replace(/\//g, '-') : sesionVerResolucion.fecha}</p>
                </div>
              </div>
              <button onClick={() => setSesionVerResolucion(null)} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {recuentosVerResolucion.filter(r => Object.keys(r.resoluciones || {}).length > 0).length === 0 ? (
                <p className="text-center text-slate-500 text-sm">No hay resoluciones registradas.</p>
              ) : recuentosVerResolucion.filter(r => Object.keys(r.resoluciones || {}).length > 0).map(recuento => {
                const ACCION_LABELS = {
                  perdido: 'Marcado como perdido',
                  descontar: 'Stock descontado',
                  pasar_sucursal: 'Pasado a otra sucursal',
                  ajustar: 'Stock ajustado',
                  ninguna: 'Sin acción',
                };
                const resoluciones = recuento.resoluciones || {};
                return (
                  <div key={recuento.id}>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{recuento.categoria}</h4>
                    <table className="w-full">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                          <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider">Acción tomada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {Object.entries(resoluciones).map(([id, res], idx) => (
                          <tr key={id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 text-sm text-slate-800">{res.nombre}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                res.accion === 'perdido'        ? 'bg-red-100 text-red-700' :
                                res.accion === 'descontar'      ? 'bg-slate-100 text-slate-700' :
                                res.accion === 'pasar_sucursal' ? 'bg-blue-100 text-blue-700' :
                                res.accion === 'ajustar'        ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-100 text-slate-400'
                              }`}>
                                {ACCION_LABELS[res.accion] || res.accion}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSesionVerResolucion(null)} className="px-5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal resolver diferencias */}
      {sesionResolviendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded border border-slate-200 w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} />
                <div>
                  <h3 className="text-base font-semibold">Resolver diferencias</h3>
                  <p className="text-slate-300 text-xs">{SUCURSAL_LABELS[sesionResolviendo.sucursal]} · {sesionResolviendo.fecha}</p>
                </div>
              </div>
              <button onClick={() => setSesionResolviendo(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {recuentosResolviendo.filter(r => (r.diferencias_encontradas || []).length > 0).map(recuento => (
                <div key={recuento.id}>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {recuento.categoria}
                  </h4>
                  <table className="w-full">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider w-16">Sis.</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider w-16">Cont.</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider w-16">Dif.</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(recuento.diferencias_encontradas || []).map((d, idx) => {
                        const key = `${recuento.categoria}-${d.id}`;
                        const esOtros = recuento.categoria === 'otros';
                        const opciones = d.diferencia > 0
                          ? [
                              { value: 'ninguna', label: 'No hacer nada' },
                              { value: 'ajustar', label: 'Ajustar stock' },
                            ]
                          : esOtros
                            ? [
                                { value: 'ninguna',        label: 'No hacer nada' },
                                { value: 'descontar',      label: 'Descontar' },
                                { value: 'pasar_sucursal', label: 'Pasar a otra sucursal' },
                                { value: 'perdido',        label: 'Marcar como perdido' },
                              ]
                            : [
                                { value: 'ninguna', label: 'No hacer nada' },
                                { value: 'perdido', label: 'Marcar como perdido' },
                              ];
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-3 py-2 text-sm text-slate-800">{d.nombre}</td>
                            <td className="px-3 py-2 text-center text-sm text-slate-600">{d.stockSistema}</td>
                            <td className="px-3 py-2 text-center text-sm text-slate-800 font-medium">{d.stockContado}</td>
                            <td className="px-3 py-2 text-center text-sm font-bold">
                              <span className={d.diferencia < 0 ? 'text-red-600' : 'text-amber-600'}>
                                {d.diferencia > 0 ? `+${d.diferencia}` : d.diferencia}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <select
                                value={acciones[key] || ''}
                                onChange={e => setAcciones(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-44 border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-500"
                              >
                                {opciones.map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setSesionResolviendo(null)}
                className="px-5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={aplicarResoluciones}
                disabled={aplicando}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <CheckCircle size={16} />
                {aplicando ? 'Aplicando...' : 'Aplicar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded border border-slate-200 w-full max-w-md mx-4">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Eliminar recuento</h3>
              <button onClick={() => setConfirmEliminar(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700">
                ¿Estás seguro de que querés eliminar el recuento del{' '}
                <span className="font-semibold">
                  {confirmEliminar.timestamp_inicio
                    ? formatearTimestampDisplay(confirmEliminar.timestamp_inicio).split(' ')[0].replace(/\//g, '-')
                    : confirmEliminar.fecha?.split('-').reverse().join('-')}
                </span>{' '}
                de <span className="font-semibold">{SUCURSAL_LABELS[confirmEliminar.sucursal]}</span>,{' '}
                realizado por <span className="font-semibold">{confirmEliminar.usuario?.split('@')[0] || '—'}</span>?
              </p>
              <p className="text-xs text-slate-500">Esta acción no se puede deshacer. Se eliminarán también todos los datos contados de esa sesión.</p>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setConfirmEliminar(null)}
                  disabled={eliminando}
                  className="px-5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarSesion}
                  disabled={eliminando}
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <X size={15} />
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Calculator size={28} />
              <div>
                <h2 className="text-2xl font-semibold">Recuento de Stock</h2>
                <p className="text-slate-300 mt-1">Conteo físico de inventario por sucursal</p>
              </div>
            </div>
            <button
              onClick={() => { setVista(vista === 'historial' ? 'main' : 'historial'); cargarSesiones(); }}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-colors"
            >
              <History size={16} />
              Historial
            </button>
          </div>
        </div>
      </div>

      {/* Historial */}
      {vista === 'historial' && (
        <div className="border border-slate-200 bg-white">
          {loadingSesiones ? (
            <div className="p-8 text-center text-slate-500">Cargando...</div>
          ) : sesiones.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No hay sesiones registradas.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Sucursal</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Resumen</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sesiones.map((s, idx) => (
                  <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 text-sm text-slate-800 text-center">
                      {s.timestamp_inicio
                        ? formatearTimestampDisplay(s.timestamp_inicio).split(' ')[0].replace(/\//g, '-')
                        : s.fecha?.split('-').reverse().join('-')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 text-center">{SUCURSAL_LABELS[s.sucursal] || s.sucursal}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 text-center">
                      {resumenSesiones[s.id] ? (() => {
                        const r = resumenSesiones[s.id];
                        const cats = r.categorias.size;
                        return (
                          <span>
                            <span className={cats === CATEGORIAS.length ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                              {cats}/{CATEGORIAS.length} categorías
                            </span>
                            {' · '}
                            <span>{r.productos} productos</span>
                            {r.diferencias > 0 && (
                              <>{' · '}<span className="text-amber-600">{r.diferencias} diferencias</span></>
                            )}
                          </span>
                        );
                      })() : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.estado === 'finalizado'
                        ? <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded"><CheckCircle size={12}/>Finalizado</span>
                        : <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded"><Clock size={12}/>En progreso</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {/* Ver resumen */}
                        <button
                          onClick={async () => {
                            const { data } = await supabase.from('recuentos_stock').select('*').eq('sesion_id', s.id);
                            setRecuentosSesionResumen(data || []);
                            setSesionResumen(s);
                          }}
                          className="text-slate-400 hover:text-slate-700 transition-colors"
                          title="Ver resumen"
                        >
                          <Eye size={16} />
                        </button>

                        {/* PDF */}
                        <button
                          onClick={() => generarPDF(s)}
                          disabled={generandoPDF === s.id}
                          className="text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-30"
                          title="Generar PDF"
                        >
                          <FileText size={16} />
                        </button>

                        {/* Resolver / Ver resolución */}
                        {s.estado === 'finalizado' && resumenSesiones[s.id]?.diferencias > 0 && !s.resuelta && (
                          <button
                            onClick={() => abrirResolucion(s)}
                            className="text-amber-500 hover:text-amber-700 transition-colors"
                            title="Resolver diferencias"
                          >
                            <Wrench size={16} />
                          </button>
                        )}
                        {s.resuelta && (
                          <button
                            onClick={() => abrirVerResolucion(s)}
                            className="text-emerald-600 hover:text-emerald-800 transition-colors"
                            title="Ver resolución"
                          >
                            <ClipboardList size={16} />
                          </button>
                        )}

                        {/* Eliminar */}
                        <button
                          onClick={() => setConfirmEliminar(s)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-center">
                      {s.usuario ? s.usuario.split('@')[0] : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Sin sesión activa */}
      {vista === 'main' && !sesionActual && (
        <div className="border border-slate-200 bg-white p-10">
          <div className="max-w-md mx-auto text-center">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Sin sesión activa</h3>
            <p className="text-slate-500 text-sm mb-6">Iniciá una nueva sesión para comenzar el recuento de una sucursal.</p>
            <div className="flex items-center gap-3 justify-center">
              <select
                value={sucursalNuevaSesion}
                onChange={e => setSucursalNuevaSesion(e.target.value)}
                className="border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {SUCURSALES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button
                onClick={iniciarSesion}
                disabled={creandoSesion}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
              >
                <Play size={16} />
                {creandoSesion ? 'Iniciando...' : 'Nueva sesión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sesión activa */}
      {vista === 'main' && sesionActual && (
        <div className="space-y-4 p-4">
          {/* Info sesión */}
          <div className="border border-emerald-200 bg-emerald-50 p-4 rounded flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="font-semibold text-emerald-800">
                  Sesión activa — {SUCURSAL_LABELS[sesionActual.sucursal]}
                </p>
                <p className="text-emerald-600 text-xs">
                  {sesionActual.fecha} · {sesionActual.usuario}
                  {' · '}
                  {categoriasContadas.size}/{CATEGORIAS.length} categorías contadas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelarSesion}
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <X size={16} />
                Cancelar sesión
              </button>
              <button
                onClick={handleFinalizarManual}
                className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <StopCircle size={16} />
                Finalizar sesión
              </button>
            </div>
          </div>

          {/* Selector de categorías */}
          <div className="border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Seleccioná una categoría para contar</h3>
            <div className="grid grid-cols-3 gap-4">
              {CATEGORIAS.map(cat => {
                const Icon = cat.icon;
                const contada = categoriasContadas.has(cat.id);
                const rec = recuentosDeSesion.find(r => r.categoria === cat.id);
                const difCount = rec ? (rec.diferencias_encontradas || []).length : 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => seleccionarCategoria(cat.id)}
                    className={`p-5 rounded border-2 text-center transition-all ${
                      contada
                        ? 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100'
                        : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2 mb-3">
                      <Icon size={28} className={contada ? 'text-emerald-600' : 'text-slate-400'} />
                      <p className={`font-semibold text-sm ${contada ? 'text-emerald-800' : 'text-slate-700'}`}>
                        {cat.label}
                      </p>
                    </div>
                    {contada ? (
                      <div className="space-y-0.5">
                        <p className="text-xs text-emerald-600 font-medium">
                          {(rec?.productos_contados || []).length} productos contados
                        </p>
                        {difCount > 0 && <p className="text-xs text-amber-600">· {difCount} diferencias</p>}
                        <p className="text-xs text-slate-400">Clic para recontar</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {conteosPrevios[cat.id] ? (
                          <>
                            <p className="text-xs text-slate-600">{conteosPrevios[cat.id].productos} productos</p>
                            <p className="text-xs text-slate-400">{conteosPrevios[cat.id].unidades} unidades</p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400">Sin contar</p>
                        )}
                      </div>
                    )}
                    {contada && <CheckCircle size={14} className="text-emerald-500 mx-auto mt-2" />}
                  </button>
                );
              })}
            </div>

            {categoriasContadas.size === CATEGORIAS.length && (
              <div className="mt-4 p-3 bg-emerald-100 border border-emerald-300 rounded flex items-center gap-2 text-emerald-800 text-sm font-medium">
                <CheckCircle size={16} />
                ¡Todas las categorías contadas! La sesión se finalizó automáticamente.
              </div>
            )}
          </div>

          {/* Resumen diferencias */}
          {recuentosDeSesion.some(r => (r.diferencias_encontradas || []).length > 0) && (
            <div className="border border-slate-200 bg-white">
              <div className="px-4 py-3 bg-amber-600 text-white flex items-center gap-2">
                <AlertTriangle size={16} />
                <span className="font-semibold text-sm">Diferencias encontradas en esta sesión</span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase">Categoría</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase">Producto</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase">Sis.</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase">Cont.</th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase">Dif.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recuentosDeSesion.flatMap(r =>
                    (r.diferencias_encontradas || []).map((d, idx) => (
                      <tr key={`${r.categoria}-${idx}`} className={d.diferencia < 0 ? 'bg-red-50' : 'bg-amber-50'}>
                        <td className="px-4 py-2 text-xs text-slate-600 uppercase">{r.categoria}</td>
                        <td className="px-4 py-2 text-sm text-slate-800">{d.nombre}</td>
                        <td className="px-4 py-2 text-center text-sm text-slate-600">{d.stockSistema}</td>
                        <td className="px-4 py-2 text-center text-sm font-medium text-slate-800">{d.stockContado}</td>
                        <td className="px-4 py-2 text-center text-sm font-bold">
                          <span className={d.diferencia < 0 ? 'text-red-600' : 'text-amber-600'}>
                            {d.diferencia > 0 ? `+${d.diferencia}` : d.diferencia}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecuentoStockSection;
