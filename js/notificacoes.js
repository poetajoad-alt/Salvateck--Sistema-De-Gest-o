import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging.js";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { app, db } from "./firebase-config.js";

const VAPID_PUBLIC_KEY =
  "BDWAM58iskIWSl7L_YSKNYRep-kaPDb6bgJsm0SKNHtdrwB22pePG6XUmQOTrxSLJFzLx0zmzs3WOo7jIqqhdik";

const TOKEN_DOCUMENT_KEY_PREFIX = "salvateck:fcm-token-document:";

let messagingInstance = null;
let foregroundListenerConfigured = false;
let activationPromise = null;

async function getMessagingInstance() {
  const supported = await isSupported();

  if (!supported) {
    return null;
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }

  return messagingInstance;
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  let registration = await navigator.serviceWorker.getRegistration("./");

  if (!registration) {
    registration = await navigator.serviceWorker.register(
      "./service-worker.js",
      {
        scope: "./",
        updateViaCache: "none",
      },
    );
  } else {
    registration.update().catch(() => {});
  }

  return navigator.serviceWorker.ready;
}

function getTokenDocumentStorageKey(uid) {
  return `${TOKEN_DOCUMENT_KEY_PREFIX}${uid}`;
}

function getTokenDocumentId(uid) {
  const storageKey = getTokenDocumentStorageKey(uid);

  const existingDocumentId = localStorage.getItem(storageKey);

  if (existingDocumentId) {
    return existingDocumentId;
  }

  const suffix =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const documentId = `${uid}-${suffix}`;

  localStorage.setItem(storageKey, documentId);

  return documentId;
}

function configureForegroundListener(messaging) {
  if (foregroundListenerConfigured) {
    return;
  }

  foregroundListenerConfigured = true;

  onMessage(messaging, async (payload) => {
    const title = payload.notification?.title || "Salvateck";

    const body =
      payload.notification?.body || "Você recebeu uma nova atualização.";

    const url = payload.data?.url || "principal.html";

    window.dispatchEvent(
      new CustomEvent("salvateck:notificacao-recebida", {
        detail: {
          title,
          body,
          url,
          payload,
        },
      }),
    );

    if (Notification.permission !== "granted") {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(title, {
        body,
        icon: "./assets/icons/icon-192-v2.png",
        badge: "./assets/icons/favicon-32-v2.png",
        tag: payload.data?.ordemId
          ? `ordem-${payload.data.ordemId}`
          : "salvateck",
        data: {
          url,
          ordemId: payload.data?.ordemId || "",
        },
      });
    } catch (error) {
      console.warn(
        "[Notificações] Não foi possível exibir a notificação em primeiro plano:",
        error,
      );
    }
  });
}

async function saveToken(user, token) {
  const storageKey = getTokenDocumentStorageKey(user.uid);
  const existingDocumentId = localStorage.getItem(storageKey);
  const documentId = existingDocumentId || getTokenDocumentId(user.uid);

  const tokenReference = doc(db, "fcmTokens", documentId);

  const tokenData = {
    token,
    ativo: true,
    plataforma: "web",
    userAgent: navigator.userAgent.slice(0, 500),
    atualizadoEm: serverTimestamp(),
  };

  if (existingDocumentId) {
    try {
      await updateDoc(tokenReference, tokenData);

      return;
    } catch (error) {
      const canRecreate =
        error?.code === "not-found" || error?.code === "permission-denied";

      if (!canRecreate) {
        throw error;
      }
    }
  }

  await setDoc(tokenReference, {
    usuarioUid: user.uid,
    uid: user.uid,
    ...tokenData,
    criadoEm: serverTimestamp(),
  });
}

export async function ativarNotificacoesUsuario(user) {
  if (!user?.uid) {
    return false;
  }

  if (activationPromise) {
    return activationPromise;
  }

  activationPromise = (async () => {
    if (!("Notification" in window)) {
      console.warn("[Notificações] Este navegador não suporta notificações.");

      return false;
    }

    const messaging = await getMessagingInstance();

    if (!messaging) {
      console.warn(
        "[Notificações] Firebase Messaging não suportado neste navegador.",
      );

      return false;
    }

    let permission = Notification.permission;

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.info("[Notificações] Permissão para notificações não concedida.");

      return false;
    }

    const serviceWorkerRegistration = await getServiceWorkerRegistration();

    if (!serviceWorkerRegistration) {
      return false;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY,
      serviceWorkerRegistration,
    });

    if (!token) {
      console.warn("[Notificações] O Firebase não retornou um token FCM.");

      return false;
    }

    await saveToken(user, token);

    configureForegroundListener(messaging);

    console.info("[Notificações] Dispositivo registrado para notificações.");

    return true;
  })()
    .catch((error) => {
      console.error(
        "[Notificações] Não foi possível ativar as notificações:",
        error,
      );

      return false;
    })
    .finally(() => {
      activationPromise = null;
    });

  return activationPromise;
}

export async function desativarNotificacoesUsuario(uid) {
  if (!uid) {
    return;
  }

  const storageKey = getTokenDocumentStorageKey(uid);

  try {
    const documentId = localStorage.getItem(storageKey);

    if (documentId) {
      const tokenReference = doc(db, "fcmTokens", documentId);

      const tokenSnapshot = await getDoc(tokenReference);

      if (tokenSnapshot.exists()) {
        await updateDoc(tokenReference, {
          ativo: false,
          atualizadoEm: serverTimestamp(),
        });
      }
    }

    const messaging = await getMessagingInstance();

    if (messaging) {
      await deleteToken(messaging);
    }
  } catch (error) {
    console.warn(
      "[Notificações] Não foi possível desativar completamente o token:",
      error,
    );
  } finally {
    localStorage.removeItem(storageKey);
  }
}
