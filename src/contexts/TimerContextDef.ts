import { createContext } from 'react';
import type { TimerSettings, TimerSession } from '../contexts/useTimer';


interface TimerContextType {
  settings: TimerSettings;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  currentSession: TimerSession | null;
  setCurrentSession: (session: TimerSession | null) => void;
  loadSessionSettings: (session: TimerSession) => void;
};

export const TimerContext = createContext<TimerContextType | undefined>(undefined);