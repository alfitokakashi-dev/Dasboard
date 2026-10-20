import { User, ApiKey, Donation, RevenueSplitConfig, LuaScript, RobloxServer, WhitelistRule, WorkerQueueItem } from '../types';

export const INITIAL_CONFIG: RevenueSplitConfig = {
  enabled: true,
  saweriaFeePercent: 5,
  sociabuzzFeePercent: 5,
  bagibagiFeePercent: 5,
  ownerPercent: 65,
  devPercent: 25,
  treasuryPercent: 10,
  cashMultiplier: 10, // 1 IDR = 10 In-game Cash
  minDonation: 5000,
  saweriaWebhookSecret: "saweria_whsec_99a8b1c4e7f2",
  sociabuzzWebhookSecret: "sb_sec_31e2d4a5b6c7",
  bagibagiWebhookSecret: "bb_sec_88f1c2d3e4a5",
  cloudflareWorkerUrl: "https://cenz-donate-real-worker.onlyparty.workers.dev",
  robloxPlaceId: "14829103948",
  robloxUniverseId: "5829102948"
};

export const INITIAL_USERS: User[] = [
  {
    id: "usr-owner-1",
    discordId: "782910294857291029",
    discordUsername: "masal_dev",
    discordTag: "masal_dev#0001",
    discordAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    robloxUsername: "MasalOwnerRBX",
    robloxUserId: "456178706",
    robloxAvatarUrl: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-11D51D57A576628A6DFFBC6987A137C2-Png/150/150/AvatarHeadshot/Webp/noFilter",
    robloxVerified: true,
    role: "owner",
    status: "approved",
    joinedAt: "2026-09-01T10:00:00Z",
    lastActive: "Just now",
    note: "Primary Owner (AdminRealUserId: 456178706)"
  },
  {
    id: "usr-dev-2",
    discordId: "847291029384756192",
    discordUsername: "kevin_scripter",
    discordTag: "kevin#2231",
    discordAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    robloxUsername: "KevinScriptz",
    robloxUserId: "10953388687",
    robloxAvatarUrl: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-3BF018DE19A1361CE4729C441FE72B10-Png/150/150/AvatarHeadshot/Webp/noFilter",
    robloxVerified: true,
    role: "developer",
    status: "approved",
    joinedAt: "2026-09-12T14:30:00Z",
    lastActive: "15 mins ago",
    note: "Co-Developer (AdminRealUserId: 10953388687)"
  },
  {
    id: "usr-mod-3",
    discordId: "918273645102938475",
    discordUsername: "arya_admin",
    discordTag: "arya#9912",
    discordAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    robloxUsername: "AryaGamer99",
    robloxUserId: "11480266707",
    robloxAvatarUrl: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-7DC91C5C7DEB19DF487A29BA5D8A93BB-Png/150/150/AvatarHeadshot/Webp/noFilter",
    robloxVerified: true,
    role: "admin",
    status: "approved",
    joinedAt: "2026-09-28T09:15:00Z",
    lastActive: "1 hour ago",
    note: "Server Admin (AdminRealUserId: 11480266707)"
  },
  {
    id: "usr-pending-4",
    discordId: "617283940192837465",
    discordUsername: "budi_gaming",
    discordTag: "budi#4829",
    discordAvatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80",
    robloxUsername: "BudiProRoblox",
    robloxUserId: "449102938",
    robloxAvatarUrl: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-4D2A4B8F093EC9937E88A11019D27891-Png/150/150/AvatarHeadshot/Webp/noFilter",
    robloxVerified: false,
    role: "member",
    status: "pending",
    joinedAt: "2026-10-14T11:20:00Z",
    lastActive: "3 hours ago",
    note: "Menunggu persetujuan Owner untuk masuk dashboard"
  }
];

export const INITIAL_API_KEYS: ApiKey[] = [
  {
    id: "key-live-01",
    name: "Production Roblox Game Server",
    key: "cenz_live_9f81a7b2c0e4d5881a2f4",
    gameId: "14829103948",
    gameName: "Jakarta Roleplay & Tycoon (Cenz Donate)",
    permissions: ["donations:read", "cash:grant", "server:report", "player:verify"],
    createdAt: "2026-09-15T08:00:00Z",
    lastUsed: "Just now",
    status: "active",
    totalRequests: 34190
  }
];

