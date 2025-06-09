// src/lib/fotos.js - Service + Hook completo
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

// 📊 SERVICE: Operaciones de gestión de fotos de productos
export const fotosService = {
  // 📋 Obtener fotos de un producto
  async getFotosByProducto(productoId, tipoProducto) {
    console.log('📋 Obteniendo fotos de:', tipoProducto, productoId);
    
    const { data, error } = await supabase
      .from('fotos_productos')
      .select('*')
      .eq('producto_id', productoId)
      .eq('tipo_producto', tipoProducto)
      .order('orden', { ascending: true });
    
    if (error) {
      console.error('❌ Error obteniendo fotos:', error);
      throw error;
    }
    
    return data || [];
  },

  // 📷 Subir una foto
  async subirFoto(archivo, productoId, tipoProducto, descripcion = '', esPrincipal = false) {
    console.log('📷 Subiendo foto para:', tipoProducto, productoId);
    
    try {
      // Validaciones básicas
      if (!archivo || !archivo.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }
      
      if (archivo.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar 5MB');
      }
      
      // Verificar límite de fotos
      const fotosExistentes = await this.getFotosByProducto(productoId, tipoProducto);
      if (fotosExistentes.length >= 5) {
        throw new Error('No se pueden subir más de 5 fotos por producto');
      }
      
      // Generar nombre único
      const timestamp = Date.now();
      const extension = archivo.name.split('.').pop();
      const nombreArchivo = `${tipoProducto}_${productoId}_${timestamp}.${extension}`;
      const rutaCompleta = `productos/${tipoProducto}s/${nombreArchivo}`;
      
      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-productos')
        .upload(rutaCompleta, archivo, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError);
        throw uploadError;
      }
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('fotos-productos')
        .getPublicUrl(rutaCompleta);
      
      if (!urlData?.publicUrl) {
        throw new Error('No se pudo obtener la URL pública');
      }
      
      // Si es la primera foto o se marca como principal, desmarcar otras
      if (esPrincipal || fotosExistentes.length === 0) {
        await this.desmarcarFotoPrincipal(productoId, tipoProducto);
        esPrincipal = true;
      }
      
      // Calcular siguiente orden
      const siguienteOrden = Math.max(0, ...fotosExistentes.map(f => f.orden || 0)) + 1;
      
      // Guardar en base de datos
      const { data: fotoData, error: dbError } = await supabase
        .from('fotos_productos')
        .insert([{
          producto_id: productoId,
          tipo_producto: tipoProducto,
          url_foto: urlData.publicUrl,
          nombre_archivo: nombreArchivo,
          tamaño_archivo: archivo.size,
          orden: siguienteOrden,
          es_principal: esPrincipal,
          descripcion: descripcion
        }])
        .select()
        .single();
      
      if (dbError) {
        // Si falla la BD, eliminar archivo
        await supabase.storage
          .from('fotos-productos')
          .remove([rutaCompleta]);
        throw dbError;
      }
      
      console.log('✅ Foto subida exitosamente:', nombreArchivo);
      return fotoData;
      
    } catch (error) {
      console.error('❌ Error subiendo foto:', error);
      throw error;
    }
  },
  
  // 🗑️ Eliminar una foto
  async eliminarFoto(fotoId) {
    console.log('🗑️ Eliminando foto ID:', fotoId);
    
    try {
      // Obtener datos de la foto
      const { data: foto, error: fotoError } = await supabase
        .from('fotos_productos')
        .select('*')
        .eq('id', fotoId)
        .single();
      
      if (fotoError || !foto) {
        throw new Error('Foto no encontrada');
      }
      
      // Eliminar archivo del storage
      const rutaArchivo = `productos/${foto.tipo_producto}s/${foto.nombre_archivo}`;
      const { error: storageError } = await supabase.storage
        .from('fotos-productos')
        .remove([rutaArchivo]);
      
      if (storageError) {
        console.warn('⚠️ Error eliminando archivo:', storageError);
      }
      
      // Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('fotos_productos')
        .delete()
        .eq('id', fotoId);
      
      if (dbError) {
        throw dbError;
      }
      
      // Si era principal, marcar otra como principal
      if (foto.es_principal) {
        await this.marcarPrimeraComoPrincipal(foto.producto_id, foto.tipo_producto);
      }
      
      console.log('✅ Foto eliminada exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error eliminando foto:', error);
      throw error;
    }
  },
  
  // ⭐ Marcar foto como principal
  async marcarComoPrincipal(fotoId) {
    console.log('⭐ Marcando foto como principal:', fotoId);
    
    try {
      // Obtener datos de la foto
      const { data: foto, error: fotoError } = await supabase
        .from('fotos_productos')
        .select('*')
        .eq('id', fotoId)
        .single();
      
      if (fotoError || !foto) {
        throw new Error('Foto no encontrada');
      }
      
      // Desmarcar otras fotos principales
      await this.desmarcarFotoPrincipal(foto.producto_id, foto.tipo_producto);
      
      // Marcar esta como principal
      const { error: updateError } = await supabase
        .from('fotos_productos')
        .update({ es_principal: true })
        .eq('id', fotoId);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log('✅ Foto marcada como principal');
      return true;
      
    } catch (error) {
      console.error('❌ Error marcando foto como principal:', error);
      throw error;
    }
  },
  
  // 📝 Actualizar descripción
  async actualizarDescripcion(fotoId, nuevaDescripcion) {
    console.log('📝 Actualizando descripción de foto:', fotoId);
    
    const { data, error } = await supabase
      .from('fotos_productos')
      .update({ descripcion: nuevaDescripcion })
      .eq('id', fotoId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error actualizando descripción:', error);
      throw error;
    }
    
    return data;
  },
  
  // 📊 Obtener estadísticas básicas
  async getEstadisticasFotos() {
    console.log('📊 Obteniendo estadísticas de fotos...');
    
    try {
      // Obtener todos los productos de las 3 tablas
      const [computadoras, celulares, otros] = await Promise.all([
        supabase.from('inventario').select('id').eq('disponible', true),
        supabase.from('celulares').select('id').eq('disponible', true),
        supabase.from('otros').select('id').eq('disponible', true)
      ]);
      
      // Obtener fotos agrupadas por tipo
      const { data: fotosData, error: fotosError } = await supabase
        .from('fotos_productos')
        .select('producto_id, tipo_producto, es_principal');
      
      if (fotosError) throw fotosError;
      
      const totalComputadoras = computadoras.data?.length || 0;
      const totalCelulares = celulares.data?.length || 0;
      const totalOtros = otros.data?.length || 0;
      const totalProductos = totalComputadoras + totalCelulares + totalOtros;
      
      // Calcular estadísticas por tipo
      const computadorasConFotos = new Set();
      const celularesConFotos = new Set();
      const otrosConFotos = new Set();
      let productosConPrincipal = 0;
      
      fotosData?.forEach(foto => {
        if (foto.tipo_producto === 'computadora') {
          computadorasConFotos.add(foto.producto_id);
        } else if (foto.tipo_producto === 'celular') {
          celularesConFotos.add(foto.producto_id);
        } else if (foto.tipo_producto === 'otro') {
          otrosConFotos.add(foto.producto_id);
        }
        
        if (foto.es_principal) {
          productosConPrincipal++;
        }
      });
      
      const totalConFotos = computadorasConFotos.size + celularesConFotos.size + otrosConFotos.size;
      const totalSinFotos = totalProductos - totalConFotos;
      
      return {
        totalProductos,
        conFotos: totalConFotos,
        sinFotos: totalSinFotos,
        conPrincipal: productosConPrincipal,
        porcentajeCompleto: totalProductos > 0 ? Math.round((productosConPrincipal / totalProductos) * 100) : 0,
        porTipo: {
          computadora: {
            total: totalComputadoras,
            conFotos: computadorasConFotos.size,
            sinFotos: totalComputadoras - computadorasConFotos.size
          },
          celular: {
            total: totalCelulares,
            conFotos: celularesConFotos.size,
            sinFotos: totalCelulares - celularesConFotos.size
          },
          otro: {
            total: totalOtros,
            conFotos: otrosConFotos.size,
            sinFotos: totalOtros - otrosConFotos.size
          }
        }
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  },
  
  // 🛠️ Funciones auxiliares
  async desmarcarFotoPrincipal(productoId, tipoProducto) {
    const { error } = await supabase
      .from('fotos_productos')
      .update({ es_principal: false })
      .eq('producto_id', productoId)
      .eq('tipo_producto', tipoProducto)
      .eq('es_principal', true);
    
    if (error) {
      console.warn('⚠️ Error desmarcando foto principal:', error);
    }
  },
  
  async marcarPrimeraComoPrincipal(productoId, tipoProducto) {
    const fotos = await this.getFotosByProducto(productoId, tipoProducto);
    if (fotos.length > 0) {
      await this.marcarComoPrincipal(fotos[0].id);
    }
  }
};

// 🎣 HOOK: Lógica de React para fotos
export function useFotos() {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);

  const fetchFotos = async (productoId, tipoProducto) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fotosService.getFotosByProducto(productoId, tipoProducto);
      setFotos(data);
    } catch (err) {
      console.error('Error en useFotos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subirFoto = async (archivo, productoId, tipoProducto, descripcion, esPrincipal) => {
    try {
      setError(null);
      const nuevaFoto = await fotosService.subirFoto(archivo, productoId, tipoProducto, descripcion, esPrincipal);
      setFotos(prev => [...prev, nuevaFoto].sort((a, b) => a.orden - b.orden));
      return nuevaFoto;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const eliminarFoto = async (fotoId) => {
    try {
      setError(null);
      await fotosService.eliminarFoto(fotoId);
      setFotos(prev => prev.filter(foto => foto.id !== fotoId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const marcarComoPrincipal = async (fotoId) => {
    try {
      setError(null);
      await fotosService.marcarComoPrincipal(fotoId);
      setFotos(prev => prev.map(foto => ({
        ...foto,
        es_principal: foto.id === fotoId
      })));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const actualizarDescripcion = async (fotoId, nuevaDescripcion) => {
    try {
      setError(null);
      await fotosService.actualizarDescripcion(fotoId, nuevaDescripcion);
      setFotos(prev => prev.map(foto => 
        foto.id === fotoId 
          ? { ...foto, descripcion: nuevaDescripcion }
          : foto
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const fetchEstadisticas = async () => {
    try {
      setError(null);
      const stats = await fotosService.getEstadisticasFotos();
      setEstadisticas(stats);
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    fotos,
    loading,
    error,
    estadisticas,
    fetchFotos,
    subirFoto,
    eliminarFoto,
    marcarComoPrincipal,
    actualizarDescripcion,
    fetchEstadisticas
  };
}