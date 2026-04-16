import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, FileText, Upload, Image, File } from 'lucide-react';
import EmpresaLogisticaSelector from './EmpresaLogisticaSelector';
import { useImportaciones } from '../hooks/useImportaciones';
import importacionesService from '../services/importacionesService';
import { useProveedores } from '../hooks/useProveedores';
import { calculosImportacion } from '../utils/calculosImportacion';
import { obtenerFechaLocal } from '../../../shared/utils/formatters';
import NuevoProveedorModal from './NuevoProveedorModal';
import PesajeCombobox from '../../compras/components/PesajeCombobox';
import { METODOS_PAGO } from '../../../shared/constants/paymentMethods';
import ClienteSelector from '../../ventas/components/ClienteSelector';

const NuevaImportacionModal = ({ onClose, onSuccess, tipoCourier }) => {
  const { crearRecibo } = useImportaciones();
  const { proveedores, crearProveedor } = useProveedores();

  // tipoCourier: 'courier_empresa' si viene del NuevoTipoModal
  const tipoRegistro = tipoCourier || 'importacion';

  const [formRecibo, setFormRecibo] = useState({
    proveedor_id: '',
    cliente_id: null,
    fecha_compra: obtenerFechaLocal(),
    metodo_pago: 'transferencia',
    tracking_number: '',
    empresa_logistica: '',
    fecha_estimada_ingreso: '',
    porcentaje_financiero: '',
    observaciones: '',
    numero_invoice: '',
    destino: tipoCourier === 'courier_empresa' ? 'empresa' : 'reventa',
    tipo: tipoRegistro
  });

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const fileInputRef = useRef(null);

  const [formItem, setFormItem] = useState({
    item: '',
    cantidad: 1,
    precio_unitario_usd: '',
    peso_estimado_unitario_kg: '',
    color: '',
    almacenamiento: '',
    link_producto: '',
    observaciones: ''
  });

  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false);

  const formatNumber = (num) => {
    return Math.round(num).toLocaleString('es-AR');
  };

  const agregarItem = () => {
    if (!formItem.item.trim()) {
      alert('Ingresa el nombre del producto');
      return;
    }
    if (!formItem.cantidad || parseFloat(formItem.cantidad) <= 0) {
      alert('Ingresa una cantidad válida');
      return;
    }
    if (formItem.precio_unitario_usd === '' || formItem.precio_unitario_usd === null || parseFloat(formItem.precio_unitario_usd) < 0) {
      alert('Ingresa el precio unitario en USD');
      return;
    }
    if (formItem.peso_estimado_unitario_kg === '' || formItem.peso_estimado_unitario_kg === null || parseFloat(formItem.peso_estimado_unitario_kg) <= 0) {
      alert('Ingresa el peso estimado unitario');
      return;
    }

    const nuevoItem = {
      ...formItem,
      id: Date.now(),
      cantidad: parseInt(formItem.cantidad),
      precio_unitario_usd: parseFloat(formItem.precio_unitario_usd),
      peso_estimado_unitario_kg: parseFloat(formItem.peso_estimado_unitario_kg),
      precio_total_usd: parseInt(formItem.cantidad) * parseFloat(formItem.precio_unitario_usd),
      peso_estimado_total_kg: parseInt(formItem.cantidad) * parseFloat(formItem.peso_estimado_unitario_kg)
    };

    setItems([...items, nuevoItem]);
    setFormItem({
      item: '',
      cantidad: 1,
      precio_unitario_usd: '',
      peso_estimado_unitario_kg: '',
      color: '',
      almacenamiento: '',
      link_producto: '',
      observaciones: ''
    });
  };

  const eliminarItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calcularTotalItems = () => {
    return calculosImportacion.calcularTotalItems(items);
  };

  const calcularPesoTotal = () => {
    return calculosImportacion.calcularPesoTotalEstimado(items);
  };

  const handleArchivosChange = (e) => {
    const nuevos = Array.from(e.target.files);
    const tiposPermitidos = ['application/pdf', 'image/'];
    const maxSize = 20 * 1024 * 1024;
    const validos = [];
    for (const file of nuevos) {
      if (!tiposPermitidos.some(t => file.type.startsWith(t))) {
        alert(`"${file.name}": Solo se permiten PDFs e imágenes`);
        continue;
      }
      if (file.size > maxSize) {
        alert(`"${file.name}": El archivo no puede superar los 20MB`);
        continue;
      }
      validos.push(file);
    }
    setArchivosSeleccionados(prev => [...prev, ...validos]);
    e.target.value = '';
  };

  const quitarArchivo = (index) => {
    setArchivosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const guardarImportacion = async () => {
    if (!formRecibo.proveedor_id) {
      alert('Selecciona un proveedor');
      return;
    }

    if (tipoRegistro === 'courier_empresa' && !clienteSeleccionado) {
      alert('Seleccioná un cliente para el servicio de courier');
      return;
    }

    if (items.length === 0) {
      alert('Agrega al menos un item a la importación');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Crear el recibo (incluir cliente_id si aplica)
      const datosRecibo = {
        ...formRecibo,
        cliente_id: clienteSeleccionado?.id || null
      };
      const nuevoRecibo = await crearRecibo(datosRecibo, items);

      // 2. Si hay archivos, subirlos
      if (archivosSeleccionados.length > 0 && nuevoRecibo?.id) {
        for (const archivo of archivosSeleccionados) {
          try {
            await importacionesService.subirArchivo(nuevoRecibo.id, archivo);
          } catch (err) {
            console.warn(`Importación creada pero falló la carga de "${archivo.name}":`, err.message);
          }
        }
      }

      alert('✅ Importación creada exitosamente');
      onSuccess();
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const crearNuevoProveedor = async () => {
    if (!newProveedorData.nombre.trim()) {
      alert('El nombre del proveedor es obligatorio');
      return;
    }

    try {
      const nuevoProveedor = await crearProveedor(newProveedorData);
      setFormRecibo({ ...formRecibo, proveedor_id: nuevoProveedor.id });
      setShowNewProveedor(false);
      setNewProveedorData({ nombre: '', email: '', telefono: '', pais: '' });
      alert('✅ Proveedor creado');
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-semibold">
              {tipoRegistro === 'courier_empresa' ? 'Nuevo Servicio de Courier — A cargo de Update' : 'Nueva Importación'}
            </h3>
            {tipoRegistro === 'courier_empresa' && (
              <span className="mt-1 inline-block bg-purple-500 text-white text-xs font-medium px-2 py-0.5 rounded">COURIER EMPRESA</span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* DATOS GENERALES */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Datos Generales</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* PROVEEDOR */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor *</label>
                  <div className="flex gap-2">
                    <select
                      value={formRecibo.proveedor_id}
                      onChange={(e) => setFormRecibo({ ...formRecibo, proveedor_id: e.target.value })}
                      className="flex-1 border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Seleccionar proveedor</option>
                      {proveedores.map(prov => (
                        <option key={prov.id} value={prov.id}>
                          {prov.nombre}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNuevoProveedorModal(true)}
                      className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium"
                      title="Crear nuevo proveedor"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* CLIENTE — solo para courier_empresa */}
                {tipoRegistro === 'courier_empresa' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cliente <span className="text-red-500">*</span></label>
                    <ClienteSelector
                      selectedCliente={clienteSeleccionado}
                      onSelectCliente={setClienteSeleccionado}
                      required={true}
                    />
                  </div>
                )}

                {/* FECHA */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Compra *</label>
                  <input
                    type="date"
                    value={formRecibo.fecha_compra}
                    onChange={(e) => setFormRecibo({ ...formRecibo, fecha_compra: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* MÉTODO DE PAGO */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago *</label>
                  <select
                    value={formRecibo.metodo_pago}
                    onChange={(e) => setFormRecibo({ ...formRecibo, metodo_pago: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {METODOS_PAGO.map(metodo => (
                      <option key={metodo.value} value={metodo.value}>
                        {metodo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* NÚMERO DE INVOICE */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número de Invoice</label>
                  <input
                    type="text"
                    value={formRecibo.numero_invoice}
                    onChange={(e) => setFormRecibo({ ...formRecibo, numero_invoice: e.target.value })}
                    placeholder="Ej: INV-2024-001"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* EMPRESA LOGÍSTICA */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Empresa Logística</label>
                  <EmpresaLogisticaSelector
                    value={formRecibo.empresa_logistica}
                    onChange={(valor) => setFormRecibo({ ...formRecibo, empresa_logistica: valor })}
                    placeholder="Seleccionar empresa..."
                  />
                </div>

                {/* TRACKING */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número de Tracking</label>
                  <input
                    type="text"
                    value={formRecibo.tracking_number}
                    onChange={(e) => setFormRecibo({ ...formRecibo, tracking_number: e.target.value })}
                    placeholder="Ej: SZ123456789CN"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* FECHA ESTIMADA */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">F. Estimada Ingreso</label>
                  <input
                    type="date"
                    value={formRecibo.fecha_estimada_ingreso}
                    onChange={(e) => setFormRecibo({ ...formRecibo, fecha_estimada_ingreso: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* COSTO FINANCIERO */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo Financiero (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Ej: 1.5"
                    value={formRecibo.porcentaje_financiero}
                    onChange={(e) => setFormRecibo({ ...formRecibo, porcentaje_financiero: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">% sobre el precio FOB de cada equipo</p>
                </div>

                {/* ARCHIVOS ADJUNTOS */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Archivos adjuntos (opcional)</label>
                  <div
                    className="border border-dashed border-slate-300 rounded px-3 py-2 flex items-center gap-2 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-500">Agregar PDFs o imágenes...</span>
                    <span className="text-xs text-slate-400 ml-auto">máx. 20MB c/u</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    multiple
                    onChange={handleArchivosChange}
                    className="hidden"
                  />
                  {archivosSeleccionados.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {archivosSeleccionados.map((archivo, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                          {archivo.type === 'application/pdf'
                            ? <FileText size={14} className="text-emerald-600 flex-shrink-0" />
                            : <Image size={14} className="text-blue-500 flex-shrink-0" />
                          }
                          <span className="text-xs text-slate-700 truncate flex-1">{archivo.name}</span>
                          <span className="text-xs text-slate-400 flex-shrink-0">{(archivo.size / 1024).toFixed(0)}KB</span>
                          <button
                            type="button"
                            onClick={() => quitarArchivo(idx)}
                            className="text-red-400 hover:text-red-600 flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DESCRIPCIÓN */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea
                    value={formRecibo.observaciones}
                    onChange={(e) => setFormRecibo({ ...formRecibo, observaciones: e.target.value })}
                    rows="2"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AGREGAR ITEMS */}
          <div className="space-y-3">
            <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
              <h4 className="font-semibold text-slate-800 uppercase">Agregar Productos</h4>
            </div>
            <div className="border border-slate-300 border-t-0 rounded-b p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Producto *</label>
                  <PesajeCombobox
                    value={formItem.item}
                    onSelect={({ nombre, peso_kg }) =>
                      setFormItem({ ...formItem, item: nombre, peso_estimado_unitario_kg: peso_kg || formItem.peso_estimado_unitario_kg })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    value={formItem.cantidad}
                    onChange={(e) => setFormItem({ ...formItem, cantidad: e.target.value })}
                    min="1"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio Unit. (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formItem.precio_unitario_usd}
                    onChange={(e) => setFormItem({ ...formItem, precio_unitario_usd: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peso Est. Unit. (kg) *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.000"
                    value={formItem.peso_estimado_unitario_kg}
                    onChange={(e) => setFormItem({ ...formItem, peso_estimado_unitario_kg: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="Ej: Negro, Plata..."
                    value={formItem.color}
                    onChange={(e) => setFormItem({ ...formItem, color: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Almacenamiento</label>
                  <input
                    type="text"
                    placeholder="Ej: 256GB, 1TB..."
                    value={formItem.almacenamiento}
                    onChange={(e) => setFormItem({ ...formItem, almacenamiento: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link del Producto (opcional)</label>
                <input
                  type="url"
                  value={formItem.link_producto}
                  onChange={(e) => setFormItem({ ...formItem, link_producto: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                onClick={agregarItem}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Agregar Producto
              </button>
            </div>
          </div>

          {/* TABLA DE ITEMS */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="bg-slate-200 p-4 rounded-t border border-slate-300">
                <h4 className="font-semibold text-slate-800 uppercase">Productos Agregados</h4>
              </div>
              <div className="border border-slate-300 border-t-0 rounded-b overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Color</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Almacenamiento</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cant.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unit. USD</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Total USD</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Unit. (kg)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Peso Total (kg)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 text-slate-800">{item.item}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.color || '-'}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.almacenamiento || '-'}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.cantidad}</td>
                        <td className="px-4 py-3 text-center text-slate-600">${formatNumber(item.precio_unitario_usd)}</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-800">${formatNumber(item.precio_total_usd)}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.peso_estimado_unitario_kg.toFixed(2)} kg</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.peso_estimado_total_kg.toFixed(2)} kg</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => eliminarItem(item.id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-800 text-white">
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-sm font-semibold text-right">
                        TOTAL:
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-center">
                        ${formatNumber(calcularTotalItems())}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-center">
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-center">
                        {calcularPesoTotal().toFixed(2)} kg
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* BOTONES */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={guardarImportacion}
              className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
              disabled={isSubmitting || items.length === 0}
            >
              {isSubmitting ? 'Guardando...' : 'Crear Importación'}
            </button>
          </div>
        </div>
      </div>

      {showNuevoProveedorModal && (
        <NuevoProveedorModal
          onClose={() => setShowNuevoProveedorModal(false)}
          onSuccess={() => {
            setShowNuevoProveedorModal(false);
          }}
        />
      )}
    </div>
  );
};

export default NuevaImportacionModal;