export const INITIAL_QUEUE_ITEMS: WorkerQueueItem[] = [
  {
    id: "item_saw_991823",
    donator_name: "SultanSunter99",
    display_name: "SultanSunter99",
    username: "MasalOwnerRBX",
    targetName: "MasalOwnerRBX",
    amount_raw: 150000,
    message: "GG bang gamenya seru banget! Bagi in-game cash buat beli mobil sport di Roblox!",
    platform: "saweria",
    status: "done",
    created_at: "2026-10-14T18:42:00Z",
    splits: { platformFee: 7500, ownerAmount: 92625, devAmount: 35625, treasuryAmount: 14250 }
  },
  {
    id: "item_sb_771829",
    donator_name: "RizkyGamer_ID",
    display_name: "RizkyGamer_ID",
    username: "KevinScriptz",
    targetName: "KevinScriptz",
    amount_raw: 50000,
    message: "Titip salam buat anak-anak faction! Mantap update baru.",
    platform: "sociabuzz",
    status: "done",
    created_at: "2026-10-14T17:15:00Z",
    splits: { platformFee: 2500, ownerAmount: 30875, devAmount: 11875, treasuryAmount: 4750 }
  },
  {
    id: "item_saw_884910",
    donator_name: "Anonim Baik Hati",
    display_name: "Anonim Baik Hati",
    username: "MasalOwnerRBX",
    targetName: "MasalOwnerRBX",
    amount_raw: 100000,
    message: "Semoga server makin maju terus!",
    platform: "saweria",
    status: "queued",
    created_at: "2026-10-14T19:05:00Z",
    splits: { platformFee: 5000, ownerAmount: 61750, devAmount: 23750, treasuryAmount: 9500 }
  },
  {
    id: "item_bb_662910",
    donator_name: "WibuGanteng",
    display_name: "WibuGanteng",
    username: "AryaGamer99",
    targetName: "AryaGamer99",
    amount_raw: 75000,
    message: "Titip donasi lewat Bagibagi bang!",
    platform: "bagibagi",
    status: "done",
    created_at: "2026-10-14T17:50:00Z",
    splits: { platformFee: 3750, ownerAmount: 46312.5, devAmount: 17812.5, treasuryAmount: 7125 }
  }
];

export const INITIAL_DONATIONS: Donation[] = [
  {
    id: "don-101",
    donorName: "SultanSunter99",
    amount: 150000,
    platform: "saweria",
    message: "GG bang gamenya seru banget! Bagi in-game cash buat beli mobil sport di Roblox!",
    robloxTargetUsername: "MasalOwnerRBX",
    robloxTargetUserId: "456178706",
    inGameCashGranted: 1500000,
    status: "completed",
    timestamp: "2026-10-14T18:42:00Z",
    transactionId: "SAW-20261014-991823",
    splits: {
      platformFee: 7500,
      ownerAmount: 92625,
      devAmount: 35625,
      treasuryAmount: 14250
    }
  },
  {
    id: "don-102",
    donorName: "RizkyGamer_ID",
    amount: 50000,
    platform: "sociabuzz",
    message: "Titip salam buat anak-anak faction! Mantap update baru.",
    robloxTargetUsername: "KevinScriptz",
    robloxTargetUserId: "10953388687",
    inGameCashGranted: 500000,
    status: "completed",
    timestamp: "2026-10-14T17:15:00Z",
    transactionId: "SB-20261014-771829",
    splits: {
      platformFee: 2500,
      ownerAmount: 30875,
      devAmount: 11875,
      treasuryAmount: 4750
    }
  },
  {
    id: "don-103",
    donorName: "WibuGanteng",
    amount: 75000,
    platform: "bagibagi",
    message: "Titip donasi lewat Bagibagi bang!",
    robloxTargetUsername: "AryaGamer99",
    robloxTargetUserId: "11480266707",
    inGameCashGranted: 750000,
    status: "completed",
    timestamp: "2026-10-14T17:50:00Z",
    transactionId: "BB-20261014-662910",
    splits: {
      platformFee: 3750,
      ownerAmount: 46312.5,
      devAmount: 17812.5,
      treasuryAmount: 7125
    }
  }
];

