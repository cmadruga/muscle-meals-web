# Handoff: /checkout — Muscle Meals

## Overview
Rediseño completo de `/checkout`. Tres cambios de fondo respecto a lo que hay hoy:

1. **`/cart` desaparece.** No hay paso intermedio: `/menu` → `/checkout`. La sección de activar
   membresía que vivía en `/cart` se mueve aquí, arriba de todo.
2. **Hereda el sistema visual del nuevo `/menu`** (Franchise + Barlow, `#0a0908`, naranja
   `#F79138`). El checkout actual usa una paleta más vieja que no alineó.
3. **Dos columnas en desktop**: formulario a la izquierda, resumen sticky a la derecha. Hoy es
   una columna de 700px que obliga a scrollear todo el formulario antes de ver el total.

## About the design files
`reference/Checkout Redesign.dc.html` es una **referencia de diseño hecha en HTML**: un
prototipo del look y el comportamiento previstos, **no código de producción para copiar**.
La tarea es **recrear el diseño con los componentes, el router y el state del repo**.

Ábrelo en el navegador (necesita `support.js` al lado) y usa DevTools para leer valores
exactos: **todos los estilos son inline, así que el HTML ES la fuente de verdad de medidas y
colores.** Cuando este README y el HTML difieran, gana el HTML. Los `screenshots/` son apoyo
para revisar sin abrir el archivo, no fuente de valores.

## Fidelity
**High-fidelity.** Paridad visual esperada. Anchos de referencia: desktop 1280px, móvil 390px.

---

## Cómo se combinan los bloques (LEE ESTO PRIMERO)

Los ids `1a`–`2e` **no son seis pantallas distintas**: son la misma página en distintos
estados, y algunos son fragmentos. La página se compone SIEMPRE en este orden:

```
topbar
H1 "CHECKOUT" + subcopy
┌─ BANDA DE MEMBRESIA ────────────────────────── full width, siempre presente
│  apagada → 1a / 2a        encendida → 1b
└──────────────────────────────────────────────
┌─ columna izquierda (1fr) ────┬─ sidebar sticky (392px) ─┐
│ 1 · Tu entrega               │ Tu pedido / Tu membresia │
│   · banner de fecha          │ resumen agrupado         │
│   · 3 cards de envío         │ código de descuento      │
│   · detalle del activo       │ totales                  │
│ 2 · Contacto (y direccion)   │ CTA                      │
└──────────────────────────────┴──────────────────────────┘
```

**Matriz de estados.** Dos ejes independientes que se combinan libremente:

| | membresía APAGADA | membresía ENCENDIDA |
|---|---|---|
| **Envío estándar** | `1a` (completo) | `1b` (completo) |
| **Pickup** | `2a` (completo) | banda de `1b` + columnas de `2a` |
| **Nueva dirección** | sección 2 de `2b` | banda de `1b` + sección 2 de `2b` |

- `1a` y `1b` y `2a` son **páginas completas** — cópialas de arriba a abajo.
- `2b` es un **FRAGMENTO**: solo la sección 2. Todo lo de arriba (topbar, H1, banda de
  membresía, sección 1) va idéntico a `1a`.
- **Combinar es legítimo**: pickup + membresía activa es un estado real y sale de mezclar la
  banda de `1b` con las columnas de `2a`. No hay mock dedicado porque no aporta nada nuevo.

**Móvil**: misma composición, una columna, sin sidebar.
- `2c` es la página **completa** en tres vistas del mismo scroll (arriba / abajo / resumen
  abierto). **Es la referencia de orden canónica en móvil.**
- `1c` es una versión anterior del móvil base; `2c` la reemplaza donde difieran.
- `2d` son los estados de pickup y nueva dirección; `2e` es membresía activada.

---

## Bloques

### Topbar (64px)
`padding:0 26px`, `border-bottom:1px solid rgba(255,255,255,.08)`, `background:#0c0a09`.
Logo `assets/logo-horizontal.png` a `height:22px`, divisor `1px × 22px rgba(255,255,255,.1)`,
`← Volver al menú` Barlow 500 13.5px `rgba(245,241,236,.55)`. Derecha: chip de usuario
`padding:9px 14px`, `border:1px solid rgba(255,255,255,.14)`, `radius:9px`, avatar `20px`
`#F79138` con inicial en `#17140f`.
**No hay icono de carrito** — `/cart` ya no existe.
Móvil (54px): `← Menú` · logo `18px` centrado · avatar `26px`.

