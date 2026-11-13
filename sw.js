/* Funcționare fără internet: păstrează fișierele aplicației în cache. */
const CACHE = 'caiet-ixe-v4';
const FILES = ['./', 'index.html', 'css/style.css', 'js/data.js', 'js/app.js', 'img/rover.png', 'img/coperta.jpg', 'img/icon.svg', 'manifest.webmanifest', 'img/conectori/explodat.png', 'img/conectori/fisa34.png', 'img/conectori/fisa35.png', 'img/conectori/fisa37.png',
  ...['01','02','03','04','05','06','07','08','10','11','12','13','14','15','16','17','20','21','22','23','24','25','26','27','28','29','30','31','32','33'].map(n => `img/piese/${n}.png`)];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // rețeaua întâi (ca actualizările de pe GitHub să apară), cache-ul dacă nu e internet
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
