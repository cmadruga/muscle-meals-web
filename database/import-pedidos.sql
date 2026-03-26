-- ============================================================
-- MUSCLE MEALS — Import: Pedidos semana 2026-03-09
-- Entrega: domingo 2026-03-15 | Status: paid
-- Correr DESPUÉS de import-clientes-tamanos.sql
-- ============================================================

-- ── 1. LIMPIAR pedidos de esta semana ───────────────────────────
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders WHERE created_at >= '2026-03-09' AND created_at < '2026-03-10'
);
DELETE FROM orders WHERE created_at >= '2026-03-09' AND created_at < '2026-03-10';

-- ── 2. PEDIDOS ──────────────────────────────────────────────────
-- Patrón: CTE crea la orden → INSERT items en la misma sentencia
-- Tamaños main: FIT / LOW / PLUS
-- Tamaños custom: 'Nallely Rios' / 'Sharon 1' / 'Sharon 2'

-- ── Jorge Garcilazo
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='jorge.garcilazo@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','FIT',3),('Pasta Alfredo','FIT',3),('Chicken Bang Bang','FIT',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Juan Carlos Zarate
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='juan.carlos.zarate@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',1),('Pasta Alfredo','PLUS',1),('Ramen de Pollo','PLUS',1),('Pollo Chimichurri','PLUS',1),('Chicken Bang Bang','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Daniel Ornelas
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='daniel.ornelas@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',1),('Pasta Alfredo','PLUS',1),('Ramen de Pollo','PLUS',1),('Pollo Chimichurri','PLUS',1),('Chicken Bang Bang','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Laura Emilia
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='laura.emilia@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','LOW',2),('Pasta Alfredo','LOW',1),('Pollo Chimichurri','LOW',1),('Chicken Bang Bang','LOW',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Carlos Moreno (pedido Plus)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='carlos.moreno@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',1),('Pasta Alfredo','PLUS',1),('Ramen de Pollo','PLUS',1),('Pollo Chimichurri','PLUS',1),('Chicken Bang Bang','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Carlos Moreno (pedido Low)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='carlos.moreno@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','LOW',1),('Pasta Alfredo','LOW',1),('Ramen de Pollo','LOW',1),('Pollo Chimichurri','LOW',1),('Chicken Bang Bang','LOW',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Keno Avarado
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='keno.avarado@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',2),('Ramen de Pollo','PLUS',1),('Pollo Chimichurri','PLUS',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Angela Martinez
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='angela.martinez@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','LOW',1),('Pasta Alfredo','LOW',1),('Pollo Chimichurri','LOW',2),('Chicken Bang Bang','LOW',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Michelle Hernandez — PICKUP La Frutería
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT c.id,0,'paid','pickup',ps.id,0,'2026-03-09 12:00:00'
  FROM customers c, pickup_spots ps WHERE c.email='michelle.hernandez@mm.internal' AND ps.name='La Frutería' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','LOW',1),('Pasta Alfredo','LOW',2),('Ramen de Pollo','LOW',1),('Pollo Chimichurri','LOW',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Rodrigo Prado
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='rodrigo.prado@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',1),('Pasta Alfredo','PLUS',1),('Ramen de Pollo','PLUS',2),('Pollo Chimichurri','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Eduardo Martinez (pedido Plus — fila 1)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='eduardo.martinez@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',2),('Chicken Bang Bang','PLUS',5),('Pollo Chimichurri','PLUS',3)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Eduardo Martinez (pedido Plus — fila 2)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='eduardo.martinez@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',3),('Pasta Alfredo','PLUS',2),('Chicken Bang Bang','PLUS',3)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Eduardo Martinez (pedido Low)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='eduardo.martinez@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','LOW',2),('Pasta Alfredo','LOW',2),('Pollo Chimichurri','LOW',2),('Chicken Bang Bang','LOW',4)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Abrahan Borrayo
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='abrahan.borrayo@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','FIT',3),('Pollo Chimichurri','FIT',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Arturo Garzon
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='arturo.garzon@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Ramen de Pollo','PLUS',3),('Pollo Chimichurri','PLUS',1),('Chicken Bang Bang','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Jose Martin
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='jose.martin@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','FIT',3),('Pollo Chimichurri','FIT',2),('Chicken Bang Bang','FIT',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Yamile Rangel
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='yamile.rangel@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','FIT',1),('Pasta Alfredo','FIT',1),('Ramen de Pollo','FIT',1),('Pollo Chimichurri','FIT',1),('Chicken Bang Bang','FIT',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Aranza Coindreau
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='aranza.coindreau@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','LOW',1),('Pasta Alfredo','LOW',1),('Pollo Chimichurri','LOW',1),('Chicken Bang Bang','LOW',2)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Nallely Rios (tamaño custom 110P/80C/100V)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='nallely.rios@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,2,s.price FROM o
CROSS JOIN (VALUES ('Picadillo'),('Pasta Alfredo'),('Ramen de Pollo'),('Pollo Chimichurri'),('Chicken Bang Bang')) AS mn(meal_name)
JOIN meals m ON m.name=mn.meal_name
CROSS JOIN (SELECT id,price FROM sizes WHERE name='Nallely Rios' AND is_main=false) s;

-- ── Mauricio Quintanilla
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='mauricio.quintanilla@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','PLUS',1),('Ramen de Pollo','PLUS',1),('Pasta Alfredo','PLUS',1),('Pollo Chimichurri','PLUS',1),('Chicken Bang Bang','PLUS',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Corina Pinal
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='corina.pinal@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Pasta Alfredo','FIT',1),('Ramen de Pollo','FIT',1),('Pollo Chimichurri','FIT',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Mam Madruga
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='dolores.coronado@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','FIT',1),('Pasta Alfredo','FIT',1),('Ramen de Pollo','FIT',1),('Pollo Chimichurri','FIT',1),('Chicken Bang Bang','FIT',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── Sharon (tamaños custom mixtos)
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='sharon@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','Sharon 1',1),('Pasta Alfredo','Sharon 2',1),('Pollo Chimichurri','Sharon 1',2),('Chicken Bang Bang','Sharon 1',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn
JOIN sizes s ON s.name=i.sn AND s.is_main=false;

-- ── Fruteria
WITH o AS (INSERT INTO orders (customer_id,total_amount,status,shipping_type,pickup_spot_id,shipping_cost,created_at)
  SELECT id,0,'paid','standard',null,0,'2026-03-09 12:00:00' FROM customers WHERE email='fruteria@mm.internal' RETURNING id)
INSERT INTO order_items (order_id,meal_id,size_id,qty,unit_price)
SELECT o.id,m.id,s.id,i.qty,s.price FROM o
CROSS JOIN (VALUES ('Picadillo','FIT',1),('Ramen de Pollo','FIT',1)) AS i(mn,sn,qty)
JOIN meals m ON m.name=i.mn JOIN sizes s ON s.name=i.sn;

-- ── 3. ACTUALIZAR total_amount ───────────────────────────────────
UPDATE orders SET total_amount = (
  SELECT COALESCE(SUM(oi.qty * oi.unit_price), 0)
  FROM order_items oi WHERE oi.order_id = orders.id
)
WHERE created_at >= '2026-03-09' AND created_at < '2026-03-10' AND status = 'paid';
