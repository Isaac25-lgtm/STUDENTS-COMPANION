import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface LowCreditsWarningProps {
  credits: number;
  threshold?: number;
}

export default function LowCreditsWarning({ credits, threshold = 100 }: LowCreditsWarningProps) {
  const { darkMode, theme } = useTheme();

  if (credits > threshold) return null;

  return (
    <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between ${
      darkMode 
        ? 'bg-amber-900/30 border border-amber-800/50' 
        : 'bg-amber-50 border border-amber-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          darkMode ? 'bg-amber-900/60' : 'bg-amber-100'
        }`}>
          <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
        </div>
        <div>
          <p className={`font-semibold ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
            Low Credits Warning
          </p>
          <p className={`text-sm ${darkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
            Only <strong>{credits}</strong> credits remaining. Top up to continue using all features.
          </p>
        </div>
      </div>
      <Link 
        to="/credits" 
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
          darkMode 
            ? 'bg-amber-600 hover:bg-amber-500 text-white' 
            : 'bg-amber-500 hover:bg-amber-600 text-white'
        }`}
      >
        Top Up <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

