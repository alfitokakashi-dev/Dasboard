/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  ApiKey, 
  Donation, 
  RevenueSplitConfig, 
  RobloxServer, 
  WhitelistRule, 
  LuaScript,
  UserRole
} from './types';
import { 
  loadStoredUsers,
  saveStoredUsers,
  loadStoredCurrentUserId,
  saveStoredCurrentUserId,
  loadStoredConfig,
  saveStoredConfig,
  loadStoredDonations,
  saveStoredDonations,
  loadStoredApiKeys,
  saveStoredApiKeys,
  loadStoredServers,
  saveStoredServers,
  loadStoredRules,
  saveStoredRules,
  loadStoredScripts,
  saveStoredScripts
} from './utils/storage';
import { playDonationChime } from './utils/audio';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { OverviewTab } from './components/OverviewTab';
import { WebhooksTab } from './components/WebhooksTab';
import { ApiKeysTab } from './components/ApiKeysTab';
import { LuaHubTab } from './components/LuaHubTab';
import { CloudflareTab } from './components/CloudflareTab';
import { WhitelistTab } from './components/WhitelistTab';
import { RobloxSimulatorTab } from './components/RobloxSimulatorTab';
import { ProfileTab } from './components/ProfileTab';
import { DonationModal } from './components/DonationModal';
import { AuthModal } from './components/AuthModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ShieldAlert, UserCheck, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<User[]>(() => loadStoredUsers());
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const storedUsers = loadStoredUsers();
    const storedId = loadStoredCurrentUserId();
    return storedUsers.find((u) => u.id === storedId) || storedUsers[0];
  });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => loadStoredApiKeys());
  const [donations, setDonations] = useState<Donation[]>(() => loadStoredDonations());
  const [config, setConfig] = useState<RevenueSplitConfig>(() => loadStoredConfig());
  const [servers, setServers] = useState<RobloxServer[]>(() => loadStoredServers());
  const [rules, setRules] = useState<WhitelistRule[]>(() => loadStoredRules());
  const [scripts, setScripts] = useState<LuaScript[]>(() => loadStoredScripts());
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => { saveStoredUsers(users); }, [users]);
  useEffect(() => { saveStoredCurrentUserId(currentUser.id); }, [currentUser.id]);
  useEffect(() => { saveStoredConfig(config); }, [config]);
  useEffect(() => { saveStoredDonations(donations); }, [donations]);
  useEffect(() => { saveStoredApiKeys(apiKeys); }, [apiKeys]);
  useEffect(() => { saveStoredServers(servers); }, [servers]);
  useEffect(() => { saveStoredRules(rules); }, [rules]);
  useEffect(() => { saveStoredScripts(scripts); }, [scripts]);

  // Toast Helper
  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Pending users count for owner badge
  const pendingCount = users.filter((u) => u.status === 'pending').length;

  // Process a Donation (Calculates revenue split, generates transactionId)
  const processNewDonation = (
    donorName: string,
    amount: number,
    platform: 'saweria' | 'sociabuzz' | 'bagibagi',
    message: string,
    targetUsername: string
  ) => {
    let feePercent = config.saweriaFeePercent;
    if (platform === 'sociabuzz') feePercent = config.sociabuzzFeePercent;
    if (platform === 'bagibagi') feePercent = config.bagibagiFeePercent || 5;

    const feeRate = feePercent / 100;
    const platformFee = amount * feeRate;
    const netAmount = amount - platformFee;

    const ownerAmount = netAmount * (config.ownerPercent / 100);
    const devAmount = netAmount * (config.devPercent / 100);
    const treasuryAmount = netAmount * (config.treasuryPercent / 100);
    const inGameCashGranted = amount * config.cashMultiplier;

    const prefix = platform === 'saweria' ? 'SAW' : platform === 'sociabuzz' ? 'SB' : 'BB';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(100000 + Math.random() * 900000);
    const transactionId = `${prefix}-${dateStr}-${randNum}`;

    const newDonation: Donation = {
      id: `don-${Date.now()}`,
      donorName,
      amount,
      platform,
      message,
      robloxTargetUsername: targetUsername,
      inGameCashGranted,
      status: 'completed',
      timestamp: new Date().toISOString(),
      transactionId,
      splits: {
        platformFee,
        ownerAmount,
        devAmount,
        treasuryAmount
      }
    };

    setDonations((prev) => [newDonation, ...prev]);
    playDonationChime();
  };

  // Switch current user (e.g. to test Owner view vs Member view vs Pending view)
  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    showToast('info', `Beralih Akun: ${user.discordUsername}`, `Anda sekarang masuk sebagai role [${user.role.toUpperCase()}].`);
  };

  // Register or login a custom user with Discord & Roblox linking
  const handleRegisterCustomUser = (newUser: User) => {
    setUsers((prev) => {
      const existingIdx = prev.findIndex((u) => u.id === newUser.id || u.discordId === newUser.discordId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newUser;
        return updated;
      }
      return [newUser, ...prev];
    });
    setCurrentUser(newUser);
  };

  // Whitelist Actions
  const handleApproveUser = (userId: string, role: UserRole = 'member') => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: 'approved', role } : u
      )
    );
    const user = users.find((u) => u.id === userId);
    showToast('success', 'User Disetujui', `${user?.discordUsername} telah disetujui masuk ke dashboard sebagai ${role.toUpperCase()}.`);
  };

  const handleRejectUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: 'rejected' } : u
      )
    );
    showToast('info', 'Permintaan Ditolak', 'Pengguna tidak diberikan akses.');
  };

  const handleChangeUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role: newRole } : u
      )
    );
    showToast('success', 'Peran Diperbarui', `Role telah diubah menjadi ${newRole.toUpperCase()}.`);
  };

  const handleAddWhitelistRule = (type: 'discord_id' | 'roblox_username', value: string, label: string, role: UserRole) => {
    const newRule: WhitelistRule = {
      id: `rule-${Date.now()}`,
      type,
      value,
      label,
      grantedRole: role,
      addedBy: currentUser.discordUsername,
      addedAt: new Date().toISOString().split('T')[0]
    };
    setRules((prev) => [newRule, ...prev]);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  // API Key Actions
  const handleAddApiKey = (name: string, gameId: string, gameName: string, permissions: any[]) => {
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name,
      key: `rbx_sec_live_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 10)}`,
      gameId,
      gameName,
      permissions,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      status: 'active',
      totalRequests: 0
    };
    setApiKeys((prev) => [newKey, ...prev]);
  };

  const handleRevokeKey = (keyId: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, status: 'revoked' } : k))
    );
    showToast('info', 'Kunci Dicabut', 'API Key telah dinonaktifkan.');
  };

  const handleRollKey = (keyId: string) => {
    const newSecret = `rbx_sec_live_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 10)}`;
    setApiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, key: newSecret } : k))
    );
    showToast('success', 'Kunci Baru Digenerate', 'Secret token baru telah dibuat.');
  };

  // Lua Script Actions
  const handleAddScript = (
    title: string,
    category: 'server' | 'gui' | 'module' | 'custom',
    description: string,
    code: string,
    tags: string[]
  ) => {
    const newScript: LuaScript = {
      id: `script-${Date.now()}`,
      title,
      category,
      description,
      code,
      isDefault: false,
      version: '1.0.0',
      updatedAt: new Date().toISOString().split('T')[0],
      tags
    };
    setScripts((prev) => [newScript, ...prev]);
  };

  const handleUpdateScript = (updated: LuaScript) => {
    setScripts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteScript = (id: string) => {
    setScripts((prev) => prev.filter((s) => s.id !== id));
  };

  // Test webhook ping
  const handleSendWebhookTest = (platform: 'saweria' | 'sociabuzz' | 'bagibagi') => {
    const testDonors = ['BudiKeren_ID', 'DindaStreamer', 'RianGamer', 'SultanAnonim', 'WibuGanteng'];
    const chosenDonor = testDonors[Math.floor(Math.random() * testDonors.length)];
    const testAmounts = [15000, 25000, 50000, 75000, 100000];
    const chosenAmount = testAmounts[Math.floor(Math.random() * testAmounts.length)];
    const target = currentUser.robloxUsername || 'MasalOwnerRBX';

    processNewDonation(
      chosenDonor,
      chosenAmount,
      platform,
      `Uji coba otomatis webhook ${platform.toUpperCase()} via Cloudflare Worker!`,
      target
    );

    showToast('success', `Webhook ${platform.toUpperCase()} Berhasil Diuji`, `Donasi simulasi Rp ${chosenAmount.toLocaleString('id-ID')} masuk.`);
  };

  // Check if current user is pending
  const isPendingUser = currentUser.status === 'pending';

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onOpenDonateModal={() => setIsDonateModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        serverCount={servers.length}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser.role}
          pendingUsersCount={pendingCount}
          isPendingUser={isPendingUser}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Pending Gate Screen if current user is not approved */}
          {isPendingUser ? (
            <div className="max-w-xl mx-auto mt-12 p-8 rounded-2xl bg-slate-900 border border-amber-500/30 text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">Menunggu Persetujuan Akun Owner</h2>
                <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                  Halo <strong className="text-white">{currentUser.discordUsername}</strong>, akun Discord & Roblox Anda telah tercatat, namun dashboard ini berada dalam mode <strong>Strict Whitelist</strong>. Akun Owner harus menyetujui akses Anda terlebih dahulu.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Discord User:</span>
                  <span className="font-mono text-white font-bold">{currentUser.discordUsername}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Discord ID:</span>
                  <span className="font-mono text-indigo-300">{currentUser.discordId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Roblox Linked:</span>
                  <span className="text-amber-300 font-mono font-bold">@{currentUser.robloxUsername || 'Belum ditautkan'}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                  <span className="text-slate-400">Status Akses:</span>
                  <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Pending Owner Review
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => handleSwitchUser(users.find(u => u.role === 'owner') || users[0])}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <UserCheck className="w-4 h-4" />
                  Beralih ke Akun Owner (masal_dev)
                </button>

                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-indigo-400" />
                  Masuk dengan Akun Lain
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'overview' && (
                <OverviewTab
                  donations={donations}
                  config={config}
                  servers={servers}
                  currentUser={currentUser}
                  onOpenDonateModal={() => setIsDonateModalOpen(true)}
                  onSelectTab={setCurrentTab}
                />
              )}

              {currentTab === 'simulator' && (
                <RobloxSimulatorTab
                  users={users}
                  config={config}
                  onSendSimulationDonation={processNewDonation}
                  showToast={showToast}
                />
              )}

              {currentTab === 'webhooks' && (
                <WebhooksTab
                  config={config}
                  onUpdateConfig={setConfig}
                  onSendWebhookTest={handleSendWebhookTest}
                  showToast={showToast}
                />
              )}

              {currentTab === 'api-keys' && (
                <ApiKeysTab
                  apiKeys={apiKeys}
                  servers={servers}
                  onAddKey={handleAddApiKey}
                  onRevokeKey={handleRevokeKey}
                  onRollKey={handleRollKey}
                  showToast={showToast}
                />
              )}

              {currentTab === 'lua-hub' && (
                <LuaHubTab
                  scripts={scripts}
                  onAddScript={handleAddScript}
                  onUpdateScript={handleUpdateScript}
                  onDeleteScript={handleDeleteScript}
                  showToast={showToast}
                />
              )}

              {currentTab === 'cloudflare' && (
                <CloudflareTab
                  config={config}
                  onUpdateConfig={setConfig}
                  showToast={showToast}
                />
              )}

              {currentTab === 'whitelist' && (
                <WhitelistTab
                  currentUser={currentUser}
                  users={users}
                  rules={rules}
                  onApproveUser={handleApproveUser}
                  onRejectUser={handleRejectUser}
                  onChangeUserRole={handleChangeUserRole}
                  onAddRule={handleAddWhitelistRule}
                  onDeleteRule={handleDeleteRule}
                  showToast={showToast}
                />
              )}

              {currentTab === 'profile' && (
                <ProfileTab
                  currentUser={currentUser}
                  onUpdateCurrentUser={(updated) => {
                    setCurrentUser((prev) => ({ ...prev, ...updated }));
                    setUsers((prev) =>
                      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updated } : u))
                    );
                  }}
                  showToast={showToast}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals & Toast Container */}
      <DonationModal
        isOpen={isDonateModalOpen}
        onClose={() => setIsDonateModalOpen(false)}
        users={users}
        config={config}
        onSubmit={processNewDonation}
        showToast={showToast}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        users={users}
        rules={rules}
        onLoginAsUser={handleSwitchUser}
        onRegisterCustomUser={handleRegisterCustomUser}
        showToast={showToast}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
}
