import React, { useState } from 'react';
import { User, UserRole, WhitelistRule } from '../types';
import { 
  ShieldCheck, 
  UserCheck, 
  ExternalLink, 
  Gamepad2, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Lock, 
  Sparkles,
  Copy,
  Check,
  Crown,
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  rules: WhitelistRule[];
  onLoginAsUser: (user: User) => void;
  onRegisterCustomUser: (customUser: User) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  rules,
  onLoginAsUser,
  onRegisterCustomUser,
  showToast
}) => {
  if (!isOpen) return null;

  const [authMode, setAuthMode] = useState<'custom' | 'switch'>('custom');

  // Custom Login Form state
  const [discordUsername, setDiscordUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [robloxUsername, setRobloxUsername] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [generatedVerifyCode] = useState(`RBX-${Math.floor(100000 + Math.random() * 900000)}`);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedVerifyCode);
    setCopiedCode(true);
    showToast('info', 'Kode Disalin', 'Tempel kode ini di About / Bio profil Roblox Anda untuk verifikasi.');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDiscordUser = discordUsername.trim();
    const cleanDiscordId = discordId.trim() || String(Math.floor(100000000000000000 + Math.random() * 900000000000000000));
    const cleanRobloxUser = robloxUsername.trim();

    if (!cleanDiscordUser) {
      showToast('error', 'Username Discord Kosong', 'Harap masukkan username Discord Anda.');
      return;
    }
    if (!cleanRobloxUser) {
      showToast('error', 'Username Roblox Kosong', 'Harap masukkan username Roblox Anda untuk ditautkan.');
      return;
    }

    // Check Whitelist Match
    const isOwnerMatch = 
      cleanDiscordUser.toLowerCase().includes('masal') ||
      cleanDiscordId === '782910294857291029' ||
      cleanRobloxUser.toLowerCase() === 'masalownerrbx';

    const matchedRule = rules.find((r) => 
      (r.type === 'discord_id' && r.value === cleanDiscordId) ||
      (r.type === 'roblox_username' && r.value.toLowerCase() === cleanRobloxUser.toLowerCase())
    );

    let role: UserRole = 'member';
    let status: 'approved' | 'pending' = 'pending';

    if (isOwnerMatch) {
      role = 'owner';
      status = 'approved';
    } else if (matchedRule) {
      role = matchedRule.grantedRole;
      status = 'approved';
    }

    const generatedUserId = `usr-${Date.now().toString().slice(-6)}`;
    const avatarIndex = (cleanDiscordUser.length % 5) + 1;
    const discordAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`;
    const robloxUserId = String(Math.floor(100000000 + Math.random() * 900000000));
    const robloxAvatarUrl = `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-11D51D57A576628A6DFFBC6987A137C2-Png/150/150/AvatarHeadshot/Webp/noFilter`;

    const newUser: User = {
      id: generatedUserId,
      discordId: cleanDiscordId,
      discordUsername: cleanDiscordUser,
      discordTag: `${cleanDiscordUser}#0001`,
      discordAvatar,
      robloxUsername: cleanRobloxUser,
      robloxUserId,
      robloxAvatarUrl,
      robloxVerified: true,
      verificationCode: generatedVerifyCode,
      role,
      status,
      joinedAt: new Date().toISOString().split('T')[0],
      lastActive: 'Baru saja'
    };

    onRegisterCustomUser(newUser);
    onClose();

    if (status === 'approved') {
      showToast('success', `Selamat Datang, ${cleanDiscordUser}!`, `Akun Anda terverifikasi sebagai ${role.toUpperCase()}.`);
    } else {
      showToast('info', 'Permintaan Akses Terkirim', `Akun Anda tercatat sebagai Pending Review. Akun Owner dapat menyetujui akses Anda di tab Whitelist.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl animate-in zoom-in-95 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                Portal Masuk Discord & Roblox
              </h3>
              <p className="text-xs text-slate-400">
                Sistem Otorisasi DonateCash dengan Verifikasi Whitelist Owner
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setAuthMode('custom')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              authMode === 'custom'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hubungkan Akun Saya
          </button>
          <button
            onClick={() => setAuthMode('switch')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              authMode === 'switch'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pilih Profil Demo / Role
          </button>
        </div>

        {/* Tab 1: Connect Custom Discord & Roblox */}
        {authMode === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Catatan Akses Owner:
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Jika Anda adalah pemilik game (Owner), gunakan username Discord Anda atau Roblox <code className="text-amber-300 font-mono">MasalOwnerRBX</code> untuk langsung mendapatkan hak akses penuh. Pengguna lain akan dimasukkan ke antrian verifikasi Owner.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Username Discord Anda:
              </label>
              <input
                type="text"
                required
                placeholder="misal: masal_dev atau nama_anda"
                value={discordUsername}
                onChange={(e) => setDiscordUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Discord User ID (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="782910294857291029"
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Username Roblox Anda:
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: MasalOwnerRBX"
                  value={robloxUsername}
                  onChange={(e) => setRobloxUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-amber-300 font-mono outline-none"
                />
              </div>
            </div>

            {/* Verification code helper */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Kode Verifikasi Bio Roblox:</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{generatedVerifyCode}</div>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Tersalin' : 'Salin Kode'}
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer transition-all flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Masuk & Hubungkan Akun
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Switch Preset Demo Accounts */}
        {authMode === 'switch' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              Pilih profil di bawah untuk menguji dashboard dari berbagai sudut pandang hak akses:
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      onLoginAsUser(u);
                      onClose();
                      showToast('info', 'Beralih Akun', `Sekarang login sebagai ${u.discordUsername} (${u.role.toUpperCase()})`);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/80 border-slate-800 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.discordAvatar}
                        alt={u.discordUsername}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{u.discordUsername}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            u.role === 'owner' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                            u.role === 'developer' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Roblox: <span className="text-amber-300 font-mono">@{u.robloxUsername || 'Belum link'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {u.status === 'approved' ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
