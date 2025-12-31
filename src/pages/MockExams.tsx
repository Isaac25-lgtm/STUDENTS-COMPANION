import { useState } from 'react';
import { Brain, Play, Clock, Target, Trophy, ChevronRight, BookOpen, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function MockExams() {
  const { darkMode, theme } = useTheme();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const examModes = [
    { id: 'practice', name: 'Practice Mode', desc: 'Untimed, with hints available', icon: BookOpen, color: 'blue' },
    { id: 'timed', name: 'Timed Exam', desc: 'Simulate real exam conditions', icon: Clock, color: 'amber' },
    { id: 'challenge', name: 'Challenge Mode', desc: 'Adaptive difficulty', icon: Zap, color: 'violet' },
  ];

  const questionTypes = [
    { id: 'mcq', name: 'Multiple Choice', count: 25 },
    { id: 'short', name: 'Short Answer', count: 15 },
    { id: 'essay', name: 'Essay Questions', count: 8 },
  ];

  const recentExams = [
    { id: 1, subject: 'Biochemistry', score: 78, total: 100, date: 'Yesterday' },
    { id: 2, subject: 'Statistics', score: 85, total: 100, date: '3 days ago' },
    { id: 3, subject: 'Public Health', score: 72, total: 100, date: '1 week ago' },
  ];

  const colorClasses = {
    blue: { bg: darkMode ? 'bg-blue-900/60' : 'bg-blue-100', text: darkMode ? 'text-blue-400' : 'text-blue-600' },
    amber: { bg: darkMode ? 'bg-amber-900/60' : 'bg-amber-100', text: darkMode ? 'text-amber-400' : 'text-amber-600' },
    violet: { bg: darkMode ? 'bg-violet-900/60' : 'bg-violet-100', text: darkMode ? 'text-violet-400' : 'text-violet-600' },
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-cyan-900/60' : 'bg-cyan-100'}`}>
            <Brain className={`w-6 h-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Mock Exams</h1>
            <p className={`text-sm ${theme.textMuted}`}>Practice with AI-generated questions from your notes</p>
          </div>
        </div>
      </div>

      {/* Exam Modes */}
      <section className="mb-8">
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>Choose Mode</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {examModes.map((mode) => {
            const colors = colorClasses[mode.color as keyof typeof colorClasses];
            return (
              <button
                key={mode.id}
                className={`p-5 rounded-2xl border text-left transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  darkMode 
                    ? 'bg-slate-800/70 border-slate-700/50 hover:border-cyan-700' 
                    : 'bg-white/80 border-slate-200/60 hover:border-cyan-400'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-3`}>
                  <mode.icon className={`w-6 h-6 ${colors.text}`} strokeWidth={1.5} />
                </div>
                <p className={`font-medium ${theme.text}`}>{mode.name}</p>
                <p className={`text-sm ${theme.textFaint} mt-1`}>{mode.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick Start */}
      <div className={`mb-8 p-6 rounded-2xl border ${theme.card}`}>
        <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Quick Start</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium ${theme.textMuted} mb-3`}>Difficulty Level</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedDifficulty(level)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedDifficulty === level
                      ? level === 'easy' 
                        ? 'bg-emerald-600 text-white'
                        : level === 'medium'
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                      : `${theme.card} border ${theme.cardHover}`
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.textMuted} mb-3`}>Question Types</label>
            <div className="flex flex-wrap gap-2">
              {questionTypes.map((type) => (
                <span 
                  key={type.id}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {type.name} ({type.count})
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-dashed" style={{ borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
          <div className="flex items-center gap-3">
            <BookOpen className={`w-5 h-5 ${theme.textFaint}`} />
            <span className={`text-sm ${theme.text}`}>Using: <strong>BIO201 — Biochemistry</strong></span>
          </div>
          <button className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
            darkMode 
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
              : 'bg-cyan-600 hover:bg-cyan-700 text-white'
          } shadow-lg shadow-cyan-500/20`}>
            <Play className="w-4 h-4" />
            Start Exam
          </button>
        </div>
      </div>

      {/* Recent Results */}
      <section>
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>Recent Results</h2>
        <div className={`${theme.card} rounded-2xl border overflow-hidden`}>
          {recentExams.map((exam, i) => (
            <div 
              key={exam.id}
              className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
              } ${i !== recentExams.length - 1 ? `border-b ${theme.divider}` : ''}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                exam.score >= 80 
                  ? darkMode ? 'bg-emerald-900/60' : 'bg-emerald-100'
                  : exam.score >= 60
                  ? darkMode ? 'bg-amber-900/60' : 'bg-amber-100'
                  : darkMode ? 'bg-rose-900/60' : 'bg-rose-100'
              }`}>
                <Trophy className={`w-5 h-5 ${
                  exam.score >= 80 
                    ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                    : exam.score >= 60
                    ? darkMode ? 'text-amber-400' : 'text-amber-600'
                    : darkMode ? 'text-rose-400' : 'text-rose-600'
                }`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${theme.text}`}>{exam.subject}</p>
                <p className={`text-xs ${theme.textFaint}`}>{exam.date}</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${
                  exam.score >= 80 
                    ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                    : exam.score >= 60
                    ? darkMode ? 'text-amber-400' : 'text-amber-600'
                    : darkMode ? 'text-rose-400' : 'text-rose-600'
                }`}>
                  {exam.score}%
                </p>
                <p className={`text-xs ${theme.textFaint}`}>{exam.score}/{exam.total}</p>
              </div>
              <ChevronRight className={`w-4 h-4 ${theme.textFaint}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

