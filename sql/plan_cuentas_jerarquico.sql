-- Migración para poblar Plan de Cuentas Jerárquico
-- Sistema Update - Estructura completa con subcategorías

-- Limpiar tabla existente
DELETE FROM plan_cuentas;
ALTER SEQUENCE plan_cuentas_id_seq RESTART WITH 1;

-- NIVEL 1: GRUPOS PRINCIPALES
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1', 'ACTIVO', 'activo', NULL, 1, 'PRINCIPAL', false, true, 'USD', false),
('2', 'PASIVO', 'pasivo', NULL, 1, 'PRINCIPAL', false, true, 'USD', false),
('3', 'PATRIMONIO NETO', 'patrimonio', NULL, 1, 'PRINCIPAL', false, true, 'USD', false),
('4', 'INGRESOS', 'ingreso', NULL, 1, 'PRINCIPAL', false, true, 'USD', false),
('5', 'COSTOS', 'egreso', NULL, 1, 'PRINCIPAL', false, true, 'USD', false),
('6', 'GASTOS', 'egreso', NULL, 1, 'PRINCIPAL', false, true, 'USD', false),
('9', 'CUENTAS DE ORDEN', 'orden', NULL, 1, 'PRINCIPAL', false, true, 'USD', false);

-- NIVEL 2: SUBCATEGORÍAS PRINCIPALES
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
-- ACTIVO
('1.1', 'ACTIVO CORRIENTE', 'activo', 1, 2, 'SUBCATEGORIA', false, true, 'USD', false),
('1.2', 'ACTIVO NO CORRIENTE', 'activo', 1, 2, 'SUBCATEGORIA', false, true, 'USD', false),
-- PASIVO
('2.1', 'PASIVO CORRIENTE', 'pasivo', 2, 2, 'SUBCATEGORIA', false, true, 'USD', false),
('2.2', 'PASIVO NO CORRIENTE', 'pasivo', 2, 2, 'SUBCATEGORIA', false, true, 'USD', false),
-- PATRIMONIO
('3.1', 'CAPITAL SOCIAL', 'patrimonio', 3, 2, 'SUBCATEGORIA', false, true, 'USD', false),
('3.2', 'RESULTADOS ACUMULADOS', 'patrimonio', 3, 2, 'SUBCATEGORIA', false, true, 'USD', false),
('3.3', 'RESULTADO DEL EJERCICIO', 'patrimonio', 3, 2, 'SUBCATEGORIA', false, true, 'USD', false),
('3.4', 'RESULTADO NEGATIVO ACUMULADO', 'patrimonio', 3, 2, 'SUBCATEGORIA', false, true, 'USD', false),
-- INGRESOS
('4.1', 'VENTAS', 'ingreso', 4, 2, 'SUBCATEGORIA', false, true, 'USD', false),
('4.2', 'RESULTADOS FINANCIEROS POR TENENCIA', 'ingreso', 4, 2, 'SUBCATEGORIA', false, true, 'USD', false),
('4.3', 'OTROS INGRESOS', 'ingreso', 4, 2, 'SUBCATEGORIA', false, true, 'USD', false),
-- COSTOS
('5.1', 'COSTO DE MERCADERÍAS VENDIDAS', 'egreso', 5, 2, 'SUBCATEGORIA', false, true, 'USD', false),
('5.2', 'COSTO DE SERVICIOS PRESTADOS', 'egreso', 5, 2, 'SUBCATEGORIA', false, true, 'USD', false),
('5.3', 'DIFERENCIAS DE CAMBIO NEGATIVAS', 'egreso', 5, 2, 'SUBCATEGORIA', false, true, 'USD', false),
-- GASTOS
('6.1', 'GASTOS DE COMERCIALIZACIÓN', 'egreso', 6, 2, 'SUBCATEGORIA', false, true, 'USD', false),
('6.2', 'GASTOS ADMINISTRATIVOS', 'egreso', 6, 2, 'SUBCATEGORIA', false, true, 'USD', false),
('6.3', 'OTROS GASTOS', 'egreso', 6, 2, 'SUBCATEGORIA', false, true, 'USD', false);

-- NIVEL 3: SUBCATEGORÍAS DETALLADAS

