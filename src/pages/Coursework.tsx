import { useState } from 'react';
import { FileText, Plus, Sparkles, Clock, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Coursework() {
  const { darkMode, theme } = useTheme();
  const [step, setStep] = useState<'select' | 'configure' | 'generate'>('select');

  const recentDrafts = [
    { id: 1, title: 'BIO201 Essay: Cell Metabolism', status: 'In Progress', progress: 60, date: '2h ago' },
    { id: 2, title: 'Research Methods Assignment', status: 'Completed', progress: 100, date: 'Yesterday' },
    { id: 3, title: 'Public Health Case Study', status: 'Draft', progress: 30, date: '3 days ago' },
  ];

  const taskTypes = [
    { id: 'essay', name: 'Essay', desc: 'Argumentative or analytical essay', icon: '📝' },
    { id: 'report', name: 'Report', desc: 'Structured academic report', icon: '📊' },
    { id: 'case-study', name: 'Case Study', desc: 'Analysis of a specific case', icon: '🔍' },
    { id: 'literature', name: 'Literature Review', desc: 'Review of existing research', icon: '📚' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-violet-900/60' : 'bg-violet-100'}`}>
            <FileText className={`w-6 h-6 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Coursework Generator</h1>
            <p className={`text-sm ${theme.textMuted}`}>Turn assignment briefs into structured drafts</p>
          </div>
        </div>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
          darkMode 
            ? 'bg-violet-600 hover:bg-violet-500 text-white' 
            : 'bg-violet-600 hover:bg-violet-700 text-white'
        } shadow-lg shadow-violet-500/20`}>
          <Plus className="w-4 h-4" strokeWidth={2} />
          New Draft
        </button>
      </div>

      {/* Info Banner */}
      <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 ${
        darkMode ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-100'
      }`}>
        <AlertCircle className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
        <div>
          <p className={`text-sm font-medium ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
            Academic Integrity Notice
          </p>
          <p className={`text-sm ${darkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
            Generated drafts include [PLACEHOLDER] markers where you must add your own analysis and critical thinking. 
            All citations reference your uploaded Study Pack materials.
          </p>
        </div>
      </div>

      {/* New Draft Wizard */}
      <div className={`mb-8 p-6 rounded-2xl ${theme.card} border`}>
        <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Start a New Draft</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {taskTypes.map((type) => (
            <button
              key={type.id}
              className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${
                darkMode 
                  ? 'bg-slate-700/50 border-slate-600 hover:border-violet-500' 
                  : 'bg-white border-slate-200 hover:border-violet-400'
              }`}
            >
              <span className="text-2xl mb-2 block">{type.icon}</span>
              <p className={`font-medium text-sm ${theme.text}`}>{type.name}</p>
              <p className={`text-xs ${theme.textFaint} mt-0.5`}>{type.desc}</p>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Assignment Brief</label>
            <textarea 
              placeholder="Paste your assignment question or brief here..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none resize-none border ${
                darkMode 
                  ? 'bg-slate-800 border-slate-600 text-slate-200 placeholder-slate-500 focus:border-violet-500' 
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-400'
              } transition-colors`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Word Count</label>
              <input 
                type="number" 
                placeholder="e.g., 2000"
                className={`w-full px-4 py-3 rounded-xl text-sm outline-none border ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-600 text-slate-200 placeholder-slate-500 focus:border-violet-500' 
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-400'
                } transition-colors`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Study Pack</label>
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
                darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'
              }`}>
                <BookOpen className={`w-4 h-4 ${theme.textFaint}`} />
                <span className={`text-sm ${theme.text}`}>BIO201 — Biochemistry</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className={`flex items-center gap-2 text-sm ${theme.textFaint}`}>
              <Sparkles className="w-4 h-4" />
              <span>Estimated cost: <strong className={theme.accent}>35 credits</strong></span>
            </div>
            <button className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
              darkMode 
                ? 'bg-violet-600 hover:bg-violet-500 text-white' 
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}>
              <Sparkles className="w-4 h-4" />
              Generate Draft
            </button>
          </div>
        </div>
      </div>

      {/* Recent Drafts */}
      <section>
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>Recent Drafts</h2>
        <div className={`${theme.card} rounded-2xl border overflow-hidden`}>
          {recentDrafts.map((draft, i) => (
            <div 
              key={draft.id}
              className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
              } ${i !== recentDrafts.length - 1 ? `border-b ${theme.divider}` : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                darkMode ? 'bg-violet-900/60' : 'bg-violet-100'
              }`}>
                <FileText className={`w-5 h-5 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${theme.text} truncate`}>{draft.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-1.5 w-24 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div 
                      className={`h-full rounded-full ${draft.progress === 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
                      style={{ width: `${draft.progress}%` }}
                    />
                  </div>
                  <span className={`text-xs ${theme.textFaint}`}>{draft.progress}%</span>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${theme.textFaint}`}>
                <Clock className="w-3.5 h-3.5" />
                {draft.date}
              </div>
              <ChevronRight className={`w-4 h-4 ${theme.textFaint}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

