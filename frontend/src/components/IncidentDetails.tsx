import React, { useState, useRef, useEffect } from 'react';
import { Incident, Urgency, Status } from '../types';
import { Flame, HeartPulse, CarFront, AlertTriangle, Package, Siren, User, Phone, MapPin, List, Clock, ShieldCheck, ChevronDown, Mic, Play, Pause } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface IncidentDetailsProps {
  incident: Incident | null;
  onStatusChange: (incidentId: string, newStatus: Status) => void;
}

const CrisisIcon: React.FC<{ type: string; className?: string }> = ({ type, className = "w-8 h-8" }) => {
  const iconProps: LucideProps = { className, strokeWidth: 2 };
  switch (type.toLowerCase()) {
    case 'fire': return <Flame {...iconProps} />;
    case 'medical emergency': return <HeartPulse {...iconProps} />;
    case 'traffic accident': return <CarFront {...iconProps} />;
    case 'suspicious package': return <Package {...iconProps} />;
    case 'active shooter': return <Siren {...iconProps} />;
    default: return <AlertTriangle {...iconProps} />;
  }
};

const urgencyStyles: { [key in Urgency]: string } = {
  [Urgency.Critical]: 'text-red-500 border-red-500/50 bg-red-500/10',
  [Urgency.High]: 'text-orange-400 border-orange-400/50 bg-orange-400/10',
  [Urgency.Medium]: 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10',
  [Urgency.Low]: 'text-blue-400 border-blue-400/50 bg-blue-400/10',
};

const statusSelectStyles: { [key in Status]: string } = {
    [Status.Pending]: 'border-orange-500/50 text-orange-400 focus:border-orange-500 focus:ring-orange-500',
    [Status.Dispatched]: 'border-blue-500/50 text-blue-400 focus:border-blue-500 focus:ring-blue-500',
    [Status.Resolved]: 'border-green-500/50 text-green-400 focus:border-green-500 focus:ring-green-500',
    [Status.Unknown]: 'border-gray-500/50 text-gray-400 focus:border-gray-500 focus:ring-gray-500',
};

const DetailCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode, className?: string }> = ({ icon, title, children, className }) => (
    <div className={`bg-brand-panel border border-brand-border rounded-lg p-5 ${className}`}>
        <div className="flex items-center text-brand-text-secondary mb-3">
            {icon}
            <h3 className="font-semibold text-sm uppercase tracking-wider ml-3">{title}</h3>
        </div>
        <div className="text-brand-text text-base">
            {children}
        </div>
    </div>
);

const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const setAudioData = () => { setDuration(audio.duration); setCurrentTime(audio.currentTime); };
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => setIsPlaying(false);
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);
        audio.src = src; setIsPlaying(false); setCurrentTime(0); setDuration(0);
        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        }
    }, [src]);

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
            setIsPlaying(!isPlaying);
        }
    };
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(audioRef.current) {
            audioRef.current.currentTime = Number(e.target.value);
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center space-x-4 w-full">
            <audio ref={audioRef} preload="metadata"></audio>
            <button onClick={togglePlayPause} className="p-2 rounded-full bg-brand-primary/20 hover:bg-brand-primary/40 text-brand-primary transition-colors flex-shrink-0">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <div className="flex-grow flex items-center space-x-3">
                <span className="text-sm font-mono text-brand-text-secondary">{formatTime(currentTime)}</span>
                <input type="range" value={currentTime} min="0" max={duration || 0} onChange={handleSeek} className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer range-sm accent-brand-primary" />
                <span className="text-sm font-mono text-brand-text-secondary">{formatTime(duration)}</span>
            </div>
        </div>
    );
};

const IncidentDetails: React.FC<IncidentDetailsProps> = ({ incident, onStatusChange }) => {
  if (!incident) {
    return (
      <div className="flex-grow p-6 flex flex-col items-center justify-center text-brand-text-secondary">
        <Siren className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold">No Incident Selected</h2>
        <p>Select an incident from the list to view details.</p>
      </div>
    );
  }

  return (
    <div className="flex-grow p-4 md:p-8 overflow-y-auto">
      <header className="mb-6">
        <div className="flex items-center space-x-4">
            <div className="text-brand-primary"><CrisisIcon type={incident.crisis_type} className="w-10 h-10" /></div>
            <div>
                <h2 className="text-3xl font-bold text-brand-text">{incident.crisis_type}</h2>
                <p className="text-brand-text-secondary font-mono text-sm">ID: {incident.id}</p>
            </div>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DetailCard icon={<AlertTriangle className="w-5 h-5" />} title="Urgency & Status" className="lg:col-span-1">
            <div className="flex flex-col space-y-4">
                <div className={`w-full text-center p-2 rounded-md border font-bold text-lg ${urgencyStyles[incident.urgency]}`}>{incident.urgency}</div>
                <div className="relative">
                   <select value={incident.status} onChange={(e) => onStatusChange(incident.id, e.target.value as Status)} className={`w-full appearance-none p-2.5 rounded-md border font-bold text-sm capitalize transition-colors duration-200 bg-brand-panel ${statusSelectStyles[incident.status]}`}>
                        <option value={Status.Pending}>Pending</option>
                        <option value={Status.Dispatched}>Dispatched</option>
                        <option value={Status.Resolved}>Resolved</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-text-secondary"><ChevronDown className="h-5 w-5" /></div>
                </div>
            </div>
        </DetailCard>
        <DetailCard icon={<MapPin className="w-5 h-5" />} title="Location" className="lg:col-span-2">
            <p className="text-lg font-medium">{incident.location}</p>
            <p className="text-sm text-brand-text-secondary mt-1">Timestamp: {incident.timestamp.toLocaleString()}</p>
        </DetailCard>
        <DetailCard icon={<List className="w-5 h-5" />} title="Summary" className="lg:col-span-3"><p className="leading-relaxed">{incident.summary}</p></DetailCard>
        {incident.caller_info && (<DetailCard icon={<User className="w-5 h-5" />} title="Caller Information" className="lg:col-span-1"><p><strong>Name:</strong> {incident.caller_info.name}</p><p><strong>Phone:</strong> {incident.caller_info.phone}</p></DetailCard>)}
        {incident.audio_url && (<DetailCard icon={<Mic className="w-5 h-5" />} title="Recorded Audio" className={incident.caller_info ? "lg:col-span-2" : "lg:col-span-3"}><AudioPlayer src={incident.audio_url} key={incident.id} /></DetailCard>)}
        {incident.units_dispatched && incident.units_dispatched.length > 0 && (<DetailCard icon={<ShieldCheck className="w-5 h-5" />} title="Units Dispatched" className="lg:col-span-3"><div className="flex flex-wrap gap-2">{incident.units_dispatched.map(unit => (<span key={unit} className="bg-brand-primary/20 text-brand-primary text-sm font-medium px-3 py-1 rounded-full">{unit}</span>))}</div></DetailCard>)}
        <div className="lg:col-span-3 bg-brand-panel border border-brand-border rounded-lg p-5">
            <div className="flex items-center text-brand-text-secondary mb-3"><Clock className="w-5 h-5" /><h3 className="font-semibold text-sm uppercase tracking-wider ml-3">Full AI Analysis (Raw Data)</h3></div>
            <pre className="bg-brand-bg p-4 rounded-md text-sm text-brand-text-secondary font-mono overflow-x-auto">{JSON.stringify(incident, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};
export default IncidentDetails;