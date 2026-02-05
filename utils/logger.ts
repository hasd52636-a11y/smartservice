// 日志和监控工具类
export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: any;
  userId?: string;
  sessionId?: string;
  projectId?: string;
}

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  metricType: 'api-call' | 'render-time' | 'memory-usage' | 'network-latency';
  value: number;
  unit: string;
  context?: any;
  userId?: string;
  sessionId?: string;
  projectId?: string;
}

export interface ConversationMetrics {
  id: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  projectId?: string;
  messageCount: number;
  avgResponseTime: number;
  satisfactionRating?: number;
  feedback?: string;
}

export class Logger {
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetric[] = [];
  private conversations: ConversationMetrics[] = [];
  private maxLogs: number = 1000;
  private maxMetrics: number = 1000;
  private maxConversations: number = 100;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    if (typeof window !== 'undefined') {
      this.cleanupTimer = setInterval(() => {
        this.cleanupOldEntries();
      }, 300000);
    }
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 记录普通日志
   * @param message 日志消息
   * @param context 上下文信息
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param projectId 项目ID
   */
  info(message: string, context?: any, userId?: string, sessionId?: string, projectId?: string): void {
    this.addLog('info', message, context, userId, sessionId, projectId);
  }

  /**
   * 记录警告日志
   * @param message 警告消息
   * @param context 上下文信息
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param projectId 项目ID
   */
  warn(message: string, context?: any, userId?: string, sessionId?: string, projectId?: string): void {
    this.addLog('warn', message, context, userId, sessionId, projectId);
  }

  /**
   * 记录错误日志
   * @param message 错误消息
   * @param context 上下文信息
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param projectId 项目ID
   */
  error(message: string, context?: any, userId?: string, sessionId?: string, projectId?: string): void {
    this.addLog('error', message, context, userId, sessionId, projectId);
  }

  /**
   * 记录调试日志
   * @param message 调试消息
   * @param context 上下文信息
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param projectId 项目ID
   */
  debug(message: string, context?: any, userId?: string, sessionId?: string, projectId?: string): void {
    this.addLog('debug', message, context, userId, sessionId, projectId);
  }

  /**
   * 添加日志条目
   */
  private addLog(level: LogEntry['level'], message: string, context?: any, userId?: string, sessionId?: string, projectId?: string): void {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      context,
      userId,
      sessionId,
      projectId
    };

    this.logs.push(logEntry);
    this.saveToStorage();

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * 记录性能指标
   * @param metricType 指标类型
   * @param value 指标值
   * @param unit 单位
   * @param context 上下文信息
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param projectId 项目ID
   */
  recordPerformance(metricType: PerformanceMetric['metricType'], value: number, unit: string, context?: any, userId?: string, sessionId?: string, projectId?: string): void {
    const metric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      metricType,
      value,
      unit,
      context,
      userId,
      sessionId,
      projectId
    };

    this.metrics.push(metric);
    this.saveToStorage();

    // 限制指标数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * 记录对话指标
   * @param messageCount 消息数量
   * @param avgResponseTime 平均响应时间
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param projectId 项目ID
   * @param satisfactionRating 满意度评分
   * @param feedback 反馈内容
   */
  recordConversation(messageCount: number, avgResponseTime: number, userId?: string, sessionId?: string, projectId?: string, satisfactionRating?: number, feedback?: string): void {
    const conversation: ConversationMetrics = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userId,
      sessionId,
      projectId,
      messageCount,
      avgResponseTime,
      satisfactionRating,
      feedback
    };

    this.conversations.push(conversation);
    this.saveToStorage();

