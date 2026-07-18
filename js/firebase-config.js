import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCzWVnlc7a8vY0KN8KxiZhYlqefPMzRY1o",
  authDomain: "salvateck-app.firebaseapp.com",
  projectId: "salvateck-app",
  storageBucket: "salvateck-app.firebasestorage.app",
  messagingSenderId: "425555742741",
  appId: "1:425555742741:web:90b89c21a73eeef5187e1c",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error(
    "[Firebase] Não foi possível configurar a persistência da sessão:",
    error,
  );
});

export { app, auth, db, storage };
