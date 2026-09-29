# Cómo implementar esto con Claude Code

## 1. Mete este folder en el repo
```bash
cd ~/ruta/a/tu-repo
mkdir -p design
unzip ~/Downloads/design_handoff_checkout.zip -d design/
mv design/design_handoff_checkout design/checkout-redesign
cat design/checkout-redesign/CLAUDE.md >> CLAUDE.md
git add design/checkout-redesign CLAUDE.md
git commit -m "Add /checkout redesign design reference"
```

La referencia vive junto al código y se puede reabrir en cualquier sesión, no solo en el chat
donde se creó. **Todos los estilos del mock son inline: el HTML es la fuente de verdad.**

## 2. Prompt inicial (pégalo tal cual)

> Lee `design/checkout-redesign/README.md` completo — en especial la sección
> «Cómo se combinan los bloques» — y abre
> `design/checkout-redesign/reference/Checkout Redesign.dc.html` en el navegador.
>
> Es una **referencia de diseño**, no código para copiar: recréala con los componentes y
> patrones de este repo. Sus estilos son inline, úsalos como valores exactos.
>
> Ojo con esto: los ids `1a`–`2e` NO son seis pantallas. Son la misma página en distintos
> estados, y `2b` es un fragmento (solo la sección 2). La matriz de estados del README dice
> cómo se combinan.
>
> No implementes nada todavía. Dime: en qué archivos vive hoy `/checkout` y `/cart`, cómo está
> modelado el carrito y la membresía, dónde está la lista de pickup spots y la validación de CP,
> y tu plan por pasos. Empezamos por el paso 1 de abajo.

## 3. Orden de implementación

Un paso por sesión. No pidas «implementa el checkout» de una.

1. **Estructura + `1a`** — topbar, H1, grid de dos columnas con sidebar sticky, y el resumen
   agrupado por tamaño. Sin membresía todavía. Es el 60% del trabajo visual.
2. **Envío** — las tres cards, el detalle del tipo activo, y `2a` (pickup: lista de spots +
   desaparece el bloque de dirección).
3. **Dirección** — radios, formulario de nueva dirección (`2b`), autocompletado de ciudad por
   CP, error de área, y los CTAs deshabilitados con su motivo.
4. **Membresía** — banda apagada/encendida, plazos 4/8/12, repricing de todo, y `1b`.
5. **Móvil** — `2c` como referencia de orden, más `2d` y `2e`. Barra fija y resumen colapsable.
6. **Limpieza** — eliminar `/cart`, redirigir a `/checkout`, actualizar links, y el chip de
   referidos (solo desktop).

## 4. Cierra cada paso con comparación visual

> Toma screenshot de tu implementación a 1280px y a 390px, ponlo junto al bloque de referencia
> correspondiente, y **lista las diferencias que encuentres en tipografía, espaciado y color
> antes de decir que está listo.**

Con un MCP de navegador esa comparación la hace solo:
```bash
claude mcp add playwright npx @playwright/mcp@latest
```
Ahí es donde se cierra la brecha de fidelidad.

## 5. Cuando algo no cuadre, regrésamelo
Mándame el screenshot de lo implementado: yo lo comparo contra el mock y te digo exactamente
qué valor cambió — o corrijo el mock si el diseño no era implementable. Es más rápido que
describirlo en palabras.
