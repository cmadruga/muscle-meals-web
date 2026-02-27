-- ==========================================
-- MUSCLE MEALS - DATOS REALES v2
-- ==========================================
-- Correr DESPUÉS de database-schema-v2.sql
-- Correr en orden: este archivo completo de una vez
-- ==========================================

-- ==========================================
-- PARTE 0: SIZES  ⚠️  EDITAR PRECIOS ANTES DE CORRER
-- ==========================================
-- protein_qty / carb_qty / veg_qty = gramos del ingrediente de ese tipo
-- price / package_price = centavos MXN (ej: 12000 = $120 MXN)
-- Los valores de macros son estimados basados en las recetas; EDITA los precios.

INSERT INTO sizes (name, is_main, customer_id, protein_qty, carb_qty, veg_qty, price, package_price) VALUES
  -- LOW: porción más pequeña
  ('LOW',  true, NULL,  160, 45, 70,  14500,  14000),
  -- FIT: porción estándar (is_main = true es el size por defecto)
  ('FIT',  true, NULL,  180, 55, 70,  15500, 15000),
  -- PLUS: porción extra
  ('PLUS', true, NULL,  220, 70, 70,  16500, 16000);

-- ⚠️  IMPORTANTE: Ajusta protein_qty, carb_qty, veg_qty y precios a los reales.
-- Los precios actuales son PLACEHOLDERS. price y package_price van en CENTAVOS.
-- Ejemplo: $120 MXN = 12000 centavos

-- ==========================================
-- PARTE 1: INGREDIENTS
-- ==========================================
-- Macros por 100g. Los que no tienen datos en el Excel van en 0
-- (se pueden actualizar después desde el admin)

