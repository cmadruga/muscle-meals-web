import { getAllMaterials } from '@/lib/db/materials'
import { colors } from '@/lib/theme'
import StockTable from './StockTable'

export default async function StockPage() {
  const materials = await getAllMaterials()

  const criticoCount = materials.filter(
    (m) => m.cant <= m.stock_minimo
  ).length

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ color: colors.white, fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
        Stock de Materiales
      </h1>
      <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 32 }}>
        {materials.length} materiales · <span style={{ color: criticoCount > 0 ? '#ef4444' : colors.textMuted }}>{criticoCount} crítico{criticoCount !== 1 ? 's' : ''}</span>
      </p>

      <StockTable materials={materials} />
    </div>
  )
}
