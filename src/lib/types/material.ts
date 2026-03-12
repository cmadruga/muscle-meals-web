/**
 * Material de empaque / insumo de cocina
 */
export interface Material {
  id: string
  name: string
  cant: number          // cantidad del pedido (lote de compra) — para calcular precio/und
  precio: number        // precio total del pedido
  cant_actual: number   // stock real en este momento
  stock_minimo: number
  resta_tipo: 'orden' | 'fija'
  resta_cant: number
  precio_por_unidad: number // generado: precio / cant
  proveedor: string | null
  created_at: string
  updated_at: string
}
