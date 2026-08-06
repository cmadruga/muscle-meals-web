-- Migración: soporte para membresías con múltiples tamaños
-- Ejecutar en Supabase SQL Editor

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS membership_items JSONB;

-- membership_items guarda la composición exacta del pedido semanal
-- Formato: [{"size_id": "uuid", "qty": 3}, {"size_id": "uuid", "qty": 2}]
-- Si es null → usar el campo legacy membership_size_id (membresías antiguas)

-- Migrar registros existentes con membership_size_id a membership_items
UPDATE customers
SET membership_items = jsonb_build_array(
  jsonb_build_object('size_id', membership_size_id, 'qty', membership_qty)
)
WHERE is_member = true
  AND membership_size_id IS NOT NULL
  AND membership_qty IS NOT NULL
  AND membership_items IS NULL;
