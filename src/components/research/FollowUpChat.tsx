import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, Bot, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ChatMessage } from '../../types/research';

interface FollowUpChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function FollowUpChat({ messages, onSendMessage, isLoading }: FollowUpChatProps) {
  const { darkMode, theme } = useTheme();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedQueries = [
    'Expand the literature review section',
    'Add more Uganda-specific citations',
    'Improve the methodology section',
    'Make the problem statement stronger',
    'Add more theoretical justification',
  ];

  return (
    <div className={`rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex items-center gap-2`}>
        <MessageSquare className={`w-5 h-5 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} />
        <h3 className={`font-semibold ${theme.text}`}>AI Assistant</h3>
        <span className={`text-xs ${theme.textFaint}`}>— Ask for revisions or clarifications</span>
      </div>

      {/* Messages */}
      <div className={`h-64 overflow-y-auto p-4 space-y-4 ${
        darkMode ? 'bg-slate-900/50' : 'bg-slate-50'
      }`}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Bot className={`w-12 h-12 mb-3 ${theme.textFaint}`} />
            <p className={`text-sm ${theme.textFaint} mb-4`}>
              Ask the AI to make changes to your proposal
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestedQueries.slice(0, 3).map((query) => (
                <button
                  key={query}
                  onClick={() => setInput(query)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    darkMode
                      ? 'border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300'
                      : 'border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    darkMode ? 'bg-violet-900/50' : 'bg-violet-100'
                  }`}>
                    <Bot className={`w-4 h-4 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-amber-500 text-white rounded-br-md'
                      : darkMode
                      ? 'bg-slate-800 text-slate-200 rounded-bl-md'
                      : 'bg-white text-slate-800 rounded-bl-md border border-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-amber-200' : theme.textFaint
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    darkMode ? 'bg-amber-900/50' : 'bg-amber-100'
                  }`}>
                    <User className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-violet-900/50' : 'bg-violet-100'
                }`}>
                  <Bot className={`w-4 h-4 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} />
                </div>
                <div className={`p-3 rounded-2xl rounded-bl-md ${
                  darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Loader2 className={`w-4 h-4 animate-spin ${theme.textFaint}`} />
                    <span className={`text-sm ${theme.textFaint}`}>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className={`p-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for changes or clarifications..."
            rows={2}
            className={`flex-1 px-4 py-2.5 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className={`text-xs ${theme.textFaint} mt-2`}>
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}



