(() => {
  "use strict";

  if (!("serviceWorker" in navigator)) {
    console.warn("[PWA] Service Worker não suportado.");

    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "./service-worker.js",
        {
          scope: "./",

          /*
                Força o navegador a verificar
                o arquivo do Service Worker
                diretamente na rede.
              */
          updateViaCache: "none",
        },
      );

      /*
          Faz uma verificação de atualização,
          sem recarregar a página automaticamente.
        */
      registration.update().catch(() => {});

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;

        if (!installingWorker) {
          return;
        }

        installingWorker.addEventListener("statechange", () => {
          const hasNewVersion =
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller;

          if (hasNewVersion) {
            console.info(
              "[PWA] Nova versão instalada. Ela será usada nas próximas navegações.",
            );
          }
        });
      });

      console.info("[PWA] Service Worker registrado com sucesso.");
    } catch (error) {
      console.error(
        "[PWA] Não foi possível registrar o Service Worker:",
        error,
      );
    }
  });
})();
