/**
 * Stacks de fuente del sitio — úsalos en inline styles vía F.display, F.body, F.cond.
 *
 * next/font expone las fuentes SOLO a través de variables CSS inyectadas en <html>:
 *   --font-display   → Big Shoulders Display 700/800  (titulares, botones, pills, cifras)
 *   --font-body      → Barlow 400–700                 (descripción, labels, precios)
 *   --font-condensed → Barlow Condensed 500–700       (badges, tabs, UI compacta)
 *
 * NUNCA usar el nombre literal ('Big Shoulders Display', 'Barlow') como primer valor
 * en font-family — next/font no lo expone así y el browser cae al sistema.
 */
export const F = {
  display:   `var(--font-display),sans-serif`,
  body:      `Barlow,system-ui,sans-serif`,
  cond:      `var(--font-display),'Barlow Condensed',sans-serif`,
} as const