### H1 y subcopy
`CHECKOUT` Franchise 700 **54px/.88** (móvil 38px/.9) uppercase `#F5F1EC`, `margin:0 0 6px`.
Subcopy Barlow 400 15px/1.5 (móvil 13.5px) `rgba(245,241,236,.6)`, `max-width:56ch`,
`text-wrap:pretty`, `margin-bottom:26px`.

### Banda de membresía — apagada (`1a`, `2a`)
Full width sobre las columnas. `display:flex`, `border:1px solid rgba(247,145,56,.45)`,
`radius:12px`, `background:rgba(247,145,56,.05)`, `overflow:hidden`, `margin-bottom:30px`.
- Izquierda: `assets/membership-lockup.png` a `width:420px`, `object-fit:cover`.
- Derecha (`flex:1`, `padding:20px 22px`, `gap:22px`): título `Pides cada semana?` Franchise
  700 30px/.95 uppercase `#F5F1EC`; copy Barlow 400 13.5px/1.5 `rgba(245,241,236,.6)`;
  tres chips (`padding:5px 10px`, `radius:6px`, Barlow 600 11.5px):
  `Desde −10%` sobre `rgba(247,145,56,.14)` en `#F79138`,
  `Envío siempre gratis` sobre `rgba(122,199,122,.14)` en `#7ac77a`,
  `Cancelas cuando quieras` sobre `rgba(255,255,255,.06)` en `rgba(245,241,236,.65)`.
- Toggle a la derecha: pista `58×32`, `radius:16px`, `padding:3px`,
  `background:rgba(255,255,255,.14)`; knob `26px` `#F5F1EC` con `box-shadow:0 1px 4px rgba(0,0,0,.5)`.

### Banda de membresía — encendida (`1b`)
Mismo bloque con `border:1px solid #F79138` y `background:rgba(247,145,56,.07)`;
título `Membresia activada` en `#F79138`; toggle con `background:#F79138` y knob a la derecha.
- **Selector de plazo**: grid de 3 (`gap:8px`, `margin-top:14px`), cada card `padding:11px 12px`,
  `radius:9px`, centrada; activa `border:1px solid #F79138` + `background:rgba(247,145,56,.14)`
  con `4 sem.` Barlow 700 17px `#F79138` y `−10%` Barlow 500 12px; inactivas
  `border:1px solid rgba(255,255,255,.12)` + `background:rgba(255,255,255,.03)`.
  Plazos: **4 sem. −10% · 8 sem. −13% · 12 sem. −15%**.
- **Banda de tres cifras** al pie (`grid-template-columns:repeat(3,1fr)`, `gap:1px`,
  `background:rgba(247,145,56,.16)` como separador, celdas `padding:13px 18px` sobre
  `rgba(20,17,15,.5)`): `Por platillo` · `Por semana` · `Total membresía · 4 sem.`
  Label Barlow 600 11px `letter-spacing:.12em` uppercase `rgba(245,241,236,.45)`;
  precio anterior Barlow 400 13px `rgba(245,241,236,.4)` con `line-through` + nuevo Barlow 700
  17px (`#F5F1EC`, el total en `#F79138`).
- Móvil (`2e`): mismos elementos dentro del banner, plazos en grid de 3 y las tres cifras como
  **filas** (`padding:10px 15px`, separadas por `border-bottom:1px solid rgba(255,255,255,.06)`).

### Grid de columnas
`display:grid; grid-template-columns:1fr 392px; gap:26px; align-items:start`.
El sidebar es `position:sticky` con offset bajo el topbar. Wrapper `padding:30px 28px 40px`.

### 1 · Tu entrega
Label `1 · Tu entrega` Franchise 700 15px `letter-spacing:.16em` uppercase `#F5F1EC` + hint
Barlow 400 13px `rgba(245,241,236,.45)` (`entregamos cada domingo`; con membresía activa
`cada domingo, durante 4 semanas`).

