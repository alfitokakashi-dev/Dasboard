import React, { useState } from 'react';
import { User, Donation, RevenueSplitConfig } from '../types';
import confetti from 'canvas-confetti';
import { 
  Gamepad2, 
  Send, 
  Sparkles, 
  Coins, 
  Volume2, 
  RotateCcw, 
  MessageSquare, 
  User as UserIcon,
  Play,
  CheckCircle2,
  Bell
} from 'lucide-react';

interface RobloxSimulatorTabProps {
  users: User[];
  config: RevenueSplitConfig;
  onSendSimulationDonation: (
    donorName: string,
    amount: number,
    platform: 'saweria' | 'sociabuzz' | 'bagibagi',
    message: string,
    targetUsername: string
  ) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const RobloxSimulatorTab: React.FC<RobloxSimulatorTabProps> = ({
  users,
  config,
  onSendSimulationDonation,
  showToast
}) => {
  // Simulator State
  const [targetUsername, setTargetUsername] = useState<string>(users[0]?.robloxUsername || 'MasalOwnerRBX');
  const [platform, setPlatform] = useState<'saweria' | 'sociabuzz' | 'bagibagi'>('saweria');
  const [amount, setAmount] = useState<number>(25000);
  const [donorName, setDonorName] = useState<string>('RobloxianSultan');
  const [message, setMessage] = useState<string>('GG bang, semangat update game!');

  // In-game Virtual State
  const [inGameCash, setInGameCash] = useState<number>(1500000);
  const [activeNotification, setActiveNotification] = useState<{
    id: number;
    donorName: string;
    amount: number;
    cashGranted: number;
    platform: 'saweria' | 'sociabuzz' | 'bagibagi';
    message: string;
    target: string;
  } | null>(null);

  const [chatMessages, setChatMessages] = useState<Array<{ id: number; text: string; time: string }>>([
    { id: 1, text: "Server: Selamat datang di Jakarta Roleplay! Jangan lupa donasi via Saweria / Sociabuzz.", time: "18:50" },
    { id: 2, text: "KevinScriptz: Leaderboard cash sudah reset ya gaes.", time: "18:55" }
  ]);

  const handleTriggerDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 1000) {
      showToast('error', 'Jumlah Tidak Valid', 'Minimal donasi simulasi adalah Rp 1.000');
      return;
    }

    const cashGranted = amount * config.cashMultiplier;

