import { useTheme } from '../contexts/ThemeContext';

export default function Background() {
  const { darkMode } = useTheme();

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* 1. Subtle Noise Texture for Premium Feel */}
      <div 
        className="absolute inset-0 z-20 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 2. Professional Mesh Gradients */}
      {/* Top Left - Primary Blue */}
      <div className={`absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-40 animate-pulse ${
        darkMode ? 'bg-blue-900' : 'bg-blue-200'
      }`} style={{ animationDuration: '8s' }} />
      
      {/* Top Right - Cyan/Teal accent */}
      <div className={`absolute top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-30 animate-pulse ${
        darkMode ? 'bg-cyan-900' : 'bg-cyan-200'
      }`} style={{ animationDuration: '10s', animationDelay: '2s' }} />
      
      {/* Bottom Left - Indigo accent */}
      <div className={`absolute -bottom-[10%] left-[10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-30 animate-pulse ${
        darkMode ? 'bg-indigo-900' : 'bg-indigo-200'
      }`} style={{ animationDuration: '12s', animationDelay: '4s' }} />

      {/* 3. Modern Grid with Fade Mask */}
      <div 
        className={`absolute inset-0 z-10 ${darkMode ? 'opacity-[0.05]' : 'opacity-[0.4]'}`}
        style={{
          backgroundImage: `linear-gradient(${darkMode ? '#94a3b8' : '#cbd5e1'} 1px, transparent 1px), linear-gradient(90deg, ${darkMode ? '#94a3b8' : '#cbd5e1'} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(circle at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 40%, transparent 100%)'
        }}
      />
    </div>
  );
}
