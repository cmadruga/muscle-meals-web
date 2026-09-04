# Handoff: /menu — Arma tu semana (Muscle Meals)

## Overview
Rediseño de `/menu`: se eliminan las rutas separadas `/package` y `/meal/:id` y se
unifican en un solo flujo donde el usuario (1) elige un tamaño, (2) agrega platillos,
(3) ve el carrito y el total en vivo, y (4) sale por `Agregar al carrito` o `Ir a pagar`.
El descuento de paquete se activa solo al llegar a 5 platillos totales.

Incluye también el rediseño de login/registro (`Auth Redesign.dc.html`), independiente.

## About the design files
Los archivos de `reference/` son **referencias de diseño hechas en HTML**: prototipos que
muestran el look y el comportamiento previstos, **no código de producción para copiar**.
La tarea es **recrear estos diseños dentro del codebase existente** (sus componentes, su
router, su state, su librería de estilos), no pegar el HTML.

Ábrelos en el navegador (`reference/Menu Redesign.dc.html`, requiere estar servido con
`support.js` al lado) y usa DevTools para leer valores exactos: **todos los estilos son
inline, así que el HTML ES la fuente de verdad de medidas y colores.** Cuando este README
y el HTML difieran, gana el HTML.

## Fidelity
**High-fidelity.** Colores, tipografía, espaciado y estados son finales. Se espera
paridad visual, no una interpretación. Anchos de referencia: desktop 1280px
(contenido `1fr` + sidebar `372px`), móvil 390px.

## Screens / Views

Los ids (`1a`–`1d`, `2a`–`2b`) son los mismos que aparecen como badge en el archivo de
referencia. Cita esos ids al hablar del diseño.

### 1a — Desktop, carrito vacío
- **Purpose**: entrada a la página; el usuario elige tamaño antes de agregar.
- **Layout**: topbar 64px (`padding:0 26px`, `border-bottom:1px solid rgba(255,255,255,.08)`,
  `background:#0c0a09`). Debajo, `display:grid;grid-template-columns:1fr 372px`.
  Columna izquierda `padding:30px 28px 40px` + `border-right:1px solid rgba(255,255,255,.08)`.
- **Topbar**: logo `assets/logo-horizontal.png` a `height:22px`; divisor `1px × 22px`
  `rgba(255,255,255,.1)`; `← Volver al inicio` Barlow 500 13.5px `rgba(245,241,236,.55)`.
  Derecha: icono de carrito en cuadro `36×36`, `radius 9px`, `background rgba(255,255,255,.05)`;
  chip de usuario `padding:9px 14px`, `border 1px rgba(255,255,255,.14)`, `radius 9px`, con
  avatar circular `20px` `#F79138` / texto `#17140f`.
- **H1** `Arma tu semana`: Franchise 700 **54px/.88**, uppercase, `#F5F1EC`, `margin:0 0 6px`.
- **Subcopy**: Barlow 400 15px/1.5, `rgba(245,241,236,.6)`, `max-width:56ch`, `text-wrap:pretty`,
  `margin-bottom:26px`.
- **Section label** `1 · Tu tamaño`: Franchise 700 15px, `letter-spacing:.16em`, uppercase +
  hint Barlow 400 13px `rgba(245,241,236,.45)` (`se aplica a lo que agregues después`).
- **Cards de tamaño**: `grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:32px`.
  Cada card `padding:15px 15px 14px`, `radius:11px`.
  - Inactiva: `border:1px solid rgba(255,255,255,.12)`, `background:rgba(255,255,255,.03)`;
    hover `background:rgba(255,255,255,.06)`.
  - Activa: `border:1px solid #F79138`, `background:rgba(247,145,56,.1)`, título en `#F79138`.
  - Título: Franchise 700 26px, uppercase. Macros: Barlow 400 12.5px/1.35 `rgba(245,241,236,.5)`
    (`.6` en la activa), `margin-top:5px`. Precio: Barlow 600 14px `#F5F1EC` + sufijo
    `c/u · $N en paquete` en 400 `rgba(245,241,236,.4)`, `margin-top:9px`.
  - Badge `El más pedido`: absoluto `top:-8px;right:11px`, `padding:3px 7px`, `radius:4px`,
    `background:#F79138`, texto Barlow 700 9.5px `letter-spacing:.1em` uppercase `#17140f`.
  - Card `+ Personalizado`: `border:1px dashed rgba(255,255,255,.22)`, fondo transparente,
    hover `border-color:#F79138`; título Franchise 700 22px `rgba(245,241,236,.8)`.
