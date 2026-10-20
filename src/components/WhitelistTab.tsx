import React, { useState } from 'react';
import { User, UserRole, WhitelistRule } from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Plus, 
  Lock, 
  Unlock, 
  Crown, 
  Trash2, 
  Search,
  CheckCircle2,
  AlertTriangle,
  UserPlus
} from 'lucide-react';

interface WhitelistTabProps {
  currentUser: User;
  users: User[];
  rules: WhitelistRule[];
  onApproveUser: (userId: string, role?: UserRole) => void;
  onRejectUser: (userId: string) => void;
  onChangeUserRole: (userId: string, newRole: UserRole) => void;
  onAddRule: (type: 'discord_id' | 'roblox_username', value: string, label: string, role: UserRole) => void;
  onDeleteRule: (ruleId: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const WhitelistTab: React.FC<WhitelistTabProps> = ({
  currentUser,
  users,
  rules,
  onApproveUser,
  onRejectUser,
  onChangeUserRole,
  onAddRule,
  onDeleteRule,
  showToast
}) => {
  const isOwner = currentUser.role === 'owner';
  const [whitelistMode, setWhitelistMode] = useState<'strict' | 'open' | 'maintenance'>('strict');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Direct Add
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ruleType, setRuleType] = useState<'discord_id' | 'roblox_username'>('discord_id');
  const [ruleValue, setRuleValue] = useState('');
  const [ruleLabel, setRuleLabel] = useState('');
  const [ruleRole, setRuleRole] = useState<UserRole>('member');

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedUsers = users.filter((u) => u.status === 'approved' && (
    u.discordUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.robloxUsername && u.robloxUsername.toLowerCase().includes(searchQuery.toLowerCase()))
  ));

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleValue.trim()) {
      showToast('error', 'Form Kosong', 'Nilai Discord ID atau Roblox Username wajib diisi.');
      return;
    }
    onAddRule(ruleType, ruleValue.trim(), ruleLabel.trim() || ruleValue.trim(), ruleRole);
    setRuleValue('');
    setRuleLabel('');
    setIsAddModalOpen(false);
    showToast('success', 'Whitelist Ditambahkan', `Entri "${ruleValue}" telah masuk whitelist dengan role ${ruleRole.toUpperCase()}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Access Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Owner Access Control & Whitelist Manager
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Khusus Akun Owner
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sebagai Owner, Anda memegang otoritas penuh untuk menentukan siapa saja yang diizinkan mengakses dashboard dan mengelola game.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 cursor-pointer transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            + Tambah Whitelist Langsung
          </button>
        )}
      </div>

      {/* Warning banner if NOT Owner */}
      {!isOwner && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-300">Akses Terbatas: Anda login sebagai {currentUser.role.toUpperCase()}</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Hanya akun dengan role <strong>Owner</strong> yang dapat mengubah pengaturan whitelist atau menyetujui user baru. Anda dapat mengganti role ke Owner lewat menu profil di pojok kanan atas untuk mencoba fitur ini.
            </p>
          </div>
        </div>
      )}

      {/* Access Mode Selector */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <h3 className="font-bold text-white text-sm mb-3">Mode Akses Dashboard</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            disabled={!isOwner}
            onClick={() => {
              setWhitelistMode('strict');
              showToast('success', 'Mode Whitelist Aktif', 'Hanya akun terdaftar di whitelist yang diizinkan masuk.');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              whitelistMode === 'strict'
                ? 'bg-indigo-950/50 border-indigo-500/60 shadow-lg shadow-indigo-950/40 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            } ${!isOwner ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">Strict Whitelist (Rekomendasi)</span>
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              User Discord baru masuk antrean pending dan wajib disetujui Owner terlebih dahulu.
            </p>
          </button>

          <button
            disabled={!isOwner}
            onClick={() => {
              setWhitelistMode('open');
              showToast('info', 'Mode Terbuka Aktif', 'User yang memiliki akun Roblox terverifikasi bisa langsung masuk.');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              whitelistMode === 'open'
                ? 'bg-emerald-950/50 border-emerald-500/60 shadow-lg shadow-emerald-950/40 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            } ${!isOwner ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">Open Beta</span>
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Siapa saja dengan Discord & Roblox terhubung bisa melihat ringkasan donasi mereka.
            </p>
          </button>

          <button
            disabled={!isOwner}
            onClick={() => {
              setWhitelistMode('maintenance');
              showToast('error', 'Mode Pemeliharaan', 'Hanya Owner yang dapat mengakses web.');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              whitelistMode === 'maintenance'
                ? 'bg-rose-950/50 border-rose-500/60 shadow-lg shadow-rose-950/40 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            } ${!isOwner ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">Maintenance Mode</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Akses ditutup untuk semua orang kecuali Owner untuk pemeliharaan sistem.
            </p>
          </button>
        </div>
      </div>

      {/* Section 1: Pending Approvals */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              Permintaan Akses Masuk Menunggu Persetujuan ({pendingUsers.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pengguna yang baru saja login via Discord dan membutuhkan persetujuan Owner.
            </p>
          </div>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-xs text-slate-500">
            Tidak ada permintaan akses pending saat ini. Semua antrean telah diproses.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.discordAvatar}
                    alt={u.discordUsername}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{u.discordUsername}</span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {u.discordId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>Roblox: <strong className="text-indigo-300">@{u.robloxUsername || 'Belum link'}</strong></span>
                      <span>•</span>
                      <span>{u.robloxVerified ? '✅ Terverifikasi' : '⚠️ Belum verifikasi'}</span>
                      <span>•</span>
                      <span className="italic">"{u.note}"</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    disabled={!isOwner}
                    onClick={() => onRejectUser(u.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer transition-colors"
                  >
                    Tolak
                  </button>
                  <button
                    disabled={!isOwner}
                    onClick={() => onApproveUser(u.id, 'developer')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 cursor-pointer transition-colors"
                  >
                    Setujui sbg Dev
                  </button>
                  <button
                    disabled={!isOwner}
                    onClick={() => onApproveUser(u.id, 'member')}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
                  >
                    Setujui Masuk
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Approved Users & Roles */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Pengguna Yang Diizinkan Masuk (Approved Whitelist)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola peran dan hak akses untuk setiap anggota tim.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari user Discord / Roblox..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Akun Roblox</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Bergabung</th>
                <th className="py-3 px-4">Aktivitas Terakhir</th>
                <th className="py-3 px-4 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {approvedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.discordAvatar}
                        alt={u.discordUsername}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {u.discordUsername}
                          {u.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.discordTag}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {u.robloxUsername ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-rose-400 bg-slate-800 px-1.5 py-0.5 rounded">R</span>
                        <span className="font-semibold text-indigo-300">@{u.robloxUsername}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Belum terhubung</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {isOwner && u.role !== 'owner' ? (
                      <select
                        value={u.role}
                        onChange={(e) => onChangeUserRole(u.id, e.target.value as UserRole)}
                        className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 font-semibold"
                      >
                        <option value="admin">Admin</option>
                        <option value="developer">Developer</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        {u.role}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(u.joinedAt).toLocaleDateString('id-ID')}
                  </td>

                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {u.lastActive}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {isOwner && u.role !== 'owner' && (
                      <button
                        onClick={() => {
                          if (confirm(`Cabut akses ${u.discordUsername}?`)) {
                            onRejectUser(u.id);
                            showToast('info', 'Akses Dicabut', `Akses untuk ${u.discordUsername} telah dicabut.`);
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Cabut akses"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Direct Whitelist Add */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Tambah ke Whitelist Langsung
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tipe Identifikasi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRuleType('discord_id')}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      ruleType === 'discord_id'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Discord ID (Snowflake)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleType('roblox_username')}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      ruleType === 'roblox_username'
                        ? 'bg-rose-600/20 border-rose-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Roblox Username
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {ruleType === 'discord_id' ? 'Discord ID (18-19 digit):' : 'Username Roblox:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={ruleType === 'discord_id' ? 'e.g. 782910294857291029' : 'e.g. PlayerRoblox99'}
                  value={ruleValue}
                  onChange={(e) => setRuleValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Label / Catatan Pemilik (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rekan developer server 2"
                  value={ruleLabel}
                  onChange={(e) => setRuleLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Role Yang Diberikan:
                </label>
                <select
                  value={ruleRole}
                  onChange={(e) => setRuleRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="member">Member</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Co-Owner</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                >
                  Tambahkan ke Whitelist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
