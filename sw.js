/* Survey Atlas — keeps the app on the phone so it opens with no connection.
   Every file is answered from the phone first; when there is a connection the
   newest version is fetched quietly in the background and used next launch. */
const CACHE='survey-atlas-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const rq=e.request;
  if(rq.method!=='GET'||rq.url.startsWith('data:')||rq.url.startsWith('blob:')) return;
  const nav=rq.mode==='navigate';
  const key=nav?'./index.html':rq;
  const fresh=caches.open(CACHE).then(c=>fetch(rq).then(r=>{
    if(r&&(r.ok||r.type==='opaque')) c.put(key,r.clone());
    return r;
  })).catch(()=>null);
  e.waitUntil(fresh.then(()=>{}));
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(key,{ignoreSearch:true});
    if(hit) return hit;
    const r=await fresh;
    return r||Response.error();
  }));
});
