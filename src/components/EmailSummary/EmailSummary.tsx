import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabase/supabase';
import { useAuth } from '../../contexts/useAuth';
import { GoogleGenerativeAI } from "@google/generative-ai";

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
};

type SavedConversation = {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
};

export default function EmailSummary() {
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Welcome to Email Summarizer! Paste your email content, and I\'ll create a concise summary for you.',
      timestamp: new Date(),
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [genAIModel, setGenAIModel] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize Gemini AI
  useEffect(() => {
    try {
      // The API key should be stored in environment variables
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!API_KEY) {
        console.warn('No API key found for Gemini');
        return;
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
      setGenAIModel(model);
    } catch (err) {
      console.error('Error initializing Gemini:', err);
      // Silent error - we'll fall back to simulation mode
    }
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch user's conversations on mount
  useEffect(() => {
    if (user) {
      fetchSavedSummaries();
    }
  }, [user]);

  // Format messages for Gemini API
  const formatMessagesForGemini = (messageList: Message[]) => {
    return messageList.map(message => ({
      role: message.role === 'system' || message.role === 'assistant' ? 'model' : 'user',
      parts: { text: message.content }
    }));
  };

  // Handle send message with Gemini integration
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      return;
    }

    setError('');
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Show thinking indicator
    setLoading(true);

    let probability: number = 0;
    
    try {
      let summary = '';
      
      if (genAIModel) {
        // Prepare context for Gemini
        const deciderPrompt = {
          role: 'user',
          parts: { text: "You are a helpful assistant that summarizes emails. Please determine if the message is an email or not and give the certainty probability from 0 to 1 based on how likely it is to be an email. Just answer this request with only the floating point (like simply answering 'Yes' or 'No' but with a float such as '0.85')." }
        };
        
        // Get current conversation plus the new message
        const conversationHistory = formatMessagesForGemini([...messages, userMessage]);
        
        conversationHistory.unshift(deciderPrompt);
        
       try {
          // Generate summary with Gemini
          const result = await genAIModel.generateContent({
            contents: conversationHistory
          });
          
          // Get the text response and attempt to parse it as a number
          const responseText = result.response.text();
          console.log("Gemini probability response:", responseText);
          
          // Extract a number from the response text - handles cases where Gemini adds extra text
          const probabilityMatch = responseText.match(/(\d+\.\d+|\d+)/);
          probability = probabilityMatch ? parseFloat(probabilityMatch[0]) : 0;
          
          if (probability > 0.5) {
            const additionalPrompt = {
              role: 'user',
              parts: { text: "Please provide concise and clear summaries. Don't use phrases like 'certainly', 'of course', or 'as an AI language model'. Just summarize the following email (don't answer with numbers anymore, please summarize properly): " + userMessage.content }
            };

            // Make a completely new request with only the summary prompt
            const summaryResult = await genAIModel.generateContent({
              contents: [additionalPrompt]
            });

            summary = summaryResult.response.text();
          } 
          else {
            const additionalPrompt = {
              role: 'user',
              parts: { text: "The provided text does not appear to be an email. However, please provide a brief summary or key points of the following text (don't answer with numbers anymore, please summarize properly): " + userMessage.content }
            };

            // Make a completely new request with only the summary prompt
            const summaryResult = await genAIModel.generateContent({
              contents: [additionalPrompt]
            });

            summary = summaryResult.response.text();
          }
        } catch (aiError) {
          console.error('Gemini API error:', aiError);
          // Fallback to simulation
          summary = simulateAISummary(userMessage.content);
        }
      } else {
        // Fallback to simulation if Gemini is not available
        summary = simulateAISummary(userMessage.content);
      }
      
      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: summary,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save conversation if user is logged in
      if (user) {
        const conversationTitle = userMessage.content.substring(0, 50) + "...";
        
        // If this is a new conversation, create it
        if (!activeConversationId) {
          const { data, error: saveError } = await supabase
            .from('email_conversations')
            .insert([
              {
                user_id: user.id,
                title: conversationTitle,
                category: probability > 0.5 ? 'email' : 'other',
                messages: [...messages, userMessage, assistantMessage]
              },
            ])
            .select();

          if (saveError) {
            console.error('Database save error:', saveError);
            // Don't throw, just log
          } else if (data && data[0]) {
            setActiveConversationId(data[0].id);
            
            // Add to saved conversations
            const newConversation: SavedConversation = {
              id: data[0].id,
              title: conversationTitle,
              messages: [...messages, userMessage, assistantMessage],
              created_at: new Date().toLocaleString()
            };
            
            setSavedConversations(prev => [newConversation, ...prev]);
          }
        } else {
          // Update existing conversation
          const { error: updateError } = await supabase
            .from('email_conversations')
            .update({
              messages: [...messages, userMessage, assistantMessage],
              updated_at: new Date().toISOString()
            })
            .eq('id', activeConversationId);

          if (updateError) {
            console.error('Database update error:', updateError);
            // Don't throw, just log
          } else {
            // Update in local state
            setSavedConversations(prev => prev.map(convo => 
              convo.id === activeConversationId 
                ? { ...convo, messages: [...messages, userMessage, assistantMessage] }
                : convo
            ));
          }
        }
      }
    } catch (err) {
      console.error('Error summarizing email:', err);
      
      // Provide a fallback response instead of an error message
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Here's a summary of your email:\n\n" + simulateAISummary(inputMessage),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedSummaries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('email_conversations')
        .select('id, title, messages, created_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching conversations:', fetchError);
        return;
      }

      // Fix the timestamp conversion issue
      const conversations = data.map((item) => {
        // Process messages to convert timestamp strings back to Date objects
        const processedMessages = item.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        return {
          id: item.id,
          title: item.title || 'Untitled Conversation',
          messages: processedMessages,
          created_at: new Date(item.created_at).toLocaleString(),
        };
      });

      console.log('Fetched conversations:', conversations);
      setSavedConversations(conversations);
      setShowSaved(true);
    } catch (err) {
      console.error('Error fetching saved conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a saved conversation
  const deleteSavedConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { error: deleteError } = await supabase
        .from('email_conversations')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting conversation:', deleteError);
        return;
      }

      // Update the saved conversations list
      setSavedConversations(savedConversations.filter((convo) => convo.id !== id));
      
      // If the active conversation was deleted, reset to a new conversation
      if (activeConversationId === id) {
        startNewConversation();
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to load a saved conversation
  const loadConversation = (conversation: SavedConversation) => {
    setMessages(conversation.messages.length > 0 
      ? conversation.messages 
      : [{
          id: 'welcome',
          role: 'system',
          content: 'Welcome to Email Summarizer! Paste your email content, and I\'ll create a concise summary for you.',
          timestamp: new Date(),
        }]
    );
    setActiveConversationId(conversation.id);
    setShowSaved(false);
  };

  // Function to start a new conversation
  const startNewConversation = () => {
    setMessages([{
      id: 'welcome',
      role: 'system',
      content: 'Welcome to Email Summarizer! Paste your email content, and I\'ll create a concise summary for you.',
      timestamp: new Date(),
    }]);
    setActiveConversationId(null);
    setShowSaved(false);
  };

  // Simple function to simulate AI summarization (fallback if API is unavailable)
  const simulateAISummary = (text: string): string => {
    // Split the text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    // If the text is short, return it as is
    if (sentences.length <= 3) return "Here's your summary:\n\n" + text;
    
    // Otherwise, take the first sentence (often contains the main point)
    // and a couple of sentences from the middle or end
    const firstSentence = sentences[0];
    const middleSentence = sentences[Math.floor(sentences.length / 2)];
    const lastSentence = sentences[sentences.length - 1];
    
    return "Here's your email summary:\n\n" + `${firstSentence} ${middleSentence} ${lastSentence}`;
  };

  return (
    <div className="flex h-[calc(100vh-200px)] max-h-[600px]">
      {/* Sidebar for saved conversations */}
      {user && showSaved && (
        <div className="w-1/4 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Your Conversations</h3>
            <button 
              onClick={() => setShowSaved(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={startNewConversation}
            className={`w-full flex items-center p-3 mb-2 text-left rounded-md hover:bg-gray-100 transition-colors ${activeConversationId ? '' : 'bg-blue-50 border border-blue-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            New Conversation
          </button>
          
          <div className="space-y-1 mt-4">
            <h4 className="text-xs uppercase text-gray-500 font-medium mb-2 pl-2">Recent Conversations</h4>
            
            {savedConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No saved conversations found
              </div>
            ) : (
              savedConversations.map((convo) => (
                <div 
                  key={convo.id}
                  className={`flex flex-col p-3 rounded-md hover:bg-gray-100 cursor-pointer ${activeConversationId === convo.id ? 'bg-blue-50 border border-blue-200' : ''}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <button 
                      onClick={() => loadConversation(convo)}
                      className="text-sm font-medium truncate flex-1 text-left"
                    >
                      {convo.title || convo.messages[0]?.content.substring(0, 30) || 'Untitled'}
                    </button>
                    <button
                      onClick={(e) => deleteSavedConversation(convo.id, e)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">{convo.created_at}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className={`flex flex-col ${showSaved ? 'w-3/4' : 'w-full'} bg-white rounded-lg shadow-md`}>
        {/* Chat header */}
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="font-medium">Email Summarizer</h2>
            {genAIModel ? (
              <span className="ml-2 text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">Gemini AI</span>
            ) : (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5">Simulation</span>
            )}
          </div>
          
          <div className="flex space-x-2">
            {user && (
              <button
                onClick={startNewConversation}
                className="text-gray-600 hover:text-gray-900 p-1"
                title="New conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            {user && (
              <button
                onClick={fetchSavedSummaries}
                className="text-gray-600 hover:text-gray-900 p-1"
                title="View saved conversations"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white mr-2 flex-shrink-0">
                  {message.role === 'system' ? 'S' : 'AI'}
                </div>
              )}
              
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : message.role === 'system'
                    ? 'bg-gray-200 text-gray-800 rounded-bl-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white ml-2 flex-shrink-0">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white mr-2 flex-shrink-0">
                AI
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2 rounded-bl-none">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t p-4">
          {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex space-x-2"
          >
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Paste your email content here..."
              className="flex-1 border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed self-end h-12"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
          <div className="text-xs text-gray-500 mt-2 text-center">
            {user ? (
              activeConversationId 
                ? 'Your conversation is being saved automatically' 
                : 'A new conversation will be created when you send a message'
            ) : 'Sign in to save your conversations'}
          </div>
        </div>
      </div>
    </div>
  );
}