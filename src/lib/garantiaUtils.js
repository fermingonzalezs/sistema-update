import { supabase } from './supabase';

/**
 * Función unificada para calcular la garantía de un producto
 * @param {string} serialProducto - Serial del producto a consultar
 * @param {string} copy - Copy del producto como fallback (opcional)
 * @param {string} tipoProducto - Tipo: 'computadora', 'celular', 'otro'
 * @returns {Promise<{diasGarantia: number, garantiaTexto: string, fuente: string}>}
 */
export const calcularGarantiaProducto = async (serialProducto, copy = '', tipoProducto = 'computadora') => {
  console.log(`🔍 [GARANTIA UTILS] Calculando garantía - Serial: ${serialProducto}, Tipo: ${tipoProducto}`);
  
  let diasGarantia = 30; // Por defecto
  let garantiaTexto = '1 mes';
  let fuente = 'fallback';
  
  try {
    if (tipoProducto === 'computadora') {
      // Primero: Buscar en inventario
      const { data: inventarioData, error: inventarioError } = await supabase
        .from('inventario')
        .select('garantia_update, condicion, marca, modelo')
        .eq('serial', serialProducto)
        .single();

      if (!inventarioError && inventarioData) {
        // ✅ FUENTE: Inventario real
        const garantiaOriginal = inventarioData.garantia_update || '3 meses';
        const condicionReal = inventarioData.condicion || 'usado';
        fuente = 'inventario';
        
        console.log(`✅ [GARANTIA UTILS] Datos inventario - Serial: ${serialProducto}`);
        console.log(`✅ [GARANTIA UTILS] Garantía: "${garantiaOriginal}", Condición: "${condicionReal}"`);
        
        const resultado = parsearGarantia(garantiaOriginal, condicionReal);
        diasGarantia = resultado.dias;
        garantiaTexto = resultado.texto;
        
      } else {
        // ⚠️ FUENTE: Fallback con copy
        console.warn(`⚠️ [GARANTIA UTILS] No se encontró en inventario: ${serialProducto}`);
        console.log(`📝 [GARANTIA UTILS] Usando copy como fallback: "${copy}"`);
        
        const copyLower = copy?.toLowerCase() || '';
        let condicionFromCopy = 'usado'; // Por defecto
        
        // Buscar condición en el copy
        if (copyLower.includes('- nuevo') || copyLower.endsWith('nuevo')) {
          condicionFromCopy = 'nuevo';
        } else if (copyLower.includes('- usado') || copyLower.endsWith('usado')) {
          condicionFromCopy = 'usado';
        } else if (copyLower.includes('- reparacion') || copyLower.includes('reparación')) {
          condicionFromCopy = 'reparacion';
        }
        
        console.log(`🔍 [GARANTIA UTILS] Condición extraída del copy: "${condicionFromCopy}"`);
        fuente = 'copy';
        
        // Asignar garantía según condición extraída
        if (condicionFromCopy === 'nuevo') {
          diasGarantia = 180;
          garantiaTexto = '6 meses';
          console.log(`✅ [GARANTIA UTILS] Producto NUEVO detectado en copy - 6 meses`);
        } else {
          diasGarantia = 90;
          garantiaTexto = '3 meses';
          console.log(`✅ [GARANTIA UTILS] Producto USADO detectado en copy - 3 meses`);
        }
      }
      
    } else if (tipoProducto === 'celular') {
      diasGarantia = 30;
      garantiaTexto = '1 mes';
      fuente = 'regla_celular';
    } else {
      diasGarantia = 30;
      garantiaTexto = '1 mes';
      fuente = 'regla_otros';
    }
    
  } catch (error) {
    console.error('❌ [GARANTIA UTILS] Error al calcular garantía:', error);
    diasGarantia = 90;
    garantiaTexto = '3 meses';
    fuente = 'error_fallback';
  }
  
  console.log(`📅 [GARANTIA UTILS] RESULTADO - Serial: ${serialProducto}`);
  console.log(`📅 [GARANTIA UTILS] Garantía: "${garantiaTexto}" = ${diasGarantia} días (fuente: ${fuente})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  return {
    diasGarantia,
    garantiaTexto,
    fuente
  };
};

/**
 * Parsea el texto de garantía del inventario y convierte a días
 * @param {string} garantiaTexto - Texto como "6 meses", "1 año", etc.
 * @param {string} condicion - Condición: 'nuevo', 'usado', 'reparacion'
 * @returns {{dias: number, texto: string}}
 */
const parsearGarantia = (garantiaTexto, condicion) => {
  const garantiaLower = garantiaTexto.toLowerCase().trim();
  let dias = 90;
  let textoFinal = garantiaTexto;
  
  // Buscar patrones numéricos flexibles
  if (garantiaLower.includes('18 meses') || garantiaLower.includes('1.5 años') || garantiaLower.includes('año y medio')) {
    dias = 540; // 18 meses
  } else if (garantiaLower.includes('12 meses') || garantiaLower.includes('1 año') || garantiaLower.includes('un año')) {
    dias = 365; // 12 meses
  } else if (garantiaLower.includes('6 meses') || garantiaLower.includes('seis meses') || garantiaLower.includes('medio año')) {
    dias = 180; // 6 meses
  } else if (garantiaLower.includes('3 meses') || garantiaLower.includes('tres meses')) {
    // Si es producto nuevo pero dice 3 meses, usar 6 meses
    if (condicion === 'nuevo') {
      dias = 180; // 6 meses para productos nuevos
      textoFinal = '6 meses'; // Actualizar el texto mostrado
      console.log(`🔄 [GARANTIA UTILS] Producto NUEVO con 3 meses corregido a 6 meses`);
    } else {
      dias = 90; // 3 meses para productos usados
    }
  } else if (garantiaLower.includes('2 meses') || garantiaLower.includes('dos meses')) {
    dias = 60; // 2 meses
  } else if (garantiaLower.includes('1 mes') || garantiaLower.includes('un mes')) {
    dias = 30; // 1 mes
  } else {
    // Buscar números seguidos de 'mes' o 'año'
    const mesMatch = garantiaLower.match(/(\d+)\s*(mes|meses)/);
    const añoMatch = garantiaLower.match(/(\d+)\s*(año|años)/);
    
    if (mesMatch) {
      const meses = parseInt(mesMatch[1]);
      dias = meses * 30;
    } else if (añoMatch) {
      const años = parseInt(añoMatch[1]);
      dias = años * 365;
    } else {
      // Para productos nuevos sin garantía específica, usar 6 meses por defecto
      if (condicion === 'nuevo') {
        dias = 180;
        textoFinal = '6 meses';
      } else {
        dias = 90;
        textoFinal = '3 meses';
      }
    }
  }
  
  return { dias, texto: textoFinal };
};

/**
 * Convierte días de garantía a texto legible
 * @param {number} dias - Número de días
 * @returns {string} Texto como "6 meses", "1 año", etc.
 */
export const diasATexto = (dias) => {
  if (dias >= 365) {
    const años = Math.round(dias / 365);
    return años === 1 ? '1 año' : `${años} años`;
  } else if (dias >= 30) {
    const meses = Math.round(dias / 30);
    return meses === 1 ? '1 mes' : `${meses} meses`;
  } else {
    return `${dias} días`;
  }
};

/**
 * Genera el tipo de garantía para mostrar en la tabla
 * @param {string} tipoProducto - 'computadora', 'celular', 'otro'
 * @param {string} garantiaTexto - Texto de la garantía
 * @returns {string} Texto como "Computadora (6 meses)"
 */
export const generarTipoGarantia = (tipoProducto, garantiaTexto) => {
  if (tipoProducto === 'computadora') {
    return `Computadora (${garantiaTexto})`;
  } else if (tipoProducto === 'celular') {
    return `Celular (${garantiaTexto})`;
  } else {
    return `Otros (${garantiaTexto})`;
  }
};