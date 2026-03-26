-- ============================================================
-- MUSCLE MEALS — Import: Sub-Recetas
-- Generado: 2026-03-12
-- Instrucciones: Ejecutar completo en Supabase SQL Editor
-- PREREQUISITO: import-ingredientes-materiales.sql ya corrido
-- ============================================================

-- 1. Limpiar sub-recetas (preservar Salsa Cremosa, Pure de Papa Test Yogurt, Pure de Papa Test Leche)
--    Primero desconectar de meals para evitar FK violations
DELETE FROM meal_sub_recipes
WHERE sub_recipe_id IN (
  SELECT id FROM recipes
  WHERE type = 'sub'
    AND name NOT IN ('Salsa Cremosa', 'Pure de Papa Test Yogurt', 'Pure de Papa Test Leche')
);

DELETE FROM recipes
WHERE type = 'sub'
  AND name NOT IN ('Salsa Cremosa', 'Pure de Papa Test Yogurt', 'Pure de Papa Test Leche');

-- ============================================================
-- 2. Insertar nuevas sub-recetas
-- portions = 1 por defecto — actualizar desde /admin/database una vez confirmado
-- ============================================================

-- ── Salsa Jalapeño Ranch (625g) ──────────────────────────────
INSERT INTO recipes (name, type, portions, ingredients)
SELECT
  'Salsa Jalapeño Ranch',
  'sub',
  1,
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Yogurt Griego 0% Fage'),    'qty', 420,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'White Wine Vinegar'),       'qty', 1,    'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cilantro Manojo'),          'qty', 3,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Perejil Liso Manojo'),      'qty', 8,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Chile Jalapeño'),           'qty', 3,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Cebolla en polvo'),         'qty', 1,    'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo Cloves'),               'qty', 2,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Hierbas Finas Sasonador'),  'qty', 1,    'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),          'qty', 60,   'unit', 'ml')
  );

-- ── Salsa Agridulce (375g) ───────────────────────────────────
INSERT INTO recipes (name, type, portions, ingredients)
SELECT
  'Salsa Agridulce',
  'sub',
  1,
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Mayonesa Light HELLMANS'),  'qty', 250,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Salsa Agridulce'),          'qty', 70,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Miel de Abeja'),            'qty', 15,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sriracha'),                 'qty', 20,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'jugo de limon'),            'qty', 3,    'unit', 'tsp')
  );

-- ── Salsa Miel y Chipotle (325g) ─────────────────────────────
INSERT INTO recipes (name, type, portions, ingredients)
SELECT
  'Salsa Miel y Chipotle',
  'sub',
  1,
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Yogurt Griego 0% Fage'),    'qty', 240,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Miel de Abeja'),            'qty', 35,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Chile Chipotle'),           'qty', 35,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'jugo de limon'),            'qty', 1,    'unit', 'tbsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en grano'),             'qty', 1,    'unit', 'tsp')
  );

-- ── Salsa Sriracha ───────────────────────────────────────────
INSERT INTO recipes (name, type, portions, ingredients)
SELECT
  'Salsa Sriracha',
  'sub',
  1,
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Yogurt Griego 0% Fage'),    'qty', 120,  'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sriracha'),                 'qty', 15,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'jugo de limon'),            'qty', 7,    'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo en Polvo'),             'qty', 0.5,  'unit', 'tsp'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Sal en grano'),             'qty', 0.13, 'unit', 'tsp')
  );

-- ── Salsa Verde ──────────────────────────────────────────────
INSERT INTO recipes (name, type, portions, ingredients)
SELECT
  'Salsa Verde',
  'sub',
  1,
  jsonb_build_array(
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Chile Jalapeño'),           'qty', 9,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Chile Serrano'),            'qty', 8,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Tomatillo Verde'),          'qty', 8,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'cebolla blanca'),           'qty', 0.25, 'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Consome de Pollo Knorr'),   'qty', 80,   'unit', 'g'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Ajo Cloves'),               'qty', 3,    'unit', 'pz'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Aceite de Oliva'),          'qty', 90,   'unit', 'ml'),
    jsonb_build_object('ingredient_id', (SELECT id FROM ingredients WHERE name = 'Calabacita'),               'qty', 1,    'unit', 'pz')
  );
