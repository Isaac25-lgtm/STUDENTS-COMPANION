import { useTheme } from '../contexts/ThemeContext';

export default function Footer() {
  const { darkMode, theme } = useTheme();

  return (
    <footer className={`mt-auto border-t ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'} backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className={`text-sm ${theme.textMuted}`}>
            © Students Companion {new Date().getFullYear()} All rights reserved
          </p>

          {/* Links */}
          <div className="flex items-center gap-2 text-sm">
            <a 
              href="#"
              className={`${theme.textMuted} hover:${theme.text} transition-colors`}
            >
              Citation
            </a>
            <span className={theme.textFaint}>|</span>
            <a 
              href="#"
              className={`${theme.textMuted} hover:${theme.text} transition-colors`}
            >
              Students Companion Website
            </a>
            <span className={theme.textFaint}>|</span>
            <a 
              href="#"
              className={`${theme.textMuted} hover:${theme.text} transition-colors`}
            >
              Privacy Policy
            </a>
            <span className={theme.textFaint}>|</span>
            <a 
              href="#"
              className={`${theme.textMuted} hover:${theme.text} transition-colors`}
            >
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
