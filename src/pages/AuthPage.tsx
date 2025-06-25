import Auth from '../components/Auth/Auth';

export default function AuthPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center">Account Access</h1>
      <p className="text-gray-600 mb-8 text-center">
        Sign in to your account or create a new one to access all features and save your data.
      </p>
      
      <Auth />
      
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Why Sign Up?</h2>
        <ul className="list-disc pl-5 space-y-1 text-blue-800">
          <li>Track your productivity across devices</li>
          <li>Save your task lists and timer sessions</li>
          <li>Get personalized insights based on your data</li>
          <li>Access AI-powered features like email summarization</li>
          <li>Monitor your sleep patterns over time</li>
        </ul>
      </div>
    </div>
  );
}