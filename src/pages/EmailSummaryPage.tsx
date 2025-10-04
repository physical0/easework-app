import { useEffect } from 'react';
import EmailSummary from '../components/EmailSummary/EmailSummary';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../supabase/supabase';

export default function EmailSummaryPage() {
  const { loading, user } = useAuth();

  // Create the necessary database table if it doesn't exist
  useEffect(() => {
    const setupDatabase = async () => {
      if (!user) return;
      
      try {
        // Check if the email_conversations table exists
        const { error } = await supabase
          .from('email_conversations')
          .select('id')
          .limit(1);
          
        // If there's an error about the table not existing, create it
        if (error && error.code === '42P01') { // PostgreSQL code for undefined table
          console.log('Creating email_conversations table');
          // This would typically be done in a migration script or backend
          // For demo purposes only - in production, use proper migrations
          await supabase.rpc('create_email_conversations_table');
        }
      } catch (err) {
        console.error('Error setting up database:', err);
      }
    };
    
    setupDatabase();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Email AI Summarizer</h1>
      <p className="text-gray-600 mb-6">
        Chat with our AI to get instant summaries of your emails. Just paste the content and receive a concise overview of the key points.
      </p>
      
      <EmailSummary />
      
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Pro Tips</h2>
        <ul className="list-disc pl-5 space-y-1 text-blue-800">
          <li>Include the entire email for the most accurate summary</li>
          <li>Works best with emails that are at least a few paragraphs long</li>
          <li>Sign in to save your conversations for future reference</li>
          <li>Use this tool for newsletters, company announcements, or any lengthy correspondence</li>
        </ul>
      </div>
    </div>
  );
}