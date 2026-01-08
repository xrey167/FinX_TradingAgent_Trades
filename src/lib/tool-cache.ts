/**
 * Tool Cache - 2-Tier caching system for tool results
 * Provides memory cache + disk persistence to avoid redundant API calls
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createCacheKey } from '../tools/helpers.ts';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  sourceUrl?: string;
}

export class ToolCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private cacheDir: string;
  private persistToDisk: boolean;
  private maxEntries: number;

  constructor(options?: { persistToDisk?: boolean; cacheDir?: string; maxEntries?: number }) {
    this.persistToDisk = options?.persistToDisk ?? false;
    // Use absolute path with current working directory as base
    this.cacheDir = options?.cacheDir || path.join(process.cwd(), '.finx', 'tool-cache');
    this.maxEntries = options?.maxEntries || 1000; // Default max 1000 entries
    if (this.persistToDisk) {
      this.ensureCacheDir();
    }
  }

  private ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Get cached result if still valid
   */
  get<T>(key: string, ttlMs: number): T | null {
    // Check memory cache first
    const cached = this.memoryCache.get(key);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < ttlMs) {
        return cached.data as T;
      }
      this.memoryCache.delete(key);
    }

    // Check disk cache if enabled
    if (this.persistToDisk) {
      const diskPath = path.join(this.cacheDir, `${this.hashKey(key)}.json`);
      if (fs.existsSync(diskPath)) {
        try {
          const cached = JSON.parse(fs.readFileSync(diskPath, 'utf-8')) as CacheEntry<T>;
          const age = Date.now() - cached.timestamp;
          if (age < ttlMs) {
            // Restore to memory cache
            this.memoryCache.set(key, cached);
            return cached.data;
          }
          // Expired - delete
          fs.unlinkSync(diskPath);
        } catch {
          // Corrupted cache file - ignore
        }
      }
    }

    return null;
  }

  /**
   * Set cache entry (with LRU eviction)
   */
  set<T>(key: string, data: T, metadata?: { sourceUrl?: string }): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ...metadata,
    };

    // Implement LRU eviction if at capacity
    if (this.memoryCache.size >= this.maxEntries && !this.memoryCache.has(key)) {
      // Evict oldest entry (first entry in Map)
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey !== undefined) {
        this.memoryCache.delete(firstKey);
        // Also delete from disk if persisting
        if (this.persistToDisk) {
          try {
            const diskPath = path.join(this.cacheDir, `${this.hashKey(firstKey)}.json`);
            if (fs.existsSync(diskPath)) {
              fs.unlinkSync(diskPath);
            }
          } catch {
            // Ignore disk cleanup errors
          }
        }
      }
    }

    // Always store in memory
    this.memoryCache.set(key, entry);

    // Optionally persist to disk
    if (this.persistToDisk) {
      try {
        const diskPath = path.join(this.cacheDir, `${this.hashKey(key)}.json`);
        fs.writeFileSync(diskPath, JSON.stringify(entry, null, 2));
      } catch {
        // Disk write failed - not critical
      }
    }
  }

  /**
   * Get or fetch with automatic caching
   */
  async getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key, ttlMs);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data);
    return data;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    if (this.persistToDisk) {
      try {
        if (fs.existsSync(this.cacheDir)) {
          fs.rmSync(this.cacheDir, { recursive: true });
        }
      } catch {
        // Ignore errors
      }
    }
  }

  private hashKey(key: string): string {
    // Use SHA-256 hash for collision-free filename generation
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}

// Singleton instance
export const globalToolCache = new ToolCache({ persistToDisk: true });
