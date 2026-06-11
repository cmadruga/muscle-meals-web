declare global {
  interface Window {
    fbq: (action: string, event: string, params?: Record<string, unknown>) => void
  }
}

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

export function fbEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', name, params)
  }
}

export function trackInitiateCheckout(value: number, numItems: number) {
  fbEvent('InitiateCheckout', {
    value: value / 100,     // centavos → pesos
    currency: 'MXN',
    num_items: numItems,
  })
}

export function trackPurchase(value: number, orderId: string) {
  fbEvent('Purchase', {
    value: value / 100,
    currency: 'MXN',
    content_type: 'product',
    order_id: orderId,
  })
}
