import { Sparkles, Plus, TrendingDown, Gift, Ticket, Building2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Credits() {
  const { darkMode, theme } = useTheme();

  const pricingPlans = [
    { 
      amount: '15,000', 
      credits: '1.5K', 
      label: 'Starter', 
      popular: false,
      features: ['Coursework drafts', 'Basic data analysis', 'Proposal building', 'Report generation'],
    },
    { 
      amount: '35,000', 
      credits: '4K', 
      label: 'Popular', 
      popular: true,
      features: ['Everything in Starter', 'Multiple analysis rounds', 'Extended research support', 'Thesis chapter drafts'],
      note: 'Great for final year projects'
    },
    { 
      amount: '50,000', 
      credits: '6K', 
      label: 'Best Value', 
      popular: false,
      features: ['Everything in Popular', 'Heavy quantitative analysis', 'Full dissertation support', 'Unlimited revisions'],
      note: 'Masters & PhD recommended'
    },
  ];

  const usageHistory = [
    { task: 'Coursework Draft', credits: -35, date: 'Today, 2:30 PM' },
    { task: 'Data Analysis', credits: -45, date: 'Yesterday, 4:15 PM' },
    { task: 'Mock Exam (25 questions)', credits: -15, date: '2 days ago' },
    { task: 'Credit Top-up', credits: +1500, date: '1 week ago' },
  ];

  const weeklyUsage = [40, 25, 60, 35, 80, 45, 20];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-emerald-900/60' : 'bg-emerald-100'}`}>
            <Sparkles className={`w-6 h-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Credits</h1>
            <p className={`text-sm ${theme.textMuted}`}>Manage your balance and usage</p>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className={`mb-8 p-6 rounded-2xl overflow-hidden relative ${
        darkMode ? 'bg-gradient-to-br from-emerald-900 to-teal-900' : 'bg-gradient-to-br from-emerald-600 to-teal-600'
      }`}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-emerald-200 text-sm mb-1">Current Balance</p>
            <p className="text-4xl font-bold text-white mb-2">847 <span className="text-lg font-normal text-emerald-200">credits</span></p>
            <p className="text-emerald-200 text-sm">≈ 25 coursework drafts remaining</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-sm mb-3`}>
              <TrendingDown className="w-4 h-4" />
              153 used this week
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Usage Chart */}
      <div className={`mb-8 p-5 rounded-2xl border ${theme.card}`}>
        <h2 className={`text-sm font-semibold ${theme.text} mb-4`}>This Week's Usage</h2>
        <div className="flex items-end gap-2 h-24">
          {weeklyUsage.map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className={`w-full rounded-t transition-all ${
                  i === 4 ? 'bg-gradient-to-t from-amber-500 to-orange-400' : 
                  darkMode ? 'bg-slate-600' : 'bg-slate-200'
                }`}
                style={{ height: `${height}%` }}
              />
              <span className={`text-xs ${i === 4 ? (darkMode ? 'text-amber-400' : 'text-amber-600') : theme.textFaint}`}>
                {days[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Plans */}
      <section className="mb-8">
        <div className="text-center mb-6">
          <h2 className={`text-lg font-semibold ${theme.text} mb-1`}>Top Up Credits</h2>
          <p className={`text-sm ${theme.textFaint}`}>Pay with MTN or Airtel Mobile Money</p>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {pricingPlans.map((pack, i) => (
            <div 
              key={i} 
              className={`relative p-4 rounded-2xl border text-center transition-all duration-200 hover:shadow-lg cursor-pointer ${
                pack.popular 
                  ? darkMode 
                    ? 'bg-gradient-to-b from-amber-900/40 to-orange-900/40 border-amber-700/50 ring-2 ring-amber-500/30' 
                    : 'bg-gradient-to-b from-amber-50 to-orange-50 border-amber-200 ring-2 ring-amber-400/30'
                  : `${theme.card} ${theme.cardHover}`
              }`}
            >
              {pack.popular && (
                <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-amber-500 text-amber-950' : 'bg-amber-500 text-white'
                }`}>
                  {pack.label}
                </span>
              )}
              <p className={`text-xs ${theme.textFaint} mb-1 ${pack.popular ? 'mt-1' : ''}`}>{!pack.popular && pack.label}</p>
              <p className={`text-2xl font-bold ${pack.popular ? darkMode ? 'text-amber-400' : 'text-amber-600' : theme.text}`}>
                {pack.credits}
              </p>
              <p className={`text-xs ${theme.textFaint} mb-1`}>credits</p>
              <p className={`text-lg font-semibold ${theme.text}`}>{pack.amount}</p>
              <p className={`text-xs ${theme.textFaint} mb-3`}>UGX</p>
              
              <ul className="text-left space-y-1.5 mb-3">
                {pack.features.map((feature, j) => (
                  <li key={j} className={`text-xs ${theme.textMuted} flex items-start gap-1.5`}>
                    <span className={`mt-0.5 w-1 h-1 rounded-full flex-shrink-0 ${pack.popular ? 'bg-amber-500' : darkMode ? 'bg-slate-500' : 'bg-slate-400'}`} />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {pack.note && (
                <p className={`text-xs font-medium ${pack.popular ? darkMode ? 'text-amber-400' : 'text-amber-600' : darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  {pack.note}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="flex items-center justify-center gap-4 mt-5">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
            <div className="w-6 h-6 rounded bg-yellow-400 flex items-center justify-center text-xs font-bold text-yellow-900">M</div>
            <span className={`text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>MTN MoMo</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
            <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center text-xs font-bold text-white">A</div>
            <span className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Airtel Money</span>
          </div>
        </div>
      </section>

      {/* Gift & Redeem */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className={`p-4 rounded-2xl border ${theme.card}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-pink-900/40' : 'bg-pink-50'}`}>
              <Gift className={`w-5 h-5 ${darkMode ? 'text-pink-400' : 'text-pink-600'}`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${theme.text}`}>Gift Credits</p>
              <p className={`text-xs ${theme.textFaint}`}>Buy for a friend</p>
            </div>
          </div>
          <button className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${
            darkMode 
              ? 'bg-pink-900/40 hover:bg-pink-900/60 text-pink-300' 
              : 'bg-pink-50 hover:bg-pink-100 text-pink-700'
          }`}>
            Buy Gift Code
          </button>
        </div>

        <div className={`p-4 rounded-2xl border ${theme.card}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
              <Ticket className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${theme.text}`}>Redeem Code</p>
              <p className={`text-xs ${theme.textFaint}`}>Gift or promo code</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter code" 
              className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none border ${
                darkMode 
                  ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
            <button className={`px-4 py-2 rounded-lg text-sm font-medium ${
              darkMode 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}>
              Redeem
            </button>
          </div>
        </div>
      </div>

      {/* Enterprise */}
      <div className={`mb-8 p-5 rounded-2xl border-2 ${darkMode ? 'border-indigo-800/50 bg-gradient-to-br from-indigo-950/40 to-slate-900' : 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-indigo-900/60' : 'bg-indigo-100'}`}>
              <Building2 className={`w-6 h-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className={`font-semibold ${theme.text}`}>Enterprise & Institutions</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${darkMode ? 'bg-indigo-800 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                  Save 30%
                </span>
              </div>
              <p className={`text-sm ${theme.textMuted}`}>Universities can subscribe for students in bulk</p>
            </div>
          </div>
          <button className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${
            darkMode 
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}>
            Contact Sales
          </button>
        </div>
      </div>

      {/* Usage History */}
      <section>
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>Usage History</h2>
        <div className={`${theme.card} rounded-2xl border overflow-hidden`}>
          {usageHistory.map((item, i) => (
            <div 
              key={i}
              className={`flex items-center justify-between p-4 ${
                i !== usageHistory.length - 1 ? `border-b ${theme.divider}` : ''
              }`}
            >
              <div>
                <p className={`text-sm font-medium ${theme.text}`}>{item.task}</p>
                <p className={`text-xs ${theme.textFaint}`}>{item.date}</p>
              </div>
              <span className={`font-semibold ${
                item.credits > 0 
                  ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                  : theme.text
              }`}>
                {item.credits > 0 ? '+' : ''}{item.credits}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