INSERT INTO ingredients (name, type, calories, protein, carbs, fats, unit) VALUES

  -- PROTEÍNAS (se ajustan con size.protein_qty)
  ('Pechuga de Pollo',    'pro', 120, 23,  0,  3, 'g'),
  ('Carne Molida 97/3',     'pro', 115, 21,  0,  4, 'g'),
  ('Carne Molida 95/5',     'pro', 137, 21,  0,  5, 'g'),
  ('Carne Molida 90/10',     'pro', 168, 19,  0, 11, 'g'),

  -- CARBOHIDRATOS (se ajustan con size.carb_qty)
  ('Pasta Tornillo',              'carb', 375, 11, 76, 1, 'g'),
  ('Pasta Pluma',                 'carb', 375, 11, 76, 1, 'g'),
  ('Pasta Linguini',              'carb', 375, 11, 76, 1, 'g'),
  ('Arroz Super Extra',           'carb', 348,  7, 80, 0, 'g'),
  ('Fideo Ramen',                 'carb', 361, 11, 70, 4, 'g'),

  -- VEGETALES (se ajustan con size.veg_qty)
  ('Brócoli Congelado',           'veg', 34, 3, 4, 0, 'g'),
  ('Ejote Verde',                 'veg',  0, 0, 0, 0, 'g'),
  ('Espinaca',                    'veg',  0, 0, 0, 0, 'g'),
  ('Calabacita',                  'veg',  0, 0, 0, 0, 'g'),
  ('Edamames',                    'veg',  0, 0, 0, 0, 'g'),
  ('Verduras Ramen Congeladas',   'veg',  0, 0, 0, 0, 'g'),
  ('Rajas Poblano',               'veg',  0, 0, 0, 0, 'g'),
  ('Verduras Primavera',          'veg',  0, 0, 0, 0, 'g'),
  ('Pimiento Rojo',               'veg',  0, 0, 0, 0, 'g'),
  ('Pimiento Amarillo',           'veg',  0, 0, 0, 0, 'g'),
  ('Pimiento Verde',              'veg',  0, 0, 0, 0, 'g'),
  ('Elote en Lata',               'veg',  0, 0, 0, 0, 'g'),
  ('Chile Poblano',               'veg',  0, 0, 0, 0, 'g'),

  -- ACEITES Y VINAGRES (null = cantidad fija en receta)
  ('Aceite de Oliva',             NULL, 0, 0, 0, 0, 'ml'),
  ('Aceite de Ajonjoli',          NULL, 0, 0, 0, 0, 'ml'),
  ('Red Wine Vinegar',            NULL, 0, 0, 0, 0, 'ml'),
  ('White Wine Vinegar',          NULL, 0, 0, 0, 0, 'ml'),
  ('Vinagre de Arroz',            NULL, 0, 0, 0, 0, 'ml'),
  ('Vinagre de Manzana',          NULL, 0, 0, 0, 0, 'ml'),

  -- LÁCTEOS Y QUESOS
  ('Yogurt Griego 0% Fage',       NULL, 0, 0, 0, 0, 'g'),
  ('Queso Cottage',               NULL, 0, 0, 0, 0, 'g'),
  ('Parmesano Grounded',          NULL, 0, 0, 0, 0, 'g'),
  ('Leche Lala Light',            NULL, 0, 0, 0, 0, 'ml'),
  ('Queso Cheddar',               NULL, 0, 0, 0, 0, 'g'),
  ('Queso Mozzarela',             NULL, 0, 0, 0, 0, 'g'),
  ('Queso Parmigiano-Reggiano',   NULL, 0, 0, 0, 0, 'g'),
  ('Queso Ricotta',               NULL, 0, 0, 0, 0, 'g'),
  ('Crema Half And Half',         NULL, 0, 0, 0, 0, 'ml'),

  -- SALSAS Y CONDIMENTOS
  ('Salsa de Soya',               NULL, 0, 0, 0, 0, 'ml'),
  ('Sriracha',                    NULL, 0, 0, 0, 0, 'g'),
  ('Salsa Inglesa Worcestershire', NULL, 0, 0, 0, 0, 'ml'),
  ('Salsa de Ostion',             NULL, 0, 0, 0, 0, 'g'),
  ('Mirin',                       NULL, 0, 0, 0, 0, 'ml'),
  ('Tabasco',                     NULL, 0, 0, 0, 0, 'ml'),
  ('Salsa Agridulce',             NULL, 0, 0, 0, 0, 'g'),
  ('Chile Colorado',              NULL, 0, 0, 0, 0, 'ml'),
  ('Mostaza',                     NULL, 0, 0, 0, 0, 'g'),
  ('Mayonesa Light',              NULL, 0, 0, 0, 0, 'g'),

  -- SALSAS PARA PASTA
  ('Salsa Alfredo',               NULL, 0, 0, 0, 0, 'g'),
  ('Salsa Ajo Asado',             NULL, 0, 0, 0, 0, 'g'),
  ('Salsa Espinacas y Queso',     NULL, 0, 0, 0, 0, 'g'),

  -- BASES Y CALDOS
  ('Pasta de Tomate',             NULL, 0, 0, 0, 0, 'g'),
  ('Tomates Molidos',             NULL, 0, 0, 0, 0, 'g'),
  ('Caldo de Pollo',              NULL, 0, 0, 0, 0, 'ml'),
  ('Mole Doña Maria',             NULL, 0, 0, 0, 0, 'g'),
  ('Crema de Poblano',            NULL, 0, 0, 0, 0, 'g'),
  ('Agua',                        NULL, 0, 0, 0, 0, 'ml'),

  -- ENDULZANTES Y ÁCIDOS
  ('Miel de Abeja',               NULL, 0, 0, 0, 0, 'g'),
  ('Zero Cal Monkfruit',          NULL, 0, 0, 0, 0, 'g'),
  ('Jugo de Limon',               NULL, 0, 0, 0, 0, 'ml'),

  -- ESPECIAS Y SASONADORES
  ('Sal en Grano',                NULL, 0, 0, 0, 0, 'g'),
  ('Pimienta Negra',              NULL, 0, 0, 0, 0, 'g'),
  ('Pimienta Cayenna',            NULL, 0, 0, 0, 0, 'g'),
  ('Ajo en Polvo',                NULL, 0, 0, 0, 0, 'g'),
  ('Cebolla en Polvo',            NULL, 0, 0, 0, 0, 'g'),
  ('Paprika',                     NULL, 0, 0, 0, 0, 'g'),
  ('Pimenton Rojo Triturado',     NULL, 0, 0, 0, 0, 'g'),
  ('Oregano Seco',                NULL, 0, 0, 0, 0, 'g'),
  ('Comino Molido',               NULL, 0, 0, 0, 0, 'g'),
  ('Hierbas Finas Sasonador',     NULL, 0, 0, 0, 0, 'g'),
  ('Blackened Seasoning',         NULL, 0, 0, 0, 0, 'g'),
  ('Consome de Pollo',            NULL, 0, 0, 0, 0, 'g'),
  ('Ajonjoli',                    NULL, 0, 0, 0, 0, 'g'),

  -- FRESCOS Y AROMÁTICOS
  ('Ajo Cloves',                  NULL, 0, 0, 0, 0, 'g'),
  ('Ajo Picado',                  NULL, 0, 0, 0, 0, 'g'),
  ('Jengibre',                    NULL, 0, 0, 0, 0, 'g'),
  ('Cebolla Blanca',              NULL, 0, 0, 0, 0, 'g'),
  ('Chile Jalapeño',              NULL, 0, 0, 0, 0, 'g'),
  ('Chile Chipotle',              NULL, 0, 0, 0, 0, 'g'),
  ('Cilantro Manojo',             NULL, 0, 0, 0, 0, 'pz'),
  ('Perejil Liso Manojo',         NULL, 0, 0, 0, 0, 'pz'),
  ('Albahaca',                    NULL, 0, 0, 0, 0, 'pz'),
  ('Cebollin',                    NULL, 0, 0, 0, 0, 'pz');

