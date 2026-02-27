import { createClient } from '@/lib/supabase/server'

export interface PickupSpot {
  id: string
  name: string
  address: string
  schedule: string
  zone: string
}

export async function getActivePickupSpots(): Promise<PickupSpot[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pickup_spots')
    .select('id, name, address, schedule, zone')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching pickup spots:', error)
    return []
  }

  return data as PickupSpot[]
}
