import SleepTracker from '../components/SleepTracker/SleepTracker';
import { useAuth } from '../contexts/useAuth';

export default function SleepTrackerPage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Sleep Tracker</h1>
      <p className="text-gray-600 mb-6">
        Track your sleep patterns to improve your sleep quality and overall well-being.
        Our AI-powered analysis provides personalized recommendations based on your sleep data.
      </p>
      
      <SleepTracker />
      
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Sleep Tips</h2>
        <ul className="list-disc pl-5 space-y-1 text-blue-800">
          <li>Maintain a consistent sleep schedule, even on weekends</li>
          <li>Create a relaxing bedtime routine to signal your body it's time to sleep</li>
          <li>Keep your bedroom cool, dark, and quiet</li>
          <li>Avoid caffeine, alcohol, and large meals before bedtime</li>
          <li>Limit screen time at least an hour before bed</li>
        </ul>
      </div>
    </div>
  );
}