export const INITIAL_SERVERS: RobloxServer[] = [
  {
    id: "srv-01",
    jobId: "d9e8471b-2940-4f91-881b-a19e2837f401",
    placeId: "14829103948",
    gameTitle: "Jakarta Roleplay #1 (Main Hub)",
    playerCount: 48,
    maxPlayers: 50,
    pingMs: 24,
    lastPing: "3 seconds ago",
    status: "online",
    version: "v2.4.1"
  }
];

export const INITIAL_WHITELIST_RULES: WhitelistRule[] = [
  {
    id: "rule-1",
    type: "discord_id",
    value: "782910294857291029",
    label: "masal_dev (Primary Owner)",
    grantedRole: "owner",
    addedBy: "System Master",
    addedAt: "2026-09-01"
  },
  {
    id: "rule-2",
    type: "roblox_username",
    value: "MasalOwnerRBX",
    label: "Roblox User 456178706",
    grantedRole: "owner",
    addedBy: "System Master",
    addedAt: "2026-09-01"
  }
];

/**
 * EXACT PRODUCTION CLOUDFLARE WORKER
 * Implements 100% of the contract required by your Roblox YMADonateRealRuntime.lua:
 * - POST /api/pull  -> { ok: true, items: [...] } with leaseToken & auto-expiry recovery
 * - POST /api/ack   -> { ok: true }
 * - GET  /debug/queue (x-debug-token header) -> { ok: true, count, items }
 * - POST /admin/retry (x-debug-token header) -> { ok: true }
 * - POST /admin/delete (x-debug-token header) -> { ok: true }
 * - POST /debug/push (x-debug-token header)  -> { ok: true, item }
 * - POST /webhook/saweria (Saweria Webhook + Revenue Split) -> { ok: true, id }
 * - POST /webhook/sociabuzz (Sociabuzz Webhook + Revenue Split) -> { ok: true, id }
 */
