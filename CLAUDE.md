# Muscle Meals — reglas de diseño (/menu)

Referencia de diseño: `design/menu-redesign/`. El HTML de `reference/` es un prototipo de
diseño (estilos inline = valores exactos), no código para copiar. `menu-spec.md` es normativo.

## Tipografía
- **Franchise** 700, siempre uppercase: titulares, nombres de platillo, pills, botones, cifras grandes.
- **Barlow** 400–700: descripciones, macros, labels, precios en línea, legales.
- **Franchise no tiene acentos**: todo el copy en Franchise se escribe sin acentos
  (`MENU`, `MAS PLATILLOS, MAS AHORRO`). Si necesita acento, va en Barlow.

## Color
`#0a0908` página · `#0c0a09` topbar/sidebar · `#191614` card · `#F79138` acento
(hover `#ffa252`, texto encima `#17140f`) · `#F5F1EC` texto · `#7ac77a` éxito/paquete ·
`#e8c07d` carbo. Todo lo demás son alphas de `#F5F1EC` / blanco sobre el fondo oscuro —
nunca inventes grises nuevos.

## Reglas de /menu que no se pueden negociar
- El selector de tamaño **nunca se colapsa** por agregar platillos. La barra compacta sticky es
  un elemento **distinto** que aparece cuando el selector sale del viewport.
- Cambiar el tamaño activo reprecia el grid, **no** lo que ya está en el carrito.
- Descuento de paquete a partir de **5 platillos totales**, cada uno al precio de paquete de su
  propio tamaño. Automático, silencioso, reversible.
- Con `<5`: progreso + ahorro proyectado, **sin** precios tachados. Con `≥5`: banner verde,
  unitario tachado, descuento como línea de totales.
- El panel de tamaño personalizado **no es modal**: se despliega en línea bajo el selector.
- El panel personalizado **no muestra calorías ni macros calculados**; solo precio en vivo.
- Ingredientes: `<details>` independiente por card (no acordeón) y el grid usa
  `align-items:start` para que no reflowee.
- Sin modal de confirmación al agregar. Dos salidas: `Agregar al carrito` (secundario) e
  `Ir a pagar` (primario).
- Hit targets ≥44px en móvil. Inputs móviles a `font-size:16px`.
- No agregues animaciones ni transiciones que no estén en la referencia.
# Muscle Meals — reglas de diseño (/checkout)

Referencia: `design/checkout-redesign/`. El HTML de `reference/` es un prototipo de diseño
(estilos inline = valores exactos), no código para copiar. Lee la sección «Cómo se combinan
los bloques» del README antes de tocar estados.

## Composición
- Orden fijo: topbar → H1 → **banda de membresía (full width)** → grid `1fr 392px` con
  `1 · Tu entrega` y `2 · Contacto (y direccion)` a la izquierda y el resumen sticky a la derecha.
- Los ids `1a`–`2e` son estados de la MISMA página, no pantallas distintas. `2b` es un fragmento.
- Móvil: una columna, sin sidebar, resumen colapsado arriba + barra fija abajo. `2c` es la
  referencia de orden canónica.

## Reglas que no se negocian
- **`/cart` no existe.** `/menu` → `/checkout`. Sin icono de carrito en el topbar.
- El resumen del pedido es **solo lectura**: sin steppers, sin eliminar. Se edita volviendo al menú.
- El resumen **se agrupa por tamaño** (`FIT · 3 PLATILLOS`), con el unitario en `#7ac77a` cuando
  el precio de paquete está aplicado.
- **Pickup elimina el bloque de dirección completo** (radios y formulario) y el título de la
  sección 2 pasa a `2 · Contacto`. No se esconde con opacity: no se renderiza.
- El formulario de nueva dirección vive **dentro del recuadro naranja tenue** ligado al radio
  activo, no como sección aparte.
- **Los CTAs deshabilitados dicen qué falta** (`Falta el CP`, `Elige un pickup spot`), nunca un
  gris mudo.
- El error de CP es una línea bajo el campo, no un bloque suelto.
- Referidos: chip cerrable abajo a la derecha, **solo desktop**. Nunca un banner que tape el CTA.
- Hit targets ≥44px y `font-size:16px` en inputs móviles.
- No agregues animaciones ni transiciones que no estén en la referencia.

## Tipografía
- **Franchise** 700 uppercase: titulares, nombres, botones, cifras grandes.
- **Barlow** 400–700: todo lo demás.
- **Franchise no tiene acentos**: `CHECKOUT`, `ESTANDAR`, `MEMBRESIA ACTIVADA`,
  `ACTIVAR MEMBRESIA`, `DIRECCION DE ENTREGA`. Si necesita acento, va en Barlow.

## Color
`#0a0908` página · `#0c0a09` topbar/sidebar/barra fija · `#191614` card · `#F79138` acento
(hover `#ffa252`, texto encima `#17140f`) · `#F5F1EC` texto · `#7ac77a` éxito/gratis/paquete ·
`#ff8080`/`#ff9b9b` error. Todo lo demás son alphas sobre el fondo oscuro — nunca inventes
grises nuevos. Mismos tokens que `/menu`: reúsalos, no los dupliques.
