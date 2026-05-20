import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, Upload, RefreshCw, Search, X, Copy, Check, Globe } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { supabase } from '../../../lib/supabase';

const fmtTimestamp = (ts) => {
  if (!ts) return null;
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const fmtUSD = (n) =>
  'U$ ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtUSDCopy = (n) =>
  'U$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const CONDICION_COLORS = {
  'New':                               'bg-emerald-100 text-emerald-800',
  'New Factory Sealed':                'bg-blue-100 text-blue-800',
  'Factory Refurbished':               'bg-amber-100 text-amber-800',
  '3rd Party Refurbished':             'bg-orange-100 text-orange-800',
  'Refurbished - Off Lease':           'bg-purple-100 text-purple-800',
  'Renewed Grade B':                   'bg-slate-200 text-slate-700',
  'Apple Direct As Is':                'bg-red-100 text-red-800',
  'Apple Certified Pre Owned':         'bg-indigo-100 text-indigo-800',
  'Factory Refurbished Scratch & Dent':'bg-yellow-100 text-yellow-800',
};

const getCondicionColor = (c) => CONDICION_COLORS[c] || 'bg-slate-100 text-slate-700';

const CatalogoProveedorSection = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtraMarca, setFiltraMarca] = useState('');
  const [filtroCondicion, setFiltroCondicion] = useState('');
  const [ordenPrecio, setOrdenPrecio] = useState('');
  const [margen, setMargen] = useState('100');
  const [costoFinanciero, setCostoFinanciero] = useState('3');
  const [envio, setEnvio] = useState('120');
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [copiado, setCopiado] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProductos = async () => {
    setLoading(true);
    const pageSize = 1000;
    let all = [];
    let from = 0;
    let done = false;

    while (!done) {
      const { data, error } = await supabase
        .from('catalogo_proveedor')
        .select('*')
        .order('marca', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) { setLoading(false); return; }
      all = [...all, ...(data || [])];
      if (!data || data.length < pageSize) done = true;
      else from += pageSize;
    }

    setProductos(all);

    const { data: maxRow } = await supabase
      .from('catalogo_proveedor')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    setUltimaActualizacion(maxRow?.updated_at || null);

    setLoading(false);
  };

  useEffect(() => { fetchProductos(); }, []);

  const parseExcel = (buffer) => {
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const result = [];
    let condicionActual = 'Unknown';

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const col0 = row[0];
      const col1 = row[1];
      const col3 = row[3];
      const col4 = row[4];

      const esHeader = (col0 === null || col0 === undefined || col0 === '') &&
        col1 && typeof col1 === 'string' && col1.trim() !== '';

      if (esHeader) { condicionActual = col1.trim(); continue; }

      if (col0 && col1 && typeof col1 === 'string' && col4 !== undefined && col4 !== null && col4 !== '') {
        const precio = parseFloat(col4);
        if (isNaN(precio) || precio <= 0) continue;
        const nombreProducto = col1.trim();
        result.push({
          producto: nombreProducto,
          marca: nombreProducto.split(/\s+/)[0],
          condicion: condicionActual,
          precio,
          stock: parseInt(col3) || 0,
        });
      }
    }
    return result;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    setUploadMsg('');

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcel(buffer);

      if (parsed.length === 0) {
        setUploadMsg('No se encontraron productos en el archivo.');
        setUploading(false);
        return;
      }

      const { error: delError } = await supabase
        .from('catalogo_proveedor')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (delError) throw delError;

      const batchSize = 500;
      for (let i = 0; i < parsed.length; i += batchSize) {
        const { error: insError } = await supabase
          .from('catalogo_proveedor')
          .insert(parsed.slice(i, i + batchSize));
        if (insError) throw insError;
      }

      setUploadMsg(`✓ ${parsed.length} productos importados correctamente.`);
      setSeleccionados(new Set());
      await fetchProductos();
    } catch (err) {
      setUploadMsg(`Error al importar: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const marcasUnicas = useMemo(() => [...new Set(productos.map(p => p.marca))].sort(), [productos]);
  const condicionesUnicas = useMemo(() => [...new Set(productos.map(p => p.condicion))].sort(), [productos]);

  const productosFiltrados = useMemo(() => {
    let lista = productos;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(p =>
        p.producto.toLowerCase().includes(q) ||
        p.marca.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    if (filtraMarca) lista = lista.filter(p => p.marca === filtraMarca);
    if (filtroCondicion) lista = lista.filter(p => p.condicion === filtroCondicion);
    if (ordenPrecio === 'asc') lista = [...lista].sort((a, b) => a.precio - b.precio);
    if (ordenPrecio === 'desc') lista = [...lista].sort((a, b) => b.precio - a.precio);
    return lista;
  }, [productos, busqueda, filtraMarca, filtroCondicion, ordenPrecio]);

  const margenN = parseFloat(margen) || 0;
  const costoFinancieroN = parseFloat(costoFinanciero) || 0;
  const envioN = parseFloat(envio) || 0;

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltraMarca('');
    setFiltroCondicion('');
    setOrdenPrecio('');
  };

  // Selección
  const todosSeleccionados = productosFiltrados.length > 0 &&
    productosFiltrados.every(p => seleccionados.has(p.id));

  const toggleTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados(prev => {
        const next = new Set(prev);
        productosFiltrados.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSeleccionados(prev => {
        const next = new Set(prev);
        productosFiltrados.forEach(p => next.add(p.id));
        return next;
      });
    }
  };

  const toggleItem = (id) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const itemsSeleccionados = useMemo(
    () => productosFiltrados.filter(p => seleccionados.has(p.id)),
    [productosFiltrados, seleccionados]
  );

  const copiarLista = () => {
    const texto = itemsSeleccionados
      .map(p => {
        const pCompra = p.precio * (1 + costoFinancieroN / 100) + envioN;
        return `💻 ${p.producto} - ${fmtUSDCopy(pCompra + margenN)}`;
      })
      .join('\n');
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-slate-800 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FileText size={28} />
            <div>
              <h2 className="text-2xl font-semibold">HUBX</h2>
              <p className="text-slate-300 mt-1">
                Lista de precios HUBX
                {ultimaActualizacion && (
                  <span className="ml-2 text-slate-400 text-xs">
                    — Actualizado: {fmtTimestamp(ultimaActualizacion)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
            >
              <Upload size={18} />
              {uploading ? 'Importando...' : 'Subir Excel'}
            </button>
            <button
              onClick={fetchProductos}
              disabled={loading}
              className="bg-slate-600 text-white px-4 py-3 rounded hover:bg-slate-500 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
          </div>
        </div>
      </div>

      {/* Mensaje de upload */}
      {uploadMsg && (
        <div className={`px-6 py-3 text-sm font-medium border-b text-center ${uploadMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {uploadMsg}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-gray-50 p-4 border-b border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">Buscar</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Producto..."
                className="w-full h-9 border border-slate-200 rounded pl-8 pr-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">Marca</label>
            <select value={filtraMarca} onChange={e => setFiltraMarca(e.target.value)}
              className="w-full h-9 border border-slate-200 rounded px-3 py-2 text-sm">
              <option value="">Todas</option>
              {marcasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">Condición</label>
            <select value={filtroCondicion} onChange={e => setFiltroCondicion(e.target.value)}
              className="w-full h-9 border border-slate-200 rounded px-3 py-2 text-sm">
              <option value="">Todas</option>
              {condicionesUnicas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">Orden precio</label>
            <select value={ordenPrecio} onChange={e => setOrdenPrecio(e.target.value)}
              className="w-full h-9 border border-slate-200 rounded px-3 py-2 text-sm">
              <option value="">Sin orden</option>
              <option value="asc">↑ Menor</option>
              <option value="desc">↓ Mayor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">C. Financiero (%)</label>
            <input type="number" value={costoFinanciero} onChange={e => setCostoFinanciero(e.target.value)} onFocus={e => e.target.select()} min={0} step={0.1}
              className="w-full h-9 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-0 focus:border-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">Envío (U$)</label>
            <input type="number" value={envio} onChange={e => setEnvio(e.target.value)} onFocus={e => e.target.select()} min={0}
              className="w-full h-9 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-0 focus:border-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">Margen (U$)</label>
            <input type="number" value={margen} onChange={e => setMargen(e.target.value)} onFocus={e => e.target.select()} min={0}
              className="w-full h-9 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-0 focus:border-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          <div className="flex items-end">
            <button onClick={limpiarFiltros} className="w-full h-9 px-3 bg-slate-700 text-white rounded hover:bg-black text-sm">
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Barra de selección */}
      <div className="flex items-center justify-between px-6 py-2 bg-emerald-50 border-b border-emerald-200 min-h-[40px]">
        <span className="text-xs font-medium text-emerald-800">
          {seleccionados.size > 0
            ? `${seleccionados.size} ${seleccionados.size === 1 ? 'equipo seleccionado' : 'equipos seleccionados'}`
            : <span className="text-slate-400">Ningún equipo seleccionado</span>}
        </span>
        <div className="flex items-center gap-3">
          {seleccionados.size > 0 && (
            <button onClick={() => setSeleccionados(new Set())} style={{ fontSize: '13px' }} className="text-slate-500 hover:text-slate-700 underline">
              Deseleccionar todo
            </button>
          )}
          <button
            onClick={copiarLista}
            disabled={seleccionados.size === 0}
            style={{ fontSize: '13px' }}
            className="flex items-center gap-1 bg-emerald-600 text-white px-1.5 py-0.5 rounded hover:bg-emerald-700 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copiado ? <Check size={13} /> : <Copy size={13} />}
            {copiado ? 'Copiado!' : 'Copiar lista'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            Cargando catálogo...
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            {productos.length === 0
              ? 'No hay datos. Subí un archivo Excel para importar el catálogo.'
              : 'No hay productos que coincidan con los filtros.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider w-10">
                  <div
                    onClick={toggleTodos}
                    className={`w-4 h-4 border rounded cursor-pointer flex items-center justify-center mx-auto transition-colors ${todosSeleccionados ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-600 border-slate-400'}`}
                  >
                    {todosSeleccionados && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Marca</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Producto</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Condición</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Precio</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">C. Financiero</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Envío</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">P. Compra</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">Venta</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {productosFiltrados.map((p, index) => {
                const sel = seleccionados.has(p.id);
                return (
                  <tr
                    key={p.id}
                    onClick={() => toggleItem(p.id)}
                    className={`cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <div
                        onClick={e => { e.stopPropagation(); toggleItem(p.id); }}
                        className={`w-4 h-4 border rounded cursor-pointer flex items-center justify-center mx-auto transition-colors ${sel ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}
                      >
                        {sel && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-slate-800 whitespace-nowrap">{p.marca}</td>
                    <td className="px-4 py-3 text-sm text-left text-slate-600">{p.producto}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getCondicionColor(p.condicion)}`}>
                        {p.condicion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800 whitespace-nowrap">
                      {p.stock ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800 whitespace-nowrap">
                      {fmtUSD(p.precio)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600 whitespace-nowrap">
                      {fmtUSD(p.precio * costoFinancieroN / 100)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600 whitespace-nowrap">
                      {fmtUSD(envioN)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-slate-800 whitespace-nowrap">
                      {fmtUSD(p.precio * (1 + costoFinancieroN / 100) + envioN)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-emerald-700 whitespace-nowrap">
                      {fmtUSD(p.precio * (1 + costoFinancieroN / 100) + envioN + margenN)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(p.producto)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ cursor: 'pointer' }} className="inline-flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
                        title="Buscar en Google"
                      >
                        <Globe size={15} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-800 text-white">
              <tr>
                <td colSpan={11} className="px-4 py-3 text-sm font-bold text-center">
                  {productosFiltrados.length.toLocaleString()} resultados
                  {productosFiltrados.length !== productos.length && ` de ${productos.length.toLocaleString()} total`}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default CatalogoProveedorSection;
