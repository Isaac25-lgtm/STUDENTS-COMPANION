import { Settings as SettingsIcon, User, Bell, Shield, Palette, HelpCircle, LogOut, ChevronRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { darkMode, toggleTheme, theme } = useTheme();

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', desc: 'Name, email, university', action: 'edit' },
        { icon: Shield, label: 'Security', desc: 'Password and login', action: 'edit' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', desc: 'Email and SMS alerts', action: 'toggle', enabled: true },
        { icon: Palette, label: 'Appearance', desc: 'Theme and display', action: 'theme' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', desc: 'FAQs and guides', action: 'link' },
      ]
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
            <SettingsIcon className={`w-6 h-6 ${theme.textFaint}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Settings</h1>
            <p className={`text-sm ${theme.textMuted}`}>Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className={`mb-8 p-5 rounded-2xl border ${theme.card}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-xl font-semibold text-white shadow-lg shadow-indigo-500/20">
            IO
          </div>
          <div className="flex-1">
            <h2 className={`text-lg font-semibold ${theme.text}`}>Isaac Omoding</h2>
            <p className={`text-sm ${theme.textMuted}`}>isaac.omoding@ucu.ac.ug</p>
            <p className={`text-xs ${theme.textFaint} mt-1`}>MSc. Data Science & Analytics • Year 2</p>
          </div>
          <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            darkMode 
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Settings Groups */}
      <div className="space-y-6">
        {settingsGroups.map((group, gi) => (
          <section key={gi}>
            <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-3`}>{group.title}</h2>
            <div className={`${theme.card} rounded-2xl border overflow-hidden`}>
              {group.items.map((item, i) => (
                <div 
                  key={i}
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
                  } ${i !== group.items.length - 1 ? `border-b ${theme.divider}` : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      darkMode ? 'bg-slate-700' : 'bg-slate-100'
                    }`}>
                      <item.icon className={`w-5 h-5 ${theme.textFaint}`} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${theme.text}`}>{item.label}</p>
                      <p className={`text-xs ${theme.textFaint}`}>{item.desc}</p>
                    </div>
                  </div>
                  
                  {item.action === 'theme' ? (
                    <button 
                      onClick={toggleTheme}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        darkMode ? 'bg-slate-700' : 'bg-slate-100'
                      }`}
                    >
                      {darkMode ? (
                        <>
                          <Moon className="w-4 h-4 text-indigo-400" />
                          <span className={`text-sm ${theme.text}`}>Dark</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-4 h-4 text-amber-500" />
                          <span className={`text-sm ${theme.text}`}>Light</span>
                        </>
                      )}
                    </button>
                  ) : item.action === 'toggle' ? (
                    <button className={`relative w-11 h-6 rounded-full transition-colors ${
                      item.enabled 
                        ? 'bg-emerald-600' 
                        : darkMode ? 'bg-slate-600' : 'bg-slate-300'
                    }`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        item.enabled ? 'left-6' : 'left-1'
                      }`} />
                    </button>
                  ) : (
                    <ChevronRight className={`w-5 h-5 ${theme.textFaint}`} />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Logout */}
      <div className="mt-8">
        <button className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl border transition-colors ${
          darkMode 
            ? 'border-rose-900/50 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400' 
            : 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600'
        }`}>
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>

      {/* App Info */}
      <div className="mt-8 text-center">
        <p className={`text-xs ${theme.textFaint}`}>Students Companion v1.0.0</p>
        <p className={`text-xs ${theme.textFaint} mt-1`}>Built for Ugandan University Students</p>
      </div>
    </div>
  );
}

