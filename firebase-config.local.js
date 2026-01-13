/*
 * Firebase configuration entry point for the Skincare app.
 *
 * Replace each placeholder value with the credentials from your Firebase
 * project. To keep secrets out of version control, you can copy this file to
 * firebase-config.local.js (ignored by Git), update that copy with real values,
 * and include it in your deployment bundle.
 */

(function configureFirebase() {
    if (window.SKINCARE_FIREBASE_CONFIG) {
        return;
    }

    window.SKINCARE_FIREBASE_CONFIG = {
        apiKey: "AIzaSyDy4JVWBRYylBgZWjKPBrLaa8ZFmsWbITE",
        authDomain: "quiz-app-4b491.firebaseapp.com",
        projectId: "quiz-app-4b491",
        storageBucket: "quiz-app-4b491.firebasestorage.app",
        messagingSenderId: "64186021263",
        appId: "1:64186021263:web:776c495801b24665e987fa",
        measurementId: "G-9ZHWGQQ8XB" // optional
    };
})();
