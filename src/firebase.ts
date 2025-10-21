// Firebase config and initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google API configuration for Google Sheets integration
// To enable Google Sheets sync:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select an existing one
// 3. Enable Google Sheets API
// 4. Create OAuth 2.0 credentials (Web application)
// 5. Add authorized JavaScript origins: http://localhost:3000 and your production URL
// 6. Replace the values below with your credentials
export const GOOGLE_CLIENT_ID = "628275062951-pph2s6bhs5a3vlolrt3bq882i2ss00ou.apps.googleusercontent.com";
export const GOOGLE_API_KEY = ""; // API key is optional for OAuth-authenticated requests
export const GOOGLE_DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
export const GOOGLE_SCOPES = "https://www.googleapis.com/auth/spreadsheets"; 