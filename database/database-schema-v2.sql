-- ==========================================
-- MUSCLE MEALS - SCHEMA FINAL v2
-- ==========================================
-- Cómo usar: SQL Editor de Supabase → pegar todo → Run
-- ⚠️  BORRA Y RECREA TODAS LAS TABLAS
-- ==========================================

-- ==========================================
-- 1. LIMPIAR TABLAS EXISTENTES
-- ==========================================
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS pickup_spots CASCADE;
DROP TABLE IF EXISTS meal_sub_recipes CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS sizes CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;

-- Limpiar secuencia y funciones de order_number si existen
DROP SEQUENCE IF EXISTS order_number_seq CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS set_order_number() CASCADE;

-- ==========================================
-- 2. INGREDIENTS - Ingredientes base
-- ==========================================
CREATE TABLE ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text CHECK (type IN ('pro', 'carb', 'veg')), -- null = no ajusta por size (salsas, especias, etc.)
  -- Macros por 100g / por unidad
  calories integer NOT NULL DEFAULT 0,
  protein integer NOT NULL DEFAULT 0,
  carbs integer NOT NULL DEFAULT 0,
  fats integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'g' CHECK (unit IN ('g', 'ml', 'pz', 'tsp', 'tbsp')),
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 3. RECIPES - Recetas (main o sub)
-- ==========================================
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('main', 'sub')),
  -- Array JSON: [{ingredient_id, qty, unit}]
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 4. MEALS - Platillos individuales
-- ==========================================
CREATE TABLE meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  img text,
  main_recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 5. MEAL_SUB_RECIPES - Relación Meal → Sub Recipes
-- ==========================================
CREATE TABLE meal_sub_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  sub_recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE, -- ← sub_recipe_id (no recipe_id)
  created_at timestamptz DEFAULT now(),
  UNIQUE(meal_id, sub_recipe_id)
);

-- ==========================================
-- 6. SIZES - Variantes de tamaño
-- ==========================================
CREATE TABLE sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_main boolean DEFAULT false,
  customer_id uuid,                    -- null = size global; uuid = size custom de cliente
  protein_qty integer NOT NULL,        -- gramos de ingrediente tipo 'pro'
  carb_qty integer NOT NULL,           -- gramos de ingrediente tipo 'carb'
  veg_qty integer NOT NULL,            -- gramos de ingrediente tipo 'veg'
  price integer NOT NULL,              -- precio unitario en centavos MXN
  package_price integer NOT NULL,      -- precio en paquete en centavos MXN
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, customer_id)
);

-- ==========================================
-- 7. PACKAGES - Paquetes de comidas
-- ==========================================
CREATE TABLE packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  img text,
  meals_included integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 8. PICKUP SPOTS - Puntos de recolección
-- ==========================================
CREATE TABLE pickup_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  schedule text NOT NULL,
  zone text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 9. CUSTOMERS - Clientes
-- ==========================================
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL UNIQUE,   -- lookup key (+5218112345678)
  email text NOT NULL,          -- key de Conekta
  address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 10. ORDERS - Órdenes de compra
-- ==========================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,             -- MM-0001, MM-0002, etc.
  conekta_order_id text,                         -- ID de Conekta para webhooks
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  total_amount integer NOT NULL,                 -- centavos MXN (incluye envío)
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'preparing', 'delivered', 'cancelled')),
  shipping_type text NOT NULL DEFAULT 'standard'
    CHECK (shipping_type IN ('standard', 'priority', 'pickup')),
  pickup_spot_id uuid REFERENCES pickup_spots(id) ON DELETE SET NULL,
  shipping_cost integer NOT NULL DEFAULT 0,      -- centavos MXN
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 11. ORDER_ITEMS - Items de cada orden
-- ==========================================
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE RESTRICT,
  size_id uuid NOT NULL REFERENCES sizes(id) ON DELETE RESTRICT,
  qty integer NOT NULL CHECK (qty > 0),
  unit_price integer NOT NULL,                   -- precio al momento de la orden
  package_id uuid REFERENCES packages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 12. SECUENCIA Y TRIGGER - order_number
-- ==========================================
CREATE SEQUENCE order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  next_num := nextval('order_number_seq');
  RETURN 'MM-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- ==========================================
-- 13. ÍNDICES
-- ==========================================
CREATE INDEX idx_ingredients_type ON ingredients(type);
CREATE INDEX idx_recipes_type ON recipes(type);
CREATE INDEX idx_meals_active ON meals(active);
CREATE INDEX idx_meals_main_recipe ON meals(main_recipe_id);
CREATE INDEX idx_meal_sub_recipes_meal ON meal_sub_recipes(meal_id);
CREATE INDEX idx_meal_sub_recipes_recipe ON meal_sub_recipes(sub_recipe_id);
CREATE INDEX idx_sizes_is_main ON sizes(is_main);
CREATE INDEX idx_packages_active ON packages(active);
CREATE INDEX idx_pickup_spots_active ON pickup_spots(active);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_conekta ON orders(conekta_order_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_meal ON order_items(meal_id);
CREATE INDEX idx_order_items_package ON order_items(package_id);

-- ==========================================
-- 14. COMENTARIOS
-- ==========================================
COMMENT ON TABLE ingredients IS 'Ingredientes base con macros por 100g';
COMMENT ON COLUMN ingredients.type IS 'pro=proteína | carb=carbohidrato | veg=vegetal | null=fijo (no ajusta por size)';
COMMENT ON TABLE recipes IS 'Recetas main (platillo base) o sub (salsas/complementos)';
COMMENT ON COLUMN recipes.ingredients IS 'JSON array: [{ingredient_id, qty, unit}]';
COMMENT ON TABLE meals IS 'Platillo = 1 main recipe + N sub recipes opcionales';
COMMENT ON TABLE meal_sub_recipes IS 'Relación N:N entre meal y sus sub-recetas (salsas, aderezos)';
COMMENT ON TABLE sizes IS 'Variantes de tamaño: LOW / FIT / PLUS (o custom por cliente)';
COMMENT ON COLUMN sizes.protein_qty IS 'Gramos del ingrediente tipo pro para este size';
COMMENT ON COLUMN sizes.carb_qty IS 'Gramos del ingrediente tipo carb para este size';
COMMENT ON COLUMN sizes.veg_qty IS 'Gramos del ingrediente tipo veg para este size';
COMMENT ON TABLE orders IS 'Órdenes de compra con envío y número secuencial';
COMMENT ON COLUMN orders.order_number IS 'Número amigable auto-generado: MM-0001, MM-0002, etc.';
COMMENT ON COLUMN orders.shipping_type IS 'standard=$49 | priority=a cotizar | pickup=gratis';
COMMENT ON TABLE pickup_spots IS 'Puntos de recolección disponibles para pickup';

-- ==========================================
-- SCHEMA LISTO ✅
-- Siguiente paso: correr insert-data-v2.sql
-- ==========================================