**Banner de fecha**: `padding:14px 16px`, `border:1px solid rgba(122,199,122,.35)`, `radius:11px`,
`background:rgba(122,199,122,.07)`, `gap:14px`. Cuadro de día `38×38` (móvil 34), `radius:9px`,
`background:rgba(122,199,122,.14)`, número Franchise 700 15px `#7ac77a`. Título Barlow 700 15px
`#7ac77a`, nota Barlow 400 12.5px `rgba(245,241,236,.5)`.
Copy por caso: envío → `Entrega: domingo, 13 de septiembre`; pickup → `Recoge: …`;
membresía → `Primera entrega: …` + `Luego cada domingo hasta el 4 de octubre`.

**Tres cards de envío** (`grid-template-columns:repeat(3,1fr)`, `gap:10px`), cada una
`padding:15px`, `radius:11px`. Inactiva `border:1px solid rgba(255,255,255,.12)` +
`background:rgba(255,255,255,.03)`, hover `rgba(255,255,255,.06)`; activa
`border:1px solid #F79138` + `background:rgba(247,145,56,.1)` con el nombre en `#F79138`.
Nombre Franchise 700 20px uppercase (**sin acentos**: `ESTANDAR`, `PICKUP`, `PRIORITARIO`);
precio Barlow 700 16px (`Gratis` en `#7ac77a`, `$100–200` en `rgba(245,241,236,.75)`);
descripción Barlow 400 12px/1.35.
Con membresía activa, Estándar lleva badge `Incluido` (`top:-8px;right:11px`, `padding:3px 7px`,
`radius:4px`, `background:#7ac77a`, Barlow 700 9.5px `letter-spacing:.1em` uppercase `#14110f`)
y precio `Gratis`.
**Móvil**: las tres cards se apilan como filas horizontales (nombre+descripción izquierda,
precio derecha), `padding:14px 15px`.

**Detalle del tipo activo**, debajo de las cards, `padding:15px 16px`,
`border:1px solid rgba(255,255,255,.09)`, `radius:11px`, `background:rgba(255,255,255,.03)`,
`margin-bottom:28px`. Cambia por tipo:
- Estándar → `Horario según tu zona` + `Te escribimos el sábado por WhatsApp con la hora
  estimada de entrega del domingo.`
- Pickup → `Elige tu pickup spot` + `requerido` a la derecha, y la lista de spots (abajo).
- Prioritario → los tres puntos: acordar horario, confirmar costo, pago separado.

**Lista de pickup spots** (`2a`, `2d`): un radio-card por spot, `padding:13px 15px`,
`radius:10px`, `gap:8px`. Activo `border:1px solid #F79138` + `background:rgba(247,145,56,.08)`;
inactivo `border:1px solid rgba(255,255,255,.12)` + `background:rgba(255,255,255,.03)`.
Radio `16px` circular con punto interior `8px`. Nombre Barlow 600 14px `#F5F1EC`, horario
Barlow 500 12px (`#F79138` si activo), dirección Barlow 400 12.5px/1.45 `rgba(245,241,236,.55)`.
En desktop nombre y horario van en la misma línea (`space-between`); en móvil el horario baja.
**Sin spot elegido**: el bloque toma `border-color` rojo y el CTA se deshabilita.

### 2 · Contacto (y direccion)
El título del bloque **depende del tipo de envío**:
- Envío estándar / prioritario → `2 · Contacto y direccion`
- **Pickup → `2 · Contacto`** + hint `recoges tú, no pedimos dirección`, y **todo el bloque de
  dirección desaparece** (radios y formulario). No lo esconds con `opacity`: no se renderiza.

**Campos**: label Barlow 600 12px `letter-spacing:.04em` `rgba(245,241,236,.6)`, `margin-bottom:6px`.
Input `padding:14px`, `border:1px solid rgba(255,255,255,.12)`, `radius:9px`,
`background:rgba(255,255,255,.04)`, texto 15px desktop / **16px móvil** (evita el zoom de iOS).
WhatsApp: grid `118px 1fr` (móvil `104px 1fr`), lada como select. Nota bajo el campo
Barlow 400 12px `rgba(245,241,236,.45)`: `Recibirás la confirmación de pago por WhatsApp`
(pickup: `Te avisamos por WhatsApp cuando tu pedido esté listo para recoger`).

