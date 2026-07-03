/*
 * سرویس‌ورکرِ نودوست (PWA).
 * وجودِ یک handler برای رویدادِ fetch شرطِ لازمِ «قابلِ نصب بودن» در کروم است.
 * راهبرد: پیمایش‌ها network-first (تازه بمانند)، داراییِ hash‌دارِ _expo cache-first.
 * نکته: دیتای API هرگز cache نمی‌شود تا کاربر همیشه داده‌ی زنده ببیند.
 */
const CACHE = 'nodoost-shell-v1';
const SHELL = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isApiRequest(url) {
  // درخواست‌های API/آپلود را دست‌نخورده رد کن (network-only، بدونِ cache).
  return url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // فقط‌ same-origin
  if (isApiRequest(url)) return;

  // داراییِ ساخته‌شده با hash در نام → cache-first (تغییرناپذیر).
  if (url.pathname.startsWith('/_expo/') || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }))
    );
    return;
  }

  // پیمایشِ صفحات → network-first با fallback به cache/خانه (رفتارِ SPA آفلاین).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  // بقیه → network با fallback به cache.
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
