// User related types
export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type Session = {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
};

// Task related types
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  updated_at?: string;
};

// Timer related types
export type TimerMode = 'pomodoro' | 'short_break' | 'long_break';

export type TimerSession = {
  id: string;
  user_id: string;
  mode: TimerMode;
  duration_seconds: number;
  completed: boolean;
  created_at: string;
  completed_at?: string;
};

// Calendar related types
export type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at?: string;
};

// Email summary related types
export type EmailSummary = {
  id: string;
  user_id: string;
  original_content: string;
  summary_content: string;
  created_at: string;
};

// Sleep pattern related types
export type SleepEntry = {
  id: string;
  user_id: string;
  sleep_time: string;
  wake_time: string;
  quality: number;
  notes?: string;
  created_at: string;
};