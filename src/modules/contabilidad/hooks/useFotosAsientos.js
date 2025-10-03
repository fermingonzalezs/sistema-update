import { supabase } from '../../../lib/supabase';

// Servicio para gestión de fotos de asientos contables
export const fotosAsientosService = {
  /**
   * Obtiene todas las fotos de un asiento
   */
  async getFotosByAsiento(asientoId) {
    try {
      const { data, error } = await supabase
        .from('fotos_asientos_contables')
        .select('*')
        .eq('asiento_id', asientoId)
        .order('orden', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo fotos del asiento:', error);
      throw error;
    }
  },

  /**
   * Sube una foto para un asiento contable
   */
  async subirFoto(archivo, asientoId, descripcion = '') {
    try {
      // Validar que el archivo sea una imagen o PDF
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!tiposPermitidos.includes(archivo.type)) {
        throw new Error('Solo se permiten imágenes (JPG, PNG, WEBP) o archivos PDF');
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (archivo.size > maxSize) {
        throw new Error('El archivo no puede superar los 5MB');
      }

      // Verificar cuántas fotos ya tiene el asiento
      const fotosExistentes = await this.getFotosByAsiento(asientoId);
      if (fotosExistentes.length >= 3) {
        throw new Error('Ya se alcanzó el límite de 3 fotos por asiento');
      }

      // Determinar el orden de la nueva foto
      const orden = fotosExistentes.length + 1;

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const extension = archivo.name.split('.').pop();
      const nombreArchivo = `asiento_${asientoId}_${timestamp}_${orden}.${extension}`;
      const rutaStorage = `asientos-contables/${nombreArchivo}`;

      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-asientos')
        .upload(rutaStorage, archivo, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError);
        throw new Error('Error al subir el archivo: ' + uploadError.message);
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('fotos-asientos')
        .getPublicUrl(rutaStorage);

      // Guardar registro en la base de datos
      const { data: fotoData, error: dbError } = await supabase
        .from('fotos_asientos_contables')
        .insert([{
          asiento_id: asientoId,
          url_foto: urlData.publicUrl,
          nombre_archivo: archivo.name,
          tamaño_archivo: archivo.size,
          orden: orden,
          descripcion: descripcion
        }])
        .select()
        .single();

      if (dbError) {
        // Si falla la inserción en BD, intentar eliminar el archivo subido
        await supabase.storage.from('fotos-asientos').remove([rutaStorage]);
        throw dbError;
      }

      return fotoData;
    } catch (error) {
      console.error('Error en subirFoto:', error);
      throw error;
    }
  },

  /**
   * Elimina una foto
   */
  async eliminarFoto(fotoId) {
    try {
      // Obtener información de la foto antes de eliminarla
      const { data: foto, error: fetchError } = await supabase
        .from('fotos_asientos_contables')
        .select('*')
        .eq('id', fotoId)
        .single();

      if (fetchError) throw fetchError;

      // Extraer ruta del storage desde la URL
      const url = new URL(foto.url_foto);
      const rutaStorage = url.pathname.split('/fotos-asientos/')[1];

      // Eliminar archivo del storage
      if (rutaStorage) {
        const { error: storageError } = await supabase.storage
          .from('fotos-asientos')
          .remove([`asientos-contables/${rutaStorage}`]);

        if (storageError) {
          console.warn('Error eliminando archivo del storage:', storageError);
        }
      }

      // Eliminar registro de la base de datos
      const { error: deleteError } = await supabase
        .from('fotos_asientos_contables')
        .delete()
        .eq('id', fotoId);

      if (deleteError) throw deleteError;

      // Reorganizar el orden de las fotos restantes
      await this.reorganizarOrden(foto.asiento_id);

      return true;
    } catch (error) {
      console.error('Error eliminando foto:', error);
      throw error;
    }
  },

  /**
   * Actualiza la descripción de una foto
   */
  async actualizarDescripcion(fotoId, nuevaDescripcion) {
    try {
      const { data, error } = await supabase
        .from('fotos_asientos_contables')
        .update({ descripcion: nuevaDescripcion })
        .eq('id', fotoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error actualizando descripción:', error);
      throw error;
    }
  },

  /**
   * Reorganiza el orden de las fotos después de eliminar una
   */
  async reorganizarOrden(asientoId) {
    try {
      const fotos = await this.getFotosByAsiento(asientoId);

      // Actualizar el orden secuencialmente
      for (let i = 0; i < fotos.length; i++) {
        const nuevoOrden = i + 1;
        if (fotos[i].orden !== nuevoOrden) {
          await supabase
            .from('fotos_asientos_contables')
            .update({ orden: nuevoOrden })
            .eq('id', fotos[i].id);
        }
      }
    } catch (error) {
      console.error('Error reorganizando orden:', error);
      // No lanzar error, es una operación de limpieza
    }
  },

  /**
   * Verifica si un asiento tiene fotos
   */
  async tieneFotos(asientoId) {
    try {
      const fotos = await this.getFotosByAsiento(asientoId);
      return fotos.length > 0;
    } catch (error) {
      console.error('Error verificando fotos:', error);
      return false;
    }
  }
};

export default fotosAsientosService;
