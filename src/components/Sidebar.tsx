import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FolderOpen, CreditCard, Receipt, Settings, Bell, 
  ChevronRight, ChevronDown, Sparkles, Calendar, 
  HelpCircle, LogOut, User, Shield, Palette,
  FileText, Upload, Clock, Star, Zap
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ElementType;
  items?: { label: string; path?: string; badge?: string; onClick?: () => void }[];
  path?: string;
  badge?: string | number;
}

export default function Sidebar() {
  const { darkMode, theme } = useTheme();
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections: SidebarSection[] = [
    {
      id: 'documents',
      label: 'Stored Documents',
      icon: FolderOpen,
      badge: '47',
      items: [
        { label: 'All Documents', path: '/documents' },
        { label: 'Recent Uploads', path: '/documents/recent' },
        { label: 'Study Packs', path: '/study-pack' },
        { label: 'Starred', path: '/documents/starred' },
      ]
    },
    {
      id: 'upgrade',
      label: 'Upgrade',
      icon: Zap,
      items: [
        { label: 'View Plans', path: '/credits' },
        { label: 'Buy Credits', path: '/credits#buy' },
        { label: 'Redeem Code', path: '/credits#redeem' },
        { label: 'Gift Credits', path: '/credits#gift' },
      ]
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: Receipt,
      items: [
        { label: 'Payment History', path: '/billing/history' },
        { label: 'Payment Methods', path: '/billing/methods' },
        { label: 'Invoices', path: '/billing/invoices' },
      ]
    },
    {
      id: 'settings',
      label: 'Account Settings',
      icon: Settings,
      items: [
        { label: 'Profile', path: '/settings/profile' },
        { label: 'Security', path: '/settings/security' },
        { label: 'Preferences', path: '/settings/preferences' },
        { label: 'Appearance', path: '/settings/appearance' },
      ]
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: '3',
      items: [
        { label: 'All Notifications', path: '/notifications' },
        { label: 'Deadlines', path: '/notifications/deadlines' },
        { label: 'Updates', path: '/notifications/updates' },
        { label: 'Settings', path: '/notifications/settings' },
      ]
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const getItemIcon = (label: string) => {
    const icons: Record<string, React.ElementType> = {
      'All Documents': FileText,
      'Recent Uploads': Upload,
      'Study Packs': FolderOpen,
      'Starred': Star,
      'View Plans': CreditCard,
      'Buy Credits': Sparkles,
      'Redeem Code': Zap,
      'Gift Credits': CreditCard,
      'Payment History': Clock,
      'Payment Methods': CreditCard,
      'Invoices': Receipt,
      'Profile': User,
      'Security': Shield,
      'Preferences': Settings,
      'Appearance': Palette,
      'All Notifications': Bell,
      'Deadlines': Calendar,
      'Updates': Zap,
      'Settings': Settings,
    };
    return icons[label] || FileText;
  };

  return (
    <aside className={`w-64 flex-shrink-0 ${darkMode ? 'bg-slate-900/50' : 'bg-white/50'} backdrop-blur-sm rounded-2xl border ${darkMode ? 'border-slate-700/50' : 'border-slate-200/60'} p-3 h-fit sticky top-24`}>
      {/* Credits Summary */}
      <div className={`mb-4 p-4 rounded-xl ${darkMode ? 'bg-gradient-to-br from-emerald-900/40 to-slate-800/50' : 'bg-gradient-to-br from-emerald-50 to-white'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`text-sm font-bold ${theme.text}`}>Credits</span>
          </div>
        </div>
        <p className={`text-3xl font-extrabold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>847</p>
        <p className={`text-xs ${theme.textFaint} mb-3`}>Available balance</p>
        <Link 
          to="/credits"
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            darkMode 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          Top Up
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          const hasItems = section.items && section.items.length > 0;

          return (
            <div key={section.id}>
              {/* Section Header */}
              <button
                onClick={() => hasItems && toggleSection(section.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                  isExpanded 
                    ? darkMode 
                      ? 'bg-slate-800/80 text-white' 
                      : 'bg-slate-100 text-slate-900'
                    : darkMode
                      ? 'hover:bg-slate-800/50 text-slate-300'
                      : 'hover:bg-slate-100/80 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isExpanded
                      ? darkMode
                        ? 'bg-slate-700'
                        : 'bg-white shadow-sm'
                      : darkMode
                        ? 'bg-slate-800/50'
                        : 'bg-slate-100/80'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      isExpanded
                        ? darkMode ? 'text-white' : 'text-slate-700'
                        : theme.textMuted
                    }`} strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-semibold">{section.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {section.badge && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      darkMode 
                        ? 'bg-slate-700 text-slate-300' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {section.badge}
                    </span>
                  )}
                  {hasItems && (
                    isExpanded 
                      ? <ChevronDown className={`w-4 h-4 ${theme.textFaint}`} />
                      : <ChevronRight className={`w-4 h-4 ${theme.textFaint}`} />
                  )}
                </div>
              </button>

              {/* Expanded Items */}
              {hasItems && isExpanded && (
                <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-0.5">
                  {section.items?.map((item, index) => {
                    const ItemIcon = getItemIcon(item.label);
                    const isActive = item.path && location.pathname === item.path;
                    
                    return (
                      <Link
                        key={index}
                        to={item.path || '#'}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          isActive
                            ? darkMode
                              ? 'bg-blue-900/30 text-blue-400'
                              : 'bg-blue-50 text-blue-700'
                            : darkMode
                              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <ItemIcon className="w-4 h-4" strokeWidth={1.5} />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
                            darkMode ? 'bg-rose-900/50 text-rose-400' : 'bg-rose-100 text-rose-600'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Divider */}
      <div className={`my-4 border-t ${darkMode ? 'border-slate-700/50' : 'border-slate-200'}`} />

      {/* Quick Links */}
      <div className="space-y-1">
        <Link
          to="/help"
          className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-all ${
            darkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
          <span>Help & Support</span>
        </Link>
        <button
          className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-all ${
            darkMode
              ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-900/20'
              : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
          }`}
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

