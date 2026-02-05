// 缓存管理器，用于管理各种缓存数据
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    if (typeof window !== 'undefined') {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }

  /**
   * 设置缓存项
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 生存时间（毫秒），默认10分钟
   */
  set<T>(key: string, data: T, ttl: number = 10 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存数据，如果不存在或已过期则返回undefined
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * 删除指定缓存项
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清除过期的缓存项
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

// 创建全局缓存实例
export const globalCache = new CacheManager();

// 定期清理过期缓存
setInterval(() => {
  globalCache.cleanup();
}, 5 * 60 * 1000); // 每5分钟清理一次