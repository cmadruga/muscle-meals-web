# Muscle Meals — Changelog de Cambios Acumulados

> Documento de referencia de todo lo desarrollado desde el último commit limpio.
> Para dudas técnicas específicas, preguntar directamente.

---

## Resumen Ejecutivo

Este bloque de trabajo se divide en **6 grandes áreas**:

1. **Mejoras al checkout del cliente** — fecha de entrega visible y datos pre-llenados
2. **Mejoras al panel de base de datos** — recetas con secciones, porciones en sub-recetas, editor de platillos mejorado, macros visibles
3. **Gestión de pedidos desde el admin** — crear pedidos manualmente, asignar extras a clientes
4. **Sistema de producción semanal** — recetario, lista de compra, empaques, pinche, prep y stock de materiales
5. **Pagos con MercadoPago** — integración completa de Checkout Pro, webhook y notificaciones
6. **Modelo de clientes guest/logueado** — flujo simplificado sin merge ni deduplicación

---

## 1. Branding — Logos Reales

**Qué cambió:**
- El navbar ya no muestra texto "MUSCLE MEALS", ahora muestra el **logo real** (imagen PNG).
- En móvil muestra la versión pequeña del logo (solo el ícono).
- La tarjeta de paquetes en el menú ya no tiene un emoji 🥡, ahora muestra la **foto real del paquete**.

**Archivos clave:** `Navbar.tsx`, `menu/page.tsx`, `public/logo.png`, `public/logo-sm.png`, `public/paquete.png`

---

## 2. Checkout — Fecha de Entrega y Pre-llenado de Datos

### 2a. Fecha de entrega estimada
**Qué cambió:**
- En el **carrito** aparece un banner verde con la fecha de entrega estimada (siempre el próximo domingo).
- Si el cliente está en la **ventana de corte** (viernes mediodía – domingo), aparece una advertencia naranja explicando que su pedido se procesará para el siguiente domingo.
- Lo mismo aplica en el **checkout**, con un aviso de corte si aplica.
- La lógica de fechas está centralizada en un solo lugar (`src/lib/utils/delivery.ts`).

### 2b. Pre-llenado de datos del cliente
**Qué cambió:**
- Si el cliente ya tiene sesión activa (Google), el checkout **pre-llena automáticamente** nombre, email y teléfono.
- Si el cliente ya tiene una dirección guardada de un pedido anterior, aparece la opción de **usar dirección guardada** en lugar de volver a escribirla.

**Archivos clave:** `delivery.ts`, `cart/page.tsx`, `checkout/page.tsx`, `CheckoutClient.tsx`

---

## 3. Panel Admin — Base de Datos

### 3a. Recetas con Secciones (Proteína / Carbohidratos / Verdura)

**Qué cambió:**
- Al crear o editar una receta **principal**, el formulario ahora muestra **3 secciones separadas**: Proteína, Carbohidratos y Verdura.
- El orden y la sección de cada ingrediente se guardan en la base de datos (en el JSONB).
- Esto permite que el mismo ingrediente aparezca en varias secciones con distintas cantidades si se necesita.
- Las secciones son puramente organizativas — para replicar el mismo orden visual que tenemos en el Excel.

**Dónde se ve:** En el **Recetario** del admin, cada ingrediente ahora tiene un color según su sección:
- Rojo → Proteína
- Amarillo → Carbohidratos
- Verde → Verdura

### 3b. Porciones en Sub-recetas

**Qué cambió:**
- Las sub-recetas (salsas, aderezos, etc.) ahora tienen un campo de **número de porciones**.
- Toda la matemática de producción, macros, lista de compra y empaques ya divide la cantidad de cada ingrediente entre el número de porciones correctamente.
- Antes esto no existía y los cálculos estaban inflados.

### 3c. Editor de Platillos Unificado

**Qué cambió:**
- El modal de crear y editar un platillo es ahora el **mismo modal**.
- Se eliminó el campo de nombre (el nombre del platillo se hereda automáticamente de la receta principal).
- Desde el modal se puede cambiar: receta principal, sub-recetas, descripción e imagen.
- Al **crear** un platillo se puede subir la imagen directamente en el mismo paso.

### 3d. Macros Visibles en la Lista de Platillos

**Qué cambió:**
- La tabla de platillos ahora muestra los **macros calculados** (kcal, proteína, carbos, grasas).
- Hay un selector de tamaño (LOW / FIT / PLUS) para ver los macros según el tamaño.

### 3e. Modal de Detalle de Platillo