**Dirección** (`margin-top:6px; padding-top:18px; border-top:1px solid rgba(255,255,255,.08)`):
subtítulo `Direccion de entrega` Franchise 700 13px `letter-spacing:.16em` uppercase `#F79138`.
Dos radio-cards (`padding:13px 15px`, `radius:10px`): `Usar dirección guardada` con la
dirección en Barlow 400 12.5px/1.4, y `Ingresar otra dirección`.

**Formulario de nueva dirección** (`2b`, `2d`): aparece **dentro de un recuadro**
`padding:18px` (móvil 15), `border:1px solid rgba(247,145,56,.28)`, `radius:11px`,
`background:rgba(247,145,56,.03)`, `gap:12px` — así se lee como consecuencia del radio activo
y no como una sección nueva. Campos: `Calle *` · `Núm. exterior *` + `Núm. interior`
(grid `1fr 1fr`) · `Colonia *` · `CP *` + `Ciudad` (grid `150px 1fr`, móvil `118px 1fr`).
`Ciudad` es read-only, se llena desde el CP: `border:1px solid rgba(255,255,255,.08)`,
`background:rgba(255,255,255,.02)`, placeholder `Se llena con el CP`.
**Error de CP fuera del área**: el campo toma `border:1px solid #ff8080` +
`background:rgba(255,128,128,.06)`, y debajo una línea (no un bloque suelto)
`padding:11px 13px`, `border:1px solid rgba(255,128,128,.35)`, `radius:9px`,
`background:rgba(255,128,128,.07)`, icono `18px` circular y texto Barlow 500 12.5px/1.4
`#ff9b9b`: `Entregamos solo en el área metropolitana de Monterrey. Revisa el CP o elige Pickup.`

### Sidebar / resumen
`border:1px solid rgba(255,255,255,.1)` (con membresía activa `#F79138`), `radius:12px`,
`background:#0c0a09`, `overflow:hidden`.
Header `padding:18px 18px 14px`: `Tu pedido` (membresía: `Tu membresia`) Franchise 700 26px
uppercase + contador Barlow 500 13px `rgba(245,241,236,.4)` (`7 platillos` / `4 semanas`).

**Resumen agrupado por tamaño** — este es el cambio que pediste:
- Cabecera de grupo: `padding:9px 18px`, `background:rgba(255,255,255,.02)`, Barlow 600 10.5px
  `letter-spacing:.16em` uppercase `rgba(245,241,236,.4)`: `Fit · 3 platillos`.
- Fila de platillo: `padding:11px 18px`, `border-top:1px solid rgba(255,255,255,.05)`, dos líneas.
  Línea 1: nombre Barlow 600 14px `#F5F1EC` + `×3` Barlow 500 11.5px `rgba(245,241,236,.4)`.
  Línea 2 (`margin-top:5px`): `$160.00 c/u` Barlow 400 12.5px **`#7ac77a`** + total de línea
  Barlow 700 13.5px `#F5F1EC`.
- El unitario va en verde porque es el **precio de paquete ya aplicado** (≥5 platillos). Sin
  descuento activo va en `rgba(245,241,236,.5)`.
- **Solo lectura**: sin steppers, sin `×` de eliminar. Para cambiar platillos se vuelve al menú.

**Código de descuento**: `padding:14px 18px`, input `flex:1` + botón `Aplicar`
(`border:1px solid rgba(247,145,56,.5)`, `background:rgba(247,145,56,.1)`, `#F79138`,
Barlow 600 13px).

**Totales** (`padding:16px 18px`, filas `padding:5px 0`, label Barlow 400 13.5px
`rgba(245,241,236,.6)`, valor Barlow 500 13.5px `#F5F1EC`; las de ahorro completas en `#7ac77a`):
- Normal: `Subtotal` · `Envío estándar` · `Descuento por paquete −$35.00`
- Pickup: la línea de envío se vuelve `Pickup · La Frutería — Gratis` en verde
- Membresía: `Semana` · `× 4 semanas` · `Envío incluido — Gratis` · `Ahorro total −$672.00`

