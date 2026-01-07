-- ==========================================
-- MUSCLE MEALS - DATOS INICIALES v2
-- ==========================================

-- 1. INGREDIENTS
INSERT INTO ingredients (name, type, calories, protein, carbs, fats, unit) VALUES
  -- Proteínas
  ('Pechuga de Pollo', 'pro', 165, 31, 0, 4, 'g'),
  ('Carne de Res', 'pro', 250, 26, 0, 15, 'g'),
  ('Huevo', 'pro', 155, 13, 1, 11, 'pz'),
  
  -- Carbohidratos
  ('Arroz Blanco', 'carb', 130, 3, 28, 0, 'g'),
  ('Camote', 'carb', 86, 2, 20, 0, 'g'),
  ('Fideos Ramen', 'carb', 138, 4, 26, 2, 'g'),
  
  -- Vegetales
  ('Brócoli', 'veg', 34, 3, 7, 0, 'g'),
  ('Zanahoria', 'veg', 41, 1, 10, 0, 'g'),
  ('Calabacita', 'veg', 17, 1, 3, 0, 'g'),
  
  -- Sin tipo (no se ajustan por size)
  ('Salsa Chimichurri', NULL, 120, 1, 2, 12, 'tbsp'),
  ('Salsa Coreana', NULL, 80, 1, 15, 2, 'tbsp'),
  ('Miel', NULL, 64, 0, 17, 0, 'tsp'),
  ('Limón', NULL, 4, 0, 1, 0, 'pz');

-- 2. SIZES (variantes principales)
INSERT INTO sizes (name, is_main, protein_qty, carb_qty, veg_qty, price, package_price) VALUES
  ('LOW', true, 160, 45, 80, 14500, 14000),
  ('FIT', true, 180, 55, 70, 15500, 15000),
  ('PLUS', true, 220, 70, 70, 16500, 16000);

-- 3. RECIPES PRINCIPALES (main)
INSERT INTO recipes (name, type, ingredients) VALUES
  (
    'Pollo Chimichurri Base',
    'main',
    jsonb_build_array(
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'), 'qty', 100, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Blanco'), 'qty', 50, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Brócoli'), 'qty', 80, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa Chimichurri'), 'qty', 2, 'unit', 'tbsp')
    )
  ),
  (
    'Korean Beef Bowl Base',
    'main',
    jsonb_build_array(
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Carne de Res'), 'qty', 100, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Blanco'), 'qty', 50, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Zanahoria'), 'qty', 40, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Calabacita'), 'qty', 40, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa Coreana'), 'qty', 2, 'unit', 'tbsp')
    )
  ),
  (
    'Honey Lime Chicken Base',
    'main',
    jsonb_build_array(
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'), 'qty', 100, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Camote'), 'qty', 50, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Brócoli'), 'qty', 80, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Miel'), 'qty', 2, 'unit', 'tsp'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Limón'), 'qty', 1, 'unit', 'pz')
    )
  ),
  (
    'Ramen de Pollo Base',
    'main',
    jsonb_build_array(
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'), 'qty', 100, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Fideos Ramen'), 'qty', 50, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Zanahoria'), 'qty', 30, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Calabacita'), 'qty', 30, 'unit', 'g'),
      jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Huevo'), 'qty', 1, 'unit', 'pz')
    )
  );

-- 4. MEALS
INSERT INTO meals (name, description, main_recipe_id) VALUES
  (
    'Pollo Chimichurri', 
    'Pollo a la plancha con salsa chimichurri argentina, arroz y brócoli',
    (SELECT id FROM recipes WHERE name = 'Pollo Chimichurri Base')
  ),
  (
    'Korean Beef Bowl',
    'Bowl de res estilo coreano con vegetales salteados y arroz',
    (SELECT id FROM recipes WHERE name = 'Korean Beef Bowl Base')
  ),
  (
    'Honey Lime Chicken',
    'Pollo glaseado con miel y limón, camote rostizado y brócoli',
    (SELECT id FROM recipes WHERE name = 'Honey Lime Chicken Base')
  ),
  (
    'Ramen de Pollo',
    'Ramen casero con pollo, huevo y vegetales frescos',
    (SELECT id FROM recipes WHERE name = 'Ramen de Pollo Base')
  );

-- 5. PACKAGES
INSERT INTO packages (name, description, meals_included) VALUES
  ('Paquete x5', '5 comidas a elegir', 5),
  ('Paquete x10', '10 comidas a elegir', 10),
  ('Paquete x15', '15 comidas a elegir', 15);

-- ==========================================
-- VERIFICAR DATOS
-- ==========================================

-- Ver ingredientes
SELECT 
  name,
  COALESCE(type, '-') as tipo,
  calories || ' kcal' as calorias,
  protein || 'g P' as protein,
  carbs || 'g C' as carbs,
  fats || 'g F' as fats,
  unit
FROM ingredients
ORDER BY type NULLS LAST, name;

-- Ver sizes
SELECT 
  name,
  CASE WHEN is_main THEN 'Principal' ELSE 'Custom' END as tipo,
  protein_qty || 'g' as proteina,
  carb_qty || 'g' as carbos,
  veg_qty || 'g' as vegetales,
  (price / 100.0) || ' MXN' as precio_unitario,
  (package_price / 100.0) || ' MXN' as precio_paquete
FROM sizes
ORDER BY is_main DESC, price;

-- Ver meals
SELECT 
  m.name,
  m.description,
  r.name as receta_base
FROM meals m
JOIN recipes r ON r.id = m.main_recipe_id
ORDER BY m.name;

-- Ver packages
SELECT 
  name,
  meals_included as comidas,
  description
FROM packages
ORDER BY meals_included;
