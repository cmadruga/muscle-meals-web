# /menu — Spec de comportamiento

Acompaña a `Menu Redesign.dc.html` (estados 1a–1d). El brief de producto ya lo tienes;
esto son las decisiones de diseño que el mockup implica y que no se pueden inferir de él.
Precios y macros salen de la base de datos — los números del mockup son de ejemplo.

## 1. Selector de tamaño

- El bloque completo (cards LOW CALORIE / FIT / PROTEIN+ / +PERSONALIZADO, estado 1a)
  vive al inicio de la página y **nunca se colapsa por agregar platillos**.
- Al hacer scroll, cuando ese bloque sale del viewport, aparece pegada arriba una barra
  compacta: `Agregando en: [pills] · <macros del tamaño activo>`. Es un elemento distinto,
  no una transformación del bloque completo. Al volver arriba, desaparece.
- El tamaño activo es **el que se aplicará a los siguientes platillos que agregue**.
  Cambiarlo NO modifica los platillos que ya están en el carrito.
- `+Personalizado` despliega el panel de tamaño personalizado (sección 2b). Al confirmar, se
  vuelve el tamaño activo y aparece como un pill más, con el nombre que le puso el usuario.

## 2. Grid de platillos

- Todas las cards muestran el precio **del tamaño activo**. Cambiar de tamaño reprecia el
  grid completo; no hay precio por platillo.
- Card sin cantidad: botón `+ Agregar` sobre la foto. Con cantidad ≥1: stepper en el mismo
  lugar y borde naranja en la card.
- `−` en cantidad 1 quita el platillo (vuelve a `+ Agregar`).
- Agotado: card al 50% de opacidad, sin controles, badge "Agotado" sobre la foto y la fecha
  de regreso donde iba el precio.
- **Ingredientes**: `<details>` por card, cerrado por default, independiente entre cards
  (no acordeón). Abrirlo no debe reflow-ear el grid — las cards se alinean arriba
  (`align-items:start`), la que se expande crece sola.
- Descripción y los 4 boxes de macros (Calorías / Proteína / Carbos / Grasas) siempre visibles.

## 2b. Tamaño personalizado

- **No es modal.** Se despliega en línea justo debajo del selector, empujando el grid hacia
  abajo. Cancelar lo cierra y no deja rastro. El usuario sigue viendo LOW CALORIE / FIT /
  PROTEIN+ arriba mientras ajusta, que es la referencia contra la que decide.
- Campos: nombre del tamaño (libre) y toggle **Crudo / Cocido** (crudo por default).
- Un slider por ingrediente, agrupados en Proteína / Carbo / Verdura. Todos los sliders son
  idénticos en estilo; los que están en 0 solo cambian de color, no de forma.
- Cada slider lleva una **marca fija con la cantidad del tamaño FIT** sobre la barra, rotulada
  "FIT". Es la referencia que hace legible el ajuste — el usuario ve de inmediato si va por
  encima o por debajo.
- Escala del slider por grupo: proteína 0–400g, carbo y verdura 0–200g. Pasos de 5g.
  La marca FIT y el knob se calculan sobre esa misma escala.
- `Usar FIT como base` precarga todos los valores con los del tamaño FIT.
- **Sin calorías ni macros calculados** — dependen de la receta de cada platillo, no del tamaño.
  El único cálculo en vivo es el precio.
- Precio: unitario y de paquete, siempre visibles y actualizándose con cada ajuste, con la
  nota de que el de paquete aplica desde 5 platillos en total.
- `Crear y usar este tamaño` lo guarda, lo vuelve el tamaño activo y cierra el panel; el
  tamaño aparece como un pill más en el selector, con su nombre.
- Móvil: mismo panel a pantalla completa, con el precio y el CTA pegados abajo.

## 3. Carrito (sidebar)

- Refleja el estado al instante; no hay modal de confirmación al agregar (el modal AddToCart
  actual desaparece).
- **Agrupa por tamaño**, no por platillo. Un mismo platillo en dos tamaños son dos líneas
  en dos grupos distintos.
- Cada línea muestra el precio unitario **de su propio tamaño**, con etiqueta del tamaño
  cuando hay más de un grupo.
- Los steppers del sidebar y los del grid son la misma cantidad, en sync en ambos sentidos.
- El sidebar es sticky; con muchos ítems, la lista scrollea y el bloque de totales queda fijo abajo.

## 4. Pricing

Contando **el total de platillos del pedido, sumando todos los tamaños**:

- Total < 5 → cada platillo a su precio unitario.
- Total ≥ 5 → cada platillo al precio de paquete **de su propio tamaño**
  (3 Fit + 2 Protein+ = 5 → los Fit a precio-paquete Fit, los Protein+ a precio-paquete Protein+).
  A partir de 5 el precio de paquete se respeta siempre, sin más escalones.
- El cambio es automático y silencioso: nada que el usuario pida o active.
- Cruzar el umbral hacia arriba o hacia abajo reprecia todo el carrito y el grid al instante.

Estados visibles:
- **< 5**: barra de progreso "Te faltan N para precio de paquete", N/5, y cuánto ahorraría
  ("Ahorrarías $25 y el paquete se activa solo"). **No** se muestran precios tachados todavía.
- **≥ 5**: banner verde de paquete activo (arriba del grid y en el sidebar), precio de paquete
  con el unitario tachado en el grid, y el descuento como línea propia en los totales.

## 5. Estados de la página

| Estado | Qué se ve |
|---|---|
| Carrito vacío | Selector completo, grid, sidebar con mascota y "Empieza a armar" · CTA deshabilitado |
| 1–4 platillos | Barra de progreso, precios unitarios, CTA activo |
| ≥5 platillos | Banner de paquete, precios de paquete, CTA prominente |
| Sin stock global / ventas pausadas | Overlay bloqueante encima de todo |

