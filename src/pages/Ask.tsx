import { useState } from 'react';
import { MessageCircle, Send, BookOpen, Sparkles, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Ask() {
  const { darkMode, theme } = useTheme();
  const [message, setMessage] = useState('');

  const suggestions = [
    "Explain the Krebs cycle in simple terms",
    "What's the difference between DNA and RNA?",
    "How do I calculate standard deviation?",
    "Summarize my notes on cell metabolism",
  ];

  const messages = [
    { 
      role: 'assistant', 
      content: "Hello! I'm your academic assistant. I can help explain concepts from your study materials, answer questions, and clarify difficult topics. What would you like to learn about today?",
      time: '10:30 AM'
    },
  ];

  return (
    <div className="animate-fade-in h-[calc(100vh-12rem)]">
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
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${darkMode ? 'bg-sky-900/40 text-sky-400' : 'bg-sky-50 text-sky-700'} text-xs font-medium`}>
          <BookOpen className="w-3.5 h-3.5" />
          Using BIO201
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex flex-col h-full rounded-2xl border ${theme.card} overflow-hidden`}>
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                msg.role === 'assistant' 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-sky-400 to-indigo-500'
              }`}>
                {msg.role === 'assistant' ? (
                  <Sparkles className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-xs font-medium text-white">IO</span>
                )}
              </div>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-3 rounded-2xl ${
                  msg.role === 'assistant'
                    ? darkMode ? 'bg-slate-700/50' : 'bg-slate-100'
                    : darkMode ? 'bg-orange-900/40' : 'bg-orange-100'
                }`}>
                  <p className={`text-sm ${theme.text}`}>{msg.content}</p>
                </div>
                <p className={`text-xs ${theme.textFaint} mt-1`}>{msg.time}</p>
              </div>
            </div>
          ))}

          {/* Suggestions */}
          <div className="mt-6">
            <p className={`text-xs ${theme.textFaint} mb-3`}>Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setMessage(suggestion)}
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
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${theme.divider}`}>
          <div className="flex items-center gap-3">
            <button className={`p-2.5 rounded-xl transition-colors ${
              darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
            }`}>
              <RefreshCw className={`w-5 h-5 ${theme.textFaint}`} />
            </button>
            <div className={`flex-1 flex items-center gap-2 ${theme.input} rounded-xl px-4 py-3 border`}>
              <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything about your studies..."
                className={`flex-1 bg-transparent text-sm outline-none ${theme.text}`}
              />
              <button className={`p-2 rounded-lg transition-all ${
                message.trim()
                  ? 'bg-orange-600 hover:bg-orange-500 text-white'
                  : darkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-400'
              }`}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className={`text-xs ${theme.textFaint} mt-2 text-center`}>
            Responses are grounded in your uploaded Study Pack materials
          </p>
        </div>
      </div>
    </div>
  );
}

