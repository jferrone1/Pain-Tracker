export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'custom';

export interface PainRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timeOfDay: TimeOfDay;
  customTime?: string; // HH:MM
  painLevel: number; // 0 - 10
  location: string; // e.g. "Head", "Lower Back", etc.
  notes: string;
  triggers: string; // comma separated or text
  medications: string;
  activityLevel: 'low' | 'moderate' | 'high';
}

export interface PatternReport {
  id: string;
  createdAt: string;
  summary: string;
  suspectedTriggers: string[];
  timeOfDayPatterns: string;
  medicationEffectiveness: string;
  recommendations: string[];
}
