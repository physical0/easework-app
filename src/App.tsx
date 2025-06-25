import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts';
import Layout from './components/Layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import TodoPage from './pages/TodoPage';
import TimerPage from './pages/TimerPage';
import CalendarPage from './pages/CalendarPage';
import EmailSummaryPage from './pages/EmailSummaryPage';
import SleepTrackerPage from './pages/SleepTrackerPage';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TodoPage />} />
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/email-summary" element={<EmailSummaryPage />} />
            <Route path="/sleep-tracker" element={<SleepTrackerPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
