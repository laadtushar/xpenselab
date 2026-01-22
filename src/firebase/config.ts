// Clean and validate API key to prevent newline/whitespace issues
const getCleanApiKey = (): string => {
  const rawKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  // Remove all whitespace, newlines, carriage returns, and BOM characters
  return rawKey.trim().replace(/[\r\n\s\uFEFF]/g, "");
};

export const firebaseConfig = {
  apiKey: getCleanApiKey(),
  authDomain: "studio-3845013162-4f4cd.firebaseapp.com",
  projectId: "studio-3845013162-4f4cd",
  storageBucket: "studio-3845013162-4f4cd.firebasestorage.app",
  messagingSenderId: "809765872395",
  appId: "1:809765872395:web:f36d801e758c77ee3eb80e"
};