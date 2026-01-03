import { useState, useRef } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  Edit3, 
  Eye,
  ChevronLeft,
  FileText,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProposalViewerProps {
  proposal: string;
  onProposalChange: (content: string) => void;
  onBack: () => void;
  isExporting: boolean;
  onExport: () => void;
}

export default function ProposalViewer({
  proposal,
  onProposalChange,
  onBack,
  isExporting,
  onExport
}: ProposalViewerProps) {
  const { darkMode, theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatProposalAsHtml = (text: string): string => {
    // Convert markdown-style formatting to HTML for display
    let html = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold mt-3 mb-2">$1</h4>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Line breaks (double newline = paragraph)
      .replace(/\n\n/g, '</p><p class="mb-4">')
      // Single line break
      .replace(/\n/g, '<br/>');

    return `<p class="mb-4">${html}</p>`;
  };

  return (
    <div className={`rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
            }`}
          >
            <ChevronLeft className={`w-5 h-5 ${theme.text}`} />
          </button>
          <div className="flex items-center gap-2">
            <FileText className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <h2 className={`font-semibold ${theme.text}`}>Generated Proposal</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isEditing
                ? 'bg-amber-500 text-white'
                : darkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? 'Preview' : 'Edit'}
          </button>

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
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export .docx'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={proposal}
            onChange={(e) => onProposalChange(e.target.value)}
            className={`w-full min-h-[600px] p-4 rounded-xl border font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
            spellCheck={false}
          />
        ) : (
          <div
            className={`prose prose-sm max-w-none ${
              darkMode ? 'prose-invert' : ''
            } [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
              [&_p]:mb-4 [&_p]:leading-relaxed
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
              [&_th]:border [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold
              [&_td]:border [&_td]:p-2
              ${darkMode ? '[&_th]:border-slate-600 [&_td]:border-slate-600' : '[&_th]:border-slate-300 [&_td]:border-slate-300'}
            `}
            dangerouslySetInnerHTML={{ __html: formatProposalAsHtml(proposal) }}
          />
        )}
      </div>

      {/* Word Count */}
      <div className={`px-6 py-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex justify-between items-center`}>
        <p className={`text-sm ${theme.textFaint}`}>
          Word count: <span className={theme.text}>{proposal.split(/\s+/).filter(Boolean).length.toLocaleString()}</span>
        </p>
        <p className={`text-xs ${theme.textFaint}`}>
          Tip: You can edit the proposal directly or use the chat below for AI-assisted revisions
        </p>
      </div>
    </div>
  );
}


