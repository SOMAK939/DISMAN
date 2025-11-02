import React from 'react';
import { Incident, Urgency } from '../types';
import { Flame, HeartPulse, CarFront, AlertTriangle, Package, Siren } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface IncidentListProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  selectedIncidentId: string | null;
  newIncidentIds: Set<string>;
}

const CrisisIcon: React.FC<{ type: string; className?: string }> = ({ type, className = "w-6 h-6" }) => {
  const iconProps: LucideProps = { className, strokeWidth: 1.5 };
  switch (type.toLowerCase()) {
    case 'fire': return <Flame {...iconProps} />;
    case 'medical emergency': return <HeartPulse {...iconProps} />;
    case 'traffic accident': return <CarFront {...iconProps} />;
    case 'suspicious package': return <Package {...iconProps} />;
    case 'active shooter': return <Siren {...iconProps} />;
    default: return <AlertTriangle {...iconProps} />;
  }
};

const statusStyles: { [key: string]: string } = {
    pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    dispatched: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
    unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const urgencyStyles: { [key in Urgency]: string } = {
    [Urgency.Critical]: 'text-red-500 font-bold',
    [Urgency.High]: 'text-orange-400 font-semibold',
    [Urgency.Medium]: 'text-yellow-400',
    [Urgency.Low]: 'text-blue-400',
};

const IncidentListItem: React.FC<{ incident: Incident; isSelected: boolean; isNew: boolean; onSelect: () => void }> = ({ incident, isSelected, isNew, onSelect }) => {
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min ago";
    return Math.floor(seconds) + "s ago";
  };
  
  return (
    <li onClick={onSelect} className={`p-4 border-b border-brand-border cursor-pointer transition-all duration-200 flex items-start space-x-4 ${isSelected ? 'bg-brand-primary/20' : 'hover:bg-brand-panel/60'} ${isNew ? 'animate-highlight' : ''}`}>
      <div className={`mt-1 ${isSelected ? 'text-white' : 'text-brand-primary'}`}><CrisisIcon type={incident.crisis_type} /></div>
      <div className="flex-grow overflow-hidden">
        <div className="flex justify-between items-center mb-1">
          <strong className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-brand-text'}`}>{incident.crisis_type}</strong>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full border capitalize ${statusStyles[incident.status]}`}>{incident.status}</span>
        </div>
        <div className="text-sm text-brand-text-secondary truncate mb-2">{incident.location}</div>
        <div className="flex justify-between items-center text-xs">
          <span className={`uppercase font-mono tracking-wider ${urgencyStyles[incident.urgency]}`}>{incident.urgency}</span>
          <span className="text-brand-text-secondary">{formatTimeAgo(incident.timestamp)}</span>
        </div>
      </div>
    </li>
  );
};

const IncidentList: React.FC<IncidentListProps> = ({ incidents, onSelectIncident, selectedIncidentId, newIncidentIds }) => {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="w-[340px] md:w-[380px] lg:w-[450px] flex-shrink-0 border-r border-brand-border flex items-center justify-center p-4">
        <div className="text-center text-brand-text-secondary"><p>Waiting for new incidents...</p></div>
      </div>
    );
  }

  return (
    // CRITICAL FIX: Removed 'w-full' and added a default width to prevent layout breaking
    <div className="w-[340px] md:w-[380px] lg:w-[450px] flex-shrink-0 border-r border-brand-border flex flex-col bg-brand-panel/30">
      <div className="p-4 border-b border-brand-border flex-shrink-0">
        <h2 className="text-xl font-bold">Active Incidents ({incidents.length})</h2>
      </div>
      <ul className="list-none p-0 m-0 overflow-y-auto flex-grow">
        {incidents.map((incident) => (
          <IncidentListItem key={incident.id} incident={incident} isSelected={incident.id === selectedIncidentId} isNew={newIncidentIds.has(incident.id)} onSelect={() => onSelectIncident(incident)} />
        ))}
      </ul>
    </div>
  );
};

export default IncidentList;