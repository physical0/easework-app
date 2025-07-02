import { useContext } from 'react';
import { TimerContext } from '../contexts/TimerContextDef';

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
};

export interface TimerSession {
  id: string;
  title: string;
  duration_seconds: number;
  started_at: string;
  completed: boolean;
  created_at: string;
};

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}