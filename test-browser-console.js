/**
 * SCRIPT DE PRUEBA RÁPIDA EN CONSOLA DEL NAVEGADOR
 *
 * Copia y pega este script en la consola del navegador (F12)
 * cuando estés en la página de Compras Nacionales
 */

console.log('%c🧪 INICIANDO PRUEBAS RÁPIDAS DE COMPRAS NACIONALES', 'background: #10b981; color: white; font-size: 16px; padding: 10px; font-weight: bold;');

// ==================================================
// VERIFICAR IMPORTS Y ESTRUCTURA
// ==================================================

console.log('\n%c1️⃣ Verificando imports...', 'color: #10b981; font-weight: bold;');

// Verificar que CargaEquiposUnificada esté disponible
const checkImport = (componentName) => {
  try {
    console.log(`✅ ${componentName} parece estar importado correctamente`);
    return true;
  } catch (e) {
    console.error(`❌ ${componentName} no está disponible:`, e);
    return false;
  }
};

checkImport('CargaEquiposUnificada');
checkImport('NuevaCompraModal');

// ==================================================
// SIMULACIÓN DE DATOS
// ==================================================

console.log('\n%c2️⃣ Creando datos de prueba...', 'color: #10b981; font-weight: bold;');

const datosNotebookTest = {
  serial: `TEST-NB-${Date.now()}`,
  marca: 'HP',
  modelo: 'ProBook 450 G8',
  procesador: 'Intel i7-1165G7',
  ram: '16GB',
  ssd: '512GB',
  precio_costo_usd: 600,
  envios_repuestos: 30,
  precio_venta_usd: 850,
  categoria: 'windows',
  condicion: 'nuevo',
  sucursal: 'la_plata'
};

const datosCelularTest = {
  serial: `TEST-CEL-${Date.now()}`,
  marca: 'Apple',
  modelo: 'iPhone 13',
  capacidad: '256GB',
  color: 'Azul',
  precio_compra_usd: 650,
  precio_venta_usd: 950,
  categoria: 'iphone',
  condicion: 'usado',
  estado: 'A+',
  sucursal: 'mitre'
};

const datosOtroTest = {
  nombre_producto: 'Teclado Mecánico',
  descripcion: 'Teclado RGB Gaming',
  precio_compra_usd: 80,
  precio_venta_usd: 120,
  cantidad_la_plata: 3,
  cantidad_mitre: 2,
  categoria: 'MOUSE_TECLADOS',
  condicion: 'nuevo'
};

console.log('✅ Notebook de prueba:', datosNotebookTest);
console.log('✅ Celular de prueba:', datosCelularTest);
console.log('✅ Otro de prueba:', datosOtroTest);

// ==================================================
// FUNCIONES DE VALIDACIÓN
// ==================================================

console.log('\n%c3️⃣ Funciones de validación...', 'color: #10b981; font-weight: bold;');

// Función para generar descripción
window.testGenerarDescripcion = (tipo, datos) => {
  switch (tipo) {
    case 'notebook':
      return `${datos.marca || ''} ${datos.modelo || ''} - ${datos.procesador || ''} - ${datos.ram || ''} RAM - ${datos.ssd || ''} SSD`.trim();
    case 'celular':
      return `${datos.marca || ''} ${datos.modelo || ''} - ${datos.capacidad || ''} - ${datos.color || ''}`.trim();
    case 'otro':
      return `${datos.nombre_producto || ''} ${datos.descripcion ? '- ' + datos.descripcion : ''}`.trim();
    default:
      return 'Producto sin descripción';
  }
};

// Función para calcular prorrateo
window.testCalcularProrrateo = (items, costosAdicionales) => {
  const totalSinCostos = items.reduce((sum, item) => sum + item.precio_total, 0);

  if (totalSinCostos === 0) return items;

  return items.map(item => {
    const proporcion = item.precio_total / totalSinCostos;
    const costoDistribuido = costosAdicionales * proporcion;
    return {
      ...item,
      costos_adicionales: costoDistribuido,
      precio_final: item.precio_total + costoDistribuido
    };
  });
};

console.log('✅ Funciones de prueba agregadas a window:');
console.log('   - window.testGenerarDescripcion(tipo, datos)');
console.log('   - window.testCalcularProrrateo(items, costosAdicionales)');

// ==================================================
// PRUEBAS RÁPIDAS
// ==================================================

console.log('\n%c4️⃣ Ejecutando pruebas rápidas...', 'color: #10b981; font-weight: bold;');

