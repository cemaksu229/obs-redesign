// Sistem bildirimleri (telefon ve masaüstü).
// Android'de sayfa içinden `new Notification` çalışmadığı için önce service worker üzerinden gösterilir.

export function notificationSupport() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

export async function requestNotifications() {
  if (notificationSupport() === 'unsupported') return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export async function sendNotification(title, body, { tag = 'pusula', url = './#/onden-secim' } = {}) {
  if (notificationSupport() !== 'granted') return false
  const options = { body, tag, icon: './pwa-192.png', badge: './pwa-192.png', data: { url }, renotify: true }
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null
    if (reg) {
      await reg.showNotification(title, options)
      return true
    }
    const n = new Notification(title, options)
    n.onclick = () => { window.focus(); window.location.hash = '#/onden-secim'; n.close() }
    return true
  } catch {
    return false
  }
}
