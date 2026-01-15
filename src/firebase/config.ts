/**
 * Firebase Configuration
 * 
 * Cloud-hosted Firebase project: chariotek-llc
 * 
 * IMPORTANT: In production, Firebase App Hosting automatically provides
 * these values via environment variables. This config is used as a fallback
 * for local development.
 * 
 * Environment Variables (optional, for .env.local):
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 * - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBcSWjNfr_0i8LzQg0ZQWYcSJdabFCySUc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "chariotek-llc.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chariotek-llc",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "chariotek-llc.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "271589697526",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:271589697526:web:0b73d40f093cdc6c9049d7",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-V6QQJE87EP"
};
