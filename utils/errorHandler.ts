// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INVALID_INPUT = 'INVALID_INPUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 自定义错误类
export class AIError extends Error {
  public errorType: ErrorType;
  public statusCode?: number;
  public details?: any;

  constructor(message: string, errorType: ErrorType, statusCode?: number, details?: any) {
    super(message);
    this.name = 'AIError';
    this.errorType = errorType;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// 错误处理器
export class ErrorHandler {
  /**
   * 解析错误并返回标准化的错误对象
   * @param error 错误对象
   * @returns 标准化的AIError
   */
  static parseError(error: any): AIError {
    // 网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new AIError(
        '网络连接失败，请检查网络后重试',
        ErrorType.NETWORK_ERROR,
        undefined,
        error
      );
    }

    // HTTP错误
    if (error.message.includes('HTTP')) {
      const match = error.message.match(/HTTP (\d+):/);
      if (match) {
        const statusCode = parseInt(match[1]);
        switch (statusCode) {
          case 401:
          case 403:
            return new AIError(
              'API认证失败，请检查API密钥是否正确',
              ErrorType.AUTHENTICATION_ERROR,
              statusCode,
              error
            );
          case 429:
            return new AIError(
              'API调用频率超限，请稍后重试',
              ErrorType.RATE_LIMIT_ERROR,
              statusCode,
              error
            );
          case 503:
          case 504:
            return new AIError(
              'AI服务暂时不可用，请稍后重试',
              ErrorType.SERVICE_UNAVAILABLE,
              statusCode,
              error
            );
          default:
            return new AIError(
              `服务错误 (${statusCode})，请稍后重试`,
              ErrorType.UNKNOWN_ERROR,
              statusCode,
              error
            );
        }
      }
    }

    // 智谱AI特定错误
    if (error.message.includes('1002')) {
      return new AIError(
        'API密钥无效，请检查密钥是否正确',
        ErrorType.AUTHENTICATION_ERROR,
        401,
        error
      );
    }

    if (error.message.includes('429')) {
      return new AIError(
        'API调用频率超限，请稍后重试',
        ErrorType.RATE_LIMIT_ERROR,
        429,
        error
      );
    }

    // 其他错误
    return new AIError(
      error.message || '发生未知错误',
      ErrorType.UNKNOWN_ERROR,
      undefined,
      error
    );
  }

  /**
   * 根据错误类型提供用户友好的错误消息
   * @param error AIError对象
   * @returns 用户友好的错误消息
   */
  static getUserFriendlyMessage(error: AIError): string {
    switch (error.errorType) {
      case ErrorType.NETWORK_ERROR:
        return '网络连接失败，请检查网络连接后重试';
      case ErrorType.AUTHENTICATION_ERROR:
        return 'API认证失败，请检查API密钥设置';
      case ErrorType.RATE_LIMIT_ERROR:
        return '服务请求过于频繁，请稍后再试';
      case ErrorType.SERVICE_UNAVAILABLE:
        return 'AI服务暂时不可用，请稍后重试';
      case ErrorType.INVALID_INPUT:
        return '输入内容不符合要求，请检查后重试';
      case ErrorType.UNKNOWN_ERROR:
      default:
        return error.message || '发生未知错误，请稍后重试';
    }
  }

  /**
   * 记录错误日志
   * @param error AIError对象
   * @param context 错误发生的上下文信息
   */
  static logError(error: AIError, context?: string): void {
    console.error(`[${error.errorType}] ${context ? context + ': ' : ''}${error.message}`, {
      statusCode: error.statusCode,
      details: error.details,
      timestamp: new Date().toISOString()
    });
  }
}

// 离线消息队列管理
export class OfflineMessageQueue {
  private queue: Array<{
    id: string;
    message: string;
    timestamp: number;
    status: 'pending' | 'processing' | 'failed' | 'sent';
  }> = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 添加消息到离线队列
   * @param message 消息内容
   */
  addMessage(message: string): string {
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.queue.push({
      id,
      message,
      timestamp: Date.now(),
      status: 'pending'
    });
    this.saveToStorage();
    return id;
  }

  /**
   * 获取待发送的消息
   */
  getPendingMessages(): Array<{id: string, message: string}> {
    return this.queue
      .filter(item => item.status === 'pending')
      .map(({ id, message }) => ({ id, message }));
  }

  /**
   * 标记消息为已发送
   * @param id 消息ID
   */
  markAsSent(id: string): void {
    const item = this.queue.find(msg => msg.id === id);
    if (item) {
      item.status = 'sent';
      this.saveToStorage();
    }
  }

  /**
   * 标记消息为发送失败
   * @param id 消息ID
   */
  markAsFailed(id: string): void {
    const item = this.queue.find(msg => msg.id === id);
    if (item) {
      item.status = 'failed';
      this.saveToStorage();
    }
  }

  /**
   * 从存储中加载队列
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('offlineMessageQueue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load offline message queue:', e);
      this.queue = [];
    }
  }

  /**
   * 保存队列到存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('offlineMessageQueue', JSON.stringify(this.queue));
    } catch (e) {
      console.error('Failed to save offline message queue:', e);
    }
  }

  /**
   * 清除已发送的消息
   */
  cleanup(): void {
    this.queue = this.queue.filter(item => item.status !== 'sent');
    this.saveToStorage();
  }
}

// 创建全局离线消息队列实例
export const offlineQueue = new OfflineMessageQueue();