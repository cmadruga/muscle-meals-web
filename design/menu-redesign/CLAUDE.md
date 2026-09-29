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
