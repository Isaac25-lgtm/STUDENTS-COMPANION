import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Settings, 
  ChevronDown, 
  FileCheck, 
  Hash, 
  BookOpen, 
  Shield,
  ArrowLeft,
  Loader2,
  Copy
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getProject, saveProject } from '../../utils/courseworkStorage';
import { convertMarkdownToDocx } from '../../utils/markdownToDocx';
import type { CourseworkProject } from '../../types/coursework';

export default function ReviewExport() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { darkMode } = useTheme();
  
  const [project, setProject] = useState<CourseworkProject | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    format: 'docx',
    spacing: 'double',
    includeCoverPage: true,
    includeReferences: true,
    includePageNumbers: true
  });

  useEffect(() => {
    if (!id) {
      navigate('/coursework');
      return;
    }

    const existingProject = getProject(id);
    if (!existingProject) {
      navigate('/coursework');
      return;
    }

    setProject(existingProject);
  }, [id, navigate]);

  const getFullContent = (): string => {
    if (!project) return '';
    
    if (project.fullContent) {
      return project.fullContent;
    }
    
    if (project.outline && project.outline.length > 0) {
      return project.outline.join('\n\n');
    }
    
    return project.sections
      .filter(s => s.content)
      .map(s => `## ${s.name}\n\n${s.content}`)
      .join('\n\n');
  };

  const getTotalWords = (): number => {
    const content = getFullContent();
    return content.split(/\s+/).filter(w => w.length > 0).length;
  };

  const getReferencesCount = (): number => {
    const content = getFullContent();
    const citationMatches = content.match(/\([A-Z][a-z]+,?\s*\d{4}\)/g) || [];
    const bracketMatches = content.match(/\[\d+\]/g) || [];
    return Math.max(citationMatches.length, bracketMatches.length, 5); // Minimum assumed
  };

  const getChecks = () => {
    if (!project) return [];
    
    const content = getFullContent();
    const wordCount = getTotalWords();
    const targetWords = project.wordCount || 2500;
    const tolerance = targetWords * 0.1;

    const checks = [
      { 
        label: 'Addresses the main topic', 
        status: content.length > 500 ? 'pass' : 'warning',
        fix: content.length <= 500 ? 'Add more content' : undefined
      },
      { 
        label: `Word count is appropriate (${wordCount.toLocaleString()} words)`, 
        status: Math.abs(wordCount - targetWords) <= tolerance ? 'pass' : 'warning',
        fix: wordCount < targetWords - tolerance ? `Add ${targetWords - wordCount} more words` : undefined
      },
      { 
        label: 'Has introduction', 
        status: content.toLowerCase().includes('introduction') || project.sections[0]?.content ? 'pass' : 'warning',
        fix: 'Add an introduction section'
      },
      { 
        label: 'Has literature review', 
        status: content.toLowerCase().includes('literature') ? 'pass' : 'warning' 
      },
      { 
        label: 'Has methodology', 
        status: content.toLowerCase().includes('method') ? 'pass' : 'warning' 
      },
      { 
        label: 'Has conclusion', 
        status: content.toLowerCase().includes('conclusion') ? 'pass' : 'warning' 
      },
      { 
        label: 'Sources cited', 
        status: getReferencesCount() >= 5 ? 'pass' : 'warning',
        fix: getReferencesCount() < 5 ? 'Add more citations' : undefined
      },
      { 
        label: 'Academic language', 
        status: !content.includes('I think') && !content.includes('you should') ? 'pass' : 'warning',
        fix: 'Remove informal language'
      },
    ];

    return checks;
  };

  const handleExport = async () => {
    if (!project) return;

    const content = getFullContent();
    const title = project.masterAnswers?.topic || project.assignmentText.substring(0, 50);
    
    await convertMarkdownToDocx(content, title, 'Student');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getFullContent());
    alert('Copied to clipboard!');
  };

  if (!project) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const checks = getChecks();
  const passCount = checks.filter(c => c.status === 'pass').length;
  const totalCount = checks.length;
  const totalWords = getTotalWords();
  const referencesCount = getReferencesCount();

  const stats = [
    { label: 'Words', value: totalWords.toLocaleString(), icon: Hash, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' },
    { label: 'References', value: referencesCount.toString(), icon: BookOpen, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' },
    { label: 'Quality', value: `${Math.round((passCount / totalCount) * 100)}%`, icon: Shield, color: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b px-6 py-4`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/coursework/write/${id}`)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Ready to Download!
              </h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {project.masterAnswers?.topic || 'Your Coursework'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-3 py-2 rounded-full">
            <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">✦ 847 credits</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Score */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-1">{passCount} of {totalCount} Checks Passed</h2>
          <p className="text-white/80">
            {passCount === totalCount 
              ? 'Your essay is ready for submission!' 
              : 'Review the warnings below before submitting.'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((stat, idx) => (
            <div key={idx} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${darkMode ? 'border-gray-700' : ''} p-4 text-center`}>
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Checklist */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl border ${darkMode ? 'border-gray-700' : ''} p-5 mb-6`}>
          <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quality Checklist</h3>
          <div className="space-y-3">
            {checks.map((check, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {check.status === 'pass' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{check.label}</span>
                </div>
                {check.fix && (
                  <button 
                    onClick={() => navigate(`/coursework/write/${id}`)}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Fix
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Settings Toggle */}
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`w-full flex items-center justify-between p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${darkMode ? 'border-gray-700' : ''} mb-6 hover:bg-opacity-80 transition-colors`}
        >
          <div className="flex items-center gap-3">
            <Settings className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Download Settings</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
        </button>

        {showSettings && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${darkMode ? 'border-gray-700' : ''} p-5 mb-6 -mt-4`}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`text-sm mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Format</label>
                <select 
                  value={exportSettings.format}
                  onChange={(e) => setExportSettings({...exportSettings, format: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                >
                  <option value="docx">Word (.docx)</option>
                  <option value="pdf" disabled>PDF (Coming Soon)</option>
                </select>
              </div>
              <div>
                <label className={`text-sm mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Spacing</label>
                <select 
                  value={exportSettings.spacing}
                  onChange={(e) => setExportSettings({...exportSettings, spacing: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                >
                  <option value="double">Double</option>
                  <option value="1.5">1.5</option>
                  <option value="single">Single</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <input 
                  type="checkbox" 
                  checked={exportSettings.includeCoverPage}
                  onChange={(e) => setExportSettings({...exportSettings, includeCoverPage: e.target.checked})}
                  className="rounded border-gray-300 text-indigo-600" 
                />
                Cover page
              </label>
              <label className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <input 
                  type="checkbox" 
                  checked={exportSettings.includeReferences}
                  onChange={(e) => setExportSettings({...exportSettings, includeReferences: e.target.checked})}
                  className="rounded border-gray-300 text-indigo-600" 
                />
                References
              </label>
              <label className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <input 
                  type="checkbox" 
                  checked={exportSettings.includePageNumbers}
                  onChange={(e) => setExportSettings({...exportSettings, includePageNumbers: e.target.checked})}
                  className="rounded border-gray-300 text-indigo-600" 
                />
                Page numbers
              </label>
            </div>
          </div>
        )}

        {/* Download Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Download className="w-5 h-5" />
            Download Essay
          </button>
          <button 
            onClick={() => setShowPreview(true)}
            className={`px-6 py-4 border-2 rounded-xl font-semibold transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <Eye className="w-5 h-5" />
          </button>
          <button 
            onClick={copyToClipboard}
            className={`px-6 py-4 border-2 rounded-xl font-semibold transition-all ${darkMode ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : ''} flex items-center justify-between`}>
              <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Preview</h2>
              <button 
                onClick={() => setShowPreview(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className={`prose max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {getFullContent()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


