import React, { useState } from 'react';
import { User, RevenueSplitConfig } from '../types';
import confetti from 'canvas-confetti';
import { Zap, X, Coins, Send, CheckCircle2 } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  config: RevenueSplitConfig;
  onSubmit: (
    donorName: string,
    amount: number,
    platform: 'saweria' | 'sociabuzz' | 'bagibagi',
    message: string,
    targetUsername: string
  ) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  users,
  config,
  onSubmit,
  showToast
}) => {
  if (!isOpen) return null;

  const [platform, setPlatform] = useState<'saweria' | 'sociabuzz' | 'bagibagi'>('saweria');
  const [targetUsername, setTargetUsername] = useState(users[0]?.robloxUsername || 'MasalOwnerRBX');
  const [donorName, setDonorName] = useState('SultanGanteng');
  const [amount, setAmount] = useState(50000);
  const [message, setMessage] = useState('Mantap min, update terus!');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 1000) {
      showToast('error', 'Nominal Tidak Sah', 'Minimal donasi adalah Rp 1.000');
      return;
    }

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    onSubmit(donorName, amount, platform, message, targetUsername);
    showToast('success', 'Transaksi Donasi Berhasil', `Donasi Rp ${amount.toLocaleString('id-ID')} via ${platform.toUpperCase()} berhasil dikirim.`);
    onClose();
  };

  const cashReward = amount * config.cashMultiplier;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Kirim Simulasi Donasi</h3>
              <p className="text-[11px] text-slate-400">Trigger webhook Saweria, Sociabuzz & Bagibagi.co</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Platform Choice */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Pilih Gateway Pembayaran:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPlatform('saweria')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  platform === 'saweria'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
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
                    : 'bg-slate-950 text-slate-400 border-slate-800'
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
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                Bagibagi.co
              </button>
            </div>
          </div>

          {/* Target Roblox User */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Username Roblox Penerima:
            </label>
            <input
              type="text"
              required
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Nominal Rupiah (IDR):
              </label>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                +{cashReward.toLocaleString('id-ID')} Cash
              </span>
            </div>
            <input
              type="number"
              step="5000"
              required
              min="1000"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Donor Name & Message */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nama Donatur:
              </label>
              <input
                type="text"
                required
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Donasi Live
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
