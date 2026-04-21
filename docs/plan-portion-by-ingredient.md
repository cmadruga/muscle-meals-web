# Plan: Porciones por ingrediente en sizes

## Concepto
`sizes.protein_qty` y `sizes.carb_qty` dejan de ser un número entero y pasan a ser un JSONB.
El key es el `ingredient_id` (UUID), con un key especial `"default"` como fallback.
`veg_qty` se mantiene como INTEGER (verdura es general).

### Formato JSONB
```json
// sizes.protein_qty
{ "default": 120, "uuid-pollo": 120, "uuid-res": 140, "uuid-cerdo": 130 }

// sizes.carb_qty
{ "default": 55, "uuid-arroz": 55, "uuid-pasta": 70, "uuid-papa": 300 }
```

### Lookup (prioridad)
1. `sizeJson[ingredient.id]` — match exacto
2. `sizeJson["default"]`    — fallback
3. `0`                      — no debería ocurrir

---

## SQL a correr manualmente (antes de implementar)
```sql
-- Convertir protein_qty y carb_qty de INTEGER a JSONB con key "default"
ALTER TABLE sizes
  ALTER COLUMN protein_qty TYPE JSONB
    USING json_build_object('default', protein_qty),
  ALTER COLUMN carb_qty TYPE JSONB
    USING json_build_object('default', carb_qty);
```

Después de correr el SQL, todos los sizes existentes quedan con `{"default": valor_actual}`.
Los ingredientes existentes con type=pro/carb no tienen entry específico aún — caen al `default`.

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/lib/types/size.ts` | `protein_qty: Record<string, number>`, `carb_qty: Record<string, number>` |
| `src/lib/utils/macros.ts` | `resolveQty(json, ingredientId)` en lugar de `size.protein_qty` directo |
| `src/lib/utils/production.ts` | Mismo lookup en `computeMealTotals` |
| `src/lib/utils/pricing.ts` | Usar `protein_qty["default"]` y `carb_qty["default"]` + TODO comment |
| `src/app/admin/database/IngredientModal.tsx` | Si type=pro/carb: mostrar inputs de qty por size main al crear/editar |
| `src/app/actions/database.ts` | Al guardar ingrediente: update JSONB de sizes con el nuevo entry |
| `src/components/CustomSizePanel.tsx` | Sliders siguen igual, guardan en `{"default": valor}` |
| Cualquier display de `size.protein_qty` como número | Usar `size.protein_qty["default"]` para mostrar |

---

## Detalle por archivo

### 1. `src/lib/types/size.ts`
```ts
export interface Size {
  // ...campos actuales...
  protein_qty: Record<string, number>  // { "default": 120, "uuid-pollo": 120, ... }
  carb_qty:    Record<string, number>  // { "default": 55, "uuid-papa": 300, ... }
  veg_qty:     number                  // sin cambio
}
```

### 2. `src/lib/utils/macros.ts`
```ts
function resolveQty(qtyJson: Record<string, number>, ingredientId: string): number {
  return qtyJson[ingredientId] ?? qtyJson['default'] ?? 0
}

// En calculateMealMacros, reemplazar:
// if (ingredient.type === 'pro') qty = size.protein_qty
// Por:
if (ingredient.type === 'pro') qty = resolveQty(size.protein_qty, ingredient.id)
else if (ingredient.type === 'carb') qty = resolveQty(size.carb_qty, ingredient.id)
else if (ingredient.type === 'veg') qty = size.veg_qty
```

### 3. `src/lib/utils/production.ts`
Mismo `resolveQty` al calcular `qtyPerPortion` en `computeMealTotals`.
Necesita acceso al `ingredientId` al momento del lookup (ya está disponible en `ingredientsMap`).

### 4. `src/lib/utils/pricing.ts`
```ts
// TODO: cuando protein_qty y carb_qty son JSON por ingrediente,
// el precio de custom sizes debería calcularse con el ingrediente real de la receta,
// no con un valor genérico. Por ahora se usa "default" como proxy.
export function calculateCustomSizePrice(
  proteinQty: number,  // pasar protein_qty["default"]
  carbQty: number,     // pasar carb_qty["default"]
  vegQty: number,
): { price: number; packagePrice: number }
// Sin cambio en lógica interna, solo en cómo se llama desde fuera.
```

### 5. `src/app/admin/database/IngredientModal.tsx`
Al crear/editar ingrediente con type=`pro` o type=`carb`:
- Mostrar sección "Porción por tamaño"
- 3 inputs numéricos: LOW / FIT / PLUS (solo sizes `is_main=true`)
- Se pre-llenan con el valor actual del JSON si ya existe
- Si se dejan vacíos → no se toca el entry del JSON (queda en `default`)

### 6. `src/app/actions/database.ts` — `createIngredient` / `updateIngredient`
Cuando type=pro o carb y vienen qty por size:
```ts
// Para cada size main con qty especificada:
await supabase.rpc('jsonb_set_key', {
  table: 'sizes',
  id: sizeId,
  column: type === 'pro' ? 'protein_qty' : 'carb_qty',
  key: ingredientId,
  value: qty
})
// O más simple: fetch size, merge JSON, update.
```

Patrón concreto (sin RPC):
```ts
const { data: size } = await supabase.from('sizes').select('id, protein_qty').eq('id', sizeId).single()
const updated = { ...size.protein_qty, [ingredientId]: qty }
await supabase.from('sizes').update({ protein_qty: updated }).eq('id', sizeId)
```

### 7. `src/components/CustomSizePanel.tsx`
Sin cambio en los sliders (siguen siendo pro/carb/veg en gramos).
Al guardar, el size custom se crea con:
```ts
protein_qty: { default: proteinSliderValue }
carb_qty:    { default: carbSliderValue }
veg_qty:     vegSliderValue  // sin cambio
```

---

## Equivalencia papa (TODO)
```ts
// TODO: Papa (y otros carbos densos) tienen una "equivalencia calórica" diferente
// al arroz/pasta. 300g papa ≈ 55g arroz en macros (~200 kcal, ~45g carbs).
// En el futuro, el precio de un custom size debería usar el ingrediente real
// de la receta seleccionada para calcular el tier correcto.
// Por ahora se usa carb_qty["default"] para pricing.
```

---

## Impacto en plan existente: Recetario / vessel config
El plan `ancient-churning-giraffe.md` agrega `vessel_config` a recipes y usa
`MealIngredientRow` en producción. Este cambio modifica `production.ts` en el
mismo lugar (lookup de qty). Al implementar ambos, asegurarse de que
`resolveQty(size.carb_qty, ingredientId)` se usa en el mismo lugar donde
vessel config hace su split. Sin conflicto de arquitectura, solo cuidar el orden.

---

## Verificación
1. Correr SQL de migración
2. Build sin errores TypeScript
3. En `/meal/[id]` con Pasta (arroz como carb): macros igual que antes (usa `default`)
4. Agregar ingrediente "Papa" type=carb → asignar FIT=300g → guardar
5. Receta con papa FIT → macros calculan con 300g, no con `default`
6. Custom size: sliders funcionan igual, size se crea con `{"default": valor}`
7. Pricing de custom size: sin cambio visible
