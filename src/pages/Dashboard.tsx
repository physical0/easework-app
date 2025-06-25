import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../lib/supabase';

type DashboardStats = {
  taskCount: number;
  completedTaskCount: number;
  timerSessionsCount: number;
  timerMinutesCompleted: number;
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    taskCount: 0,
    completedTaskCount: 0,
    timerSessionsCount: 0,
    timerMinutesCompleted: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingStats(false);
      return;
    }

    fetchDashboardStats();
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);

      // Get task counts
      const { count: taskCount, error: taskError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (taskError) throw taskError;

      // Get completed task count
      const { count: completedTaskCount, error: completedTaskError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      if (completedTaskError) throw completedTaskError;

      // Get timer sessions count
      const { count: timerSessionsCount, error: timerSessionsError } = await supabase
        .from('timer_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (timerSessionsError) throw timerSessionsError;

      // Get timer minutes completed
      const { data: timerSessions, error: timerMinutesError } = await supabase
        .from('timer_sessions')
        .select('duration_seconds')
        .eq('user_id', user?.id)
        .eq('completed', true);

      if (timerMinutesError) throw timerMinutesError;

      const timerMinutesCompleted = timerSessions.reduce(
        (total, session) => total + Math.floor(session.duration_seconds / 60),
        0
      );

      setStats({
        taskCount: taskCount || 0,
        completedTaskCount: completedTaskCount || 0,
        timerSessionsCount: timerSessionsCount || 0,
        timerMinutesCompleted,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {!user ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Welcome to Easework</h2>
          <p className="mb-6 text-gray-600">
            Sign in to access all features and track your productivity.
          </p>
          <Link
            to="/auth"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign In / Sign Up
          </Link>
        </div>
      ) : (
        <div>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Welcome back, {user.email}</h2>
            <p className="text-gray-600">
              Here's an overview of your productivity metrics.
            </p>
          </div>

          {loadingStats ? (
            <div className="text-center py-6">Loading stats...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-500 text-sm font-medium mb-2">Total Tasks</h3>
                <p className="text-3xl font-bold">{stats.taskCount}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-500 text-sm font-medium mb-2">Completed Tasks</h3>
                <p className="text-3xl font-bold">{stats.completedTaskCount}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {stats.taskCount > 0
                    ? `${Math.round((stats.completedTaskCount / stats.taskCount) * 100)}% completion rate`
                    : 'No tasks yet'}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-500 text-sm font-medium mb-2">Timer Sessions</h3>
                <p className="text-3xl font-bold">{stats.timerSessionsCount}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-500 text-sm font-medium mb-2">Focused Minutes</h3>
                <p className="text-3xl font-bold">{stats.timerMinutesCompleted}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {Math.floor(stats.timerMinutesCompleted / 60)} hours of focused work
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  to="/tasks"
                  className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  <div className="flex items-center">
                    <span className="flex-1">Manage Tasks</span>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                  </div>
                </Link>
                <Link
                  to="/timer"
                  className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  <div className="flex items-center">
                    <span className="flex-1">Start Timer</span>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                  </div>
                </Link>
                <Link
                  to="/calendar"
                  className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md"
                >
                  <div className="flex items-center">
                    <span className="flex-1">View Calendar</span>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <p className="text-gray-500 text-center py-8">
                Activity feed coming soon...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}