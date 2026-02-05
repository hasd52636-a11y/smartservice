/**
 * 存储管理器
 * 管理localStorage使用，防止存储溢出
 */

interface StorageStats {
  usedBytes: number;
  usedMB: number;
  limitMB: number;
  percent: number;
}

interface StorageQuota {
  maxSizeMB: number;
  warningThreshold: number;
  cleanupThreshold: number;
}

const QUOTA: StorageQuota = {
  maxSizeMB: 5,
  warningThreshold: 0.8,
  cleanupThreshold: 0.9
};

const STORAGE_KEYS = {
  projects: 'smartguide_projects',
  analytics: 'smartguide_analytics',
  tickets: 'smartguide_tickets',
  interactions: 'smartguide_user_interactions',
  recommendations: 'smartguide_recommendations',
  links: 'complexLinks',
  knowledgeCalls: 'knowledgeCalls'
} as const;

const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

export const storageManager = {
  /**
   * 获取存储使用统计
   */
  getStats(): StorageStats {
    let usedBytes = 0;

    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        usedBytes: 0,
        usedMB: 0,
        limitMB: QUOTA.maxSizeMB,
        percent: 0
      };
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          usedBytes += key.length + value.length;
        }
      }
    }

    const usedMB = Math.round(usedBytes / 1024 / 1024 * 100) / 100;
    const limitBytes = QUOTA.maxSizeMB * 1024 * 1024;
    const percent = Math.round((usedBytes / limitBytes) * 100);

    return {
      usedBytes,
      usedMB,
      limitMB: QUOTA.maxSizeMB,
      percent
    };
  },

  /**
   * 检查是否接近存储限制
   */
  isNearLimit(): boolean {
    const stats = this.getStats();
    return stats.percent >= QUOTA.warningThreshold * 100;
  },

  /**
   * 检查是否已超过存储限制
   */
  isOverLimit(): boolean {
    const stats = this.getStats();
    return stats.percent >= 100;
  },

  /**
   * 安全存储数据，自动清理旧数据
   */
  setItem<T>(key: string, data: T, maxItems: number = 50): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    try {
      const json = JSON.stringify(data);
      const newSize = key.length + json.length;
      const currentStats = this.getStats();
      const maxBytes = QUOTA.maxSizeMB * 1024 * 1024;

      if (currentStats.usedBytes + newSize > maxBytes) {
        this.cleanup(key, maxItems);
      }

      localStorage.setItem(key, json);
      return true;
    } catch (error) {
      console.error('StorageManager: failed to save', key, error);
      this.cleanup(key, maxItems);
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch {
        console.error('StorageManager: storage failed even after cleanup');
        return false;
      }
    }
  },

  /**
   * 安全获取数据
   */
  getItem<T>(key: string, fallback: T | null = null): T | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }

    try {
      const json = localStorage.getItem(key);
      if (!json) return fallback;
      return safeJsonParse(json, fallback) as T;
    } catch (error) {
      console.error('StorageManager: failed to load', key, error);
      return fallback;
    }
  },

  /**
   * 清理指定类型的过期数据
   */
  cleanup(currentKey: string, maxItems: number): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const targetKey = this.getStorageKey(currentKey);
    if (!targetKey) return;

    try {
      const json = localStorage.getItem(targetKey);
      if (!json) return;

      const data = safeJsonParse<unknown[]>(json, []);

      if (Array.isArray(data) && data.length > maxItems) {
        const trimmed = data.slice(0, maxItems);
        localStorage.setItem(targetKey, JSON.stringify(trimmed));
        console.info(`StorageManager: cleaned up ${targetKey}, kept ${maxItems} items`);
      }
    } catch (error) {
      console.error('StorageManager: cleanup failed', error);
    }
  },

  /**
   * 获取存储键
   */
  getStorageKey(key: string): string | null {
    for (const [name, value] of Object.entries(STORAGE_KEYS)) {
      if (key.includes(value)) {
        return value;
      }
    }
    return null;
  },

  /**
   * 清理所有过期的或损坏的数据
   */
  fullCleanup(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const keysToCheck = Object.values(STORAGE_KEYS);
    const keysToRemove: string[] = [];

    for (const key of keysToCheck) {
      try {
        const json = localStorage.getItem(key);
        if (!json) continue;

        const data = JSON.parse(json);

        if (Array.isArray(data)) {
          const trimmed = data.slice(0, 50);
          if (trimmed.length < data.length) {
            localStorage.setItem(key, JSON.stringify(trimmed));
          }
        }
      } catch {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.info('StorageManager: removed corrupted data', key);
    });
  },

  /**
   * 获取所有存储键的使用统计
   */
  getAllStorageStats(): Record<string, { bytes: number; items: number }> {
    const stats: Record<string, { bytes: number; items: number }> = {};

    if (typeof window === 'undefined' || !window.localStorage) {
      return stats;
    }

    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      try {
        const json = localStorage.getItem(key);
        if (json) {
          const data = JSON.parse(json);
          stats[name] = {
            bytes: key.length + json.length,
            items: Array.isArray(data) ? data.length : 1
          };
        } else {
          stats[name] = { bytes: 0, items: 0 };
        }
      } catch {
        stats[name] = { bytes: 0, items: 0 };
      }
    }

    return stats;
  },

  /**
   * 导出所有数据（用于备份）
   */
  exportAll(): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    if (typeof window === 'undefined' || !window.localStorage) {
      return data;
    }

    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      try {
        const json = localStorage.getItem(key);
        if (json) {
          data[name] = JSON.parse(json);
        }
      } catch {
        console.warn('StorageManager: failed to export', name);
      }
    }

    return data;
  },

  /**
   * 清空所有应用数据
   */
  clearAll(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    console.info('StorageManager: cleared all application data');
  }
};

export default storageManager;
