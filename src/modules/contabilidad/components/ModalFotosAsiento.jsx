import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, X, Eye, Edit2, Save, Trash2, Image, Loader2, FileText, Plus } from 'lucide-react';
import { fotosAsientosService } from '../hooks/useFotosAsientos';

const ModalFotosAsiento = ({ isOpen, onClose, asientoId, numeroAsiento }) => {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [editandoDescripcion, setEditandoDescripcion] = useState(null);
  const [descripcionTemp, setDescripcionTemp] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && asientoId) {
      cargarFotos();
    }
  }, [isOpen, asientoId]);

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

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-slate-800 p-6 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Paperclip className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold">Archivos Adjuntos</h2>
                <p className="text-slate-300 text-sm">Asiento N° {numeroAsiento}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Botón de adjuntar */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">
                  Puedes adjuntar hasta 3 archivos por asiento ({fotos.length}/3)
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos: JPG, PNG, WEBP, PDF • Máximo 5MB por archivo
                </p>
              </div>
              {fotos.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={subiendo}
                  className={`px-4 py-2 rounded flex items-center space-x-2 transition-colors ${
                    subiendo
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {subiendo ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Adjuntar archivo</span>
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : fotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                {fotos.map((foto) => (
                  <div
                    key={foto.id}
                    className="relative group border-2 border-slate-200 rounded-lg overflow-hidden bg-slate-50 hover:border-emerald-500 transition-colors"
                  >
                    {/* Thumbnail o ícono PDF */}
                    <div className="aspect-square bg-slate-100 relative flex items-center justify-center">
                      {esPDF(foto.url_foto) ? (
                        <div className="flex flex-col items-center text-slate-500">
                          <FileText className="w-16 h-16 mb-2" />
                          <span className="text-sm font-medium">PDF</span>
                        </div>
                      ) : (
                        <img
                          src={foto.url_foto}
                          alt={foto.descripcion || `Foto ${foto.orden}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setVistaPrevia(foto)}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="flex items-center justify-center w-full h-full text-slate-400">Error cargando imagen</div>';
                          }}
                        />
                      )}
                    </div>

                    {/* Overlay con acciones */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                        <button
                          onClick={() => setVistaPrevia(foto)}
                          className="p-2 bg-white text-slate-700 rounded-lg hover:bg-slate-100"
                          title="Ver"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => eliminarFoto(foto.id)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Descripción */}
                    {foto.descripcion && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white text-xs p-3 truncate">
                        {foto.descripcion}
                      </div>
                    )}

                    {/* Número de orden */}
                    <div className="absolute top-2 left-2 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                      {foto.orden}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                <Image className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium mb-1">No hay archivos adjuntos</p>
                <p className="text-sm text-slate-500 mb-4">Adjunta facturas, recibos o documentos relacionados</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                >
                  Haz clic aquí para adjuntar el primer archivo
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de vista previa (segundo nivel) */}
      {vistaPrevia && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-5xl max-h-[95vh] overflow-hidden flex flex-col w-full">
            {/* Header del modal de vista previa */}
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-medium text-slate-800">
                {vistaPrevia.descripcion || vistaPrevia.nombre_archivo}
              </h4>
              <div className="flex items-center space-x-2">
                {editandoDescripcion === vistaPrevia.id ? (
                  <>
                    <input
                      type="text"
                      value={descripcionTemp}
                      onChange={(e) => setDescripcionTemp(e.target.value)}
                      placeholder="Descripción..."
                      className="px-3 py-1 border border-slate-200 rounded text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          actualizarDescripcion(vistaPrevia.id, descripcionTemp);
                        }
                      }}
                    />
                    <button
                      onClick={() => actualizarDescripcion(vistaPrevia.id, descripcionTemp)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditandoDescripcion(null)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded"
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
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded"
                    title="Editar descripción"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setVistaPrevia(null)}
                  className="p-2 hover:bg-slate-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del modal de vista previa */}
            <div className="p-6 flex-1 overflow-auto bg-slate-50">
              {esPDF(vistaPrevia.url_foto) ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-20 h-20 text-slate-400 mb-4" />
                  <p className="text-slate-600 mb-4">Archivo PDF</p>
                  <a
                    href={vistaPrevia.url_foto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Abrir PDF en nueva pestaña
                  </a>
                </div>
              ) : (
                <img
                  src={vistaPrevia.url_foto}
                  alt={vistaPrevia.descripcion}
                  className="max-w-full max-h-[70vh] object-contain mx-auto rounded"
                />
              )}
            </div>

            {/* Footer del modal de vista previa */}
            <div className="p-4 bg-white border-t text-sm text-slate-600 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{vistaPrevia.nombre_archivo}</span>
                <span className="text-slate-400">•</span>
                <span>{formatearTamaño(vistaPrevia.tamaño_archivo)}</span>
              </div>
              <button
                onClick={() => {
                  eliminarFoto(vistaPrevia.id);
                  setVistaPrevia(null);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalFotosAsiento;
