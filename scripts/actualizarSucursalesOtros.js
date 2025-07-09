// Script para actualizar las sucursales de la tabla "otros" a LA_PLATA o MITRE aleatoriamente
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function actualizarSucursalesOtros() {
  try {
    console.log('🔄 Iniciando actualización de sucursales en tabla "otros"...');
    
    // 1. Obtener todos los registros
    const { data: productos, error: errorGet } = await supabase
      .from('otros')
      .select('id, descripcion_producto, sucursal');
    
    if (errorGet) {
      throw errorGet;
    }
    
    console.log(`📊 Total de productos encontrados: ${productos.length}`);
    
    // 2. Mostrar estadísticas actuales
    const sucursalesActuales = {};
    productos.forEach(p => {
      const sucursal = p.sucursal || 'sin_sucursal';
      sucursalesActuales[sucursal] = (sucursalesActuales[sucursal] || 0) + 1;
    });
    
    console.log('📈 Distribución actual de sucursales:');
    Object.entries(sucursalesActuales).forEach(([sucursal, count]) => {
      console.log(`   ${sucursal}: ${count} productos`);
    });
    
    // 3. Crear array de sucursales alternas (LA_PLATA, MITRE)
    const sucursales = ['LA_PLATA', 'MITRE'];
    const actualizaciones = [];
    
    productos.forEach((producto, index) => {
      // Alternar entre LA_PLATA y MITRE + algo de aleatoriedad
      const sucursalIndex = Math.random() > 0.5 ? 0 : 1;
      const nuevaSucursal = sucursales[sucursalIndex];
      
      actualizaciones.push({
        id: producto.id,
        sucursal: nuevaSucursal
      });
    });
    
    // 4. Realizar las actualizaciones en lotes de 50
    const BATCH_SIZE = 50;
    let actualizados = 0;
    
    for (let i = 0; i < actualizaciones.length; i += BATCH_SIZE) {
      const lote = actualizaciones.slice(i, i + BATCH_SIZE);
      
      // Actualizar cada registro del lote
      for (const update of lote) {
        const { error: errorUpdate } = await supabase
          .from('otros')
          .update({ 
            sucursal: update.sucursal,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);
        
        if (errorUpdate) {
          console.error(`❌ Error actualizando producto ${update.id}:`, errorUpdate);
        } else {
          actualizados++;
        }
      }
      
      console.log(`✅ Procesados ${Math.min(i + BATCH_SIZE, actualizaciones.length)} de ${actualizaciones.length} productos`);
    }
    
    // 5. Verificar resultados
    const { data: productosActualizados, error: errorVerify } = await supabase
      .from('otros')
      .select('sucursal');
    
    if (errorVerify) {
      throw errorVerify;
    }
    
    const nuevasEstadisticas = {};
    productosActualizados.forEach(p => {
      const sucursal = p.sucursal || 'sin_sucursal';
      nuevasEstadisticas[sucursal] = (nuevasEstadisticas[sucursal] || 0) + 1;
    });
    
    console.log('\n🎉 Actualización completada!');
    console.log(`📊 Total de productos actualizados: ${actualizados}`);
    console.log('📈 Nueva distribución de sucursales:');
    Object.entries(nuevasEstadisticas).forEach(([sucursal, count]) => {
      console.log(`   ${sucursal}: ${count} productos`);
    });
    
  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
    process.exit(1);
  }
}

// Ejecutar el script
actualizarSucursalesOtros()
  .then(() => {
    console.log('✨ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });