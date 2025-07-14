// Moved from src/components/ImportacionesSection.jsx
import React, { useEffect } from 'react';
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

  useEffect(() => {
    fetchImportaciones();
  }, [fetchImportaciones]);

  return (
    <div className="">
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
                      <button className="text-slate-600 hover:text-emerald-600 px-3 py-1 text-sm rounded border border-slate-200 hover:border-emerald-600 transition-colors">
                        Ver
                      </button>
                      <button className="text-slate-600 hover:text-blue-600 px-3 py-1 text-sm rounded border border-slate-200 hover:border-blue-600 transition-colors">
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
    </div>
  );
};

export default ImportacionesSection;
