import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabase';
import { useAuth } from '../../contexts';

type TimerSession = {
  id: string;
  title: string;
  duration_seconds: number;
  started_at: string;
  completed: boolean;
  created_at: string;
};

export default function TimerHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    fetchSessions();
  }, [user, filter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false });

      if (filter === 'completed') {
        query = query.eq('completed', true);
      } else if (filter === 'incomplete') {
        query = query.eq('completed', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSessions(data as TimerSession[]);
    } catch (error) {
      console.error('Error fetching timer sessions:', error instanceof Error ? error.message : 'Unknown error');
      setError(error instanceof Error ? error.message : 'An error occurred while fetching timer sessions');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!user) {
    return (
      <div className="text-center py-6">
        <p>Please sign in to view your timer history.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Timer History</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'completed' | 'incomplete')}
          className="rounded border-gray-300 text-sm"
        >
          <option value="all">All Sessions</option>
          <option value="completed">Completed</option>
          <option value="incomplete">Incomplete</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading sessions...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          No timer sessions found. Start a timer to track your productivity!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {session.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(session.duration_seconds)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(session.started_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {session.completed ? 'Completed' : 'Incomplete'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}