-- ==========================================
-- PARTE 2: SUB-RECETAS (4 salsas)
-- ==========================================

INSERT INTO recipes (name, type, ingredients) VALUES

-- 1. Pollo Chipotle Salsa → usada en POLLO CHIPOTLE (26g por porción)
(
  'Pollo Chipotle Salsa', 'sub',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Yogurt Griego 0% Fage'), 'qty', 420,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'White Wine Vinegar'),    'qty', 1,    'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cilantro Manojo'),       'qty', 3,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Perejil Liso Manojo'),   'qty', 3,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Chile Jalapeño'),        'qty', 3,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla en Polvo'),      'qty', 1,    'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo Cloves'),            'qty', 2,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Hierbas Finas Sasonador'),'qty', 1,   'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),       'qty', 60,   'unit', 'ml')
  )
),

-- 2. Pollo Ajo Parm Picante Salsa → usada en POLLO AJO PARMESANO (22g por porción)
(
  'Pollo Ajo Parm Picante Salsa', 'sub',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Yogurt Griego 0% Fage'), 'qty', 420,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Miel de Abeja'),          'qty', 70,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Chile Chipotle'),         'qty', 70,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Jugo de Limon'),          'qty', 2,    'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 2,    'unit', 'tbsp')
  )
),

-- 3. Carne de Res Koreana Salsa → usada en KOREAN BEEF BOWL (5g por porción)
(
  'Carne de Res Koreana Salsa', 'sub',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Yogurt Griego 0% Fage'), 'qty', 120,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sriracha'),               'qty', 15,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Jugo de Limon'),          'qty', 7,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.5,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.13, 'unit', 'tsp')
  )
),

-- 4. Pollo Bang Bang Salsa → usada en CHICKEN BANG BANG (15g por porción)
(
  'Pollo Bang Bang Salsa', 'sub',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Yogurt Griego 0% Fage'), 'qty', 250,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa Agridulce'),        'qty', 70,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Miel de Abeja'),          'qty', 15,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sriracha'),               'qty', 20,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Jugo de Limon'),          'qty', 3,    'unit', 'tsp')
  )
);

-- ==========================================
-- PARTE 3: RECETAS PRINCIPALES (19 meals)
-- ==========================================

INSERT INTO recipes (name, type, ingredients) VALUES

-- 1. PASTA TOSCANA
(
  'Pasta Toscana', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 3,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Paprika'),                'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Hierbas Finas Sasonador'),'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Espinaca'),               'qty', 60,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pasta Tornillo'),         'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Queso Cottage'),          'qty', 50,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Parmesano Grounded'),     'qty', 15,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Leche Lala Light'),       'qty', 30,   'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pasta de Tomate'),        'qty', 0.25, 'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo Picado'),             'qty', 0.5,  'unit', 'pz')
  )
),

