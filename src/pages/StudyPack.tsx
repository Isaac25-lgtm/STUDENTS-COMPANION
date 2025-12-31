import { useState } from 'react';
import { BookOpen, Upload, FileText, Image, Search, Plus, MoreVertical, Check, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function StudyPack() {
  const { darkMode, theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'papers' | 'textbooks'>('all');

  const studyPacks = [
    { id: 1, name: 'Biochemistry', code: 'BIO201', docs: 12, active: true, color: 'sky' },
    { id: 2, name: 'Biostatistics', code: 'STA301', docs: 8, active: false, color: 'violet' },
    { id: 3, name: 'Public Health', code: 'PH101', docs: 15, active: false, color: 'emerald' },
    { id: 4, name: 'Research Methods', code: 'RM201', docs: 6, active: false, color: 'amber' },
  ];

  const documents = [
    { id: 1, name: 'Lecture Notes Week 1-4.pdf', type: 'notes', size: '2.4 MB', date: 'Today', pages: 45 },
    { id: 2, name: 'Biochemistry Textbook Ch1-5.pdf', type: 'textbooks', size: '15.2 MB', date: 'Yesterday', pages: 120 },
    { id: 3, name: 'Past Paper 2023.pdf', type: 'papers', size: '1.1 MB', date: '2 days ago', pages: 8 },
    { id: 4, name: 'Lab Manual.pdf', type: 'notes', size: '3.8 MB', date: '3 days ago', pages: 32 },
    { id: 5, name: 'Past Paper 2022.pdf', type: 'papers', size: '980 KB', date: '1 week ago', pages: 8 },
  ];

  const filteredDocs = activeTab === 'all' ? documents : documents.filter(d => d.type === activeTab);

  const tabs = [
    { id: 'all', label: 'All', count: documents.length },
    { id: 'notes', label: 'Notes', count: documents.filter(d => d.type === 'notes').length },
    { id: 'papers', label: 'Past Papers', count: documents.filter(d => d.type === 'papers').length },
    { id: 'textbooks', label: 'Textbooks', count: documents.filter(d => d.type === 'textbooks').length },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-900/60' : 'bg-blue-100'}`}>
              <BookOpen className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${theme.text}`}>Study Pack</h1>
              <p className={`text-sm ${theme.textMuted}`}>Upload and manage your course materials</p>
            </div>
          </div>
        </div>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
          darkMode 
            ? 'bg-blue-600 hover:bg-blue-500 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30`}>
          <Upload className="w-4 h-4" strokeWidth={2} />
          Upload Files
        </button>
      </div>

      {/* Study Packs Grid */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider`}>Your Study Packs</h2>
          <button className={`flex items-center gap-1.5 text-sm ${theme.accent} hover:underline`}>
            <Plus className="w-4 h-4" />
            New Pack
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {studyPacks.map((pack) => (
            <div 
              key={pack.id}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                pack.active
                  ? darkMode 
                    ? 'bg-sky-900/30 border-sky-700/50 ring-2 ring-sky-500/30' 
                    : 'bg-sky-50 border-sky-200 ring-2 ring-sky-400/30'
                  : `${theme.card} ${theme.cardHover}`
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                  pack.active 
                    ? 'bg-sky-600 text-white' 
                    : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {pack.code.slice(0, 3)}
                </div>
                {pack.active && (
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    darkMode ? 'bg-sky-800 text-sky-300' : 'bg-sky-100 text-sky-700'
                  }`}>
                    <Check className="w-3 h-3" />
                    Active
                  </div>
                )}
              </div>
              <p className={`font-medium text-sm ${pack.active ? (darkMode ? 'text-sky-300' : 'text-sky-900') : theme.text}`}>
                {pack.name}
              </p>
              <p className={`text-xs ${pack.active ? (darkMode ? 'text-sky-400/70' : 'text-sky-600') : theme.textFaint}`}>
                {pack.docs} documents
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Upload Zone */}
      <div className={`mb-8 p-8 rounded-2xl border-2 border-dashed text-center transition-colors ${
        darkMode 
          ? 'border-slate-600 bg-slate-800/30 hover:border-blue-500/50 hover:bg-blue-950/20' 
          : 'border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/50'
      }`}>
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
          darkMode ? 'bg-slate-700' : 'bg-white'
        }`}>
          <Upload className={`w-8 h-8 ${theme.textFaint}`} strokeWidth={1.5} />
        </div>
        <p className={`font-medium ${theme.text} mb-1`}>Drop files here or click to upload</p>
        <p className={`text-sm ${theme.textFaint} mb-4`}>PDF, Word documents, or images of handwritten notes</p>
        <div className="flex items-center justify-center gap-4">
          <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
            darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}>
            <FileText className="w-4 h-4" />
            Documents
          </button>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
            darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}>
            <Image className="w-4 h-4" />
            Images
          </button>
        </div>
      </div>

      {/* Documents List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? darkMode ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'
                    : `${theme.textMuted} hover:${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`
                }`}
              >
                {tab.label} <span className="opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-2 ${theme.input} rounded-xl px-3 py-2 border`}>
            <Search className={`w-4 h-4 ${theme.textFaint}`} strokeWidth={1.5} />
            <input 
              type="text" 
              placeholder="Search documents..." 
              className={`bg-transparent text-sm outline-none w-40 ${theme.text}`} 
            />
          </div>
        </div>

        <div className={`${theme.card} rounded-2xl border overflow-hidden`}>
          {filteredDocs.map((doc, i) => (
            <div 
              key={doc.id}
              className={`flex items-center gap-4 p-4 transition-colors ${
                darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
              } ${i !== filteredDocs.length - 1 ? `border-b ${theme.divider}` : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                darkMode ? 'bg-slate-700' : 'bg-slate-100'
              }`}>
                <FileText className={`w-5 h-5 ${theme.textFaint}`} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${theme.text} truncate`}>{doc.name}</p>
                <p className={`text-xs ${theme.textFaint}`}>{doc.pages} pages • {doc.size}</p>
              </div>
              <span className={`text-xs ${theme.textFaint}`}>{doc.date}</span>
              <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                <MoreVertical className={`w-4 h-4 ${theme.textFaint}`} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

