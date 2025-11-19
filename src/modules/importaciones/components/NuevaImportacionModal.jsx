import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useImportaciones } from '../hooks/useImportaciones';
import { useProveedores } from '../hooks/useProveedores';
import { calculosImportacion } from '../utils/calculosImportacion';
import NuevoProveedorModal from './NuevoProveedorModal';

const METODOS_PAGO = [
  { value: 'efectivo_pesos', label: '💵 Efectivo en Pesos' },
  { value: 'dolares_billete', label: '💸 Dólares Billete' },
  { value: 'transferencia', label: '🏦 Transferencia' },
  { value: 'criptomonedas', label: '₿ Criptomonedas' },
  { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
  { value: 'cuenta_corriente', label: '🏷️ Cuenta Corriente' }
];

const NuevaImportacionModal = ({ onClose, onSuccess }) => {
  const { crearRecibo } = useImportaciones();
  const { proveedores, crearProveedor } = useProveedores();

  const [formRecibo, setFormRecibo] = useState({
    proveedor_id: '',
    cliente_id: null,
    fecha_compra: new Date().toISOString().split('T')[0],
    metodo_pago: 'transferencia',
    tracking_number: '',
    empresa_logistica: '',
    fecha_estimada_ingreso: '',
    observaciones: ''
  });

  const [formItem, setFormItem] = useState({
    item: '',
    cantidad: 1,
    precio_unitario_usd: 0,
    peso_estimado_unitario_kg: 0,
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
    if (!formItem.item.trim() || !formItem.cantidad || !formItem.precio_unitario_usd || !formItem.peso_estimado_unitario_kg) {
      alert('Completa todos los campos obligatorios del item');
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
      precio_unitario_usd: 0,
      peso_estimado_unitario_kg: 0,
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

  const guardarImportacion = async () => {
    if (!formRecibo.proveedor_id) {
      alert('Selecciona un proveedor');
      return;
    }

    if (items.length === 0) {
      alert('Agrega al menos un item a la importación');
      return;
    }

    setIsSubmitting(true);
    try {
      await crearRecibo(formRecibo, items);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
          <h3 className="text-xl font-semibold">Nueva Importación</h3>
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

                {/* EMPRESA LOGÍSTICA */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Empresa Logística</label>
                  <input
                    type="text"
                    value={formRecibo.empresa_logistica}
                    onChange={(e) => setFormRecibo({ ...formRecibo, empresa_logistica: e.target.value })}
                    placeholder="DHL, FedEx, etc."
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Producto/Descripción *</label>
                  <input
                    type="text"
                    value={formItem.item}
                    onChange={(e) => setFormItem({ ...formItem, item: e.target.value })}
                    placeholder="Ej: iPhones 15 Pro Max"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio Unitario (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formItem.precio_unitario_usd}
                    onChange={(e) => setFormItem({ ...formItem, precio_unitario_usd: e.target.value })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peso Est. Unit. (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formItem.peso_estimado_unitario_kg}
                    onChange={(e) => setFormItem({ ...formItem, peso_estimado_unitario_kg: e.target.value })}
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
                  <tfoot className="bg-slate-100 border-t border-slate-200">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-sm font-semibold text-right text-slate-800">
                        TOTAL:
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-center text-slate-800">
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-center text-slate-800">
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
