-- Agregar columnas para soporte de presupuestos
ALTER TABLE recibos_remitos 
ADD COLUMN IF NOT EXISTS vigencia_horas INTEGER DEFAULT 72,
ADD COLUMN IF NOT EXISTS condiciones TEXT;

-- Nota: tipo_documento ya debe soportar 'presupuesto' ya que es un string o enum existente