- **Section label** `2 · Los platillos` + filtros a la derecha: pills `padding:7px 12px`,
  `radius:20px`; activo `background:#F5F1EC` texto `#17140f` Barlow 600 12px; inactivo
  `background:rgba(255,255,255,.05)` texto `rgba(245,241,236,.6)` 500 12px. Gap 7px.
- **Grid de platillos**: `repeat(3,1fr);gap:14px;align-items:start` (crítico: al abrir
  ingredientes la card crece sola, sin reflow de la fila).
- **Card de platillo**: `border:1px solid rgba(255,255,255,.09)`, `radius:12px`,
  `background:#191614`, `overflow:hidden`.
  - Foto: `height:132px`, `border-bottom:1px solid rgba(255,255,255,.07)`.
  - Botón `+ Agregar`: absoluto `top:9px;right:9px`, `padding:9px 14px`, `radius:9px`,
    `background:#F79138`, texto Franchise 700 14px `letter-spacing:.1em` uppercase `#17140f`;
    hover `#ffa252`.
  - Cuerpo `padding:13px 14px 12px`. Nombre: Franchise 700 21px uppercase `#F79138`;
    precio a la derecha Barlow 600 14.5px `#F5F1EC`, `flex:none`, alineado a `baseline`.
  - Descripción: Barlow 400 12.5px/1.45 `rgba(245,241,236,.55)`, `margin:7px 0 11px`.
  - Macros: 4 boxes `repeat(4,1fr);gap:6px`, cada uno `padding:7px 0 6px`,
    `border:1px solid rgba(255,255,255,.1)`, `radius:8px`, `background:rgba(255,255,255,.03)`,
    centrado; cifra Barlow 700 15px `#F5F1EC`; label Barlow 600 9px `letter-spacing:.1em`
    uppercase `rgba(245,241,236,.45)`, `margin-top:3px`. Orden: Calorías / Proteína / Carbos / Grasas.
  - Ingredientes: `<details>` cerrado por default, `margin-top:11px`,
    `border-top:1px solid rgba(255,255,255,.08)`. Summary centrado, Franchise 700 13px
    `letter-spacing:.12em` uppercase `#F79138`, con caret 9px que rota 180° (`transition .15s`)
    y label que cambia `Ingredientes` → `Ocultar`. Lista `repeat(2,1fr)`, `gap:2px 14px`,
    items Barlow 400 12px/1.55 `rgba(245,241,236,.62)`.
  - **Agotado**: card a `opacity:.5`, sin botón ni stepper; badge `Agotado` centrado sobre la
    foto (`padding:5px 10px`, `radius:5px`, `background:rgba(0,0,0,.6)`, Barlow 700 10px
    `letter-spacing:.12em`); donde iba el precio, `Vuelve el lunes` Barlow 500 11.5px
    `rgba(245,241,236,.5)`.
- **Sidebar vacío** (`padding:26px 22px`, `background:#0c0a09`, columna flex):
  título `Tu semana` Franchise 700 26px + contador Barlow 500 13px `rgba(245,241,236,.4)`.
  Bloque vacío: `border:1px dashed rgba(255,255,255,.16)`, `radius:12px`, `padding:30px 22px`,
  `assets/mascota.png` a `width:104px`, título `Empieza a armar` Franchise 700 20px/1.05,
  copy Barlow 400 13.5px/1.5 `rgba(245,241,236,.55)`.
  Nota naranja: `background:rgba(247,145,56,.07)`, `border:1px solid rgba(247,145,56,.18)`,
  `radius:11px`, `padding:15px`; título `MAS PLATILLOS, MAS AHORRO` (sin acentos, ver Typography).
  Totales pegados abajo (`margin-top:auto;padding-top:22px`): `Total` Barlow 500 14px +
  monto Franchise 700 30px. Botones deshabilitados: secundario `padding:16px 0`,
  `border:1px solid rgba(255,255,255,.1)`, texto `rgba(245,241,236,.28)`; primario
  `padding:18px 0`, `background:rgba(255,255,255,.07)`, texto `rgba(245,241,236,.3)`;
  ambos `radius:10px`, Franchise uppercase `letter-spacing:.1em` (18px / 22px), `cursor:not-allowed`.

