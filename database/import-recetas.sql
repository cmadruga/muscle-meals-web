-- ============================================================
-- MUSCLE MEALS — Import: Recetas Principales (20 recetas)
-- Generado: 2026-03-12
-- PREREQUISITO: import-ingredientes-materiales.sql + import-subrecetas.sql ya corridos
-- ============================================================
-- NOTA DE MEALS:
--   Este script elimina todas las recetas type='main'.
--   Si hay meals que referencien recetas principales, la operación
--   fallará por FK. Para limpiar primero:
--     DELETE FROM meal_sub_recipes;
--     DELETE FROM order_items WHERE meal_id IN (SELECT id FROM meals);
--     DELETE FROM meals;
--   O bien manejar los meals desde admin antes de correr esto.
-- ============================================================

DELETE FROM recipes WHERE type = 'main';

-- ── 1. PASTA TOSCANA ─────────────────────────────────────────
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Pasta Toscana', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),       'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),         'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),            'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),            'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Paprika'),                 'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Hierbas Finas Sasonador'), 'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Espinaca'),                'qty',60,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pasta Tornillo'),          'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Queso Cottage'),           'qty',50,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Parmesano Grounded'),      'qty',15,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Leche Lala Light Protina+'),'qty',30,   'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pasta de Tomate'),         'qty',0.25,  'unit','tbsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo Picado'),              'qty',0.5,   'unit','pz')
);

-- ── 2. POLLO AJO PARMESANO ───────────────────────────────────
-- Sub-receta: Salsa Miel y Chipotle (25g)
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Pollo Ajo Parmesano', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),        'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),         'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='White Wine Vinegar'),      'qty',0.5,   'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),            'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Oregano Seco'),            'qty',0.13,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Cebolla en polvo'),        'qty',0.06,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimenton Rojo Triturado'), 'qty',0.06,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),            'qty',0.20,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimienta negra'),          'qty',0.10,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Miel de Abeja'),           'qty',2.5,   'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Parmesano Grounded'),      'qty',5,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Vegetales Congelados Brocoli'),'qty',60,'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),       'qty',55,    'unit','g',    'section','carb')
);

-- ── 3. POLLO CHIMICHURRI ──────────────────────────────────────
-- Sin sub-recetas. Sal/Pimienta/Oregano duplicados combinados.
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Pollo Chimichurri', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),        'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),       'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ejote Verde'),             'qty',70,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Perejil Liso Manojo'),     'qty',0.10,  'unit','pz'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Cilantro Manojo'),         'qty',0.03,  'unit','pz'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo Cloves'),              'qty',1.5,   'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),         'qty',8,     'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Red Wine Vinegar'),        'qty',2,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimenton Rojo Triturado'), 'qty',0.10,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),            'qty',0.23,  'unit','tsp'),  -- 0.13 + 0.10
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimienta negra'),          'qty',0.18,  'unit','tsp'),  -- 0.13 + 0.05
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Oregano Seco'),            'qty',0.40,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Paprika'),                 'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),            'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Cebolla en polvo'),        'qty',0.25,  'unit','tsp')
);

-- ── 4. TACO PASTA CHECK TEST — omitido (no se importa)

-- ── 5. RAMEN DE POLLO ─────────────────────────────────────────
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Ramen de Pollo', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),        'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Fideo Ramen'),             'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Verduras Ramen Congeladas'),'qty',70,   'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),            'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),            'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sriracha'),                'qty',10,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Miel de Abeja'),           'qty',15,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Salsa de Soya'),           'qty',7.5,   'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Vinagre de Arroz'),        'qty',3.75,  'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Ajonjoli'),      'qty',3,     'unit','g')
);

-- ── 6. KOREAN BEEF BOWL ───────────────────────────────────────
-- Sub-receta: Salsa Sriracha (1 Und.)
-- Salsa de Soya duplicada combinada: 16 + 3 = 19g
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Korean Beef Bowl', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Carne Molida 95'),             'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Calabacita'),                  'qty',120,   'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),           'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo Cloves'),                  'qty',4.5,   'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Ajonjoli'),          'qty',2,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Zero Cal Monkfruit Azucar Morena'),'qty',5, 'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Salsa de Soya'),               'qty',19,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sriracha'),                    'qty',4,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),                'qty',0.5,   'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Cebollin Empacada'),           'qty',0.10,  'unit','pz'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajonjoli'),                    'qty',0.10,  'unit','g')
);

