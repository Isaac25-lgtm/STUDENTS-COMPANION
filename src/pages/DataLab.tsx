import { FlaskConical, Upload, BarChart3, TrendingUp, Table, FileSpreadsheet, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function DataLab() {
  const { darkMode, theme } = useTheme();

  const analysisTypes = [
    { id: 'descriptive', name: 'Descriptive Stats', desc: 'Mean, median, mode, SD', icon: '📊' },
    { id: 'chi-square', name: 'Chi-Square Test', desc: 'Categorical relationships', icon: '🔢' },
    { id: 't-test', name: 'T-Test', desc: 'Compare two groups', icon: '⚖️' },
    { id: 'anova', name: 'ANOVA', desc: 'Compare multiple groups', icon: '📈' },
    { id: 'correlation', name: 'Correlation', desc: 'Variable relationships', icon: '🔗' },
    { id: 'regression', name: 'Regression', desc: 'Predictive modeling', icon: '📉' },
  ];

  const recentAnalyses = [
    { id: 1, name: 'Survey Results Analysis', type: 'Chi-Square', date: 'Yesterday', status: 'Completed' },
    { id: 2, name: 'Health Outcomes Data', type: 'ANOVA', date: '3 days ago', status: 'Completed' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-emerald-900/60' : 'bg-emerald-100'}`}>
            <FlaskConical className={`w-6 h-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Data Analysis Lab</h1>
            <p className={`text-sm ${theme.textMuted}`}>CSV → Chapter 4 in minutes</p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className={`mb-8 p-8 rounded-2xl border-2 border-dashed text-center transition-all ${
        darkMode 
          ? 'border-emerald-800/50 bg-emerald-950/20 hover:border-emerald-600/50' 
          : 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
      }`}>
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
          darkMode ? 'bg-emerald-900/60' : 'bg-emerald-100'
        }`}>
          <FileSpreadsheet className={`w-8 h-8 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} strokeWidth={1.5} />
        </div>
        <p className={`font-medium ${theme.text} mb-1`}>Upload your data file</p>
        <p className={`text-sm ${theme.textFaint} mb-4`}>CSV or Excel files supported</p>
        <button className={`flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl font-medium transition-all ${
          darkMode 
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        } shadow-lg shadow-emerald-500/20`}>
          <Upload className="w-4 h-4" strokeWidth={2} />
          Choose File
        </button>
      </div>

      {/* Analysis Types */}
      <section className="mb-8">
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>Statistical Tests</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {analysisTypes.map((type) => (
            <button
              key={type.id}
              className={`p-4 rounded-2xl border text-left transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                darkMode 
                  ? 'bg-slate-800/70 border-slate-700/50 hover:border-emerald-700' 
                  : 'bg-white/80 border-slate-200/60 hover:border-emerald-400'
              }`}
            >
              <span className="text-2xl mb-2 block">{type.icon}</span>
              <p className={`font-medium text-sm ${theme.text}`}>{type.name}</p>
              <p className={`text-xs ${theme.textFaint} mt-0.5`}>{type.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Output Preview */}
      <section className="mb-8">
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>What You Get</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-2xl border ${theme.card}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              darkMode ? 'bg-blue-900/60' : 'bg-blue-100'
            }`}>
              <Table className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <p className={`font-medium text-sm ${theme.text}`}>Formatted Tables</p>
            <p className={`text-xs ${theme.textFaint} mt-1`}>Publication-ready tables with proper APA formatting</p>
          </div>
          <div className={`p-4 rounded-2xl border ${theme.card}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              darkMode ? 'bg-violet-900/60' : 'bg-violet-100'
            }`}>
              <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} />
            </div>
            <p className={`font-medium text-sm ${theme.text}`}>Visualizations</p>
            <p className={`text-xs ${theme.textFaint} mt-1`}>Charts and graphs ready for your dissertation</p>
          </div>
          <div className={`p-4 rounded-2xl border ${theme.card}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              darkMode ? 'bg-amber-900/60' : 'bg-amber-100'
            }`}>
              <Sparkles className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
            <p className={`font-medium text-sm ${theme.text}`}>Written Interpretation</p>
            <p className={`text-xs ${theme.textFaint} mt-1`}>Results section draft with academic language</p>
          </div>
        </div>
      </section>

      {/* Recent Analyses */}
      <section>
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>Recent Analyses</h2>
        <div className={`${theme.card} rounded-2xl border overflow-hidden`}>
          {recentAnalyses.map((analysis, i) => (
            <div 
              key={analysis.id}
              className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
              } ${i !== recentAnalyses.length - 1 ? `border-b ${theme.divider}` : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                darkMode ? 'bg-emerald-900/60' : 'bg-emerald-100'
              }`}>
                <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${theme.text}`}>{analysis.name}</p>
                <p className={`text-xs ${theme.textFaint}`}>{analysis.type}</p>
              </div>
              <span className={`text-xs ${theme.textFaint}`}>{analysis.date}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                darkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {analysis.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

