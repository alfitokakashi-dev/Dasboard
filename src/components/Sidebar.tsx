import React from 'react';
import { 
  LayoutDashboard, 
  Split, 
  KeyRound, 
  FileCode2, 
  Cloud, 
  ShieldCheck, 
  Gamepad2, 
  UserCheck,
  Flame,
  Radio,
  BookOpen
} from 'lucide-react';
import { UserRole } from '../types';

export type TabType = 
  | 'overview' 
  | 'webhooks' 
  | 'api-keys' 
  | 'lua-hub' 
  | 'cloudflare' 
  | 'simulator' 
  | 'whitelist' 
  | 'profile';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  userRole: UserRole;
  pendingUsersCount: number;
  isPendingUser: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  pendingUsersCount,
  isPendingUser
}) => {
  const navItems = [
    {
      id: 'overview' as TabType,
      label: 'Ringkasan & Feed',
      subtitle: 'Statistik & Transaksi',
      icon: LayoutDashboard,
      badge: null,
      ownerOnly: false
    },
    {
      id: 'simulator' as TabType,
      label: 'Roblox Simulator',
      subtitle: 'Coba donasi realtime',
      icon: Gamepad2,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      ownerOnly: false
    },
    {
      id: 'webhooks' as TabType,
      label: 'Bagi Hasil Webhook',
      subtitle: 'Saweria & Sociabuzz split',
      icon: Split,
      badge: null,
      ownerOnly: false
    },
    {
      id: 'api-keys' as TabType,
      label: 'Roblox API Keys',
      subtitle: 'Secret game & endpoint',
      icon: KeyRound,
      badge: null,
      ownerOnly: false
    },
    {
      id: 'lua-hub' as TabType,
      label: 'Roblox Lua Scripts',
      subtitle: 'Server, UI & Custom Lua',
      icon: FileCode2,
      badge: 'Script Anda',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      ownerOnly: false
    },
    {
      id: 'cloudflare' as TabType,
      label: 'Cloudflare Worker',
      subtitle: 'Kode worker.js & panduan',
      icon: Cloud,
      badge: null,
      ownerOnly: false
    },
    {
      id: 'whitelist' as TabType,
      label: 'Owner Whitelist',
      subtitle: 'Kontrol izin & user masuk',
      icon: ShieldCheck,
      badge: pendingUsersCount > 0 ? `${pendingUsersCount} Pending` : 'Owner',
      badgeColor: pendingUsersCount > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      ownerOnly: true
    },
    {
      id: 'profile' as TabType,
      label: 'Discord & Roblox',
      subtitle: 'Status verifikasi akun',
      icon: UserCheck,
      badge: null,
      ownerOnly: false
    }
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 bg-[#0A0E17] border-b lg:border-b-0 lg:border-r border-slate-800/80 p-3 lg:p-4 flex flex-col gap-6">
      {/* Navigation Links */}
      <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
        <div className="hidden lg:block px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Main Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isRestricted = item.ownerOnly && userRole !== 'owner';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              disabled={isPendingUser && item.id !== 'profile'}
              className={`group relative flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-left transition-all whitespace-nowrap lg:whitespace-normal cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/40 shadow-lg shadow-indigo-950/40'
                  : 'hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-transparent'
              } ${isRestricted ? 'opacity-70' : ''} ${isPendingUser && item.id !== 'profile' ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-slate-900 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="hidden lg:block min-w-0">
                  <div className="text-xs font-semibold tracking-tight truncate flex items-center gap-1.5">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
                <span className="lg:hidden text-xs font-semibold">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}

              {isActive && (
                <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Help Card */}
      <div className="hidden lg:block mt-auto p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-slate-800/80">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-1">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Cara Kerja Sistem:</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
          Donatur bayar via Saweria / Sociabuzz ➔ Webhook kirim ke Cloudflare Worker ➔ Roblox Server ambil via API Key ➔ Pemain langsung dapat Cash di game!
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
          <span className="text-emerald-400 font-semibold">● 100% Anti-Dupe</span>
          <span className="text-slate-400 font-mono">v2.4 LTS</span>
        </div>
      </div>
    </aside>
  );
};
