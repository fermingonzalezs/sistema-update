import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useRecibos = () => {
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar todos los documentos (recibos y remitos) con sus items
  const fetchRecibos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar documentos con información del cliente
      const { data: documentosData, error: documentosError } = await supabase
        .from('recibos_remitos')
        .select(`
          *,
          clientes (
            nombre,
            apellido,
            telefono,
            nombre,
            apellido,
            telefono,
            email,
            direccion
          )
        `)
        .order('fecha', { ascending: false });

      if (documentosError) throw documentosError;

      // Cargar items de cada documento
      const documentosConItems = await Promise.all(
        documentosData.map(async (documento) => {
          const { data: items, error: itemsError } = await supabase
            .from('recibos_remitos_items')
            .select('*')
            .eq('recibo_id', documento.id)
            .order('orden', { ascending: true });

          if (itemsError) throw itemsError;

          return {
            ...documento,
            items: items || []
          };
        })
      );

      setRecibos(documentosConItems);
    } catch (err) {
      console.error('Error al cargar documentos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generar número de documento automático según tipo
  const generarNumeroDocumento = async (tipoDocumento) => {
    try {
      const year = new Date().getFullYear();
      const prefijo = tipoDocumento === 'remito' ? 'REM' : 'REC';

      // Buscar el último número de documento del año actual y tipo
      const { data, error } = await supabase
        .from('recibos_remitos')
        .select('numero_recibo')
        .eq('tipo_documento', tipoDocumento)
        .like('numero_recibo', `${prefijo}-${year}-%`)
        .order('numero_recibo', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        // Extraer el número y sumar 1
        const ultimoNumero = data[0].numero_recibo;
        const numero = parseInt(ultimoNumero.split('-')[2]) + 1;
        return `${prefijo}-${year}-${numero.toString().padStart(4, '0')}`;
      } else {
        // Primer documento del año
        return `${prefijo}-${year}-0001`;
      }
    } catch (err) {
      console.error('Error al generar número de documento:', err);
      throw err;
    }
  };

  // Crear nuevo documento (recibo o remito) con sus items
  const crearDocumento = async (documentoData) => {
    try {
      setError(null);

      const tipoDocumento = documentoData.tipo_documento || 'recibo';

      // Generar número de documento
      const numeroDocumento = await generarNumeroDocumento(tipoDocumento);

      // Preparar datos base del documento
      const nuevoDocumento = {
        numero_recibo: numeroDocumento,
        tipo_documento: tipoDocumento,
        fecha: documentoData.fecha || new Date().toISOString(),
        cliente_id: documentoData.cliente_id,
        cliente_nombre: documentoData.cliente_nombre,
        cliente_nombre: documentoData.cliente_nombre,
        cliente_direccion: documentoData.cliente_direccion || '',
        cliente_telefono: documentoData.cliente_telefono || '',
        cliente_email: documentoData.cliente_email || '',
        created_by: documentoData.created_by || ''
      };

      // Agregar campos específicos según tipo de documento
      if (tipoDocumento === 'recibo') {
        nuevoDocumento.metodo_pago = documentoData.metodo_pago || 'efectivo';
        nuevoDocumento.moneda = documentoData.moneda || 'USD';
        nuevoDocumento.descuento = documentoData.descuento || 0;
        nuevoDocumento.total = documentoData.total;
        nuevoDocumento.observaciones = documentoData.observaciones || '';
      } else if (tipoDocumento === 'remito') {
        nuevoDocumento.fecha_entrega = documentoData.fecha_entrega || null;
        nuevoDocumento.quien_retira = documentoData.quien_retira || '';
        nuevoDocumento.observaciones = documentoData.observaciones || '';
      }

      // Insertar documento
      const { data: documentoInsertado, error: documentoError } = await supabase
        .from('recibos_remitos')
        .insert([nuevoDocumento])
        .select()
        .single();

      if (documentoError) throw documentoError;

      // Insertar items
      if (documentoData.items && documentoData.items.length > 0) {
        const itemsConDocumentoId = documentoData.items.map((item, index) => ({
          recibo_id: documentoInsertado.id,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precio_unitario: tipoDocumento === 'recibo' ? item.precio_unitario : null,
          precio_total: tipoDocumento === 'recibo' ? item.precio_total : null,
          serial: item.serial || null,
          orden: index
        }));

        const { error: itemsError } = await supabase
          .from('recibos_remitos_items')
          .insert(itemsConDocumentoId);

        if (itemsError) throw itemsError;
      }

      // Recargar documentos
      await fetchRecibos();

      return { success: true, documento: documentoInsertado };
    } catch (err) {
      console.error('Error al crear documento:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Mantener compatibilidad con código existente
  const crearRecibo = (reciboData) => {
    return crearDocumento({ ...reciboData, tipo_documento: 'recibo' });
  };

  // Crear remito
  const crearRemito = (remitoData) => {
    return crearDocumento({ ...remitoData, tipo_documento: 'remito' });
  };

  // Eliminar documento
  const eliminarDocumento = async (documentoId) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('recibos_remitos')
        .delete()
        .eq('id', documentoId);

      if (error) throw error;

      // Recargar documentos
      await fetchRecibos();

      return { success: true };
    } catch (err) {
      console.error('Error al eliminar documento:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Mantener compatibilidad
  const eliminarRecibo = eliminarDocumento;

  // Obtener un documento específico con sus items
  const obtenerDocumento = async (documentoId) => {
    try {
      const { data: documento, error: documentoError } = await supabase
        .from('recibos_remitos')
        .select('*')
        .eq('id', documentoId)
        .single();

      if (documentoError) throw documentoError;

      const { data: items, error: itemsError } = await supabase
        .from('recibos_remitos_items')
        .select('*')
        .eq('recibo_id', documentoId)
        .order('orden', { ascending: true });

      if (itemsError) throw itemsError;

      return {
        ...documento,
        items: items || []
      };
    } catch (err) {
      console.error('Error al obtener documento:', err);
      throw err;
    }
  };

  // Mantener compatibilidad
  const obtenerRecibo = obtenerDocumento;

  // Cargar documentos al montar el componente
  useEffect(() => {
    fetchRecibos();
  }, []);

  return {
    recibos,
    loading,
    error,
    crearRecibo,
    crearRemito,
    crearDocumento,
    eliminarRecibo,
    eliminarDocumento,
    obtenerRecibo,
    obtenerDocumento,
    refetch: fetchRecibos
  };
};