### 1b — Desktop con scroll, 3 platillos (sin descuento)
Igual a 1a con: barra compacta de tamaño pegada arriba (`Agregando en: [pills] · macros`),
steppers en las cards con cantidad, borde naranja en esas cards, líneas en el sidebar,
barra de progreso `Te faltan N para precio de paquete` (N/5) con el ahorro proyectado
(`Ahorrarías $25 y el paquete se activa solo`), **sin precios tachados**, y los dos CTAs activos.

### 1c — Desktop con scroll, 6 platillos (descuento activo, tamaños mezclados)
Banner verde de paquete activo arriba del grid y en el sidebar, precio de paquete en el grid
con el unitario tachado, sidebar agrupado por tamaño, y el descuento como línea propia en totales.
Verde de éxito: `#7ac77a`.

### 1d — Móvil (390px)
Sin sidebar. Pills de tamaño en fila con scroll horizontal (sin wrap) + **una card debajo con
el desglose del tamaño activo**, que cambia de contenido al seleccionar otro pill.
Barra flotante pegada abajo (progreso, contador, total, `Ver mi semana`) que abre un drawer
con el contenido del sidebar. Hit targets ≥ 44px.

### 2a / 2b — Tamaño personalizado (desktop / móvil)
**No es modal**: se despliega en línea debajo del selector y empuja el grid hacia abajo.
Contenedor `border:1px solid rgba(247,145,56,.4)`, `radius:12px`,
`background:rgba(247,145,56,.04)`, `padding:24px 24px 20px`, `margin-top:14px`.
- Título `Crear tamaño personalizado` Franchise 700 30px/.95 uppercase + acción
  `Usar FIT como base` Barlow 500 13.5px `#F79138`.
- Campos: input de nombre con label flotante (input `padding:25px 14px 9px`,
  `background:rgba(255,255,255,.04)`, `border:1px solid rgba(255,255,255,.12)`, `radius:9px`,
  `font-size:15px` desktop / **16px móvil** para evitar zoom en iOS) y toggle **Crudo / Cocido**
  (`padding:3px`, `radius:9px`, `background:rgba(255,255,255,.05)`; activo `#F79138` sobre
  `radius:6px`, texto `#17140f` Barlow 700 12.5px `letter-spacing:.08em` uppercase).
- Grupos: **Proteína** (`#F79138`), **Carbo** (`#e8c07d`), **Verdura** (`#7ac77a`); label
  Franchise 700 13px `letter-spacing:.18em`.
- Fila de slider desktop: `grid-template-columns:1fr 240px 132px;gap:18px;padding:16px 0 13px`,
  `border-top:1px solid rgba(255,255,255,.06)`. Nombre Barlow 600 14.5px (`.62` alpha si vale 0),
  `Referencia FIT: Ng` Barlow 400 12px `rgba(245,241,236,.42)`.
- Slider: track `height:6px`, `radius:3px`, `background:rgba(255,255,255,.1)`; relleno del color
  del grupo; knob `18px` circular `#F5F1EC` con `box-shadow:0 1px 5px rgba(0,0,0,.6)`
  (en 0: knob `rgba(245,241,236,.55)` y sin relleno — **cambia de color, no de forma**).
  Marca FIT: tick `1px × 12px` `rgba(245,241,236,.4)` en `top:-3px` + label `FIT` Barlow 600 9px
  en `top:-17px`, centrado.
- Stepper: `padding:3px`, `radius:9px`, `background:rgba(255,255,255,.05)`; botones `30×30`
  `radius:6px`; valor `min-width:52px` Barlow 700 15px.
- Bloque de precio: `padding:16px 18px`, `radius:11px`, `background:rgba(255,255,255,.04)`,
  `border:1px solid rgba(255,255,255,.09)`. Unitario Franchise 700 30px `#F5F1EC`;
  paquete Franchise 700 24px `#7ac77a` + `desde 5 platillos`.
- CTAs: `grid-template-columns:1fr 200px;gap:10px`. Primario `Crear y usar este tamaño`
  `padding:17px 0`, `radius:10px`, `background:#F79138`, texto Franchise 700 20px
  `letter-spacing:.09em` uppercase `#17140f`, `box-shadow:0 8px 26px rgba(247,145,56,.22)`,
  hover `#ffa252`. Secundario `Cancelar` `border:1px solid rgba(255,255,255,.16)`,
  Barlow 600 14px `rgba(245,241,236,.7)`, hover `background:rgba(255,255,255,.06)`.
