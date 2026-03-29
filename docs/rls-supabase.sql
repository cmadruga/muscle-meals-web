-- ============================================================
-- MUSCLE MEALS — Habilitar RLS en Supabase
-- Correr en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Habilitar RLS en todas las tablas
-- ----------------------------------------
ALTER TABLE customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_spots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_sub_recipes ENABLE ROW LEVEL SECURITY;


-- 2. Catálogo público — lectura libre para todos
-- ----------------------------------------
-- El menú, los precios y los puntos de recolección deben ser
-- visibles sin autenticación (anon key desde el browser está bien).

CREATE POLICY "public read meals"
  ON meals FOR SELECT USING (true);

CREATE POLICY "public read recipes"
  ON recipes FOR SELECT USING (true);

CREATE POLICY "public read ingredients"
  ON ingredients FOR SELECT USING (true);

CREATE POLICY "public read sizes"
  ON sizes FOR SELECT USING (true);

CREATE POLICY "public read pickup_spots"
  ON pickup_spots FOR SELECT USING (true);

CREATE POLICY "public read meal_sub_recipes"
  ON meal_sub_recipes FOR SELECT USING (true);


-- 3. customers / orders / order_items — solo service_role
-- ----------------------------------------
-- NO se crean políticas para estas tablas.
-- Sin políticas + RLS habilitado = nadie con anon key puede leer ni escribir.
-- service_role (usado en Server Actions y webhooks) siempre bypasa RLS.
-- Esto protege los datos de clientes y pedidos completamente.

-- Verificar que quedó bien:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