-- 2. POLLO AJO PARMESANO
(
  'Pollo Ajo Parmesano', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 3,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'White Wine Vinegar'),     'qty', 0.5,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Oregano Seco'),           'qty', 0.13, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla en Polvo'),       'qty', 0.06, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimenton Rojo Triturado'),'qty', 0.06, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.2,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Negra'),         'qty', 0.1,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Miel de Abeja'),          'qty', 2.5,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Parmesano Grounded'),     'qty', 5,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Brócoli Congelado'),      'qty', 60,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g')
  )
),

-- 3. POLLO CHIMICHURRI
(
  'Pollo Chimichurri', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Paprika'),                'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla en Polvo'),       'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.23, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Negra'),         'qty', 0.18, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Perejil Liso Manojo'),    'qty', 0.1,  'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cilantro Manojo'),        'qty', 0.03, 'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo Cloves'),             'qty', 1.5,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 8,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Red Wine Vinegar'),       'qty', 2,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimenton Rojo Triturado'),'qty', 0.1,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Oregano Seco'),           'qty', 0.4,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ejote Verde'),            'qty', 70,   'unit', 'g')
  )
),

-- 4. TACO PASTA (CHECK TEST → active=false)
(
  'Taco Pasta', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Carne Molida 95/5'),      'qty', 180,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Chile Colorado'),         'qty', 16.67, 'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Leche Lala Light'),       'qty', 16.67, 'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Queso Cheddar'),          'qty', 8.33,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimiento Amarillo'),      'qty', 25,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimiento Rojo'),          'qty', 25,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla Blanca'),         'qty', 25,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Queso Cottage'),          'qty', 58.33, 'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pasta Tornillo'),         'qty', 66.67, 'unit', 'g')
  )
),

-- 5. RAMEN DE POLLO
(
  'Ramen de Pollo', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Fideo Ramen'),            'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sriracha'),               'qty', 10,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Miel de Abeja'),          'qty', 15,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa de Soya'),          'qty', 7.5,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Vinagre de Arroz'),       'qty', 3.75, 'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Ajonjoli'),     'qty', 3,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Verduras Ramen Congeladas'),'qty', 70, 'unit', 'g')
  )
),

-- 6. KOREAN BEEF BOWL
(
  'Korean Beef Bowl', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Carne Molida 95/5'),        'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo Cloves'),             'qty', 4.5,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Ajonjoli'),     'qty', 2,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Zero Cal Monkfruit'),     'qty', 5,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa de Soya'),          'qty', 19,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sriracha'),               'qty', 4,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Calabacita'),             'qty', 120,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.5,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebollin'),               'qty', 0.1,  'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajonjoli'),               'qty', 0.1,  'unit', 'g')
  )
),

-- 7. LEMON PEPPER CHICKEN BITES (MODIFY → active=false)
(
  'Lemon Pepper Chicken Bites', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla en Polvo'),       'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Paprika'),                'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Negra'),         'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo Cloves'),             'qty', 2,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Caldo de Pollo'),         'qty', 24,   'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Crema Half And Half'),    'qty', 36,   'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa Inglesa Worcestershire'),'qty', 2, 'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Jugo de Limon'),          'qty', 0.25, 'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g')
  )
),

-- 8. POLLO MIEL Y LIMON
(
  'Pollo Miel y Limon', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 3,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pasta de Tomate'),        'qty', 0.75, 'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo Cloves'),             'qty', 3,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Miel de Abeja'),          'qty', 10,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Jugo de Limon'),          'qty', 5,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Negra'),         'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Paprika'),                'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Oregano Seco'),           'qty', 0.25, 'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Brócoli Congelado'),      'qty', 60,   'unit', 'g')
  )
),

-- 9. CHICKEN BROCCOLI STIR-FRY (CHECK TEST → active=false)
(
  'Chicken Broccoli Stir-Fry', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa de Ostion'),        'qty', 4.5,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa de Soya'),          'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Negra'),         'qty', 0.06, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo Cloves'),             'qty', 1.5,  'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Jengibre'),               'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Caldo de Pollo'),         'qty', 4.25, 'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa de Ostion'),        'qty', 0.5,  'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Mirin'),                  'qty', 0.5,  'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa de Soya'),          'qty', 0.75, 'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Zero Cal Monkfruit'),     'qty', 0.5,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Brócoli Congelado'),      'qty', 100,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 60,   'unit', 'g')
  )
),

