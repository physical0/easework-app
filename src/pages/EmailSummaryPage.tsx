import EmailSummary from '../components/EmailSummary/EmailSummary';
import { useAuth } from '../contexts/useAuth';

export default function EmailSummaryPage() {
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
      <h1 className="text-3xl font-bold mb-6">Email Summarizer</h1>
      <p className="text-gray-600 mb-6">
        Paste your email content below to get an AI-generated summary. This tool helps you quickly
        understand the key points of long emails without reading the entire content.
      </p>
      
      <EmailSummary />
      
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Pro Tips</h2>
        <ul className="list-disc pl-5 space-y-1 text-blue-800">
          <li>Include the entire email for the most accurate summary</li>
          <li>Works best with emails that are at least a few paragraphs long</li>
          <li>Sign in to save your summaries for future reference</li>
          <li>Use this tool for newsletters, company announcements, or any lengthy correspondence</li>
        </ul>
      </div>
    </div>
  );
}