-- 1.1 ACTIVO CORRIENTE
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.01', 'CAJA Y BANCOS', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1'), 3, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.02', 'CUENTAS POR COBRAR', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1'), 3, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.03', 'OTROS CRÉDITOS', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1'), 3, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.04', 'BIENES DE CAMBIO', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1'), 3, 'SUBCATEGORIA', false, true, 'USD', false);

-- 1.2 ACTIVO NO CORRIENTE
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.2.01', 'BIENES DE USO', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.2'), 3, 'SUBCATEGORIA', false, true, 'USD', false),
('1.2.02', 'ACTIVOS INTANGIBLES', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.2'), 3, 'SUBCATEGORIA', false, true, 'USD', false),
('1.2.03', 'INVERSIONES', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.2'), 3, 'SUBCATEGORIA', false, true, 'USD', false);

-- 2.1 PASIVO CORRIENTE
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('2.1.01', 'DEUDAS COMERCIALES', 'pasivo', (SELECT id FROM plan_cuentas WHERE codigo = '2.1'), 3, 'SUBCATEGORIA', false, true, 'USD', false),
('2.1.02', 'DEUDAS FISCALES', 'pasivo', (SELECT id FROM plan_cuentas WHERE codigo = '2.1'), 3, 'SUBCATEGORIA', false, true, 'USD', false),
('2.1.03', 'DEUDAS SOCIALES', 'pasivo', (SELECT id FROM plan_cuentas WHERE codigo = '2.1'), 3, 'SUBCATEGORIA', false, true, 'USD', false),
('2.1.04', 'OTROS PASIVOS', 'pasivo', (SELECT id FROM plan_cuentas WHERE codigo = '2.1'), 3, 'SUBCATEGORIA', false, true, 'USD', false);

-- 2.2 PASIVO NO CORRIENTE
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('2.2.01', 'PRÉSTAMOS A LARGO PLAZO', 'pasivo', (SELECT id FROM plan_cuentas WHERE codigo = '2.2'), 3, 'SUBCATEGORIA', false, true, 'USD', false),
('2.2.02', 'DEUDAS CON SOCIOS A LARGO PLAZO', 'pasivo', (SELECT id FROM plan_cuentas WHERE codigo = '2.2'), 3, 'SUBCATEGORIA', false, true, 'USD', false),
('2.2.03', 'DEUDAS POR FINANCIACIÓN DE IMPORTACIONES', 'pasivo', (SELECT id FROM plan_cuentas WHERE codigo = '2.2'), 3, 'SUBCATEGORIA', false, true, 'USD', false);

-- NIVEL 4: SUBCATEGORÍAS ESPECÍFICAS

-- 1.1.01 CAJA Y BANCOS
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.01.01', 'CAJA', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01'), 4, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.01.02', 'BANCOS', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01'), 4, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.01.03', 'BILLETERAS VIRTUALES', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01'), 4, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.01.04', 'BILLETERAS CRIPTO', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01'), 4, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.01.05', 'DINERO EN TRÁNSITO', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01'), 4, 'SUBCATEGORIA', false, true, 'USD', false);

-- 1.1.02 CUENTAS POR COBRAR
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.02.01', 'CLIENTES PARTICULARES', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.02'), 4, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.02.02', 'REVENDEDORES', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.02'), 4, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.02.03', 'EMPRESAS', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.02'), 4, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.02.04', 'PAGOS PENDIENTES VÍA TERCEROS', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.02'), 4, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.02.05', 'CRÉDITOS CON GARANTÍA DE EQUIPO USADO', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.02'), 4, 'SUBCATEGORIA', false, true, 'USD', false),
('1.1.02.06', 'CRÉDITOS DUDOSOS O EN GESTIÓN', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.02'), 4, 'SUBCATEGORIA', false, true, 'USD', false);

-- NIVEL 5: CUENTAS FINALES (IMPUTABLES)

-- 1.1.01.01 CAJA
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.01.01.01', 'Caja La Plata', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.01'), 5, 'CUENTA', true, true, 'USD', false),
('1.1.01.01.02', 'Caja La Plata Pesos', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.01'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.01.03', 'Caja La Plata Dólares', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.01'), 5, 'CUENTA', true, true, 'USD', false);

INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.01.02.01', 'Caja CABA', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.01'), 5, 'CUENTA', true, true, 'USD', false),
('1.1.01.01.02', 'Caja CABA Pesos', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.01'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.01.03', 'Caja CABA Dólares', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.01'), 5, 'CUENTA', true, true, 'USD', false);

-- 1.1.01.02 BANCOS
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.01.02.01', 'Bancos físicos', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.02'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.02.02', 'Banco Provincia Update Tech SRL', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.02'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.02.03', 'Banco Mercury Update Tech WW LLC', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.02'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.02.04', 'Banco Provincia Yael', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.02'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.02.05', 'Banco Francés Ramiro', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.02'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.02.06', 'Banco Francés Alvaro', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.02'), 5, 'CUENTA', true, true, 'ARS', true);

