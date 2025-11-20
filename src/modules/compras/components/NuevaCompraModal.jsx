import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useProveedores } from '../../importaciones/hooks/useProveedores';
import NuevoProveedorModal from '../../importaciones/components/NuevoProveedorModal';

const NuevaCompraModal = ({ isOpen, onClose, onSave, isLoading = false, isEditing = false, reciboInicial = null }) => {
  const { proveedores, crearProveedor } = useProveedores();

  const METODOS_PAGO = [
    { value: 'efectivo_pesos', label: '💵 Efectivo en Pesos' },
    { value: 'dolares_billete', label: '💸 Dólares Billete' },
    { value: 'transferencia', label: '🏦 Transferencia' },
    { value: 'criptomonedas', label: '₿ Criptomonedas' },
    { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
    { value: 'cuenta_corriente', label: '🏷️ Cuenta Corriente' }
  ];

  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false);

  const [formRecibo, setFormRecibo] = useState({
    proveedor_id: reciboInicial?.proveedor_id || '',
    proveedor: reciboInicial?.proveedor || '',
    fecha_compra: reciboInicial?.fecha || new Date().toISOString().split('T')[0],
    metodo_pago: reciboInicial?.metodo_pago || 'transferencia',
    observaciones: reciboInicial?.descripcion || '',
    costos_adicionales: reciboInicial?.costos_adicionales || 0
  });

  const [formItem, setFormItem] = useState({
    producto: '',
    cantidad: 1,
    serial: '',
    precio_unitario: '',
    filasUnicas: true
  });

  const [items, setItems] = useState(reciboInicial?.compras_items || []);

  // Actualizar items cuando reciboInicial cambia (al editar)
  useEffect(() => {
    if (reciboInicial?.compras_items) {
      setItems(reciboInicial.compras_items);
    } else {
      setItems([]);
    }
  }, [reciboInicial?.id]);

  const agregarItem = () => {
    if (!formItem.producto.trim() || !formItem.cantidad || !formItem.precio_unitario) {
      alert('Completa todos los campos obligatorios del item');
      return;
    }

    const cantidad = parseInt(formItem.cantidad);
    const precio = parseFloat(formItem.precio_unitario);
    const nuevosItems = [];

    if (formItem.filasUnicas) {
      // Crear una fila por cada unidad
      for (let i = 0; i < cantidad; i++) {
        nuevosItems.push({
          id: Date.now() + i,
          producto: formItem.producto.trim(),
          cantidad: 1,
          serial: formItem.serial.trim() || null,
          precio_unitario: precio,
          precio_total: precio
        });
      }
    } else {
      // Agregar como una sola fila con cantidad total
      nuevosItems.push({
        id: Date.now(),
        producto: formItem.producto.trim(),
        cantidad: cantidad,
        serial: formItem.serial.trim() || null,
        precio_unitario: precio,
        precio_total: cantidad * precio
      });
    }

    setItems([...items, ...nuevosItems]);
    setFormItem({
      producto: '',
      cantidad: 1,
      serial: '',
      precio_unitario: '',
      filasUnicas: true
    });
  };

  const eliminarItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const actualizarSerial = (id, nuevoSerial) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, serial: nuevoSerial } : item
    ));
  };

  const actualizarPrecioUnitario = (id, nuevoPrecio) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const precio = parseFloat(nuevoPrecio) || 0;
        return {
          ...item,
          precio_unitario: precio,
          precio_total: precio * parseInt(item.cantidad)
        };
      }
      return item;
    }));
  };

  const calcularTotalItems = () => {
    return items.reduce((sum, item) => sum + item.precio_total, 0);
  };

  const calcularCostosAdicacionalesItem = (item) => {
    const totalSinCostos = calcularTotalItems();
    const costosAdicionales = parseFloat(formRecibo.costos_adicionales) || 0;

    if (totalSinCostos === 0) return 0;

    const proporcion = item.precio_total / totalSinCostos;
    return costosAdicionales * proporcion;
  };

  const handleGuardar = async () => {
    if (!formRecibo.proveedor_id) {
      alert('El proveedor es requerido');
      return;
    }
    if (items.length === 0) {
      alert('Debe agregar al menos un item');
      return;
    }

    // Calcular costos adicionales distribuidos
    const totalSinCostos = items.reduce((sum, item) => sum + item.precio_total, 0);
    const costosAdicionales = parseFloat(formRecibo.costos_adicionales) || 0;

    // Distribuir costos adicionales proporcionalmente
    const itemsConCostos = items.map(item => {
      const proporcion = item.precio_total / totalSinCostos;
      const costoDistribuido = costosAdicionales * proporcion;
      return {
        ...item,
        costos_adicionales: costoDistribuido,
        precio_total: item.precio_total + costoDistribuido
      };
    });

    await onSave({
      proveedor_id: formRecibo.proveedor_id,
      proveedor: formRecibo.proveedor,
      fecha_compra: formRecibo.fecha_compra,
      metodo_pago: formRecibo.metodo_pago,
      observaciones: formRecibo.observaciones,
      costos_adicionales: costosAdicionales
    }, itemsConCostos);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center sticky top-0">
          <h3 className="text-xl font-semibold">{isEditing ? 'Editar Compra Local' : 'Nueva Compra Local'}</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white" disabled={isLoading}>
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
                      onChange={(e) => {
                        const proveedorId = e.target.value;
                        const proveedor = proveedores.find(p => p.id === proveedorId);
                        setFormRecibo({
                          ...formRecibo,
                          proveedor_id: proveedorId,
                          proveedor: proveedor ? proveedor.nombre : ''
                        });
                      }}
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
                      type="button"
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

                {/* COSTOS ADICIONALES */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costos Adicionales (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formRecibo.costos_adicionales}
                    onChange={(e) => setFormRecibo({ ...formRecibo, costos_adicionales: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* OBSERVACIONES */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                  <textarea
                    value={formRecibo.observaciones}
                    onChange={(e) => setFormRecibo({ ...formRecibo, observaciones: e.target.value })}
                    placeholder="Observaciones adicionales..."
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
                    value={formItem.producto}
                    onChange={(e) => setFormItem({ ...formItem, producto: e.target.value })}
                    placeholder="Ej: Mouse Logitech MX"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serial/Código (opcional)</label>
                  <input
                    type="text"
                    value={formItem.serial}
                    onChange={(e) => setFormItem({ ...formItem, serial: e.target.value })}
                    placeholder="ABC123456"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio Unitario *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formItem.precio_unitario}
                    onChange={(e) => setFormItem({ ...formItem, precio_unitario: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="filasUnicas"
                  checked={formItem.filasUnicas}
                  onChange={(e) => setFormItem({ ...formItem, filasUnicas: e.target.checked })}
                  className="w-5 h-5 cursor-pointer accent-emerald-600 rounded"
                />
                <label htmlFor="filasUnicas" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Filas únicas
                </label>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Serial</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">P. Unit.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Costos Adic.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => {
                      const costosAdicionalesItem = calcularCostosAdicacionalesItem(item);
                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-4 py-3 text-slate-800">{item.producto}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{item.cantidad}</td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.serial || ''}
                              onChange={(e) => actualizarSerial(item.id, e.target.value)}
                              placeholder="Serial/Código"
                              className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              step="0.01"
                              value={parseFloat(item.precio_unitario).toFixed(2)}
                              onChange={(e) => actualizarPrecioUnitario(item.id, e.target.value)}
                              className="w-full border border-slate-300 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">${costosAdicionalesItem.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-800">${(item.precio_total + costosAdicionalesItem).toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => eliminarItem(item.id)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t border-slate-200">
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-sm font-semibold text-right text-slate-800">
                        SUBTOTAL:
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-center text-slate-800">
                        ${calcularTotalItems().toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-sm font-semibold text-right text-slate-800">
                        COSTOS ADIC.:
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-center text-slate-800">
                        ${(parseFloat(formRecibo.costos_adicionales) || 0).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                    <tr className="bg-slate-800 text-white">
                      <td colSpan="5" className="px-4 py-3 text-sm font-semibold text-right">
                        TOTAL:
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-center">
                        ${(calcularTotalItems() + (parseFloat(formRecibo.costos_adicionales) || 0)).toFixed(2)}
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
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
              disabled={isLoading || items.length === 0}
            >
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Compra' : 'Crear Compra')}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL NUEVO PROVEEDOR */}
      {showNuevoProveedorModal && (
        <NuevoProveedorModal
          onClose={() => setShowNuevoProveedorModal(false)}
          onSuccess={(nuevoProveedor) => {
            setShowNuevoProveedorModal(false);
            setFormRecibo({
              ...formRecibo,
              proveedor_id: nuevoProveedor.id,
              proveedor: nuevoProveedor.nombre
            });
          }}
        />
      )}
    </div>
  );
};

export default NuevaCompraModal;
