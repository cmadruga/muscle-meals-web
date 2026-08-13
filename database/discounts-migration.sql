-- Discounts migration
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS discounts (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                  TEXT NOT NULL,
  code                  TEXT UNIQUE,
  type                  TEXT NOT NULL CHECK (type IN ('percent', 'fixed', 'free_shipping')),
  value                 INTEGER NOT NULL DEFAULT 0,
  condition_type        TEXT NOT NULL DEFAULT 'always'
                          CHECK (condition_type IN ('always', 'first_order', 'streak', 'cumulative_orders')),
  condition_value       INTEGER,
  min_items             INTEGER,
  min_amount            INTEGER,
  valid_days            INTEGER[],
  max_uses              INTEGER,
  max_uses_per_customer INTEGER,
  active                BOOLEAN NOT NULL DEFAULT true,
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discount_uses (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_id  UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  customer_id  UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount_saved INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_uses_discount_id ON discount_uses(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_uses_customer_id ON discount_uses(customer_id);
CREATE INDEX IF NOT EXISTS idx_discount_uses_order_id    ON discount_uses(order_id);

ALTER TABLE discounts ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_id     UUID REFERENCES discounts(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;