    // 限制对话记录数量
    if (this.conversations.length > this.maxConversations) {
      this.conversations = this.conversations.slice(-this.maxConversations);
    }
  }

  /**
   * 获取日志
   * @param level 日志级别
   * @param limit 限制数量
   * @returns 日志数组
   */
  getLogs(level?: LogEntry['level'], limit?: number): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }

  /**
   * 获取性能指标
   * @param metricType 指标类型
   * @param limit 限制数量
   * @returns 性能指标数组
   */
  getMetrics(metricType?: PerformanceMetric['metricType'], limit?: number): PerformanceMetric[] {
    let filteredMetrics = this.metrics;
    
    if (metricType) {
      filteredMetrics = filteredMetrics.filter(metric => metric.metricType === metricType);
    }
    
    if (limit) {
      filteredMetrics = filteredMetrics.slice(-limit);
    }
    
    return filteredMetrics;
  }

  /**
   * 获取对话指标
   * @param limit 限制数量
   * @returns 对话指标数组
   */
  getConversations(limit?: number): ConversationMetrics[] {
    if (limit) {
      return this.conversations.slice(-limit);
    }
    return this.conversations;
  }

  /**
   * 计算平均响应时间
   * @param projectId 项目ID
   * @returns 平均响应时间
   */
  getAverageResponseTime(projectId?: string): number {
    const relevantMetrics = projectId 
      ? this.metrics.filter(m => m.projectId === projectId && m.metricType === 'api-call')
      : this.metrics.filter(m => m.metricType === 'api-call');

    if (relevantMetrics.length === 0) {
      return 0;
    }

    const totalTime = relevantMetrics.reduce((sum, metric) => sum + metric.value, 0);
    return totalTime / relevantMetrics.length;
  }

  /**
   * 获取错误计数
   * @param projectId 项目ID
   * @returns 错误计数
   */
  getErrorCount(projectId?: string): number {
    const relevantLogs = projectId 
      ? this.logs.filter(l => l.projectId === projectId && l.level === 'error')
      : this.logs.filter(l => l.level === 'error');

    return relevantLogs.length;
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
    this.metrics = [];
    this.conversations = [];
    this.saveToStorage();
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs));
      localStorage.setItem('app_metrics', JSON.stringify(this.metrics));
      localStorage.setItem('app_conversations', JSON.stringify(this.conversations));
    } catch (e) {
      console.error('Failed to save logs to storage:', e);
    }
  }

  /**
   * 从存储加载
   */
  private loadFromStorage(): void {
    try {
      const logsStr = localStorage.getItem('app_logs');
      const metricsStr = localStorage.getItem('app_metrics');
      const conversationsStr = localStorage.getItem('app_conversations');

      if (logsStr) {
        this.logs = JSON.parse(logsStr);
      }
      if (metricsStr) {
        this.metrics = JSON.parse(metricsStr);
      }
      if (conversationsStr) {
        this.conversations = JSON.parse(conversationsStr);
      }
    } catch (e) {
      console.error('Failed to load logs from storage:', e);
      this.logs = [];
      this.metrics = [];
      this.conversations = [];
    }
  }

  /**
   * 清理旧条目
   */
  private cleanupOldEntries(): void {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000; // 一周前

    // 清理超过一周的日志
    this.logs = this.logs.filter(log => log.timestamp > oneWeekAgo);
    this.metrics = this.metrics.filter(metric => metric.timestamp > oneWeekAgo);
    this.conversations = this.conversations.filter(conv => conv.timestamp > oneWeekAgo);

    this.saveToStorage();
  }

  /**
   * 导出日志（用于调试）
   */
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      metrics: this.metrics,
      conversations: this.conversations,
      exportTimestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * 获取系统健康状况
   */
  getHealthStatus(): { 
    isHealthy: boolean; 
    errorRate: number; 
    avgResponseTime: number; 
    lastActivity: number 
  } {
    const recentLogs = this.logs.filter(log => log.timestamp > Date.now() - 60000); // 最近1分钟
    const recentErrors = recentLogs.filter(log => log.level === 'error');
    const errorRate = recentLogs.length > 0 ? recentErrors.length / recentLogs.length : 0;
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > Date.now() - 60000 && m.metricType === 'api-call');
    const avgResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length 
      : 0;
    
    const lastActivity = this.logs.length > 0 
      ? Math.max(...this.logs.map(log => log.timestamp))
      : 0;

    return {
      isHealthy: errorRate < 0.1, // 错误率低于10%
      errorRate,
      avgResponseTime,
      lastActivity
    };
  }
}

// 创建全局日志实例
export const logger = new Logger();