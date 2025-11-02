export enum Urgency {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum Status {
  Pending = 'pending',
  Dispatched = 'dispatched',
  Resolved = 'resolved',
  Unknown = 'unknown',
}

export interface Incident {
  id: string;
  crisis_type: string;
  location: string;
  urgency: Urgency;
  summary: string;
  timestamp: Date;
  status: Status;
  units_dispatched?: string[];
  caller_info?: {
    name: string;
    phone: string;
  };
  audio_url?: string;
}