import { supabase } from '../../../lib/supabase';
import { normalizeCondicion, normalizeUbicacion } from '../../../shared/constants/productConstants';

export const stockIntegrationService = {
  /**
   * Procesar item a stock (insertar en inventario/celulares/otros)
   */
  async procesarItemAStock(item) {
    try {
      const { tipo_producto, datos_producto } = item;

      // Determinar tabla destino
      const tablaDestino =
        tipo_producto === 'notebook' ? 'inventario' :
        tipo_producto === 'celular' ? 'celulares' :
        'otros';

      // Normalizar datos según tipo
      const datosNormalizados = normalizarDatosProducto(tipo_producto, datos_producto);

      // Insertar en tabla correspondiente
      const { data, error } = await supabase
        .from(tablaDestino)
        .insert(datosNormalizados)
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        tabla: tablaDestino,
        id: data.id
      };
    } catch (error) {
      console.error(`❌ Error procesando item a stock:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Procesar item a testeo (insertar en testeo_equipos)
   */
  async procesarItemATesteo(item) {
    try {
      const { tipo_producto, datos_producto } = item;

      // Extraer campos necesarios para testeo_equipos (incluye precios y categorías)
      const datosTesteo = {
        tipo: tipo_producto === 'notebook' ? 'notebook' : tipo_producto === 'celular' ? 'celular' : 'otro',
        serial: datos_producto.serial || null,
        modelo: datos_producto.modelo,
        marca: datos_producto.marca || null,
        categoria: datos_producto.categoria || null,
        proveedor: datos_producto.proveedor || 'No especificado',
        observaciones: datos_producto.observaciones || datos_producto.fallas || null,
        estado_testeo: 'pendiente',
        checklist_completado: false,
        estado_estetico: datos_producto.estado_estetico || datos_producto.estado || 'bueno',
        observaciones_testeo: null,

        // 💰 Precios y costos
        precio_compra_usd: parseFloat(datos_producto.precio_compra_usd || datos_producto.precio_costo_usd || 0),
        precio_venta_usd: parseFloat(datos_producto.precio_venta_usd || 0),
        costos_adicionales: parseFloat(datos_producto.costos_adicionales || datos_producto.envios_repuestos || 0),

        // 📱 Especificaciones - Celulares
        capacidad: datos_producto.capacidad || null,
        bateria: datos_producto.bateria || null,
        ciclos: datos_producto.ciclos ? parseInt(datos_producto.ciclos) : null,
        ram: datos_producto.ram || null,
        sim_esim: datos_producto.sim_esim || 'SIM',

        // 💻 Especificaciones - Notebooks
        procesador: datos_producto.procesador || null,
        slots: datos_producto.slots || null,
        tipo_ram: datos_producto.tipo_ram || null,
        ssd: datos_producto.ssd || null,
        hdd: datos_producto.hdd || null,
        so: datos_producto.so || null,
        pantalla: datos_producto.pantalla || null,
        resolucion: datos_producto.resolucion || null,
        refresh: datos_producto.refresh || null,
        touchscreen: datos_producto.touchscreen || false,
        placa_video: datos_producto.placa_video || null,
        vram: datos_producto.vram || null,
        teclado_retro: datos_producto.teclado_retro || false,
        idioma_teclado: datos_producto.idioma_teclado || null,

        // 🎨 General
        color: datos_producto.color || null,
        duracion: datos_producto.duracion || null,
        garantia: datos_producto.garantia || datos_producto.garantia_update || '3 meses',
        garantia_oficial: datos_producto.garantia_oficial || datos_producto.garantia_oficial_fecha || null,
        fotos: datos_producto.fotos || null,
        ingreso: datos_producto.ingreso || new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('testeo_equipos')
        .insert(datosTesteo)
        .select('id')
        .single();

      if (error) throw error;

      console.log(`✅ Item procesado a testeo:`, {
        id: data.id,
        serial: datosTesteo.serial,
        modelo: datos_producto.modelo,
        marca: datos_producto.marca,
        tipo: tipo_producto,
        categoria: datosTesteo.categoria,
        precio_compra: datosTesteo.precio_compra_usd,
        precio_venta: datosTesteo.precio_venta_usd
      });

      return {
        success: true,
        tabla: 'testeo_equipos',
        id: data.id
      };
    } catch (error) {
      console.error(`❌ Error procesando item a testeo:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

/**
 * Normalizar datos de producto según tipo para insertar en inventario
 */
function normalizarDatosProducto(tipo_producto, datos_producto) {
  // Normalizar condicion y ubicacion
  const condicionNormalizada = normalizeCondicion(datos_producto.condicion || 'nuevo');
  const ubicacionNormalizada = normalizeUbicacion(datos_producto.sucursal || 'la_plata');

  if (tipo_producto === 'notebook') {
    return {
      // Datos básicos
      serial: datos_producto.serial,
      modelo: datos_producto.modelo,
      marca: datos_producto.marca,
      categoria: datos_producto.categoria || 'windows',

      // Condición y estado
      condicion: condicionNormalizada,
      estado: datos_producto.estado || 'A',
      sucursal: ubicacionNormalizada,

      // Precios
      precio_costo_usd: parseFloat(datos_producto.precio_costo_usd) || 0,
      envios_repuestos: parseFloat(datos_producto.envios_repuestos) || 0,
      precio_venta_usd: parseFloat(datos_producto.precio_venta_usd) || 0,

      // Especificaciones
      procesador: datos_producto.procesador || null,
      slots: datos_producto.slots || null,
      tipo_ram: datos_producto.tipo_ram || null,
      ram: datos_producto.ram || null,
      ssd: datos_producto.ssd || null,
      hdd: datos_producto.hdd || null,
      so: datos_producto.so || null,
      pantalla: datos_producto.pantalla || null,
      resolucion: datos_producto.resolucion || null,
      refresh: datos_producto.refresh || null,
      touchscreen: datos_producto.touchscreen || false,
      placa_video: datos_producto.placa_video || null,
      vram: datos_producto.vram || null,
      teclado_retro: datos_producto.teclado_retro || false,
      idioma_teclado: datos_producto.idioma_teclado || null,
      color: datos_producto.color || null,
      bateria: datos_producto.bateria || null,
      duracion: datos_producto.duracion || null,

      // Garantía
      garantia_update: datos_producto.garantia_update || '3 meses',
      garantia_oficial: datos_producto.garantia_oficial || null,
      fallas: datos_producto.fallas || 'Ninguna',

      // Metadata
      fotos: datos_producto.fotos || null,
      ingreso: datos_producto.ingreso || new Date().toISOString().split('T')[0]
    };
  }

  if (tipo_producto === 'celular') {
    return {
      // Datos básicos
      serial: datos_producto.serial,
      modelo: datos_producto.modelo,
      marca: datos_producto.marca,
      categoria: datos_producto.categoria || 'android',
      capacidad: datos_producto.capacidad || null,
      color: datos_producto.color || null,

      // Condición y estado
      condicion: condicionNormalizada,
      estado: datos_producto.estado || 'A',
      sucursal: ubicacionNormalizada,

      // Precios
      precio_compra_usd: parseFloat(datos_producto.precio_compra_usd) || 0,
      costos_adicionales: parseFloat(datos_producto.costos_adicionales) || 0,
      precio_venta_usd: parseFloat(datos_producto.precio_venta_usd) || 0,

      // Device info
      bateria: datos_producto.bateria || null,
      ciclos: parseInt(datos_producto.ciclos) || 0,
      ram: datos_producto.ram || null,
      sim_esim: datos_producto.sim_esim || 'SIM',

      // Garantía
      garantia: datos_producto.garantia || '3 meses',
      garantia_oficial_fecha: datos_producto.garantia_oficial_fecha || null,
      fallas: datos_producto.fallas || 'Ninguna',

      // Metadata
      fotos: datos_producto.fotos || null,
      ingreso: datos_producto.ingreso || new Date().toISOString().split('T')[0]
    };
  }

  // Otros (categoría genérica)
  if (tipo_producto === 'otro') {
    return {
      // Datos básicos
      nombre_producto: datos_producto.nombre_producto,
      descripcion: datos_producto.descripcion || null,
      categoria: datos_producto.categoria || 'ACCESORIOS',
      marca: datos_producto.marca || null,
      modelo: datos_producto.modelo || null,
      color: datos_producto.color || null,

      // Condición (otros no tiene estado)
      condicion: condicionNormalizada,

      // Precios
      precio_compra_usd: parseFloat(datos_producto.precio_compra_usd) || 0,
      costos_adicionales: parseFloat(datos_producto.costos_adicionales) || 0,
      precio_venta_usd: parseFloat(datos_producto.precio_venta_usd) || 0,

      // Cantidades por sucursal
      cantidad_la_plata: parseInt(datos_producto.cantidad_la_plata) || 0,
      cantidad_mitre: parseInt(datos_producto.cantidad_mitre) || 0,

      // Serial (opcional para items únicos)
      serial: datos_producto.serial || null,

      // Desktop specs (si aplica)
      ...(datos_producto.categoria === 'DESKTOP' && {
        motherboard: datos_producto.motherboard || null,
        memoria: datos_producto.memoria || null,
        gpu: datos_producto.gpu || null,
        ssd: datos_producto.ssd || null,
        hdd: datos_producto.hdd || null,
        gabinete: datos_producto.gabinete || null,
        fuente: datos_producto.fuente || null
      }),

      // Garantía
      garantia: datos_producto.garantia || '3 meses',
      garantia_oficial_fecha: datos_producto.garantia_oficial_fecha || null,
      observaciones: datos_producto.observaciones || null,

      // Metadata
      fotos: datos_producto.fotos || null,
      ingreso: datos_producto.ingreso || new Date().toISOString().split('T')[0]
    };
  }

  return datos_producto;
}
