import { Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface Deadline {
  id: number;
  title: string;
  course: string;
  dueIn: string;
  urgent: boolean;
}

export default function DeadlinesWidget() {
  const { darkMode, theme } = useTheme();

  const deadlines: Deadline[] = [
    { id: 1, title: 'Lab Report #3', course: 'BIO201', dueIn: 'Tomorrow', urgent: true },
    { id: 2, title: 'Statistics Assignment', course: 'STA301', dueIn: '3 days', urgent: false },
    { id: 3, title: 'Literature Review Draft', course: 'RM201', dueIn: '1 week', urgent: false },
  ];

  if (deadlines.length === 0) return null;

  return (
    <div className={`p-5 rounded-2xl border ${
      darkMode 
        ? 'bg-gradient-to-br from-rose-950/30 to-slate-800/50 border-rose-900/30' 
        : 'bg-gradient-to-br from-rose-50 to-white border-rose-100'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${darkMode ? 'text-rose-400' : 'text-rose-500'}`} />
          <h3 className={`font-semibold ${theme.text}`}>Upcoming Deadlines</h3>
        </div>
        <Link 
          to="#" 
          className={`text-sm font-medium ${darkMode ? 'text-rose-400' : 'text-rose-600'} hover:underline`}
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {deadlines.map((deadline) => (
          <div 
            key={deadline.id}
            className={`flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer ${
              darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-rose-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              deadline.urgent
                ? darkMode ? 'bg-rose-900/60' : 'bg-rose-100'
                : darkMode ? 'bg-slate-700' : 'bg-slate-100'
            }`}>
              {deadline.urgent ? (
                <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-rose-400' : 'text-rose-500'}`} />
              ) : (
                <Clock className={`w-5 h-5 ${theme.textFaint}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${theme.text} truncate`}>{deadline.title}</p>
              <p className={`text-sm ${theme.textFaint}`}>{deadline.course}</p>
            </div>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              deadline.urgent
                ? darkMode ? 'bg-rose-900/60 text-rose-300' : 'bg-rose-100 text-rose-700'
                : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}>
              {deadline.dueIn}
            </span>
            <ChevronRight className={`w-4 h-4 ${theme.textFaint}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

