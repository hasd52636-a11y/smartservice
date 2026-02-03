/**
 * IndexedDB向量存储服务
 * 解决localStorage容量限制问题，支持大规模知识库存储
 */

import { KnowledgeItem } from '../types';

interface VectorStorageConfig {
  dbName: string;
  version: number;
  storeName: string;
}

export class VectorStorage {
  private db: IDBDatabase | null = null;
  private config: VectorStorageConfig;

  constructor(config?: Partial<VectorStorageConfig>) {
    this.config = {
      dbName: 'SmartCustomerServiceDB',
      version: 1,
      storeName: 'knowledgeVectors',
      ...config
    };
  }

  /**
   * 初始化IndexedDB连接
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        console.error('IndexedDB connection failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB connected successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建知识库存储
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { 
            keyPath: 'id' 
          });
          
          // 创建索引
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('vectorizedAt', 'vectorizedAt', { unique: false });
          
          console.log('IndexedDB object store created');
        }
      };
    });
  }

  /**
   * 存储知识库项目（包含向量）
   */
  async storeKnowledgeItem(projectId: string, item: KnowledgeItem): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      
      const itemWithProject = {
        ...item,
        projectId,
        updatedAt: new Date().toISOString()
      };

      const request = store.put(itemWithProject);

      request.onsuccess = () => {
        console.log(`Stored knowledge item: ${item.title}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to store knowledge item:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 批量存储知识库
   */
  async storeKnowledgeBase(projectId: string, knowledge: KnowledgeItem[]): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      
      let completed = 0;
      const total = knowledge.length;

      if (total === 0) {
        resolve();
        return;
      }

      knowledge.forEach(item => {
        const itemWithProject = {
          ...item,
          projectId,
          updatedAt: new Date().toISOString()
        };

        const request = store.put(itemWithProject);

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            console.log(`Batch stored ${total} knowledge items for project ${projectId}`);
            resolve();
          }
        };

        request.onerror = () => {
          console.error('Failed to store knowledge item:', request.error);
          reject(request.error);
        };
      });
    });
  }

  /**
   * 获取项目的知识库
   */
  async getKnowledgeBase(projectId: string): Promise<KnowledgeItem[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      const index = store.index('projectId');
      
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const items = request.result.map(item => {
          // 移除projectId等存储相关字段
          const { projectId: _, updatedAt: __, ...knowledgeItem } = item;
          return knowledgeItem as KnowledgeItem;
        });
        
        console.log(`Retrieved ${items.length} knowledge items for project ${projectId}`);
        resolve(items);
      };

      request.onerror = () => {
        console.error('Failed to retrieve knowledge base:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 删除知识库项目
   */
  async deleteKnowledgeItem(itemId: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      
      const request = store.delete(itemId);

      request.onsuccess = () => {
        console.log(`Deleted knowledge item: ${itemId}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete knowledge item:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 清空项目的知识库
   */
  async clearProjectKnowledge(projectId: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const index = store.index('projectId');
      
      const request = index.openCursor(projectId);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log(`Cleared all knowledge items for project ${projectId}`);
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to clear project knowledge:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalItems: number;
    vectorizedItems: number;
    storageSize: number;
  }> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], 'readonly');
      const store = transaction.objectStore(this.config.storeName);
      
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result;
        const totalItems = items.length;
        const vectorizedItems = items.filter(item => item.embedding && item.embedding.length > 0).length;
        
        // 估算存储大小（粗略计算）
        const storageSize = JSON.stringify(items).length;

        resolve({
          totalItems,
          vectorizedItems,
          storageSize
        });
      };

      request.onerror = () => {
        console.error('Failed to get storage stats:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 压缩向量数据（减少存储空间）
   */
  compressVector(vector: number[]): string {
    // 将Float32Array转换为更紧凑的格式
    const float32Array = new Float32Array(vector);
    const buffer = float32Array.buffer;
    const uint8Array = new Uint8Array(buffer);
    
    // 转换为Base64字符串
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    
    return btoa(binary);
  }

  /**
   * 解压缩向量数据
   */
  decompressVector(compressedVector: string): number[] {
    try {
      const binary = atob(compressedVector);
      const uint8Array = new Uint8Array(binary.length);
      
      for (let i = 0; i < binary.length; i++) {
        uint8Array[i] = binary.charCodeAt(i);
      }
      
      const float32Array = new Float32Array(uint8Array.buffer);
      return Array.from(float32Array);
    } catch (error) {
      console.error('Failed to decompress vector:', error);
      return [];
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('IndexedDB connection closed');
    }
  }
}

// 创建全局实例
export const vectorStorage = new VectorStorage();

// 自动初始化
vectorStorage.init().catch(error => {
  console.error('Failed to initialize vector storage:', error);
  // 回退到localStorage
});