-- 10. MOLE
(
  'Mole', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla en Polvo'),       'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Comino Molido'),          'qty', 0.13, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 3,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Mole Doña Maria'),        'qty', 20,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Consome de Pollo'),       'qty', 0.3,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Rajas Poblano'),          'qty', 60,   'unit', 'g')
  )
),

-- 11. PASTA ALFREDO
(
  'Pasta Alfredo', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 3,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Paprika'),                'qty', 0.3,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.3,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla en Polvo'),       'qty', 0.3,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Comino Molido'),          'qty', 0.15, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Oregano Seco'),           'qty', 0.2,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.2,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Negra'),         'qty', 0.2,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Brócoli Congelado'),      'qty', 60,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pasta Linguini'),         'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Caldo de Pollo'),         'qty', 20,   'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa Alfredo'),          'qty', 50,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Queso Mozzarela'),        'qty', 10,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Queso Parmigiano-Reggiano'),'qty', 8,  'unit', 'g')
  )
),

-- 12. SRIRACHA LIME (ALCH NOSE → active=false)
(
  'Sriracha Lime Chicken', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 3,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Jugo de Limon'),          'qty', 5,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sriracha'),               'qty', 5,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Miel de Abeja'),          'qty', 10,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.4,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla en Polvo'),       'qty', 0.4,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Negra'),         'qty', 0.2,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Brócoli Congelado'),      'qty', 90,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g')
  )
),

-- 13. SPICY HONEY BOWL (MODIFY TEST → active=false)
(
  'Spicy Honey Bowl', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Carne Molida 95/5'),        'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo Cloves'),             'qty', 3,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimenton Rojo Triturado'),'qty', 0.2,  'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Miel de Abeja'),          'qty', 12,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Tabasco'),                'qty', 0.5,  'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Vinagre de Manzana'),     'qty', 4,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla Blanca'),         'qty', 20,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Chile Poblano'),          'qty', 40,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g')
  )
),

-- 14. CHICKEN BANG BANG (ALCH NOSE → active=false, usa Pollo Bang Bang Salsa)
(
  'Chicken Bang Bang', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 3,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Paprika'),                'qty', 0.5,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla en Polvo'),       'qty', 0.5,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Negra'),         'qty', 0.1,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa de Soya'),          'qty', 0.5,  'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Zero Cal Monkfruit'),     'qty', 6,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Edamames'),               'qty', 60,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g')
  )
),

-- 15. POLLO CHIPOTLE (active=true, usa Pollo Chipotle Salsa)
(
  'Pollo Chipotle', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Chile Chipotle'),         'qty', 12,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo Cloves'),             'qty', 0.5,  'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Comino Molido'),          'qty', 0.1,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Oregano Seco'),           'qty', 0.2,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 3,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Jugo de Limon'),          'qty', 5,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Negra'),         'qty', 0.12, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla Blanca'),         'qty', 30,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimiento Amarillo'),      'qty', 30,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimiento Rojo'),          'qty', 30,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimiento Verde'),         'qty', 30,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Elote en Lata'),          'qty', 20,   'unit', 'g')
  )
),

-- 16. PASTA BOLOGNESA
(
  'Pasta Bolognesa', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Carne Molida 95/5'),        'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Hierbas Finas Sasonador'),'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Tomates Molidos'),        'qty', 45,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Blackened Seasoning'),    'qty', 0.3,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Espinaca'),               'qty', 50,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pasta Pluma'),            'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa Ajo Asado'),        'qty', 50,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Queso Ricotta'),          'qty', 30,   'unit', 'g')
  )
),

-- 17. POLLO MOSTAZA
(
  'Pollo Mostaza', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 3,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Mostaza'),                'qty', 5,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Miel de Abeja'),          'qty', 5,    'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.75, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla en Polvo'),       'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.75, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Negra'),         'qty', 0.12, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Cayenna'),       'qty', 0.15, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ejote Verde'),            'qty', 70,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g')
  )
),

-- 18. PASTA POMODORO
(
  'Pasta Pomodoro', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 3,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Paprika'),                'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Hierbas Finas Sasonador'),'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pasta Pluma'),            'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa Espinacas y Queso'),'qty', 40,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Queso Parmigiano-Reggiano'),'qty', 10, 'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Queso Cottage'),          'qty', 36,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimenton Rojo Triturado'),'qty', 0.1,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Albahaca'),               'qty', 0.1,  'unit', 'pz')
  )
),

