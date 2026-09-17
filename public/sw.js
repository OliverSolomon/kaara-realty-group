/*
 * Retired service worker.
 *
 * An earlier version cached homepage videos. It answered every video request
 * with a full cached file, which iPhones reject (Safari needs byte-range
 * responses), and it could keep serving stale files after a deploy.
 *
 * Browsers that still have it installed fetch this file on their next visit.
 * It clears the old caches, unregisters itself and reloads open tabs once so
 * they are served straight from the network again.
 */
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((client) => client.navigate(client.url))
    })()
  )
})