**Qué cambió:**
- Cada platillo en la tabla tiene un botón **"Detalle"** que abre un modal con el desglose completo:
  - Ingredientes de la receta principal agrupados por sección, con cantidad y calorías.
  - Ingredientes de cada sub-receta con su respectiva cantidad por porción y calorías.

### 3f. Nuevas Tabs: Materiales y Pinche

**Qué cambió:**
- Se agregaron dos tabs nuevas en la sección de Base de Datos:
  - **Materiales** — inventario de insumos de empaque (cajas, cubiertos, etiquetas, etc.) con stock mínimo, precio y proveedor.
  - **Pinche** — lista de recipientes de cocina con su peso, usados para calcular pesos netos en la producción.

**Archivos clave:** `RecipeModal.tsx`, `MealModal.tsx`, `MealsTab.tsx`, `MealDetailModal.tsx`, `RecetasTab.tsx`, `IngredientModal.tsx`, `MaterialesTab.tsx`, `PincheTab.tsx`, `database/page.tsx`, `actions/database.ts`

---

## 4. Panel Admin — Gestión de Pedidos

### 4a. Crear Pedidos Manualmente

**Qué cambió:**
- Desde la vista de pedidos del admin hay un botón **"+ Nuevo Pedido"**.
- Se pueden crear dos tipos de pedidos:
  - **Extras** — pedidos sin cliente asignado (para producción interna o reserva).
  - **Cliente** — pedidos para un cliente existente o nuevo.
- En el mismo modal se seleccionan los platillos, tamaños y cantidades, el tipo de envío y la semana.

### 4b. Asignar Extras a Clientes

**Qué cambió:**
- Los pedidos de tipo "Extras" tienen un botón para **asignar** algunos de sus ítems a un cliente.
- Se abre un modal donde se selecciona el cliente (existente o nuevo) y cuántos de cada ítem se le asigna.
- Crea automáticamente un pedido de cliente nuevo con esos ítems.

**Archivos clave:** `NewOrderModal.tsx`, `NewOrderButton.tsx`, `CustomerSelector.tsx`, `AssignExtraModal.tsx`, `OrdersTable.tsx`, `orders/page.tsx`, `actions/orders.ts`

---

## 5. Panel Admin — Sistema de Producción Semanal

Este es el bloque más grande. Se construyó un sistema completo para gestionar la producción de cada semana.

### 5a. Navegación por Semana

**Qué cambió:**
- Todas las páginas de producción comparten un componente de **navegación semanal** con flechas y selector de fecha.
- La semana seleccionada se recuerda mientras navegas entre secciones.

### 5b. Recetario (`/admin/recetario`)

**Qué es:**
- Muestra la cantidad total de cada ingrediente que se necesita preparar, **por platillo**, para la semana seleccionada.
- Se basa en todos los pedidos pagados de esa semana.
- Separa ingredientes de la receta principal (con colores de sección) vs. ingredientes de sub-recetas.
- Los ingredientes respetan el orden en que fueron guardados en la receta (no alfabético).

### 5c. Lista de Compra (`/admin/lista`)

**Qué es:**
- Agrega todos los ingredientes de todos los platillos de la semana en **una sola lista** con cantidades totales.
- Permite ir marcando ingredientes como comprados (persiste en el navegador).
- Botón para copiar la lista al portapapeles y botón de reset.

### 5d. Empaques (`/admin/empaques`)

**Qué es:**
- Muestra cuántas porciones de cada platillo hay que empacar, **por tamaño**.
- Cada tarjeta de platillo muestra los macros (kcal / P / C / G) para cada tamaño, listos para poner en la etiqueta.
- Navegación tipo carrusel entre platillos.

### 5e. Pinche (`/admin/pinche`)

**Qué es:**
- Vista para el cocinero. Muestra las cantidades de ingredientes **en crudo y cocido** que hay que preparar de cada platillo.
- Seleccionas el recipiente (con su peso) y el peso cocido real para calcular la merma.
- Los datos se guardan localmente por semana para no perder lo que ya se midió.

### 5f. Prep (`/admin/prep`)

**Qué es:**
- Una sola pantalla que combina **Lista de Compra + Empaques** en tabs, para tener todo en un lugar durante la preparación.

### 5g. Stock de Materiales (`/admin/stock`)

**Qué es:**
- Inventario de los **materiales de empaque** (cajas, bolsas, cubiertos, etc.).
- Muestra qué materiales están por debajo del mínimo de stock.
- Permite actualizar cantidades directamente desde la tabla.

**Archivos clave:** `production.ts` (cálculos), `db/production.ts` (queries), `recetario/`, `lista/`, `empaques/`, `pinche/`, `prep/`, `stock/`, `WeekNav.tsx`, `RecipeTotals.tsx`, `ShoppingList.tsx`, `EmpaqueCarousel.tsx`, `PincheCarousel.tsx`

