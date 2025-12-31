import { Briefcase, Upload, Bell, MapPin, Calendar, ExternalLink, Filter, Search } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Opportunities() {
  const { darkMode, theme } = useTheme();

  const opportunities = [
    { 
      id: 1, 
      title: 'Data Science Intern', 
      company: 'MTN Uganda', 
      location: 'Kampala', 
      type: 'Internship',
      deadline: 'Jan 15, 2026',
      match: 92,
      tags: ['Python', 'Data Analysis', 'Statistics']
    },
    { 
      id: 2, 
      title: 'Graduate Research Fellow', 
      company: 'Makerere University', 
      location: 'Kampala', 
      type: 'Fellowship',
      deadline: 'Jan 30, 2026',
      match: 88,
      tags: ['Research', 'Public Health', 'Data']
    },
    { 
      id: 3, 
      title: 'Health Data Analyst', 
      company: 'UNICEF Uganda', 
      location: 'Kampala', 
      type: 'Job',
      deadline: 'Feb 10, 2026',
      match: 85,
      tags: ['Health Data', 'Analytics', 'Reporting']
    },
    { 
      id: 4, 
      title: 'Mastercard Foundation Scholarship', 
      company: 'Multiple Universities', 
      location: 'Global', 
      type: 'Scholarship',
      deadline: 'Mar 1, 2026',
      match: 78,
      tags: ['Masters', 'Full Funding', 'Leadership']
    },
  ];

  const typeColors = {
    'Internship': { bg: darkMode ? 'bg-blue-900/40' : 'bg-blue-100', text: darkMode ? 'text-blue-400' : 'text-blue-700' },
    'Fellowship': { bg: darkMode ? 'bg-violet-900/40' : 'bg-violet-100', text: darkMode ? 'text-violet-400' : 'text-violet-700' },
    'Job': { bg: darkMode ? 'bg-emerald-900/40' : 'bg-emerald-100', text: darkMode ? 'text-emerald-400' : 'text-emerald-700' },
    'Scholarship': { bg: darkMode ? 'bg-amber-900/40' : 'bg-amber-100', text: darkMode ? 'text-amber-400' : 'text-amber-700' },
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-rose-900/60' : 'bg-rose-100'}`}>
            <Briefcase className={`w-6 h-6 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Opportunities</h1>
            <p className={`text-sm ${theme.textMuted}`}>Jobs, internships & scholarships matched to you</p>
          </div>
        </div>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
          darkMode 
            ? 'bg-rose-600 hover:bg-rose-500 text-white' 
            : 'bg-rose-600 hover:bg-rose-700 text-white'
        } shadow-lg shadow-rose-500/20`}>
          <Upload className="w-4 h-4" strokeWidth={2} />
          Upload CV
        </button>
      </div>

      {/* CV Upload Banner */}
      <div className={`mb-6 p-4 rounded-2xl border-2 border-dashed ${
        darkMode 
          ? 'border-slate-600 bg-slate-800/30' 
          : 'border-slate-300 bg-slate-50/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              darkMode ? 'bg-rose-900/60' : 'bg-rose-100'
            }`}>
              <Upload className={`w-5 h-5 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
            </div>
            <div>
              <p className={`font-medium text-sm ${theme.text}`}>Upload your CV for better matches</p>
              <p className={`text-xs ${theme.textFaint}`}>We'll extract your skills and experience automatically</p>
            </div>
          </div>
          <button className={`px-4 py-2 rounded-xl text-sm font-medium ${
            darkMode 
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}>
            Upload CV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex items-center gap-2 ${theme.input} rounded-xl px-3 py-2 border flex-1`}>
          <Search className={`w-4 h-4 ${theme.textFaint}`} strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="Search opportunities..." 
            className={`bg-transparent text-sm outline-none w-full ${theme.text}`} 
          />
        </div>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
          darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-200'
        }`}>
          <Filter className={`w-4 h-4 ${theme.textFaint}`} />
          <span className={`text-sm ${theme.text}`}>Filters</span>
        </button>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
          darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-200'
        }`}>
          <Bell className={`w-4 h-4 ${theme.textFaint}`} />
          <span className={`text-sm ${theme.text}`}>Alerts</span>
        </button>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {opportunities.map((opp) => {
          const typeStyle = typeColors[opp.type as keyof typeof typeColors];
          return (
            <div 
              key={opp.id}
              className={`p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${theme.card} ${theme.cardHover}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${theme.text}`}>{opp.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                      {opp.type}
                    </span>
                  </div>
                  <p className={`text-sm ${theme.textMuted}`}>{opp.company}</p>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                  opp.match >= 90 
                    ? darkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    : opp.match >= 80
                    ? darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'
                    : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {opp.match}% match
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className={`flex items-center gap-1.5 text-sm ${theme.textFaint}`}>
                  <MapPin className="w-4 h-4" />
                  {opp.location}
                </div>
                <div className={`flex items-center gap-1.5 text-sm ${theme.textFaint}`}>
                  <Calendar className="w-4 h-4" />
                  Deadline: {opp.deadline}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {opp.tags.map((tag, i) => (
                    <span 
                      key={i}
                      className={`px-2 py-0.5 rounded text-xs ${
                        darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button className={`flex items-center gap-1.5 text-sm font-medium ${theme.accent}`}>
                  View Details <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

