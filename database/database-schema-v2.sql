-- ==========================================
-- MUSCLE MEALS - ESTRUCTURA FINAL v2
-- ==========================================

-- BORRAR TABLAS EXISTENTES
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS meal_sub_recipes CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS sizes CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS product_sizes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS dishes CASCADE;

-- ==========================================
-- INGREDIENTS - Ingredientes base
-- ==========================================
CREATE TABLE ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text CHECK (type IN ('pro', 'carb', 'veg')), -- pro=protein, carb=carbohidratos, veg=vegetales, null=no ajusta
  -- Macros por 100g
  calories integer NOT NULL DEFAULT 0, -- kcal
  protein integer NOT NULL DEFAULT 0, -- gramos
  carbs integer NOT NULL DEFAULT 0, -- gramos
  fats integer NOT NULL DEFAULT 0, -- gramos
  unit text NOT NULL DEFAULT 'g' CHECK (unit IN ('g', 'ml', 'pz', 'tsp', 'tbsp')),
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- RECIPES - Recetas (main o sub)
-- ==========================================
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('main', 'sub')), -- main=receta principal, sub=salsa/complemento
  -- Array de ingredientes: [{ingredient_id: uuid, qty: number, unit: string}]
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- MEALS - Platillos individuales
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
-- MEAL_SUB_RECIPES - Relación Meal → Sub Recipes
-- ==========================================
CREATE TABLE meal_sub_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(meal_id, recipe_id)
);

-- ==========================================
-- SIZES - Variantes de tamaño (main + custom)
-- ==========================================
CREATE TABLE sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- LOW, FIT, PLUS, o nombre custom
  is_main boolean DEFAULT false, -- true para LOW/FIT/PLUS, false para custom
  customer_id uuid, -- null para main, customer_id para custom (futuro)
  -- Cantidades base por tipo de ingrediente (en gramos)
  protein_qty integer NOT NULL, -- gramos de ingredientes tipo 'pro'
  carb_qty integer NOT NULL, -- gramos de ingredientes tipo 'carb'
  veg_qty integer NOT NULL, -- gramos de ingredientes tipo 'veg'
  -- Precios (en centavos MXN)
  price integer NOT NULL, -- precio unitario de meal
  package_price integer NOT NULL, -- precio de meal en paquete
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(name, customer_id) -- nombre único por cliente
);

-- ==========================================
-- PACKAGES - Paquetes de comidas
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
-- ORDERS - Órdenes de compra
-- ==========================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid, -- futuro: referencia a customers
  total_amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'preparing', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- ORDER_ITEMS - Items de cada orden (cada meal individual)
-- ==========================================
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE RESTRICT,
  size_id uuid NOT NULL REFERENCES sizes(id) ON DELETE RESTRICT,
  qty integer NOT NULL CHECK (qty > 0),
  unit_price integer NOT NULL, -- precio unitario al momento de la orden (centavos)
  package_id uuid REFERENCES packages(id) ON DELETE SET NULL, -- si pertenece a un paquete
  created_at timestamptz DEFAULT now()
);

-- ==========================================
-- ÍNDICES
-- ==========================================
CREATE INDEX idx_ingredients_type ON ingredients(type);
CREATE INDEX idx_recipes_type ON recipes(type);
CREATE INDEX idx_meals_active ON meals(active);
CREATE INDEX idx_meals_main_recipe ON meals(main_recipe_id);
CREATE INDEX idx_meal_sub_recipes_meal ON meal_sub_recipes(meal_id);
CREATE INDEX idx_meal_sub_recipes_recipe ON meal_sub_recipes(recipe_id);
CREATE INDEX idx_sizes_is_main ON sizes(is_main);
CREATE INDEX idx_sizes_customer ON sizes(customer_id);
CREATE INDEX idx_packages_active ON packages(active);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_meal ON order_items(meal_id);
CREATE INDEX idx_order_items_package ON order_items(package_id);

-- ==========================================
-- COMENTARIOS
-- ==========================================
COMMENT ON TABLE ingredients IS 'Ingredientes base con macros por 100g';
COMMENT ON TABLE recipes IS 'Recetas (main/sub) con array de ingredientes';
COMMENT ON TABLE meals IS 'Platillos = 1 main recipe + N sub recipes';
COMMENT ON TABLE sizes IS 'Variantes de tamaño para meals y packages';
COMMENT ON COLUMN sizes.protein_qty IS 'Gramos base para ingredientes tipo pro';
COMMENT ON COLUMN sizes.carb_qty IS 'Gramos base para ingredientes tipo carb';
COMMENT ON COLUMN sizes.veg_qty IS 'Gramos base para ingredientes tipo veg';
COMMENT ON COLUMN sizes.price IS 'Precio unitario de meal (centavos)';
COMMENT ON COLUMN sizes.package_price IS 'Precio de meal cuando está en paquete (centavos)';
