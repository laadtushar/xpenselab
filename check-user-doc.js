const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
    projectId: 'studio-3845013162-4f4cd'
});

const db = admin.firestore();

async function checkUserDocument() {
    try {
        const userId = 'cZtUAUbAFmStzY4csAAJXmY6JAn1';
        console.log(`Checking for user document: /users/${userId}`);

        const userDoc = await db.collection('users').doc(userId).get();

        if (userDoc.exists) {
            console.log('✓ User document EXISTS');
            console.log('Document data:', JSON.stringify(userDoc.data(), null, 2));
        } else {
            console.log('✗ User document DOES NOT EXIST');
            console.log('This is likely the root cause of the permission error.');
            console.log('The app is trying to read a document that doesn\'t exist yet.');
        }

        // List all users to see what's in the database
        console.log('\nListing all user documents:');
        const usersSnapshot = await db.collection('users').limit(10).get();
        console.log(`Found ${usersSnapshot.size} user document(s)`);
        usersSnapshot.forEach(doc => {
            console.log(`  - ${doc.id}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUserDocument();
