const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: "studio-3845013162-4f4cd.firebaseapp.com",
    projectId: "studio-3845013162-4f4cd",
    storageBucket: "studio-3845013162-4f4cd.firebasestorage.app",
    messagingSenderId: "809765872395",
    appId: "1:809765872395:web:f36d801e758c77ee3eb80e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

async function testAccess() {
    try {
        console.log('Current user:', auth.currentUser);
        if (auth.currentUser) {
            console.log('User UID:', auth.currentUser.uid);
            const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
            console.log('Attempting to get document:', userDocRef.path);
            const userDoc = await getDoc(userDocRef);
            console.log('Document exists:', userDoc.exists());
            if (userDoc.exists()) {
                console.log('Document data:', userDoc.data());
            }
        } else {
            console.log('No user is currently signed in');
        }
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Full error:', error);
    }
}

// Wait for auth state
auth.onAuthStateChanged((user) => {
    console.log('Auth state changed:', user ? user.uid : 'null');
    testAccess();
});

setTimeout(() => {
    console.log('Timeout - exiting');
    process.exit(0);
}, 5000);
