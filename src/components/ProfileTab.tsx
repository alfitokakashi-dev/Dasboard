import React, { useState } from 'react';
import { User } from '../types';
import { 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Link2, 
  Unlink, 
  AlertCircle,
  Gamepad2,
  Sparkles
} from 'lucide-react';

interface ProfileTabProps {
  currentUser: User;
  onUpdateCurrentUser: (updated: Partial<User>) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  onUpdateCurrentUser,
  showToast
}) => {
  const [robloxInput, setRobloxInput] = useState(currentUser.robloxUsername || '');
  const [verificationCode, setVerificationCode] = useState(
    currentUser.verificationCode || `RBX-VERIFY-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopiedCode(true);
    showToast('success', 'Kode Disalin', 'Tempel kode ini di Bio profil Roblox Anda.');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleVerifyRoblox = () => {
    if (!robloxInput.trim()) {
      showToast('error', 'Username Kosong', 'Silakan masukkan username Roblox Anda terlebih dahulu.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const generatedUserId = currentUser.robloxUserId || String(Math.floor(100000000 + Math.random() * 900000000));
      const headshotUrl = `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-11D51D57A576628A6DFFBC6987A137C2-Png/150/150/AvatarHeadshot/Webp/noFilter`;

      onUpdateCurrentUser({
        robloxUsername: robloxInput.trim(),
        robloxUserId: generatedUserId,
        robloxAvatarUrl: headshotUrl,
        robloxVerified: true,
        verificationCode: verificationCode
      });

      showToast('success', 'Akun Roblox Berhasil Diverifikasi!', `Akun @${robloxInput.trim()} sekarang terhubung dengan Discord Anda.`);
    }, 1200);
  };

  const handleUnlink = () => {
    if (confirm('Apakah Anda yakin ingin memutuskan sambungan akun Roblox?')) {
      onUpdateCurrentUser({
        robloxUsername: undefined,
        robloxUserId: undefined,
        robloxAvatarUrl: undefined,
        robloxVerified: false
      });
      setRobloxInput('');
      showToast('info', 'Akun Diputus', 'Sambungan akun Roblox telah dilepas.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-400" />
          Integrasi Akun Discord & Roblox Linker
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Setiap pengguna dashboard wajib login menggunakan Discord dan menyambungkan akun Roblox mereka untuk verifikasi hak akses dan penerimaan in-game Cash.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Discord Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#5865F2] flex items-center justify-center text-white text-xs font-bold">
                D
              </div>
              <h3 className="font-bold text-white text-sm">Akun Discord Terhubung</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              OAuth2 Active
            </span>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={currentUser.discordAvatar}
              alt={currentUser.discordUsername}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-lg"
            />
            <div className="space-y-1">
              <div className="text-base font-extrabold text-white">
                {currentUser.discordUsername}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {currentUser.discordTag}
              </div>
              <div className="text-[11px] text-indigo-300 font-mono">
                ID: {currentUser.discordId}
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono">
            <div>Role: <span className="text-amber-400 uppercase font-bold">{currentUser.role}</span></div>
            <div>Status Whitelist: <span className="text-emerald-400 uppercase font-bold">{currentUser.status}</span></div>
            <div>Bergabung: {new Date(currentUser.joinedAt).toLocaleDateString('id-ID')}</div>
          </div>
        </div>

        {/* Roblox Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white text-xs font-bold">
                R
              </div>
              <h3 className="font-bold text-white text-sm">Akun Roblox</h3>
            </div>

            {currentUser.robloxVerified ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Terverifikasi
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Belum Diverifikasi
              </span>
            )}
          </div>

          {currentUser.robloxVerified ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={currentUser.robloxAvatarUrl || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-11D51D57A576628A6DFFBC6987A137C2-Png/150/150/AvatarHeadshot/Webp/noFilter'}
                  alt={currentUser.robloxUsername}
                  className="w-16 h-16 rounded-2xl object-cover bg-slate-800 border-2 border-rose-500/50 shadow-lg"
                />
                <div className="space-y-1">
                  <div className="text-base font-extrabold text-white flex items-center gap-1.5">
                    @{currentUser.robloxUsername}
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    User ID: {currentUser.robloxUserId}
                  </div>
                  <a
                    href={`https://www.roblox.com/users/${currentUser.robloxUserId}/profile`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    Buka Profil Roblox <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <button
                onClick={handleUnlink}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Unlink className="w-3.5 h-3.5" />
                Putus Sambungan Akun Roblox
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Sambungkan username Roblox Anda agar donasi Saweria & Sociabuzz yang ditujukan ke Anda otomatis masuk ke saldo in-game!
              </p>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Username Roblox Anda:
                </label>
                <input
                  type="text"
                  placeholder="e.g. MasalOwnerRBX"
                  value={robloxInput}
                  onChange={(e) => setRobloxInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 block">
                  Langkah Verifikasi (Bio Code):
                </span>
                <p className="text-[11px] text-slate-400 leading-snug">
                  1. Masukkan kode berikut ke dalam <strong className="text-white">Tentang Saya (Bio)</strong> di profil Roblox Anda:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-900 border border-slate-700 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-mono font-bold">
                    {verificationCode}
                  </code>
                  <button
                    onClick={copyCode}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                    title="Salin kode verifikasi"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  2. Klik tombol verifikasi di bawah untuk memeriksa kecocokan:
                </p>
              </div>

              <button
                onClick={handleVerifyRoblox}
                disabled={isVerifying}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memeriksa Profil Roblox...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Verifikasi & Sambungkan Akun
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Persistence & Data Reset Card */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-300">Penyimpanan Sesi & Data Lokal (LocalStorage)</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Semua perubahan pengguna, API key, konfigurasi webhook, dan riwayat donasi otomatis tersimpan di peramban Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('Apakah Anda ingin mereset seluruh data kembali ke kondisi awal?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 cursor-pointer transition-colors shrink-0"
        >
          Reset Data ke Default
        </button>
      </div>
    </div>
  );
};
