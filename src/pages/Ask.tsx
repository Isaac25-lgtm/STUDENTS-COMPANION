import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Sparkles, RefreshCw, Loader2, AlertCircle, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { askAI, type AskAIMessage } from '../services/gemini';
import { formatAIResponse } from '../utils/askAIFormatter';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Ask() {
  const { darkMode, theme } = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your academic assistant powered by Gemini Flash. I can help explain concepts from any subject, answer questions, and break down difficult topics into understandable parts. What would you like to learn about today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    "Explain the Krebs cycle in simple terms",
    "What's the difference between DNA and RNA?",
    "How do I calculate standard deviation?",
    "Explain supply and demand economics",
    "What is the scientific method?",
    "How does photosynthesis work?",
  ];

  // Auto-scroll to bottom when new messages arrive (but not on initial render)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history (excluding the system greeting)
      const historyForAPI: AskAIMessage[] = messages
        .filter(m => m.id !== '1') // Exclude initial greeting
        .map(m => ({ role: m.role, content: m.content }));

      const response = await askAI(userMessage.content, historyForAPI);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Ask AI error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response. Please try again.');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please check that the Gemini API key is configured correctly in your .env.local file, then try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your academic assistant powered by Gemini Flash. I can help explain concepts from any subject, answer questions, and break down difficult topics into understandable parts. What would you like to learn about today?",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-orange-900/60' : 'bg-orange-100'}`}>
              <MessageCircle className={`w-6 h-6 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${theme.text}`}>Ask AI</h1>
              <p className={`text-sm ${theme.textMuted}`}>Get help understanding any concept</p>
            </div>
          </div>
<div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-50 text-amber-700'} text-xs font-medium`}>
          <Zap className="w-3.5 h-3.5" />
          Gemini Flash
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-3 ${darkMode ? 'bg-red-900/30 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
          <button 
            onClick={() => setError(null)}
            className={`ml-auto text-xs ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div className={`flex flex-col rounded-2xl border ${theme.card} overflow-hidden h-96`}>
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                msg.role === 'assistant' 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-sky-400 to-indigo-500'
              }`}>
                {msg.role === 'assistant' ? (
                  <Sparkles className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-xs font-medium text-white">You</span>
                )}
              </div>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-4 rounded-2xl max-w-full ${
                  msg.role === 'assistant'
                    ? darkMode ? 'bg-slate-700/50' : 'bg-slate-100'
                    : darkMode ? 'bg-orange-900/40' : 'bg-orange-100'
                }`}>
                  {/* Message content with custom tag formatting */}
                  {msg.role === 'assistant' ? (
                    <div 
                      className={`text-sm ${theme.text} ask-ai-content`}
                      dangerouslySetInnerHTML={{ __html: formatAIResponse(msg.content) }}
                    />
                  ) : (
                    <div className={`text-sm ${theme.text} whitespace-pre-wrap`}>
                      {msg.content}
                    </div>
                  )}
                </div>
                <p className={`text-xs ${theme.textFaint} mt-1`}>{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className={`inline-block p-3 rounded-2xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <Loader2 className={`w-4 h-4 animate-spin ${theme.textMuted}`} />
                  <span className={`text-sm ${theme.textMuted}`}>Generating response...</span>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions (show only at the start) */}
          {messages.length === 1 && !isLoading && (
            <div className="mt-6">
              <p className={`text-xs ${theme.textFaint} mb-3`}>Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                      darkMode 
                        ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${theme.divider}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleReset}
              title="Start new conversation"
              className={`p-2.5 rounded-xl transition-colors ${
                darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${theme.textFaint}`} />
            </button>
            <div className={`flex-1 flex items-center gap-2 ${theme.input} rounded-xl px-4 py-3 border`}>
              <input 
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything about your studies..."
                className={`flex-1 bg-transparent text-sm outline-none ${theme.text}`}
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className={`p-2 rounded-lg transition-all ${
                  message.trim() && !isLoading
                    ? 'bg-orange-600 hover:bg-orange-500 text-white'
                    : darkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <p className={`text-xs ${theme.textFaint} mt-2 text-center`}>
            Powered by Gemini Flash — Fast, helpful explanations for any concept
          </p>
        </div>
      </div>
    </div>
  );
}
