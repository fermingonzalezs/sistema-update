// Script para separar descripcion_producto en nombre_producto y descripcion
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

function separarNombreDescripcion(descripcionCompleta) {
  if (!descripcionCompleta) return { nombre: '', descripcion: '' };
  
  const texto = descripcionCompleta.trim();
  
  // Patrones para separar nombre y descripción
  const patrones = [
    // Patrón 1: Marca + Modelo + especificaciones técnicas (ej: "iPhone 15 Pro Max 256GB Titanium Blue Unlocked")
    /^([A-Za-z]+\s+[A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)\s+(.+)$/,
    
    // Patrón 2: Categoría + Marca + Modelo + resto (ej: "Audífonos Sony WH-1000XM5 Bluetooth Cancelación...")
    /^([A-Za-zÁÉÍÓÚáéíóúñÑ]+(?:\s+[A-Za-z]+){1,3})\s+(.+)$/,
    
    // Patrón 3: Primeras 3-4 palabras como nombre, resto como descripción
    /^((?:\S+\s+){2,3}\S+)\s+(.+)$/,
    
    // Patrón 4: Split en la primera palabra técnica (números, medidas, especificaciones)
    /^([^0-9]+?)\s+([0-9].+)$/,
  ];
  
  // Intentar con cada patrón
  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match) {
      const nombre = match[1].trim();
      const descripcion = match[2].trim();
      
      // Validar que el nombre no sea demasiado largo (máximo 50 caracteres)
      if (nombre.length <= 50 && descripcion.length > 0) {
        return { nombre, descripcion };
      }
    }
  }
  
  // Fallback: Tomar las primeras 2-3 palabras como nombre
  const palabras = texto.split(' ');
  if (palabras.length >= 3) {
    const nombre = palabras.slice(0, 3).join(' ');
    const descripcion = palabras.slice(3).join(' ');
    return { nombre, descripcion: descripcion || texto };
  } else {
    // Si hay pocas palabras, usar todo como nombre
    return { nombre: texto, descripcion: texto };
  }
}

async function agregarColumnas() {
  console.log('🔧 Agregando nuevas columnas a la tabla "otros"...');
  console.log('📝 IMPORTANTE: Ejecute estos comandos SQL en la consola de Supabase:');
  console.log('');
  console.log('ALTER TABLE otros ADD COLUMN IF NOT EXISTS nombre_producto TEXT;');
  console.log('ALTER TABLE otros ADD COLUMN IF NOT EXISTS descripcion TEXT;');
  console.log('');
  console.log('⏳ Presione ENTER después de ejecutar los comandos SQL...');
  
  // Esperar confirmación del usuario
  process.stdin.setRawMode(true);
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      console.log('✅ Continuando con la migración...');
      resolve(true);
    });
  });
}

async function migrarDatos() {
  try {
    console.log('🔄 Iniciando migración de datos...');
    
    // 1. Obtener todos los registros
    const { data: productos, error: errorGet } = await supabase
      .from('otros')
      .select('id, descripcion_producto');
    
    if (errorGet) {
      throw errorGet;
    }
    
    console.log(`📊 Total de productos a procesar: ${productos.length}`);
    
    // 2. Procesar cada producto
    let procesados = 0;
    let errores = 0;
    
    for (const producto of productos) {
      try {
        const { nombre, descripcion } = separarNombreDescripcion(producto.descripcion_producto);
        
        console.log(`Procesando ID ${producto.id}:`);
        console.log(`  Original: ${producto.descripcion_producto}`);
        console.log(`  Nombre: ${nombre}`);
        console.log(`  Descripción: ${descripcion}`);
        console.log('');
        
        // Actualizar el registro
        const { error: errorUpdate } = await supabase
          .from('otros')
          .update({
            nombre_producto: nombre,
            descripcion: descripcion,
            updated_at: new Date().toISOString()
          })
          .eq('id', producto.id);
        
        if (errorUpdate) {
          console.error(`❌ Error actualizando producto ${producto.id}:`, errorUpdate);
          errores++;
        } else {
          procesados++;
        }
        
      } catch (error) {
        console.error(`❌ Error procesando producto ${producto.id}:`, error);
        errores++;
      }
    }
    
    console.log('\n🎉 Migración completada!');
    console.log(`✅ Productos procesados exitosamente: ${procesados}`);
    console.log(`❌ Errores: ${errores}`);
    
    return { procesados, errores };
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

async function verificarResultados() {
  try {
    console.log('\n🔍 Verificando resultados...');
    
    const { data: productos, error } = await supabase
      .from('otros')
      .select('id, descripcion_producto, nombre_producto, descripcion')
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    console.log('📋 Ejemplos de productos migrados:');
    productos.forEach((producto, index) => {
      console.log(`\n${index + 1}. ID: ${producto.id}`);
      console.log(`   Original: ${producto.descripcion_producto}`);
      console.log(`   Nombre: ${producto.nombre_producto}`);
      console.log(`   Descripción: ${producto.descripcion}`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando resultados:', error);
  }
}

// Ejecutar el script completo
async function ejecutarMigracion() {
  try {
    console.log('🚀 Iniciando separación de descripción en tabla "otros"...\n');
    
    // Paso 1: Agregar columnas
    const columnasOk = await agregarColumnas();
    if (!columnasOk) {
      throw new Error('Error agregando columnas');
    }
    
    // Paso 2: Migrar datos
    const resultado = await migrarDatos();
    
    // Paso 3: Verificar resultados
    await verificarResultados();
    
    console.log('\n✨ Script completado exitosamente');
    
  } catch (error) {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }
}

ejecutarMigracion();