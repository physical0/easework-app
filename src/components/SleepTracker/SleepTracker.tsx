import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabase';
import { useAuth } from '../../contexts/useAuth';

type SleepEntry = {
  id: string;
  user_id: string;
  sleep_time: string;
  wake_time: string;
  quality: number;
  notes: string;
  created_at: string;
};

type SleepStats = {
  averageDuration: number;
  averageQuality: number;
  consistencyScore: number;
  recommendation: string;
};

export default function SleepTracker() {
  const { user } = useAuth();
  const [sleepTime, setSleepTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [quality, setQuality] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [sleepStats, setSleepStats] = useState<SleepStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Fetch sleep entries when component mounts
  useEffect(() => {
    if (user) {
      fetchSleepEntries();
    }
  }, [user]);

  // Fetch sleep entries from Supabase
  const fetchSleepEntries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('sleep_patterns')
        .select('*')
        .eq('user_id', user.id)
        .order('sleep_time', { ascending: false });

      if (fetchError) throw fetchError;

      setSleepEntries(data || []);

      // Calculate sleep statistics if there are entries
      if (data && data.length > 0) {
        calculateSleepStats(data);
      }
    } catch (err) {
      console.error('Error fetching sleep entries:', err);
      setError('Failed to fetch sleep entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add a new sleep entry
  const addSleepEntry = async () => {
    if (!user) return;
    if (!sleepTime || !wakeTime) {
      setError('Please enter both sleep and wake times');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const sleepDate = new Date(sleepTime);
      const wakeDate = new Date(wakeTime);

      // Validate that wake time is after sleep time
      if (wakeDate <= sleepDate) {
        setError('Wake time must be after sleep time');
        return;
      }

      const { error: insertError } = await supabase
        .from('sleep_patterns')
        .insert([
          {
            user_id: user.id,
            sleep_time: sleepTime,
            wake_time: wakeTime,
            quality,
            notes,
          },
        ])
        .select();

      if (insertError) throw insertError;

      // Reset form
      setSleepTime('');
      setWakeTime('');
      setQuality(5);
      setNotes('');

      // Refresh sleep entries
      fetchSleepEntries();
    } catch (err) {
      console.error('Error adding sleep entry:', err);
      setError('Failed to add sleep entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a sleep entry
  const deleteSleepEntry = async (id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { error: deleteError } = await supabase
        .from('sleep_patterns')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Refresh sleep entries
      fetchSleepEntries();
    } catch (err) {
      console.error('Error deleting sleep entry:', err);
      setError('Failed to delete sleep entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate sleep statistics
  const calculateSleepStats = (entries: SleepEntry[]) => {
    // Need at least 3 entries for meaningful stats
    if (entries.length < 3) {
      setSleepStats({
        averageDuration: 0,
        averageQuality: 0,
        consistencyScore: 0,
        recommendation: 'Add more sleep entries to get personalized recommendations.',
      });
      return;
    }

    // Calculate average sleep duration
    let totalDuration = 0;
    let totalQuality = 0;
    const sleepTimes: number[] = [];
    const wakeTimes: number[] = [];

    entries.forEach((entry) => {
      const sleepDate = new Date(entry.sleep_time);
      const wakeDate = new Date(entry.wake_time);
      const durationHours = (wakeDate.getTime() - sleepDate.getTime()) / (1000 * 60 * 60);
      
      totalDuration += durationHours;
      totalQuality += entry.quality;
      
      // Store sleep and wake times for consistency calculation
      sleepTimes.push(sleepDate.getHours() * 60 + sleepDate.getMinutes());
      wakeTimes.push(wakeDate.getHours() * 60 + wakeDate.getMinutes());
    });

    const averageDuration = totalDuration / entries.length;
    const averageQuality = totalQuality / entries.length;
    
    // Calculate consistency score (standard deviation of sleep/wake times)
    const sleepTimeStdDev = calculateStandardDeviation(sleepTimes);
    const wakeTimeStdDev = calculateStandardDeviation(wakeTimes);
    
    // Lower standard deviation means more consistent sleep schedule
    // Convert to a 0-100 score where 0 is very inconsistent and 100 is perfectly consistent
    const maxStdDev = 180; // 3 hours in minutes
    const sleepConsistency = Math.max(0, 100 - (sleepTimeStdDev / maxStdDev) * 100);
    const wakeConsistency = Math.max(0, 100 - (wakeTimeStdDev / maxStdDev) * 100);
    const consistencyScore = Math.round((sleepConsistency + wakeConsistency) / 2);
    
    // Generate recommendation based on stats
    let recommendation = '';
    
    if (averageDuration < 7) {
      recommendation = 'You\'re averaging less than 7 hours of sleep. Most adults need 7-9 hours for optimal health. Try going to bed earlier.';
    } else if (averageDuration > 9) {
      recommendation = 'You\'re averaging more than 9 hours of sleep. While some people need more sleep, excessive sleep can sometimes indicate other health issues.';
    } else {
      recommendation = 'Your sleep duration is within the recommended 7-9 hours for adults.';
    }
    
    if (consistencyScore < 50) {
      recommendation += ' Your sleep schedule is inconsistent. Try to go to bed and wake up at the same time every day, even on weekends.';
    } else if (consistencyScore >= 80) {
      recommendation += ' You have a very consistent sleep schedule, which is excellent for your overall health.';
    }
    
    if (averageQuality < 4) {
      recommendation += ' Your sleep quality is low. Consider improving your sleep environment or consulting a healthcare professional.';
    }
    
    setSleepStats({
      averageDuration: parseFloat(averageDuration.toFixed(1)),
      averageQuality: parseFloat(averageQuality.toFixed(1)),
      consistencyScore,
      recommendation,
    });
  };

  // Helper function to calculate standard deviation
  const calculateStandardDeviation = (values: number[]): number => {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(value => {
      const diff = value - avg;
      return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate sleep duration in hours and minutes
  const calculateDuration = (sleepTime: string, wakeTime: string): string => {
    const sleepDate = new Date(sleepTime);
    const wakeDate = new Date(wakeTime);
    const durationMs = wakeDate.getTime() - sleepDate.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${durationHours}h ${durationMinutes}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {user ? (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Track Your Sleep</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="sleepTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Sleep Time
                </label>
                <input
                  type="datetime-local"
                  id="sleepTime"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="wakeTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Wake Time
                </label>
                <input
                  type="datetime-local"
                  id="wakeTime"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-1">
                Sleep Quality (1-10)
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  id="quality"
                  min="1"
                  max="10"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                />
                <span className="ml-2 text-gray-700 font-medium">{quality}</span>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any factors that affected your sleep..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={addSleepEntry}
                disabled={loading || !sleepTime || !wakeTime}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Sleep Entry'}
              </button>

              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                {showStats ? 'Hide Analysis' : 'Show Sleep Analysis'}
              </button>
            </div>

            {error && <div className="text-red-600 mt-2">{error}</div>}
          </div>

          {showStats && sleepStats && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Sleep Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Average Duration</div>
                  <div className="text-2xl font-bold">{sleepStats.averageDuration} hrs</div>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Average Quality</div>
                  <div className="text-2xl font-bold">{sleepStats.averageQuality}/10</div>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Consistency Score</div>
                  <div className="text-2xl font-bold">{sleepStats.consistencyScore}/100</div>
                </div>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Recommendation</div>
                <div className="text-sm">{sleepStats.recommendation}</div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3">Sleep History</h3>
            {sleepEntries.length === 0 ? (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                No sleep entries yet. Start tracking your sleep pattern.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sleepEntries.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {formatDate(entry.sleep_time)} to {formatDate(entry.wake_time)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Duration: {calculateDuration(entry.sleep_time, entry.wake_time)}
                        </div>
                        <div className="text-sm">
                          Quality: <span className="font-medium">{entry.quality}/10</span>
                        </div>
                        {entry.notes && (
                          <div className="text-sm mt-1 bg-gray-50 p-2 rounded">{entry.notes}</div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteSleepEntry(entry.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">Sign in to track and analyze your sleep patterns.</p>
          <p className="text-sm text-gray-500">
            Sleep tracking helps you understand your sleep habits and improve your overall well-being.
          </p>
        </div>
      )}
    </div>
  );
}