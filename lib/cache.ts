import { Redis } from '@upstash/redis';
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from '@/lib/config';

declare global {
  var __device_flow_cache: Map<string, { data: unknown; expiresAt: number }> | undefined;
}

function generateDeviceCode(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += array[i].toString(16).padStart(2, '0');
  }
  return result;
}

function generateUserCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = (length: number) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < array.length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  };
  return `${randomPart(4)}-${randomPart(4)}`;
}

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += array[i].toString(16).padStart(2, '0');
  }
  return result;
}

function generatePkceVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += array[i].toString(16).padStart(2, '0');
  }
  return result;
}

async function generatePkceChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const uint8Array = new Uint8Array(hash);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlEncode(data: ArrayBuffer): string {
  const uint8Array = new Uint8Array(data);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export interface StateCacheEntry {
  user_code: string;
  timestamp: number;
}

export interface DeviceCacheEntry {
  client_id: string;
  client_secret?: string;
  scope?: string;
  device_code: string;
  pkce_verifier: string;
  timestamp?: number;
  status?: 'pending' | 'complete';
  token_response?: unknown;
}

type CacheEntry = StateCacheEntry | DeviceCacheEntry;

class CacheStore {
  private redis: Redis | null;

  constructor() {
    // 同时校验 url + token 都存在才创建实例
    const hasRedisEnv = UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN;
    this.redis = hasRedisEnv 
      ? new Redis({
          url: UPSTASH_REDIS_REST_URL,
          token: UPSTASH_REDIS_REST_TOKEN
        }) 
      : null;
  }

  async set(key: string, data: CacheEntry, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      await this.redis.set(key, JSON.stringify(data), {
        ex: ttlSeconds,
      });
    } else {
      // Fallback to in-memory for local development
      const store = globalThis.__device_flow_cache ?? new Map<string, { data: unknown; expiresAt: number }>();
      globalThis.__device_flow_cache = store;
      store.set(key, {
        data,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
  }

  async get(key: string): Promise<CacheEntry | null> {
    if (this.redis) {
      const data = await this.redis.get<string>(key);
      return data ? JSON.parse(data) : null;
    } else {
      // Fallback to in-memory for local development
      const store = globalThis.__device_flow_cache ?? new Map<string, { data: unknown; expiresAt: number }>();
      globalThis.__device_flow_cache = store;
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.data;
    }
  }

  async delete(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
    } else {
      const store = globalThis.__device_flow_cache ?? new Map<string, { data: unknown; expiresAt: number }>();
      globalThis.__device_flow_cache = store;
      store.delete(key);
    }
  }

  async incr(key: string): Promise<number> {
    if (this.redis) {
      return await this.redis.incr(key);
    } else {
      const store = globalThis.__device_flow_cache ?? new Map<string, { data: unknown; expiresAt: number }>();
      globalThis.__device_flow_cache = store;
      const entry = store.get(key);
      if (!entry) {
        store.set(key, {
          data: { count: 1 },
          expiresAt: Date.now() + 60000,
        });
        return 1;
      }
      const current = (entry.data as { count?: number }).count || 0;
      (entry.data as { count: number }).count = current + 1;
      return current + 1;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      await this.redis.expire(key, ttlSeconds);
    } else {
      const store = globalThis.__device_flow_cache ?? new Map<string, { data: unknown; expiresAt: number }>();
      globalThis.__device_flow_cache = store;
      const entry = store.get(key);
      if (entry) {
        entry.expiresAt = Date.now() + ttlSeconds * 1000;
      }
    }
  }
}

export const Cache = new CacheStore();

export { generateDeviceCode, generateUserCode, generateState, generatePkceVerifier, generatePkceChallenge, base64UrlEncode };
