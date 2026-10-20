import React from 'react';
import { User } from '../types';
import { 
  Zap, 
  ShieldCheck, 
  CloudLightning, 
  Gamepad2, 
  ChevronDown, 
  UserCheck, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  onOpenDonateModal: () => void;
  onOpenAuthModal: () => void;
  serverCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  onOpenDonateModal,
  onOpenAuthModal,
  serverCount
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Owner</span>;
      case 'admin':
        return <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>;
      case 'developer':
        return <span className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Developer</span>;
      default:
        return <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Member</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base lg:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              DonateCash <span className="text-indigo-400 font-mono text-xs font-semibold px-1.5 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20 ml-1">ROBLOX</span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Cloudflare Worker • Sociabuzz & Saweria Revenue Split Hub
          </p>
        </div>
      </div>

      {/* Center Live Badges */}
      <div className="hidden md:flex items-center gap-2.5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Worker:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Active (Edge)
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Roblox Games:</span>
          <span className="text-slate-200 font-semibold">{serverCount} Live Servers</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Test Donation Button */}
        <button
          onClick={onOpenDonateModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span className="hidden sm:inline">Simulasi Donasi</span>
          <span className="sm:hidden">Donasi</span>
        </button>

        {/* User Switcher / Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          >
            {/* Discord Avatar with Roblox mini-badge */}
            <div className="relative">
              <img
                src={currentUser.discordAvatar}
                alt={currentUser.discordUsername}
                className="w-8 h-8 rounded-lg object-cover border border-indigo-500/40"
              />
              {currentUser.robloxVerified && (
                <div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center" 
                  title={`Linked: ${currentUser.robloxUsername}`}
                >
                  <span className="text-[9px] font-black text-rose-400">R</span>
                </div>
              )}
            </div>

            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200">
                  {currentUser.discordUsername}
                </span>
                {getRoleBadge(currentUser.role)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentUser.robloxUsername ? `@${currentUser.robloxUsername}` : 'Belum link Roblox'}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Switch User Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>Ganti Akun Demo / Uji Akses:</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                  {currentUser.role.toUpperCase()}
                </span>
              </div>

              <div className="py-1 flex flex-col gap-1 max-h-64 overflow-y-auto">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setDropdownOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                      u.id === currentUser.id
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <img
                      src={u.discordAvatar}
                      alt={u.discordUsername}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">{u.discordUsername}</span>
                        {getRoleBadge(u.role)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                        <span>{u.robloxUsername ? `Roblox: ${u.robloxUsername}` : 'No Roblox'}</span>
                        {u.status === 'pending' && (
                          <span className="text-amber-400 bg-amber-500/10 px-1 rounded">Pending</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-slate-800 space-y-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  + Masuk / Hubungkan Akun Baru
                </button>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Owner Access Gate
                  </span>
                  <span className="text-[10px] text-slate-500">Discord OAuth</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
