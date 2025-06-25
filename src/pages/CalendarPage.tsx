import Calendar from '../components/Calendar/Calendar';
import { useAuth } from '../contexts/useAuth';

export default function CalendarPage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Calendar</h1>
      <p className="text-gray-600 mb-6">
        Manage your schedule and keep track of important events and deadlines.
      </p>
      
      <Calendar />
    </div>
  );
}