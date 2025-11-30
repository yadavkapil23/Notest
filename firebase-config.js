// Firebase Configuration - StudyVault
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCCEsM18nHZP00siIOYGwnFOaAkXYbrebA",
    authDomain: "studyvault-5a8d8.firebaseapp.com",
    projectId: "studyvault-5a8d8",
    storageBucket: "studyvault-5a8d8.firebasestorage.app",
    messagingSenderId: "84335814084",
    appId: "1:84335814084:web:bab0e38af241aa3bbaf091"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in app
export { auth, db };
