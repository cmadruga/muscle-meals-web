# Cómo iterar sin perder fidelidad

El problema típico no es que falte información, es que la referencia se traduce a prosa y la
prosa se interpreta. Cuatro reglas que lo evitan:

## 1. Mete este folder en el repo
Cópialo a `design/menu-redesign/` y comitéalo. Así la referencia HTML vive junto al código y
se puede leer y volver a abrir en cualquier sesión, no solo en el chat donde se creó.
**Todos los estilos del mockup son inline: el HTML es la fuente de verdad de medidas y colores.**
Pídele siempre que lea el HTML, no que confíe en el README.

## 2. Pega `CLAUDE.md` en el repo
Las reglas que se rompen solas (tokens, Franchise sin acentos, "no es modal", umbral de 5)
tienen que estar en el `CLAUDE.md` del proyecto, no en un prompt que se olvida al siguiente turno.

## 3. Una pantalla por sesión, con comparación visual
No pidas "implementa /menu". Pide un estado a la vez, en este orden:
`1a` (vacío) → `1b` (1–4) → `1c` (≥5) → `2a` (personalizado) → `1d` (móvil).
Y cierra cada uno así:

> Abre `design/menu-redesign/reference/Menu Redesign.dc.html` y localiza el bloque con id
> `1a`. Implementa ese estado. Cuando termines, toma screenshot de tu implementación a 1280px
> de ancho, ponlo junto al bloque de referencia y **lista las diferencias que encuentres en
> tipografía, espaciado y color antes de decir que está listo.**

Con un MCP de navegador (Playwright/Puppeteer) esa comparación la puede hacer solo, y ahí es
donde se cierra la brecha de fidelidad.

## 4. Cuando algo no cuadre, regrésamelo
Si sale distinto, mándame el screenshot de lo implementado: yo lo comparo contra el mockup y te
digo exactamente qué valor cambió (o corrijo el mockup si el diseño no era implementable).
Es más rápido que describirlo en palabras.

## Prompt inicial sugerido

> Lee `design/menu-redesign/README.md` y `design/menu-redesign/menu-spec.md` completos, y abre
> `design/menu-redesign/reference/Menu Redesign.dc.html` en el navegador.
> El HTML es una **referencia de diseño**, no código para copiar: recréalo con los componentes y
> patrones de este repo. Todos sus estilos son inline, úsalos como valores exactos.
> No implementes nada todavía: primero dime en qué archivos de este repo vive hoy `/menu`,
> `/package` y `/meal/:id`, cómo está modelado el carrito, y cuál es tu plan de implementación
> por estado (`1a` → `1b` → `1c` → `2a` → `1d`). Empezamos por `1a`.
