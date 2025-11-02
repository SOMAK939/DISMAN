import React, { useState, useEffect, useRef } from 'react';
import { Incident, Status } from './types';
import IncidentList from './components/IncidentList';
import IncidentDetails from './components/IncidentDetails';
import { ShieldAlert } from 'lucide-react';
import { listenForIncidents } from './services/firebaseService'; // Import our service

const App: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newIncidentIds, setNewIncidentIds] = useState<Set<string>>(new Set());
  const previousIncidentIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Set up the real-time listener when the component mounts
    const unsubscribe = listenForIncidents((newIncidents) => {
      setIncidents(newIncidents);

      // Select the first incident by default when data loads
      if (incidents.length === 0 && newIncidents.length > 0) {
        setSelectedIncident(newIncidents[0]);
      }
      
      // Logic to detect and highlight new incidents
      const currentIds = new Set(newIncidents.map(inc => inc.id));
      const newlyAddedIds = new Set([...currentIds].filter(id => !previousIncidentIds.current.has(id)));

      if (newlyAddedIds.size > 0) {
        setNewIncidentIds(prev => new Set([...prev, ...newlyAddedIds]));

        // Remove the highlight after a delay for each new incident
        newlyAddedIds.forEach(newId => {
          setTimeout(() => {
            setNewIncidentIds(prev => {
              const updated = new Set(prev);
              updated.delete(newId);
              return updated;
            });
          }, 3000);
        });
      }
      
      previousIncidentIds.current = currentIds;
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [incidents.length]); // Rerun effect slightly if needed, safer than empty
  
  const handleSelectIncident = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  const handleStatusChange = (incidentId: string, newStatus: Status) => {
    // This part is for local state updates. In a real app, you would
    // write this change back to Firebase here.
    setIncidents(currentIncidents =>
      currentIncidents.map(inc =>
        inc.id === incidentId ? { ...inc, status: newStatus } : inc
      )
    );
    if (selectedIncident && selectedIncident.id === incidentId) {
        setSelectedIncident(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen font-sans bg-brand-bg text-brand-text">
      <header className="flex-shrink-0 flex items-center p-4 border-b border-brand-border bg-brand-panel">
        <ShieldAlert className="w-8 h-8 text-brand-primary mr-3"/>
        <h1 className="text-2xl font-bold tracking-tighter">AI Emergency Response</h1>
      </header>
      <main className="flex flex-grow overflow-hidden">
        <IncidentList
          incidents={incidents}
          onSelectIncident={handleSelectIncident}
          selectedIncidentId={selectedIncident?.id || null}
          newIncidentIds={newIncidentIds}
        />
        <IncidentDetails 
          incident={selectedIncident}
          onStatusChange={handleStatusChange}
        />
      </main>
    </div>
  );
};

export default App;