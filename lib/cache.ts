import { Redis } from '@upstash/redis';
import { UPSTASH_REDIS_URL } from '@/lib/config';

function generateDeviceCode(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function generateUserCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = (length: number) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => chars[b % chars.length]).join('');
  };
  return `${randomPart(4)}-${randomPart(4)}`;
}

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function generatePkceVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function generatePkceChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlEncode(data: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
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
    this.redis = UPSTASH_REDIS_URL ? new Redis({ url: UPSTASH_REDIS_URL }) : null;
  }

  async set(key: string, data: CacheEntry, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      await this.redis.set(key, JSON.stringify(data), {
        ex: ttlSeconds,
      });
    } else {
      // Fallback to in-memory for local development
      const store = globalThis.__device_flow_cache || (globalThis.__device_flow_cache = new Map());
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
      const store = globalThis.__device_flow_cache || (globalThis.__device_flow_cache = new Map());
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
      const store = globalThis.__device_flow_cache || (globalThis.__device_flow_cache = new Map());
      store.delete(key);
    }
  }

  async incr(key: string): Promise<number> {
    if (this.redis) {
      return await this.redis.incr(key);
    } else {
      const store = globalThis.__device_flow_cache || (globalThis.__device_flow_cache = new Map());
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
      const store = globalThis.__device_flow_cache || (globalThis.__device_flow_cache = new Map());
      const entry = store.get(key);
      if (entry) {
        entry.expiresAt = Date.now() + ttlSeconds * 1000;
      }
    }
  }
}

export const Cache = new CacheStore();

export { generateDeviceCode, generateUserCode, generateState, generatePkceVerifier, generatePkceChallenge, base64UrlEncode };
