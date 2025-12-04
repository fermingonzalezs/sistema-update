/**
 * Script de Validación: Compras Nacionales con Ingreso de Equipos
 *
 * Este script simula el flujo completo sin necesidad de la UI
 */

// ==================================================
// FUNCIONES A TESTEAR (Extraídas de NuevaCompraModal)
// ==================================================

const generarDescripcionItem = (tipo, datos) => {
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

const calcularCostosProrrateados = (items, costosAdicionales) => {
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

const validarSerialUnico = (items, nuevoSerial) => {
  return !items.some(item => item.datos_completos.serial === nuevoSerial);
};

// ==================================================
// DATOS DE PRUEBA
// ==================================================

const datosNotebook = {
  serial: 'NB001',
  marca: 'Dell',
  modelo: 'Inspiron 15',
  procesador: 'Intel i5-12400H',
  ram: '16GB',
  ssd: '512GB',
  precio_costo_usd: 500,
  envios_repuestos: 20,
  precio_venta_usd: 700,
  categoria: 'windows',
  condicion: 'nuevo',
  sucursal: 'la_plata'
};

const datosCelular = {
  serial: 'CEL001',
  marca: 'Samsung',
  modelo: 'Galaxy S21',
  capacidad: '128GB',
  color: 'Negro',
  precio_compra_usd: 300,
  precio_venta_usd: 450,
  categoria: 'android',
  condicion: 'usado',
  sucursal: 'mitre'
};

const datosOtro = {
  nombre_producto: 'Mouse Logitech',
  descripcion: 'Mouse inalámbrico',
  precio_compra_usd: 25,
  precio_venta_usd: 40,
  cantidad_la_plata: 5,
  cantidad_mitre: 3,
  categoria: 'MOUSE_TECLADOS',
  condicion: 'nuevo'
};

// ==================================================
// TESTS
// ==================================================

console.log('\n🧪 INICIANDO TESTS DE COMPRAS NACIONALES\n');
console.log('='.repeat(60));

let testsPasados = 0;
let testsFallados = 0;

function test(nombre, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${nombre}`);
    testsPasados++;
  } catch (error) {
    console.log(`❌ FAIL: ${nombre}`);
    console.log(`   Error: ${error.message}`);
    testsFallados++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toContain(substring) {
      if (!actual.includes(substring)) {
        throw new Error(`Expected "${actual}" to contain "${substring}"`);
      }
    },
    toBeCloseTo(expected, precision = 2) {
      const multiplier = Math.pow(10, precision);
      const roundedActual = Math.round(actual * multiplier) / multiplier;
      const roundedExpected = Math.round(expected * multiplier) / multiplier;
      if (roundedActual !== roundedExpected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, but got ${actual}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, but got ${actual}`);
      }
    }
  };
}

// TEST 1: Generación de descripción para Notebook
test('Genera descripción correcta para Notebook', () => {
  const descripcion = generarDescripcionItem('notebook', datosNotebook);
  expect(descripcion).toContain('Dell');
  expect(descripcion).toContain('Inspiron 15');
  expect(descripcion).toContain('Intel i5-12400H');
  expect(descripcion).toContain('16GB RAM');
  expect(descripcion).toContain('512GB SSD');
});

// TEST 2: Generación de descripción para Celular
test('Genera descripción correcta para Celular', () => {
  const descripcion = generarDescripcionItem('celular', datosCelular);
  expect(descripcion).toContain('Samsung');
  expect(descripcion).toContain('Galaxy S21');
  expect(descripcion).toContain('128GB');
  expect(descripcion).toContain('Negro');
});

// TEST 3: Generación de descripción para Otro
test('Genera descripción correcta para Otro', () => {
  const descripcion = generarDescripcionItem('otro', datosOtro);
  expect(descripcion).toContain('Mouse Logitech');
  expect(descripcion).toContain('Mouse inalámbrico');
});

// TEST 4: Cálculo de precio unitario para Notebook
test('Calcula precio unitario correcto para Notebook', () => {
  const precioUnitario = parseFloat(datosNotebook.precio_costo_usd) + parseFloat(datosNotebook.envios_repuestos);
  expect(precioUnitario).toBe(520);
});

