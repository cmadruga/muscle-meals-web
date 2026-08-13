/** Genera el referral_code a partir del email: parte antes del @, solo alfanumérico, minúsculas */
export function buildReferralCode(email: string): string {
  return email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase()
}
