import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

/* =========================================
   PROMESSA GLOBAL DA SESSÃO
========================================= */

let resolveSession;

window.salvateckSessionReady = new Promise((resolve) => {
  resolveSession = resolve;
});

/* =========================================
   CONTROLE
========================================= */

let validationCompleted = false;

function getAllowedRoles() {
  const configuredRoles = document.body.dataset.allowedRoles || "";

  const roles = configuredRoles
    .split(",")
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);

  if (roles.length > 0) {
    return roles;
  }

  return ["admin", "cliente"];
}

function revealPage() {
  document.documentElement.classList.remove("auth-checking");
}

function redirectToLogin() {
  window.location.replace("login.html");
}

async function invalidateSession(message) {
  validationCompleted = true;

  try {
    await signOut(auth);
  } catch (error) {
    console.warn("[Auth Guard] Não foi possível encerrar a sessão:", error);
  }

  if (message) {
    window.alert(message);
  }

  redirectToLogin();
}

/* =========================================
   VALIDAÇÃO
========================================= */

onAuthStateChanged(auth, async (user) => {
  if (validationCompleted) {
    return;
  }

  if (!user) {
    validationCompleted = true;

    redirectToLogin();

    return;
  }

  try {
    const userReference = doc(db, "usuarios", user.uid);

    const userSnapshot = await getDoc(userReference);

    if (!userSnapshot.exists()) {
      await invalidateSession("Seu perfil não foi encontrado no sistema.");

      return;
    }

    const profile = userSnapshot.data();

    if (profile.ativo !== true) {
      await invalidateSession(
        "Esta conta está inativa. Entre em contato com a Salvateck.",
      );

      return;
    }

    const role = String(profile.role || "")
      .trim()
      .toLowerCase();

    if (role !== "admin" && role !== "cliente") {
      await invalidateSession("Esta conta não possui uma permissão válida.");

      return;
    }

    const allowedRoles = getAllowedRoles();

    if (!allowedRoles.includes(role)) {
      validationCompleted = true;

      window.alert("Você não possui permissão para acessar esta página.");

      window.location.replace("principal.html");

      return;
    }

    const session = {
      uid: user.uid,
      email: user.email || profile.email || "",
      role,
      profile,
      user,
    };

    window.salvateckSession = session;

    document.body.dataset.userRole = role;

    validationCompleted = true;

    resolveSession(session);

    window.dispatchEvent(
      new CustomEvent("salvateck:auth-ready", {
        detail: session,
      }),
    );

    revealPage();
  } catch (error) {
    console.error("[Auth Guard] Não foi possível validar o acesso:", error);

    await invalidateSession(
      "Não foi possível validar seu acesso. Entre novamente.",
    );
  }
});
