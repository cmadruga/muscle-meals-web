import { getWaConversations } from '@/lib/db/whatsapp'
import InboxClient from './InboxClient'

export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  const conversations = await getWaConversations()
  return <InboxClient initial={conversations} />
}