    // 1. Confetti
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 }
    });

    // 2. Update Virtual in-game cash
    setInGameCash((prev) => prev + cashGranted);

    // 3. Show in-game toast
    const notifObj = {
      id: Date.now(),
      donorName: donorName.trim() || 'Anonim',
      amount,
      cashGranted,
      platform,
      message,
      target: targetUsername
    };
    setActiveNotification(notifObj);

    // 4. In-game chat broadcast
    const chatText = `[${platform.toUpperCase()} DONASI] ${notifObj.donorName} mendonasikan Rp ${amount.toLocaleString('id-ID')} untuk @${targetUsername}! (+${cashGranted.toLocaleString('id-ID')} Cash) "${message}"`;
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: chatText,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // 5. Send to parent ledger
    onSendSimulationDonation(notifObj.donorName, amount, platform, message, targetUsername);

    showToast('success', 'Donasi Terkirim ke Roblox!', `+${cashGranted.toLocaleString('id-ID')} In-Game Cash berhasil diberikan ke @${targetUsername}`);

    // Auto dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveNotification(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-emerald-400" />
            Roblox Game Simulator & Live In-Game HUD
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Uji coba alur transaksi secara langsung: lihat bagaimana pemain di dalam server Roblox menerima alert notifikasi, chat announcement, dan penambahan saldo Cash secara instan.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-[11px] font-mono text-indigo-300 flex items-center gap-2 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Polling /api/pull (4s) Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Roblox Virtual Viewport */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Virtual Roblox Client (Viewport)
            </span>
            <span className="text-[10px] font-mono text-slate-500">ScreenGui: Active</span>
          </div>

          {/* Virtual Roblox Window */}
          <div className="relative aspect-video w-full rounded-2xl bg-gradient-to-b from-sky-900/60 via-slate-900 to-[#0A0D14] border-2 border-slate-700/80 overflow-hidden shadow-2xl flex flex-col justify-between p-3 select-none">
            {/* 3D Horizon Grid Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />

            {/* Top In-Game Bar (Roblox CoreGui) */}
            <div className="relative z-20 flex items-center justify-between">
              {/* Roblox Top Left Icons */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-rose-400 text-xs shadow-md">
                  R
                </div>
                <div className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Roblox Leaderstats (Top Right) */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-emerald-500/40 flex items-center gap-2 shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Cash:</span>
                  <span className="text-xs font-extrabold text-emerald-300 font-mono">
                    {inGameCash.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* In-Game Animated Toast (Top Center) */}
            <div className="relative z-30 flex justify-center min-h-[100px]">
              {activeNotification ? (
                <div 
                  className={`w-full max-w-sm rounded-2xl p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300 border-2 ${
                    activeNotification.platform === 'saweria'
                      ? 'bg-slate-950/95 border-amber-500 glow-saweria'
                      : activeNotification.platform === 'sociabuzz'
                      ? 'bg-slate-950/95 border-sky-500 glow-sociabuzz'
                      : 'bg-slate-950/95 border-emerald-500 glow-emerald'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎉</span>
                      <div>
                        <div className="text-xs font-extrabold text-white">
                          {activeNotification.donorName} <span className="font-normal text-slate-300">mendonasikan</span> Rp {activeNotification.amount.toLocaleString('id-ID')}!
                        </div>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5">
                          ➔ +{activeNotification.cashGranted.toLocaleString('id-ID')} Cash untuk @{activeNotification.target}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                      activeNotification.platform === 'saweria' ? 'bg-amber-500/20 text-amber-300' :
                      activeNotification.platform === 'sociabuzz' ? 'bg-sky-500/20 text-sky-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {activeNotification.platform}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-200 italic mt-2 pl-6 line-clamp-2 bg-black/40 p-1.5 rounded-lg border border-white/10">
                    "{activeNotification.message}"
                  </p>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400/60 font-mono mt-4">
                  (Notifikasi in-game akan meluncur di sini saat ada donasi)
                </div>
              )}
            </div>

            {/* In-Game 3D Character Avatar Silhouette / Stand */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto pointer-events-none">
              <div className="w-20 h-28 relative flex flex-col items-center justify-end">
                {/* Character Name Tag */}
                <div className="px-2 py-0.5 rounded bg-black/70 border border-white/20 text-[10px] font-bold text-white mb-2 shadow">
                  @{targetUsername}
                </div>
                {/* Character Blocky Figure */}
                <div className="w-10 h-10 rounded-lg bg-indigo-500/80 border border-indigo-300 shadow-lg flex items-center justify-center text-xs font-bold text-white">
                  :)
                </div>
                <div className="w-14 h-12 rounded-lg bg-slate-800 border border-slate-700 -mt-1 flex items-center justify-center text-[10px] text-slate-400">
                  Torso
                </div>
                {/* Pedestal glow */}
                <div className="w-24 h-4 rounded-full bg-indigo-500/20 blur-sm mt-1" />
              </div>
            </div>

            {/* In-Game Chat Box (Bottom Left) */}
            <div className="relative z-20 max-w-md w-full bg-black/60 backdrop-blur-md rounded-xl p-2.5 border border-white/10 text-[11px] space-y-1 max-h-28 overflow-y-auto">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                💬 Roblox Chat Channel (RBXGeneral)
              </div>
              {chatMessages.slice(-3).map((msg) => (
                <div key={msg.id} className="text-slate-200 leading-snug">
                  <span className="text-slate-400 text-[10px] mr-1">[{msg.time}]</span>
                  <span className={msg.text.includes('DONASI') ? 'text-amber-300 font-semibold' : 'text-slate-300'}>
                    {msg.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Saldo Virtual Saat Ini: <strong className="text-emerald-400 font-mono">{inGameCash.toLocaleString('id-ID')} Cash</strong></span>
            <button
              onClick={() => setInGameCash(1000000)}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Saldo
            </button>
          </div>
        </div>

        {/* Right: Simulation Controller Form */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-base">Kontrol Donasi Masuk</h3>
            </div>

            <form onSubmit={handleTriggerDonation} className="space-y-4">
              {/* Platform Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Platform Webhook:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlatform('saweria')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      platform === 'saweria'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    Saweria
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlatform('sociabuzz')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      platform === 'sociabuzz'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                    Sociabuzz
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlatform('bagibagi')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      platform === 'bagibagi'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    Bagibagi
                  </button>
                </div>
              </div>

              {/* Target Roblox Player */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Target Username Roblox Penerima Cash:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="e.g. MasalOwnerRBX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-1">
                  <span className="text-[10px] text-slate-500 shrink-0">Cepat:</span>
                  {users.filter(u => u.robloxUsername).slice(0, 3).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setTargetUsername(u.robloxUsername!)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-0.5 rounded-full shrink-0 cursor-pointer"
                    >
                      @{u.robloxUsername}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount & Quick Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Nominal Donasi (IDR):
                  </label>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    = +{(amount * config.cashMultiplier).toLocaleString('id-ID')} Cash
                  </span>
                </div>
                <input
                  type="number"
                  step="5000"
                  min="1000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />

                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[10000, 25000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                        amount === amt
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Rp {amt / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Donor Name & Message */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Donatur:
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. SultanSunter99"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Pesan Donatur:
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Semangat update gamenya bang!"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 text-slate-950 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Send className="w-4 h-4 fill-current" />
                Kirim Donasi Live ke Roblox Sekarang!
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
