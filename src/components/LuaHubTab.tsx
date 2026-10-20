import React, { useState } from 'react';
import { LuaScript } from '../types';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  FolderTree, 
  Sparkles, 
  Code2, 
  CheckCircle2,
  Terminal,
  Save,
  BookOpen
} from 'lucide-react';

interface LuaHubTabProps {
  scripts: LuaScript[];
  onAddScript: (title: string, category: 'server' | 'gui' | 'module' | 'custom', description: string, code: string, tags: string[]) => void;
  onUpdateScript: (script: LuaScript) => void;
  onDeleteScript: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const LuaHubTab: React.FC<LuaHubTabProps> = ({
  scripts,
  onAddScript,
  onUpdateScript,
  onDeleteScript,
  showToast
}) => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>(scripts[0]?.id || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New script form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'server' | 'gui' | 'module' | 'custom'>('custom');
  const [newDesc, setNewDesc] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newTags, setNewTags] = useState('Custom, Roblox, DonateCash');

  const activeScript = scripts.find((s) => s.id === selectedScriptId) || scripts[0];

  const handleCopy = (script: LuaScript) => {
    navigator.clipboard.writeText(script.code);
    setCopiedId(script.id);
    showToast('success', 'Kode Lua Disalin', `Script "${script.title}" berhasil disalin ke clipboard.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (script: LuaScript) => {
    const blob = new Blob([script.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${script.title.replace(/\s+/g, '_')}.lua`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('info', 'File Diunduh', `File ${link.download} berhasil disimpan.`);
  };

  const startEdit = () => {
    if (!activeScript) return;
    setEditCode(activeScript.code);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!activeScript) return;
    onUpdateScript({
      ...activeScript,
      code: editCode,
      updatedAt: new Date().toISOString().split('T')[0]
    });
    setIsEditing(false);
    showToast('success', 'Perubahan Disimpan', `Script "${activeScript.title}" telah diperbarui.`);
  };

  const handleCreateScript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) {
      showToast('error', 'Form Kurang Lengkap', 'Judul dan kode script wajib diisi.');
      return;
    }
    const tagsArray = newTags.split(',').map((t) => t.trim()).filter(Boolean);
    onAddScript(newTitle, newCategory, newDesc, newCode, tagsArray);
    setNewTitle('');
    setNewDesc('');
    setNewCode('');
    setIsNewModalOpen(false);
    showToast('success', 'Script Custom Ditambahkan', 'Script Lua Anda telah disimpan dan siap digunakan.');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-400" />
            Roblox Lua Script Hub & Custom Script Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan script standar kami atau kelola script Lua buatan Anda sendiri untuk dipasang di Roblox Studio.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Tambah Script Lua Milik Saya
        </button>
      </div>

      {/* Main Grid: Script Selector & Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List: Script Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Daftar Script ({scripts.length})</span>
            <span className="text-[10px] text-indigo-400">Pilih untuk melihat</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {scripts.map((s) => {
              const isSelected = s.id === activeScript?.id;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedScriptId(s.id);
                    setIsEditing(false);
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-bold text-xs leading-snug ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {s.title}
                    </h3>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        s.category === 'server'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : s.category === 'gui'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {s.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {s.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-400">v{s.version}</span>
                      <span>•</span>
                      <span>{s.updatedAt}</span>
                    </div>

                    {!s.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Hapus script "${s.title}"?`)) {
                            onDeleteScript(s.id);
                            showToast('info', 'Script Dihapus', `Script "${s.title}" telah dihapus.`);
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Hapus script custom ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Studio Hierarchy Placement Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              Struktur Penempatan di Roblox Studio
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-400 bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed">
              <div className="text-amber-400 font-bold">📁 ServerScriptService</div>
              <div className="pl-4 text-slate-200">├─ 📜 YMADonateRealRuntime (Script)</div>
              <div className="pl-4 text-slate-300">├─ 📜 YMADonateRealSecrets (ModuleScript)</div>
              <div className="pl-4 text-slate-400">└─ 📜 YMADonateRealSFXApplier (ModuleScript)</div>
              <div className="text-purple-400 mt-2 font-bold">📁 ReplicatedStorage</div>
              <div className="pl-4 text-slate-300">└─ 📁 YMADonateRealRS</div>
              <div className="pl-8 text-slate-400">├─ 📁 YMADonateRealModules</div>
              <div className="pl-8 text-slate-400">├─ 📁 YMADonateRealRemotes</div>
              <div className="pl-8 text-slate-400">└─ 📜 YMADonateRealConfig</div>
            </div>
          </div>
        </div>

        {/* Right Code Area */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          {/* Code Header */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">{activeScript?.title}</h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                  Full Script ({activeScript?.code.split('\n').length.toLocaleString('id-ID')} Baris)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activeScript?.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Simpan Script
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startEdit}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                    title="Edit Script"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(activeScript)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                    title="Unduh File .lua"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Unduh .lua</span>
                  </button>
                  <button
                    onClick={() => handleCopy(activeScript)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 cursor-pointer transition-all active:scale-95"
                  >
                    {copiedId === activeScript?.id ? (
                      <>
                        <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                        Berhasil Disalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Salin Full Script
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Code Viewer / Editor */}
          <div className="relative flex-1 min-h-[460px] bg-[#070A11] p-4 font-mono text-xs overflow-auto">
            {isEditing ? (
              <textarea
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className="w-full h-full min-h-[440px] bg-transparent text-emerald-300 focus:outline-none resize-none font-mono leading-relaxed"
                spellCheck={false}
              />
            ) : (
              <pre className="text-slate-300 leading-relaxed font-mono whitespace-pre-wrap select-all">
                {activeScript?.code}
              </pre>
            )}
          </div>

          {/* Footer Tags */}
          <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Tags:</span>
              {activeScript?.tags.map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono text-[10px]">
                  #{t}
                </span>
              ))}
            </div>
            <span className="font-mono text-slate-500">
              {activeScript?.code.split('\n').length} Baris Kode
            </span>
          </div>
        </div>
      </div>

      {/* Modal: Tambah Custom Script Sendiri */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-indigo-400" />
                  Tambah Script Lua Custom Milik Anda
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tempelkan script Lua custom Anda sendiri (misal: VIP multiplier, leaderboard custom, UI khusus, atau event game).
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateScript} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nama / Judul Script:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP 2x Cash Multiplier"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Kategori Script:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="custom">Custom Script</option>
                    <option value="server">Server (ServerScriptService)</option>
                    <option value="gui">Client GUI (StarterPlayerScripts)</option>
                    <option value="module">ModuleScript (ReplicatedStorage)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Deskripsi Singkat:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Melipatgandakan cash donasi 2x lipat untuk pemilik VIP pass..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Kode Script Lua (Paste Script Anda di sini):
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder={`-- Paste script Lua Anda di sini...\nlocal Players = game:GetService("Players")\n\nprint("Custom script loaded!")`}
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-emerald-300 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                  spellCheck={false}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tags (Pisahkan dengan koma):
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                >
                  Simpan Script Saya
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
