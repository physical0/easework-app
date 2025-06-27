import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase/supabase';
import { useAuth } from '../../contexts';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

type TimerSettings = {
  pomodoro: number; // in minutes
  shortBreak: number; // in minutes
  longBreak: number; // in minutes
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
};

export default function TimerControl() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [settings, setSettings] = useState<TimerSettings>({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: true,
    autoStartPomodoros: true,
  });
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro * 60); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Initialize timer based on mode
  useEffect(() => {
    switch (mode) {
      case 'pomodoro':
        setTimeLeft(settings.pomodoro * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreak * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreak * 60);
        break;
    }
    // Stop timer when changing modes
    if (isActive) {
      stopTimer();
    }
  }, [mode, settings]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer completed
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const startTimer = async () => {
    if (!user) return;
    
    setIsActive(true);
    startTimeRef.current = Date.now();
    
    // Record session start in database
    if (mode === 'pomodoro') {
      try {
        const { data, error } = await supabase
          .from('timer_sessions')
          .insert({
            user_id: user.id,
            title: title || 'Pomodoro Session',
            duration_seconds: settings.pomodoro * 60,
            started_at: new Date().toISOString(),
            completed: false,
          })
          .select();

        if (error) throw error;
        if (data && data[0]) {
          sessionIdRef.current = data[0].id;
        }
      } catch (error) {
        console.error('Error recording timer session:', error);
      }
    }
  };

  const pauseTimer = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopTimer = async () => {
    pauseTimer();
    
    // If we're stopping a pomodoro session, update the database
    if (mode === 'pomodoro' && sessionIdRef.current && user) {
      try {
        await supabase
          .from('timer_sessions')
          .update({
            completed: false,
          })
          .eq('id', sessionIdRef.current);
      } catch (error) {
        console.error('Error updating timer session:', error);
      }
    }
    
    // Reset timer
    switch (mode) {
      case 'pomodoro':
        setTimeLeft(settings.pomodoro * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreak * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreak * 60);
        break;
    }
    
    sessionIdRef.current = null;
    startTimeRef.current = null;
  };

  const resetTimer = () => {
    stopTimer();
  };

  const handleTimerComplete = async () => {
    pauseTimer();
    
    // Play notification sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.error('Error playing notification:', e));
    
    if (mode === 'pomodoro') {
      // Update completed pomodoro in database
      if (sessionIdRef.current && user) {
        try {
          await supabase
            .from('timer_sessions')
            .update({
              completed: true,
            })
            .eq('id', sessionIdRef.current);
        } catch (error) {
          console.error('Error updating timer session:', error);
        }
      }
      
      // Increment completed pomodoros
      setPomodorosCompleted(prev => prev + 1);
      
      // Determine which break to take next
      const nextMode = pomodorosCompleted % 4 === 3 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      
      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        setTimeout(() => {
          startTimer();
        }, 500);
      }
    } else {
      // Break completed, go back to pomodoro
      setMode('pomodoro');
      
      // Auto-start pomodoro if enabled
      if (settings.autoStartPomodoros) {
        setTimeout(() => {
          startTimer();
        }, 500);
      }
    }
    
    sessionIdRef.current = null;
    startTimeRef.current = null;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateSetting = (key: keyof TimerSettings, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <div className="flex justify-center space-x-2 mb-4">
          <button
            onClick={() => setMode('pomodoro')}
            className={`px-4 py-2 rounded ${mode === 'pomodoro' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => setMode('shortBreak')}
            className={`px-4 py-2 rounded ${mode === 'shortBreak' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            Short Break
          </button>
          <button
            onClick={() => setMode('longBreak')}
            className={`px-4 py-2 rounded ${mode === 'longBreak' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Long Break
          </button>
        </div>

        {mode === 'pomodoro' && (
          <input
            type="text"
            placeholder="What are you working on?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
            disabled={isActive}
          />
        )}

        <div className="text-center">
          <div className="text-6xl font-bold mb-6">{formatTime(timeLeft)}</div>
          <div className="flex justify-center space-x-4">
            {!isActive ? (
              <button
                onClick={startTimer}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Start
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Pause
              </button>
            )}
            <button
              onClick={resetTimer}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-600 hover:text-gray-900 flex items-center"
        >
          <span>Settings</span>
          <svg
            className={`ml-1 w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        {showSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pomodoro Length (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.pomodoro}
                  onChange={(e) => updateSetting('pomodoro', parseInt(e.target.value) || 25)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Short Break Length (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.shortBreak}
                  onChange={(e) => updateSetting('shortBreak', parseInt(e.target.value) || 5)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Long Break Length (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.longBreak}
                  onChange={(e) => updateSetting('longBreak', parseInt(e.target.value) || 15)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="autoStartBreaks"
                  type="checkbox"
                  checked={settings.autoStartBreaks}
                  onChange={(e) => updateSetting('autoStartBreaks', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoStartBreaks" className="ml-2 block text-sm text-gray-700">
                  Auto-start breaks
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="autoStartPomodoros"
                  type="checkbox"
                  checked={settings.autoStartPomodoros}
                  onChange={(e) => updateSetting('autoStartPomodoros', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoStartPomodoros" className="ml-2 block text-sm text-gray-700">
                  Auto-start pomodoros
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-gray-600">
        <p>Pomodoros completed today: {pomodorosCompleted}</p>
      </div>
    </div>
  );
}