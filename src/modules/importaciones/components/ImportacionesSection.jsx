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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-8 flex items-center">
        <div>
          <h2 className="text-4xl font-bold text-white">Gestión de Importaciones</h2>
          <p className="text-white/80 text-xl mt-2">Panel general de importaciones</p>
        </div>
      </div>
      {loading && <div>Cargando importaciones...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="divide-y divide-gray-200">
        {importaciones.map((imp) => (
          <li key={imp.id} className="py-4 bg-blue-50 border border-blue-100 rounded-xl mb-4 px-6">
            <div className="font-semibold text-blue-900 text-lg">{imp.descripcion}</div>
            <div className="text-sm text-blue-800">Cliente: {imp.clientes?.nombre} {imp.clientes?.apellido}</div>
            <div className="text-xs text-blue-700">Estado: {imp.estado}</div>
          </li>
        ))}
      </ul>
      {/* Aquí puedes agregar formularios/modales para crear/editar importaciones */}
    </div>
  );
};

export default ImportacionesSection;
