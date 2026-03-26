-- ============================================================
-- MUSCLE MEALS — Import: Meals (platillos)
-- Generado: 2026-03-12
-- PREREQUISITO: import-recetas.sql ya corrido
-- Todos los platillos se crean con active=false.
-- Activar manualmente desde /admin/database.
-- ============================================================

-- ── 1. PASTA TOSCANA ─────────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Pasta Toscana',
  'Pechuga marinada con pasta tornillo, espinaca fresca, queso cottage y parmesano.',
  false,
  (SELECT id FROM recipes WHERE name = 'Pasta Toscana' AND type = 'main')
);

-- ── 2. POLLO AJO PARMESANO ───────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Pollo Ajo Parmesano',
  'Pechuga glaseada con miel y parmesano, brócoli al vapor y arroz.',
  false,
  (SELECT id FROM recipes WHERE name = 'Pollo Ajo Parmesano' AND type = 'main')
);
INSERT INTO meal_sub_recipes (meal_id, sub_recipe_id)
VALUES (
  (SELECT id FROM meals WHERE name = 'Pollo Ajo Parmesano'),
  (SELECT id FROM recipes WHERE name = 'Salsa Miel y Chipotle' AND type = 'sub')
);

-- ── 3. POLLO CHIMICHURRI ──────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Pollo Chimichurri',
  'Pechuga marinada en chimichurri de perejil y cilantro con ejote y arroz.',
  false,
  (SELECT id FROM recipes WHERE name = 'Pollo Chimichurri' AND type = 'main')
);

-- ── 5. RAMEN DE POLLO ─────────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Ramen de Pollo',
  'Pechuga con fideo ramen, mix de verduras, miel, salsa de soya y sriracha.',
  false,
  (SELECT id FROM recipes WHERE name = 'Ramen de Pollo' AND type = 'main')
);

-- ── 6. KOREAN BEEF BOWL ───────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Korean Beef Bowl',
  'Carne molida estilo coreano con calabacita, arroz y salsa sriracha.',
  false,
  (SELECT id FROM recipes WHERE name = 'Korean Beef Bowl' AND type = 'main')
);
INSERT INTO meal_sub_recipes (meal_id, sub_recipe_id)
VALUES (
  (SELECT id FROM meals WHERE name = 'Korean Beef Bowl'),
  (SELECT id FROM recipes WHERE name = 'Salsa Sriracha' AND type = 'sub')
);

-- ── 7. LEMON PEPPER CHICKEN BITES MODIFY ─────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Lemon Pepper Chicken Bites Modify',
  'Pechuga en salsa cremosa de caldo de pollo con ajo y arroz.',
  false,
  (SELECT id FROM recipes WHERE name = 'Lemon Pepper Chicken Bites Modify' AND type = 'main')
);

-- ── 8. POLLO MIEL Y LIMÓN ────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Pollo Miel y Limón',
  'Pechuga glaseada con miel y limón, brócoli y arroz con salsa jalapeño ranch.',
  false,
  (SELECT id FROM recipes WHERE name = 'Pollo Miel y Limón' AND type = 'main')
);
INSERT INTO meal_sub_recipes (meal_id, sub_recipe_id)
VALUES (
  (SELECT id FROM meals WHERE name = 'Pollo Miel y Limón'),
  (SELECT id FROM recipes WHERE name = 'Salsa Jalapeño Ranch' AND type = 'sub')
);

-- ── 10. MOLE ─────────────────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Mole',
  'Pechuga bañada en mole Doña María con rajas poblano y arroz.',
  false,
  (SELECT id FROM recipes WHERE name = 'Mole' AND type = 'main')
);

-- ── 11. PASTA ALFREDO ─────────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Pasta Alfredo',
  'Pechuga con pasta linguini, brócoli y salsa alfredo de parmesano.',
  false,
  (SELECT id FROM recipes WHERE name = 'Pasta Alfredo' AND type = 'main')
);

