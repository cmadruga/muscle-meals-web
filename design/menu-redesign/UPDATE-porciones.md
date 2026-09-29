# Actualización: selector de tamaño + porciones + modal de info

> Cambio incremental sobre `design/menu-redesign/`. Lee primero el `README.md` de esa carpeta.
> Referencia visual: `5a`, `5b`, `5c` (selector + porciones) y `3a`, `3b` (modal) en
> `reference/Menu Redesign.dc.html`. **Ignora los bloques `4a` y `4b`: fueron exploración.**

Sustituye por completo lo que el README dice del bloque de porciones y de las cards de tamaño.

---

## 1. Cards de tamaño — solo el nombre

Hoy cada card lleva nombre + resumen de gramos + precio. Ese resumen y ese precio ahora viven
en el bloque de porciones que está justo debajo, así que en la card **duplicaban información**
y forzaban cards grandes que con 6-7 tamaños ocupaban dos filas altas.

**La card queda con el nombre y nada más.**

- Grid: `display:grid; grid-template-columns:repeat(auto-fit,minmax(158px,1fr)); gap:10px`
  (móvil `minmax(96px,1fr); gap:8px`). Reflow automático según el ancho — **sin scroll
  horizontal en ningún breakpoint** y sin cuentas de cuántas caben por fila.
- Card: `padding:16px 15px` (móvil `13px 12px`), `radius:11px` (móvil `10px`),
  `position:relative` para el badge.
  - Inactiva: `border:1px solid rgba(255,255,255,.12)`, `background:rgba(255,255,255,.03)`;
    hover `background:rgba(255,255,255,.06)`.
  - Activa: `border:1px solid #F79138`, `background:rgba(247,145,56,.1)`, nombre en `#F79138`.
- Nombre: Franchise 700 **26px** desktop / **21px** móvil, uppercase, `#F5F1EC`.
- Card `+ Personalizado` (`+ Nuevo` en móvil) al final:
  `border:1px dashed rgba(255,255,255,.22)`, fondo transparente, hover `border-color:#F79138`,
  nombre Franchise 700 22px (móvil 18px) `rgba(245,241,236,.8)`.

**Badges** (`position:absolute; top:-8px; right:11px`, móvil `top:-7px; right:9px`;
`padding:3px 7px`, `radius:4px`, Barlow 700 9.5px `letter-spacing:.1em` uppercase):
- `★ El más pedido` en el tamaño destacado: `background:#F79138`, texto `#17140f`,
  Barlow 700 10px `letter-spacing:.06em`. En móvil, donde no cabe, **solo la estrella `★`**.
- `Custom` en cada tamaño personalizado: `background:rgba(255,255,255,.14)`, texto
  `rgba(245,241,236,.75)`; cuando ese tamaño está **activo**, `background:rgba(247,145,56,.9)`
  y texto `#17140f`.

Los tamaños personalizados **son cards normales del mismo grid**, en el mismo orden que los
base (base primero, luego los del usuario por fecha de creación, luego `+ Personalizado`).
Se seleccionan con un clic como cualquier otro.

## 2. Bloque de porciones

Debajo del grid, siempre visible, describe **el tamaño activo**.

**Encabezado**: `Porciones de <NOMBRE>` en Franchise 700 13px (móvil 11.5px)
`letter-spacing:.16em` uppercase `rgba(245,241,236,.55)`. Si el tamaño activo es
personalizado, a su derecha van `Editar` y `Eliminar` (§3). En un tamaño base no aparece
ningún botón.

**Columnas**: `grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:10px;
align-items:start` (móvil `minmax(150px,1fr); gap:8px`). Orden fijo: Proteína, Carbo, Verdura.
`align-items:start` es obligatorio — las columnas tienen alturas distintas y **no** deben
estirarse a la más alta.

**Móvil mantiene las tres columnas**, no las apila: a 390px `minmax(104px,1fr)` deja tres
columnas de ~112px y los nombres largos envuelven a dos líneas. Verdura es una columna corta
como las demás.

Cada columna: `border:1px solid rgba(255,255,255,.1)`, `radius:11px` (móvil `10px`),
`background:rgba(255,255,255,.03)`, `padding:13px 15px 11px` (móvil `11px 12px 9px`).
Label: Franchise 700 11.5px (móvil 10.5px) `letter-spacing:.16em` (móvil `.14em`) uppercase,
color del grupo — Proteína `#F79138` · Carbo `#e8c07d` · Verdura `#7ac77a`.

### Proteína y Carbo — siempre por ingrediente
Una fila por ingrediente, **aunque todos pesen lo mismo**. Es la información que el usuario
necesita al elegir platillo y es donde un tamaño personalizado puede tener valores distintos.

Desktop: `display:flex; align-items:baseline; justify-content:space-between; gap:10px;
padding:5px 0` (la primera fila lleva `margin-top:10px`). Nombre Barlow 400 12.5px
`rgba(245,241,236,.62)`; gramaje `flex:none` Barlow 700 16px `#F5F1EC`.
Móvil: por el ancho de columna el nombre va **arriba** (Barlow 400 11.5px) y el gramaje
**debajo** (Barlow 700 15px `#F5F1EC`), no en la misma línea.

### Verdura — un solo número
Sin desglose por ingrediente y **sin glosa tipo "para todas las verduras"**: solo el valor,
Franchise 700 26px (móvil 21px) `#F5F1EC` con la `g` en Barlow 600 13px (móvil 11px)
`rgba(245,241,236,.5)`, `margin-top:10px; padding:5px 0`.
En móvil la columna de verdura ocupa `grid-column:1/-1` y se vuelve una fila horizontal
(label y número en línea, `align-items:baseline; gap:12px`) para no dejar una columna casi vacía.

