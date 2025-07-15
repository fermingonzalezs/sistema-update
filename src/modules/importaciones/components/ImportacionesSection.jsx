// Moved from src/components/ImportacionesSection.jsx
import React, { useEffect, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { useImportaciones } from '../lib/importaciones';

const ImportacionesSection = () => {
  const {
    importaciones,
    loading,
    error,
    fetchImportaciones,
    createCotizacion,
    updateImportacion,
    aprobarCotizacion,
    marcarEnTransito,
    finalizarImportacion,
    deleteImportacion,
    getEstadisticas
  } = useImportaciones();

  const [selectedImportacion, setSelectedImportacion] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchImportaciones();
  }, [fetchImportaciones]);

  // Handlers para los botones
  const handleVer = (importacion) => {
    setSelectedImportacion(importacion);
    setShowDetailModal(true);
  };

  const handleEditar = (importacion) => {
    setSelectedImportacion(importacion);
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowDetailModal(false);
    setShowEditModal(false);
    setSelectedImportacion(null);
  };

  return (
    <div className="">
      {/* Header Estandarizado */}
      <div className="bg-white rounded border border-slate-200 mb-4">
        <div className="p-6 bg-slate-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-semibold">Importaciones</h2>
                <p className="text-slate-300 mt-1">Gestión de importaciones y cotizaciones</p>
              </div>
            </div>
            <button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Importación
            </button>
          </div>
        </div>
      </div>

      {/* Estados de carga y error integrados */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-slate-600">Cargando importaciones...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="text-red-700">Error: {error}</div>
        </div>
      )}

      {/* Lista optimizada de importaciones */}
      {!loading && !error && (
        <div className="space-y-4">
          {importaciones.length > 0 ? (
            <div className="grid gap-4">
              {importaciones.map((imp) => (
                <div key={imp.id} className="bg-white border border-slate-200 rounded hover:shadow-sm transition-shadow p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 text-lg mb-2">{imp.descripcion}</h3>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div>Cliente: {imp.clientes?.nombre} {imp.clientes?.apellido}</div>
                        <div className="flex items-center gap-2">
                          <span>Estado:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            imp.estado === 'completado' ? 'bg-emerald-100 text-emerald-800' :
                            imp.estado === 'en_transito' ? 'bg-blue-100 text-blue-800' :
                            imp.estado === 'cotizado' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {imp.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Acciones rápidas por importación */}
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => handleVer(imp)}
                        className="text-slate-600 hover:text-emerald-600 px-3 py-1 text-sm rounded border border-slate-200 hover:border-emerald-600 transition-colors"
                      >
                        Ver
                      </button>
                      <button 
                        onClick={() => handleEditar(imp)}
                        className="text-slate-600 hover:text-emerald-600 px-3 py-1 text-sm rounded border border-slate-200 hover:border-emerald-600 transition-colors"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">No hay importaciones</h3>
              <p className="text-slate-500 mb-6">Comienza creando tu primera importación</p>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded font-medium transition-colors">
                + Nueva Importación
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalle */}
      {showDetailModal && selectedImportacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded border border-slate-200 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-slate-800 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Detalle de Importación</h2>
                <button 
                  onClick={handleCloseModals}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div><strong>Descripción:</strong> {selectedImportacion.descripcion}</div>
                <div><strong>Cliente:</strong> {selectedImportacion.clientes?.nombre} {selectedImportacion.clientes?.apellido}</div>
                <div><strong>Estado:</strong> {selectedImportacion.estado}</div>
                <div><strong>Precio:</strong> ${selectedImportacion.precio_compra_usd}</div>
                <div><strong>Peso estimado:</strong> {selectedImportacion.peso_estimado_kg} kg</div>
                {selectedImportacion.numero_seguimiento && (
                  <div><strong>Número de seguimiento:</strong> {selectedImportacion.numero_seguimiento}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && selectedImportacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded border border-slate-200 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-slate-800 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Editar Importación</h2>
                <button 
                  onClick={handleCloseModals}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-600">Funcionalidad de edición en desarrollo...</p>
              <div className="mt-4">
                <button 
                  onClick={handleCloseModals}
                  className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportacionesSection;
