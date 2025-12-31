import { Link, useLocation } from 'react-router-dom';
import { BookOpen, FileText, Plus, Brain, MessageCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function MobileNav() {
  const { darkMode, theme } = useTheme();
  const location = useLocation();

  const navItems = [
    { icon: BookOpen, label: 'Study', path: '/study-pack' },
    { icon: FileText, label: 'Work', path: '/coursework' },
    { icon: Plus, label: '', path: '/', isAction: true },
    { icon: Brain, label: 'Exams', path: '/mock-exams' },
    { icon: MessageCircle, label: 'Ask', path: '/ask' },
  ];

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${
      darkMode ? 'bg-slate-900/95' : 'bg-white/95'
    } backdrop-blur-xl border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'} px-4 py-2 z-50`}>
      <div className="flex items-center justify-around">
        {navItems.map((item, i) => {
          const isActive = location.pathname === item.path;
          
          if (item.isAction) {
            return (
              <Link
                key={i}
                to={item.path}
                className="flex flex-col items-center gap-0.5 p-2 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white -mt-6 shadow-lg shadow-orange-500/30"
              >
                <item.icon className="w-6 h-6" strokeWidth={1.5} />
              </Link>
            );
          }

          return (
            <Link
              key={i}
              to={item.path}
              className="flex flex-col items-center gap-0.5 p-2"
            >
              <item.icon 
                className={`w-5 h-5 ${isActive ? theme.accent : theme.textFaint}`} 
                strokeWidth={1.5} 
              />
              <span className={`text-[10px] ${isActive ? theme.accent : theme.textFaint}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