- **Sin calorías ni macros calculados** en el panel; el único cálculo en vivo es el precio.
- Móvil: mismo panel a pantalla completa, precio y CTA pegados abajo, `padding:18px`,
  header con botón `×` de `34×34` `radius:9px` `background:rgba(255,255,255,.06)`.

## Interactions & Behavior
Todo el comportamiento está en `menu-spec.md` (secciones 1–8) — es normativo, léelo completo
antes de implementar. Resumen de lo que más se malinterpreta:
1. El selector completo **nunca se colapsa** por agregar platillos; la barra compacta sticky es
   un **elemento distinto** que aparece cuando el bloque sale del viewport.
2. Cambiar el tamaño activo reprecia el grid pero **no toca lo que ya está en el carrito**.
3. Repricing por **total de platillos del pedido** (≥5), cada platillo al precio de paquete
   **de su propio tamaño**. Automático y silencioso, en ambas direcciones.
4. `< 5`: progreso + ahorro proyectado, **sin** precios tachados. `≥ 5`: banner verde,
   unitario tachado, descuento como línea de totales.
5. Ingredientes: `<details>` por card, independientes (no acordeón), sin reflow del grid.
6. Steppers de grid y sidebar son la misma cantidad, sync bidireccional. `−` en 1 elimina.
7. Sin modal de confirmación al agregar (el `AddToCart` actual se elimina).
8. Dos salidas, ambas activas desde el primer platillo: `Agregar al carrito` (secundario,
   se queda en /menu) e `Ir a pagar` (primario, va a checkout).
9. `Editar carrito` desde checkout regresa a /menu **precargado**; el estado sobrevive recarga.
10. `/package` y `/meal/:id` redirigen a `/menu`.

Transiciones: solo las declaradas (caret `.15s`). No agregues animaciones que no estén en la
referencia.

## State Management
- `activeSize`: `'low_calorie' | 'fit' | 'protein_plus' | customSizeId` — aplica a lo siguiente
  que se agregue.
- `customSizes[]`: `{ id, name, weighedAs: 'raw'|'cooked', grams: { [ingredientId]: number },
  unitPrice, packagePrice }`.
- `cart`: líneas `{ mealId, sizeId, qty }` — la clave es **(platillo, tamaño)**: el mismo
  platillo en dos tamaños son dos líneas.
- Derivados: `totalQty = Σ qty`; `packageActive = totalQty >= 5`;
  `lineUnitPrice = packageActive ? size.packagePrice : size.unitPrice`;
  `discount = Σ qty × (unitPrice − packagePrice)` cuando `packageActive`.
- `stickyBarVisible`: por IntersectionObserver sobre el bloque del selector (no por scrollY).
- `customPanelOpen`: bool; `Cancelar` descarta sin dejar rastro.
- Persistencia: carrito + tamaños personalizados sobreviven recarga y el viaje a checkout.
- Precios, macros, ingredientes y stock vienen de la base de datos. **Los números del mockup
  son de ejemplo** (excepto los precios de paquete: $145/$155/$165 unitario, $140/$150/$160
  en paquete). Escalas de slider: proteína 0–400g, carbo y verdura 0–200g, pasos de 5g.

## Design Tokens

### Color
| Token | Valor | Uso |
|---|---|---|
| `bg/page` | `#0a0908` | fondo de página |
| `bg/panel` | `#0c0a09` | topbar y sidebar |
| `bg/card` | `#191614` | cards de platillo |
| `brand/orange` | `#F79138` | acento, activos, CTA primario |
| `brand/orange-hover` | `#ffa252` | hover de CTA |
| `ink/on-orange` | `#17140f` | texto sobre naranja |
| `text/primary` | `#F5F1EC` | texto principal |
| `success` | `#7ac77a` | precio de paquete, banner activo, verdura |
| `carb` | `#e8c07d` | grupo carbo |
| `overlay/pattern` | `assets/fondo.jpg` | textura de fondo (repeat, 1100px) |