export const EXACT_MATCHING_CLOUDFLARE_WORKER_JS = `/**
 * ══════════════════════════════════════════════════════════════════════════
 * CLOUDFLARE WORKER: CENZ & YMA DONATE REAL GATEWAY
 * ══════════════════════════════════════════════════════════════════════════
 * Disesuaikan 100% dengan YMADonateRealRuntime.lua & YMADonateRealSecrets.lua:
 *   - POST /api/pull       : Dipanggil berkala oleh Roblox Runtime -> { ok: true, items }
 *   - POST /api/ack        : Konfirmasi donasi telah diproses oleh Roblox -> { ok: true }
 *   - GET  /debug/queue    : List antrian donasi (x-debug-token) -> { ok: true, count, items }
 *   - POST /admin/retry    : Ulangi donasi yang gagal (x-debug-token) -> { ok: true }
 *   - POST /admin/delete   : Hapus donasi dari antrian (x-debug-token) -> { ok: true }
 *   - POST /debug/push     : Push donasi manual/tes ke antrian (x-debug-token) -> { ok: true }
 *   - POST /webhook/saweria   : Webhook Saweria + Kalkulasi Bagi Hasil (Owner, Dev, Kas)
 *   - POST /webhook/sociabuzz : Webhook Sociabuzz + Kalkulasi Bagi Hasil
 * ══════════════════════════════════════════════════════════════════════════
 */

// In-Memory Queue State (or Cloudflare KV / D1)
let donationQueue = [];

// Helper: Response JSON
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-debug-token, X-Webhook-Secret"
    }
  });
}

// Helper: Verify debug token from Secrets.WorkerDebugToken ("asdfghjkl12345")
function verifyDebugToken(request, env) {
  const token = request.headers.get("x-debug-token");
  const expected = env?.DEBUG_TOKEN || "asdfghjkl12345";
  return token && token === expected;
}

// Helper: Kirim Discord Webhook Embed (opsional jika Secrets.DiscordWebhookUrl diisi)
async function sendDiscordWebhook(env, payload) {
  const webhookUrl = env?.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const embed = {
    title: "🎉 Donasi Baru Diterima!",
    description: "Donasi via **" + (payload.platform?.toUpperCase() || "GATEWAY") + "** siap diklaim di Roblox!",
    color: payload.platform === "saweria" ? 0xF59E0B : 0x0EA5E9,
    fields: [
      { name: "Donatur", value: payload.donator_name || "Anonymous", inline: true },
      { name: "Nominal", value: "Rp " + Number(payload.amount_raw || 0).toLocaleString("id-ID"), inline: true },
      { name: "Target Pemain", value: "@" + (payload.targetName || payload.username || "Server"), inline: true },
      { name: "Pesan", value: payload.message || "Terima kasih!", inline: false }
    ],
    footer: { text = "Roblox DonateCash Hub • Cloudflare Worker" },
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (err) {
    console.error("Discord webhook dispatch error:", err);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return jsonResponse({ ok: true });
    }

    // 0. HEALTH CHECK
    if (path === "/" || path === "/health") {
      return jsonResponse({
        ok: true,
        service: "Cenz & YMA Donate Real Cloudflare Worker",
        status: "online",
        timestamp: new Date().toISOString(),
        pendingQueueCount: donationQueue.filter(i => i.status === "queued").length
      });
    }

    // 1. ROBLOX PULL ENDPOINT (POST /api/pull)
    // Dipanggil setiap 4 detik oleh YMADonateRealRuntime.lua:
    // workerRequest("POST", Backend.Endpoints.Pull, { limit }) -> { ok: true, items }
    if (path === "/api/pull" && method === "POST") {
      let body = {};
      try { body = await request.json(); } catch (_) {}
      const limit = Math.max(1, Math.min(25, Number(body.limit) || 10));

      const now = Date.now();
      // Auto-recover expired leases (jika Roblox crash / tidak ack dalam 45 detik)
      for (const item of donationQueue) {
        if (item.status === "leased" && item.leaseExpiresAt && now > item.leaseExpiresAt) {
          item.status = "queued";
          item.leaseToken = null;
        }
      }

      // Ambil donasi yang statusnya 'queued'
      const availableItems = donationQueue.filter(i => i.status === "queued").slice(0, limit);
      const itemsToReturn = [];

      for (const item of availableItems) {
        const leaseToken = "lease_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
        item.status = "leased";
        item.leaseToken = leaseToken;
        item.leaseExpiresAt = now + 45000; // 45s lease time

        // Format persis seperti yang dibaca oleh buildDonor(item) & recordDonation(item) di Roblox:
        itemsToReturn.push({
          id: item.id,
          leaseToken: leaseToken,
          username: item.username || item.targetName || item.donator_name,
          donator_name: item.donator_name || "Anonymous",
          display_name: item.display_name || item.donator_name || "Anonymous",
          amount_raw: item.amount_raw || item.amount || 0,
          amount: item.amount_raw || item.amount || 0,
          message: item.message || "",
          targetName: item.targetName || item.username || "",
          createdAt: item.created_at || new Date().toISOString(),
          created_at: item.created_at || new Date().toISOString()
        });
      }

      return jsonResponse({
        ok: true,
        items: itemsToReturn
      });
    }

    // 2. ROBLOX ACKNOWLEDGE ENDPOINT (POST /api/ack)
    // Dipanggil oleh acknowledge(items) di Roblox:
    // { items: [ { id, leaseToken, status: "done" | "failed", error } ] } -> { ok: true }
    if (path === "/api/ack" && method === "POST") {
      let body = {};
      try { body = await request.json(); } catch (_) {}
      const ackItems = Array.isArray(body.items) ? body.items : [];

      for (const ack of ackItems) {
        const found = donationQueue.find(i => i.id === ack.id && (!ack.leaseToken || i.leaseToken === ack.leaseToken));
        if (found) {
          if (ack.status === "done") {
            found.status = "done";
            found.completedAt = new Date().toISOString();
          } else {
            found.status = "failed";
            found.error = ack.error || "Roblox processing failed";
            found.leaseToken = null;
          }
        }
      }

      // Bersihkan donasi lama yang sudah 'done' lebih dari 100 entri
      donationQueue = donationQueue.filter(i => i.status !== "done" || (Date.now() - new Date(i.completedAt || 0).getTime() < 300000));

      return jsonResponse({ ok: true });
    }

    // 3. ADMIN QUEUE LIST (GET /debug/queue)
    if (path === "/debug/queue" && method === "GET") {
      if (!verifyDebugToken(request, env)) {
        return jsonResponse({ ok: false, error: "Unauthorized (invalid x-debug-token)" }, 401);
      }
      return jsonResponse({
        ok: true,
        count: donationQueue.length,
        items: donationQueue
      });
    }

    // 4. ADMIN RETRY ITEM (POST /admin/retry)
    if (path === "/admin/retry" && method === "POST") {
      if (!verifyDebugToken(request, env)) {
        return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
      }
      const body = await request.json().catch(() => ({}));
      const item = donationQueue.find(i => i.id === body.id);
      if (!item) {
        return jsonResponse({ ok: false, error: "Item not found" }, 404);
      }
      item.status = "queued";
      item.leaseToken = null;
      item.error = null;
      return jsonResponse({ ok: true, message: "Item reset to queued" });
    }

    // 5. ADMIN DELETE ITEM (POST /admin/delete)
    if (path === "/admin/delete" && method === "POST") {
      if (!verifyDebugToken(request, env)) {
        return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
      }
      const body = await request.json().catch(() => ({}));
      donationQueue = donationQueue.filter(i => i.id !== body.id);
      return jsonResponse({ ok: true, message: "Item deleted" });
    }

    // 6. ADMIN PUSH MANUAL ITEM (POST /debug/push)
    if (path === "/debug/push" && method === "POST") {
      if (!verifyDebugToken(request, env)) {
        return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
      }
      const body = await request.json().catch(() => ({}));
      const id = "push_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      const newItem = {
        id,
        donator_name: body.donator_name || "Admin",
        display_name: body.donator_name || "Admin",
        username: body.targetName || body.username || "MasalOwnerRBX",
        targetName: body.targetName || body.username || "MasalOwnerRBX",
        amount_raw: Number(body.amount_raw) || 10000,
        message: body.message || "",
        created_at: new Date().toISOString(),
        platform: "debug",
        status: "queued"
      };
      donationQueue.unshift(newItem);
      return jsonResponse({ ok: true, item: newItem });
    }

    // 7. SAWERIA WEBHOOK (POST /webhook/saweria atau /saweria)
    if ((path === "/webhook/saweria" || path === "/saweria") && method === "POST") {
      try {
        const payload = await request.json();
        const amount = Number(payload.amount_raw || payload.amount || 0);
        const donorName = payload.donator_name || payload.name || "Anonim";
        const message = payload.message || "";

        // Ekstrak target Roblox dari pesan (misal: @Username) atau extra_data
        let target = payload.extra_data?.roblox_username || payload.target;
        if (!target && message.includes("@")) {
          const match = message.match(/@([a-zA-Z0-9_]+)/);
          if (match) target = match[1];
        }

        // Hitung Bagi Hasil (Saweria 5%, Owner 65%, Dev 25%, Kas 10%)
        const platformFee = amount * 0.05;
        const net = amount - platformFee;
        const ownerAmount = net * 0.65;
        const devAmount = net * 0.25;
        const treasuryAmount = net * 0.10;

        const id = "saw_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
        const newItem = {
          id,
          donator_name: donorName,
          display_name: donorName,
          username: target || donorName,
          targetName: target || "",
          amount_raw: amount,
          message,
          created_at: new Date().toISOString(),
          platform: "saweria",
          status: "queued",
          splits: { platformFee, ownerAmount, devAmount, treasuryAmount }
        };

        donationQueue.unshift(newItem);
        ctx.waitUntil(sendDiscordWebhook(env, newItem));

        return jsonResponse({ ok: true, id });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message }, 400);
      }
    }

    // 8. SOCIABUZZ WEBHOOK (POST /webhook/sociabuzz atau /sociabuzz)
    if ((path === "/webhook/sociabuzz" || path === "/sociabuzz") && method === "POST") {
      try {
        const payload = await request.json();
        const amount = Number(payload.amount || payload.amount_raw || 0);
        const donorName = payload.supporter_name || payload.name || "Anonim";
        const message = payload.message || "";
        const target = payload.roblox_user || payload.target || (message.match(/@([a-zA-Z0-9_]+)/)?.[1]);

        // Hitung Bagi Hasil
        const platformFee = amount * 0.05;
        const net = amount - platformFee;
        const ownerAmount = net * 0.65;
        const devAmount = net * 0.25;
        const treasuryAmount = net * 0.10;

        const id = "sb_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
        const newItem = {
          id,
          donator_name: donorName,
          display_name: donorName,
          username: target || donorName,
          targetName: target || "",
          amount_raw: amount,
          message,
          created_at: new Date().toISOString(),
          platform: "sociabuzz",
          status: "queued",
          splits: { platformFee, ownerAmount, devAmount, treasuryAmount }
        };

        donationQueue.unshift(newItem);
        ctx.waitUntil(sendDiscordWebhook(env, newItem));

        return jsonResponse({ ok: true, id });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message }, 400);
      }
    }

    // 9. BAGIBAGI.CO WEBHOOK (POST /webhook/bagibagi atau /bagibagi)
    if ((path === "/webhook/bagibagi" || path === "/bagibagi") && method === "POST") {
      try {
        const payload = await request.json();
        const amount = Number(payload.amount || payload.amount_raw || payload.nominal || 0);
        const donorName = payload.supporter_name || payload.donor_name || payload.name || "Anonim";
        const message = payload.message || "";
        const target = payload.roblox_user || payload.target_user || payload.target || (message.match(/@([a-zA-Z0-9_]+)/)?.[1]);

        // Hitung Bagi Hasil (Bagibagi fee ~5%, Owner 65%, Dev 25%, Kas 10%)
        const platformFee = amount * 0.05;
        const net = amount - platformFee;
        const ownerAmount = net * 0.65;
        const devAmount = net * 0.25;
        const treasuryAmount = net * 0.10;

        const id = "bb_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
        const newItem = {
          id,
          donator_name: donorName,
          display_name: donorName,
          username: target || donorName,
          targetName: target || "",
          amount_raw: amount,
          message,
          created_at: new Date().toISOString(),
          platform: "bagibagi",
          status: "queued",
          splits: { platformFee, ownerAmount, devAmount, treasuryAmount }
        };

        donationQueue.unshift(newItem);
        ctx.waitUntil(sendDiscordWebhook(env, newItem));

        return jsonResponse({ ok: true, id });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message }, 400);
      }
    }

    return jsonResponse({ ok: false, error: "Endpoint Not Found" }, 404);
  }
};
`;

