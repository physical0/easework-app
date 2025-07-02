import { useState } from 'react';
import type { ReactNode } from 'react';
import type { TimerSettings, TimerSession } from '../contexts/useTimer';
import { TimerContext } from './TimerContextDef';

export function TimerProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TimerSettings>({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: true,
    autoStartPomodoros: true,
  });

  const [currentSession, setCurrentSession] = useState<TimerSession | null>(null);

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const loadSessionSettings = (session: TimerSession) => {
    const durationMinutes = Math.round(session.duration_seconds / 60);
    updateSettings({ pomodoro: durationMinutes });
    setCurrentSession(session);
  };

  return (
    <TimerContext.Provider value={{
      settings,
      updateSettings,
      currentSession,
      setCurrentSession,
      loadSessionSettings,
    }}>
      {children}
    </TimerContext.Provider>
  );
}