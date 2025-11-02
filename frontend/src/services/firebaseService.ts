import { db } from '../firebase'; // <-- CORRECT: Imports the initialized db connection
import { collection, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { Incident } from '../types';

export const listenForIncidents = (callback: (incidents: Incident[]) => void): Unsubscribe => {
  const q = query(collection(db, 'incidents'), orderBy('timestamp', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const incidents: Incident[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      incidents.push({
        id: doc.id,
        crisis_type: data.crisis_type || 'Unknown Crisis',
        location: data.location || 'Unknown Location',
        urgency: data.urgency || 'Medium',
        summary: data.summary || '',
        // Convert Firestore Timestamp to JS Date
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
        status: data.status || 'unknown',
        units_dispatched: data.units_dispatched || undefined,
        caller_info: data.caller_info || undefined,
        audio_url: data.audio_url || undefined,
      });
    });
    callback(incidents);
  }, (error) => {
    console.error("Error listening to incidents collection: ", error);
  });

  return unsubscribe;
};