export const WRANGLER_TOML_CONTENT = `name = "cenz-donate-real-worker"
main = "worker.js"
compatibility_date = "2024-09-23"

[vars]
DEBUG_TOKEN = "asdfghjkl12345"
API_KEY = "cenz_live_9f81a7b2c0e4d5881a2f4"
DISCORD_WEBHOOK_URL = ""
SAWERIA_WEBHOOK_SECRET = "saweria_whsec_99a8b1c4e7f2"
SOCIABUZZ_WEBHOOK_SECRET = "sb_sec_31e2d4a5b6c7"
BAGIBAGI_WEBHOOK_SECRET = "bb_sec_88f1c2d3e4a5"
`;

import { FULL_YMA_DONATE_REAL_SECRETS_LUA, FULL_YMA_DONATE_REAL_RUNTIME_LUA } from './robloxScripts';

export { FULL_YMA_DONATE_REAL_SECRETS_LUA, FULL_YMA_DONATE_REAL_RUNTIME_LUA };
export const USER_ROBLOX_SECRETS_LUA = FULL_YMA_DONATE_REAL_SECRETS_LUA;

export const INITIAL_LUA_SCRIPTS: LuaScript[] = [
  {
    id: "script-runtime-full",
    title: "YMADonateRealRuntime.lua (ServerScriptService)",
    category: "server",
    description: "Script Runtime Roblox produksi Anda (FULL VERSION - 1,485 baris kode lengkap siap Copy Paste / Download).",
    code: FULL_YMA_DONATE_REAL_RUNTIME_LUA,
    isDefault: true,
    version: "2.4.0",
    updatedAt: "2026-10-14",
    tags: ["ServerScriptService", "Runtime", "Full Script", "DataStore", "MessagingService", "WorkerPull"]
  },
  {
    id: "script-secrets",
    title: "YMADonateRealSecrets.lua (ServerScriptService)",
    category: "server",
    description: "Module Server-Only Secrets milik Anda berisi ApiKey, WorkerDebugToken, dan daftar AdminRealUserIds.",
    code: FULL_YMA_DONATE_REAL_SECRETS_LUA,
    isDefault: true,
    version: "2.4.0",
    updatedAt: "2026-10-14",
    tags: ["ServerScriptService", "Secrets", "Admin", "Cenz"]
  }
];

