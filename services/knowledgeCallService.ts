export interface KnowledgeCallRecord {
  id: string;
  query: string;
  matchedDocuments: Array<{
    id: string;
    title: string;
    similarity: number;
    content: string;
  }>;
  timestamp: Date;
  userId: string;
  sessionId: string;
  responseTime: number;
}

export class KnowledgeCallService {
  private readonly STORAGE_KEY = 'smartguide_knowledge_calls';
  private readonly MAX_RECORDS = 50;

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    const existing = localStorage.getItem(this.STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
  }

  private getUserId(): string {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_id', userId);
    }
    return userId;
  }

  private getSessionId(): string {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  recordCall(query: string, matchedDocuments: Array<{
    id: string;
    title: string;
    similarity: number;
    content: string;
  }>, responseTime: number): void {
    const records = this.getCalls();
    
    const newRecord: KnowledgeCallRecord = {
      id: `call_${Date.now()}`,
      query,
      matchedDocuments,
      timestamp: new Date(),
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      responseTime
    };

    // 添加新记录并保持最多50条
    records.unshift(newRecord);
    if (records.length > this.MAX_RECORDS) {
      records.splice(this.MAX_RECORDS);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
  }

  getCalls(limit: number = this.MAX_RECORDS): KnowledgeCallRecord[] {
    const records = localStorage.getItem(this.STORAGE_KEY);
    if (!records) {
      return [];
    }
    
    try {
      const parsed = JSON.parse(records) as KnowledgeCallRecord[];
      // 转换timestamp为Date对象
      return parsed.slice(0, limit).map(record => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }));
    } catch (error) {
      console.error('Error parsing knowledge call records:', error);
      return [];
    }
  }

  getRecentCalls(days: number = 7): KnowledgeCallRecord[] {
    const records = this.getCalls();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return records.filter(record => record.timestamp >= cutoffDate);
  }

  getHighFrequencyQueries(limit: number = 10): Array<{
    query: string;
    count: number;
  }> {
    const records = this.getCalls();
    const queryCounts = new Map<string, number>();

    // 统计查询频率
    records.forEach(record => {
      const query = record.query.trim().toLowerCase();
      if (query) {
        queryCounts.set(query, (queryCounts.get(query) || 0) + 1);
      }
    });

    // 转换为数组并排序
    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  clearCalls(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
  }

  exportCalls(): string {
    const records = this.getCalls();
    return JSON.stringify(records, null, 2);
  }

  getAverageSimilarity(): number {
    const records = this.getCalls();
    if (records.length === 0) {
      return 0;
    }
    
    const totalSimilarity = records.reduce((sum, record) => {
      if (record.matchedDocuments && record.matchedDocuments.length > 0) {
        const avgSimilarity = record.matchedDocuments.reduce((docSum, doc) => docSum + doc.similarity, 0) / record.matchedDocuments.length;
        return sum + avgSimilarity;
      }
      return sum;
    }, 0);
    
    return totalSimilarity / records.length;
  }

  getAverageResponseTime(): number {
    const records = this.getCalls();
    if (records.length === 0) {
      return 0;
    }

    const totalTime = records.reduce((sum, record) => sum + record.responseTime, 0);
    return totalTime / records.length;
  }

  exportData(): string {
    const records = this.getCalls();
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalRecords: records.length,
      records: records
    }, null, 2);
  }

  clearAll(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
  }
}

export const knowledgeCallService = new KnowledgeCallService();