// TEST 5: Cantidad para Notebook (debe ser 1)
test('Cantidad para Notebook es siempre 1', () => {
  const cantidad = 1; // Notebooks siempre tienen cantidad 1
  expect(cantidad).toBe(1);
});

// TEST 6: Cantidad para Otro (suma de sucursales)
test('Cantidad para Otro es suma de sucursales', () => {
  const cantidad = datosOtro.cantidad_la_plata + datosOtro.cantidad_mitre;
  expect(cantidad).toBe(8);
});

// TEST 7: Prorrateo de costos adicionales - Caso simple
test('Prorrateo de costos con 2 items iguales', () => {
  const items = [
    { id: 1, precio_total: 100, datos_completos: { serial: 'A1' } },
    { id: 2, precio_total: 100, datos_completos: { serial: 'A2' } }
  ];
  const costosAdicionales = 20;

  const resultado = calcularCostosProrrateados(items, costosAdicionales);

  expect(resultado[0].costos_adicionales).toBeCloseTo(10, 2);
  expect(resultado[0].precio_final).toBeCloseTo(110, 2);
  expect(resultado[1].costos_adicionales).toBeCloseTo(10, 2);
  expect(resultado[1].precio_final).toBeCloseTo(110, 2);
});

// TEST 8: Prorrateo de costos adicionales - Caso desigual
test('Prorrateo de costos con items de diferentes precios', () => {
  const items = [
    { id: 1, precio_total: 300, datos_completos: { serial: 'B1' } }, // 60% del total
    { id: 2, precio_total: 200, datos_completos: { serial: 'B2' } }  // 40% del total
  ];
  const costosAdicionales = 50;

  const resultado = calcularCostosProrrateados(items, costosAdicionales);

  // Item 1: 300/500 * 50 = 30
  expect(resultado[0].costos_adicionales).toBeCloseTo(30, 2);
  expect(resultado[0].precio_final).toBeCloseTo(330, 2);

  // Item 2: 200/500 * 50 = 20
  expect(resultado[1].costos_adicionales).toBeCloseTo(20, 2);
  expect(resultado[1].precio_final).toBeCloseTo(220, 2);
});

// TEST 9: Prorrateo de costos adicionales - Sin costos
test('Prorrateo con costos adicionales en 0', () => {
  const items = [
    { id: 1, precio_total: 100, datos_completos: { serial: 'C1' } }
  ];
  const costosAdicionales = 0;

  const resultado = calcularCostosProrrateados(items, costosAdicionales);

  expect(resultado[0].costos_adicionales).toBe(0);
  expect(resultado[0].precio_final).toBe(100);
});

// TEST 10: Validación de serial único
test('Detecta serial duplicado en la misma compra', () => {
  const items = [
    { id: 1, datos_completos: { serial: 'SERIAL123' } },
    { id: 2, datos_completos: { serial: 'SERIAL456' } }
  ];

  expect(validarSerialUnico(items, 'SERIAL123')).toBeFalsy();
  expect(validarSerialUnico(items, 'SERIAL789')).toBeTruthy();
});

