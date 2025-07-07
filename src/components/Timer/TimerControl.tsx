import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase/supabase';
import { useAuth } from '../../contexts/useAuth';
import { useTimer } from '../../contexts/useTimer';
import type { TimerMode } from '../../contexts/useTimer';

export default function TimerControl() {
  const { user } = useAuth();
  const { settings, updateSettings, currentSession, setCurrentSession } = useTimer();
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro * 60); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Update title when current session changes
  useEffect(() => {
    if (currentSession) {
      setTitle(currentSession.title);
    }
  }, [currentSession]);

  // Initialize timer based on mode and settings from context
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

    console.log('Timer mode:', mode);
    
    // Record session start in database
    if (mode === 'pomodoro') {
      try {
        // Check if we have a current session loaded from history
        if (currentSession) {
          // Use the existing session ID instead of creating a new one
          sessionIdRef.current = currentSession.id;
          
          // Update the existing session with new start time
          const { error } = await supabase
            .from('timer_sessions')
            .update({
              started_at: new Date().toISOString(),
              completed: false, 
            })
            .eq('id', currentSession.id);

          if (error) throw error;
        } else {
          // Create a new session only if no current session exists
          const { data, error } = await supabase
            .from('timer_sessions')
            .insert({
              user_id: user.id,
              title: title || 'Pomodoro Session',
              duration_seconds: settings.pomodoro * 60,
              started_at: new Date().toISOString(),
              completed: false,
            })
            .select()
            .single();

          if (error) throw error;
          if (data) {
            sessionIdRef.current = data.id;
            setCurrentSession(data);
          }
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

    sessionIdRef.current = null;
    startTimeRef.current = null;
    setCurrentSession(null);
  };

  const resetTimer = () => {
    pauseTimer();

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
    setCurrentSession(null);

  };

  const handleTimerComplete = async () => {
      pauseTimer();

      if (mode === 'pomodoro') {
        if (sessionIdRef.current) {
          // Complete the pomodoro session in the database
          console.log('Completing timer for session ID:', sessionIdRef.current);

          const { data, error } = await supabase
            .from('timer_sessions')
            .update({ completed: true })
            .eq('id', sessionIdRef.current)
            .select();

          if (error) {
            console.error('Update error:', error);
            throw error;
          } else if (data.length === 0) {
            console.warn('No rows updated. Check that sessionIdRef.current is valid and that your RLS policies allow this update.');
          } else {
            console.log('Updated session:', data);
          }
        }
        
        // Increment completed pomodoros and reset session refs
        setPomodorosCompleted(prev => prev + 1);
        sessionIdRef.current = null;
        startTimeRef.current = null;
        setCurrentSession(null);

        // Determine next mode and auto-start break if enabled
        const nextMode = pomodorosCompleted % 4 === 3 ? 'longBreak' : 'shortBreak';
        setMode(nextMode);

      } else {
        // Break completed, clear any session data and go back to pomodoro
        sessionIdRef.current = null;
        startTimeRef.current = null;
        setCurrentSession(null);
        setMode('pomodoro');
      }
  };




  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Use context updateSettings instead of local state
  const updateSetting = (key: keyof typeof settings, value: number | boolean) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Show current session info if loaded */}
      {currentSession && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Loaded Session:</strong> {currentSession.title}
          </p>
          <p className="text-xs text-blue-600">
            Duration: {Math.round(currentSession.duration_seconds / 60)} minutes
          </p>
        </div>
      )}

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

      {/* Rest of the component remains the same */}
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