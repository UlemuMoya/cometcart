// Cometcart's service worker: shows price-drop notifications and opens the
// product when one is tapped. It doesn't cache pages or work offline.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/app-icon/192",
      tag: data.tag,
      data: { url: data.url || "/wishlist" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data.url, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((open) => {
      const same = open.find((c) => c.url === url);
      return same ? same.focus() : self.clients.openWindow(url);
    }),
  );
});