-- ── 7. LEMON PEPPER CHICKEN BITES MODIFY (inactivo) ──────────
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Lemon Pepper Chicken Bites Modify', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),            'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),           'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Cebolla en polvo'),            'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),                'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Paprika'),                     'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),                'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimienta negra'),              'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Mantequilla Light'),           'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo Cloves'),                  'qty',2,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Caldo de pollo'),              'qty',24,    'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Crema Half And Half lyncott'), 'qty',36,    'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Salsa Inglesa Worcestershire'),'qty',2,     'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='jugo de limon'),               'qty',0.25,  'unit','pz')
);

-- ── 8. POLLO MIEL Y LIMON ────────────────────────────────────
-- Sub-receta: Salsa Jalapeño Ranch (1 Und.)
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Pollo Miel y Limón', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),            'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),           'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Vegetales Congelados Brocoli'),'qty',60,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),             'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pasta de Tomate'),             'qty',0.75,  'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo Cloves'),                  'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Miel de Abeja'),               'qty',10,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='jugo de limon'),               'qty',5,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),                'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimienta negra'),              'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Paprika'),                     'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Oregano Seco'),                'qty',0.25,  'unit','tbsp')
);

-- ── 9. CHICKEN BROCCOLI STIR-FRY CHECK TEST — omitido (no se importa)

-- ── 10. MOLE ─────────────────────────────────────────────────
-- "SUB RECETAS" en Excel son ingredientes normales (Mole Doña Maria, Consome).
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Mole', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),            'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),           'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Rajas Poblano'),               'qty',60,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),                'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),                'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Cebolla en polvo'),            'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Comino Molido'),               'qty',0.13,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),             'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Mole Doña Maria'),             'qty',20,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Consome de Pollo Knorr'),      'qty',0.30,  'unit','tsp')
);

-- ── 11. PASTA ALFREDO ─────────────────────────────────────────
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Pasta Alfredo', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),                  'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pasta Linguini'),                    'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Vegetales Congelados Brocoli'),      'qty',60,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),                   'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Paprika'),                           'qty',0.30,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),                      'qty',0.30,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Cebolla en polvo'),                  'qty',0.30,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Comino Molido'),                     'qty',0.15,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Oregano Seco'),                      'qty',0.20,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),                      'qty',0.20,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimienta negra'),                    'qty',0.20,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Caldo de pollo'),                    'qty',20,    'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Salsa para Pasta Alfredo Parmesano y Romano'),'qty',50,'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='queso mozzarela'),                   'qty',10,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='queso parmigiano-reggiano'),         'qty',8,     'unit','g')
);

-- ── 12. SRIRACHA LIME (inactivo) ─────────────────────────────
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Sriracha Lime (inactivo)', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),            'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),           'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Vegetales Congelados Brocoli'),'qty',90,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),             'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='jugo de limon'),               'qty',5,     'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sriracha'),                    'qty',5,     'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Miel de Abeja'),               'qty',10,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),                'qty',0.40,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Cebolla en polvo'),            'qty',0.40,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),                'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimienta negra'),              'qty',0.20,  'unit','tsp')
);

-- ── 13. SPICY HONEY BOWL MODIFY TEST (inactivo) ───────────────
-- OMITIDO: Corn Starch — no está en la BD.
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Spicy Honey Bowl Modify Test', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Carne Molida 95'),             'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),           'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Chile Poblano'),               'qty',40,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='cebolla blanca'),              'qty',20,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo Cloves'),                  'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimenton Rojo Triturado'),     'qty',0.20,  'unit','tbsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Miel de Abeja'),               'qty',12,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Tabasco Salsa Roja'),          'qty',0.50,  'unit','tbsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Vinagre de Manzana'),          'qty',4,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Agua'),                        'qty',0.30,  'unit','tbsp')
);

-- ── 14. CHICKEN BANG BANG ────────────────────────────────────
-- Sub-receta: Salsa Agridulce (1 Und.)
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Chicken Bang Bang', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),                'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),               'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='edamames congelados'),             'qty',60,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),                 'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Paprika'),                         'qty',0.50,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Cebolla en polvo'),                'qty',0.50,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimienta negra'),                  'qty',0.10,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Salsa de Soya'),                   'qty',0.50,  'unit','tbsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Zero Cal Monkfruit Azucar Morena'),'qty',6,     'unit','g')
);