Alphas de texto sobre oscuro (`rgba(245,241,236,α)`): `.7` iconos · `.62` items de lista ·
`.6`/`.55` secundario · `.5`/`.45` terciario · `.42`/`.4` labels y hints · `.35` vacío ·
`.3`/`.28` deshabilitado.
Bordes (`rgba(255,255,255,α)`): `.06` divisor interno · `.08` divisor de sección ·
`.09`/`.1` borde de card · `.12` borde de control · `.14`/`.16` borde de botón ·
`.22` dashed. Superficies: `.03` · `.04` · `.05` · `.06` (hover) · `.07`.

### Typography
- **Franchise** (700, siempre uppercase): titulares, nombres de platillo, pills, botones,
  cifras grandes. Fallbacks: `'Big Shoulders Display'` para tamaños grandes,
  `'Barlow Condensed'` para labels/botones. **Se necesita el archivo real de Franchise**
  (ver Assets).
  - ⚠️ **Franchise no tiene acentos.** Todo el copy en Franchise se escribe **sin acentos**
    (`MENU`, `MAS PLATILLOS, MAS AHORRO`, `ACEPTAR`). Si un texto necesita acento, va en Barlow.
- **Barlow** (400/500/600/700): descripciones, macros, labels, precios en línea, legales.
- Escala usada: 54 / 30 / 26 / 24 / 22 / 21 / 20 / 18 / 16 / 15 / 14.5 / 14 / 13.5 / 13 /
  12.5 / 12 / 11.5 / 10 / 9.5 / 9 px.
- Letter-spacing: `.08em` toggles · `.09em`/`.1em` botones · `.12em` labels y badges ·
  `.16em` labels de sección · `.18em` labels de grupo.

### Radius
`4px` badge · `5px` badge agotado · `6px` segmento activo · `8px` box de macro ·
`9px` control/input/botón chico · `10px` CTA · `11px` card de tamaño / nota ·
`12px` card de platillo / panel · `20px` pill · `50%` avatar y knob · `22px` marco móvil.

### Spacing
Escala real: 2 · 3 · 5 · 6 · 7 · 9 · 10 · 11 · 12 · 13 · 14 · 15 · 16 · 18 · 20 · 22 · 24 ·
26 · 28 · 30 · 32 · 40 px. Gaps de grid: 6 (macros) · 10 (tamaños) · 14 (platillos) ·
18 (fila de slider).

### Shadow
`0 8px 26px rgba(247,145,56,.22)` CTA primario · `0 1px 5px rgba(0,0,0,.6)` knob de slider.

## Assets
En `reference/assets/` (los mismos de producción):
`logo-horizontal.png` (topbar, 22px de alto), `logo-color.png`, `logo-mark.png`,
`mascota.png` (estado vacío del sidebar, 104px), `membership-lockup.png`, `fondo.jpg` (textura).

**Faltan y bloquean paridad visual:**
1. **Archivo de Franchise** (woff2). Sin él el mockup cae a Big Shoulders / Barlow Condensed
   y la tipografía no coincide. Súbelo al proyecto y decláralo con `@font-face`.
2. **Fotos de los platillos.** En el mockup son placeholders rayados de `132px` de alto.
3. **Catálogo real**: solo `Pasta a la Vinagreta` y `Pasta Bolognesa` tienen nombre,
   descripción, macros e ingredientes reales; el resto es de ejemplo. Todo debe venir de la BD.

## Files
- `screenshots/` — captura de cada estado a 2x, para revisar sin abrir el HTML.
  **Son apoyo, no fuente de verdad**: para medidas y colores usa el HTML (estilos inline).
  `1a-desktop-carrito-vacio.png` · `1b-desktop-3-platillos.png` ·
  `1c-desktop-6-platillos-descuento.png` · `1d-movil.png` ·
  `2a-tamano-personalizado-desktop.png` · `2b-tamano-personalizado-movil.png`
- `reference/Menu Redesign.dc.html` — estados 1a, 1b, 1c, 1d, 2a, 2b (todos en una página;
  los badges `1a`…`2b` identifican cada uno).
- `reference/Auth Redesign.dc.html` — login/registro (turno 1; tiene espacios reservados
  para logos).
- `menu-spec.md` — spec de comportamiento **normativa**.
- `WORKFLOW.md` — cómo iterar con este handoff sin perder fidelidad.
- `CLAUDE.md` — reglas para pegar en el `CLAUDE.md` del repo.
