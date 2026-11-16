const V='mb-v15-review-20261116';const B='/mrbrain-invest/';
self.addEventListener('install',e=>{e.waitUntil((async()=>{
 const response=await fetch(B+'data/chapters/index.json',{cache:'reload'});
 if(!response.ok)throw new Error('Chapter catalog unavailable; keep previous offline version');
 const catalog=await response.json();
 const assets=[B,...['index','news','qa','books','knowledge','coverage'].map(id=>B+'data/'+id+'.json'),B+'data/chapters/index.json',...catalog.chapters.map(c=>B+'data/chapters/'+c.id+'.json'),...Array.from({length:13},(_,i)=>B+'data/U'+(i+1)+'.json'),B+'manifest.webmanifest'];
 await (await caches.open(V)).addAll(assets);
 await self.skipWaiting();
})())});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('mb-')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 const isData=u.pathname.includes('/data/')||r.mode==='navigate';
 if(isData){e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c));}return res}).catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match(B):new Response('Offline data unavailable',{status:503})))));}
 else e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c));}return res})));});
