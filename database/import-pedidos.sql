-- ============================================================
-- MUSCLE MEALS — Import: Pedidos semana 2026-03-16
-- Entrega: domingo 2026-03-22 | Status: paid
-- Platillos: Picadillo, Pasta Bolognesa, Pasta Poblano,
--            Pollo Miel y Limón, Pollo Albahaca
-- Correr DESPUÉS de import-clientes-tamanos.sql
-- ============================================================

-- ── 1. LIMPIAR pedidos de esta semana ───────────────────────────
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders WHERE created_at >= '2026-03-16' AND created_at < '2026-03-23'
);
DELETE FROM orders WHERE created_at >= '2026-03-16' AND created_at < '2026-03-23';

-- ── 2. PEDIDOS ──────────────────────────────────────────────────

-- ── Jorge Garcilazo (FIT)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='jorge.garcilazo@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','FIT',3),('Pasta Bolognesa','FIT',3),('Pollo Albahaca','FIT',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Juan Carlos Zarate (Plus)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='juan.carlos.zarate@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',1),('Pasta Bolognesa','PLUS',1),('Pasta Poblano','PLUS',1),('Pollo Miel y Limón','PLUS',1),('Pollo Albahaca','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Daniel Ornelas (Plus)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='daniel.ornelas@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',1),('Pasta Bolognesa','PLUS',1),('Pasta Poblano','PLUS',1),('Pollo Miel y Limón','PLUS',1),('Pollo Albahaca','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Cora (Low)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='cora@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','LOW',1),('Pasta Bolognesa','LOW',1),('Pasta Poblano','LOW',1),('Pollo Miel y Limón','LOW',1),('Pollo Albahaca','LOW',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Jose Martin (FIT)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='jose.martin@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','FIT',3),('Pasta Bolognesa','FIT',2),('Pollo Miel y Limón','FIT',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Abrahan Borrayo (FIT)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='abrahan.borrayo@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','FIT',2),('Pasta Poblano','FIT',3)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Angela Martinez (Low)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='angela.martinez@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Pasta Poblano','LOW',1),('Pollo Miel y Limón','LOW',2),('Pollo Albahaca','LOW',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Raul (Plus)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='raul@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',2),('Pasta Bolognesa','PLUS',2),('Pasta Poblano','PLUS',2),('Pollo Miel y Limón','PLUS',4)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Corina Pinal (FIT)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='corina.pinal@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Pasta Bolognesa','FIT',1),('Pasta Poblano','FIT',2),('Pollo Miel y Limón','FIT',1),('Pollo Albahaca','FIT',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Eduardo Martinez (pedido Plus)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='eduardo.martinez@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',4),('Pasta Bolognesa','PLUS',2),('Pasta Poblano','PLUS',4),('Pollo Miel y Limón','PLUS',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Eduardo Martinez (pedido Low)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='eduardo.martinez@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','LOW',2),('Pasta Poblano','LOW',3),('Pollo Miel y Limón','LOW',3),('Pollo Albahaca','LOW',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Rodrigo Prado (Plus)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='rodrigo.prado@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Pasta Bolognesa','PLUS',1),('Pasta Poblano','PLUS',2),('Pollo Miel y Limón','PLUS',1),('Pollo Albahaca','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Angel Cardenas (FIT)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='angel.cardenas@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','FIT',2),('Pasta Bolognesa','FIT',2),('Pasta Poblano','FIT',2),('Pollo Miel y Limón','FIT',2),('Pollo Albahaca','FIT',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Carlos Moreno (Plus)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='carlos.moreno@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',1),('Pasta Bolognesa','PLUS',1),('Pasta Poblano','PLUS',1),('Pollo Miel y Limón','PLUS',1),('Pollo Albahaca','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Michelle Hernandez (Low — PICKUP La Frutería)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT c.id,0,'paid','pickup',ps.id,0,'2026-03-16 12:00:00'
  FROM customers c, pickup_spots ps WHERE c.email='michelle.hernandez@mm.internal' AND ps.name='La Frutería' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','LOW',2),('Pasta Bolognesa','LOW',2),('Pasta Poblano','LOW',2),('Pollo Miel y Limón','LOW',2),('Pollo Albahaca','LOW',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Fanny Vara (pedido Low — PICKUP)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','pickup',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='fanny.vara@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','LOW',2),('Pasta Bolognesa','LOW',1),('Pasta Poblano','LOW',1),('Pollo Miel y Limón','LOW',1),('Pollo Albahaca','LOW',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Fanny Vara (pedido Plus — PICKUP)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','pickup',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='fanny.vara@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',1),('Pasta Bolognesa','PLUS',1),('Pasta Poblano','PLUS',1),('Pollo Miel y Limón','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Edgar Vara (Plus — PICKUP)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','pickup',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='edgar.vara@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',1),('Pasta Bolognesa','PLUS',1),('Pasta Poblano','PLUS',1),('Pollo Miel y Limón','PLUS',1),('Pollo Albahaca','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Fruteria (Plus)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='fruteria@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',1),('Pasta Bolognesa','PLUS',1),('Pasta Poblano','PLUS',1),('Pollo Miel y Limón','PLUS',1),('Pollo Albahaca','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Sharon (Picadillo: Sharon 3 160P/70C/150V | Poblano+Albahaca: Sharon 1 220P/70C/150V)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-16 12:00:00' FROM customers WHERE email='sharon@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','Sharon carne/arroz',2),('Pasta Poblano','Sharon pollo/pasta',1),('Pollo Albahaca','Sharon pollo/arroz',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn
JOIN sizes s ON s.name=i.sn AND s.is_main=false;

-- ── 3. ACTUALIZAR total_amount ───────────────────────────────────
UPDATE orders SET total_amount = (
  SELECT COALESCE(SUM(oi.qty * oi.unit_price), 0)
  FROM order_items oi WHERE oi.order_id = orders.id
)
WHERE created_at >= '2026-03-16' AND created_at < '2026-03-23' AND status = 'paid';