-- 19. PASTA POBLANO
(
  'Pasta Poblano', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pechuga de Pollo'),       'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),        'qty', 3,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Paprika'),                'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla en Polvo'),       'qty', 0.25, 'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Brócoli Congelado'),      'qty', 60,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pasta Tornillo'),         'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Crema de Poblano'),       'qty', 70,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Leche Lala Light'),       'qty', 20,   'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Parmesano Grounded'),     'qty', 5,    'unit', 'g')
  )
),

-- 20. PICADILLO
(
  'Picadillo', 'main',
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Carne Molida 97/3'),        'qty', 180,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en Grano'),           'qty', 0.3,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Pimienta Negra'),         'qty', 0.2,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),           'qty', 0.2,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Tomates Molidos'),        'qty', 85,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Arroz Super Extra'),      'qty', 55,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Consome de Pollo'),       'qty', 0.3,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Verduras Primavera'),     'qty', 60,   'unit', 'g')
  )
);

-- ==========================================
-- PARTE 4A: MEALS (19 platillos)
-- ==========================================
-- active=true  → Pasta Toscana, Pollo Ajo Parmesano, Korean Beef Bowl, Pollo Chipotle
-- active=false → todos los demás (CHECK TEST / MODIFY / ALCH NOSE y el resto)

INSERT INTO meals (name, description, main_recipe_id, active) VALUES

  ('Pasta Toscana',
   'Pechuga de pollo con pasta tornillo, espinaca, queso cottage y parmesano',
   (SELECT id FROM recipes WHERE name = 'Pasta Toscana'),
   true),

  ('Pollo Ajo Parmesano',
   'Pechuga de pollo marinada con ajo, parmesano y brócoli con arroz',
   (SELECT id FROM recipes WHERE name = 'Pollo Ajo Parmesano'),
   true),

  ('Pollo Chimichurri',
   'Pechuga de pollo con salsa chimichurri fresca, arroz y ejote verde',
   (SELECT id FROM recipes WHERE name = 'Pollo Chimichurri'),
   false),

  ('Taco Pasta',
   'Carne molida estilo taco con pasta tornillo y queso',
   (SELECT id FROM recipes WHERE name = 'Taco Pasta'),
   false),

  ('Ramen de Pollo',
   'Pollo con fideo ramen, verduras y salsa sriracha-miel',
   (SELECT id FROM recipes WHERE name = 'Ramen de Pollo'),
   false),

  ('Korean Beef Bowl',
   'Carne molida estilo coreano con calabacita, arroz y salsa',
   (SELECT id FROM recipes WHERE name = 'Korean Beef Bowl'),
   true),

  ('Lemon Pepper Chicken Bites',
   'Pechuga de pollo con salsa cremosa de limón y arroz',
   (SELECT id FROM recipes WHERE name = 'Lemon Pepper Chicken Bites'),
   false),

  ('Pollo Miel y Limón',
   'Pechuga de pollo glaseada con miel y limón, brócoli y arroz',
   (SELECT id FROM recipes WHERE name = 'Pollo Miel y Limon'),
   false),

  ('Chicken Broccoli Stir-Fry',
   'Pollo salteado con brócoli y salsa de ostión estilo asiático',
   (SELECT id FROM recipes WHERE name = 'Chicken Broccoli Stir-Fry'),
   false),

  ('Mole',
   'Pechuga de pollo con mole, arroz y rajas poblano',
   (SELECT id FROM recipes WHERE name = 'Mole'),
   false),

  ('Pasta Alfredo',
   'Pechuga de pollo con pasta linguini, salsa alfredo y quesos',
   (SELECT id FROM recipes WHERE name = 'Pasta Alfredo'),
   false),

  ('Sriracha Lime Chicken',
   'Pechuga de pollo con salsa sriracha-limón, brócoli y arroz',
   (SELECT id FROM recipes WHERE name = 'Sriracha Lime Chicken'),
   false),

  ('Spicy Honey Bowl',
   'Carne molida picante con miel, chile poblano y arroz',
   (SELECT id FROM recipes WHERE name = 'Spicy Honey Bowl'),
   false),

  ('Chicken Bang Bang',
   'Pechuga de pollo con salsa bang bang, edamames y arroz',
   (SELECT id FROM recipes WHERE name = 'Chicken Bang Bang'),
   false),

  ('Pollo Chipotle',
   'Pechuga de pollo marinada en chipotle con pimientos, arroz y elote',
   (SELECT id FROM recipes WHERE name = 'Pollo Chipotle'),
   true),

  ('Pasta Bolognesa',
   'Carne molida con pasta pluma, salsa ajo asado y queso ricotta',
   (SELECT id FROM recipes WHERE name = 'Pasta Bolognesa'),
   false),

  ('Pollo Mostaza',
   'Pechuga de pollo en salsa de mostaza y miel con ejote y arroz',
   (SELECT id FROM recipes WHERE name = 'Pollo Mostaza'),
   false),

  ('Pasta Pomodoro',
   'Pechuga de pollo con pasta pluma, salsa espinacas y parmigiano',
   (SELECT id FROM recipes WHERE name = 'Pasta Pomodoro'),
   false),

  ('Pasta Poblano',
   'Pechuga de pollo con pasta tornillo en crema de poblano',
   (SELECT id FROM recipes WHERE name = 'Pasta Poblano'),
   false),

  ('Picadillo',
   'Carne molida estilo picadillo con tomate, verduras primavera y arroz',
   (SELECT id FROM recipes WHERE name = 'Picadillo'),
   false);

