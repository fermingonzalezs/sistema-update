import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, X, Eye, Edit2, Save, Trash2, Image, Loader2, FileText } from 'lucide-react';
import { fotosAsientosService } from '../hooks/useFotosAsientos';

const GestionFotosAsiento = ({ asientoId, readOnly = false }) => {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [editandoDescripcion, setEditandoDescripcion] = useState(null);
  const [descripcionTemp, setDescripcionTemp] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (asientoId) {
      cargarFotos();
    }
  }, [asientoId]);

  const cargarFotos = async () => {
    if (!asientoId) return;

    try {
      setLoading(true);
      const fotosData = await fotosAsientosService.getFotosByAsiento(asientoId);
      setFotos(fotosData);
    } catch (err) {
      console.error('Error cargando fotos:', err);
      setError('Error al cargar las fotos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const archivo = event.target.files[0];
    if (!archivo) return;

    await subirFoto(archivo);

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const subirFoto = async (archivo) => {
    try {
      setSubiendo(true);
      setError('');

      const nuevaFoto = await fotosAsientosService.subirFoto(archivo, asientoId, '');
      setFotos(prev => [...prev, nuevaFoto]);
    } catch (err) {
      console.error('Error subiendo foto:', err);
      setError(err.message || 'Error al subir la foto');
    } finally {
      setSubiendo(false);
    }
  };

  const eliminarFoto = async (fotoId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta foto?')) return;

    try {
      await fotosAsientosService.eliminarFoto(fotoId);
      setFotos(prev => prev.filter(f => f.id !== fotoId));

      // Cerrar vista previa si se elimina la foto que se está viendo
      if (vistaPrevia && vistaPrevia.id === fotoId) {
        setVistaPrevia(null);
      }
    } catch (err) {
      console.error('Error eliminando foto:', err);
      setError('Error al eliminar la foto');
    }
  };

  const actualizarDescripcion = async (fotoId, nuevaDescripcion) => {
    try {
      await fotosAsientosService.actualizarDescripcion(fotoId, nuevaDescripcion);
      setFotos(prev => prev.map(f =>
        f.id === fotoId ? { ...f, descripcion: nuevaDescripcion } : f
      ));
      setEditandoDescripcion(null);

      // Actualizar vista previa si está abierta
      if (vistaPrevia && vistaPrevia.id === fotoId) {
        setVistaPrevia({ ...vistaPrevia, descripcion: nuevaDescripcion });
      }
    } catch (err) {
      console.error('Error actualizando descripción:', err);
      setError('Error al actualizar la descripción');
    }
  };

  const formatearTamaño = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const esPDF = (url) => {
    return url && url.toLowerCase().endsWith('.pdf');
  };

  if (!asientoId) {
    return (
      <div className="text-sm text-slate-500 italic">
        Guarda el asiento primero para poder adjuntar fotos
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con botón de adjuntar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Paperclip className="w-4 h-4 text-slate-600" />
          <h4 className="text-sm font-medium text-slate-800">
            Archivos Adjuntos ({fotos.length}/3)
          </h4>
        </div>

        {!readOnly && fotos.length < 3 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendo}
            className={`px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors ${
              subiendo
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {subiendo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Subiendo...</span>
              </>
            ) : (
              <>
                <Paperclip className="w-4 h-4" />
                <span>Adjuntar</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Mensajes de error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start space-x-2">
          <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid de fotos */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : fotos.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className="relative group border-2 border-slate-200 rounded overflow-hidden bg-slate-50"
            >
              {/* Thumbnail o ícono PDF */}
              <div className="aspect-square bg-slate-100 relative flex items-center justify-center">
                {esPDF(foto.url_foto) ? (
                  <div className="flex flex-col items-center text-slate-500">
                    <FileText className="w-12 h-12 mb-2" />
                    <span className="text-xs">PDF</span>
                  </div>
                ) : (
                  <img
                    src={foto.url_foto}
                    alt={foto.descripcion || `Foto ${foto.orden}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setVistaPrevia(foto)}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="flex items-center justify-center w-full h-full"><span class="text-slate-400">Error</span></div>';
                    }}
                  />
                )}
              </div>

              {/* Overlay con acciones */}
              {!readOnly && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                    <button
                      onClick={() => setVistaPrevia(foto)}
                      className="p-2 bg-white text-slate-700 rounded hover:bg-slate-100"
                      title="Ver"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminarFoto(foto.id)}
                      className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Descripción */}
              {foto.descripcion && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 truncate">
                  {foto.descripcion}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded bg-slate-50">
          <Image className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No hay archivos adjuntos</p>
          {!readOnly && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-emerald-600 hover:text-emerald-800 text-sm"
            >
              Haz clic para adjuntar
            </button>
          )}
        </div>
      )}

      {/* Información */}
      <p className="text-xs text-slate-500">
        Formatos permitidos: JPG, PNG, WEBP, PDF • Tamaño máximo: 5MB • Máximo 3 archivos
      </p>

      {/* Modal de vista previa */}
      {vistaPrevia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-medium text-slate-800">
                {vistaPrevia.descripcion || vistaPrevia.nombre_archivo}
              </h4>
              <div className="flex items-center space-x-2">
                {!readOnly && (
                  <>
                    {editandoDescripcion === vistaPrevia.id ? (
                      <>
                        <input
                          type="text"
                          value={descripcionTemp}
                          onChange={(e) => setDescripcionTemp(e.target.value)}
                          placeholder="Descripción..."
                          className="px-2 py-1 border border-slate-200 rounded text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              actualizarDescripcion(vistaPrevia.id, descripcionTemp);
                            }
                          }}
                        />
                        <button
                          onClick={() => actualizarDescripcion(vistaPrevia.id, descripcionTemp)}
                          className="p-1 text-emerald-600 hover:text-emerald-800"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditandoDescripcion(null)}
                          className="p-1 text-slate-600 hover:text-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditandoDescripcion(vistaPrevia.id);
                          setDescripcionTemp(vistaPrevia.descripcion || '');
                        }}
                        className="p-1 text-slate-600 hover:text-slate-800"
                        title="Editar descripción"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setVistaPrevia(null)}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-4 flex-1 overflow-auto">
              {esPDF(vistaPrevia.url_foto) ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileText className="w-16 h-16 text-slate-400 mb-4" />
                  <p className="text-slate-600 mb-4">Archivo PDF</p>
                  <a
                    href={vistaPrevia.url_foto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
                  >
                    Abrir PDF
                  </a>
                </div>
              ) : (
                <img
                  src={vistaPrevia.url_foto}
                  alt={vistaPrevia.descripcion}
                  className="max-w-full max-h-[60vh] object-contain mx-auto"
                />
              )}
            </div>

            {/* Footer del modal */}
            <div className="p-4 bg-slate-50 border-t text-sm text-slate-600 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span>{vistaPrevia.nombre_archivo}</span>
                <span>{formatearTamaño(vistaPrevia.tamaño_archivo)}</span>
              </div>
              {!readOnly && (
                <button
                  onClick={() => {
                    eliminarFoto(vistaPrevia.id);
                    setVistaPrevia(null);
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionFotosAsiento;