-- ── 15. POLLO CHIPOTLE ────────────────────────────────────────
-- Sub-receta: Salsa Jalapeño Ranch (1 Und.)
-- Pimiento Amarillo/Rojo/Verde (90g) + cebolla individual → Mix de Cebolla Blanca y Pimientos (90g)
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Pollo Chipotle', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),                  'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),                 'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Mix de Cebolla Blanca y Pimientos'), 'qty',90,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Elote en Lata'),                     'qty',20,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Chile Chipotle'),                    'qty',12,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo Cloves'),                        'qty',0.5,   'unit','pz'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Comino Molido'),                     'qty',0.10,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Oregano Seco'),                      'qty',0.20,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),                   'qty',3,     'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='jugo de limon'),                     'qty',5,     'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),                      'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimienta negra'),                    'qty',0.12,  'unit','tsp')
);

-- ── 16. PASTA BOLOGNESA ──────────────────────────────────────
-- "Galbani Queso Ricotta 30g" aparece en sección Sub Recetas del Excel
-- pero es un ingrediente normal (no sub-receta real).
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Pasta Bolognesa', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Carne Molida 95'),             'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Espinaca'),                    'qty',50,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pasta Pluma'),                 'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Hierbas Finas Sasonador'),     'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Tomates Molidos Condimentados'),'qty',45,   'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Blackened Seasoning HEB'),     'qty',0.30,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Salsa Para Pasta Ajo Asado'),  'qty',50,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Galbani Queso Ricotta'),       'qty',30,    'unit','g')
);

-- ── 17. POLLO MOSTAZA ────────────────────────────────────────
-- Sub-receta: Salsa Miel y Chipotle (25g)
-- Ajo en Polvo y Sal en grano duplicados combinados.
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Pollo Mostaza', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),            'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),           'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ejote Verde'),                 'qty',70,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),             'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Mostaza'),                     'qty',5,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Miel de Abeja'),               'qty',5,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),                'qty',0.75,  'unit','tsp'),  -- 0.25 + 0.50
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Cebolla en polvo'),            'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),                'qty',0.75,  'unit','tsp'),  -- 0.25 + 0.50
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimienta negra'),              'qty',0.12,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimienta cayenna'),            'qty',0.15,  'unit','tsp')
);

-- ── 18. PASTA POMODORO ───────────────────────────────────────
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Pasta Pomodoro', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),                'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pasta Pluma'),                     'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),                 'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),                    'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),                    'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Paprika'),                         'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Hierbas Finas Sasonador'),         'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Salsa Para Pasta Espinacas Y Queso'),'qty',40,  'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='queso parmigiano-reggiano'),       'qty',10,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Queso Cottage'),                   'qty',36,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimenton Rojo Triturado'),         'qty',0.10,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Albahaca Empacada'),               'qty',0.10,  'unit','pz')
);

-- ── 19. PASTA POBLANO ────────────────────────────────────────
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Pasta Poblano', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pechuga de Pollo'),            'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pasta Tornillo'),              'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Vegetales Congelados Brocoli'),'qty',60,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Aceite de Oliva'),             'qty',3,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),                'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),                'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Paprika'),                     'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Cebolla en polvo'),            'qty',0.25,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Crema de Poblano'),            'qty',70,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Leche Lala Light Protina+'),   'qty',20,    'unit','ml'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Parmesano Grounded'),          'qty',5,     'unit','g')
);

-- ── 20. PICADILLO ────────────────────────────────────────────
-- Sub-receta: Salsa Verde (1 Und.)
INSERT INTO recipes (name, type, portions, ingredients) SELECT 'Picadillo', 'main', 1,
jsonb_build_array(
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Carne Molida 97'),                 'qty',180,   'unit','g',    'section','pro'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Arroz Super Extra'),               'qty',55,    'unit','g',    'section','carb'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Tomate Huaje'),                    'qty',65,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='cebolla blanca'),                  'qty',30,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Verduras Congelados Primavera'),   'qty',70,    'unit','g',    'section','veg'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal en grano'),                    'qty',0.30,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Pimienta negra'),                  'qty',0.20,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo en Polvo'),                    'qty',0.20,  'unit','tsp'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Tomates Molidos Condimentados'),   'qty',40,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Ajo Cloves'),                      'qty',2,     'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Caldo de pollo'),                  'qty',20,    'unit','g'),
  jsonb_build_object('ingredient_id',(SELECT id FROM ingredients WHERE name='Sal de Cebolla en Polvo'),         'qty',0.25,  'unit','tsp')
);

-- ============================================================
-- SIGUIENTE PASO: Crear/actualizar meals para que apunten a
-- las nuevas recetas. Ver import-meals.sql (próximo archivo).
-- ============================================================
