import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  signOut,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

/* =========================================
   ELEMENTOS
========================================= */

const registerForm = document.getElementById("register-form");

const registerName = document.getElementById("register-name");

const registerEmail = document.getElementById("register-email");

const registerPhone = document.getElementById("register-phone");

const registerPassword = document.getElementById("register-password");

const registerPasswordConfirmation = document.getElementById(
  "register-password-confirmation",
);

const registerPasswordToggle = document.getElementById(
  "register-password-toggle",
);

const registerSubmitButton = document.getElementById("register-submit-button");

const authFeedback = document.getElementById("auth-feedback");

/* =========================================
   AUXILIARES
========================================= */

function onlyNumbers(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatPhone(value) {
  const numbers = onlyNumbers(value).slice(0, 11);

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }

  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(
      2,
      6,
    )}-${numbers.slice(6)}`;
  }

  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

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

function setLoading(isLoading) {
  if (!registerSubmitButton.dataset.originalContent) {
    registerSubmitButton.dataset.originalContent =
      registerSubmitButton.innerHTML;
  }

  registerSubmitButton.disabled = isLoading;

  registerSubmitButton.classList.toggle("is-loading", isLoading);

  if (isLoading) {
    registerSubmitButton.textContent = "Criando conta...";

    return;
  }

  registerSubmitButton.innerHTML = registerSubmitButton.dataset.originalContent;
}

/* =========================================
   ERROS
========================================= */

function translateFirebaseError(error) {
  const errorMessages = {
    "auth/email-already-in-use": "Este e-mail já possui uma conta cadastrada.",

    "auth/invalid-email": "Informe um endereço de e-mail válido.",

    "auth/weak-password": "A senha informada é muito fraca.",

    "auth/operation-not-allowed":
      "O cadastro por e-mail ainda não está habilitado.",

    "auth/network-request-failed":
      "Não foi possível acessar o Firebase. Verifique sua internet.",

    "auth/too-many-requests":
      "Muitas tentativas foram realizadas. Aguarde alguns minutos.",
  };

  return (
    errorMessages[error?.code] ||
    "Não foi possível concluir o cadastro. Tente novamente."
  );
}

/* =========================================
   TELEFONE
========================================= */

registerPhone.addEventListener("input", () => {
  registerPhone.value = formatPhone(registerPhone.value);
});

/* =========================================
   MOSTRAR SENHA
========================================= */

registerPasswordToggle.addEventListener("click", () => {
  const showingPassword = registerPassword.type === "text";

  const newType = showingPassword ? "password" : "text";

  registerPassword.type = newType;

  registerPasswordConfirmation.type = newType;

  registerPasswordToggle.setAttribute("aria-pressed", String(!showingPassword));

  registerPasswordToggle.setAttribute(
    "aria-label",
    showingPassword ? "Mostrar senha" : "Ocultar senha",
  );
});

/* =========================================
   CADASTRO
========================================= */

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  hideFeedback();

  const name = registerName.value.trim().replace(/\s+/g, " ");

  const email = registerEmail.value.trim().toLowerCase();

  const phone = registerPhone.value.trim();

  const phoneNumbers = onlyNumbers(phone);

  const password = registerPassword.value;

  const passwordConfirmation = registerPasswordConfirmation.value;

  if (name.length < 3) {
    showFeedback("Informe seu nome completo.");

    registerName.focus();

    return;
  }

  if (!email) {
    showFeedback("Informe seu e-mail.");

    registerEmail.focus();

    return;
  }

  if (phoneNumbers.length !== 10 && phoneNumbers.length !== 11) {
    showFeedback("Informe um telefone válido com DDD.");

    registerPhone.focus();

    return;
  }

  if (password.length < 8) {
    showFeedback("A senha precisa ter pelo menos 8 caracteres.");

    registerPassword.focus();

    return;
  }

  if (password !== passwordConfirmation) {
    showFeedback("As senhas informadas não são iguais.");

    registerPasswordConfirmation.focus();

    return;
  }

  setLoading(true);

  let createdUser = null;

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    createdUser = credential.user;

    await updateProfile(createdUser, {
      displayName: name,
    });

    await setDoc(doc(db, "usuarios", createdUser.uid), {
      uid: createdUser.uid,

      nome: name,

      email,

      telefone: phone,

      telefoneNumeros: phoneNumbers,

      role: "cliente",

      ativo: true,

      criadoEm: serverTimestamp(),

      atualizadoEm: serverTimestamp(),
    });

    await signOut(auth);

    const parameters = new URLSearchParams({
      cadastro: "sucesso",
      email,
    });

    window.location.replace(`login.html?${parameters.toString()}`);
  } catch (error) {
    console.error("[Cadastro] Não foi possível criar a conta:", error);

    if (error?.code === "auth/email-already-in-use") {
      try {
        await sendPasswordResetEmail(auth, email);

        const parameters = new URLSearchParams({
          ativacao: "enviada",
          email,
        });

        window.location.replace(`login.html?${parameters.toString()}`);

        return;
      } catch (activationError) {
        console.error(
          "[Cadastro] Não foi possível enviar o e-mail de ativação:",
          activationError,
        );

        showFeedback(
          activationError?.code === "auth/network-request-failed"
            ? "Não foi possível acessar o Firebase. Verifique sua internet."
            : "Encontramos seu cadastro, mas não foi possível enviar o link para definir sua senha.",
        );

        setLoading(false);

        return;
      }
    }

    if (createdUser) {
      try {
        await deleteUser(createdUser);
      } catch (deleteError) {
        console.warn(
          "[Cadastro] Não foi possível desfazer o usuário incompleto:",
          deleteError,
        );
      }
    }

    showFeedback(translateFirebaseError(error));

    setLoading(false);
  }
});
