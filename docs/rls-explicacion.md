# Seguridad RLS — Por qué se movió la lógica a Server Actions

## El problema original

Supabase manda alertas de seguridad cuando RLS está deshabilitado porque cualquier persona
con la `anon key` (que es pública, está en el frontend) puede leer y escribir
directamente en las tablas sin ninguna restricción.

La `anon key` no es un secreto — está en el bundle de JavaScript que el browser descarga.
Cualquiera que abra DevTools la puede ver.

### ¿Por qué estaba deshabilitado RLS?

Porque en el checkout, el cliente llamaba funciones de Supabase **directamente desde el browser**:

```
Browser
  → createGuestCustomer()   [src/lib/db/customers.ts]  → INSERT customers
  → createOrder()           [src/lib/db/orders.ts]      → INSERT orders + order_items
```

Estas funciones usaban el cliente browser (`import { supabase } from '@/lib/supabase/client'`),
que se conecta con la **anon key**. Para que funcionaran, RLS tenía que estar deshabilitado
(o con políticas muy permisivas), lo cual dejaba la base de datos expuesta.

---

## La solución — Server Actions

Se creó `src/app/actions/checkout.ts` con la función `processCheckout`.

```
Browser (CheckoutClient.tsx)
  → processCheckout()   [Server Action]   → corre en el SERVIDOR de Next.js
                                              → usa service_role key
                                              → INSERT customers
                                              → INSERT orders
                                              → INSERT order_items
```

### ¿Por qué funciona en el servidor?

Next.js Server Actions son funciones marcadas con `'use server'` que **solo corren en el servidor**,
nunca en el browser. El cliente de Supabase que se crea dentro de ellas usa la `SUPABASE_SERVICE_ROLE_KEY`,
que:

1. **Nunca sale al browser** — solo existe como variable de entorno en el servidor.
2. **Bypasa RLS completamente** — service_role siempre tiene acceso total sin importar las políticas.

Desde el browser, `processCheckout` se ve como un simple fetch a un endpoint interno de Next.js.
El código real y las credenciales nunca llegan al cliente.

### ¿Qué diferencia al cliente browser del servidor?

| | Browser (`/lib/supabase/client.ts`) | Servidor (`/lib/supabase/server.ts`) |
|---|---|---|
| Key usada | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |
| ¿Es pública? | Sí, visible en DevTools | No, solo en variables de entorno del servidor |
| RLS | Sí aplica | Bypasa RLS |
| Dónde corre | En el browser del usuario | En el servidor de Next.js |

---

## Estado actual del código

### Lo que corre en el servidor (seguro)
- `src/app/actions/checkout.ts` — `processCheckout` (crear customer + orden)
- `src/app/actions/payment.ts` — `createPaymentPreference` (crear preferencia MP)
- `src/app/api/webhooks/` — todos los webhooks (Conekta, MercadoPago)
- `src/app/panel/` — panel de administración

### Lo que corre en el browser (con anon key)
- Leer el menú, los tamaños, los paquetes, los puntos de recolección — **está bien**, son datos públicos.

### Lo que ya NO corre en el browser
- Crear customers ✓
- Crear órdenes ✓
- Crear order_items ✓

---

## Cambios en el código para implementar esto

### Archivo nuevo: `src/app/actions/checkout.ts`
Server Action que reemplaza las 3 llamadas cliente anteriores. Maneja:
- Si hay `customerId` (usuario logueado) → actualiza su registro
- Si no hay `customerId` (guest) → crea registro nuevo
- Crea la orden con status `pending`
- Crea los order_items

### Modificado: `src/app/checkout/CheckoutClient.tsx`
Removidas las importaciones de `createGuestCustomer`, `updateLoggedInCustomer`, `createOrder`.
El `handleCheckout` ahora hace una sola llamada a `processCheckout` y usa el `orderId`
devuelto para crear la preferencia de pago.

---

## Para activar RLS en Supabase

Correr el archivo `docs/rls-supabase.sql` en el SQL Editor de Supabase.

Esto habilita RLS en las 11 tablas y crea políticas de solo lectura para el catálogo público.
Las tablas de customers/orders/order_items quedan sin políticas = solo service_role puede acceder.
