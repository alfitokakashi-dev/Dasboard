import React, { useState, useEffect } from 'react';
import { RevenueSplitConfig } from '../types';
import { 
  Split, 
  Copy, 
  Check, 
  Send, 
  Sliders, 
  Coins, 
  Key, 
  ExternalLink,
  ShieldAlert,
  Save,
  RotateCcw
} from 'lucide-react';

interface WebhooksTabProps {
  config: RevenueSplitConfig;
  onUpdateConfig: (newConfig: RevenueSplitConfig) => void;
  onSendWebhookTest: (platform: 'saweria' | 'sociabuzz' | 'bagibagi', customPayload?: any) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const WebhooksTab: React.FC<WebhooksTabProps> = ({
  config,
  onUpdateConfig,
  onSendWebhookTest,
  showToast
}) => {
  const [localConfig, setLocalConfig] = useState<RevenueSplitConfig>(config);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [calcInput, setCalcInput] = useState<number>(50000);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const saweriaUrl = `${localConfig.cloudflareWorkerUrl}/webhook/saweria`;
  const sociabuzzUrl = `${localConfig.cloudflareWorkerUrl}/webhook/sociabuzz`;
  const bagibagiUrl = `${localConfig.cloudflareWorkerUrl}/webhook/bagibagi`;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast('success', 'Tersalin!', `URL ${fieldName} telah disalin ke clipboard.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSliderChange = (key: 'ownerPercent' | 'devPercent' | 'treasuryPercent', value: number) => {
    const newConf = { ...localConfig, [key]: value };
    setLocalConfig(newConf);
  };

  const saveSettings = () => {
    onUpdateConfig(localConfig);
    showToast('success', 'Pengaturan Tersimpan', 'Konfigurasi bagi hasil dan webhook berhasil diperbarui.');
  };

  // Split calculation demo for Rp calcInput
  const platformFee = calcInput * 0.05;
  const netAmount = calcInput - platformFee;
  const ownerShare = netAmount * (localConfig.ownerPercent / 100);
  const devShare = netAmount * (localConfig.devPercent / 100);
  const treasuryShare = netAmount * (localConfig.treasuryPercent / 100);
  const cashReward = calcInput * localConfig.cashMultiplier;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Split className="w-5 h-5 text-indigo-400" />
          Integrasi Webhook (Saweria, Sociabuzz & Bagibagi.co)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Hubungkan endpoint Cloudflare Worker ini ke akun <span className="text-amber-400 font-semibold">Saweria</span>, <span className="text-cyan-400 font-semibold">Sociabuzz</span>, atau <span className="text-emerald-400 font-semibold">Bagibagi.co</span> Anda.
        </p>
      </div>

      {/* Webhook URLs Grid - 3 Platforms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Saweria Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 glow-saweria flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <h3 className="font-bold text-white text-sm">Saweria Webhook</h3>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                POST
              </span>
            </div>

            <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
              Pasang di <strong className="text-amber-300">Saweria Dashboard ➔ Webhook</strong>.
            </p>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Target URL:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={saweriaUrl}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(saweriaUrl, 'Saweria Webhook')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer shrink-0"
                    title="Salin URL"
                  >
                    {copiedField === 'Saweria Webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Secret / Token:
                </label>
                <input
                  type="text"
                  value={localConfig.saweriaWebhookSecret}
                  onChange={(e) => setLocalConfig({ ...localConfig, saweriaWebhookSecret: e.target.value })}
                  placeholder="saweria_whsec_..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Fee: ~5%</span>
            <button
              onClick={() => onSendWebhookTest('saweria')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              Uji Saweria
            </button>
          </div>
        </div>

        {/* Sociabuzz Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-sky-500/30 glow-sociabuzz flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400"></span>
                <h3 className="font-bold text-white text-sm">Sociabuzz Webhook</h3>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                POST
              </span>
            </div>

            <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
              Pasang di <strong className="text-sky-300">Sociabuzz Dashboard ➔ TRIBE Webhook</strong>.
            </p>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Target URL:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={sociabuzzUrl}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(sociabuzzUrl, 'Sociabuzz Webhook')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer shrink-0"
                    title="Salin URL"
                  >
                    {copiedField === 'Sociabuzz Webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Secret Token:
                </label>
                <input
                  type="text"
                  value={localConfig.sociabuzzWebhookSecret}
                  onChange={(e) => setLocalConfig({ ...localConfig, sociabuzzWebhookSecret: e.target.value })}
                  placeholder="sb_sec_..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Fee: ~5%</span>
            <button
              onClick={() => onSendWebhookTest('sociabuzz')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              Uji Sociabuzz
            </button>
          </div>
        </div>

        {/* Bagibagi.co Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 glow-emerald flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <h3 className="font-bold text-white text-sm">Bagibagi.co Webhook</h3>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                POST
              </span>
            </div>

            <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
              Pasang di <strong className="text-emerald-300">Bagibagi.co Dashboard ➔ Pengaturan Webhook</strong>.
            </p>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Target URL:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={bagibagiUrl}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(bagibagiUrl, 'Bagibagi Webhook')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer shrink-0"
                    title="Salin URL"
                  >
                    {copiedField === 'Bagibagi Webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Bagibagi Secret / Token:
                </label>
                <input
                  type="text"
                  value={localConfig.bagibagiWebhookSecret}
                  onChange={(e) => setLocalConfig({ ...localConfig, bagibagiWebhookSecret: e.target.value })}
                  placeholder="bb_sec_..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Fee: ~5%</span>
            <button
              onClick={() => onSendWebhookTest('bagibagi')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              Uji Bagibagi.co
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Split & Cash Multiplier Configuration */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Kalkulator & Pengaturan Persentase Bagi Hasil
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tentukan porsi pembagian bersih antara Owner, Developer, dan Kas Game.
            </p>
          </div>

          <button
            onClick={saveSettings}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 cursor-pointer transition-all self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            Simpan Perubahan
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Owner % */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">Bagian Owner</span>
              <span className="text-base font-extrabold text-white font-mono">
                {localConfig.ownerPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localConfig.ownerPercent}
              onChange={(e) => handleSliderChange('ownerPercent', parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Hak revenue bersih yang diterima langsung oleh akun Owner.
            </p>
          </div>

          {/* Dev % */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">Bagian Developer</span>
              <span className="text-base font-extrabold text-white font-mono">
                {localConfig.devPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localConfig.devPercent}
              onChange={(e) => handleSliderChange('devPercent', parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Reward royalti untuk tim scripter, builder, dan programmer Roblox.
            </p>
          </div>

          {/* Treasury % */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400">Kas Server / Treasury</span>
              <span className="text-base font-extrabold text-white font-mono">
                {localConfig.treasuryPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localConfig.treasuryPercent}
              onChange={(e) => handleSliderChange('treasuryPercent', parseInt(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Dana komunitas, event tournament mingguan, dan maintenance.
            </p>
          </div>
        </div>

        {/* Rate Conversion Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              Rasio Konversi In-Game Cash (1 IDR = X Cash)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={localConfig.cashMultiplier}
                onChange={(e) => setLocalConfig({ ...localConfig, cashMultiplier: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-36 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-400">
                Contoh: Donasi <strong className="text-white">Rp 10.000</strong> ➔ Pemain dapat <strong className="text-emerald-400">{10000 * localConfig.cashMultiplier} Cash</strong> di Roblox.
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Minimum Donasi (IDR)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="1000"
                min="1000"
                value={localConfig.minDonation}
                onChange={(e) => setLocalConfig({ ...localConfig, minDonation: Math.max(1000, parseInt(e.target.value) || 1000) })}
                className="w-36 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400">
                Donasi di bawah nilai ini tidak akan memicu trigger Cash di game.
              </span>
            </div>
          </div>
        </div>

        {/* Live Simulation Box */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-indigo-300">
              Simulasi Hitung Pembagian Instan:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Donasi Uji:</span>
              <input
                type="number"
                step="5000"
                value={calcInput}
                onChange={(e) => setCalcInput(parseInt(e.target.value) || 0)}
                className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="text-[10px] text-slate-400">Total Donasi</div>
              <div className="text-xs font-bold text-white mt-1">{formatRupiah(calcInput)}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="text-[10px] text-amber-400">Owner ({localConfig.ownerPercent}%)</div>
              <div className="text-xs font-bold text-amber-300 mt-1">{formatRupiah(ownerShare)}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="text-[10px] text-cyan-400">Dev ({localConfig.devPercent}%)</div>
              <div className="text-xs font-bold text-cyan-300 mt-1">{formatRupiah(devShare)}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="text-[10px] text-purple-400">Kas ({localConfig.treasuryPercent}%)</div>
              <div className="text-xs font-bold text-purple-300 mt-1">{formatRupiah(treasuryShare)}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-emerald-400">Roblox Cash</div>
              <div className="text-xs font-bold text-emerald-300 mt-1">+{cashReward.toLocaleString('id-ID')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
