import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// This is the CORRECT way to access environment variables in a Vite project.
// It uses `import.meta.env` instead of `process.env`.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

// Check if the variables were loaded correctly.
if (!firebaseConfig.projectId) {
  throw new Error("Firebase config is missing from .env.local. Please check the VITE_ prefix.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the firestore database instance for other parts of our app to use
export const db = getFirestore(app);