/**
 * 安全存储工具
 * 提供简单的加密存储，替代localStorage明文存储
 * 注意：生产环境建议使用AES加密
 */

const STORAGE_KEY_PREFIX = 'sg_secure_';

/**
 * 简单的编码/解码函数
 * 使用Base64进行简单编码，生产环境应使用AES加密
 */
const encode = (data: string): string => {
  try {
    return btoa(encodeURIComponent(data));
  } catch {
    return '';
  }
};

const decode = (encoded: string): string | null => {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return null;
  }
};

/**
 * 检查是否为有效的编码字符串
 */
const isValidEncoded = (encoded: string): boolean => {
  try {
    const decoded = decode(encoded);
    return decoded !== null && decoded.length > 0;
  } catch {
    return false;
  }
};

export const secureStorage = {
  /**
   * 安全地存储字符串值
   */
  setItem(key: string, value: string): boolean {
    if (!key || value === undefined || value === null) {
      console.warn('secureStorage: invalid key or value');
      return false;
    }

    try {
      const encoded = encode(value);
      if (!encoded) {
        console.warn('secureStorage: failed to encode value');
        return false;
      }
      localStorage.setItem(STORAGE_KEY_PREFIX + key, encoded);
      return true;
    } catch (error) {
      console.error('secureStorage: failed to set item', error);
      return false;
    }
  },

  /**
   * 安全地获取字符串值
   */
  getItem(key: string): string | null {
    if (!key) {
      return null;
    }

    try {
      const encoded = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      if (!encoded) {
        return null;
      }

      // 检查是否为有效的编码字符串
      if (!isValidEncoded(encoded)) {
        // 可能是旧版本的明文数据，尝试直接返回
        console.warn('secureStorage: found legacy plaintext data for key:', key);
        localStorage.removeItem(STORAGE_KEY_PREFIX + key);
        return null;
      }

      const decoded = decode(encoded);
      return decoded;
    } catch (error) {
      console.error('secureStorage: failed to get item', error);
      return null;
    }
  },

  /**
   * 安全地存储对象
   */
  setObject<T>(key: string, value: T): boolean {
    try {
      const json = JSON.stringify(value);
      return this.setItem(key, json);
    } catch {
      console.warn('secureStorage: failed to stringify object for key:', key);
      return false;
    }
  },
  /**
   * 安全地获取对象
   */
  getObject<T>(key: string, defaultValue?: T): T | null {
    try {
      const json = this.getItem(key);
      if (!json) {
        return defaultValue ?? null;
      }
      return JSON.parse(json) as T;
    } catch (error) {
      console.error('secureStorage: failed to parse object for key:', key, error);
      return defaultValue ?? null;
    }
  },

  /**
   * 移除指定项
   */
  removeItem(key: string): void {
    if (!key) return;
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + key);
    } catch (error) {
      console.error('secureStorage: failed to remove item', error);
    }
  },

  /**
   * 清空所有安全存储的数据
   */
  clear(): void {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('secureStorage: failed to clear', error);
    }
  },

  /**
   * 检查存储项是否存在
   */
  hasItem(key: string): boolean {
    if (!key) return false;
    try {
      return localStorage.getItem(STORAGE_KEY_PREFIX + key) !== null;
    } catch {
      return false;
    }
  },

  /**
   * 迁移旧版明文数据到加密存储
   * 保留向后兼容性
   */
  migrateFromPlainText(keys: string[]): void {
    keys.forEach(key => {
      const plainKey = key; // 旧版使用原始key
      const encryptedKey = STORAGE_KEY_PREFIX + key;
      
      // 如果已有加密版本，跳过
      if (this.hasItem(key)) return;
      
      // 尝试迁移明文数据
      try {
        const plainValue = localStorage.getItem(plainKey);
        if (plainValue) {
          this.setItem(key, plainValue);
          console.info('secureStorage: migrated key:', key);
        }
      } catch {
        // 迁移失败，忽略
      }
    });
  }
};

/**
 * 便捷函数：存储API密钥
 */
export const setApiKey = (key: string): boolean => {
  return secureStorage.setItem('zhipuApiKey', key);
};

/**
 * 便捷函数：获取API密钥
 */
export const getApiKey = (): string | null => {
  return secureStorage.getItem('zhipuApiKey');
};

/**
 * 便捷函数：删除API密钥
 */
export const removeApiKey = (): void => {
  secureStorage.removeItem('zhipuApiKey');
};
