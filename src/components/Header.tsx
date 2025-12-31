import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Search, Sparkles, Sun, Moon, Bell, Settings } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Header() {
  const { darkMode, toggleTheme, theme } = useTheme();
  const location = useLocation();

  return (
    <header className={`${theme.header} backdrop-blur-xl border-b sticky top-0 z-50 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/30 transition-shadow">
            <GraduationCap className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <span className={`font-bold ${theme.text}`}>Students Companion</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs ${theme.textFaint}`}>Your Academic Partner</span>
            </div>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          <div className={`hidden md:flex items-center gap-2 ${theme.input} rounded-xl px-3 py-2 border`}>
            <Search className={`w-4 h-4 ${theme.textFaint}`} strokeWidth={1.5} />
            <input 
              type="text" 
              placeholder="Search..." 
              className={`bg-transparent text-sm outline-none w-40 ${theme.text}`} 
            />
          </div>
          
          <Link 
            to="/credits"
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition-colors ${
              location.pathname === '/credits'
                ? darkMode ? 'bg-emerald-800/60 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                : darkMode ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
            <span className="font-bold text-sm">847</span>
            <span className="text-xs opacity-70 hidden sm:inline">credits</span>
          </Link>

          <button 
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl transition-all duration-300 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-amber-50 hover:bg-amber-100'}`}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" strokeWidth={1.5} /> : <Moon className="w-5 h-5 text-amber-600" strokeWidth={1.5} />}
          </button>
          
          <button className={`relative p-2.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-stone-100'}`}>
            <Bell className={`w-5 h-5 ${theme.textFaint}`} strokeWidth={1.5} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </button>

          <Link 
            to="/settings"
            className={`hidden sm:flex p-2.5 rounded-xl transition-colors ${
              location.pathname === '/settings'
                ? darkMode ? 'bg-slate-700' : 'bg-slate-200'
                : darkMode ? 'hover:bg-slate-800' : 'hover:bg-stone-100'
            }`}
          >
            <Settings className={`w-5 h-5 ${theme.textFaint}`} strokeWidth={1.5} />
          </Link>
          
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20 cursor-pointer hover:shadow-indigo-500/30 transition-shadow">
            IO
          </div>
        </div>
      </div>
    </header>
  );
}
