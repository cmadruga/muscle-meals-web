self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  const title = data.title ?? 'Muscle Meals'
  const options = {
    body: data.body ?? '',
    icon: '/media/icon-192.png',
    badge: '/media/icon-192.png',
    tag: data.tag ?? 'wa-inbox',
    renotify: true,
    data: { url: data.url ?? '/admin/inbox' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data?.url ?? '/admin/inbox'
  const url = self.location.origin + path
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes('/admin/inbox') && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
