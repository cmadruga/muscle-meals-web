-- ============================================================
-- MUSCLE MEALS — Import: Clientes y Tamaños Custom
-- Actualizado: 2026-03-20
-- Solo agrega clientes/tamaños nuevos. No borra nada.
-- Usar ON CONFLICT DO NOTHING para que sea seguro correr varias veces.
-- ============================================================

-- ── UNIQUE CONSTRAINT en email (solo si no existe) ───────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_email_unique') THEN
    ALTER TABLE customers ADD CONSTRAINT customers_email_unique UNIQUE (email);
  END IF;
END $$;

-- ── CLIENTES ─────────────────────────────────────────────────
INSERT INTO customers (full_name, phone, email, address, user_id) VALUES
('Jorge Garcilazo',      '8186037570', 'jorge.garcilazo@mm.internal',      null, null),
('Juan Carlos Zarate',   '8111050449', 'juan.carlos.zarate@mm.internal',    null, null),
('Daniel Ornelas',       '8116905101', 'daniel.ornelas@mm.internal',        null, null),
('Laura Emilia',         '8666510663', 'laura.emilia@mm.internal',          null, null),
('Carlos Moreno',        '8116076735', 'carlos.moreno@mm.internal',         null, null),
('Keno Avarado',         '8110739354', 'keno.avarado@mm.internal',          null, null),
('Angela Martinez',      '8187063682', 'angela.martinez@mm.internal',       null, null),
('Michelle Hernandez',   '8186039181', 'michelle.hernandez@mm.internal',    null, null),
('Rodrigo Prado',        '8136439770', 'rodrigo.prado@mm.internal',         null, null),
('Eduardo Martinez',     '8120158111', 'eduardo.martinez@mm.internal',      null, null),
('Abrahan Borrayo',      '8126874664', 'abrahan.borrayo@mm.internal',       null, null),
('Arturo Garzon',        '8188590952', 'arturo.garzon@mm.internal',         null, null),
('Jose Martin',          '8186029376', 'jose.martin@mm.internal',           null, null),
('Yamile Rangel',        '8126225562', 'yamile.rangel@mm.internal',         null, null),
('Aranza Coindreau',     '8181878690', 'aranza.coindreau@mm.internal',      null, null),
('Nallely Rios',         '5579221522', 'nallely.rios@mm.internal',          null, null),
('Dolores Coronado',     '8122010940', 'dolores.coronado@mm.internal',      null, null),
('Mauricio Quintanilla', '8116014034', 'mauricio.quintanilla@mm.internal',  null, null),
('Corina Pinal',         '8186773530', 'corina.pinal@mm.internal',          null, null),
('Fruteria',             '8128972300', 'fruteria@mm.internal',              null, null),
('Sharon',               '8180796623', 'sharon@mm.internal',                null, null),
('Cora',                 '8112225543', 'cora@mm.internal',                  null, null),
('Raul',                 '2371263229', 'raul@mm.internal',                  null, null),
('Angel Cardenas',       '8119858470', 'angel.cardenas@mm.internal',        null, null),
('Edgar Vara',           '8136069805', 'edgar.vara@mm.internal',            null, null),
('Fanny Vara',           '8113824955', 'fanny.vara@mm.internal',            null, null)
ON CONFLICT (email) DO NOTHING;

-- ── TAMAÑOS CUSTOM ───────────────────────────────────────────
-- Nallely Rios: 110P/80C/100V → $160 / paquete $155
INSERT INTO sizes (name, is_main, customer_id, protein_qty, carb_qty, veg_qty, price, package_price)
SELECT 'Nallely Rios', false, id, 110, 80, 100, 16000, 15500
FROM customers WHERE email = 'nallely.rios@mm.internal'
ON CONFLICT DO NOTHING;

-- Sharon 1: 220P/70C/150V → $185 / paquete $180
INSERT INTO sizes (name, is_main, customer_id, protein_qty, carb_qty, veg_qty, price, package_price)
SELECT 'Sharon pollo/arroz', false, id, 220, 70, 150, 18500, 18000
FROM customers WHERE email = 'sharon@mm.internal'
ON CONFLICT DO NOTHING;

-- Sharon 2: 220P/35C/150V → $175 / paquete $170
INSERT INTO sizes (name, is_main, customer_id, protein_qty, carb_qty, veg_qty, price, package_price)
SELECT 'Sharon pollo/pasta', false, id, 220, 45, 150, 17500, 17000
FROM customers WHERE email = 'sharon@mm.internal'
ON CONFLICT DO NOTHING;

-- Sharon 3: 160P/70C/150V → $160 / paquete $155
INSERT INTO sizes (name, is_main, customer_id, protein_qty, carb_qty, veg_qty, price, package_price)
SELECT 'Sharon carne/arroz', false, id, 160, 70, 150, 16000, 15500
FROM customers WHERE email = 'sharon@mm.internal'
ON CONFLICT DO NOTHING;
