import React from 'react';
import { Camera, Archive } from 'lucide-react';
import { useFotoPrincipal } from '../hooks/useFotoPrincipal';
import { descargarFotosProducto } from '../utils/downloadUtils';

const FotoProductoAvanzado = ({ productoId, tipoProducto, nombreProducto = '' }) => {
  const { fotoPrincipal, loading } = useFotoPrincipal(productoId, tipoProducto);

  const handleDescargarTodasFotos = async (e) => {
    e.stopPropagation();
    await descargarFotosProducto(productoId, tipoProducto, nombreProducto);
  };

  const handleVerFoto = (e) => {
    e.stopPropagation();
    if (fotoPrincipal) {
      window.open(fotoPrincipal.url_foto, '_blank');
    }
  };

  if (loading) {
    return (
      <td className="px-2 py-3 text-center whitespace-nowrap">
        <div className="w-12 h-12 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      </td>
    );
  }

  // Sin foto: Click directo para descargar todas
  if (!fotoPrincipal) {
    return (
      <td className="px-2 py-3 text-center whitespace-nowrap">
        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded border relative group cursor-pointer hover:bg-gray-200 transition-colors"
             onClick={handleDescargarTodasFotos}
             title="Descargar todas las fotos">
          <Camera className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        </div>
      </td>
    );
  }

  // Con foto: Click para ver, hover para mostrar botón de descarga
  return (
    <td className="px-2 py-3 text-center whitespace-nowrap">
      <div className="w-12 h-12 relative group">
        <img 
          src={fotoPrincipal.url_foto} 
          alt="Foto del producto"
          className="w-12 h-12 object-cover rounded border cursor-pointer transition-all duration-200"
          onClick={handleVerFoto}
          title="Click para ver foto completa"
        />
        
        {/* Overlay con botón de descarga todas */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded transition-all duration-200 flex items-center justify-center">
          <button
            onClick={handleDescargarTodasFotos}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 bg-white rounded-full shadow-md hover:bg-gray-50"
            title="Descargar todas las fotos"
          >
            <Archive className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      </div>
    </td>
  );
};

export default FotoProductoAvanzado;