-- ==========================================
-- PARTE 4B: MEAL_SUB_RECIPES (relaciones)
-- ==========================================
-- Conecta cada meal con su salsa/sub-receta

INSERT INTO meal_sub_recipes (meal_id, sub_recipe_id) VALUES
  (
    (SELECT id FROM meals WHERE name = 'Pollo Chipotle'),
    (SELECT id FROM recipes WHERE name = 'Pollo Chipotle Salsa')
  ),
  (
    (SELECT id FROM meals WHERE name = 'Pollo Ajo Parmesano'),
    (SELECT id FROM recipes WHERE name = 'Pollo Ajo Parm Picante Salsa')
  ),
  (
    (SELECT id FROM meals WHERE name = 'Korean Beef Bowl'),
    (SELECT id FROM recipes WHERE name = 'Carne de Res Koreana Salsa')
  ),
  (
    (SELECT id FROM meals WHERE name = 'Chicken Bang Bang'),
    (SELECT id FROM recipes WHERE name = 'Pollo Bang Bang Salsa')
  );

-- ==========================================
-- PARTE 4C: PACKAGES (3 paquetes)
-- ==========================================

INSERT INTO packages (name, description, meals_included, active) VALUES
  ('Paquete x5',  '5 comidas a elegir del menú',   5,  true),
  ('Paquete x10', '10 comidas a elegir del menú',  10, true),
  ('Paquete x15', '15 comidas a elegir del menú',  15, true);

-- ==========================================
-- PARTE 4D: PICKUP SPOTS
-- ==========================================

INSERT INTO pickup_spots (name, address, schedule, zone, active) VALUES
  ('Pickup Spot - San Pedro',
   'Av. Gómez Morín 123, San Pedro Garza García',
   'Sábados 10AM - 2PM',
   'San Pedro',
   true),
  ('Pickup Spot - Centro',
   'Av. Constitución 456, Centro, Monterrey',
   'Domingos 11AM - 3PM',
   'Monterrey Centro',
   true);

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================

SELECT 'sizes'        AS tabla, COUNT(*) AS total FROM sizes
UNION ALL
SELECT 'ingredients',          COUNT(*) FROM ingredients
UNION ALL
SELECT 'recipes',              COUNT(*) FROM recipes
UNION ALL
SELECT 'meals',                COUNT(*) FROM meals
UNION ALL
SELECT 'meals activos',        COUNT(*) FROM meals WHERE active = true
UNION ALL
SELECT 'meal_sub_recipes',     COUNT(*) FROM meal_sub_recipes
UNION ALL
SELECT 'packages',             COUNT(*) FROM packages
UNION ALL
SELECT 'pickup_spots',         COUNT(*) FROM pickup_spots
ORDER BY tabla;

-- Verificar relaciones meal → sub-receta
SELECT
  m.name AS meal,
  r.name AS sub_receta
FROM meal_sub_recipes msr
JOIN meals m ON m.id = msr.meal_id
JOIN recipes r ON r.id = msr.sub_recipe_id
ORDER BY m.name;
