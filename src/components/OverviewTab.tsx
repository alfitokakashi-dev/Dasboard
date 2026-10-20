import React from 'react';
import { 
  Donation, 
  RevenueSplitConfig, 
  RobloxServer, 
  User 
} from '../types';
import { 
  Coins, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Gamepad2, 
  ArrowUpRight, 
  Split, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sparkles,
  Zap
} from 'lucide-react';

interface OverviewTabProps {
  donations: Donation[];
  config: RevenueSplitConfig;
  servers: RobloxServer[];
  currentUser: User;
  onOpenDonateModal: () => void;
  onSelectTab: (tab: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  donations,
  config,
  servers,
  currentUser,
  onOpenDonateModal,
  onSelectTab
}) => {
  // Aggregate stats
  const totalRupiah = donations.reduce((acc, d) => acc + d.amount, 0);
  const totalCash = donations.reduce((acc, d) => acc + d.inGameCashGranted, 0);
  const totalOwnerShare = donations.reduce((acc, d) => acc + (d.splits?.ownerAmount || 0), 0);
  const totalDevShare = donations.reduce((acc, d) => acc + (d.splits?.devAmount || 0), 0);
  const totalTreasuryShare = donations.reduce((acc, d) => acc + (d.splits?.treasuryAmount || 0), 0);
  const totalPlayersInGame = servers.reduce((acc, s) => acc + s.playerCount, 0);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 glow-card">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 bottom-0 -mb-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                🎮 Gateway Siap Digunakan
              </span>
              <span className="text-xs text-slate-400">
                Halo, <span className="font-semibold text-white">{currentUser.discordUsername}</span>!
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Roblox DonateCash Hub & Revenue Split
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Semua donasi dari <span className="text-amber-400 font-semibold">Saweria</span>, <span className="text-cyan-400 font-semibold">Sociabuzz</span>, dan <span className="text-emerald-400 font-semibold">Bagibagi.co</span> langsung dikonversi otomatis menjadi Cash di dalam game Roblox dengan pembagian hasil transparan.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('simulator')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4 text-indigo-400" />
              Buka Simulator Roblox
            </button>
            <button
              onClick={onOpenDonateModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              Simulasi Transaksi
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total IDR */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Total Donasi Masuk</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {formatRupiah(totalRupiah)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{donations.length} Transaksi terproses</span>
          </div>
        </div>

        {/* Total In-game Cash */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Total In-Game Cash</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-300 tracking-tight">
            +{formatNumber(totalCash)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Rate: 1 IDR = {config.cashMultiplier} Cash
          </div>
        </div>

        {/* Owner Split */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Bagi Hasil Owner ({config.ownerPercent}%)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-300 tracking-tight">
            {formatRupiah(totalOwnerShare)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Dev: {formatRupiah(totalDevShare)} ({config.devPercent}%)
          </div>
        </div>

        {/* Live Servers & Players */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Pemain di Server Roblox</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Gamepad2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{totalPlayersInGame}</span>
            <span className="text-xs font-normal text-slate-400">Online</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{servers.length} Server Roblox Terhubung</span>
          </div>
        </div>
      </div>

      {/* Revenue Split Overview Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Split className="w-4 h-4 text-indigo-400" />
              Skema Pembagian Hasil Donasi (Revenue Split Rules)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Diterapkan otomatis untuk setiap donasi Saweria & Sociabuzz yang masuk melalui Cloudflare Worker.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('webhooks')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            Atur Persentase <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Split Progress Bar */}
        <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden flex p-0.5 gap-0.5">
          <div
            style={{ width: `${config.ownerPercent}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-l-full relative group transition-all"
            title={`Owner: ${config.ownerPercent}%`}
          />
          <div
            style={{ width: `${config.devPercent}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 relative group transition-all"
            title={`Developer: ${config.devPercent}%`}
          />
          <div
            style={{ width: `${config.treasuryPercent}%` }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-r-full relative group transition-all"
            title={`Kas/Treasury: ${config.treasuryPercent}%`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="w-3 h-3 rounded bg-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Owner: {config.ownerPercent}%</div>
              <div className="text-[10px] text-slate-400">{formatRupiah(totalOwnerShare)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="w-3 h-3 rounded bg-cyan-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Developer: {config.devPercent}%</div>
              <div className="text-[10px] text-slate-400">{formatRupiah(totalDevShare)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="w-3 h-3 rounded bg-purple-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Kas Server: {config.treasuryPercent}%</div>
              <div className="text-[10px] text-slate-400">{formatRupiah(totalTreasuryShare)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="w-3 h-3 rounded bg-rose-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Biaya Platform: ~5%</div>
              <div className="text-[10px] text-slate-400">Saweria / Sociabuzz</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Transaction Ledger Feed */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Feed Transaksi Donasi Real-Time
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Riwayat donasi yang diterima dari webhook dan status klaim Cash di server Roblox.
            </p>
          </div>

          <button
            onClick={onOpenDonateModal}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            + Buat Donasi Uji Coba
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Donatur & Pesan</th>
                <th className="py-3 px-4">Target Roblox</th>
                <th className="py-3 px-4">Jumlah (Rp)</th>
                <th className="py-3 px-4">In-Game Cash</th>
                <th className="py-3 px-4">Bagi Hasil (Owner / Dev)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {donations.map((don) => (
                <tr key={don.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Platform */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {don.platform === 'saweria' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Saweria
                      </span>
                    )}
                    {don.platform === 'sociabuzz' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                        Sociabuzz
                      </span>
                    )}
                    {don.platform === 'bagibagi' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Bagibagi.co
                      </span>
                    )}
                  </td>

                  {/* Donor & Message */}
                  <td className="py-3.5 px-4 min-w-[180px]">
                    <div className="font-semibold text-white">{don.donorName}</div>
                    <div className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
                      "{don.message || 'Tidak ada pesan'}"
                    </div>
                  </td>

                  {/* Target Roblox Player */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-rose-400 shrink-0">
                        R
                      </div>
                      <span className="font-semibold text-indigo-300">
                        @{don.robloxTargetUsername}
                      </span>
                    </div>
                  </td>

                  {/* Amount Rupiah */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-emerald-400">
                    {formatRupiah(don.amount)}
                  </td>

                  {/* Cash granted */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-slate-100 bg-slate-800 border border-slate-700">
                      +{formatNumber(don.inGameCashGranted)}
                    </span>
                  </td>

                  {/* Splits */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                    <div className="text-amber-300 font-medium">Owner: {formatRupiah(don.splits.ownerAmount)}</div>
                    <div className="text-cyan-400 text-[10px]">Dev: {formatRupiah(don.splits.devAmount)}</div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {don.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Terklaim
                      </span>
                    )}
                    {don.status === 'claimed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        In-Game
                      </span>
                    )}
                    {don.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                        <Clock className="w-3 h-3" />
                        Antre Server
                      </span>
                    )}
                  </td>

                  {/* Timestamp */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right text-slate-500 font-mono text-[10px]">
                    {new Date(don.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