Total: `margin-top:10px; padding-top:14px; border-top:1px solid rgba(255,255,255,.1)`;
label Barlow 500 14px `#F5F1EC` (`Total` / `Total hoy`), monto Franchise 700 **34px** `#F79138`.

**CTA** (`padding:0 18px 18px`): `width:100%`, `padding:18px 0`, `radius:10px`,
`background:#F79138`, texto Franchise 700 22px `letter-spacing:.1em` uppercase `#17140f`,
`box-shadow:0 8px 26px rgba(247,145,56,.22)`, hover `#ffa252`.
Texto por caso: `Proceder al pago` · `Activar membresia` · `Confirmar con membresia`.
**Deshabilitado**: `border:1px solid rgba(255,255,255,.1)`, `background:rgba(255,255,255,.05)`,
texto `rgba(245,241,236,.3)`, `cursor:not-allowed`, y **el texto dice qué falta** —
`Completa la direccion`, `Falta el CP`, `Elige un pickup spot` — nunca un gris mudo.
Debajo, nota Barlow 400 11.5px/1.45 `rgba(245,241,236,.4)` centrada con el motivo o los términos.

### Móvil — composición (`2c` es la referencia canónica)
Una columna, sin sidebar, `padding:18px 18px 132px` (el padding inferior libra la barra fija).
Orden: H1 → **banda de membresía** → **resumen colapsado** → `1 · Tu entrega` →
`2 · Contacto y direccion`.

**Resumen colapsado**: card de una línea, `padding:14px 15px`, `radius:12px`,
`border:1px solid rgba(255,255,255,.1)`, `background:rgba(255,255,255,.03)`. Izquierda
`Tu pedido` Franchise 700 19px + `7 platillos · Fit y Testo` Barlow 400 12px; derecha el total
Franchise 700 20px `#F79138` + caret. **Abierta** toma `border:1px solid #F79138` y despliega el
resumen agrupado + totales + código de descuento, empujando el resto de la página hacia abajo
(no es otra pantalla, no es un modal).

**Barra fija inferior**: `padding:12px 16px 16px`,
`border-top:1px solid rgba(255,255,255,.1)`, `background:rgba(12,10,9,.97)`.
Línea de total (label Barlow 500 12.5px `rgba(245,241,236,.5)`, monto Franchise 700 26px
`#F79138`) + CTA a ancho completo `padding:16px 0`, Franchise 700 20px.
El label cambia por caso: `Total con envío` · `Pickup · sin costo de envío` (verde) ·
`Total hoy · 4 semanas`.
Hit targets ≥44px. **Sin chip de referidos en móvil** (estorba en el pulgar).

### Referidos
Pasó de banner naranja full-width que tapaba el CTA a un **chip cerrable** abajo a la derecha
(solo desktop): `padding:10px 12px`, `border:1px solid rgba(247,145,56,.4)`, `radius:10px`,
`background:rgba(20,17,15,.96)`, `box-shadow:0 10px 30px rgba(0,0,0,.5)`; texto
`Refiere y gana 10%` Barlow 600 12.5px `#F79138`, el código en `rgba(245,241,236,.45)`,
botón `Copiar` y una `×`. Al cerrarlo no vuelve en la sesión.

---

## Interactions & Behavior

1. **Toggle de membresía** reprecia todo: platillos al precio de membresía, envío estándar a
   `Gratis` con badge `Incluido`, totales cambian a semana/× N/ahorro, CTA a `Activar membresia`,
   header del sidebar a `Tu membresia`. Es reversible y silencioso.
2. **Plazo (4/8/12)** solo cambia el porcentaje y las cifras; no toca los platillos.
3. **Pickup** oculta el bloque de dirección completo y exige spot. Sin spot: CTA deshabilitado.
4. **Cambiar de tipo de envío** conserva lo capturado en dirección (si el usuario vuelve a
   Estándar, sus datos siguen ahí).
