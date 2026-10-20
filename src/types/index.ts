export type UserRole = 'owner' | 'admin' | 'developer' | 'member';
export type UserStatus = 'approved' | 'pending' | 'rejected' | 'banned';
export type DonationPlatform = 'saweria' | 'sociabuzz' | 'bagibagi';
export type DonationStatus = 'completed' | 'pending' | 'claimed';

export interface User {
  id: string;
  discordId: string;
  discordUsername: string;
  discordTag: string;
  discordAvatar: string;
  robloxUsername?: string;
  robloxUserId?: string;
  robloxAvatarUrl?: string;
  robloxVerified: boolean;
  verificationCode?: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  lastActive: string;
  note?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  gameId: string;
  gameName: string;
  permissions: ('donations:read' | 'cash:grant' | 'server:report' | 'player:verify')[];
  createdAt: string;
  lastUsed: string | null;
  status: 'active' | 'revoked';
  totalRequests: number;
}

export interface RevenueSplits {
  platformFee: number;
  ownerAmount: number;
  devAmount: number;
  treasuryAmount: number;
}

export interface Donation {
  id: string;
  donorName: string;
  donorEmail?: string;
  amount: number; // in IDR
  platform: DonationPlatform;
  message: string;
  robloxTargetUsername: string;
  robloxTargetUserId?: string;
  inGameCashGranted: number;
  status: DonationStatus;
  timestamp: string;
  transactionId: string;
  splits: RevenueSplits;
}

export interface RevenueSplitConfig {
  enabled: boolean;
  saweriaFeePercent: number;
  sociabuzzFeePercent: number;
  bagibagiFeePercent: number;
  ownerPercent: number;
  devPercent: number;
  treasuryPercent: number;
  cashMultiplier: number; // 1 IDR = X Cash (e.g. 1 IDR = 10 Cash)
  minDonation: number;
  saweriaWebhookSecret: string;
  sociabuzzWebhookSecret: string;
  bagibagiWebhookSecret: string;
  cloudflareWorkerUrl: string;
  robloxPlaceId: string;
  robloxUniverseId: string;
}

export interface LuaScript {
  id: string;
  title: string;
  category: 'server' | 'gui' | 'module' | 'custom';
  description: string;
  code: string;
  isDefault: boolean;
  version: string;
  updatedAt: string;
  tags: string[];
}

export interface RobloxServer {
  id: string;
  jobId: string;
  placeId: string;
  gameTitle: string;
  playerCount: number;
  maxPlayers: number;
  pingMs: number;
  lastPing: string;
  status: 'online' | 'idle' | 'stopped';
  version: string;
}

export interface WhitelistRule {
  id: string;
  type: 'discord_id' | 'roblox_username' | 'roblox_group';
  value: string;
  label: string;
  grantedRole: UserRole;
  addedBy: string;
  addedAt: string;
}

export interface WorkerQueueItem {
  id: string;
  leaseToken?: string;
  leaseExpiresAt?: number;
  username?: string;
  donator_name: string;
  display_name: string;
  amount_raw: number;
  message: string;
  targetName?: string;
  platform?: 'saweria' | 'sociabuzz' | 'bagibagi' | 'debug';
  status: 'queued' | 'leased' | 'done' | 'failed';
  error?: string;
  created_at: string;
  splits?: RevenueSplits;
}

export interface WorkerHealthReport {
  status: 'online' | 'degraded' | 'offline' | 'checking';
  latencyMs: number;
  lastChecked: string | null;
  workerUrl: string;
  endpoints: {
    root: { ok: boolean; status: number; message: string };
    pull: { ok: boolean; status: number; message: string };
    queue: { ok: boolean; status: number; message: string };
    saweriaWebhook: { ok: boolean; status: number; message: string };
    sociabuzzWebhook: { ok: boolean; status: number; message: string };
    bagibagiWebhook: { ok: boolean; status: number; message: string };
  };
  details?: string;
}

export interface DeploymentHistory {
  id: string;
  version: string;
  timestamp: string;
  subdomain: string;
  status: 'published' | 'tested' | 'draft';
  targetPlatform: 'cloudflare_workers';
  endpointsCount: number;
}
