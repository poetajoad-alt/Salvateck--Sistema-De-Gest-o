import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

/* =========================================
   ELEMENTOS
========================================= */

const loginForm = document.getElementById("login-form");

const loginEmail = document.getElementById("login-email");

const loginPassword = document.getElementById("login-password");

const loginPasswordToggle = document.getElementById("login-password-toggle");

const loginSubmitButton = document.getElementById("login-submit-button");

const openRecoveryButton = document.getElementById("open-recovery-button");

const closeRecoveryButton = document.getElementById("close-recovery-button");

const recoveryForm = document.getElementById("recovery-form");

const recoveryEmail = document.getElementById("recovery-email");

const recoverySubmitButton = document.getElementById("recovery-submit-button");

const authFeedback = document.getElementById("auth-feedback");

/* =========================================
   ESTADO
========================================= */

let redirectInProgress = false;

/* =========================================
   FEEDBACK
========================================= */

function showFeedback(message, type = "error") {
  authFeedback.textContent = message;

  authFeedback.className = `auth-feedback auth-feedback--${type}`;

  authFeedback.hidden = false;
}

function hideFeedback() {
  authFeedback.hidden = true;

  authFeedback.textContent = "";

  authFeedback.className = "auth-feedback";
}

/* =========================================
   CARREGAMENTO
========================================= */

function setButtonLoading(button, isLoading, loadingText) {
  if (!button) {
    return;
  }

  if (!button.dataset.originalContent) {
    button.dataset.originalContent = button.innerHTML;
  }

  button.disabled = isLoading;

  button.classList.toggle("is-loading", isLoading);

  if (isLoading) {
    button.textContent = loadingText;
    return;
  }

  button.innerHTML = button.dataset.originalContent;
}

/* =========================================
   ERROS
========================================= */

function translateFirebaseError(error) {
  const errorMessages = {
    "auth/invalid-email": "Informe um endereço de e-mail válido.",

    "auth/invalid-credential": "E-mail ou senha incorretos.",

    "auth/missing-password": "Digite sua senha para continuar.",

    "auth/user-disabled":
      "Esta conta foi desativada. Entre em contato com a Salvateck.",

    "auth/too-many-requests":
      "Muitas tentativas foram realizadas. Aguarde alguns minutos.",

    "auth/network-request-failed":
      "Não foi possível acessar o Firebase. Verifique sua internet.",

    "auth/operation-not-allowed":
      "O login por e-mail ainda não está habilitado no Firebase.",
  };

  return (
    errorMessages[error?.code] ||
    "Não foi possível concluir o acesso. Tente novamente."
  );
}

/* =========================================
   REDIRECIONAMENTO
========================================= */

async function redirectAuthenticatedUser(user) {
  if (!user || redirectInProgress) {
    return;
  }

  redirectInProgress = true;

  try {
    const userReference = doc(db, "usuarios", user.uid);

    const userSnapshot = await getDoc(userReference);

    if (!userSnapshot.exists()) {
      await signOut(auth);

      throw new Error("PROFILE_NOT_FOUND");
    }

    const profile = userSnapshot.data();

    if (profile.ativo !== true) {
      await signOut(auth);

      throw new Error("ACCOUNT_DISABLED");
    }

    const role = String(profile.role || "")
      .toLowerCase()
      .trim();

    if (role === "admin" || role === "cliente") {
      window.location.replace("principal.html");

      return;
    }

    await signOut(auth);

    throw new Error("INVALID_ROLE");
  } catch (error) {
    redirectInProgress = false;

    if (error.message === "PROFILE_NOT_FOUND") {
      showFeedback(
        "Sua conta existe, mas o perfil não foi encontrado no sistema. Entre em contato com a Salvateck.",
      );

      return;
    }

    if (error.message === "ACCOUNT_DISABLED") {
      showFeedback(
        "Esta conta está inativa. Entre em contato com a Salvateck.",
      );

      return;
    }

    if (error.message === "INVALID_ROLE") {
      showFeedback("O perfil desta conta não possui uma permissão válida.");

      return;
    }

    console.error("[Login] Não foi possível validar o perfil:", error);

    showFeedback("Não foi possível validar seu acesso. Tente novamente.");
  }
}

/* =========================================
   MOSTRAR SENHA
========================================= */

loginPasswordToggle.addEventListener("click", () => {
  const showingPassword = loginPassword.type === "text";

  loginPassword.type = showingPassword ? "password" : "text";

  loginPasswordToggle.setAttribute("aria-pressed", String(!showingPassword));

  loginPasswordToggle.setAttribute(
    "aria-label",
    showingPassword ? "Mostrar senha" : "Ocultar senha",
  );
});

/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  hideFeedback();

  const email = loginEmail.value.trim().toLowerCase();

  const password = loginPassword.value;

  if (!email) {
    showFeedback("Informe seu e-mail.");

    loginEmail.focus();

    return;
  }

  if (!password) {
    showFeedback("Informe sua senha.");

    loginPassword.focus();

    return;
  }

  setButtonLoading(loginSubmitButton, true, "Entrando...");

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    await redirectAuthenticatedUser(credential.user);
  } catch (error) {
    console.error("[Login] Falha ao entrar:", error);

    showFeedback(translateFirebaseError(error));
  } finally {
    if (!redirectInProgress) {
      setButtonLoading(loginSubmitButton, false, "Entrando...");
    }
  }
});

/* =========================================
   RECUPERAÇÃO DE SENHA
========================================= */

function openRecovery() {
  hideFeedback();

  recoveryEmail.value = loginEmail.value.trim();

  loginForm.hidden = true;

  recoveryForm.hidden = false;

  recoveryEmail.focus();
}

function closeRecovery() {
  hideFeedback();

  recoveryForm.hidden = true;

  loginForm.hidden = false;

  loginEmail.focus();
}

openRecoveryButton.addEventListener("click", openRecovery);

closeRecoveryButton.addEventListener("click", closeRecovery);

recoveryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  hideFeedback();

  const email = recoveryEmail.value.trim().toLowerCase();

  if (!email) {
    showFeedback("Informe o e-mail cadastrado.");

    recoveryEmail.focus();

    return;
  }

  setButtonLoading(recoverySubmitButton, true, "Enviando...");

  try {
    await sendPasswordResetEmail(auth, email);

    showFeedback(
      "Se o e-mail estiver cadastrado, as instruções de recuperação serão enviadas.",
      "success",
    );
  } catch (error) {
    console.error("[Login] Falha na recuperação:", error);

    if (error.code === "auth/invalid-email") {
      showFeedback("Informe um endereço de e-mail válido.");
    } else if (error.code === "auth/network-request-failed") {
      showFeedback("Verifique sua internet e tente novamente.");
    } else {
      showFeedback("Não foi possível enviar as instruções agora.");
    }
  } finally {
    setButtonLoading(recoverySubmitButton, false, "Enviando...");
  }
});

/* =========================================
   CADASTRO CONCLUÍDO
========================================= */

const urlParameters = new URLSearchParams(window.location.search);

const registrationCompleted = urlParameters.get("cadastro") === "sucesso";

const registeredEmail = urlParameters.get("email") || "";

if (registeredEmail) {
  loginEmail.value = registeredEmail;
}

if (registrationCompleted) {
  showFeedback(
    "Cadastro realizado com sucesso. Agora entre com seu e-mail e senha.",
    "success",
  );
}
