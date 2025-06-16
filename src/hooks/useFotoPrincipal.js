import { useState, useEffect } from 'react';
import { fotosService } from '../modules/ventas/hooks/useFotos';

export const useFotoPrincipal = (productoId, tipoProducto) => {
  const [fotoPrincipal, setFotoPrincipal] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const obtenerFotoPrincipal = async () => {
      if (!productoId || !tipoProducto) return;
      
      setLoading(true);
      try {
        const fotos = await fotosService.getFotosByProducto(productoId, tipoProducto);
        const principal = fotos.find(foto => foto.es_principal) || fotos[0];
        setFotoPrincipal(principal);
      } catch (error) {
        console.error('Error obteniendo foto principal:', error);
        setFotoPrincipal(null);
      } finally {
        setLoading(false);
      }
    };

    obtenerFotoPrincipal();
  }, [productoId, tipoProducto]);

  return { fotoPrincipal, loading };
};