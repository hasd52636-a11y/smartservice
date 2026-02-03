/**
 * API密钥管理服务
 * 解决重复获取localStorage中API密钥的性能问题
 */
class ApiKeyService {
  private static instance: ApiKeyService;
  private zhipuApiKey: string | null = null;
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): ApiKeyService {
    if (!ApiKeyService.instance) {
      ApiKeyService.instance = new ApiKeyService();
    }
    return ApiKeyService.instance;
  }

  /**
   * 初始化API密钥缓存
   */
  private initialize(): void {
    if (this.isInitialized) return;

    try {
      // 只在初始化时读取一次localStorage
      if (typeof localStorage !== 'undefined') {
        this.zhipuApiKey = localStorage.getItem('zhipuApiKey');
      }
      this.isInitialized = true;
      console.log('API密钥服务初始化完成');
    } catch (error) {
      console.error('API密钥服务初始化失败:', error);
      this.isInitialized = true; // 即使失败也标记为已初始化，避免重复尝试
    }
  }

  /**
   * 获取智谱AI API密钥（缓存版本）
   */
  public getZhipuApiKey(): string | null {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.zhipuApiKey;
  }

  /**
   * 设置智谱AI API密钥
   */
  public setZhipuApiKey(apiKey: string): void {
    this.zhipuApiKey = apiKey;
    
    try {
      // 同步更新localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('zhipuApiKey', apiKey);
      }
    } catch (error) {
      console.error('保存API密钥到localStorage失败:', error);
    }
  }

  /**
   * 清除API密钥
   */
  public clearZhipuApiKey(): void {
    this.zhipuApiKey = null;
    
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('zhipuApiKey');
      }
    } catch (error) {
      console.error('清除localStorage中的API密钥失败:', error);
    }
  }

  /**
   * 检查是否有有效的API密钥
   */
  public hasValidApiKey(): boolean {
    const key = this.getZhipuApiKey();
    return !!(key && key.trim().length > 0);
  }

  /**
   * 刷新API密钥缓存（从localStorage重新读取）
   */
  public refreshCache(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        this.zhipuApiKey = localStorage.getItem('zhipuApiKey');
      }
    } catch (error) {
      console.error('刷新API密钥缓存失败:', error);
    }
  }

  /**
   * 获取API密钥状态信息
   */
  public getStatus(): {
    hasKey: boolean;
    isInitialized: boolean;
    keyLength: number;
  } {
    const key = this.getZhipuApiKey();
    return {
      hasKey: !!key,
      isInitialized: this.isInitialized,
      keyLength: key ? key.length : 0
    };
  }
}

// 导出单例实例
export const apiKeyService = ApiKeyService.getInstance();