---

## 6. Infraestructura — Tipos y Datos Base

**Qué cambió bajo el capó (sin efecto visual directo):**
- Se agregó `section` (`pro/carb/veg`) a los ingredientes de una receta en los tipos TypeScript.
- Se agregó `portions` a la definición de `Recipe`.
- Se agregó `sub_recipe_ids` a la definición de `Meal`.
- La función de cálculo de macros (`calculateMealMacros`) ahora divide correctamente las sub-recetas por porciones.
- Se crearon tipos para `Material` y `PincheVessel`.
- `getAllMeals()` ahora también devuelve los IDs de sub-recetas de cada platillo.

---

## 7. Fixes Post-Review (Copilot PR suggestions)

- **delivery.ts** — Bug: el domingo mostraba entrega 2 semanas adelante en lugar de 1. Corregido cálculo de días al próximo domingo.
- **RecipeModal.tsx** — Faltaba `portions` en el objeto pasado a `onSaved`, causaba error de TypeScript en build.
- **createAdminOrder** — Si fallaba el insert de items, el cliente recién creado quedaba huérfano. Ahora se limpia en el rollback.
- **MealDetailModal.tsx** — Fragment sin `key` en el map de secciones causaba warning de React. Corregido con `React.Fragment key`.

---

## 8. Fixes — IngredientModal y MealDetailModal

- **IngredientModal.tsx** — Mejoras al manejo de inputs numéricos (no se borraba el campo al escribir) y se muestran los valores nutricionales correctamente.
- **MealDetailModal.tsx** — Se muestran los valores nutricionales por ingrediente en el detalle del platillo.
- **PincheCarousel / page** — Se eliminó estado no usado y se simplificó el layout.

---

## 9. Pinche — Carrusel con Flechas

**Qué cambió:**
- La vista `/admin/pinche` ahora muestra **un platillo a la vez** en lugar de todos apilados.
- La navegación entre platillos es con flechas `‹` / `›`. El contador muestra `N / Total`.
- Se eliminó completamente el drag/swipe — solo se puede navegar con los botones.

**Archivos clave:** `PincheCarousel.tsx`

---

## 10. Recetario — División Automática por Sartén

**Qué es:**
- Feature para manejar el caso en que la cantidad total de un ingrediente supera la capacidad del sartén y hay que hacer varias tandas.

**Cómo se configura:**
- En `/admin/database` → Recetas → botón **"Sartenes"** (solo en recetas principales).
- Por sección (Proteína / Carbo / Verdura) se elige el sartén y se configura la capacidad máxima en gramos.
- Para la sección Carbo se puede configurar además la equivalencia en **tazas** (ej. 150 gr = 1 taza), pensado para arroz.

**Cómo se ve en el Recetario:**
- Si el total de un ingrediente supera el máximo del sartén, aparece una fila separadora: `── PROTEÍNA · Sartén grande · 2 tandas ──`
- Cada ingrediente de esa sección muestra la **cantidad por tanda** en bold y el total entre paréntesis.
- Para el ingrediente principal del carbo (si tiene equivalencia configurada): `150 g (1.0 tazas) (total: 2090 g / 13.9 tazas)`
- Secciones sin configuración → se muestra el total normal, sin cambios.
- Sub-recetas → nunca se dividen, sin cambios.

**Archivos clave:** `src/lib/types/recipe.ts`, `RecetasTab.tsx`, `RecipeTotals.tsx`, `actions/database.ts`

**SQL requerido:**
```sql
ALTER TABLE recipes ADD COLUMN vessel_config JSONB;
```

---

## 11. Ingredientes — Equivalencias de Unidad (Multi-unidad)

**Problema que resuelve:**
- Algunos ingredientes (especias) se compran por gramos pero se miden en tsp/tbsp en la receta porque la báscula no agarra bien cantidades pequeñas.
- Antes, si la receta decía "2 tsp", los macros se calculaban mal (como si fueran 2 g).

**Cómo funciona:**
- En el modal de editar ingrediente hay una nueva sección **"Equivalencias de unidad"** donde se define cuántos gramos equivale 1 unidad alternativa. Ej: `1 tsp = 2.5 g`.
- Se pueden agregar múltiples equivalencias por ingrediente (tsp, tbsp, etc.).

**Efecto en recetas:**
- Al agregar un ingrediente a una receta, si tiene conversiones definidas, la unidad se convierte en un **selector** con todas las opciones disponibles (unidad base + conversiones).
- Si no tiene conversiones, se muestra la unidad fija como antes.

