/**
 * Servicio de validación de direcciones por código postal
 * Validación basada en prefijos de zona + blacklist de exclusiones
 * Simple, gratis, sin límites
 */

/**
 * Códigos postales excluidos por zona
 * INSTRUCCIONES: Agrega CPs específicos que NO quieras atender en cada zona
 */
const EXCLUDED_CPS_MONTERREY = new Set<string>([
  // Ejemplo: '64999' - si no entregas a cierta colonia
])

const EXCLUDED_CPS_SAN_PEDRO = new Set<string>([
  // Ejemplo: '66320' - zona fuera de cobertura
])

const EXCLUDED_CPS_SAN_NICOLAS = new Set<string>([
  // Ejemplo: '66499' - área industrial
])

const EXCLUDED_CPS_GUADALUPE = new Set<string>([
  // Ejemplo: '67199' - zona alejada
])

const EXCLUDED_CPS_SANTIAGO = new Set<string>([
  // Santiago entero excluido por defecto, puedes habilitar quitando todos los CPs
  // '67300', '67310', '67320', '67330', '67340', '67350'
])

const EXCLUDED_CPS_APODACA = new Set<string>([
  // Ejemplo: '66699' - parque industrial
])

const EXCLUDED_CPS_SANTA_CATARINA = new Set<string>([
  // Ejemplo: '66199' - zona montañosa
])

const EXCLUDED_CPS_ESCOBEDO = new Set<string>([
  // Ejemplo: '66099' - zona alejada
])

export interface Address {
  calle: string
  numeroExterior: string
  numeroInterior?: string
  colonia: string
  codigoPostal: string
  ciudad: string
  estado: string
}

/**
 * Valida que el código postal pertenezca a una zona válida
 * y no esté en la lista de exclusiones
 */
export function isValidPostalCode(cp: string): boolean {
  const normalized = cp.trim()
  
  // Monterrey (64xxx)
  if (normalized.startsWith('64')) {
    return !EXCLUDED_CPS_MONTERREY.has(normalized)
  }
  
  // San Pedro Garza García (662xx)
  if (normalized.startsWith('662')) {
    return !EXCLUDED_CPS_SAN_PEDRO.has(normalized)
  }
  
  // San Nicolás de los Garza (664xx)
  if (normalized.startsWith('664')) {
    return !EXCLUDED_CPS_SAN_NICOLAS.has(normalized)
  }
  
  // Guadalupe (671xx)
  if (normalized.startsWith('671')) {
    return !EXCLUDED_CPS_GUADALUPE.has(normalized)
  }
  
  // Santiago (673xx) - excluido por defecto
  if (normalized.startsWith('673')) {
    return !EXCLUDED_CPS_SANTIAGO.has(normalized)
  }
  
  // Apodaca (666xx)
  if (normalized.startsWith('666')) {
    return !EXCLUDED_CPS_APODACA.has(normalized)
  }
  
  // Santa Catarina (661xx)
  if (normalized.startsWith('661')) {
    return !EXCLUDED_CPS_SANTA_CATARINA.has(normalized)
  }
  
  // Escobedo (660xx)
  if (normalized.startsWith('660')) {
    return !EXCLUDED_CPS_ESCOBEDO.has(normalized)
  }
  
  // CP no pertenece a ninguna zona válida
  return false
}

/**
 * Obtener nombre de zona por código postal
 */
export function getZoneByPostalCode(cp: string): string {
  const normalized = cp.trim()
  
  if (normalized.startsWith('64')) return 'Monterrey'
  if (normalized.startsWith('662')) return 'San Pedro Garza García'
  if (normalized.startsWith('664')) return 'San Nicolás de los Garza'
  if (normalized.startsWith('671')) return 'Guadalupe'
  if (normalized.startsWith('673')) return 'Santiago'
  if (normalized.startsWith('666')) return 'Apodaca'
  if (normalized.startsWith('661')) return 'Santa Catarina'
  if (normalized.startsWith('660')) return 'Escobedo'
  
  return 'Área Metropolitana de Monterrey'
}

/**
 * Construye dirección completa en formato string
 */
export function buildFullAddress(address: Address): string {
  const parts = [
    address.calle,
    address.numeroExterior,
    address.numeroInterior ? `Int. ${address.numeroInterior}` : '',
    `Col. ${address.colonia}`,
    `C.P. ${address.codigoPostal}`,
    address.ciudad,
    address.estado,
    'México'
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Valida código postal mexicano (5 dígitos)
 */
export function validateCP(cp: string): boolean {
  return /^\d{5}$/.test(cp)
}

/**
 * Valida número de teléfono mexicano (10 dígitos)
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10
}

/**
 * Formatea número de teléfono mexicano a formato internacional para WhatsApp
 * 8112345678 -> +5218112345678
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return `+521${cleaned}`
}
