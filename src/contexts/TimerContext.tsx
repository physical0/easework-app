import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TimerSettings, TimerSession } from '../contexts/useTimer';
import { TimerContext } from './TimerContextDef';

const STORAGE_KEY = 'easework-timer-settings';

export function TimerProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TimerSettings>(() => {

    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }

    return {
      pomodoro: 25,
      shortBreak: 5,
      longBreak: 15,
      autoStartBreaks: true,
      autoStartPomodoros: true,
    };
  });

  const [currentSession, setCurrentSession] = useState<TimerSession | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

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