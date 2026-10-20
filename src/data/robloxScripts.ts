export const FULL_YMA_DONATE_REAL_SECRETS_LUA = `-- ═══════════════════════════════════════════════════════
-- SERVER-ONLY SECRETS (YMADonateRealSecrets.lua)
-- Module ini HARUS berada di ServerScriptService, JANGAN di ReplicatedStorage.
-- Berisi kredensial sensitif yang tidak boleh diakses oleh client.
-- ═══════════════════════════════════════════════════════

local Secrets = {}

-- API Key untuk backend Cloudflare Worker
Secrets.ApiKey = "cenz_live_9f81a7b2c0e4d5881a2f4"

-- Worker debug token (harus sama dengan DEBUG_TOKEN di Cloudflare Worker)
-- Dipake buat endpoint admin: /debug/queue, /admin/retry, /admin/delete, /debug/push
Secrets.WorkerDebugToken = "asdfghjkl12345"

-- Daftar UserId admin yang boleh mengakses fitur admin
Secrets.AdminRealUserIds = {456178706, 10953388687, 11480266707}

-- Discord Webhook URL (notifikasi donasi ke Discord)
-- Kosongkan untuk menonaktifkan.
Secrets.DiscordWebhookUrl = ""

return Secrets
`;

export const FULL_YMA_DONATE_REAL_RUNTIME_LUA = `local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")
local MessagingService = game:GetService("MessagingService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")
local UserService = game:GetService("UserService")
local TextService = game:GetService("TextService")

local root = ReplicatedStorage:WaitForChild("YMADonateRealRS")
local modules = root:WaitForChild("YMADonateRealModules")
local remotes = root:WaitForChild("YMADonateRealRemotes")
local Config = require(root:WaitForChild("YMADonateRealConfig"))
local ParticleApplier = require(script.Parent:WaitForChild("YMADonateRealSFXApplier"))

-- Merge server-only secrets into Config (dari ServerScriptService, bukan ReplicatedStorage)
local Secrets = require(script.Parent:WaitForChild("YMADonateRealSecrets"))
Config.ApiKey = Secrets.ApiKey
Config.WorkerDebugToken = Secrets.WorkerDebugToken
Config.AdminRealUserIds = Secrets.AdminRealUserIds
Config.DiscordWebhookUrl = Secrets.DiscordWebhookUrl

local Backend = {
	-- URL Cloudflare Worker kamu, TANPA slash di akhir.
	-- Contoh: https://cenz-donate-real-worker.namaakun.workers.dev
	WorkerBaseUrl = "https://cenz-donate-real-worker.onlyparty.workers.dev",
	WorkerPollInterval = 4,
	WorkerBatchSize = 10,

	-- Path endpoint di worker (index.js)
	Endpoints = {
		Pull = "/api/pull",         -- POST { limit }        -> { ok, items }
		Ack = "/api/ack",           -- POST { items }        -> { ok }
		Queue = "/debug/queue",     -- GET  (x-debug-token)  -> { ok, count, items }
		Retry = "/admin/retry",     -- POST (x-debug-token)  { id }
		Delete = "/admin/delete",   -- POST (x-debug-token)  { id }
		Push = "/debug/push",       -- POST (x-debug-token)  { donator_name, amount_raw, message }
	},
}

local Runtime = {}

local started = false
local refreshing = false
local refreshQueued = false
local workerConnectedPrinted = false
local lastWorkerWarning = 0
local useMemory = false

local allTimeStore
local dailyStore
local dailyStoreKey
local profileStore
local receiptStore

--============================================================
-- DATASTORE ANTI-QUEUE RUNTIME CACHE
-- Semua write rutin (profile + total + daily) ditahan di RAM
-- dan di-flush berkala hanya jika budget DataStore tersedia.
--============================================================
local DATASTORE_FLUSH_INTERVAL = 15
local DATASTORE_SHUTDOWN_FLUSH_ATTEMPTS = 5
local profilePending = {}
local totalPendingDelta = {}
local dailyPendingDelta = {}
local totalCacheLoaded = {}
local dailyCacheLoaded = {}
local datastoreFlushRunning = false
local datastoreFlushAgain = false
local lastDatastoreFlush = 0

local memoryTotals = {}
local memoryDaily = {}
local memoryDailyKey = ""
local memoryProfiles = {}
local memoryReceipts = {}
local profileCache = {}
local displayNameChecked = {}
local userInfoCache = {}
local thumbnailCache = {}
local liveEntries = {}
local topEntries = {}
local topSignature = ""

-- Cache terakhir yang valid untuk board daily. Jangan pernah mengosongkan
-- board hanya karena DataStore budget/HTTP sedang gagal sesaat.
local dailyBoardCache = {}
local dailyBoardCacheKey = ""

local internalUpdated = Instance.new("BindableEvent")
internalUpdated.Name = "YMADonateRealUpdated"
internalUpdated.Parent = script
Runtime.Updated = internalUpdated.Event

local confirmedRemote = remotes:FindFirstChild("YMADonateRealDonorConfirmed")
local fireworksBcast = remotes:FindFirstChild("YMARealFireworksBcast")
local fireworksReq = remotes:FindFirstChild("YMARealFireworksReq")
local donationCodeFunction = remotes:FindFirstChild("GetDonationCodeRP")
local effectsFolder = remotes:FindFirstChild("YMADonateRealJPassEvents")
local fakeDonateRemote = remotes:FindFirstChild("YMAFakeDonateRequest")
local leaderboardRemote = remotes:FindFirstChild("YMAFD_LeaderboardRequest")
if not leaderboardRemote then
	leaderboardRemote = Instance.new("RemoteEvent")
	leaderboardRemote.Name = "YMAFD_LeaderboardRequest"
	leaderboardRemote.Parent = remotes
end

-- RemoteFunction for client-side admin check (AdminRealUserIds is server-only)
local adminCheckFunction = remotes:FindFirstChild("YMAFD_AdminCheck")
if not adminCheckFunction then
	adminCheckFunction = Instance.new("RemoteFunction")
	adminCheckFunction.Name = "YMAFD_AdminCheck"
	adminCheckFunction.Parent = remotes
end

-- Cinematic (letterbox + kamera fokus ke penerima) untuk donasi besar.
-- Remote dibuat otomatis oleh server kalau belum ada di folder Remotes.
-- Opsional di Config: CinematicRealEnabled (default true),
--                     CinematicRealMinAmount (default 100000),
--                     CinematicRealDuration (default 7 detik).
local cinematicRemote = remotes:FindFirstChild("YMADonateRealCinematic")
if not cinematicRemote then
	cinematicRemote = Instance.new("RemoteEvent")
	cinematicRemote.Name = "YMADonateRealCinematic"
	cinematicRemote.Parent = remotes
end

local function fireCinematic(payload)
	if Config.CinematicRealEnabled == false then
		return
	end
	local minAmount = tonumber(Config.CinematicRealMinAmount) or 100000
	if (tonumber(payload.amount) or 0) < minAmount then
		return
	end
	cinematicRemote:FireAllClients({
		donorName = payload.donorName,
		username = payload.username,
		displayName = payload.displayName,
		userId = payload.userId,
		targetName = payload.targetName,
		targetDisplayName = payload.targetDisplayName,
		targetUserId = payload.targetUserId,
		amount = payload.amount,
		totalAmount = payload.totalAmount,
		currency = payload.currency,
		message = payload.message,
		duration = tonumber(Config.CinematicRealDuration) or 7,
	})
end

local function trim(value)
	return (tostring(value or ""):gsub("^%s+", ""):gsub("%s+$", ""))
end

local function normalize(value)
	return string.lower(trim(value))
end

local function safeText(value, maxLength)
	local text = trim(value)
	text = text:gsub("[%c]", " ")
	if #text > maxLength then
		text = string.sub(text, 1, maxLength)
	end
	return text
end

--============================================================
-- GLOBAL DONATION BROADCAST
-- Satu donasi diproses oleh server worker yang claim receipt,
-- lalu payload visualnya dikirim ke SEMUA server via MessagingService.
-- DataStore tetap hanya ditulis oleh server yang berhasil claim.
--============================================================
local GLOBAL_DONATION_TOPIC = "YMADonateReal_GlobalDonation_v1"
local globalBroadcastSubscription = nil
local globalSeen = {}
local GLOBAL_SEEN_TTL = 120

local function rememberGlobalDonation(id)
	id = safeText(id, 180)
	if id == "" then
		return false
	end
	local now = os.clock()
	for oldId, timestamp in pairs(globalSeen) do
		if now - timestamp > GLOBAL_SEEN_TTL then
			globalSeen[oldId] = nil
		end
	end
	if globalSeen[id] then
		return false
	end
	globalSeen[id] = now
	return true
end


local function clampInteger(value, minimum, maximum)
	local number = math.floor(tonumber(value) or 0)
	return math.clamp(number, minimum, maximum)
end

local function addSeparators(value)
	local text = tostring(math.floor(tonumber(value) or 0))
	while true do
		local replaced, count = text:gsub("^(%-?%d+)(%d%d%d)", "%1,%2")
		text = replaced
		if count == 0 then
			break
		end
	end
	return text
end

local function formatAmount(value)
	return addSeparators(value) .. " " .. tostring(Config.CurrencyLabel or "GOLD")
end
Runtime.FormatAmount = formatAmount

local function hashName(text)
	local hash = 7
	for index = 1, #text do
		hash = (hash * 131 + string.byte(text, index)) % 2147483647
	end
	return hash
end

local function currentDailyKey()
	local offset = (tonumber(Config.DailyResetUtcOffsetHours) or 8) * 3600
	return os.date("!%Y%m%d", os.time() + offset)
end

local function getDailyStore()
	local key = currentDailyKey()
	if useMemory then
		if memoryDailyKey ~= key then
			memoryDailyKey = key
			table.clear(memoryDaily)
		end
		return nil
	end

	if dailyStoreKey ~= key or dailyStore == nil then
		local previousKey = dailyStoreKey
		dailyStoreKey = key
		dailyStore = DataStoreService:GetOrderedDataStore(
			tostring(Config.DailyStorePrefix or "YMADonateRealDaily_CleanV1") .. "_" .. key
		)

		if previousKey ~= nil and previousKey ~= key then
			table.clear(memoryDaily)
			dailyCacheLoaded[key] = dailyCacheLoaded[key] or {}
		end
	end
	return dailyStore
end

local function isAdmin(player)
	if not player then
		return false
	end
	for _, userId in ipairs(Config.AdminRealUserIds or {}) do
		if tonumber(userId) == player.UserId then
			return true
		end
	end
	return false
end
Runtime.IsAdmin = isAdmin

local function findOnlinePlayer(identifier)
	local wanted = normalize(identifier)
	if wanted == "" then
		return nil
	end
	for _, player in ipairs(Players:GetPlayers()) do
		if normalize(player.Name) == wanted or normalize(player.DisplayName) == wanted then
			return player
		end
	end
	return nil
end

local function validRobloxName(identifier)
	return #identifier >= 3 and #identifier <= 20 and identifier:match("^[%w_]+$") ~= nil
end

local function resolvePlayer(identifier)
	identifier = trim(identifier)
	if identifier == "" then
		return nil
	end

	local online = findOnlinePlayer(identifier)
	if online then
		return online.UserId, online.Name, online.DisplayName, online
	end

	if not validRobloxName(identifier) then
		return nil
	end

	local ok, userId = pcall(function()
		return Players:GetUserIdFromNameAsync(identifier)
	end)
	if not ok or type(userId) ~= "number" or userId <= 0 then
		return nil
	end

	local username = identifier
	local displayName = identifier
	local nameOk, resolvedName = pcall(function()
		return Players:GetNameFromUserIdAsync(userId)
	end)
	if nameOk and type(resolvedName) == "string" then
		username = resolvedName
	end
	local displayOk, resolvedDisplay = pcall(function()
		return Players:GetDisplayNameAsync(userId)
	end)
	if displayOk and type(resolvedDisplay) == "string" and resolvedDisplay ~= "" then
		displayName = resolvedDisplay
	elseif nameOk and type(resolvedName) == "string" then
		displayName = resolvedName
	end
	local onlinePlayer = Players:GetPlayerByUserId(userId)
	if onlinePlayer then
		displayName = onlinePlayer.DisplayName
	end
	return userId, username, displayName, onlinePlayer
end

local function filterDonationMessage(rawMessage, senderUserId)
	rawMessage = safeText(rawMessage or "", 300)
	if rawMessage == "" then return "" end
	senderUserId = tonumber(senderUserId) or 0
	if senderUserId <= 0 then return "" end
	local ok, filteredText = pcall(function()
		local filtered = TextService:FilterStringAsync(rawMessage, senderUserId, Enum.TextFilterContext.PublicChat)
		return filtered:GetNonChatStringForBroadcastAsync()
	end)
	if not ok or type(filteredText) ~= "string" then return "" end
	filteredText = safeText(filteredText, 300)
	if filteredText == "" then
		return ""
	end

	filteredText = filteredText:gsub("#+", "####")
	return filteredText
end

local function buildDonor(item)
	local rawName = safeText(item.username or item.donator_name or item.donorName or "Anonymous", 80)
	if rawName == "" then
		rawName = "Anonymous"
	end
	local rawDisplayName = safeText(item.display_name or item.displayName or item.donorDisplayName or "", 80)

	local message = safeText(item.message or "Terima kasih atas dukungannya!", 300)
	local donorUserId = select(1, resolvePlayer(rawName))
	message = filterDonationMessage(message, donorUserId)
	local mentionedName = safeText(
		item.targetName
			or item.target
			or item.recipient
			or item.to
			or message:match("@([%w_]+)")
			or "",
		80
	)

	local userId, username, displayName, onlinePlayer
	if mentionedName ~= "" then
		userId, username, displayName, onlinePlayer = resolvePlayer(mentionedName)
	end
	if not userId then
		userId, username, displayName, onlinePlayer = resolvePlayer(rawName)
	end

	if not userId then
		local loweredMessage = string.lower(message)
		for _, player in ipairs(Players:GetPlayers()) do
			local userName = string.lower(player.Name)
			if userName ~= "" and string.find(loweredMessage, userName, 1, true) then
				userId, username, displayName, onlinePlayer = player.UserId, player.Name, player.DisplayName, player
				break
			end
		end
	end

	local key
	if userId then
		key = "u_" .. tostring(userId)
	else
		local normalized = normalize(rawName)
		key = "g_" .. tostring(hashName(normalized))
		username = rawName
		displayName = rawName
	end

	local effectiveDisplayName

	if tonumber(userId) and tonumber(userId) > 0 and displayName and displayName ~= "" then
		effectiveDisplayName = displayName
	elseif rawDisplayName ~= "" and rawDisplayName ~= rawName then
		effectiveDisplayName = rawDisplayName
	else
		effectiveDisplayName = displayName or rawName
	end

	return {
		Key = key,
		UserId = tonumber(userId) or 0,
		Name = safeText(username or rawName, 80),
		DisplayName = safeText(effectiveDisplayName or username or rawName, 80),
		OriginalName = rawName,
		Message = message,
		TargetName = safeText(username or mentionedName or "", 80),
		TargetDisplayName = safeText(effectiveDisplayName or displayName or username or mentionedName or "", 80),
		TargetUserId = tonumber(userId) or 0,
		Player = onlinePlayer,
	}
end

local function cacheProfile(profile)
	profileCache[profile.Key] = profile
	memoryProfiles[profile.Key] = profile
end

local function persistProfile(profile)
	if type(profile) ~= "table" or not profile.Key then
		return
	end

	cacheProfile(profile)

	if useMemory or profileStore == nil then
		return
	end

	profilePending[profile.Key] = {
		Key = profile.Key,
		UserId = tonumber(profile.UserId) or 0,
		Name = safeText(profile.Name or "Unknown", 80),
		DisplayName = safeText(profile.DisplayName or profile.Name or "Unknown", 80),
	}
end

local function getUserInfoByUserId(userId)
	userId = tonumber(userId) or 0
	if userId <= 0 then
		return nil
	end

	local cached = userInfoCache[userId]
	if cached then
		return cached
	end

	local onlinePlayer = Players:GetPlayerByUserId(userId)
	if onlinePlayer then
		local info = {
			Id = userId,
			Username = onlinePlayer.Name,
			DisplayName = onlinePlayer.DisplayName,
		}
		userInfoCache[userId] = info
		return info
	end

	local ok, result = pcall(function()
		return UserService:GetUserInfosByUserIdsAsync({ userId })
	end)

	if ok and type(result) == "table" then
		for _, info in ipairs(result) do
			if tonumber(info.Id) == userId then
				local normalized = {
					Id = userId,
					Username = safeText(info.Username or "", 80),
					DisplayName = safeText(info.DisplayName or info.Username or "", 80),
				}
				if normalized.Username ~= "" then
					userInfoCache[userId] = normalized
					return normalized
				end
			end
		end
	end

	return nil
end

local function applyAuthoritativeUserInfo(profile)
	if type(profile) ~= "table" then
		return profile
	end

	local userId = tonumber(profile.UserId) or 0
	if userId <= 0 then
		return profile
	end

	local info = getUserInfoByUserId(userId)
	if not info then
		return profile
	end

	if info.Username ~= "" then
		profile.Name = info.Username
	end
	if info.DisplayName ~= "" then
		profile.DisplayName = info.DisplayName
	end

	displayNameChecked["u_" .. tostring(userId)] = true
	return profile
end

local function getProfile(key)
	key = trim(tostring(key or ""))
	if key == "" then
		return {
			Key = "",
			UserId = 0,
			Name = "Supporter",
			DisplayName = "Supporter",
		}
	end

	if profileCache[key] then
		local cached = profileCache[key]
		applyAuthoritativeUserInfo(cached)
		return cached
	end

	if useMemory and memoryProfiles[key] then
		local memProfile = memoryProfiles[key]
		applyAuthoritativeUserInfo(memProfile)
		profileCache[key] = memProfile
		return memProfile
	end

	if not useMemory and profileStore then
		local ok, data = pcall(function()
			return profileStore:GetAsync(key)
		end)

		if ok and type(data) == "table" then
			data.Key = key
			data.UserId = tonumber(data.UserId) or tonumber(key:match("^u_(%d+)$")) or 0
			data.Name = safeText(data.Name or "Unknown", 80)
			data.DisplayName = safeText(data.DisplayName or "", 80)

			applyAuthoritativeUserInfo(data)

			if data.DisplayName == "" then
				data.DisplayName = data.Name
			end

			profileCache[key] = data
			memoryProfiles[key] = data
			return data
		end
	end

	local userId = tonumber(key:match("^u_(%d+)$"))
	if userId then
		local onlinePlayer = Players:GetPlayerByUserId(userId)
		if onlinePlayer then
			local profile = {
				Key = key,
				UserId = userId,
				Name = onlinePlayer.Name,
				DisplayName = onlinePlayer.DisplayName,
			}
			profileCache[key] = profile
			memoryProfiles[key] = profile
			userInfoCache[userId] = {
				Id = userId,
				Username = onlinePlayer.Name,
				DisplayName = onlinePlayer.DisplayName,
			}
			return profile
		end

		local info = getUserInfoByUserId(userId)
		if info then
			local profile = {
				Key = key,
				UserId = userId,
				Name = info.Username,
				DisplayName = info.DisplayName ~= "" and info.DisplayName or info.Username,
			}
			profileCache[key] = profile
			memoryProfiles[key] = profile
			return profile
		end

		local nameOk, username = pcall(function()
			return Players:GetNameFromUserIdAsync(userId)
		end)
		if nameOk and type(username) == "string" then
			local profile = {
				Key = key,
				UserId = userId,
				Name = username,
				DisplayName = username,
			}
			profileCache[key] = profile
			memoryProfiles[key] = profile
			return profile
		end
	end

	return {
		Key = key,
		UserId = 0,
		Name = "Supporter",
		DisplayName = "Supporter",
	}
end

local function getThumbnail(userId)
	userId = tonumber(userId) or 0
	if userId <= 0 then
		return ""
	end
	if thumbnailCache[userId] ~= nil then
		return thumbnailCache[userId]
	end
	local ok, image = pcall(function()
		return Players:GetUserThumbnailAsync(
			userId,
			Enum.ThumbnailType.AvatarBust,
			Enum.ThumbnailSize.Size180x180
		)
	end)
	thumbnailCache[userId] = ok and image or ""
	return thumbnailCache[userId]
end

local function resolveLevel(amount)
	for _, levelData in ipairs(Config.DonationRealLevels or {}) do
		if amount >= (tonumber(levelData.minAmount) or math.huge) then
			return tonumber(levelData.level) or 1, tonumber(levelData.duration) or 6
		end
	end
	return 1, tonumber(Config.PopupRealDisplayDuration) or 7
end

local function selectSpecialEffect(amount)
	if Config.DonationRealSpecialEffectsEnabled ~= true then
		return nil
	end
	for _, tier in ipairs(Config.DonationRealSpecialEffects or {}) do
		if amount >= (tonumber(tier.minAmount) or math.huge) then
			return tostring(tier.effect or "")
		end
	end
	return nil
end

local function getLeaderstat(player)
	if not player or Config.UseRealLeaderstats ~= true then
		return nil
	end
	local leaderstats = player:FindFirstChild("leaderstats")
	if not leaderstats then
		leaderstats = Instance.new("Folder")
		leaderstats.Name = "leaderstats"
		leaderstats.Parent = player
	end

	local statName = tostring(Config.CurrencyLabel or "GOLD")
	local stat = leaderstats:FindFirstChild(statName)
	if not stat then
		stat = Instance.new("IntValue")
		stat.Name = statName
		stat.Parent = leaderstats
	end
	return stat
end

local function getStoredTotalForKey(key)
	key = trim(tostring(key or ""))
	if key == "" then
		return 0
	end

	if useMemory then
		return tonumber(memoryTotals[key]) or 0
	end

	if totalCacheLoaded[key] then
		return tonumber(memoryTotals[key]) or 0
	end

	if not allTimeStore then
		totalCacheLoaded[key] = true
		memoryTotals[key] = tonumber(memoryTotals[key]) or 0
		return memoryTotals[key]
	end

	local budgetOk = true
	pcall(function()
		budgetOk = DataStoreService:GetRequestBudgetForRequestType(
			Enum.DataStoreRequestType.GetAsync
		) >= 1
	end)

	if not budgetOk then
		return tonumber(memoryTotals[key]) or 0
	end

	local ok, value = pcall(function()
		return allTimeStore:GetAsync(key)
	end)

	if ok then
		memoryTotals[key] = tonumber(value) or 0
		totalCacheLoaded[key] = true
	end

	return tonumber(memoryTotals[key]) or 0
end

local function getStoredTotalForUser(userId)
	return getStoredTotalForKey("u_" .. tostring(userId))
end

local refreshBoards
local reapplyOverhead

local function setupPlayer(player)
	local stat = getLeaderstat(player)
	if stat then
		task.spawn(function()
			stat.Value = clampInteger(getStoredTotalForUser(player.UserId), 0, 2147483647)
		end)
	end

	local profile = {
		Key = "u_" .. tostring(player.UserId),
		UserId = player.UserId,
		Name = player.Name,
		DisplayName = player.DisplayName,
	}
	userInfoCache[player.UserId] = {
		Id = player.UserId,
		Username = player.Name,
		DisplayName = player.DisplayName,
	}
	task.spawn(persistProfile, profile)

	player.CharacterAdded:Connect(function(character)
		task.spawn(function()
			if not character or not character.Parent then
				return
			end

			character:WaitForChild("Head", 10)

			local retryDelays = {0, 0.1, 0.25, 0.5, 1, 1.5, 2}
			for _, delayTime in ipairs(retryDelays) do
				if delayTime > 0 then
					task.wait(delayTime)
				end

				if not player.Parent or player.Character ~= character or not character.Parent then
					return
				end

				local tag = character:FindFirstChild("CenzNameTag", true)
				if tag and tag:IsA("BillboardGui") then
					if reapplyOverhead then
						reapplyOverhead(player)
					end
					return
				end
			end
		end)
	end)
end

local function updateOnlineStat(donor, amount)
	local player = donor.Player or (donor.UserId > 0 and Players:GetPlayerByUserId(donor.UserId))
	if not player then
		return
	end
	local stat = getLeaderstat(player)
	if stat then
		stat.Value = clampInteger(stat.Value + amount, 0, 2147483647)
	end
end

local function addLiveEntry(payload)
	table.insert(liveEntries, 1, payload)
	while #liveEntries > (tonumber(Config.LiveBoardRowCount) or 10) do
		table.remove(liveEntries)
	end
end

local function publishGlobalDonation(payload)
	if type(payload) ~= "table" then
		return false
	end
	local donationId = safeText(payload.id, 180)
	if donationId == "" then
		return false
	end

	local message = {
		type = "YMADonateRealDonation",
		sourceJobId = game.JobId,
		payload = payload,
	}

	local body = HttpService:JSONEncode(message)
	for attempt = 1, 3 do
		local ok = pcall(function()
			MessagingService:PublishAsync(GLOBAL_DONATION_TOPIC, body)
		end)
		if ok then
			return true
		end
		if attempt < 3 then
			task.wait(attempt)
		end
	end
	return false
end

local function normalizeDonationIdentity(payload)
	if type(payload) ~= "table" then
		return payload
	end

	local userId = tonumber(
		payload.donorUserId
			or payload.userId
			or payload.DonorUserId
			or payload.UserId
			or payload.donorID
			or payload.effectUserId
	) or 0

	local username = safeText(
		payload.username
			or payload.donorUsername
			or payload.donorUserName
			or payload.effectUsername
			or payload.donator_name
			or "",
		80
	)

	local displayName = ""

	if userId > 0 then
		local onlinePlayer = Players:GetPlayerByUserId(userId)
		if onlinePlayer then
			username = onlinePlayer.Name
			displayName = onlinePlayer.DisplayName
		end
	end

	if displayName == "" and userId > 0 then
		local ok, infos = pcall(function()
			return UserService:GetUserInfosByUserIdsAsync({userId})
		end)
		if ok and type(infos) == "table" and infos[1] then
			local info = infos[1]
			if type(info.Name) == "string" and info.Name ~= "" then
				username = info.Name
			end
			if type(info.DisplayName) == "string" and info.DisplayName ~= "" then
				displayName = info.DisplayName
			end
		end
	end

	if userId <= 0 and username ~= "" then
		local cleanName = username:gsub("^@", ""):gsub("%s+", "")
		local validName = #cleanName >= 3 and #cleanName <= 20 and cleanName:match("^[%w_]+$") ~= nil

		if validName then
			local ok, resolvedUserId = pcall(function()
				return Players:GetUserIdFromNameAsync(cleanName)
			end)
			if ok and tonumber(resolvedUserId) and tonumber(resolvedUserId) > 0 then
				userId = tonumber(resolvedUserId)

				local onlinePlayer = Players:GetPlayerByUserId(userId)
				if onlinePlayer then
					username = onlinePlayer.Name
					displayName = onlinePlayer.DisplayName
				else
					local infoOk, infos = pcall(function()
						return UserService:GetUserInfosByUserIdsAsync({userId})
					end)
					if infoOk and type(infos) == "table" and infos[1] then
						local info = infos[1]
						if type(info.Name) == "string" and info.Name ~= "" then
							username = info.Name
						end
						if type(info.DisplayName) == "string" and info.DisplayName ~= "" then
							displayName = info.DisplayName
						end
					end
				end
			end
		end
	end

	if username == "" then
		username = safeText(
			payload.donorName
				or payload.displayName
				or "Anonymous",
			80
		)
	end

	if displayName == "" then
		local upstreamDisplay = safeText(
			payload.donorDisplayName
				or payload.displayName
				or "",
			80
		)

		if upstreamDisplay ~= "" and string.lower(upstreamDisplay) ~= string.lower(username) then
			displayName = upstreamDisplay
		else
			displayName = username ~= "" and username or "Anonymous"
		end
	end

	payload.username = username
	payload.donorUsername = username
	payload.displayName = displayName
	payload.donorName = displayName
	payload.donorDisplayName = displayName
	payload.donorUserId = userId
	payload.userId = userId

	payload.effectUsername = username
	payload.effectDisplayName = displayName
	payload.effectUserId = userId

	return payload
end

local fireDonationRemotes

local function syncDailyRuntimeFromPayload(payload)
	if type(payload) ~= "table" then
		return
	end

	local amount = tonumber(payload.amount) or 0
	local totalAmount = tonumber(payload.totalAmount) or 0
	if amount <= 0 and totalAmount <= 0 then
		return
	end

	local dayKey = currentDailyKey()
	getDailyStore()

	local donorKey = safeText(payload.donorKey, 180)
	local userId = tonumber(payload.donorUserId or payload.userId) or 0
	if donorKey == "" and userId > 0 then
		donorKey = "u_" .. tostring(userId)
	end
	if donorKey == "" then
		local username = safeText(payload.donorUsername or payload.username or payload.donorName, 80)
		if username ~= "" then
			donorKey = "g_" .. normalize(username)
		end
	end
	if donorKey == "" then
		return
	end

	local current = tonumber(memoryDaily[donorKey]) or 0
	local target = current + amount
	memoryDaily[donorKey] = target
	memoryDailyKey = dayKey

	local existing = profileCache[donorKey] or memoryProfiles[donorKey] or { Key = donorKey }
	existing.UserId = userId > 0 and userId or tonumber(existing.UserId) or 0
	existing.Name = safeText(payload.donorUsername or payload.username or existing.Name or "Supporter", 80)
	existing.DisplayName = safeText(payload.donorDisplayName or payload.displayName or payload.donorName or existing.DisplayName or existing.Name or "Supporter", 80)
	cacheProfile(existing)

	dailyBoardCacheKey = dayKey
	local found = false
	for _, entry in ipairs(dailyBoardCache) do
		if entry.Key == donorKey then
			entry.Amount = target
			entry.Profile = existing
			found = true
			break
		end
	end
	if not found then
		table.insert(dailyBoardCache, { Key = donorKey, Amount = target, Profile = existing, Thumbnail = "" })
	end
	table.sort(dailyBoardCache, function(a, b)
		if a.Amount == b.Amount then
			return tostring(a.Key) < tostring(b.Key)
		end
		return a.Amount > b.Amount
	end)
	while #dailyBoardCache > 100 do
		table.remove(dailyBoardCache)
	end
end

local function applyGlobalDonation(payload)
	if type(payload) ~= "table" then
		return
	end

	normalizeDonationIdentity(payload)

	local donationId = safeText(payload.id, 180)
	if donationId == "" or not rememberGlobalDonation(donationId) then
		return
	end

	syncDailyRuntimeFromPayload(payload)
	addLiveEntry(payload)

	local donorPlayer = payload.userId and tonumber(payload.userId) and Players:GetPlayerByUserId(tonumber(payload.userId))
	if donorPlayer then
		local stat = getLeaderstat(donorPlayer)
		if stat then
			local incomingTotal = clampInteger(payload.totalAmount, 0, 2147483647)
			if incomingTotal > stat.Value then
				stat.Value = incomingTotal
			end
		end
	end

	fireDonationRemotes(payload)
	internalUpdated:Fire(payload)
end

function fireDonationRemotes(payload)
	normalizeDonationIdentity(payload)

	local donorName = safeText(
		payload.donorDisplayName
			or payload.displayName
			or payload.donorName
			or payload.username
			or "Anonymous",
		80
	)

	local donorUsername = safeText(
		payload.donorUsername
			or payload.username
			or payload.effectUsername
			or donorName,
		80
	)

	local donorDisplayName = safeText(
		payload.donorDisplayName
			or payload.displayName
			or payload.effectDisplayName
			or donorName,
		80
	)

	local donorUserId = tonumber(
		payload.donorUserId
			or payload.userId
			or payload.effectUserId
	) or 0

	local targetName = payload.targetName ~= ""
		and payload.targetName
		or payload.username
		or payload.donorName

	local amount = payload.amount

	if confirmedRemote and confirmedRemote:IsA("RemoteEvent") then
		confirmedRemote:FireAllClients(
			payload,
			payload.donorName,
			payload.amount,
			payload.message,
			payload.targetUserId > 0 and payload.targetUserId or payload.userId,
			donorUsername,
			donorDisplayName,
			donorUserId
		)
	end

	local effectName = safeText(payload.effectName, 80)
	if effectName == "" then
		effectName = selectSpecialEffect(amount)
	end

	fireCinematic(payload)

	if effectName and effectsFolder then
		local effectRemote = effectsFolder:FindFirstChild(effectName)
		if effectRemote and effectRemote:IsA("RemoteEvent") then
			effectRemote:FireAllClients(
				donorName,
				targetName,
				amount,
				payload.duration,
				payload,
				donorUsername,
				donorDisplayName,
				donorUserId
			)
		end
	end

	task.spawn(function()
		local ok, errorMessage = pcall(ParticleApplier.Apply, payload)
		if not ok then
			warn("[YMADonateRealParticle] apply failed:", errorMessage)
		end
	end)

	if Config.FireworksRealEnabled == true and fireworksBcast and fireworksBcast:IsA("RemoteEvent") then
		fireworksBcast:FireAllClients(
			donorName,
			targetName,
			amount,
			payload,
			donorUsername,
			donorDisplayName,
			donorUserId
		)
	end
end

local function addPendingDelta(bucket, key, amount)
	key = trim(tostring(key or ""))
	amount = tonumber(amount) or 0
	if key == "" or amount == 0 then
		return
	end
	bucket[key] = (tonumber(bucket[key]) or 0) + amount
end

local function updateStores(donor, amount)
	amount = tonumber(amount) or 0
	if amount <= 0 then
		return false, 0
	end

	if useMemory then
		getDailyStore()
		memoryTotals[donor.Key] = (tonumber(memoryTotals[donor.Key]) or 0) + amount
		memoryDaily[donor.Key] = (tonumber(memoryDaily[donor.Key]) or 0) + amount
		return true, memoryTotals[donor.Key]
	end

	local currentTotal = getStoredTotalForKey(donor.Key)
	memoryTotals[donor.Key] = tonumber(currentTotal) or 0
	memoryTotals[donor.Key] += amount
	totalCacheLoaded[donor.Key] = true
	addPendingDelta(totalPendingDelta, donor.Key, amount)

	local dayStore = getDailyStore()
	if dayStore then
		local dayKey = tostring(dailyStoreKey or "")
		if dayKey ~= "" then
			dailyCacheLoaded[dayKey] = dailyCacheLoaded[dayKey] or {}

			if not dailyCacheLoaded[dayKey][donor.Key] then
				local cachedValue = 0
				local budgetOk = true
				pcall(function()
					budgetOk = DataStoreService:GetRequestBudgetForRequestType(
						Enum.DataStoreRequestType.GetAsync
					) >= 1
				end)

				if budgetOk then
					local ok, value = pcall(function()
						return dayStore:GetAsync(donor.Key)
					end)
					if ok then
						cachedValue = tonumber(value) or 0
						dailyCacheLoaded[dayKey][donor.Key] = true
					end
				end

				if not dailyCacheLoaded[dayKey][donor.Key] then
					dailyCacheLoaded[dayKey][donor.Key] = true
				end

				memoryDaily[donor.Key] = cachedValue
			end

			memoryDaily[donor.Key] = (tonumber(memoryDaily[donor.Key]) or 0) + amount
			dailyPendingDelta[dayKey] = dailyPendingDelta[dayKey] or {}
			addPendingDelta(dailyPendingDelta[dayKey], donor.Key, amount)
		end
	end

	return true, memoryTotals[donor.Key]
end

local function flushDataStoreQueue(force)
	if useMemory or datastoreFlushRunning then
		if datastoreFlushRunning then
			datastoreFlushAgain = true
		end
		return false
	end

	if not allTimeStore and not profileStore and next(dailyPendingDelta) == nil then
		return false
	end

	if not force and os.clock() - lastDatastoreFlush < DATASTORE_FLUSH_INTERVAL then
		return true
	end

	datastoreFlushRunning = true
	datastoreFlushAgain = false
	lastDatastoreFlush = os.clock()

	local function budgetAvailable(requestType)
		local available = false
		pcall(function()
			available = DataStoreService:GetRequestBudgetForRequestType(requestType) >= 1
		end)
		return available
	end

	local hadFailure = false

	for key, profile in pairs(profilePending) do
		if not budgetAvailable(Enum.DataStoreRequestType.UpdateAsync) then
			break
		end

		local ok = pcall(function()
			profileStore:UpdateAsync(key, function(old)
				old = type(old) == "table" and old or {}
				old.Key = key
				old.UserId = tonumber(profile.UserId) or 0
				old.Name = profile.Name
				old.DisplayName = profile.DisplayName
				old.UpdatedAt = os.time()
				return old
			end)
		end)

		if ok then
			profilePending[key] = nil
		else
			hadFailure = true
		end
		task.wait()
	end

	if allTimeStore then
		local snapshot = totalPendingDelta
		totalPendingDelta = {}

		for key, delta in pairs(snapshot) do
			if not budgetAvailable(Enum.DataStoreRequestType.UpdateAsync) then
				addPendingDelta(totalPendingDelta, key, delta)
				hadFailure = true
				continue
			end

			local ok = pcall(function()
				allTimeStore:UpdateAsync(key, function(old)
					return (tonumber(old) or 0) + delta
				end)
			end)

			if not ok then
				addPendingDelta(totalPendingDelta, key, delta)
				hadFailure = true
			end
			task.wait()
		end
	end

	for dayKey, bucket in pairs(dailyPendingDelta) do
		if type(bucket) == "table" and next(bucket) ~= nil then
			local dayStoreForFlush = DataStoreService:GetOrderedDataStore(
				tostring(Config.DailyStorePrefix or "YMADonateRealDaily_CleanV1") .. "_" .. tostring(dayKey)
			)
			local snapshot = bucket
			dailyPendingDelta[dayKey] = {}

			for key, delta in pairs(snapshot) do
				if not budgetAvailable(Enum.DataStoreRequestType.UpdateAsync) then
					addPendingDelta(dailyPendingDelta[dayKey], key, delta)
					hadFailure = true
					continue
				end

				local ok = pcall(function()
					dayStoreForFlush:UpdateAsync(key, function(old)
						return (tonumber(old) or 0) + delta
					end)
				end)

				if not ok then
					addPendingDelta(dailyPendingDelta[dayKey], key, delta)
					hadFailure = true
				end
				task.wait()
			end

			if next(dailyPendingDelta[dayKey]) == nil then
				dailyPendingDelta[dayKey] = nil
			end
		end
	end

	datastoreFlushRunning = false

	if datastoreFlushAgain then
		datastoreFlushAgain = false
		task.defer(flushDataStoreQueue, true)
	end

	return not hadFailure
end

local function startDataStoreFlushLoop()
	if useMemory then
		return
	end

	task.spawn(function()
		while started do
			task.wait(DATASTORE_FLUSH_INTERVAL)
			if next(profilePending) ~= nil
				or next(totalPendingDelta) ~= nil
				or next(dailyPendingDelta) ~= nil then
				flushDataStoreQueue(false)
			end
		end
	end)
end

local function claimReceipt(receiptId)
	if receiptId == "" then
		return true, "no_id"
	end
	if useMemory then
		if memoryReceipts[receiptId] == "done" then
			return false, "done"
		end
		if memoryReceipts[receiptId] == "processing" then
			return false, "processing"
		end
		memoryReceipts[receiptId] = "processing"
		return true, "claimed"
	end

	local claimed = false
	local now = os.time()
	local ok, state = pcall(function()
		return receiptStore:UpdateAsync(receiptId, function(old)
			if type(old) == "table" then
				if old.status == "done" then
					return old
				end
				if old.status == "processing" and now - (tonumber(old.updatedAt) or now) < 120 then
					return old
				end
			end
			claimed = true
			return {
				status = "processing",
				updatedAt = now,
				jobId = game.JobId,
			}
		end)
	end)
	if not ok then
		return false, "receipt_store_failed"
	end
	if type(state) == "table" and state.status == "done" then
		return false, "done"
	end
	return claimed, claimed and "claimed" or "processing"
end

local function finishReceipt(receiptId, success)
	if receiptId == "" then
		return
	end
	if useMemory then
		memoryReceipts[receiptId] = success and "done" or nil
		return
	end
	if success then
		pcall(function()
			receiptStore:SetAsync(receiptId, {
				status = "done",
				updatedAt = os.time(),
				jobId = game.JobId,
			})
		end)
	else
		pcall(function()
			receiptStore:RemoveAsync(receiptId)
		end)
	end
end

local function sendDiscordWebhook(payload)
	local webhookUrl = tostring(Config.DiscordWebhookUrl or "")
	if webhookUrl == "" then
		return
	end

	local gameName = tostring(Config.GameName or "Roblox Game")
	local donorName = tostring(payload.donorName or "Anonymous")
	local amount = tostring(payload.formattedAmount or payload.amount or "0")
	local message = tostring(payload.message or "")
	local targetName = tostring(payload.targetName or "")
	local totalAmount = tostring(payload.totalFormattedAmount or "")
	local createdAt = tostring(payload.createdAt or os.date("!%Y-%m-%dT%H:%M:%SZ"))

	local fields = {
		{ name = "Donor", value = donorName, inline = true },
		{ name = "Amount", value = amount, inline = true },
	}

	if targetName ~= "" then
		table.insert(fields, { name = "Target", value = "@" .. targetName, inline = true })
	end

	if totalAmount ~= "" then
		table.insert(fields, { name = "Total Donated", value = totalAmount, inline = true })
	end

	if message ~= "" then
		table.insert(fields, { name = "Message", value = message, inline = false })
	end

	local embed = {
		title = "Donation Received!",
		description = "A new donation has been received in **" .. gameName .. "**",
		color = 0xFF8C3C,
		fields = fields,
		timestamp = createdAt,
		footer = { text = gameName .. " Donation System" },
	}

	local body = HttpService:JSONEncode({ embeds = { embed } })

	local ok, err = pcall(function()
		HttpService:RequestAsync({
			Url = webhookUrl,
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = body,
		})
	end)

	if not ok then
		warn("[YMADonateReal] Discord webhook failed:", err)
	end
end

local function recordDonation(item)
	local amount = clampInteger(item.amount or item.amount_raw or item.amountRaw, 0, 2147483647)
	if amount <= 0 then
		return false, "invalid_amount"
	end

	local donor = buildDonor(item)
	persistProfile(donor)

	local stored, totalAmount = updateStores(donor, amount)
	if not stored then
		return false, "datastore_failed"
	end

	local level, duration = resolveLevel(amount)
	local effectName = selectSpecialEffect(amount)
	local payload = {
		id = safeText(item.id or HttpService:GenerateGUID(false), 180),
		donorKey = donor.Key,
		donorName = donor.DisplayName,
		donorDisplayName = donor.DisplayName,
		username = donor.Name,
		displayName = donor.DisplayName,
		userId = donor.UserId,

		donorUsername = donor.Name,
		donorUserId = donor.UserId,
		effectUsername = donor.Name,
		effectDisplayName = donor.DisplayName,
		effectUserId = donor.UserId,
		targetName = donor.TargetName,
		targetDisplayName = donor.TargetDisplayName,
		targetUserId = donor.TargetUserId,
		amount = amount,
		totalAmount = clampInteger(totalAmount, 0, 2147483647),
		formattedAmount = formatAmount(amount),
		totalFormattedAmount = formatAmount(totalAmount),
		message = donor.Message,
		level = level,
		duration = duration,
		effectName = effectName,
		gameName = tostring(Config.GameName or "FREE HOURS"),
		currency = tostring(Config.CurrencyLabel or "GOLD"),
		createdAt = safeText(item.createdAt or item.created_at or os.date("!%Y-%m-%dT%H:%M:%SZ"), 100),
	}

	normalizeDonationIdentity(payload)
	addLiveEntry(payload)
	updateOnlineStat(donor, amount)
	rememberGlobalDonation(payload.id)
	fireDonationRemotes(payload)
	task.spawn(sendDiscordWebhook, payload)
	internalUpdated:Fire(payload)

	task.spawn(function()
		publishGlobalDonation(payload)
	end)

	return true, payload
end
Runtime.RecordDonation = recordDonation

local function recordFakeDonation(item)
	local amount = clampInteger(item.amount or item.amount_raw or item.amountRaw, 0, 2147483647)
	if amount <= 0 then
		return false, "invalid_amount"
	end

	local donor = buildDonor(item)
	persistProfile(donor)

	local stored, totalAmount = updateStores(donor, amount)
	if not stored then
		return false, "datastore_failed"
	end

	updateOnlineStat(donor, amount)

	local level, duration = resolveLevel(amount)
	local effectName = selectSpecialEffect(amount)
	local payload = {
		id = safeText(item.id or HttpService:GenerateGUID(false), 180),
		donorKey = donor.Key,
		donorName = donor.DisplayName,
		donorDisplayName = donor.DisplayName,
		username = donor.Name,
		displayName = donor.DisplayName,
		userId = donor.UserId,

		donorUsername = donor.Name,
		donorUserId = donor.UserId,
		effectUsername = donor.Name,
		effectDisplayName = donor.DisplayName,
		effectUserId = donor.UserId,
		targetName = donor.TargetName,
		targetDisplayName = donor.TargetDisplayName,
		targetUserId = donor.TargetUserId,
		amount = amount,
		totalAmount = clampInteger(totalAmount, 0, 2147483647),
		formattedAmount = formatAmount(amount),
		totalFormattedAmount = formatAmount(totalAmount),
		message = donor.Message,
		level = level,
		duration = duration,
		effectName = effectName,
		gameName = tostring(Config.GameName or "FREE HOURS"),
		currency = tostring(Config.CurrencyLabel or "GOLD"),
		createdAt = safeText(item.createdAt or item.created_at or os.date("!%Y-%m-%dT%H:%M:%SZ"), 100),
	}

	normalizeDonationIdentity(payload)
	addLiveEntry(payload)
	fireDonationRemotes(payload)
	internalUpdated:Fire(payload)
	return true, payload
end
Runtime.RecordFakeDonation = recordFakeDonation

local function entriesFromMemory(source, limit)
	local entries = {}
	for key, amount in pairs(source) do
		table.insert(entries, {
			Key = key,
			Amount = tonumber(amount) or 0,
		})
	end
	table.sort(entries, function(a, b)
		if a.Amount == b.Amount then
			return a.Key < b.Key
		end
		return a.Amount > b.Amount
	end)
	while #entries > limit do
		table.remove(entries)
	end
	return entries
end

local function getTopEntries(limit)
	local entries = {}
	if useMemory then
		entries = entriesFromMemory(memoryTotals, limit)
	else
		local budgetOk = false
		pcall(function()
			budgetOk = DataStoreService:GetRequestBudgetForRequestType(
				Enum.DataStoreRequestType.GetSortedAsync
			) >= 1
		end)
		if not budgetOk then
			return entries
		end
		local ok, pages = pcall(function()
			return allTimeStore:GetSortedAsync(false, limit)
		end)
		if not ok then
			return entries
		end
		for _, row in ipairs(pages:GetCurrentPage()) do
			table.insert(entries, {
				Key = tostring(row.key),
				Amount = tonumber(row.value) or 0,
			})
		end
	end

	for index = #entries, 1, -1 do
		if (tonumber(entries[index].Amount) or 0) <= 0 then
			table.remove(entries, index)
		end
	end

	for index, entry in ipairs(entries) do
		entry.Rank = index
		entry.Profile = getProfile(entry.Key)
		if index <= 25 and entry.Profile.UserId > 0 then
			entry.Thumbnail = getThumbnail(entry.Profile.UserId)
		else
			entry.Thumbnail = ""
		end
		if index % 5 == 0 then
			task.wait()
		end
	end
	return entries
end

local function getDailyTopEntries(limit)
	limit = clampInteger(limit or 10, 1, 100)
	local currentDay = currentDailyKey()

	if dailyBoardCacheKey ~= currentDay then
		dailyBoardCacheKey = currentDay
		table.clear(dailyBoardCache)
		if memoryDailyKey ~= currentDay then
			table.clear(memoryDaily)
			memoryDailyKey = currentDay
		end
	end

	local merged = {}
	local function mergeEntry(key, amount, profile, thumbnail)
		key = tostring(key or "")
		amount = tonumber(amount) or 0
		if key == "" or amount <= 0 then
			return
		end
		local existing = merged[key]
		if not existing or amount > existing.Amount then
			merged[key] = { Key = key, Amount = amount, Profile = profile, Thumbnail = thumbnail or "" }
		end
	end

	if not useMemory then
		local dayStore = getDailyStore()
		local budgetOk = false
		pcall(function()
			budgetOk = DataStoreService:GetRequestBudgetForRequestType(Enum.DataStoreRequestType.GetSortedAsync) >= 1
		end)
		if dayStore and budgetOk then
			local ok, pages = pcall(function()
				return dayStore:GetSortedAsync(false, limit)
			end)
			if ok and pages then
				for _, row in ipairs(pages:GetCurrentPage()) do
					mergeEntry(tostring(row.key), tonumber(row.value) or 0)
				end
			end
		end
	end

	for key, amount in pairs(memoryDaily) do
		mergeEntry(key, amount)
	end
	for _, entry in ipairs(dailyBoardCache) do
		mergeEntry(entry.Key, entry.Amount, entry.Profile, entry.Thumbnail)
	end

	local entries = {}
	for _, entry in pairs(merged) do
		if entry.Amount > 0 then
			entry.Profile = entry.Profile or getProfile(entry.Key)
			if entry.Profile and entry.Profile.UserId > 0 and entry.Thumbnail == "" then
				entry.Thumbnail = getThumbnail(entry.Profile.UserId)
			end
			table.insert(entries, entry)
		end
	end

	table.sort(entries, function(a, b)
		if a.Amount == b.Amount then
			local an = a.Profile and (a.Profile.DisplayName or a.Profile.Name) or a.Key
			local bn = b.Profile and (b.Profile.DisplayName or b.Profile.Name) or b.Key
			return tostring(an) < tostring(bn)
		end
		return a.Amount > b.Amount
	end)

	while #entries > limit do
		table.remove(entries)
	end
	for index, entry in ipairs(entries) do
		entry.Rank = index
	end

	table.clear(dailyBoardCache)
	for _, entry in ipairs(entries) do
		table.insert(dailyBoardCache, {
			Key = entry.Key, Amount = entry.Amount, Profile = entry.Profile, Thumbnail = entry.Thumbnail or ""
		})
	end
	dailyBoardCacheKey = currentDay

	return entries
end

Runtime.GetTopEntries = function(limit)
	local output = {}
	local maximum = math.min(tonumber(limit) or #topEntries, #topEntries)
	for index = 1, maximum do
		output[index] = topEntries[index]
	end
	return output
end
Runtime.GetLiveEntries = function()
	return liveEntries
end

local function findAreaPart(partName)
	local area = Workspace:FindFirstChild("YMADonateRealArea")
	return area and area:FindFirstChild(partName)
end

local function findCleanBoardSurface(partName, surfaceName)
	local part = findAreaPart(partName)
	local surface = part and part:FindFirstChild(surfaceName)
	local rootFrame = surface and surface:FindFirstChild("Root")
	local scroll = rootFrame and rootFrame:FindFirstChild("Scroll")
	return rootFrame, scroll
end

local function setProperty(instance, property, value)
	if instance and instance[property] ~= value then
		instance[property] = value
	end
end

local function entryProfile(entry)
	if not entry then
		return nil
	end
	return entry.Profile or getProfile(entry.Key)
end

local function updateWokTopCard(card, index, entry)
	if not card then
		return
	end
	local platform = card:FindFirstChild("Platform")
	local rankLabel = platform and platform:FindFirstChildOfClass("TextLabel")
	local avatarWrap = card:FindFirstChild("AvatarWrap")
	local avatar = avatarWrap and avatarWrap:FindFirstChild("Avatar")
	local info = card:FindFirstChild("Info")
	local nameLabel = info and info:FindFirstChild("DisplayName")
	local amountRow = info and info:FindFirstChild("AmtRow")
	local amountLabel = amountRow and amountRow:FindFirstChild("Amount")
	setProperty(rankLabel, "Text", "#" .. tostring(index))
	if entry then
		local profile = entryProfile(entry)
		setProperty(nameLabel, "Text", profile and (profile.DisplayName or profile.Name) or "Supporter")
		setProperty(amountLabel, "Text", formatAmount(entry.Amount))
		setProperty(avatar, "Image", entry.Thumbnail or "")
	else
		setProperty(nameLabel, "Text", "No Data")
		setProperty(amountLabel, "Text", formatAmount(0))
		setProperty(avatar, "Image", "")
	end
end

local function updateTopBoard(entries)
	local part = findAreaPart("YMATopRealBoard")

	if part then
		local surfaceGui = part:FindFirstChild("SurfaceGui")
		if surfaceGui then
			local body = surfaceGui:FindFirstChild("Body")
			local container = body and body:FindFirstChild("Container")
			local booting = container and container:FindFirstChild("Booting")
			local content = booting and booting:FindFirstChild("Content")
			local page = content and content:FindFirstChild("Page")
			if page then
				local topBar = content:FindFirstChild("TopBar")
				if topBar then
					local leftFrame = topBar:FindFirstChild("Left")
					local details = leftFrame and leftFrame:FindFirstChild("Details")
					if details then
						local titleLabel = details:FindFirstChild("Title")
						local descLabel = details:FindFirstChild("Description")
						setProperty(titleLabel, "Text", "TOP DONATION " .. string.upper(tostring(Config.CurrencyLabel or "GOLD")))
						setProperty(descLabel, "Text", string.format("ALL TIME %d SUPPORTERS", #entries))
					end
				end

				local podiumRoot = page:FindFirstChild("PodiumRoot")
				if podiumRoot then
					for index = 1, 3 do
						local slot = podiumRoot:FindFirstChild("Slot_" .. index)
						if slot then
							local head = slot:FindFirstChild("Head")
							local nameLabel = head and head:FindFirstChild("Name")
							local userLabel = head and head:FindFirstChild("User")
							local amountHolder = head and head:FindFirstChild("NameAmountHolder")
							local valueFrame = amountHolder and amountHolder:FindFirstChild("Value")
							local amountLabel = valueFrame and valueFrame:FindFirstChild("Amount")
							local avatarBox = head and head:FindFirstChild("AvatarBox")
							local avatarFrame = avatarBox and avatarBox:FindFirstChild("Avatar")
							local avatarImage = avatarFrame and avatarFrame:FindFirstChild("Avatar")
							local rankBadge = avatarBox and avatarBox:FindFirstChild("RankBadge")
							local rankBadgeNum = rankBadge and rankBadge:FindFirstChild("RankBadgeNum")

							local entry = entries[index]
							setProperty(rankBadgeNum, "Text", tostring(index))
							if entry then
								local profile = entryProfile(entry)
								setProperty(nameLabel, "Text", profile and (profile.DisplayName or profile.Name) or "Supporter")
								setProperty(userLabel, "Text", profile and profile.UserId > 0 and ("@" .. tostring(profile.Name)) or "EXTERNAL SUPPORTER")
								setProperty(amountLabel, "Text", addSeparators(entry.Amount))
								setProperty(avatarImage, "Image", entry.Thumbnail or "")
							else
								setProperty(nameLabel, "Text", "No Data")
								setProperty(userLabel, "Text", "@waiting")
								setProperty(amountLabel, "Text", addSeparators(0))
								setProperty(avatarImage, "Image", "")
							end
						end
					end
				end

				local listScroll = page:FindFirstChild("List")
				if listScroll and listScroll:IsA("ScrollingFrame") then
					local rowCount = math.min(tonumber(Config.TopDonorRealRowCount) or 50, 50)
					for index = 4, rowCount do
						local row = listScroll:FindFirstChild("Entry_" .. index)
						if row then
							local entry = entries[index]
							local foto = row:FindFirstChild("Foto")
							local userLabel = row:FindFirstChild("User")
							local urutan = row:FindFirstChild("urutan")
							local total = row:FindFirstChild("Total")

							setProperty(urutan, "Text", tostring(index))
							if entry then
								local profile = entryProfile(entry)
								setProperty(userLabel, "Text", profile and (profile.DisplayName or profile.Name) or "Supporter")
								setProperty(total, "Text", addSeparators(entry.Amount))
								setProperty(foto, "Image", entry.Thumbnail or "")
							else
								setProperty(userLabel, "Text", "-")
								setProperty(total, "Text", "-")
								setProperty(foto, "Image", "")
							end
						end
						if index % 20 == 0 then
							task.wait()
						end
					end
				end

				return
			end
		end
	end

	local surface = part and part:FindFirstChild("UIGoldDisplay")
	local wokRoot = surface and surface:FindFirstChild("Frame")
	if wokRoot then
		local title = wokRoot:FindFirstChild("TextLabel")
		setProperty(title, "Text", "TOP DONATION " .. string.upper(tostring(Config.CurrencyLabel or "GOLD")))

		local top3 = wokRoot:FindFirstChild("Top3Frame")
		for index = 1, 3 do
			updateWokTopCard(top3 and top3:FindFirstChild("Top3_" .. index), index, entries[index])
		end

		local scroll = wokRoot:FindFirstChild("ScrollingFrame")
		if scroll then
			local rowCount = math.min(tonumber(Config.TopDonorRealRowCount) or 100, 100)
			for index = 4, rowCount do
				local row = scroll:FindFirstChild(string.format("Row%03d", index))
				if row then
					local entry = entries[index]
					local profile = entryProfile(entry)
					local rank = row:FindFirstChild("Index")
					local avatarWrap = row:FindFirstChild("AvatarWrap")
					local avatar = avatarWrap and avatarWrap:FindFirstChild("Avatar")
					local nameLabel = row:FindFirstChild("DisplayName")
					local right = row:FindFirstChild("Right")
					local amountLabel = right and right:FindFirstChild("Amount")
					setProperty(rank, "Text", "#" .. tostring(index))
					if entry then
						setProperty(nameLabel, "Text", profile and (profile.DisplayName or profile.Name) or "Supporter")
						setProperty(amountLabel, "Text", addSeparators(entry.Amount))
						setProperty(avatar, "Image", entry.Thumbnail or "")
					else
						setProperty(nameLabel, "Text", "-")
						setProperty(amountLabel, "Text", "-")
						setProperty(avatar, "Image", "")
					end
				end
				if index % 20 == 0 then
					task.wait()
				end
			end
		end
		return
	end

	local rootFrame, scroll = findCleanBoardSurface("YMATopRealBoard", "YMADonateRealTopSurface")
	if not scroll then
		return
	end
	local header = rootFrame:FindFirstChild("Header")
	local sub = header and header:FindFirstChild("Sub")
	setProperty(sub, "Text", string.format("ALL TIME %d SUPPORTERS", #entries))
	local rowCount = tonumber(Config.TopDonorRealRowCount) or 100
	for index = 1, rowCount do
		local row = scroll:FindFirstChild("Row" .. index)
		if row then
			local entry = entries[index]
			local rank = row:FindFirstChild("Rank")
			local avatar = row:FindFirstChild("Avatar")
			local nameLabel = row:FindFirstChild("Name")
			local userLabel = row:FindFirstChild("User")
			local scoreLabel = row:FindFirstChild("Score")
			setProperty(rank, "Text", string.format("#%02d", index))
			if entry then
				local profile = entryProfile(entry)
				setProperty(nameLabel, "Text", profile.DisplayName or profile.Name or "Supporter")
				local userText = profile.UserId > 0 and ("@" .. tostring(profile.Name)) or "EXTERNAL SUPPORTER"
				setProperty(userLabel, "Text", userText)
				setProperty(scoreLabel, "Text", formatAmount(entry.Amount))
				setProperty(avatar, "Image", entry.Thumbnail or "")
			else
				setProperty(nameLabel, "Text", "No Data")
				setProperty(userLabel, "Text", "@waiting")
				setProperty(scoreLabel, "Text", formatAmount(0))
				setProperty(avatar, "Image", "")
			end
		end
	end
end

local function updateLiveBoard()
	local part = findAreaPart("YMALiveRealBoard")
	local surface = part and part:FindFirstChild("YMALiveRealGui")
	local wokRoot = surface and surface:FindFirstChild("MainContainer")
	if not wokRoot then
		return
	end

	local headerFrame = wokRoot:FindFirstChild("Frame")
	local header = headerFrame and headerFrame:FindFirstChildOfClass("TextLabel")
	setProperty(header, "Text", "LIVE " .. string.upper(tostring(Config.CurrencyLabel or "GOLD")) .. " DONATIONS")

	local scroll = wokRoot:FindFirstChild("ScrollingFrame")
	if not scroll then
		return
	end
	pcall(function()
		scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
	end)

	local rows = {}
	for _, child in ipairs(scroll:GetChildren()) do
		if child:IsA("Frame") then
			table.insert(rows, child)
		end
	end
	table.sort(rows, function(a, b)
		if a.LayoutOrder == b.LayoutOrder then
			return a:GetDebugId() < b:GetDebugId()
		end
		return a.LayoutOrder < b.LayoutOrder
	end)

	local maximum = math.min(tonumber(Config.LiveBoardRowCount) or 10, #rows)
	for index, row in ipairs(rows) do
		local entry = index <= maximum and liveEntries[index] or nil
		row.Visible = entry ~= nil
		if entry then
			local topSection = row:FindFirstChild("TopSection")
			local avatar = topSection and topSection:FindFirstChildWhichIsA("ImageLabel", true)
			local infoFrame
			if topSection then
				for _, child in ipairs(topSection:GetChildren()) do
					if child:IsA("Frame") then
						local count = 0
						for _, grandchild in ipairs(child:GetChildren()) do
							if grandchild:IsA("TextLabel") then
								count += 1
							end
						end
						if count >= 3 then
							infoFrame = child
							break
						end
					end
				end
			end

			local labels = {}
			if infoFrame then
				for _, child in ipairs(infoFrame:GetChildren()) do
					if child:IsA("TextLabel") then
						table.insert(labels, child)
					end
				end
				table.sort(labels, function(a, b)
					return a.LayoutOrder < b.LayoutOrder
				end)
			end

			setProperty(labels[1], "Text", entry.displayName or entry.donorName or "Supporter")
			local targetName = entry.targetName or entry.username or ""
			setProperty(labels[2], "Text", targetName ~= "" and ("@" .. targetName) or "@supporter")
			setProperty(labels[3], "Text", entry.formattedAmount or formatAmount(entry.amount or 0))

			local messageLabel
			for _, child in ipairs(row:GetChildren()) do
				if child:IsA("Frame") and child ~= topSection then
					messageLabel = child:FindFirstChildWhichIsA("TextLabel", true)
					if messageLabel then
						break
					end
				end
			end
			setProperty(messageLabel, "Text", entry.message ~= "" and entry.message or "Thank you for your support")

			local thumbUserId = tonumber(entry.targetUserId or entry.userId) or 0
			setProperty(avatar, "Image", thumbUserId > 0 and getThumbnail(thumbUserId) or "")
		end
	end
end

local function updateMessageBoard()
	local part = findAreaPart("YMAMessageRealBoard")
	local surface = part and part:FindFirstChild("MessRPBoard")
	local wokRoot = surface and surface:FindFirstChild("Frame")
	if wokRoot then
		local gameName = wokRoot:FindFirstChild("GameName")
		local playerName = wokRoot:FindFirstChild("PlayerName")
		local messageLabel = wokRoot:FindFirstChild("Message")
		local entry = liveEntries[1]
		setProperty(gameName, "Text", tostring(Config.GameName or "GAME NAME"))
		if entry then
			local msg = entry.message ~= "" and entry.message or "Thank you for your support!"
			setProperty(messageLabel, "Text", msg .. "\\n- " .. (entry.displayName or entry.donorName))
			setProperty(playerName, "Text", "")
		else
			setProperty(messageLabel, "Text", "")
			setProperty(playerName, "Text", "")
		end
		return
	end

	local rootFrame, scroll = findCleanBoardSurface("YMAMessageRealBoard", "YMADonateRealMessageSurface")
	if not scroll then
		return
	end
	for index = 1, (tonumber(Config.LiveBoardRowCount) or 10) do
		local row = scroll:FindFirstChild("Row" .. index)
		if row then
			local entry = liveEntries[index]
			local rank = row:FindFirstChild("Rank")
			local avatar = row:FindFirstChild("Avatar")
			local nameLabel = row:FindFirstChild("Name")
			local userLabel = row:FindFirstChild("User")
			local scoreLabel = row:FindFirstChild("Score")
			setProperty(rank, "Text", entry and string.format("%02d", index) or "--")
			if entry then
				setProperty(nameLabel, "Text", entry.displayName or entry.donorName)
				setProperty(userLabel, "Text", entry.message ~= "" and entry.message or "Thank you!")
				setProperty(scoreLabel, "Text", entry.formattedAmount)
				setProperty(avatar, "Image", entry.userId > 0 and getThumbnail(entry.userId) or "")
			else
				setProperty(nameLabel, "Text", "No message yet")
				setProperty(userLabel, "Text", "Donate to appear here")
				setProperty(scoreLabel, "Text", "")
				setProperty(avatar, "Image", "")
			end
		end
	end
end

local function updateLiveDonationMessageGold()
	local part = findAreaPart("YMALiveDonationMessageGold")
	if not part then return end
	local surfaceGui = part:FindFirstChild("SurfaceGui")
	if not surfaceGui then return end
	local body = surfaceGui:FindFirstChild("Body")
	local container = body and body:FindFirstChild("Container")
	local booting = container and container:FindFirstChild("Booting")
	local content = booting and booting:FindFirstChild("Content")
	if not content then return end

	local topBar = content:FindFirstChild("TopBar")
	if topBar then
		local left = topBar:FindFirstChild("Left")
		local details = left and left:FindFirstChild("Details")
		if details then
			setProperty(details:FindFirstChild("Title"), "Text", "LIVE " .. string.upper(tostring(Config.CurrencyLabel or "GOLD")) .. " DONATIONS")
			setProperty(details:FindFirstChild("Description"), "Text", string.format("RECENT %d ENTRIES", #liveEntries))
		end
	end

	local page = content:FindFirstChild("Page")
	local list = page and page:FindFirstChild("List")
	if not list then return end

	for i = 1, 10 do
		local row = list:FindFirstChild("Live_" .. i)
		if not row then continue end
		local entry = liveEntries[i]
		row.Visible = entry ~= nil
		if entry then
			local topSection = row:FindFirstChild("TopSection")
			if topSection then
				local avatarFrame = topSection:FindFirstChild("AvatarFrame")
				local avatarImage = avatarFrame and avatarFrame:FindFirstChildWhichIsA("ImageLabel")
				local thumbUserId = tonumber(entry.userId or entry.donorUserId) or 0
				setProperty(avatarImage, "Image", thumbUserId > 0 and getThumbnail(thumbUserId) or "")

				local displayFrame = topSection:FindFirstChild("DisplaynameAmountFrame")
				if displayFrame then
					local labels = {}
					for _, child in ipairs(displayFrame:GetChildren()) do
						if child:IsA("TextLabel") then
							table.insert(labels, child)
						end
					end
					table.sort(labels, function(a, b) return a.LayoutOrder < b.LayoutOrder end)
					setProperty(labels[1], "Text", entry.displayName or entry.donorName or "Supporter")
					setProperty(labels[2], "Text", entry.formattedAmount or formatAmount(entry.amount or 0))
				end
			end

			local messageFrame = row:FindFirstChild("Frame")
			local messageLabel = messageFrame and messageFrame:FindFirstChild("Message")
			setProperty(messageLabel, "Text", entry.message ~= "" and entry.message or "Thank you for your support")
		end
	end
end

local function updateTopDailyDonationGold(entries)
	local part = findAreaPart("YMATopDailyDonationGold")
	if not part then return end
	local surfaceGui = part:FindFirstChild("SurfaceGui")
	if not surfaceGui then return end
	local body = surfaceGui:FindFirstChild("Body")
	local container = body and body:FindFirstChild("Container")
	local booting = container and container:FindFirstChild("Booting")
	local content = booting and booting:FindFirstChild("Content")
	if not content then return end

	local topBar = content:FindFirstChild("TopBar")
	if topBar then
		local left = topBar:FindFirstChild("Left")
		local details = left and left:FindFirstChild("Details")
		if details then
			setProperty(details:FindFirstChild("Title"), "Text", "TOP DAILY " .. string.upper(tostring(Config.CurrencyLabel or "GOLD")))
			setProperty(details:FindFirstChild("Description"), "Text", string.format("TODAY %d SUPPORTERS", #entries))
		end
	end

	local page = content:FindFirstChild("Page")
	local list = page and page:FindFirstChild("List")
	if not list then return end

	for i = 1, 10 do
		local row = list:FindFirstChild("List" .. i)
		if not row then continue end
		local entry = entries[i]
		local foto = row:FindFirstChild("Foto")
		local user = row:FindFirstChild("User")
		local urutan = row:FindFirstChild("urutan")
		local total = row:FindFirstChild("Total")
		local username = row:FindFirstChild("Username")

		setProperty(urutan, "Text", tostring(i))
		if entry then
			local profile = entry.Profile or getProfile(entry.Key)
			setProperty(user, "Text", profile and (profile.DisplayName or profile.Name) or "Supporter")
			setProperty(username, "Text", profile and profile.UserId > 0 and ("@" .. tostring(profile.Name)) or "EXTERNAL")
			setProperty(total, "Text", addSeparators(entry.Amount))
			setProperty(foto, "Image", entry.Thumbnail or (profile and profile.UserId > 0 and getThumbnail(profile.UserId) or ""))
		else
			setProperty(user, "Text", "-")
			setProperty(username, "Text", "")
			setProperty(total, "Text", "-")
			setProperty(foto, "Image", "")
		end
	end
end

local function updateLiveMessageBoardGold()
	local part = findAreaPart("YMALiveMessageBoardGold")
	if not part then return end
	local surfaceGui = part:FindFirstChild("SurfaceGui")
	if not surfaceGui then return end

	local topSection = surfaceGui:FindFirstChild("TopSection")
	if not topSection then return end

	local entry = liveEntries[1]

	local avatarFrame = topSection:FindFirstChild("AvatarFrame")
	local avatarImage = avatarFrame and avatarFrame:FindFirstChild("AvatarImage")

	local displayFrame = topSection:FindFirstChild("DisplaynameAmountFrame")
	local displayNameLabel = displayFrame and displayFrame:FindFirstChild("DisplayNameDanUsername")
	local messageLabel = displayFrame and displayFrame:FindFirstChild("Message")

	if entry then
		local thumbUserId = tonumber(entry.targetUserId or entry.userId) or 0
		setProperty(avatarImage, "Image", thumbUserId > 0 and getThumbnail(thumbUserId) or "")
		setProperty(displayNameLabel, "Text", entry.displayName or entry.donorName or "Supporter")
		setProperty(messageLabel, "Text", entry.message ~= "" and entry.message or "Thank you for your support!")
	else
		setProperty(avatarImage, "Image", "")
		setProperty(displayNameLabel, "Text", "No message yet")
		setProperty(messageLabel, "Text", "Donate to appear here!")
	end
end

local function updatePodium(entries)
	local area = Workspace:FindFirstChild("YMADonateRealArea")
	if not area then
		return
	end

	local topParts = {
		area:FindFirstChild("YMADonateTop1"),
		area:FindFirstChild("YMADonateTop2"),
		area:FindFirstChild("YMADonateTop3"),
	}

	local signatureParts = table.create(3)
	for index = 1, 3 do
		local entry = entries[index]
		signatureParts[index] = entry and (entry.Key .. ":" .. tostring(entry.Amount)) or "0"
	end
	local signature = table.concat(signatureParts, "|")
	if signature == topSignature then
		return
	end
	topSignature = signature

	for index = 1, 3 do
		local part = topParts[index]
		if not part then
			continue
		end

		local surface = part:FindFirstChild("CenzRobuxTopSpotlight")
		local podiumRoot = surface and surface:FindFirstChild("Root")
		if not podiumRoot then
			continue
		end

		local entry = entries[index]
		local avatar = podiumRoot:FindFirstChild("Avatar")
		local rankLabel = podiumRoot:FindFirstChild("Rank")
		local rankCaption = podiumRoot:FindFirstChild("RankCaption")
		local displayName = podiumRoot:FindFirstChild("DisplayName")
		local username = podiumRoot:FindFirstChild("Username")
		local amountLabel = podiumRoot:FindFirstChild("Amount")
		local amountCaption = podiumRoot:FindFirstChild("AmountCaption")
		local emptyHint = podiumRoot:FindFirstChild("EmptyHint")
		local gameName = podiumRoot:FindFirstChild("GameName")

		setProperty(gameName, "Text", tostring(Config.GameName or "GAME NAME"))

		if entry then
			local profile = entryProfile(entry)
			local dName = profile and (profile.DisplayName or profile.Name) or "Supporter"
			local uName = profile and profile.Name or "Supporter"
			local userId = profile and tonumber(profile.UserId) or 0

			setProperty(rankLabel, "Text", tostring(index))
			setProperty(displayName, "Text", dName)
			setProperty(username, "Text", userId > 0 and ("@" .. uName) or "EXTERNAL SUPPORTER")
			setProperty(amountLabel, "Text", addSeparators(entry.Amount))
			setProperty(avatar, "Image", entry.Thumbnail or (userId > 0 and getThumbnail(userId) or ""))
			setProperty(emptyHint, "Visible", false)
			setProperty(avatar, "Visible", true)
			setProperty(displayName, "Visible", true)
			setProperty(username, "Visible", true)
			setProperty(amountLabel, "Visible", true)
			setProperty(amountCaption, "Visible", true)
			setProperty(rankLabel, "Visible", true)
			setProperty(rankCaption, "Visible", true)
		else
			setProperty(rankLabel, "Text", tostring(index))
			setProperty(displayName, "Text", "No Data")
			setProperty(username, "Text", "@waiting")
			setProperty(amountLabel, "Text", addSeparators(0))
			setProperty(avatar, "Image", "")
			setProperty(emptyHint, "Visible", true)
		end
	end
end

local rigPodiumSignature = ""
local rigPodiumGeneration = 0

local function clearRuntimeRigs(folder)
	for _, child in ipairs(folder:GetChildren()) do
		if child:GetAttribute("YMADonateRuntimeRig") == true then
			child:Destroy()
		end
	end
end

local function prepareRig(rig)
	local humanoid = rig:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
		humanoid.AutoRotate = false
		humanoid.PlatformStand = false
		humanoid.Sit = false
	end
	for _, object in ipairs(rig:GetDescendants()) do
		if object:IsA("BasePart") then
			object.CanCollide = false
			object.CanQuery = false
			object.CanTouch = false
			object.Massless = true
			object.Anchored = object.Name == "HumanoidRootPart"
		elseif object:IsA("Script") or object:IsA("LocalScript") then
			object:Destroy()
		end
	end
	if humanoid then
		for _, track in ipairs(humanoid:GetPlayingAnimationTracks()) do
			track:Stop(0)
		end
	end
end

local function playPodiumAnimation(rig)
	local humanoid = rig:FindFirstChildOfClass("Humanoid")
	if not humanoid then
		return
	end
	local animationId = humanoid.RigType == Enum.HumanoidRigType.R6
		and Config.PodiumRealAnimationR6
		or Config.PodiumRealAnimationR15
	if not animationId or animationId == "" then
		return
	end
	local animator = humanoid:FindFirstChildOfClass("Animator")
	if not animator then
		animator = Instance.new("Animator")
		animator.Parent = humanoid
	end
	for _, existingTrack in ipairs(humanoid:GetPlayingAnimationTracks()) do
		existingTrack:Stop(0)
	end
	local existingAnim = humanoid:FindFirstChild("YMADonatePodiumAnim")
	if existingAnim then
		existingAnim:Destroy()
	end
	local animation = Instance.new("Animation")
	animation.Name = "YMADonatePodiumAnim"
	animation.AnimationId = tostring(animationId)
	animation.Parent = humanoid

	local function attemptLoad()
		local ok, track = pcall(function()
			return animator:LoadAnimation(animation)
		end)
		if not ok or not track then
			return nil
		end
		track.Looped = true
		track.Priority = Enum.AnimationPriority.Action
		track:Play(0.1)
		rig:SetAttribute("YMADonateAnimId", tostring(animationId))
		return track
	end

	local track = attemptLoad()
	if not track then
		return
	end

	task.spawn(function()
		task.wait(0.5)
		if not track.IsPlaying or track.Length <= 0 then
			track:Stop(0)
			task.wait(0.1)
			attemptLoad()
		end
	end)
end

local function ordinalRank(rank)
	if rank == 1 then return "1st" end
	if rank == 2 then return "2nd" end
	if rank == 3 then return "3rd" end
	local mod100 = rank % 100
	if mod100 >= 11 and mod100 <= 13 then
		return tostring(rank) .. "th"
	end
	local mod10 = rank % 10
	local suffix = mod10 == 1 and "st" or mod10 == 2 and "nd" or mod10 == 3 and "rd" or "th"
	return tostring(rank) .. suffix
end

local PODIUM_TAG_ACCENT = Color3.fromRGB(255, 170, 30)
local PODIUM_TAG_NAME_COLOR = Color3.fromRGB(255, 255, 255)
local PODIUM_TAG_SHOW_CURRENCY = false

local defaultPodiumTagTemplate

local function buildDefaultPodiumTag()
	local tag = Instance.new("BillboardGui")
	tag.Name = "YMADonateRealWokTagTemplate"
	tag.Size = UDim2.fromOffset(45, 20)
	tag.StudsOffset = Vector3.new(0, 2.6, 0)
	tag.LightInfluence = 0
	tag:SetAttribute("YMADefaultTag", true)

	local frame = Instance.new("Frame")
	frame.Name = "Frame"
	frame.Size = UDim2.fromScale(1, 1)
	frame.BackgroundTransparency = 1
	frame.BorderSizePixel = 0
	frame.Parent = tag

	local function makeLabel(name, yPosition, height, font, color)
		local label = Instance.new("TextLabel")
		label.Name = name
		label.BackgroundTransparency = 1
		label.Position = UDim2.fromScale(0, yPosition)
		label.Size = UDim2.fromScale(1, height)
		label.Font = font
		label.Text = ""
		label.TextColor3 = color
		label.TextScaled = true
		label.TextXAlignment = Enum.TextXAlignment.Center
		label.TextYAlignment = Enum.TextYAlignment.Center
		label.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
		label.TextStrokeTransparency = 0.75
		label.Parent = frame
		return label
	end

	makeLabel("RankLabel", 0.02, 0.36, Enum.Font.GothamBold, PODIUM_TAG_ACCENT)
	makeLabel("NameLabel", 0.39, 0.32, Enum.Font.Gotham, PODIUM_TAG_NAME_COLOR)
	makeLabel("AmountLabel", 0.73, 0.22, Enum.Font.GothamMedium, PODIUM_TAG_ACCENT)

	return tag
end

local function getPodiumTagTemplate()
	local direct = root:FindFirstChild("Tag")
	if direct then
		if direct:IsA("BillboardGui") then
			return direct
		end
		local nested = direct:FindFirstChildWhichIsA("BillboardGui", true)
		if nested then
			return nested
		end
	end

	local objects = root:FindFirstChild("YMADonateRealObjects")
	if objects then
		for _, templateName in ipairs({ "YMADonateRealWokTagTemplate", "CenzDonateRealWokTagTemplate" }) do
			local template = objects:FindFirstChild(templateName)
			if template and template:IsA("BillboardGui") then
				return template
			end
		end
	end

	if not defaultPodiumTagTemplate then
		defaultPodiumTagTemplate = buildDefaultPodiumTag()
	end
	return defaultPodiumTagTemplate
end

local function isPodiumTextLabel(object)
	return object ~= nil
		and (object:IsA("TextLabel") or object:IsA("TextButton") or object:IsA("TextBox"))
end

local function findPodiumLabel(tag, names)
	for _, name in ipairs(names) do
		local found = tag:FindFirstChild(name, true)
		if isPodiumTextLabel(found) then
			return found
		end
	end
	return nil
end

local function configurePodiumTag(tag, rank, displayName, amount)
	local rankLabel = findPodiumLabel(tag, { "RankLabel", "Rank" })
	local nameLabel = findPodiumLabel(tag, { "NameLabel", "DisplayName", "Name", "PlayerName" })
	local amountLabel = findPodiumLabel(tag, { "AmountLabel", "Amount" })

	if not (rankLabel and nameLabel and amountLabel) then
		local labels = {}
		for _, descendant in ipairs(tag:GetDescendants()) do
			if isPodiumTextLabel(descendant) then
				table.insert(labels, descendant)
			end
		end
		table.sort(labels, function(a, b)
			local ay = a.Position.Y.Scale + a.Position.Y.Offset / 1000
			local by = b.Position.Y.Scale + b.Position.Y.Offset / 1000
			if ay == by then
				return a.LayoutOrder < b.LayoutOrder
			end
			return ay < by
		end)

		local used = {}
		for _, label in ipairs({ rankLabel, nameLabel, amountLabel }) do
			if label then
				used[label] = true
			end
		end
		local free = {}
		for _, label in ipairs(labels) do
			if not used[label] then
				table.insert(free, label)
			end
		end
		rankLabel = rankLabel or table.remove(free, 1)
		nameLabel = nameLabel or table.remove(free, 1)
		amountLabel = amountLabel or table.remove(free, 1)
	end

	setProperty(rankLabel, "Text", ordinalRank(rank))
	setProperty(nameLabel, "Text", tostring(displayName or "Supporter"))
	local amountText = PODIUM_TAG_SHOW_CURRENCY and formatAmount(amount or 0) or addSeparators(amount or 0)
	setProperty(amountLabel, "Text", amountText)
end

local function addPodiumTag(rig, rank, entry)
	local head = rig:FindFirstChild("Head")
	local template = getPodiumTagTemplate()
	if not head or not head:IsA("BasePart") or not template then
		return
	end
	local old = head:FindFirstChild("PodiumHeadTag")
	if old then
		old:Destroy()
	end
	local tag = template:Clone()
	tag.Name = "PodiumHeadTag"
	tag.Adornee = head
	tag.Enabled = true
	tag.MaxDistance = tonumber(Config.TopOverheadRealMaxDistance) or 50
	tag.AlwaysOnTop = true
	tag.Parent = head
	local profile = entryProfile(entry)
	configurePodiumTag(tag, rank, profile and (profile.DisplayName or profile.Name) or "Supporter", entry and entry.Amount or 0)
end

local function refreshPodiumTags(runtimeRigs, entries)
	for _, rig in ipairs(runtimeRigs:GetChildren()) do
		local rank = rig:GetAttribute("YMAPodiumRank")
		local entry = rank and entries[rank]
		local head = rig:FindFirstChild("Head")
		local tag = head and head:FindFirstChild("PodiumHeadTag")
		if tag and entry then
			local profile = entryProfile(entry)
			configurePodiumTag(tag, rank, profile and (profile.DisplayName or profile.Name) or "Supporter", entry.Amount)
		end
	end
end

local function verticalHalfExtent(part)
	local cf = part.CFrame
	local size = part.Size
	return math.abs(cf.RightVector.Y) * size.X * 0.5
		+ math.abs(cf.UpVector.Y) * size.Y * 0.5
		+ math.abs(cf.LookVector.Y) * size.Z * 0.5
end

local function updateRigPodium(entries)
	local area = Workspace:FindFirstChild("YMADonateRealArea")
	local podium = area and (area:FindFirstChild("YMARealPodium") or area:FindFirstChild("YMADonateRealPodium"))
	if not podium then
		return
	end

	local signatureParts = table.create(3)
	local expectedRigCount = 0
	for index = 1, 3 do
		local entry = entries[index]
		signatureParts[index] = entry and entry.Key or "0"
		local userId = entry and entry.Profile and tonumber(entry.Profile.UserId) or 0
		if userId > 0 then
			expectedRigCount += 1
		end
	end
	local signature = table.concat(signatureParts, ":")

	local runtimeRigs = podium:FindFirstChild("YMADonateRealRuntimeRigs")
	local currentRigCount = 0
	local currentTagCount = 0
	if runtimeRigs then
		for _, child in ipairs(runtimeRigs:GetChildren()) do
			if child:GetAttribute("YMADonateRuntimeRig") == true then
				currentRigCount += 1
				local head = child:FindFirstChild("Head")
				if head and head:FindFirstChild("PodiumHeadTag") then
					currentTagCount += 1
				end
			end
		end
	end

	if signature == rigPodiumSignature
		and currentRigCount == expectedRigCount
		and currentTagCount == expectedRigCount then
		if runtimeRigs then
			refreshPodiumTags(runtimeRigs, entries)
		end
		return
	end
	rigPodiumSignature = signature
	rigPodiumGeneration += 1
	local generation = rigPodiumGeneration

	if not runtimeRigs then
		runtimeRigs = Instance.new("Folder")
		runtimeRigs.Name = "YMADonateRealRuntimeRigs"
		runtimeRigs.Parent = podium
	end
	clearRuntimeRigs(runtimeRigs)

	for index = 1, 3 do
		local entry = entries[index]
		local userId = entry and entry.Profile and tonumber(entry.Profile.UserId) or 0
		local dais = podium:FindFirstChild("Dais_" .. index)
		local base = dais and dais:FindFirstChild("Base", true)
		if userId > 0 and base and base:IsA("BasePart") then
			task.spawn(function()
				local ok, rig = pcall(function()
					return Players:CreateHumanoidModelFromUserId(userId)
				end)
				if not ok or not rig then
					return
				end
				if generation ~= rigPodiumGeneration or not runtimeRigs.Parent then
					rig:Destroy()
					return
				end

				rig.Name = "YMADonateRealTopRig_" .. index
				rig:SetAttribute("YMADonateRuntimeRig", true)
				rig:SetAttribute("YMAPodiumRank", index)
				rig.Parent = runtimeRigs
				prepareRig(rig)

				local humanoid = rig:FindFirstChildOfClass("Humanoid")
				local rootPart = rig:FindFirstChild("HumanoidRootPart")
				if humanoid and rootPart and rootPart:IsA("BasePart") then
					local bodyHeight = humanoid.HipHeight + rootPart.Size.Y * 0.5
					if humanoid.RigType == Enum.HumanoidRigType.R6 then
						bodyHeight = 3
					end
					local standingHeight = verticalHalfExtent(base) + bodyHeight
					local position = base.Position + Vector3.new(0, standingHeight, 0)
					local hadapPart = Workspace:FindFirstChild("hadap")
					if hadapPart and hadapPart:IsA("BasePart") then
						rig:PivotTo(CFrame.lookAt(position, Vector3.new(hadapPart.Position.X, position.Y, hadapPart.Position.Z)))
					else
						local yaw = math.rad(tonumber(Config.PodiumRealFacingYaw) or 180)
						rig:PivotTo(CFrame.new(position) * CFrame.Angles(0, yaw, 0))
					end
				end

				addPodiumTag(rig, index, entry)

				task.wait(0.2)
				if generation ~= rigPodiumGeneration or not runtimeRigs.Parent then
					return
				end
				playPodiumAnimation(rig)
			end)
		end
	end
end
Runtime.UpdateRigPodium = updateRigPodium

local CENZ_NAME_TAG = "CenzNameTag"
local TOP_DONATE = "TopDonate"
local TOP_REAL = "TopReal"
local TITLE_TEXT = "TitleText"

local function getCenzNameTag(character)
	if not character then
		return nil
	end
	local tag = character:FindFirstChild(CENZ_NAME_TAG, true)
	if tag and tag:IsA("BillboardGui") then
		return tag
	end
	return nil
end

local function isTextGui(object)
	return object
		and (
			object:IsA("TextLabel")
			or object:IsA("TextButton")
			or object:IsA("TextBox")
		)
end

local function getTopReal(tag)
	if not tag then
		return nil
	end
	local topDonate = tag:FindFirstChild(TOP_DONATE, true)
	if not topDonate then
		return nil
	end
	local topReal = topDonate:FindFirstChild(TOP_REAL, true)
	if not topReal then
		return nil
	end
	return topReal
end

local function getTopRealTitleText(topReal)
	if not topReal then
		return nil
	end
	local titleText = topReal:FindFirstChild(TITLE_TEXT, true)
	if isTextGui(titleText) then
		return titleText
	end
	return nil
end

local function animateTopRealGradient(gradient, rotationSpeed)
	if not gradient or not gradient:IsA("UIGradient") then
		return
	end
	if gradient:GetAttribute("YMARealRotationAnimation") then
		return
	end
	gradient:SetAttribute("YMARealRotationAnimation", true)

	local speed = math.abs(tonumber(rotationSpeed) or 0)
	if speed <= 0 then
		return
	end

	local startRotation = gradient.Rotation
	local duration = 360 / speed

	local tween = TweenService:Create(
		gradient,
		TweenInfo.new(
			duration,
			Enum.EasingStyle.Linear,
			Enum.EasingDirection.InOut,
			-1,
			false,
			0
		),
		{Rotation = startRotation + 360}
	)

	tween:Play()

	gradient.Destroying:Connect(function()
		tween:Cancel()
	end)
end

local function setupTopRealGradientAnimation(topReal)
	if not topReal then
		return
	end
	local stroke = topReal:FindFirstChild("UIStroke")
	local strokeGradient = stroke and stroke:FindFirstChildOfClass("UIGradient")
	animateTopRealGradient(strokeGradient, 60)

	local titleText = topReal:FindFirstChild("TitleText", true)
	local titleGradient = titleText and titleText:FindFirstChildOfClass("UIGradient")
	animateTopRealGradient(titleGradient, 120)
end

local function configureTopReal(tag, rank, amount)
	if not tag or not tag.Parent then
		return false
	end

	tag.Enabled = true

	local topDonate = tag:FindFirstChild(TOP_DONATE, true)
	local topReal = getTopReal(tag)

	if not topReal then
		return false
	end

	if topDonate and topDonate:IsA("GuiObject") then
		topDonate.Visible = true
	end
	if topReal:IsA("GuiObject") then
		topReal.Visible = true
	end

	local titleText = getTopRealTitleText(topReal)
	if not titleText then
		return false
	end

	setupTopRealGradientAnimation(topReal)

	local currency = string.upper(tostring(Config.CurrencyLabel or "GOLD"))
	titleText.Text = "#" .. tostring(rank) .. " " .. currency
	titleText.Visible = true

	titleText:SetAttribute("YMADonateManaged", true)
	titleText:SetAttribute("YMADonateRank", rank)
	titleText:SetAttribute("YMADonateAmount", amount or 0)
	topReal:SetAttribute("YMADonateManaged", true)
	topReal:SetAttribute("YMADonateRank", rank)
	topReal:SetAttribute("YMADonateAmount", amount or 0)

	return true
end

local function ensureTopRealTitle(player)
	if not player or not player.Parent then
		return false
	end

	local character = player.Character
	if not character or not character.Parent then
		return false
	end

	local maxRank = clampInteger(
		Config.TopOverheadRealMaxRank or 255,
		1,
		255
	)

	local activeRank
	local activeAmount = 0

	for rank, entry in ipairs(topEntries) do
		if rank > maxRank then
			break
		end

		local profile = entryProfile(entry)
		if profile and tonumber(profile.UserId) == player.UserId then
			activeRank = rank
			activeAmount = tonumber(entry.Amount) or 0
			break
		end
	end

	if not activeRank then
		return false
	end

	local tag = getCenzNameTag(character)
	if not tag then
		return false
	end

	tag.Enabled = true

	local frame = tag:FindFirstChild("Frame", true)
	if frame and frame:IsA("GuiObject") then
		frame.Visible = true
	end

	local topDonate = tag:FindFirstChild(TOP_DONATE, true)
	if topDonate and topDonate:IsA("GuiObject") then
		topDonate.Visible = true
	end

	local topReal = getTopReal(tag)
	if not topReal or not topReal:IsA("GuiObject") then
		return false
	end

	topReal.Visible = true

	local titleText = getTopRealTitleText(topReal)
	if not titleText then
		return false
	end

	titleText.Visible = true
	titleText.Text = "#" .. tostring(activeRank) .. " " ..
		string.upper(tostring(Config.CurrencyLabel or "GOLD"))

	titleText:SetAttribute("YMADonateManaged", true)
	titleText:SetAttribute("YMADonateRank", activeRank)
	titleText:SetAttribute("YMADonateAmount", activeAmount)

	topReal:SetAttribute("YMADonateManaged", true)
	topReal:SetAttribute("YMADonateRank", activeRank)
	topReal:SetAttribute("YMADonateAmount", activeAmount)

	setupTopRealGradientAnimation(topReal)

	return true
end

local function hideTopReal(tag)
	if not tag then
		return
	end

	local topReal = getTopReal(tag)
	if not topReal then
		return
	end

	if topReal:GetAttribute("YMADonateManaged") == true and topReal:IsA("GuiObject") then
		topReal.Visible = false
	end
end

local function clearTopReal(character)
	if not character then
		return
	end
	local tag = getCenzNameTag(character)
	if tag then
		hideTopReal(tag)
	end
end

local function applyOverhead(player, rank, amount)
	if not player or not player.Parent then
		return
	end

	local character = player.Character
	if not character then
		return
	end

	local tag = getCenzNameTag(character)
	if not tag then
		return
	end

	tag.Enabled = true
	configureTopReal(tag, rank, amount)
end

local function updateOverheads(entries)
	local maxRank = clampInteger(
		Config.TopOverheadRealMaxRank or 255,
		1,
		255
	)

	local rankedUsers = {}

	for rank, entry in ipairs(entries) do
		if rank > maxRank then
			break
		end

		local profile = entryProfile(entry)
		local userId = profile and tonumber(profile.UserId) or 0

		if userId > 0 then
			rankedUsers[userId] = {
				rank = rank,
				amount = tonumber(entry.Amount) or 0,
			}

			local player = Players:GetPlayerByUserId(userId)
			if player then
				applyOverhead(player, rank, entry.Amount)
			end
		end
	end

	for _, player in ipairs(Players:GetPlayers()) do
		local character = player.Character
		if character and not rankedUsers[player.UserId] then
			local tag = getCenzNameTag(character)
			if tag then
				local topReal = getTopReal(tag)
				if topReal and topReal:GetAttribute("YMADonateManaged") == true then
					hideTopReal(tag)
				end
			end
		end
	end
end

Runtime.UpdateOverheads = updateOverheads

reapplyOverhead = function(player)
	if not player or not player.Parent then
		return false
	end

	local maxRank = clampInteger(
		Config.TopOverheadRealMaxRank or 255,
		1,
		255
	)

	for rank, entry in ipairs(topEntries) do
		if rank > maxRank then
			break
		end

		local profile = entryProfile(entry)
		if profile and tonumber(profile.UserId) == player.UserId then
			applyOverhead(
				player,
				rank,
				entry.Amount
			)
			return true
		end
	end

	return false
end

function refreshBoards()
	if refreshing then
		refreshQueued = true
		return
	end
	refreshing = true
	local ok, errorMessage = pcall(function()
		local limit = clampInteger(Config.TopDonorRealRowCount or 100, 1, 100)
		topEntries = getTopEntries(limit)
		updateTopBoard(topEntries)
		updateLiveBoard()
		updateMessageBoard()
		updateLiveDonationMessageGold()
		updateTopDailyDonationGold(getDailyTopEntries(10))
		updateLiveMessageBoardGold()
		updatePodium(topEntries)
	end)
	if not ok then
		warn("[YMADonateReal] board refresh failed:", errorMessage)
	end

	local rigOk, rigError = pcall(updateRigPodium, topEntries)
	if not rigOk then
		warn("[YMADonateReal] rig podium update failed:", rigError)
	end

	local overheadOk, overheadError = pcall(updateOverheads, topEntries)
	if not overheadOk then
		warn("[YMADonateReal] overhead update failed:", overheadError)
	end
	refreshing = false
	if refreshQueued then
		refreshQueued = false
		task.defer(refreshBoards)
	end
end
Runtime.Refresh = refreshBoards

local lastBoardRefreshRequest = 0
local BOARD_REFRESH_MIN_INTERVAL = 5

local function requestRefresh()
	local now = os.clock()
	if now - lastBoardRefreshRequest < BOARD_REFRESH_MIN_INTERVAL then
		return
	end
	if refreshQueued then
		return
	end

	lastBoardRefreshRequest = now
	refreshQueued = true

	task.delay(0.25, function()
		if refreshQueued then
			refreshQueued = false
			refreshBoards()
		end
	end)
end

-- ============================================================
-- Komunikasi dengan Cloudflare Worker (index.js)
-- ============================================================

local function workerConfigured()
	local url = tostring(Backend.WorkerBaseUrl or "")
	return url ~= "" and not url:find("GANTI%-INI")
end

local function workerRequest(method, path, body, authenticated)
	local baseUrl = (tostring(Backend.WorkerBaseUrl or ""):gsub("/+$", ""))
	local headers = { ["Accept"] = "application/json" }
	local request = {
		Url = baseUrl .. path,
		Method = method,
		Headers = headers,
	}

	if method ~= "GET" then
		headers["Content-Type"] = "application/json"
		request.Body = HttpService:JSONEncode(body or {})
	end

	if authenticated then
		headers["x-debug-token"] = tostring(Config.WorkerDebugToken or "")
	end

	local response = HttpService:RequestAsync(request)

	local decoded
	local decodeOk = pcall(function()
		decoded = HttpService:JSONDecode(response.Body)
	end)

	if not response.Success then
		local reason = decodeOk and type(decoded) == "table" and decoded.error or nil
		error("HTTP " .. tostring(response.StatusCode) .. (reason and (": " .. tostring(reason)) or ""), 0)
	end
	if not decodeOk or type(decoded) ~= "table" or decoded.ok ~= true then
		error(tostring(type(decoded) == "table" and decoded.error or "invalid_worker_response"), 0)
	end
	return decoded
end

local function acknowledge(items)
	if #items == 0 then
		return
	end
	workerRequest("POST", Backend.Endpoints.Ack, { items = items })
end

local function pollWorkerOnce()
	local result = workerRequest("POST", Backend.Endpoints.Pull, {
		limit = clampInteger(Backend.WorkerBatchSize, 1, 25),
	})

	if not workerConnectedPrinted then
		workerConnectedPrinted = true
		print("[YMADonateReal] Terhubung ke Cloudflare Worker.")
	end

	local acknowledgements = {}
	for _, item in ipairs(type(result.items) == "table" and result.items or {}) do
		local receiptId = safeText(item.id, 180)
		local leaseToken = safeText(item.leaseToken, 180)
		local claimed, claimReason = claimReceipt(receiptId)

		if not claimed and claimReason == "done" then
			table.insert(acknowledgements, {
				id = receiptId,
				leaseToken = leaseToken,
				status = "done",
			})
		elseif claimed then
			local ok, recordResult, detail = pcall(recordDonation, item)
			local success = ok and recordResult == true
			if not success then
				warn("[YMADonateReal] recordDonation failed for id=" .. receiptId .. ":", ok and detail or recordResult)
			end
			finishReceipt(receiptId, success)
			table.insert(acknowledgements, {
				id = receiptId,
				leaseToken = leaseToken,
				status = success and "done" or "failed",
				error = success and "" or safeText(ok and detail or recordResult, 250),
			})
		else
			table.insert(acknowledgements, {
				id = receiptId,
				leaseToken = leaseToken,
				status = "failed",
				error = claimReason,
			})
		end
		task.wait()
	end

	local ackOk, ackErr = pcall(acknowledge, acknowledgements)
	if not ackOk then
		warn("[YMADonateReal] acknowledge() failed:", ackErr, "| items lost:", #acknowledgements)
	end
end

local function startWorkerLoop()
	if not workerConfigured() then
		warn("[YMADonateReal] WorkerBaseUrl belum diisi (masih kosong / placeholder); real donations are disabled.")
		return
	end
	task.spawn(function()
		task.wait(2)
		while started do
			local ok, errorMessage = pcall(pollWorkerOnce)
			if not ok and os.clock() - lastWorkerWarning >= 30 then
				lastWorkerWarning = os.clock()
				warn("[YMADonateReal] Worker pull failed:", errorMessage)
			end
			task.wait(math.max(4, tonumber(Backend.WorkerPollInterval) or 4))
		end
	end)
end

local function bindRemotes()
	if adminCheckFunction and adminCheckFunction:IsA("RemoteFunction") then
		adminCheckFunction.OnServerInvoke = function(player)
			return isAdmin(player)
		end
	end

	if donationCodeFunction and donationCodeFunction:IsA("RemoteFunction") then
		donationCodeFunction.OnServerInvoke = function(player)
			local link = tostring(player:GetAttribute("YMADonateRealLink") or Config.DonateLink or "https://bagibagi.co/Null")
			return link
		end
	end

	if fireworksReq and fireworksReq:IsA("RemoteEvent") then
		local lastRequest = {}
		fireworksReq.OnServerEvent:Connect(function(player)
			if not isAdmin(player) or Config.FireworksRealEnabled ~= true then
				return
			end
			local now = os.clock()
			if now - (lastRequest[player.UserId] or 0) < (tonumber(Config.FireworksRealCooldown) or 2) then
				return
			end
			lastRequest[player.UserId] = now
			if fireworksBcast and fireworksBcast:IsA("RemoteEvent") then
				fireworksBcast:FireAllClients(player.DisplayName, 0, {
					donorName = player.DisplayName,
					amount = 0,
					duration = tonumber(Config.FireworksRealDuration) or 8,
				})
			end
		end)
	end

	if fakeDonateRemote and fakeDonateRemote:IsA("RemoteEvent") then
		fakeDonateRemote.OnServerEvent:Connect(function(player, data)
			if not isAdmin(player) then
				fakeDonateRemote:FireClient(player, false, "Unauthorized")
				return
			end
			data = type(data) == "table" and data or {}
			local amount = math.floor(tonumber(data.amount) or 0)
			if amount <= 0 then
				fakeDonateRemote:FireClient(player, false, "Invalid amount")
				return
			end
			local username = safeText(data.username or player.Name, 80)
			local displayName = safeText(data.displayName or "", 80)
			local message = safeText(data.message or "", 300)

			local item = {
				id = HttpService:GenerateGUID(false),
				donator_name = username,
				display_name = displayName,
				amount_raw = amount,
				message = message,
				created_at = os.date("!%Y-%m-%dT%H:%M:%SZ"),
			}
			local ok, resultOrErr = pcall(recordFakeDonation, item)
			local success = ok and resultOrErr == true
			fakeDonateRemote:FireClient(player, success, success and "Fake donation sent!" or tostring(resultOrErr))
		end)
	end

	if leaderboardRemote and leaderboardRemote:IsA("RemoteEvent") then
		leaderboardRemote.OnServerEvent:Connect(function(player, action, payload)
			if not isAdmin(player) then
				leaderboardRemote:FireClient(player, { ok = false, error = "Unauthorized" })
				return
			end

			if action == "list" then
				local limit = clampInteger(payload and payload.limit or 50, 1, 100)
				local entries = Runtime.AdminListTopDonors(limit)
				leaderboardRemote:FireClient(player, { ok = true, action = "list", entries = entries })

			elseif action == "edit" then
				local key = safeText(payload and payload.key or "", 100)
				local newAmount = math.floor(tonumber(payload and payload.amount or 0) or 0)
				if key == "" then
					leaderboardRemote:FireClient(player, { ok = false, error = "Key tidak valid" })
					return
				end
				if newAmount < 0 then
					leaderboardRemote:FireClient(player, { ok = false, error = "Amount tidak valid" })
					return
				end
				local ok, name = Runtime.AdminSetAmountByKey(key, newAmount)
				if ok then
					leaderboardRemote:FireClient(player, { ok = true, action = "edit", message = "Donasi " .. tostring(name) .. " diupdate ke " .. addSeparators(newAmount) })
				else
					leaderboardRemote:FireClient(player, { ok = false, error = tostring(name) })
				end

			elseif action == "delete" then
				local key = safeText(payload and payload.key or "", 100)
				if key == "" then
					leaderboardRemote:FireClient(player, { ok = false, error = "Key tidak valid" })
					return
				end
				local ok, name = Runtime.AdminResetByKey(key)
				if ok then
					leaderboardRemote:FireClient(player, { ok = true, action = "delete", message = "Donasi " .. tostring(name) .. " dihapus" })
				else
					leaderboardRemote:FireClient(player, { ok = false, error = tostring(name) })
				end
			end
		end)
	end
end

local function adminHttpRequest(method, path, payload)
	if not workerConfigured() then
		return false, "worker_disabled"
	end
	local ok, result = pcall(workerRequest, method, path, payload, true)
	if not ok then
		return false, tostring(result)
	end
	return true, result
end

Runtime.AdminListQueue = function()
	local ok, result = adminHttpRequest("GET", Backend.Endpoints.Queue)
	if not ok then
		return {}, result
	end
	return result.items or {}
end

Runtime.AdminRetryItem = function(id)
	if type(id) ~= "string" or id == "" then
		return false, "invalid_id"
	end
	return adminHttpRequest("POST", Backend.Endpoints.Retry, { id = id })
end

Runtime.AdminDeleteItem = function(id)
	if type(id) ~= "string" or id == "" then
		return false, "invalid_id"
	end
	return adminHttpRequest("POST", Backend.Endpoints.Delete, { id = id })
end

Runtime.AdminPushToWorker = function(donorName, amount, message)
	amount = tonumber(amount) or 0
	if amount <= 0 then
		return false, "invalid_amount"
	end
	return adminHttpRequest("POST", Backend.Endpoints.Push, {
		donator_name = tostring(donorName or "Admin"),
		amount_raw = amount,
		message = tostring(message or ""),
	})
end

Runtime.AdminInjectDonation = function(donorName, amount, message)
	amount = tonumber(amount) or 0
	if amount <= 0 then
		return false, "invalid_amount"
	end
	local item = {
		id = HttpService:GenerateGUID(false),
		donator_name = tostring(donorName or "Admin"),
		amount_raw = amount,
		message = tostring(message or ""),
		created_at = os.date("!%Y-%m-%dT%H:%M:%SZ"),
	}
	return recordDonation(item)
end

Runtime.AdminResetUser = function(identifier)
	identifier = trim(tostring(identifier or ""))
	if identifier == "" then
		return false, "invalid_identifier"
	end
	local userId, username = resolvePlayer(identifier)
	if not userId then
		return false, "player_not_found"
	end
	local key = "u_" .. tostring(userId)
	if useMemory then
		memoryTotals[key] = 0
		memoryDaily[key] = 0
	else
		memoryTotals[key] = 0
		totalCacheLoaded[key] = true
		totalPendingDelta[key] = nil
		local dayKey = tostring(dailyStoreKey or currentDailyKey())
		memoryDaily[key] = 0
		if dailyPendingDelta[dayKey] then
			dailyPendingDelta[dayKey][key] = nil
		end
		if allTimeStore then
			pcall(function()
				allTimeStore:SetAsync(key, 0)
			end)
		end
		local dayStore = getDailyStore()
		if dayStore then
			pcall(function()
				dayStore:SetAsync(key, 0)
			end)
		end
	end
	local player = Players:GetPlayerByUserId(userId)
	if player then
		local stat = getLeaderstat(player)
		if stat then
			stat.Value = 0
		end
	end
	task.spawn(refreshBoards)
	return true, username
end

function Runtime.Start()
	if started then
		return Runtime
	end
	started = true

	if not globalBroadcastSubscription then
		task.spawn(function()
			local attempt = 0

			while started and not globalBroadcastSubscription do
				attempt += 1

				local subscribeOk, subscriptionOrError = pcall(function()
					return MessagingService:SubscribeAsync(GLOBAL_DONATION_TOPIC, function(message)
						local data = message and message.Data
						if type(data) ~= "string" then
							return
						end

						local decodeOk, decoded = pcall(function()
							return HttpService:JSONDecode(data)
						end)

						if not decodeOk or type(decoded) ~= "table" then
							return
						end

						if decoded.type ~= "YMADonateRealDonation" then
							return
						end

						local payload = decoded.payload
						if type(payload) == "table" then
							task.spawn(applyGlobalDonation, payload)
						end
					end)
				end)

				if subscribeOk and subscriptionOrError then
					globalBroadcastSubscription = subscriptionOrError
					break
				end

				task.wait(math.min(attempt * 2, 10))
			end
		end)
	end

	if not useMemory then
		allTimeStore = DataStoreService:GetOrderedDataStore(
			tostring(Config.AllTimeStoreName or "YMADonateRealTotals_CleanV1")
		)
		profileStore = DataStoreService:GetDataStore(
			tostring(Config.ProfileStoreName or "YMaDonateRealProfiles_CleanV1")
		)
		receiptStore = DataStoreService:GetDataStore(
			tostring(Config.ReceiptStoreName or "YMADonateRealReceipts_CleanV1")
		)
		getDailyStore()
	end

	startDataStoreFlushLoop()

	bindRemotes()
	Players.PlayerAdded:Connect(setupPlayer)
	Players.PlayerRemoving:Connect(function(player)
	end)
	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(setupPlayer, player)
	end

	internalUpdated.Event:Connect(function()
		updateLiveBoard()
		updateMessageBoard()
		updateLiveDonationMessageGold()
		updateLiveMessageBoardGold()
		requestRefresh()
	end)

	task.delay(3, refreshBoards)
	task.spawn(function()
		while started do
			task.wait(math.max(15, tonumber(Config.LeaderboardRealRefreshInterval) or 30))
			refreshBoards()
		end
	end)

	task.spawn(function()
		while started do
			task.wait(1)
			for _, player in ipairs(Players:GetPlayers()) do
				if player.Parent and player.Character then
					reapplyOverhead(player)
					ensureTopRealTitle(player)
				end
			end
		end
	end)

	task.spawn(function()
		while started do
			task.wait(5)
			local area = Workspace:FindFirstChild("YMADonateRealArea")
			local podium = area and (area:FindFirstChild("YMARealPodium") or area:FindFirstChild("YMADonateRealPodium"))
			if podium then
				local runtimeRigs = podium:FindFirstChild("YMADonateRealRuntimeRigs")
				if runtimeRigs then
					for _, rig in ipairs(runtimeRigs:GetChildren()) do
						if rig:GetAttribute("YMADonateRuntimeRig") == true then
							local humanoid = rig:FindFirstChildOfClass("Humanoid")
							if humanoid and humanoid.Health > 0 then
								local hasPlayingTrack = false
								for _, existingTrack in ipairs(humanoid:GetPlayingAnimationTracks()) do
									if existingTrack.IsPlaying and existingTrack.Length > 0 then
										hasPlayingTrack = true
										break
									end
								end
								if not hasPlayingTrack then
									playPodiumAnimation(rig)
								end
							end
						end
					end
				end
			end
		end
	end)
	startWorkerLoop()

	game:BindToClose(function()
		if useMemory then
			return
		end

		for _ = 1, DATASTORE_SHUTDOWN_FLUSH_ATTEMPTS do
			if next(profilePending) == nil
				and next(totalPendingDelta) == nil
				and next(dailyPendingDelta) == nil then
				break
			end

			flushDataStoreQueue(true)
			task.wait(1)
		end
	end)

	return Runtime
end

Runtime.AdminListTopDonors = function(limit)
	local maximum = clampInteger(limit or 100, 1, 100)
	local entries = getTopEntries(maximum)

	local merged = {}
	local order = {}
	local function identityFor(entry)
		local profile = entry.Profile or getProfile(entry.Key)
		if profile.UserId and profile.UserId > 0 then
			return "u_" .. tostring(profile.UserId)
		end
		return "g_" .. normalize(profile.DisplayName or profile.Name or entry.Key)
	end
	for _, entry in ipairs(entries) do
		local id = identityFor(entry)
		if merged[id] then
			merged[id].Amount = merged[id].Amount + entry.Amount
		else
			local profile = entry.Profile or getProfile(entry.Key)
			merged[id] = {
				Key = entry.Key,
				Amount = entry.Amount,
				DisplayName = profile.DisplayName or profile.Name or "Supporter",
				UserId = profile.UserId or 0,
				Thumbnail = entry.Thumbnail or "",
			}
			table.insert(order, merged[id])
		end
	end
	table.sort(order, function(a, b)
		if a.Amount == b.Amount then
			return a.DisplayName < b.DisplayName
		end
		return a.Amount > b.Amount
	end)

	local output = {}
	for index, entry in ipairs(order) do
		output[index] = entry
		if index >= maximum then
			break
		end
	end
	return output
end

Runtime.AdminResetByKey = function(key)
	key = trim(tostring(key or ""))
	if key == "" then
		return false, "invalid_key"
	end

	if useMemory then
		memoryTotals[key] = 0
		memoryDaily[key] = 0
	else
		memoryTotals[key] = 0
		totalCacheLoaded[key] = true
		totalPendingDelta[key] = nil
		local dayKey = tostring(dailyStoreKey or currentDailyKey())
		memoryDaily[key] = 0
		if dailyPendingDelta[dayKey] then
			dailyPendingDelta[dayKey][key] = nil
		end
		if allTimeStore then
			pcall(function()
				allTimeStore:SetAsync(key, 0)
			end)
		end
		local dayStore = getDailyStore()
		if dayStore then
			pcall(function()
				dayStore:SetAsync(key, 0)
			end)
		end
	end

	local profile = getProfile(key)
	if profile.UserId and profile.UserId > 0 then
		local player = Players:GetPlayerByUserId(profile.UserId)
		if player then
			local stat = getLeaderstat(player)
			if stat then
				stat.Value = 0
			end
		end
	end

	task.spawn(refreshBoards)
	return true, profile.DisplayName or profile.Name or key
end

Runtime.AdminSetAmountByKey = function(key, newAmount)
	key = trim(tostring(key or ""))
	if key == "" then
		return false, "invalid_key"
	end
	newAmount = math.floor(tonumber(newAmount) or 0)
	if newAmount < 0 then
		newAmount = 0
	end
	newAmount = clampInteger(newAmount, 0, 2147483647)

	if useMemory then
		memoryTotals[key] = newAmount
	else
		local current = getStoredTotalForKey(key)
		memoryTotals[key] = newAmount
		totalCacheLoaded[key] = true
		totalPendingDelta[key] = newAmount - current
		if allTimeStore and math.abs(newAmount - current) > 0 then
			pcall(function()
				allTimeStore:SetAsync(key, newAmount)
			end)
			totalPendingDelta[key] = nil
		end
	end

	local profile = getProfile(key)
	if profile.UserId and profile.UserId > 0 then
		local player = Players:GetPlayerByUserId(profile.UserId)
		if player then
			local stat = getLeaderstat(player)
			if stat then
				stat.Value = newAmount
			end
		end
	end

	task.spawn(refreshBoards)
	return true, profile.DisplayName or profile.Name or key
end

return Runtime
`;
