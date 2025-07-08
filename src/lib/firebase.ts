
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration is loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This function checks if the config values are provided and are not placeholders.
const isConfigValid = (config: typeof firebaseConfig) => {
    return Object.values(config).every(value => {
        if (!value || typeof value !== 'string' || value.length === 0) {
            return false;
        }
        // Check for common placeholder patterns
        if (value.startsWith('<') || value.includes('...') || value.includes('YOUR_')) {
            return false;
        }
        return true;
    });
};

if (!isConfigValid(firebaseConfig)) {
    throw new Error(`
    ********************************************************************************
    * FIREBASE IS NOT CONFIGURED OR CONTAINS PLACEHOLDER VALUES
    *
    * Please add your Firebase project configuration to the .env file.
    * You can find these values in your Firebase project settings.
    * Do not use placeholder values like "<YOUR_API_KEY>".
    * The application cannot start without a valid Firebase configuration.
    ********************************************************************************
    `);
}


// Initialize Firebase for both client and server-side rendering
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