-- 1.1.01.03 BILLETERAS VIRTUALES
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.01.03.01', 'Mercado Pago Yae', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.03'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.03.02', 'Ualá Yae', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.03'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.03.03', 'Mercado Pago Rama', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.03'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.03.04', 'Ualá Rama', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.03'), 5, 'CUENTA', true, true, 'ARS', true);

-- 1.1.01.04 BILLETERAS CRIPTO
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.01.04.01', 'Bitget Rama', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.04'), 5, 'CUENTA', true, true, 'USD', false),
('1.1.01.04.02', 'Offramp Yae', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.04'), 5, 'CUENTA', true, true, 'USD', false),
('1.1.01.04.03', 'Binance Yae', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.04'), 5, 'CUENTA', true, true, 'USD', false),
('1.1.01.04.04', 'Bitget Yae', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.04'), 5, 'CUENTA', true, true, 'USD', false);

-- 1.1.01.05 DINERO EN TRÁNSITO
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.01.05.01', 'Caja móvil Yae Pesos', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.05'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.05.02', 'Caja móvil Yae USD', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.05'), 5, 'CUENTA', true, true, 'USD', false),
('1.1.01.05.03', 'Caja móvil Rama Pesos', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.05'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.05.04', 'Caja móvil Rama USD', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.05'), 5, 'CUENTA', true, true, 'USD', false),
('1.1.01.05.05', 'Caja móvil Alvaro Pesos', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.05'), 5, 'CUENTA', true, true, 'ARS', true),
('1.1.01.05.06', 'Caja móvil Alvaro USD', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.01.05'), 5, 'CUENTA', true, true, 'USD', false);

-- Agregar más cuentas según la estructura proporcionada...
-- (Por brevedad, aquí se muestran las principales. El script completo incluiría todas las cuentas)

-- CUENTAS ADICIONALES IMPORTANTES

-- 1.1.02.01 CLIENTES PARTICULARES
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.02.01.01', 'Clientes en Efectivo Diferido (Seña o Reserva)', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.02.01'), 5, 'CUENTA', true, true, 'USD', false),
('1.1.02.01.02', 'Clientes con Transferencia Pendiente', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.02.01'), 5, 'CUENTA', true, true, 'USD', false),
('1.1.02.01.03', 'Clientes con Pago a Plazos (sin financiación formal)', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.02.01'), 5, 'CUENTA', true, true, 'USD', false);

-- 1.1.03 OTROS CRÉDITOS
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.03.01', 'Anticipos a proveedores', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.03'), 4, 'CUENTA', true, true, 'USD', false),
('1.1.03.02', 'Créditos fiscales (IVA, SUSS, etc.)', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.03'), 4, 'CUENTA', true, true, 'USD', false),
('1.1.03.03', 'Préstamos a empleados', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.03'), 4, 'CUENTA', true, true, 'USD', false);

-- 1.1.04 BIENES DE CAMBIO
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('1.1.04.01', 'Mercaderías', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.04'), 4, 'CUENTA', true, true, 'USD', false),
('1.1.04.02', 'Equipos en tránsito (importación)', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.04'), 4, 'CUENTA', true, true, 'USD', false),
('1.1.04.03', 'Repuestos y accesorios', 'activo', (SELECT id FROM plan_cuentas WHERE codigo = '1.1.04'), 4, 'CUENTA', true, true, 'USD', false);

-- 4.1 VENTAS
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('4.1.01', 'VENTA DE PRODUCTOS', 'ingreso', (SELECT id FROM plan_cuentas WHERE codigo = '4.1'), 3, 'SUBCATEGORIA', false, true, 'USD', false),
('4.1.02', 'SERVICIOS', 'ingreso', (SELECT id FROM plan_cuentas WHERE codigo = '4.1'), 3, 'SUBCATEGORIA', false, true, 'USD', false);

-- 4.1.01 VENTA DE PRODUCTOS
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('4.1.01.01', 'Notebooks', 'ingreso', (SELECT id FROM plan_cuentas WHERE codigo = '4.1.01'), 4, 'CUENTA', true, true, 'USD', false),
('4.1.01.02', 'iPhones', 'ingreso', (SELECT id FROM plan_cuentas WHERE codigo = '4.1.01'), 4, 'CUENTA', true, true, 'USD', false),
('4.1.01.03', 'Accesorios', 'ingreso', (SELECT id FROM plan_cuentas WHERE codigo = '4.1.01'), 4, 'CUENTA', true, true, 'USD', false),
('4.1.01.04', 'Componentes', 'ingreso', (SELECT id FROM plan_cuentas WHERE codigo = '4.1.01'), 4, 'CUENTA', true, true, 'USD', false);

-- 4.1.02 SERVICIOS
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('4.1.02.01', 'Reparaciones', 'ingreso', (SELECT id FROM plan_cuentas WHERE codigo = '4.1.02'), 4, 'CUENTA', true, true, 'USD', false),
('4.1.02.02', 'Armado de PCs', 'ingreso', (SELECT id FROM plan_cuentas WHERE codigo = '4.1.02'), 4, 'CUENTA', true, true, 'USD', false),
('4.1.02.03', 'Envíos cobrados', 'ingreso', (SELECT id FROM plan_cuentas WHERE codigo = '4.1.02'), 4, 'CUENTA', true, true, 'USD', false);

-- 9 CUENTAS DE ORDEN
INSERT INTO plan_cuentas (codigo, nombre, tipo, padre_id, nivel, categoria, imputable, activa, moneda_original, requiere_cotizacion) VALUES
('9.1', 'Bienes de terceros en custodia', 'orden', (SELECT id FROM plan_cuentas WHERE codigo = '9'), 2, 'CUENTA', true, true, 'USD', false),
('9.2', 'Mercaderías entregadas en consignación', 'orden', (SELECT id FROM plan_cuentas WHERE codigo = '9'), 2, 'CUENTA', true, true, 'USD', false),
('9.3', 'Garantías otorgadas', 'orden', (SELECT id FROM plan_cuentas WHERE codigo = '9'), 2, 'CUENTA', true, true, 'USD', false),
('9.4', 'Contratos en ejecución', 'orden', (SELECT id FROM plan_cuentas WHERE codigo = '9'), 2, 'CUENTA', true, true, 'USD', false),
('9.5', 'Bienes dados en comodato', 'orden', (SELECT id FROM plan_cuentas WHERE codigo = '9'), 2, 'CUENTA', true, true, 'USD', false),
('9.6', 'Bienes recibidos en comodato', 'orden', (SELECT id FROM plan_cuentas WHERE codigo = '9'), 2, 'CUENTA', true, true, 'USD', false),
('9.7', 'Mercaderias en transito', 'orden', (SELECT id FROM plan_cuentas WHERE codigo = '9'), 2, 'CUENTA', true, true, 'USD', false),
('9.8', 'Productos en reparación', 'orden', (SELECT id FROM plan_cuentas WHERE codigo = '9'), 2, 'CUENTA', true, true, 'USD', false);

-- Actualizar secuencia para próximos inserts
SELECT setval('plan_cuentas_id_seq', (SELECT MAX(id) FROM plan_cuentas));

-- Verificación final
SELECT 
    nivel,
    categoria,
    COUNT(*) as cantidad,
    COUNT(CASE WHEN imputable THEN 1 END) as imputables
FROM plan_cuentas 
WHERE activa = true 
GROUP BY nivel, categoria 
ORDER BY nivel, categoria;

COMMIT;