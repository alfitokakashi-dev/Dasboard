import React, { useState } from 'react';
import { ApiKey, RobloxServer } from '../types';
import { 
  KeyRound, 
  Plus, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  Server, 
  Terminal, 
  Radio,
  ExternalLink,
  Lock
} from 'lucide-react';

interface ApiKeysTabProps {
  apiKeys: ApiKey[];
  servers: RobloxServer[];
  onAddKey: (name: string, gameId: string, gameName: string, permissions: any[]) => void;
  onRevokeKey: (keyId: string) => void;
  onRollKey: (keyId: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const ApiKeysTab: React.FC<ApiKeysTabProps> = ({
  apiKeys,
  servers,
  onAddKey,
  onRevokeKey,
  onRollKey,
  showToast
}) => {
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Key Form State
  const [newKeyName, setNewKeyName] = useState('');
  const [newGameId, setNewGameId] = useState('');
  const [newGameName, setNewGameName] = useState('');

  const copyKey = (keyString: string, id: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedId(id);
    showToast('success', 'API Key Disalin', 'Secret key siap ditempelkan di script Roblox ServerScriptService.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !newGameId) {
      showToast('error', 'Form Belum Lengkap', 'Nama key dan Roblox Game / Place ID wajib diisi.');
      return;
    }
    onAddKey(
      newKeyName,
      newGameId,
      newGameName || 'Roblox Experience',
      ['donations:read', 'cash:grant', 'server:report']
    );
    setNewKeyName('');
    setNewGameId('');
    setNewGameName('');
    setIsAddModalOpen(false);
    showToast('success', 'API Key Berhasil Dibuat', 'Kunci baru telah aktif untuk game Roblox Anda.');
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            Roblox Game API Keys & Server Gateway
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan API Key ini di script Roblox <code className="text-indigo-300">ServerScriptService</code> untuk memverifikasi request ke Cloudflare Worker.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Buat API Key Baru
        </button>
      </div>

      {/* Keys Table / List */}
      <div className="grid grid-cols-1 gap-4">
        {apiKeys.map((k) => {
          const isRevealed = showKeyId === k.id;
          const displayKey = isRevealed 
            ? k.key 
            : `${k.key.substring(0, 12)}••••••••••••••••${k.key.substring(k.key.length - 4)}`;

          return (
            <div
              key={k.id}
              className={`p-5 rounded-2xl border transition-all ${
                k.status === 'active'
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/60 border-rose-500/30 opacity-75'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-white text-base">{k.name}</h3>
                    {k.status === 'active' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Dicabut (Revoked)
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>Game: <strong className="text-slate-200">{k.gameName}</strong></span>
                    <span>•</span>
                    <span>Place ID: <code className="text-indigo-400 font-mono">{k.gameId}</code></span>
                    <span>•</span>
                    <span>Total Request: <strong className="text-white">{k.totalRequests.toLocaleString('id-ID')}</strong></span>
                  </div>
                </div>

                {/* Permissions Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {k.permissions.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key display string & Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 flex items-center justify-between overflow-hidden">
                    <span className="truncate">{displayKey}</span>
                  </div>

                  <button
                    onClick={() => setShowKeyId(isRevealed ? null : k.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                    title={isRevealed ? "Sembunyikan" : "Tampilkan"}
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => copyKey(k.key, k.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                    title="Salin Key"
                  >
                    {copiedId === k.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => onRollKey(k.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                    title="Generate ulang secret key baru"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Roll Key
                  </button>

                  {k.status === 'active' ? (
                    <button
                      onClick={() => onRevokeKey(k.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cabut Izin
                    </button>
                  ) : (
                    <span className="text-xs text-rose-400 italic">Nonaktif</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Roblox Game Servers Monitor */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white text-base">Server Roblox Yang Sedang Berjalan (Live Heartbeats)</h3>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            {servers.length} Server Terhubung
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servers.map((srv) => (
            <div key={srv.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200 text-xs">{srv.gameTitle}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {srv.pingMs} ms
                </span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                <div>Place ID: <span className="text-indigo-400">{srv.placeId}</span></div>
                <div className="truncate">Job ID: <span className="text-slate-500">{srv.jobId}</span></div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-slate-300 font-sans">
                  <span>Pemain: <strong className="text-white">{srv.playerCount}/{srv.maxPlayers}</strong></span>
                  <span className="text-[10px] text-slate-500">Ping terakhir: {srv.lastPing}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Snippet for Roblox Studio */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Terminal className="w-4 h-4 text-indigo-400" />
            Contoh Pemanggilan dari Script Roblox (HttpService)
          </div>
          <span className="text-[10px] text-slate-500 font-mono">ServerScriptService.lua</span>
        </div>

        <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-xs font-mono text-indigo-300 overflow-x-auto leading-relaxed">
{`local HttpService = game:GetService("HttpService")

local API_ENDPOINT = "https://roblox-donatecash.cloudflare.workers.dev"
local API_KEY = "${apiKeys[0]?.key || 'rbx_sec_live_your_key_here'}"

local function fetchPendingRewards()
    local url = API_ENDPOINT .. "/api/roblox/rewards?placeId=" .. tostring(game.PlaceId)
    local response = HttpService:RequestAsync({
        Url = url,
        Method = "GET",
        Headers = {
            ["Authorization"] = "Bearer " .. API_KEY,
            ["Content-Type"] = "application/json"
        }
    })
    
    if response.StatusCode == 200 then
        local data = HttpService:JSONDecode(response.Body)
        return data.pendingDonations
    end
end`}
        </pre>
      </div>

      {/* Add Key Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                Buat API Key Roblox Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Kunci / Server:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Survival Hardcore"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Roblox Place ID / Game ID:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 14829103948"
                  value={newGameId}
                  onChange={(e) => setNewGameId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Game Roblox (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jakarta Roleplay City"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Buat Kunci Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
