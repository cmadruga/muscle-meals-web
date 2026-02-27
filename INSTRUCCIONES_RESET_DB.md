# 🔄 RESET COMPLETO DE BASE DE DATOS

## ⚠️ ADVERTENCIA
Este script **ELIMINARÁ TODOS LOS DATOS** de tu base de datos Supabase. Solo úsalo en desarrollo/pruebas.

## 📋 Qué hace este script:

1. **Elimina todas las tablas** (en orden correcto por foreign keys)
2. **Recrea el esquema completo** con el diseño final
3. **Configura triggers** para auto-generar order_number
4. **Inserta datos iniciales** (tamaños estándar)

## 🗂️ Esquema final:

### **customers**
- `id` (UUID, PK)
- `full_name` (TEXT)
- `phone` (TEXT, UNIQUE) - **Nuestro lookup key** (+5218112345678)
- `email` (TEXT) - **Key de Conekta**
- `address` (TEXT)
- `created_at` (TIMESTAMPTZ)

### **meals**
- `id` (UUID, PK)
- `name`, `description`
- `protein`, `carbs`, `fat`, `calories`
- `ingredients` (TEXT[])
- `image_url`
- `is_active` (BOOLEAN)
- `created_at`, `updated_at`

### **sizes**
- `id` (UUID, PK)
- `name` (TEXT, UNIQUE)
- `description`
- `created_at`

### **meal_sizes** (relación meals-sizes)
- `id` (UUID, PK)
- `meal_id` (FK → meals)
- `size_id` (FK → sizes)
- `price` (INTEGER, centavos)
- `protein`, `carbs`, `fat`, `calories`
- `created_at`

### **packages**
- `id` (UUID, PK)
- `name`, `description`
- `meal_count` (INTEGER)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at`

### **package_meals** (platillos disponibles en paquetes)
- `id` (UUID, PK)
- `package_id` (FK → packages)
- `meal_id` (FK → meals)
- `created_at`

### **orders**
- `id` (UUID, PK)
- `order_number` (TEXT, UNIQUE) - **MM-0001, MM-0002, etc.**
- `conekta_order_id` (TEXT) - **ID de Conekta**
- `customer_id` (FK → customers)
- `total_amount` (INTEGER, centavos)
- `status` (TEXT) - pending, paid, preparing, delivered, cancelled
- `created_at`, `updated_at`

### **order_items**
- `id` (UUID, PK)
- `order_id` (FK → orders)
- `meal_id` (FK → meals)
- `size_id` (FK → sizes)
- `qty` (INTEGER)
- `unit_price` (INTEGER, centavos)
- `package_id` (FK → packages, nullable)
- `created_at`

## 🚀 Cómo ejecutar:

### **Opción 1: Supabase Dashboard (Recomendado)**

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Abre **SQL Editor** (menú lateral)
3. Haz clic en **"New Query"**
4. Copia TODO el contenido de `RESET_DATABASE_COMPLETE.sql`
5. Pega en el editor
6. Haz clic en **"Run"** o presiona `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
7. Espera confirmación de éxito

### **Opción 2: Terminal (si tienes Supabase CLI)**

```bash
cd /Users/carlosmadruga/Documents/MM/muscle-meals
supabase db reset --db-url "your-connection-string"
```

## ✅ Verificar que funcionó:

Ejecuta esta query para verificar las tablas:

```sql
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Deberías ver:
- `customers` (6 columnas)
- `meals` (11 columnas)
- `sizes` (3 columnas)
- `meal_sizes` (8 columnas)
- `packages` (6 columnas)
- `package_meals` (4 columnas)
- `orders` (8 columnas)
- `order_items` (7 columnas)

## 🎯 Verificar order_number:

Crea una orden de prueba desde tu app. Debería tener `order_number = "MM-0001"`.

Query de verificación:

```sql
SELECT id, order_number, status, total_amount 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
```

## 📝 Datos iniciales incluidos:

El script inserta 3 tamaños estándar:
- Regular
- Grande
- Extra Grande

## 🔧 Próximos pasos después del reset:

1. ✅ Verificar que las tablas existen
2. ✅ Agregar platillos (meals) desde tu admin
3. ✅ Configurar precios (meal_sizes)
4. ✅ Crear paquetes (packages) si los usas
5. ✅ Hacer un pedido de prueba → Verificar que `order_number` se genera automáticamente

## ⚡ Features incluidas:

- ✅ Auto-generación de `order_number` (MM-0001, MM-0002, etc.)
- ✅ Dual-key system (phone para lookup, email para Conekta)
- ✅ Índices optimizados para búsquedas
- ✅ Foreign keys con CASCADE apropiado
- ✅ Timestamps automáticos
- ✅ Triggers configurados

## 🆘 Si algo sale mal:

Si el script falla, puedes ejecutarlo nuevamente - está diseñado para ser idempotente (puede ejecutarse múltiples veces).

Si necesitas revertir solo una tabla específica:

```sql
DROP TABLE IF EXISTS nombre_tabla CASCADE;
-- Luego recrea solo esa tabla del script
```

---

**Estado:** Base de datos limpia y lista para pruebas desde cero ✅
