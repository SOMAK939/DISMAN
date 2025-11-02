const admin = require('firebase-admin');

// IMPORTANT: Make sure this path is correct!
const serviceAccount = require('../config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
console.log('Firebase Admin SDK initialized successfully.');

/**
 * Logs a new emergency incident to the 'incidents' collection in Firestore.
 * @param {object} incidentData The structured data from the LLM.
 * @returns {string} The ID of the newly created document.
 */
const logIncident = async (incidentData) => {
  try {
    console.log('--- [Step 3] Logging incident to Firebase ---');
    const incidentRef = await db.collection('incidents').add({
      ...incidentData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // Add a server-side timestamp
      status: 'pending', // Initial status for the dashboard
    });
    console.log(`Successfully logged incident with ID: ${incidentRef.id}`);
    return incidentRef.id;
  } catch (error) {
    console.error('Error logging incident to Firebase:', error);
    return null;
  }
};

module.exports = { logIncident };