## 6. Salidas / edición

Dos botones en el sidebar (y en el drawer móvil), ambos activos desde el primer platillo:

- `Agregar al carrito` (secundario) — vuelca el estado al carrito global y se queda en /menu.
- `Ir a pagar` (primario) — vuelca el estado al carrito global y va directo a checkout.

Con el carrito vacío ambos están deshabilitados.
- `Editar carrito` desde checkout regresa a /menu con el carrito **precargado**: cantidades,
  tamaños y tamaños personalizados intactos, tamaño activo = el del último grupo agregado.
- El estado del carrito sobrevive recarga de página.
- `/package` y `/meal/:id` desaparecen; redirigir a `/menu`.

## 7. Móvil

- Sin sidebar. Barra flotante pegada abajo: progreso hacia el descuento, contador, total y
  `Ver mi semana`.
- Abre un drawer con el mismo contenido del sidebar. `Seguir agregando` lo cierra.
- Cards en una columna, misma anatomía. Pills de tamaño en fila con scroll horizontal, sin wrap.
- Debajo de los pills va **una sola card compacta con el desglose del tamaño seleccionado**
  (ver `3b`). Es el equivalente móvil a las cuatro cards del desktop: en vez de mostrar los
  cuatro tamaños, muestra solo el activo, y su contenido cambia al seleccionar otro.
- Esa card es **horizontal y de dos líneas, ~86px de alto**: arriba las tres porciones en fila
  (`PROTEINA 180g` · `CARBO 55g` · `VERDURA 70g`) con el botón `i` a la derecha; abajo, en una
  línea, `$155 c/u` y `$150 en paquete desde 5`.
- **No lista los ingredientes de cada porción** — igual que el desktop. Esa información vive
  en el modal de porciones (§9).
- Esa card sigue el mismo comportamiento que el selector en desktop: vive arriba, no se
  colapsa al agregar platillos, y al hacer scroll se sustituye por la barra compacta pegada.
- Hit targets mínimo 44px (steppers, pills, toggle de ingredientes).

## 10. Selector de tamaño y porciones

Ver `5a`, `5b`, `5c` y `design_handoff_menu_redesign/UPDATE-porciones.md`.
(`4a` y `4b` fueron exploración y quedan obsoletos.)

- **Las cards de tamaño llevan solo el nombre** (+ badge). Los gramos y el precio viven en el
  bloque de porciones de abajo, así que en la card duplicaban información.
- Grid `auto-fit` en web y móvil: se reacomoda según el ancho y la cantidad de tamaños.
  **Sin scroll horizontal en ningún breakpoint.**
- Los tamaños personalizados son cards normales del mismo grid, con badge `Tuyo`, y se
  seleccionan con un clic como cualquier otro.
- El bloque de porciones describe el tamaño activo: **Proteína y Carbo siempre por ingrediente**
  (aunque todos pesen lo mismo), **Verdura como un solo número** sin desglose ni glosa.
- **Todas las porciones se pintan igual**: no hay estado "default", ni chip punteado, ni alerta.
- El precio cierra el bloque en web y en móvil, y **el de paquete es el protagonista**: grande
  y en verde `#7ac77a`; el unitario queda a la derecha como referencia secundaria y apagada.
- Móvil **mantiene las tres columnas** de porciones, no las apila.
- Badges: `★ El más pedido` (solo `★` en móvil) y `Custom` en los tamaños del usuario.
- `Editar` y `Eliminar` aparecen junto al encabezado **solo con un tamaño personalizado activo**.
  `Editar` abre el panel de creación (§ `2a`/`2b`) en línea y precargado — no es la forma de
  cambiar de tamaño, para eso están las cards. Guardar-sobre-el-existente vs. crear-uno-nuevo
  está **por definir**.

## 9. Modal "Que son las porciones"

Un solo contenido, dos presentaciones (`3a` desktop, `3b` móvil).

- **Disparador**: botón `i · Que son las porciones` a la derecha del label `1 · Tu tamaño` en
  desktop, y botón `i` de 40px dentro de la card de porciones en móvil. La barra compacta
  sticky lleva el mismo `i` al final de su resumen de macros.
- **Desktop**: modal centrado de 640px sobre backdrop `rgba(8,7,6,.78)`, cuerpo scrolleable,
  cierra con `×`, `Entendido`, clic en el backdrop o `Esc`.
- **Móvil**: bottom sheet con handle, mismo contenido, `Entendido` pegado abajo; cierra con
  `×`, botón, swipe hacia abajo o tap en el backdrop.
- **Contenido**: intro de una frase; un bloque por porción (proteína / carbo / verdura) con
  nombre, la nota `Se pesa en crudo`, una descripción corta y **los ingredientes de esa porción
  como chips**; y al final la nota naranja `Todo se pesa en crudo`.
- Es informativo y **no depende del tamaño activo**: no muestra gramos, no cambia al cambiar de
  tamaño y no tiene acciones más que cerrar.
- Los ingredientes vienen del catálogo por categoría de porción, no del platillo seleccionado.
- ⚠️ **El copy actual es genérico y está por definir con la marca.**

## 8. Tipografía

- Titulares, nombres de platillo, pills y botones: **Franchise**, siempre uppercase.
  Franchise no tiene acentos ni caracteres especiales completos — **el copy que va en Franchise
  debe escribirse sin acentos** ("MENU", "ACEPTAR", "SELECCIONA"). Si un texto necesita acento,
  va en la sans, no en Franchise.
- Descripciones, macros, labels, legales, precios en línea: **Barlow**.

