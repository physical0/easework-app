import TimerControl from '../components/Timer/TimerControl';
import TimerHistory from '../components/Timer/TimerHistory';
import { useAuth } from '../contexts/useAuth';

export default function TimerPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Productivity Timer</h1>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">
          Use the Pomodoro Technique to boost your productivity. Work for 25 minutes, then take a 5-minute break.
          After 4 pomodoros, take a longer 15-minute break.
        </p>
        
        <TimerControl />
      </div>

      {user ? (
        <TimerHistory />
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Sign in to track and view your timer history.</p>
        </div>
      )}
    </div>
  );
}