// ============================================================================
// STUDENTS COMPANION - RESEARCH MODULE
// SPLIT-VIEW INTERFACE (Chat + Preview)
// Same layout as Coursework module
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Send, 
  Loader2, 
  X, 
  Eye, 
  BookOpen, 
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ResearchFormData } from '../../types/research';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  type: 'user' | 'assistant' | 'success' | 'error' | 'system';
  text: string;
}

interface ResearchSplitViewProps {
  initialContent: string;
  researchDetails: ResearchFormData | null;
  onRefine: (request: string) => Promise<{ success: boolean; response?: string; error?: string }>;
  onDownload: () => void;
  onClose: () => void;
}

// ============================================================================
// CONTENT FORMATTER - Removes markdown, applies clean styling
// ============================================================================

function formatContent(text: string): string {
  if (!text) return '<p class="text-gray-400 italic">No content to display</p>';

  // ===== CLEAN MARKDOWN SYMBOLS =====

  // **bold** → <strong>
  text = text.replace(
    /\*\*([^*]+)\*\*/g, 
    '<strong style="font-weight: 600; color: #111827;">$1</strong>'
  );

  // *italic* → <em>
  text = text.replace(
    /(?<!\*)\*([^*]+)\*(?!\*)/g, 
    '<em style="font-style: italic;">$1</em>'
  );

  // ## Headers → styled headers
  text = text.replace(
    /^#{1,6}\s*(.+)$/gm,
    '<h3 style="font-size: 18px; font-weight: 700; color: #1e40af; margin-top: 32px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;"><span style="width: 4px; height: 24px; background: linear-gradient(to bottom, #f59e0b, #d97706); border-radius: 4px;"></span>$1</h3>'
  );

  // Numbered section headers like "1. Introduction"
  text = text.replace(
    /^(\d+)\.\s+([A-Z][^\n]+)$/gm,
    '<h3 style="font-size: 18px; font-weight: 700; color: #1e40af; margin-top: 32px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;"><span style="width: 28px; height: 28px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px;">$1</span>$2</h3>'
  );

  // Sub-section headers like "1.1 Background"
  text = text.replace(
    /^(\d+\.\d+)\s+([^\n]+)$/gm,
    '<h4 style="font-size: 16px; font-weight: 600; color: #374151; margin-top: 24px; margin-bottom: 12px; margin-left: 16px;">$1 $2</h4>'
  );

  // Remove --- horizontal rules
  text = text.replace(/^-{3,}$/gm, '');
  text = text.replace(/^\*{3,}$/gm, '');
  text = text.replace(/^_{3,}$/gm, '');

  // Bullet points • - * → styled bullets
  text = text.replace(
    /^[\•\-\*]\s*(.+)$/gm,
    '<div style="display: flex; align-items: flex-start; gap: 12px; margin: 8px 0 8px 16px;"><span style="width: 8px; height: 8px; background-color: #f59e0b; border-radius: 50%; margin-top: 8px; flex-shrink: 0;"></span><span>$1</span></div>'
  );

  // Numbered lists like "1) item" or "a) item"
  text = text.replace(
    /^([a-z0-9]+)[\)]\s+(.+)$/gm,
    '<div style="display: flex; align-items: flex-start; gap: 12px; margin: 8px 0 8px 16px;"><span style="width: 24px; height: 24px; background-color: #fef3c7; color: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;">$1</span><span>$2</span></div>'
  );

  // References header
  text = text.replace(
    /^(References|Bibliography|Works Cited|Reference List)$/gim,
    '<h3 style="font-size: 18px; font-weight: 700; text-align: center; color: #111827; margin-top: 40px; margin-bottom: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb;">$1</h3>'
  );

  // Convert paragraphs (double newlines)
  text = text.replace(
    /\n\n+/g, 
    '</p><p style="margin: 16px 0; color: #374151; line-height: 1.8; text-align: justify;">'
  );

  // Single newlines to spaces (except after block elements)
  text = text.replace(/(?<![>])\n(?![<])/g, ' ');

  // Wrap in paragraph
  text = '<p style="margin: 16px 0; color: #374151; line-height: 1.8; text-align: justify;">' + text + '</p>';

  // Clean up empty paragraphs
  text = text.replace(/<p[^>]*>\s*<\/p>/g, '');

  // Clean up paragraphs that only contain block elements
  text = text.replace(/<p[^>]*>(\s*<(?:h3|h4|div)[^>]*>)/g, '$1');
  text = text.replace(/(<\/(?:h3|h4|div)>)\s*<\/p>/g, '$1');

  return text;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ResearchSplitView({ 
  initialContent,
  researchDetails,
  onRefine,
  onDownload,
  onClose
}: ResearchSplitViewProps) {
  const { darkMode, theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { type: 'success', text: 'Research proposal generated successfully!' },
    { type: 'assistant', text: 'Your research document is ready. Preview it on the right panel.\n\nYou can request modifications below - just describe what you want to change.' }
  ]);
  const [input, setInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Update content when initialContent changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle refinement request
  const handleRefine = async () => {
    if (!input.trim() || isRefining) return;

    const request = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: request }]);
    setIsRefining(true);

    // Show processing message
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'system', text: 'Applying your changes...' }]);
    }, 300);

    try {
      // Call the refine function passed from parent
      const result = await onRefine(request);
      
      if (result && result.success && result.response) {
        setContent(result.response);
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          text: 'Done! The document has been updated. Check the preview on the right.' 
        }]);
      } else {
        throw new Error(result?.error || 'Refinement failed');
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'error', 
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }]);
    } finally {
      setIsRefining(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isRefining) {
      e.preventDefault();
      handleRefine();
    }
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick refinement suggestions
  const quickSuggestions = [
    'Expand the literature review',
    'Add more Uganda-specific context',
    'Strengthen the methodology',
    'Add more recent sources',
    'Expand the theoretical framework',
    'Add ethical considerations'
  ];

  return (
    <div className={`h-[calc(100vh-120px)] flex rounded-2xl overflow-hidden border ${
      darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      
      {/* ===== LEFT PANEL: CHAT ===== */}
      <div className={`w-[45%] flex flex-col border-r ${
        darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        
        {/* Header */}
        <div className={`h-14 px-4 border-b flex items-center justify-between flex-shrink-0 ${
          darkMode ? 'border-slate-700' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              darkMode 
                ? 'bg-gradient-to-br from-amber-600 to-orange-700 shadow-amber-900/30' 
                : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-200'
            }`}>
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <div className={`font-semibold ${theme.text}`}>Research Builder</div>
              <div className={`text-xs truncate max-w-[200px] ${theme.textMuted}`}>
                {researchDetails?.design === 'quantitative' ? 'Quantitative Study' : 'Mixed Methods'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Back to form"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.type === 'user' 
                  ? 'bg-amber-600 text-white rounded-br-sm' 
                  : msg.type === 'assistant'
                  ? darkMode
                    ? 'bg-slate-700 text-slate-200 rounded-bl-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  : msg.type === 'success'
                  ? darkMode
                    ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : msg.type === 'error'
                  ? darkMode
                    ? 'bg-red-900/50 text-red-400 border border-red-700'
                    : 'bg-red-50 text-red-700 border border-red-200'
                  : darkMode
                    ? 'bg-amber-900/50 text-amber-400 border border-amber-700'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {msg.type === 'system' && (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    {msg.text}
                  </span>
                )}
                {msg.type === 'success' && (
                  <span className="flex items-center gap-2">
                    <CheckCircle size={14} />
                    {msg.text}
                  </span>
                )}
                {(msg.type === 'user' || msg.type === 'assistant' || msg.type === 'error') && (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestions */}
        {messages.length <= 2 && (
          <div className={`px-4 py-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <p className={`text-xs mb-2 ${theme.textFaint}`}>Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.slice(0, 4).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(suggestion)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    darkMode 
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className={`p-4 border-t flex-shrink-0 ${
          darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-gray-50'
        }`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Request changes... e.g., 'Expand the methodology section'"
              className={`flex-1 px-4 py-3 text-sm border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none ${
                darkMode 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              disabled={isRefining}
            />
            <button
              onClick={handleRefine}
              disabled={isRefining || !input.trim()}
              className="px-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRefining ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className={`text-xs mt-2 pl-1 ${theme.textFaint}`}>
            Examples: "Add more sources", "Expand literature review", "Include Uganda context"
          </p>
        </div>
      </div>

      {/* ===== RIGHT PANEL: DOCUMENT PREVIEW ===== */}
      <div className={`w-[55%] flex flex-col ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        
        {/* Header */}
        <div className={`h-14 px-4 border-b flex items-center justify-between flex-shrink-0 ${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`flex items-center gap-2 ${theme.textMuted}`}>
            <Eye size={16} />
            <span className="font-medium text-sm">Document Preview</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}>
              {content.split(/\s+/).filter(Boolean).length.toLocaleString()} words
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                darkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-md shadow-amber-900/20 hover:shadow-lg transition-all"
            >
              <Download size={16} />
              Download DOCX
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <div 
            className={`max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden ${
              darkMode ? 'bg-slate-800' : 'bg-white'
            }`}
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {/* Cover Section */}
            <div className={`px-10 py-12 border-b-4 text-center ${
              darkMode ? 'border-amber-600' : 'border-amber-400'
            }`}>
              <h1 className={`text-xl font-bold leading-relaxed mb-4 uppercase ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {researchDetails?.topic || 'Research Proposal'}
              </h1>
              
              <p className={`text-sm italic mb-8 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                A Research Proposal
              </p>

              <div className={`space-y-2 text-sm mt-8 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                {researchDetails?.studentName && (
                  <p><span className="font-bold">Researcher:</span> {researchDetails.studentName}</p>
                )}
                {researchDetails?.regNo && (
                  <p><span className="font-bold">Reg No:</span> {researchDetails.regNo}</p>
                )}
                {researchDetails?.university && (
                  <p><span className="font-bold">Institution:</span> {researchDetails.university}</p>
                )}
                {researchDetails?.program && (
                  <p><span className="font-bold">Program:</span> {researchDetails.program}</p>
                )}
                {researchDetails?.department && (
                  <p><span className="font-bold">Department:</span> {researchDetails.department}</p>
                )}
                {researchDetails?.monthYear && (
                  <p><span className="font-bold">Date:</span> {researchDetails.monthYear}</p>
                )}
              </div>
            </div>

            {/* Content */}
            <div 
              className={`px-10 py-8 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}
              dangerouslySetInnerHTML={{ __html: formatContent(content) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
