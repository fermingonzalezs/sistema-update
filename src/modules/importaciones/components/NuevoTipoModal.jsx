import React from 'react';
import { X, ShoppingCart, Truck, User, Building2 } from 'lucide-react';

const NuevoTipoModal = ({ onClose, onSelectImportacion, onSelectCourierCliente, onSelectCourierEmpresa }) => {
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded border border-slate-300 w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between rounded-t">
          <h3 className="text-lg font-semibold">Nuevo Registro</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6">Seleccioná el tipo de operación a registrar</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* Importación */}
            <div className="border border-slate-200 rounded p-4 flex flex-col justify-center">
              <button
                onClick={onSelectImportacion}
                className="w-full h-full min-h-[140px] flex flex-col items-center justify-center gap-4 p-6 border border-emerald-200 rounded hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-emerald-50 group-hover:bg-emerald-100 rounded flex items-center justify-center transition-colors">
                  <ShoppingCart size={24} className="text-emerald-600 transition-colors" />
                </div>
                <p className="font-semibold text-slate-800">Importación</p>
              </button>
            </div>

            {/* Servicio de Courier */}
            <div className="border border-slate-200 rounded p-4 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                  <Truck size={20} className="text-slate-600" />
                </div>
                <p className="font-semibold text-slate-800">Servicio de Courier</p>
              </div>

              <div className="space-y-2 flex-grow">
                <button
                  onClick={onSelectCourierCliente}
                  className="w-full flex items-center gap-3 p-3 border border-blue-200 rounded hover:bg-blue-50 hover:border-blue-400 transition-all text-left group"
                >
                  <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded flex items-center justify-center transition-colors flex-shrink-0">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-800">A cargo del cliente</p>
                </button>

                <button
                  onClick={onSelectCourierEmpresa}
                  className="w-full flex items-center gap-3 p-3 border border-purple-200 rounded hover:bg-purple-50 hover:border-purple-400 transition-all text-left group"
                >
                  <div className="w-8 h-8 bg-purple-50 group-hover:bg-purple-100 rounded flex items-center justify-center transition-colors flex-shrink-0">
                    <Building2 size={16} className="text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-800">A cargo de Update</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevoTipoModal;
