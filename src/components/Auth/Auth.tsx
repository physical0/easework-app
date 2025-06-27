import { useState } from 'react';
import { useAuth } from '../../contexts/useAuth';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { signUp, signIn, authLoading } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signUp(email, password, username);
    alert(result.message);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn(email, password);
    if (!result.success) {
      alert(result.message);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Productivity App</h1>
      <div>
        <input
          className="w-full p-2 border rounded mb-2"
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded mb-2"
          type="text"
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded mb-4"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleSignIn}
          className="w-full p-2 bg-blue-500 text-white rounded"
          disabled={authLoading}
        >
          {authLoading ? 'Loading...' : 'Sign In'}
        </button>
        <button
          onClick={handleSignUp}
          className="w-full p-2 bg-green-500 text-white rounded"
          disabled={authLoading}
        >
          {authLoading ? 'Loading...' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}