**Efecto en cálculos:**
- Los macros se calculan convirtiendo primero a gramos usando la equivalencia antes de aplicar el ratio por 100g.
- En el **Recetario**, la cantidad se muestra en la unidad de la receta (ej. `12 tsp`), no en gramos.
- En la **lista de compras**, se agrega por `ingrediente + unidad`. Si el mismo ingrediente aparece en `g` en una receta y en `tsp` en otra, aparecen como dos renglones separados.
- En el **detalle de platillo** (`MealDetailModal`), la unidad mostrada corresponde a la unidad elegida en la receta.

**Archivos clave:** `src/lib/types/ingredient.ts`, `IngredientModal.tsx`, `RecipeModal.tsx`, `MealDetailModal.tsx`, `macros.ts`, `production.ts`

**SQL requerido:**
```sql
ALTER TABLE ingredients ADD COLUMN unit_conversions JSONB DEFAULT '[]';
```

---

---

## 12. Landing Page — Anchors y Secciones Dinámicas

**Qué cambió:**
- Cada sección del landing tiene un **ID anchor** y un botón "↓" que lleva a la siguiente sección.
- La sección **Nuestros Paquetes** muestra precio individual y precio de paquete jalados dinámicamente de la DB.
- La sección **Menú de la Semana** muestra los platillos activos jalados dinámicamente.
- La sección **Envíos** muestra los pickup spots activos jalados dinámicamente.

**Archivos clave:** `src/app/page.tsx`

---

## 13. Pagos con MercadoPago Checkout Pro

**Qué es:**
- Se reemplazó Conekta por **MercadoPago** como procesador de pagos.
- El cliente hace click en "Proceder al pago" y es redirigido al checkout de MercadoPago (hosted).
- Al completar el pago, MercadoPago notifica vía webhook y se actualiza el estado de la orden automáticamente.

**Flujo:**
1. Checkout crea la orden en Supabase con status `pending`
2. Se genera una preferencia de pago en MP con `external_reference = orderId`
3. Cliente paga en MP → webhook recibe `payment.updated` → actualiza orden a `paid` o `cancelled`
4. Se envían notificaciones WhatsApp al cliente y al negocio

**Páginas de retorno:**
- `/order-success` — pago aprobado, muestra resumen del pedido y limpia el carrito
- `/order-pending` — pago pendiente (OXXO/efectivo), instrucciones y resumen del pedido

**Notificaciones WhatsApp:**
- `pago_confirmado` — template al cliente cuando se confirma el pago
- `pago_pendiente` — template al cliente cuando el pago queda pendiente
- `alerta_pedido` — template interno al negocio con detalle completo del pedido

**Variables de entorno requeridas:**
```
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=   # dejar vacío en dev
WHATSAPP_PHONE_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_OWNER_PHONE=
```

**Archivos clave:** `src/app/actions/payment.ts`, `src/app/api/webhooks/mercadopago/route.ts`, `src/app/order-success/page.tsx`, `src/app/order-pending/page.tsx`, `src/lib/whatsapp.ts`, `src/components/ClearCartOnMount.tsx`

---

## 14. Modelo de Clientes Guest / Logueado

**Qué cambió:**
- Se simplificó completamente el manejo de customers en checkout.
- **Guest**: siempre crea un customer nuevo (`createGuestCustomer`), sin buscar duplicados por teléfono. Solo para tener la info del pedido.
- **Logueado**: actualiza su propio registro directamente por `customerId` (`updateLoggedInCustomer`). La orden queda vinculada a su cuenta.
- Se eliminó toda la lógica de upsert/merge/deduplicación por teléfono.
- Beneficio: múltiples customers pueden tener el mismo teléfono sin conflictos.

**SQL requerido:**
```sql
ALTER TABLE customers DROP CONSTRAINT customers_phone_key;
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;
```

**Archivos clave:** `src/lib/db/customers.ts`, `src/app/actions/customer.ts`, `src/app/checkout/page.tsx`, `src/app/checkout/CheckoutClient.tsx`

---

## SQL Pendiente de Correr en Supabase

```sql
-- Agregar campo portions a recetas (default 1 para las existentes)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS portions integer NOT NULL DEFAULT 1;

-- División por sartén en recetario
ALTER TABLE recipes ADD COLUMN vessel_config JSONB;

-- Equivalencias de unidad en ingredientes
ALTER TABLE ingredients ADD COLUMN unit_conversions JSONB DEFAULT '[]';

-- Modelo guest/logueado (ya corridos en prod)
-- ALTER TABLE customers DROP CONSTRAINT customers_phone_key;
-- ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;
```