// Test 1: Generar descripciones
const descNotebook = window.testGenerarDescripcion('notebook', datosNotebookTest);
const descCelular = window.testGenerarDescripcion('celular', datosCelularTest);
const descOtro = window.testGenerarDescripcion('otro', datosOtroTest);

console.log('✅ Descripción Notebook:', descNotebook);
console.log('✅ Descripción Celular:', descCelular);
console.log('✅ Descripción Otro:', descOtro);

// Test 2: Calcular prorrateo
const itemsPrueba = [
  { id: 1, precio_total: 630, tipo: 'notebook' }, // Notebook
  { id: 2, precio_total: 650, tipo: 'celular' },  // Celular
  { id: 3, precio_total: 400, tipo: 'otro' }      // Otro (5 * 80)
];

const costosAdicionalesPrueba = 168; // 10% del total
const resultado = window.testCalcularProrrateo(itemsPrueba, costosAdicionalesPrueba);

console.log('\n%cPRORRATEO DE COSTOS:', 'color: #10b981; font-weight: bold;');
console.table(resultado);

const totalFinal = resultado.reduce((sum, item) => sum + item.precio_final, 0);
console.log(`✅ Total sin costos: $${itemsPrueba.reduce((sum, item) => sum + item.precio_total, 0)}`);
console.log(`✅ Costos adicionales: $${costosAdicionalesPrueba}`);
console.log(`✅ Total final: $${totalFinal.toFixed(2)}`);

// ==================================================
// INSTRUCCIONES DE USO
// ==================================================

console.log('\n%c📝 INSTRUCCIONES DE USO:', 'background: #1e293b; color: white; font-size: 14px; padding: 8px; font-weight: bold;');

console.log(`
%c🔹 Para probar la generación de descripción:%c
   window.testGenerarDescripcion('notebook', datosNotebookTest)
   window.testGenerarDescripcion('celular', datosCelularTest)
   window.testGenerarDescripcion('otro', datosOtroTest)

%c🔹 Para probar el prorrateo de costos:%c
   const items = [
     { id: 1, precio_total: 500 },
     { id: 2, precio_total: 300 }
   ];
   window.testCalcularProrrateo(items, 80)

%c🔹 Datos de prueba disponibles:%c
   - datosNotebookTest
   - datosCelularTest
   - datosOtroTest

%c🔹 Para crear una compra de prueba completa:%c
   1. Abre el modal de Nueva Compra
   2. Selecciona un proveedor
   3. Usa los datos de prueba para agregar productos
   4. Verifica que los costos se calculen correctamente
   5. Prueba ambos destinos (Stock y Testeo)
`,
  'color: #10b981; font-weight: bold;', 'color: #64748b;',
  'color: #10b981; font-weight: bold;', 'color: #64748b;',
  'color: #10b981; font-weight: bold;', 'color: #64748b;',
  'color: #10b981; font-weight: bold;', 'color: #64748b;'
);

// ==================================================
// CHECKLIST DE VERIFICACIÓN
// ==================================================

console.log('\n%c✅ CHECKLIST DE VERIFICACIÓN MANUAL:', 'background: #10b981; color: white; font-size: 14px; padding: 8px; font-weight: bold;');

const checklist = [
  '□ Modal se abre correctamente',
  '□ Formulario CargaEquiposUnificada se muestra',
  '□ Puedes seleccionar entre Notebook/Celular/Otro',
  '□ Los productos se agregan a la tabla al hacer submit',
  '□ La tabla muestra tipo, descripción, cantidad, precios',
  '□ Los costos adicionales se calculan en tiempo real',
  '□ El botón "Ver" expande los detalles del producto',
  '□ El botón "Eliminar" quita productos de la lista',
  '□ No permite seriales duplicados en la misma compra',
  '□ Notebooks/Celulares tienen siempre cantidad=1',
  '□ "Otros" permiten cantidad > 1',
  '□ Al finalizar, se muestra el modal de destino',
  '□ Opción "Stock" crea productos en inventario',
  '□ Opción "Testeo" los envía a la sección de Testeo',
  '□ Los productos aparecen en Ingresos de Equipos',
  '□ El recibo se crea en compras_recibos',
  '□ Los items se guardan en compra_items con datos completos'
];

checklist.forEach((item, index) => {
  console.log(`${index + 1}. ${item}`);
});

console.log('\n%c🎉 ¡SCRIPT DE PRUEBAS CARGADO!', 'background: #10b981; color: white; font-size: 16px; padding: 10px; font-weight: bold;');
console.log('Usa las funciones de prueba para validar la funcionalidad antes de hacer pruebas manuales completas.');
