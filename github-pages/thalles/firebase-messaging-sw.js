// Recebe as notificações do alarme mesmo com o celular bloqueado ou o app fechado.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
importScripts('../firebase-config.js');

firebase.initializeApp(FIREBASE_CONFIG);

// O agendador manda só dados (sem "notification"), para este arquivo montar o aviso:
// fica na tela até ele tocar, vibra e reabre o app, que toca o alarme contínuo.
firebase.messaging().onBackgroundMessage(function (msg) {
  var d = msg.data || {};
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    cs.forEach(function (c) { c.postMessage({ tipo: 'alarme', qual: d.qual }); });
  });
  return self.registration.showNotification(d.titulo || 'Hora da demanda', {
    body: d.corpo || 'Abra para desligar o alarme.',
    tag: 'alarme-' + (d.qual || ''),
    renotify: true,
    requireInteraction: true,
    vibrate: [600, 200, 600, 200, 600, 200, 600],
    icon: 'icon-192.png',
    badge: 'icon-192.png'
  });
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) if ('focus' in cs[i]) return cs[i].focus();
    return self.clients.openWindow('./');
  }));
});
