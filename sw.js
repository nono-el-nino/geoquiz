// Cache hors-ligne : l'app fonctionne sans réseau après la première visite.
const CACHE = 'migo-v1';
const FILES = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/game.js', 'js/data.js', 'js/mascot.js', 'js/presentation.js', 'js/icons.js', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest', 'fonts/Gabarito.ttf', 'fonts/DMMono-Regular.ttf', 'fonts/DMMono-Medium.ttf', 'flags/dz.svg', 'flags/ao.svg', 'flags/bj.svg', 'flags/bw.svg', 'flags/bf.svg', 'flags/bi.svg', 'flags/cv.svg', 'flags/cm.svg', 'flags/cf.svg', 'flags/td.svg', 'flags/km.svg', 'flags/cg.svg', 'flags/cd.svg', 'flags/ci.svg', 'flags/dj.svg', 'flags/eg.svg', 'flags/gq.svg', 'flags/er.svg', 'flags/sz.svg', 'flags/et.svg', 'flags/ga.svg', 'flags/gm.svg', 'flags/gh.svg', 'flags/gn.svg', 'flags/gw.svg', 'flags/ke.svg', 'flags/ls.svg', 'flags/lr.svg', 'flags/ly.svg', 'flags/mg.svg', 'flags/mw.svg', 'flags/ml.svg', 'flags/mr.svg', 'flags/mu.svg', 'flags/ma.svg', 'flags/mz.svg', 'flags/na.svg', 'flags/ne.svg', 'flags/ng.svg', 'flags/rw.svg', 'flags/st.svg', 'flags/sn.svg', 'flags/sc.svg', 'flags/sl.svg', 'flags/so.svg', 'flags/za.svg', 'flags/ss.svg', 'flags/sd.svg', 'flags/tz.svg', 'flags/tg.svg', 'flags/tn.svg', 'flags/ug.svg', 'flags/zm.svg', 'flags/zw.svg', 'flags/al.svg', 'flags/ad.svg', 'flags/at.svg', 'flags/by.svg', 'flags/be.svg', 'flags/ba.svg', 'flags/bg.svg', 'flags/hr.svg', 'flags/cy.svg', 'flags/cz.svg', 'flags/dk.svg', 'flags/ee.svg', 'flags/fi.svg', 'flags/fr.svg', 'flags/de.svg', 'flags/gr.svg', 'flags/hu.svg', 'flags/is.svg', 'flags/ie.svg', 'flags/it.svg', 'flags/lv.svg', 'flags/li.svg', 'flags/lt.svg', 'flags/lu.svg', 'flags/mt.svg', 'flags/md.svg', 'flags/mc.svg', 'flags/me.svg', 'flags/nl.svg', 'flags/mk.svg', 'flags/no.svg', 'flags/pl.svg', 'flags/pt.svg', 'flags/ro.svg', 'flags/ru.svg', 'flags/sm.svg', 'flags/rs.svg', 'flags/sk.svg', 'flags/si.svg', 'flags/es.svg', 'flags/se.svg', 'flags/ch.svg', 'flags/ua.svg', 'flags/gb.svg', 'flags/af.svg', 'flags/am.svg', 'flags/az.svg', 'flags/bh.svg', 'flags/bd.svg', 'flags/bt.svg', 'flags/bn.svg', 'flags/kh.svg', 'flags/cn.svg', 'flags/ge.svg', 'flags/in.svg', 'flags/id.svg', 'flags/ir.svg', 'flags/iq.svg', 'flags/il.svg', 'flags/jp.svg', 'flags/jo.svg', 'flags/kz.svg', 'flags/kw.svg', 'flags/kg.svg', 'flags/la.svg', 'flags/lb.svg', 'flags/my.svg', 'flags/mv.svg', 'flags/mn.svg', 'flags/mm.svg', 'flags/np.svg', 'flags/kp.svg', 'flags/om.svg', 'flags/pk.svg', 'flags/ph.svg', 'flags/qa.svg', 'flags/sa.svg', 'flags/sg.svg', 'flags/kr.svg', 'flags/lk.svg', 'flags/sy.svg', 'flags/tj.svg', 'flags/th.svg', 'flags/tl.svg', 'flags/tr.svg', 'flags/tm.svg', 'flags/ae.svg', 'flags/uz.svg', 'flags/vn.svg', 'flags/ye.svg', 'flags/ag.svg', 'flags/bs.svg', 'flags/bb.svg', 'flags/bz.svg', 'flags/ca.svg', 'flags/cr.svg', 'flags/cu.svg', 'flags/dm.svg', 'flags/do.svg', 'flags/sv.svg', 'flags/gd.svg', 'flags/gt.svg', 'flags/ht.svg', 'flags/hn.svg', 'flags/jm.svg', 'flags/mx.svg', 'flags/ni.svg', 'flags/pa.svg', 'flags/kn.svg', 'flags/lc.svg', 'flags/vc.svg', 'flags/tt.svg', 'flags/us.svg', 'flags/ar.svg', 'flags/bo.svg', 'flags/br.svg', 'flags/cl.svg', 'flags/co.svg', 'flags/ec.svg', 'flags/gy.svg', 'flags/py.svg', 'flags/pe.svg', 'flags/sr.svg', 'flags/uy.svg', 'flags/ve.svg', 'flags/au.svg', 'flags/fj.svg', 'flags/ki.svg', 'flags/mh.svg', 'flags/fm.svg', 'flags/nr.svg', 'flags/nz.svg', 'flags/pw.svg', 'flags/pg.svg', 'flags/ws.svg', 'flags/sb.svg', 'flags/to.svg', 'flags/tv.svg', 'flags/vu.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Réseau d'abord (pour recevoir les mises à jour), cache en secours.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
