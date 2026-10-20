import { 
  User, 
  ApiKey, 
  Donation, 
  RevenueSplitConfig, 
  RobloxServer, 
  WhitelistRule, 
  LuaScript 
} from '../types';
import { 
  INITIAL_CONFIG, 
  INITIAL_USERS, 
  INITIAL_API_KEYS, 
  INITIAL_DONATIONS, 
  INITIAL_SERVERS, 
  INITIAL_WHITELIST_RULES, 
  INITIAL_LUA_SCRIPTS 
} from '../data/mockData';

const STORAGE_KEYS = {
  USERS: 'donatecash_users_v2',
  CURRENT_USER_ID: 'donatecash_current_user_id_v2',
  CONFIG: 'donatecash_config_v2',
  DONATIONS: 'donatecash_donations_v2',
  API_KEYS: 'donatecash_api_keys_v2',
  SERVERS: 'donatecash_servers_v2',
  RULES: 'donatecash_rules_v2',
  SCRIPTS: 'donatecash_scripts_v2',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Failed to read ${key} from localStorage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to write ${key} to localStorage:`, err);
  }
}

export const loadStoredUsers = (): User[] => safeGet(STORAGE_KEYS.USERS, INITIAL_USERS);
export const saveStoredUsers = (users: User[]): void => safeSet(STORAGE_KEYS.USERS, users);

export const loadStoredCurrentUserId = (): string => safeGet(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
export const saveStoredCurrentUserId = (id: string): void => safeSet(STORAGE_KEYS.CURRENT_USER_ID, id);

export const loadStoredConfig = (): RevenueSplitConfig => safeGet(STORAGE_KEYS.CONFIG, INITIAL_CONFIG);
export const saveStoredConfig = (config: RevenueSplitConfig): void => safeSet(STORAGE_KEYS.CONFIG, config);

export const loadStoredDonations = (): Donation[] => safeGet(STORAGE_KEYS.DONATIONS, INITIAL_DONATIONS);
export const saveStoredDonations = (donations: Donation[]): void => safeSet(STORAGE_KEYS.DONATIONS, donations);

export const loadStoredApiKeys = (): ApiKey[] => safeGet(STORAGE_KEYS.API_KEYS, INITIAL_API_KEYS);
export const saveStoredApiKeys = (keys: ApiKey[]): void => safeSet(STORAGE_KEYS.API_KEYS, keys);

export const loadStoredServers = (): RobloxServer[] => safeGet(STORAGE_KEYS.SERVERS, INITIAL_SERVERS);
export const saveStoredServers = (servers: RobloxServer[]): void => safeSet(STORAGE_KEYS.SERVERS, servers);

export const loadStoredRules = (): WhitelistRule[] => safeGet(STORAGE_KEYS.RULES, INITIAL_WHITELIST_RULES);
export const saveStoredRules = (rules: WhitelistRule[]): void => safeSet(STORAGE_KEYS.RULES, rules);

export const loadStoredScripts = (): LuaScript[] => safeGet(STORAGE_KEYS.SCRIPTS, INITIAL_LUA_SCRIPTS);
export const saveStoredScripts = (scripts: LuaScript[]): void => safeSet(STORAGE_KEYS.SCRIPTS, scripts);

export const resetStoredData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    // ignore
  }
};
