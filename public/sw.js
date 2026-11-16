const V='mb-v11-stage1-20261116';const B='/mrbrain-invest/';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll([B,B+'data/index.json',B+'data/news.json',B+'data/qa.json',B+'data/books.json',B+'data/knowledge.json',B+'data/coverage.json',B+'data/chapters/index.json',...['u1l1','u1l2','u1l3','u1l4','u1l5','u1l6','u1l7','B4'].map(id=>B+'data/chapters/'+id+'.json'),...Array.from({length:13},(_,i)=>B+'data/U'+(i+1)+'.json'),B+'manifest.webmanifest'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('mb-')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 const isData=u.pathname.includes('/data/')||r.mode==='navigate';
 if(isData){e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c));}return res}).catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match(B):new Response('Offline data unavailable',{status:503})))));}
 else e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c));}return res})));});
