import { ClipboardList, Plus, FileText, Download, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ReportGenerator() {
  const { darkMode, theme } = useTheme();

  const reportTypes = [
    { id: 'lab', name: 'Lab Report', desc: 'Scientific experiment documentation', icon: '🧪', sections: ['Introduction', 'Methods', 'Results', 'Discussion'] },
    { id: 'case-study', name: 'Case Study', desc: 'In-depth analysis of a subject', icon: '🔍', sections: ['Background', 'Analysis', 'Findings', 'Recommendations'] },
    { id: 'field', name: 'Field Report', desc: 'Observations and data collection', icon: '📋', sections: ['Objectives', 'Methodology', 'Observations', 'Conclusions'] },
    { id: 'project', name: 'Project Report', desc: 'Project documentation & outcomes', icon: '📁', sections: ['Overview', 'Implementation', 'Results', 'Evaluation'] },
  ];

  const recentReports = [
    { id: 1, title: 'Microbiology Lab Report #3', type: 'Lab Report', date: '2 days ago' },
    { id: 2, title: 'Community Health Field Study', type: 'Field Report', date: '1 week ago' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-indigo-900/60' : 'bg-indigo-100'}`}>
            <ClipboardList className={`w-6 h-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Report Generator</h1>
            <p className={`text-sm ${theme.textMuted}`}>Structured reports in minutes</p>
          </div>
        </div>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
          darkMode 
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        } shadow-lg shadow-indigo-500/20`}>
          <Plus className="w-4 h-4" strokeWidth={2} />
          New Report
        </button>
      </div>

      {/* Report Types */}
      <section className="mb-8">
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>Choose Report Type</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              className={`p-5 rounded-2xl border text-left transition-all hover:shadow-lg ${
                darkMode 
                  ? 'bg-slate-800/70 border-slate-700/50 hover:border-indigo-700' 
                  : 'bg-white/80 border-slate-200/60 hover:border-indigo-400'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{type.icon}</span>
                <div className="flex-1">
                  <p className={`font-medium ${theme.text}`}>{type.name}</p>
                  <p className={`text-sm ${theme.textFaint} mt-0.5`}>{type.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {type.sections.map((section, i) => (
                      <span 
                        key={i}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Export Options */}
      <div className={`mb-8 p-4 rounded-2xl border ${theme.card}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              darkMode ? 'bg-indigo-900/60' : 'bg-indigo-100'
            }`}>
              <Download className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <div>
              <p className={`font-medium text-sm ${theme.text}`}>Export Options</p>
              <p className={`text-xs ${theme.textFaint}`}>Download as Word document with proper formatting</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}>
              .docx
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}>
              .pdf
            </span>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <section>
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>Recent Reports</h2>
        <div className={`${theme.card} rounded-2xl border overflow-hidden`}>
          {recentReports.map((report, i) => (
            <div 
              key={report.id}
              className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
              } ${i !== recentReports.length - 1 ? `border-b ${theme.divider}` : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                darkMode ? 'bg-indigo-900/60' : 'bg-indigo-100'
              }`}>
                <FileText className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${theme.text}`}>{report.title}</p>
                <p className={`text-xs ${theme.textFaint}`}>{report.type}</p>
              </div>
              <span className={`text-xs ${theme.textFaint}`}>{report.date}</span>
              <ChevronRight className={`w-4 h-4 ${theme.textFaint}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

