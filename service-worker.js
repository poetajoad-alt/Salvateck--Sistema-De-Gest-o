/* =========================================
   SALVATECK PWA
========================================= */

self.addEventListener("notificationclick", (event) => {
  event.stopImmediatePropagation();

  event.notification.close();

  const notificationUrl = event.notification.data?.url || "principal.html";

  const targetUrl = new URL(notificationUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(async (clientList) => {
        const existingClient = clientList.find((client) => {
          return new URL(client.url).origin === self.location.origin;
        });

        if (existingClient) {
          await existingClient.focus();

          if ("navigate" in existingClient) {
            await existingClient.navigate(targetUrl);
          }

          return;
        }

        await self.clients.openWindow(targetUrl);
      }),
  );
});

importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js",
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCzWVnlc7a8vY0KN8KxiZhYlqefPMzRY1o",
  authDomain: "salvateck-app.firebaseapp.com",
  projectId: "salvateck-app",
  storageBucket: "salvateck-app.firebasestorage.app",
  messagingSenderId: "425555742741",
  appId: "1:425555742741:web:90b89c21a73eeef5187e1c",
});

firebase.messaging();

const CACHE_PREFIX = "salvateck-pwa";

const CACHE_VERSION = "v1.0.5";

const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;

const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;

/*
  Arquivos mínimos necessários para iniciar
  o aplicativo e apresentar a página offline.
*/
const APP_SHELL = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./css/base.css",
  "./css/index.css",
  "./js/pwa.js",
  "./assets/icons/favicon-32-v2.png",
  "./assets/icons/apple-touch-icon-v2.png",
  "./assets/icons/icon-192-v2.png",
  "./assets/icons/icon-512-v2.png",
  "./assets/icons/icon-maskable-512-v2.png",
];

/* =========================================
   INSTALAÇÃO
========================================= */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        return self.skipWaiting();
      }),
  );
});

/* =========================================
   ATIVAÇÃO E LIMPEZA DE CACHES ANTIGOS
========================================= */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              const belongsToSalvateck = cacheName.startsWith(CACHE_PREFIX);

              const isCurrentCache =
                cacheName === STATIC_CACHE || cacheName === RUNTIME_CACHE;

              return belongsToSalvateck && !isCurrentCache;
            })
            .map((cacheName) => {
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => {
        return self.clients.claim();
      }),
  );
});

/* =========================================
   ESTRATÉGIA NETWORK FIRST
========================================= */

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.mode === "navigate") {
      const offlineResponse = await caches.match("./offline.html");

      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return Response.error();
  }
}

/* =========================================
   INTERCEPTAÇÃO DAS REQUISIÇÕES
========================================= */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  /*
    Não armazenamos recursos externos.

    Isso mantém Firebase, Google Fonts,
    autenticação e Firestore fora do cache.
  */
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(networkFirst(request));
});
