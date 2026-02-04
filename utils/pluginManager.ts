// 插件管理器
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  init?: () => void | Promise<void>;
  destroy?: () => void | Promise<void>;
}

export interface AIProviderPlugin extends Plugin {
  providerName: string;
  // AI服务相关方法
  getSmartResponse: (prompt: string, knowledge: any[], systemInstruction: string, options?: any) => Promise<string>;
  analyzeInstallation: (imageBuffer: string, visionPrompt: string) => Promise<string>;
  recognizeSpeech: (audioData: string) => Promise<string | undefined>;
  generateSpeech: (text: string, voiceName: string) => Promise<string | undefined>;
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

export interface UIPlugin extends Plugin {
  component: any; // UI组件
}

export interface StoragePlugin extends Plugin {
  getItem: (key: string) => any | Promise<any>;
  setItem: (key: string, value: any) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
  clear: () => void | Promise<void>;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private initialized: Set<string> = new Set();

  /**
   * 注册插件
   * @param plugin 插件对象
   */
  registerPlugin(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin with id "${plugin.id}" already exists, replacing...`);
    }
    
    this.plugins.set(plugin.id, plugin);
    
    if (plugin.enabled) {
      this.initializePlugin(plugin.id);
    }
  }

  /**
   * 取消注册插件
   * @param pluginId 插件ID
   */
  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      if (this.initialized.has(pluginId)) {
        this.destroyPlugin(pluginId);
      }
      this.plugins.delete(pluginId);
    }
  }

  /**
   * 启用插件
   * @param pluginId 插件ID
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with id "${pluginId}" not found`);
    }

    plugin.enabled = true;
    
    if (!this.initialized.has(pluginId)) {
      await this.initializePlugin(pluginId);
    }
  }

  /**
   * 禁用插件
   * @param pluginId 插件ID
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with id "${pluginId}" not found`);
    }

    plugin.enabled = false;
    
    if (this.initialized.has(pluginId)) {
      await this.destroyPlugin(pluginId);
    }
  }

  /**
   * 获取插件
   * @param pluginId 插件ID
   */
  getPlugin<T extends Plugin = Plugin>(pluginId: string): T | undefined {
    return this.plugins.get(pluginId) as T;
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取已启用的插件
   */
  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.enabled);
  }

  /**
   * 初始化插件
   * @param pluginId 插件ID
   */
  private async initializePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.enabled) {
      return;
    }

    try {
      if (plugin.init) {
        await plugin.init();
      }
      this.initialized.add(pluginId);
      console.log(`Plugin "${pluginId}" initialized`);
    } catch (error) {
      console.error(`Failed to initialize plugin "${pluginId}":`, error);
      // 如果初始化失败，可以选择禁用该插件
      plugin.enabled = false;
    }
  }

  /**
   * 销毁插件
   * @param pluginId 插件ID
   */
  private async destroyPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !this.initialized.has(pluginId)) {
      return;
    }

    try {
      if (plugin.destroy) {
        await plugin.destroy();
      }
      this.initialized.delete(pluginId);
      console.log(`Plugin "${pluginId}" destroyed`);
    } catch (error) {
      console.error(`Failed to destroy plugin "${pluginId}":`, error);
    }
  }

  /**
   * 执行插件方法
   * @param pluginId 插件ID
   * @param methodName 方法名
   * @param args 参数
   */
  async executePluginMethod<T = any>(pluginId: string, methodName: string, ...args: any[]): Promise<T> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.enabled) {
      throw new Error(`Plugin "${pluginId}" is not available or not enabled`);
    }

    const method = (plugin as any)[methodName];
    if (typeof method !== 'function') {
      throw new Error(`Method "${methodName}" not found in plugin "${pluginId}"`);
    }

    return await method.apply(plugin, args);
  }

  /**
   * 触发事件到所有启用的插件
   * @param eventName 事件名
   * @param payload 事件负载
   */
  async emitEvent(eventName: string, payload?: any): Promise<void> {
    const enabledPlugins = this.getEnabledPlugins();
    
    // 并行执行所有插件的事件处理
    const promises = enabledPlugins.map(plugin => {
      if (typeof (plugin as any)[eventName] === 'function') {
        try {
          return (plugin as any)[eventName](payload);
        } catch (error) {
          console.error(`Error in plugin "${plugin.id}" event handler "${eventName}":`, error);
          return Promise.resolve();
        }
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
  }

  /**
   * 检查插件是否存在且已启用
   * @param pluginId 插件ID
   */
  isPluginEnabled(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    return !!plugin && plugin.enabled;
  }

  /**
   * 获取插件状态
   */
  getPluginStatus(): Record<string, { enabled: boolean; initialized: boolean }> {
    const status: Record<string, { enabled: boolean; initialized: boolean }> = {};
    
    for (const [id, plugin] of this.plugins) {
      status[id] = {
        enabled: plugin.enabled,
        initialized: this.initialized.has(id)
      };
    }
    
    return status;
  }
}

// 创建全局插件管理器实例
export const pluginManager = new PluginManager();

// 预定义的AI服务插件基类
export abstract class BaseAIProviderPlugin implements AIProviderPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  providerName: string;

  constructor(config: {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    providerName: string;
    enabled?: boolean;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.version = config.version;
    this.description = config.description;
    this.author = config.author;
    this.providerName = config.providerName;
    this.enabled = config.enabled ?? false;
  }

  // 需要由子类实现的方法
  abstract getSmartResponse(prompt: string, knowledge: any[], systemInstruction: string, options?: any): Promise<string>;
  abstract analyzeInstallation(imageBuffer: string, visionPrompt: string): Promise<string>;
  abstract recognizeSpeech(audioData: string): Promise<string | undefined>;
  abstract generateSpeech(text: string, voiceName: string): Promise<string | undefined>;
  abstract testConnection(): Promise<{ success: boolean; message: string }>;

  // 可选的生命周期方法
  init?(): void | Promise<void>;
  destroy?(): void | Promise<void>;
}

// 预定义的UI插件基类
export abstract class BaseUIPlugin implements UIPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  component: any;

  constructor(config: {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    component: any;
    enabled?: boolean;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.version = config.version;
    this.description = config.description;
    this.author = config.author;
    this.component = config.component;
    this.enabled = config.enabled ?? false;
  }

  init?(): void | Promise<void>;
  destroy?(): void | Promise<void>;
}