> **No hay estado "default" ni chip punteado ni alerta.** Todas las porciones se pintan igual.
> Si un tamaño personalizado no configuró un ingrediente, se muestra su valor efectivo tal cual,
> sin marca. **Elimina el bloque de alerta amarilla actual.**

### Precio — manda el de paquete
Última fila del bloque, `margin-top:12px; padding-top:12px;
border-top:1px solid rgba(255,255,255,.08)` (móvil `11px`), `justify-content:space-between`.

El precio de paquete es el protagonista: a la izquierda `$165` Franchise 700 **30px**
(móvil 26px) `#7ac77a` + `en paquete desde 5` (móvil `en paquete`) Barlow 600 13px
(móvil 12px) `#7ac77a`. El unitario queda como referencia secundaria a la derecha:
`$170 c/u si llevas menos` (móvil `$170 c/u menos de 5`) Barlow 400 13px (móvil 12px)
`rgba(245,241,236,.45)`.

**El precio ya no aparece en las cards de tamaño**, ni en web ni en móvil.

## 3. Editar y Eliminar (solo tamaños personalizados)

Ambos junto al encabezado del bloque de porciones, `padding:6px 11px` (móvil `7px 10px`),
`border:1px solid rgba(255,255,255,.14)`, `radius:7px`, fondo transparente, Barlow 500 12px
(móvil 11.5px).
- `Editar` — texto `rgba(245,241,236,.75)`; hover `border-color:#F79138`, texto `#F5F1EC`.
- `Eliminar` — texto `rgba(245,241,236,.5)`; hover `border-color:rgba(255,120,120,.5)`,
  texto `#ff9b9b`.

**`Editar` no es cómo se cambia de tamaño** — para eso están las cards. `Editar` abre el panel
de tamaño personalizado (`2a` desktop / `2b` móvil) **en línea y precargado** con los valores
del tamaño activo: es exactamente el mismo panel de creación, solo con datos ya puestos.
No hay una vista de edición aparte.

Comportamiento de `Editar` pendiente de definir con producto: **guardar sobre el tamaño
existente vs. crear uno nuevo**. Implementa el botón y el panel precargado; deja la decisión de
guardado tras una función clara (`saveCustomSize(id | null)`) para poder cambiarla sin tocar UI.

`Eliminar` pide confirmación. Si el tamaño borrado era el activo, cae a FIT. Si hay líneas en
el carrito con ese tamaño, **se conservan** con el nombre y los precios que tenían al agregarse.

## 4. Modal "Que son las porciones" (`3a` desktop / `3b` móvil)

Sin cambios respecto al doc anterior. Resumen:

- **Disparador**: en desktop, botón `i · Que son las porciones` a la derecha del label
  `1 · Tu tamaño` (`padding:7px 11px`, `border:1px solid rgba(255,255,255,.12)`, `radius:8px`,
  `background:rgba(255,255,255,.03)`, Barlow 500 12.5px `rgba(245,241,236,.7)`, icono círculo
  de 16px; hover `border-color:#F79138`). En móvil, botón `i Porciones` de ≥44px en la misma
  línea que `1 · Tu tamaño`. La barra compacta sticky lleva el mismo botón al final.
- Contenido **estático**: no depende del tamaño activo, no muestra gramos, no cambia al cambiar
  de tamaño, no tiene más acción que cerrar.
- Intro de una frase + un bloque por categoría (nombre en el color del grupo, nota
  `Se pesa en crudo`, descripción, e ingredientes de esa categoría como chips) + nota naranja
  final `Todo se pesa en crudo`.
- Desktop: modal `640px`, `max-height:600px`, `radius:14px`, `background:#14110f`, backdrop
  `rgba(8,7,6,.78)`, cuerpo scrolleable, footer `Entendido`. Cierra con `×`, botón, backdrop, `Esc`.
- Móvil: bottom sheet con handle `38×4`, `Entendido` a ancho completo abajo.
- ⚠️ **Todo el copy del modal es genérico y está por definir.** Ponlo en una constante editable.

## 5. Modelo de datos

```ts
type PortionCategory = 'protein' | 'carb' | 'veggie';

type Size = {
  id: string;
  name: string;
  isCustom: boolean;
  isFeatured: boolean;          // badge "El más pedido"
  unitPrice: number;
  packagePrice: number;
  portions: {
    category: PortionCategory;
    ingredients: { id: string; name: string; grams: number }[];
  }[];
};
```

Verdura trae un solo valor efectivo; si el modelo la guarda por ingrediente, la UI muestra
únicamente el valor (todos son iguales por definición de negocio).
El modal usa un catálogo aparte: `{ category, description, weighedRaw: true, ingredients[] }`.

## 6. Checklist

1. Cards de tamaño reducidas a nombre + badge; grid `auto-fit`, sin scroll horizontal.
2. Personalizados como cards normales con badge `Tuyo`, seleccionables con un clic.
3. Bloque de porciones: Proteína y Carbo siempre por ingrediente, Verdura un solo número.
4. Precio movido de las cards al pie del bloque de porciones.
5. `Editar` / `Eliminar` solo con un personalizado activo; `Editar` abre `2a`/`2b` precargado.
6. Borrar el bloque de alerta amarilla y cualquier tratamiento especial de "default".
7. Botón de info en desktop, móvil y barra sticky + modal / bottom sheet con copy editable.
8. Probar con 3, 5 y 8 tamaños, y a 1440 / 1280 / 768 / 390px: el grid debe reacomodarse solo.
9. Screenshot a 1280px y 390px contra `5a`, `5b`, `5c`, `3a`, `3b`, y listar diferencias de
   tipografía, espaciado y color antes de dar por terminado.
