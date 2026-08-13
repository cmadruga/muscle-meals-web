export type DiscountType = 'percent' | 'fixed' | 'free_shipping'
export type DiscountCondition = 'always' | 'first_order' | 'streak' | 'cumulative_orders'

export type Discount = {
  id: string
  name: string
  code: string | null
  type: DiscountType
  value: number
  condition_type: DiscountCondition
  condition_value: number | null
  min_items: number | null
  min_amount: number | null  // centavos
  valid_days: number[] | null
  active: boolean
  starts_at: string | null
  expires_at: string | null
  created_at: string
  total_uses: number
}

export type ValidatedDiscount = {
  id: string
  type: DiscountType
  value: number
  discountAmount: number  // centavos
  label: string
  name: string            // display name without type suffix
}
