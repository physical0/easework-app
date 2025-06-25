import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts';

export default function EmailSummary() {
  const { user } = useAuth();
  const [emailContent, setEmailContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSummaries, setSavedSummaries] = useState<Array<{ id: string; original: string; summary: string; created_at: string }>>([]);
  const [showSaved, setShowSaved] = useState(false);

  // Function to handle email summarization
  const handleSummarize = async () => {
    if (!emailContent.trim()) {
      setError('Please enter email content to summarize');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // This is a placeholder for the actual AI summarization API call
      // In a real application, you would call an external AI service
      // For now, we'll simulate a summary with a simple algorithm
      const simulatedSummary = simulateAISummary(emailContent);
      
      // Set the summary
      setSummary(simulatedSummary);

      // If user is logged in, save the summary to Supabase
      if (user) {
        const { error: saveError } = await supabase
          .from('email_summaries')
          .insert([
            {
              user_id: user.id,
              original_content: emailContent,
              summary_content: simulatedSummary,
            },
          ]);

        if (saveError) throw saveError;
      }
    } catch (err) {
      console.error('Error summarizing email:', err);
      setError('Failed to summarize email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch saved summaries
  const fetchSavedSummaries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('email_summaries')
        .select('id, original_content, summary_content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      interface SavedSummary {
        id: string;
        original_content: string;
        summary_content: string;
        created_at: string;
      }

      setSavedSummaries(
        data.map((item: SavedSummary) => ({
          id: item.id,
          original: item.original_content,
          summary: item.summary_content,
          created_at: new Date(item.created_at).toLocaleString(),
        }))
      );

      setShowSaved(true);
    } catch (err) {
      console.error('Error fetching saved summaries:', err);
      setError('Failed to fetch saved summaries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a saved summary
  const deleteSavedSummary = async (id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { error: deleteError } = await supabase
        .from('email_summaries')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update the saved summaries list
      setSavedSummaries(savedSummaries.filter((summary) => summary.id !== id));
    } catch (err) {
      console.error('Error deleting saved summary:', err);
      setError('Failed to delete saved summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simple function to simulate AI summarization
  // In a real application, this would be replaced with an actual AI service call
  const simulateAISummary = (text: string): string => {
    // Split the text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    // If the text is short, return it as is
    if (sentences.length <= 3) return text;
    
    // Otherwise, take the first sentence (often contains the main point)
    // and a couple of sentences from the middle or end
    const firstSentence = sentences[0];
    const middleSentence = sentences[Math.floor(sentences.length / 2)];
    const lastSentence = sentences[sentences.length - 1];
    
    return `${firstSentence} ${middleSentence} ${lastSentence}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <label htmlFor="emailContent" className="block text-sm font-medium text-gray-700 mb-2">
          Email Content
        </label>
        <textarea
          id="emailContent"
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste your email content here..."
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
        />
      </div>

      <div className="flex justify-between mb-6">
        <button
          onClick={handleSummarize}
          disabled={loading || !emailContent.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Summarizing...' : 'Summarize Email'}
        </button>

        {user && (
          <button
            onClick={fetchSavedSummaries}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showSaved ? 'Hide Saved' : 'Show Saved Summaries'}
          </button>
        )}
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {summary && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Summary</h3>
          <div className="bg-gray-50 p-4 rounded-md">{summary}</div>
        </div>
      )}

      {showSaved && savedSummaries.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Saved Summaries</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {savedSummaries.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-500">{item.created_at}</span>
                  <button
                    onClick={() => deleteSavedSummary(item.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <div className="text-sm font-medium mb-1">Summary:</div>
                <div className="bg-gray-50 p-2 rounded-md mb-2 text-sm">{item.summary}</div>
                <div className="text-sm font-medium mb-1">Original:</div>
                <div className="bg-gray-50 p-2 rounded-md text-sm max-h-32 overflow-y-auto">
                  {item.original}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSaved && savedSummaries.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No saved summaries found. Summarize an email to save it.
        </div>
      )}

      {!user && (
        <div className="text-center py-4 text-gray-500 border-t border-gray-200 mt-6">
          Sign in to save your email summaries and access them later.
        </div>
      )}
    </div>
  );
}