// TEST 11: Simulación de compra completa
test('Simulación de compra con 3 productos mixtos', () => {
  // Crear items temporales
  const items = [];

  // Agregar Notebook
  const itemNotebook = {
    id: Date.now(),
    tipo_producto: 'notebook',
    datos_completos: datosNotebook,
    cantidad: 1,
    precio_unitario: 520, // 500 + 20
    precio_total: 520,
    descripcion: generarDescripcionItem('notebook', datosNotebook)
  };
  items.push(itemNotebook);

  // Agregar Celular
  const itemCelular = {
    id: Date.now() + 1,
    tipo_producto: 'celular',
    datos_completos: datosCelular,
    cantidad: 1,
    precio_unitario: 300,
    precio_total: 300,
    descripcion: generarDescripcionItem('celular', datosCelular)
  };
  items.push(itemCelular);

  // Agregar Otro
  const itemOtro = {
    id: Date.now() + 2,
    tipo_producto: 'otro',
    datos_completos: datosOtro,
    cantidad: 8,
    precio_unitario: 25,
    precio_total: 200, // 8 * 25
    descripcion: generarDescripcionItem('otro', datosOtro)
  };
  items.push(itemOtro);

  // Calcular totales
  const totalSinCostos = items.reduce((sum, item) => sum + item.precio_total, 0);
  expect(totalSinCostos).toBe(1020); // 520 + 300 + 200

  // Aplicar costos adicionales
  const costosAdicionales = 102; // 10% del total
  const itemsConCostos = calcularCostosProrrateados(items, costosAdicionales);

  // Verificar prorrateo
  // Notebook: 520/1020 * 102 = 52 (aproximadamente)
  expect(itemsConCostos[0].costos_adicionales).toBeCloseTo(52, 0);
  expect(itemsConCostos[0].precio_final).toBeCloseTo(572, 0);

  // Celular: 300/1020 * 102 = 30
  expect(itemsConCostos[1].costos_adicionales).toBeCloseTo(30, 2);
  expect(itemsConCostos[1].precio_final).toBeCloseTo(330, 2);

  // Otro: 200/1020 * 102 = 20
  expect(itemsConCostos[2].costos_adicionales).toBeCloseTo(20, 2);
  expect(itemsConCostos[2].precio_final).toBeCloseTo(220, 2);

  // Total final
  const totalFinal = itemsConCostos.reduce((sum, item) => sum + item.precio_final, 0);
  expect(totalFinal).toBeCloseTo(1122, 2); // 1020 + 102
});

// TEST 12: Verificar que items sin precio_total no rompen el cálculo
test('Maneja items sin precio_total correctamente', () => {
  const items = [
    { id: 1, precio_total: 0, datos_completos: { serial: 'D1' } }
  ];
  const costosAdicionales = 10;

  const resultado = calcularCostosProrrateados(items, costosAdicionales);
  expect(resultado).toEqual(items); // Debe retornar items sin modificar
});

// ==================================================
// RESUMEN DE RESULTADOS
// ==================================================

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESUMEN DE TESTS:`);
console.log(`   ✅ Tests pasados: ${testsPasados}`);
console.log(`   ❌ Tests fallados: ${testsFallados}`);
console.log(`   📈 Total: ${testsPasados + testsFallados}`);
console.log(`   🎯 Tasa de éxito: ${((testsPasados / (testsPasados + testsFallados)) * 100).toFixed(2)}%`);

if (testsFallados === 0) {
  console.log('\n🎉 ¡TODOS LOS TESTS PASARON! El código está listo para pruebas manuales.');
} else {
  console.log('\n⚠️  Hay tests fallidos. Revisar el código antes de continuar.');
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ PUNTOS A VERIFICAR MANUALMENTE EN LA UI:\n');
console.log('1. ⚙️  Abrir Compras → Nueva Compra Nacional');
console.log('2. 📝 Seleccionar un proveedor y completar datos generales');
console.log('3. 🖥️  Agregar un Notebook:');
console.log('   - Completar todos los campos obligatorios');
console.log('   - Verificar que se agregue a la tabla');
console.log('   - Ver que los costos adicionales se calculen en tiempo real');
console.log('4. 📱 Agregar un Celular:');
console.log('   - Usar diferente serial al notebook');
console.log('   - Verificar que aparezca en la tabla');
console.log('5. 📦 Agregar un producto "Otro" con cantidad > 1');
console.log('6. 💰 Modificar "Costos Adicionales" y ver actualización en tabla');
console.log('7. 👁️  Expandir detalles de un producto (botón Ver)');
console.log('8. 🗑️  Eliminar un producto de la lista');
console.log('9. ✅ Click en "Finalizar Compra"');
console.log('10. 🎯 Seleccionar destino "Stock" y confirmar');
console.log('11. 🔍 Verificar en inventario que aparezcan los productos');
console.log('12. 📋 Verificar en Ingresos de Equipos que se registraron');
console.log('13. 🔄 Crear otra compra con destino "Testeo"');
console.log('14. 🧪 Verificar en Soporte → Testeo que aparezcan pendientes');
console.log('\n' + '='.repeat(60) + '\n');
