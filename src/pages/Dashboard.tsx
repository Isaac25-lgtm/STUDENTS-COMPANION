import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, FileText, FlaskConical, GraduationCap, Briefcase, Brain, 
  ClipboardList, MessageCircle, ChevronRight, Upload, Plus, ArrowRight, 
  Sparkles, Clock, TrendingUp, Flame
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { darkMode, theme } = useTheme();
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  const modules = [
    { id: 'study-pack', path: '/study-pack', name: 'Study Pack', icon: BookOpen, desc: 'Upload notes, textbooks & past papers → your foundation',
      light: { card: 'bg-blue-50 border-2 border-blue-300 hover:border-blue-400', bg: 'bg-blue-100', icon: 'text-blue-600' },
      dark: { card: 'bg-blue-950/50 border-2 border-blue-700 hover:border-blue-500', bg: 'bg-blue-900/60', icon: 'text-blue-400' }
    },
    { id: 'coursework', path: '/coursework', name: 'Coursework', icon: FileText, desc: 'Assignment briefs → cited drafts with placeholders for your input',
      light: { card: 'bg-violet-50 border-2 border-violet-300 hover:border-violet-400', bg: 'bg-violet-100', icon: 'text-violet-600' },
      dark: { card: 'bg-violet-950/50 border-2 border-violet-700 hover:border-violet-500', bg: 'bg-violet-900/60', icon: 'text-violet-400' }
    },
    { id: 'research', path: '/research', name: 'Research', icon: GraduationCap, desc: 'Proposals, lit reviews & thesis → Bachelors to PhD',
      light: { card: 'bg-amber-50 border-2 border-amber-300 hover:border-amber-400', bg: 'bg-amber-100', icon: 'text-amber-600' },
      dark: { card: 'bg-amber-950/50 border-2 border-amber-700 hover:border-amber-500', bg: 'bg-amber-900/60', icon: 'text-amber-400' }
    },
    { id: 'data-lab', path: '/data-lab', name: 'Data Analysis Lab', icon: FlaskConical, desc: 'Quantitative & qualitative analysis → Chapter 4 ready',
      light: { card: 'bg-emerald-50 border-2 border-emerald-300 hover:border-emerald-400', bg: 'bg-emerald-100', icon: 'text-emerald-600' },
      dark: { card: 'bg-emerald-950/50 border-2 border-emerald-700 hover:border-emerald-500', bg: 'bg-emerald-900/60', icon: 'text-emerald-400' }
    },
    { id: 'report-gen', path: '/report-generator', name: 'Report Generator', icon: ClipboardList, desc: 'Lab reports, case studies & field reports → formatted & cited',
      light: { card: 'bg-indigo-50 border-2 border-indigo-300 hover:border-indigo-400', bg: 'bg-indigo-100', icon: 'text-indigo-600' },
      dark: { card: 'bg-indigo-950/50 border-2 border-indigo-700 hover:border-indigo-500', bg: 'bg-indigo-900/60', icon: 'text-indigo-400' }
    },
    { id: 'mock-exams', path: '/mock-exams', name: 'Mock Exams', icon: Brain, desc: 'Practice questions generated from your notes & past papers',
      light: { card: 'bg-cyan-50 border-2 border-cyan-300 hover:border-cyan-400', bg: 'bg-cyan-100', icon: 'text-cyan-600' },
      dark: { card: 'bg-cyan-950/50 border-2 border-cyan-700 hover:border-cyan-500', bg: 'bg-cyan-900/60', icon: 'text-cyan-400' }
    },
    { id: 'opportunities', path: '/opportunities', name: 'Opportunities', icon: Briefcase, desc: 'Internships, jobs & scholarships → matched to your CV',
      light: { card: 'bg-rose-50 border-2 border-rose-300 hover:border-rose-400', bg: 'bg-rose-100', icon: 'text-rose-600' },
      dark: { card: 'bg-rose-950/50 border-2 border-rose-700 hover:border-rose-500', bg: 'bg-rose-900/60', icon: 'text-rose-400' }
    },
    { id: 'ask', path: '/ask', name: 'Ask', icon: MessageCircle, desc: 'AI-powered academic assistant → concepts made simple',
      light: { card: 'bg-orange-50 border-2 border-orange-300 hover:border-orange-400', bg: 'bg-orange-100', icon: 'text-orange-600' },
      dark: { card: 'bg-orange-950/50 border-2 border-orange-700 hover:border-orange-500', bg: 'bg-orange-900/60', icon: 'text-orange-400' }
    },
  ];

  const recentWork = [
    { title: 'BIO201 Assignment Draft', type: 'Coursework', time: '2h ago', icon: FileText, path: '/coursework',
      light: { bg: 'bg-violet-100', icon: 'text-violet-600' },
      dark: { bg: 'bg-violet-900/60', icon: 'text-violet-400' }
    },
    { title: 'Biochemistry Notes', type: 'Upload', time: '5h ago', icon: Upload, path: '/study-pack',
      light: { bg: 'bg-blue-100', icon: 'text-blue-600' },
      dark: { bg: 'bg-blue-900/60', icon: 'text-blue-400' }
    },
    { title: 'Statistics Practice', type: 'Exam', time: 'Yesterday', icon: Brain, path: '/mock-exams',
      light: { bg: 'bg-cyan-100', icon: 'text-cyan-600' },
      dark: { bg: 'bg-cyan-900/60', icon: 'text-cyan-400' }
    },
  ];

  const studyPacks = [
    { name: 'Biochemistry', code: 'BIO', docs: 12, active: true },
    { name: 'Biostatistics', code: 'STA', docs: 8, active: false },
    { name: 'Public Health', code: 'PH', docs: 15, active: false },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="animate-fade-in flex gap-6">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Profile and Stats */}
        <div className="grid lg:grid-cols-4 gap-6 mb-6">
          {/* User Profile Card */}
          <div className={`lg:col-span-3 p-6 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-slate-800/80 to-slate-800/50 border-slate-700/50' : 'bg-gradient-to-br from-white/80 to-blue-50/30 border-slate-200/60'} border backdrop-blur-sm`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
                  IO
                </div>
                <div>
                  <p className={`text-sm ${theme.textMuted} mb-1`}>{getGreeting()}</p>
                  <h1 className={`text-2xl font-bold ${theme.text} mb-2`}>Isaac Omoding</h1>
                  <div className={`flex items-center gap-2 text-sm ${theme.textMuted} mb-2`}>
                    <span className={`px-3 py-1 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-white/80 border border-slate-200'}`}>MSc. Data Science & Analytics</span>
                    <span className={`px-3 py-1 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-white/80 border border-slate-200'}`}>Year 2</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${theme.textFaint} mb-4`}>
                    <span>Uganda Christian University</span>
                    <span>•</span>
                    <span>Faculty of Science & Technology</span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <Flame className={`w-5 h-5 ${darkMode ? 'text-orange-400' : 'text-orange-500'}`} />
                      <span className={`text-sm font-semibold ${theme.textMuted}`}>7 day streak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-5 h-5 ${theme.textFaint}`} />
                      <span className={`text-sm ${theme.textFaint}`}>3 tasks due this week</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-sky-900/40 text-sky-400' : 'bg-sky-50 text-sky-700'} text-sm font-medium`}>
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                BIO201 Active
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: '35', sub: 'docs', icon: Upload, light: 'bg-blue-50/90 border-blue-100 text-blue-600', dark: 'bg-blue-950/40 border-blue-900/50 text-blue-400' },
              { value: '24', sub: 'tasks', icon: FileText, light: 'bg-emerald-50/90 border-emerald-100 text-emerald-600', dark: 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400' },
              { value: '7', sub: 'streak', icon: TrendingUp, light: 'bg-violet-50/90 border-violet-100 text-violet-600', dark: 'bg-violet-950/40 border-violet-900/50 text-violet-400' },
              { value: '92%', sub: 'score', icon: Brain, light: 'bg-amber-50/90 border-amber-100 text-amber-600', dark: 'bg-amber-950/40 border-amber-900/50 text-amber-400' },
            ].map((stat, i) => (
              <div key={i} className={`p-3 rounded-xl border text-center transition-all duration-200 hover:shadow-md ${darkMode ? stat.dark : stat.light}`}>
                <stat.icon className="w-4 h-4 mx-auto mb-1 opacity-70" strokeWidth={1.5} />
                <p className={`text-xl font-bold ${theme.text}`}>{stat.value}</p>
                <p className={`text-[10px] ${theme.textFaint}`}>{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Study Pack Banner */}
        <div className={`mb-6 p-5 rounded-2xl flex items-center justify-between overflow-hidden relative ${
          darkMode ? 'bg-gradient-to-r from-sky-900 to-indigo-900' : 'bg-gradient-to-r from-sky-600 to-indigo-600'
        }`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
            }} />
          </div>
          <div className="flex items-center gap-4 relative">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <div className="text-white">
              <p className="text-sm text-sky-200">Active Study Pack</p>
              <p className="text-xl font-bold">BIO201 — Biochemistry</p>
              <p className="text-sm text-sky-200">12 documents • Updated today</p>
            </div>
          </div>
          <Link to="/study-pack" className="relative text-sm font-medium bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl transition-colors backdrop-blur">
            Switch
          </Link>
        </div>

        {/* Modules Grid */}
        <section className={`mb-8 p-5 rounded-2xl border-2 ${darkMode ? 'border-slate-600 bg-slate-800/30' : 'border-slate-300 bg-white/50'}`}>
          <h2 className={`text-base font-bold ${theme.text} mb-5`}>Modules</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((m, index) => {
              const colors = darkMode ? m.dark : m.light;
              return (
                <Link
                  key={m.id}
                  to={m.path}
                  onMouseEnter={() => setHoveredModule(m.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                  className={`group p-5 rounded-2xl ${colors.card} transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-0.5`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4 transition-transform duration-300 ${hoveredModule === m.id ? 'scale-110' : ''}`}>
                    <m.icon className={`w-6 h-6 ${colors.icon}`} strokeWidth={1.5} />
                  </div>
                  <p className={`font-bold ${theme.text} mb-1`}>{m.name}</p>
                  <p className={`text-sm ${theme.textFaint} leading-relaxed line-clamp-2`}>{m.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent Activity and Study Packs */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <section className={`lg:col-span-2 p-5 rounded-2xl border-2 ${darkMode ? 'border-slate-600 bg-slate-800/30' : 'border-slate-300 bg-white/50'}`}>
            <h2 className={`text-base font-bold ${theme.text} mb-5`}>Recent Activity</h2>
            <div className={`${theme.card} rounded-2xl border overflow-hidden`}>
              {recentWork.map((item, i) => {
                const colors = darkMode ? item.dark : item.light;
                return (
                  <Link 
                    key={i} 
                    to={item.path}
                    className={`flex items-center gap-4 p-5 cursor-pointer transition-all duration-200 ${
                      darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
                    } ${i !== recentWork.length - 1 ? `border-b ${theme.divider}` : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <item.icon className={`w-6 h-6 ${colors.icon}`} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${theme.text} truncate`}>{item.title}</p>
                      <p className={`text-sm ${theme.textFaint}`}>{item.type}</p>
                    </div>
                    <span className={`text-sm ${theme.textFaint}`}>{item.time}</span>
                    <ChevronRight className={`w-5 h-5 ${theme.textFaint}`} />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Study Packs */}
          <section className={`p-5 rounded-2xl border-2 ${darkMode ? 'border-slate-600 bg-slate-800/30' : 'border-slate-300 bg-white/50'}`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-base font-bold ${theme.text}`}>Study Packs</h2>
              <Link 
                to="/study-pack"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' : 'bg-amber-50 hover:bg-amber-100 text-amber-600'
                }`}
              >
                <Plus className="w-5 h-5" strokeWidth={2} />
              </Link>
            </div>
            <div className="space-y-3">
              {studyPacks.map((pack, i) => (
                <Link 
                  key={i}
                  to="/study-pack"
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    pack.active 
                      ? darkMode 
                        ? 'bg-sky-900/30 border-2 border-sky-700/50' 
                        : 'bg-sky-50 border-2 border-sky-200'
                      : `${theme.card} border hover:shadow-md ${theme.cardHover}`
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                    pack.active 
                      ? 'bg-sky-600 text-white' 
                      : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {pack.code}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${pack.active ? darkMode ? 'text-sky-300' : 'text-sky-900' : theme.text}`}>
                      {pack.name}
                    </p>
                    <p className={`text-sm ${pack.active ? darkMode ? 'text-sky-400/70' : 'text-sky-600' : theme.textFaint}`}>
                      {pack.docs} documents
                    </p>
                  </div>
                  {pack.active && <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-pulse" />}
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* CTA Banner */}
        <div className={`mt-8 p-6 rounded-2xl flex items-center justify-between overflow-hidden relative ${
          darkMode ? 'bg-gradient-to-r from-amber-900 to-orange-900' : 'bg-gradient-to-r from-amber-500 to-orange-500'
        }`}>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")'
          }} />
          <div className="relative">
            <p className="text-xl font-bold text-white">Need help with an assignment?</p>
            <p className="text-white/80 mt-1">The Coursework Generator can structure your draft in minutes.</p>
          </div>
          <Link to="/coursework" className="relative flex items-center gap-2 bg-white px-6 py-3 rounded-xl font-semibold text-amber-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
