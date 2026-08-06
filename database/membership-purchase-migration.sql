-- Membresía self-service: tracking en orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_membership_purchase BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS membership_weeks INT;
