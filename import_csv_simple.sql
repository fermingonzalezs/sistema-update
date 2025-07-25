-- Opción más simple: usar COPY desde archivo CSV (requiere acceso directo al servidor)
-- Como alternativa, usar el dashboard de Supabase es lo más fácil

-- Si tienes acceso directo al servidor PostgreSQL:
-- COPY inventario (serial, modelo, precio_costo_usd, envios_repuestos, precio_venta_usd, sucursal, condicion, procesador, slots, tipo_ram, ram, ssd, hdd, so, pantalla, resolucion, placa_video, vram, teclado_retro, idioma_teclado, color, bateria, duracion, garantia_update, garantia_oficial, fallas, disponible, ingreso, created_at, updated_at, marca, refresh, touchscreen)
-- FROM '/path/to/data.csv'
-- WITH (FORMAT csv, HEADER true);

-- INSTRUCCIONES PARA IMPORTAR:
-- 1. Ve a Supabase Dashboard > Table Editor
-- 2. Selecciona la tabla 'inventario'
-- 3. Haz clic en "Insert" > "Import data"
-- 4. Sube tu archivo data.csv
-- 5. Mapea las columnas correctamente
-- 6. Excluye la columna 'id' (auto-incremental) y 'precio_costo_total' (calculada)

-- NOTA IMPORTANTE: 
-- Los registros con serial "NN" podrían causar problemas de duplicados
-- Considera cambiarlos por valores únicos como "NN001", "NN002", etc.