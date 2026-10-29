const V='mb-v7';const B='/mrbrain-invest/';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll([B,B+'data/index.json',B+'data/news.json',B+'data/qa.json',B+'manifest.webmanifest'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 const isData=u.pathname.includes('/data/')||r.mode==='navigate';
 if(isData){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res}).catch(()=>caches.match(r).then(m=>m||caches.match(B))));}
 else e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(r,c));return res})));});