-- ── 12. SRIRACHA LIME ────────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Sriracha Lime',
  'Pechuga marinada en sriracha y limón con brócoli y arroz.',
  false,
  (SELECT id FROM recipes WHERE name = 'Sriracha Lime (inactivo)' AND type = 'main')
);

-- ── 13. SPICY HONEY BOWL ─────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Spicy Honey Bowl',
  'Carne molida con chile poblano, cebolla, arroz y glaseado de miel picante.',
  false,
  (SELECT id FROM recipes WHERE name = 'Spicy Honey Bowl Modify Test' AND type = 'main')
);

-- ── 14. CHICKEN BANG BANG ────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Chicken Bang Bang',
  'Pechuga con edamame, arroz y salsa agridulce bang bang.',
  false,
  (SELECT id FROM recipes WHERE name = 'Chicken Bang Bang' AND type = 'main')
);
INSERT INTO meal_sub_recipes (meal_id, sub_recipe_id)
VALUES (
  (SELECT id FROM meals WHERE name = 'Chicken Bang Bang'),
  (SELECT id FROM recipes WHERE name = 'Salsa Agridulce' AND type = 'sub')
);

-- ── 15. POLLO CHIPOTLE ────────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Pollo Chipotle',
  'Pechuga marinada en chipotle con arroz, elote y salsa jalapeño ranch.',
  false,
  (SELECT id FROM recipes WHERE name = 'Pollo Chipotle' AND type = 'main')
);
INSERT INTO meal_sub_recipes (meal_id, sub_recipe_id)
VALUES (
  (SELECT id FROM meals WHERE name = 'Pollo Chipotle'),
  (SELECT id FROM recipes WHERE name = 'Salsa Jalapeño Ranch' AND type = 'sub')
);

-- ── 16. PASTA BOLOGNESA ──────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Pasta Bolognesa',
  'Carne molida con pasta pluma, espinaca, ricotta y salsa boloñesa de tomate.',
  false,
  (SELECT id FROM recipes WHERE name = 'Pasta Bolognesa' AND type = 'main')
);

-- ── 17. POLLO MOSTAZA ────────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Pollo Mostaza',
  'Pechuga en salsa de mostaza y miel con ejote, arroz y salsa miel chipotle.',
  false,
  (SELECT id FROM recipes WHERE name = 'Pollo Mostaza' AND type = 'main')
);
INSERT INTO meal_sub_recipes (meal_id, sub_recipe_id)
VALUES (
  (SELECT id FROM meals WHERE name = 'Pollo Mostaza'),
  (SELECT id FROM recipes WHERE name = 'Salsa Miel y Chipotle' AND type = 'sub')
);

-- ── 18. PASTA POMODORO ───────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Pasta Pomodoro',
  'Pechuga con pasta pluma, salsa de espinacas y queso, cottage y parmigiano.',
  false,
  (SELECT id FROM recipes WHERE name = 'Pasta Pomodoro' AND type = 'main')
);

-- ── 19. PASTA POBLANO ────────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Pasta Poblano',
  'Pechuga con pasta tornillo, brócoli y crema de chile poblano.',
  false,
  (SELECT id FROM recipes WHERE name = 'Pasta Poblano' AND type = 'main')
);

-- ── 20. PICADILLO ────────────────────────────────────────────
INSERT INTO meals (name, description, active, main_recipe_id)
VALUES (
  'Picadillo',
  'Carne molida con tomate, cebolla, verduras de primavera, arroz y salsa verde.',
  false,
  (SELECT id FROM recipes WHERE name = 'Picadillo' AND type = 'main')
);
INSERT INTO meal_sub_recipes (meal_id, sub_recipe_id)
VALUES (
  (SELECT id FROM meals WHERE name = 'Picadillo'),
  (SELECT id FROM recipes WHERE name = 'Salsa Verde' AND type = 'sub')
);
