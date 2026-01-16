// Utilidades para descarga de archivos
import JSZip from 'jszip';
import { fotosService } from '../modules/ventas/hooks/useFotos';

// Descargar una imagen individual
export const descargarImagen = async (url, nombreArchivo) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const link = document.createElement('a');
    const blobUrl = URL.createObjectURL(blob);
    link.href = blobUrl;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup después de un tiempo para permitir que el navegador complete la descarga
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 10000);
  } catch (error) {
    console.error('Error descargando imagen:', error);
    alert('Error al descargar la imagen');
  }
};

// Descargar todas las fotos de un producto en ZIP
export const descargarFotosProducto = async (productoId, tipoProducto, nombreProducto = '') => {
  try {
    // Obtener todas las fotos del producto
    const fotos = await fotosService.getFotosByProducto(productoId, tipoProducto);
    
    if (fotos.length === 0) {
      alert('Este producto no tiene fotos para descargar');
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder(`${tipoProducto}_${productoId}_${nombreProducto}`.replace(/[^a-zA-Z0-9_-]/g, '_'));

    // Descargar y agregar cada foto al ZIP
    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];
      try {
        const response = await fetch(foto.url_foto);
        const blob = await response.blob();
        
        const extension = foto.nombre_archivo.split('.').pop() || 'jpg';
        const nombreFoto = foto.es_principal 
          ? `01_PRINCIPAL_${foto.nombre_archivo}`
          : `${String(i + 1).padStart(2, '0')}_${foto.nombre_archivo}`;
        
        folder.file(nombreFoto, blob);
      } catch (error) {
        console.error(`Error descargando foto ${foto.nombre_archivo}:`, error);
      }
    }

    // Generar y descargar el ZIP
    const contenidoZip = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    const zipUrl = URL.createObjectURL(contenidoZip);
    link.href = zipUrl;
    link.download = `Fotos_${tipoProducto}_${productoId}_${nombreProducto}`.replace(/[^a-zA-Z0-9_-]/g, '_') + '.zip';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup después de un tiempo para permitir que el navegador complete la descarga
    setTimeout(() => {
      URL.revokeObjectURL(zipUrl);
    }, 10000);
  } catch (error) {
    console.error('Error creando ZIP:', error);
    alert('Error al descargar las fotos: ' + error.message);
  }
};

// Abrir carpeta del producto (para sistemas que lo soporten)
export const abrirCarpetaProducto = (productoId, tipoProducto) => {
  // Esto funciona principalmente en aplicaciones Electron
  if (window.electronAPI) {
    window.electronAPI.openProductFolder(productoId, tipoProducto);
  } else {
    alert('Esta función requiere la aplicación de escritorio');
  }
};