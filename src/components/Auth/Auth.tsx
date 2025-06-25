import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) alert(error.message);
    else alert('Check your email for the confirmation link!');
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    setLoading(false);
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
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Sign In'}
        </button>
        <button
          onClick={handleSignUp}
          className="w-full p-2 bg-green-500 text-white rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}