5. **CP** dispara autocompletado de ciudad y validación de área. Fuera del área: error + CTA
   deshabilitado, sugiriendo Pickup como salida.
6. **El resumen es de solo lectura** en ambos breakpoints. `← Volver al menú` regresa a `/menu`
   **precargado**; el estado sobrevive recarga.
7. `/cart` redirige a `/checkout`. Cualquier link a `/cart` en la app se actualiza.
8. Transiciones: solo el hover de botones y el despliegue del resumen móvil. No agregues nada
   que no esté en la referencia.

## State Management
```ts
type Shipping = 'standard' | 'pickup' | 'priority';

type CheckoutState = {
  membership: { active: boolean; weeks: 4 | 8 | 12 } | null;
  shipping: Shipping;
  pickupSpotId: string | null;      // requerido si shipping === 'pickup'
  contact: { name: string; countryCode: '+52' | '+1'; phone: string };
  address:
    | { mode: 'saved'; id: string }
    | { mode: 'new'; street; extNumber; intNumber?; neighborhood; zip; city };
  promoCode: string | null;
  summaryOpen: boolean;             // solo móvil
};
```
Derivados: `shippingCost` (0 si pickup o membresía activa), `packageDiscount`,
`membershipDiscount`, `total`, y `canSubmit` (dirección válida o pickup con spot).
El carrito se lee del state de `/menu`, agrupado por `sizeId` para el resumen.
Precios, spots, zonas de entrega y descuentos vienen de la BD. **Los números del mock son de
ejemplo.**

## Design Tokens
Idénticos a `/menu` — si ya implementaste el menú, reusa esos tokens, no crees nuevos.

| Token | Valor | Uso |
|---|---|---|
| `bg/page` | `#0a0908` | fondo |
| `bg/panel` | `#0c0a09` | topbar, sidebar, barra fija |
| `bg/card` | `#191614` | cards |
| `brand/orange` | `#F79138` | acento, activos, CTA |
| `brand/orange-hover` | `#ffa252` | hover de CTA |
| `ink/on-orange` | `#17140f` | texto sobre naranja |
| `text/primary` | `#F5F1EC` | texto |
| `success` | `#7ac77a` | precio de paquete, gratis, entrega |
| `error` | `#ff8080` / `#ff9b9b` | borde / texto de error |
| `overlay/pattern` | `assets/fondo.jpg` | textura (repeat, 1100px) |

**Tipografía**: Franchise 700 uppercase para titulares, nombres, botones y cifras grandes;
Barlow 400–700 para todo lo demás.
⚠️ **Franchise no tiene acentos**: todo el copy en Franchise se escribe **sin acentos**
(`CHECKOUT`, `ESTANDAR`, `MEMBRESIA ACTIVADA`, `ACTIVAR MEMBRESIA`, `DIRECCION DE ENTREGA`).
Si un texto necesita acento, va en Barlow.

Radius: `4px` badge · `6px` chip · `9px` input/control · `10px` CTA/radio-card ·
`11px` card de envío/banner · `12px` panel · `16px` toggle · `22px` marco móvil.
Sombras: `0 8px 26px rgba(247,145,56,.22)` CTA · `0 10px 30px rgba(0,0,0,.5)` chip flotante ·
`0 1px 4px rgba(0,0,0,.5)` knob.

## Assets
En `reference/assets/`: `logo-horizontal.png` (topbar), `membership-lockup.png` (banda de
membresía), `mascota.png`, `fondo.jpg` (textura).

**Falta y bloquea paridad visual**: el **archivo de Franchise** (woff2). Sin él el mock cae a
Big Shoulders / Barlow Condensed y la tipografía no coincide. Súbelo y decláralo con `@font-face`.

## Files
- `reference/Checkout Redesign.dc.html` — todos los estados (`1a`–`2e`).
- `screenshots/` — captura de cada estado a 2x, para revisar sin abrir el HTML.
- `WORKFLOW.md` — orden de implementación y prompts para Claude Code.
- `CLAUDE.md` — reglas para pegar en el `CLAUDE.md` del repo.
