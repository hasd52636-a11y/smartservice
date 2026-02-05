/**
 * 时间序列服务
 * 用于记录和分析知识图谱随时间的变化
 */

export interface TimeSeriesRecord {
  timestamp: Date;
  coverageRate: number;
  totalUserNodes: number;
  coveredNodes: number;
  uncoveredNodes: number;
  thresholdUsed: number;
  analysisNotes?: string;
}

export class TimeSeriesService {
  private records: TimeSeriesRecord[] = [];
  private maxRecords: number = 100; // 限制最大记录数

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('knowledge_graph_time_series');
      if (stored) {
        const data = JSON.parse(stored);
        this.records = data.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load time series data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('knowledge_graph_time_series', JSON.stringify(this.records));
    } catch (error) {
      console.warn('Failed to save time series data:', error);
    }
  }

  /**
   * 添加新的时间序列记录
   */
  addRecord(record: Omit<TimeSeriesRecord, 'timestamp'>): void {
    const newRecord: TimeSeriesRecord = {
      ...record,
      timestamp: new Date()
    };

    this.records.push(newRecord);
    
    // 限制记录数量
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
    
    this.saveToStorage();
  }

  /**
   * 获取时间范围内的记录
   */
  getRecords(fromDate?: Date, toDate?: Date, limit?: number): TimeSeriesRecord[] {
    let filteredRecords = [...this.records];

    if (fromDate) {
      filteredRecords = filteredRecords.filter(r => r.timestamp >= fromDate);
    }

    if (toDate) {
      filteredRecords = filteredRecords.filter(r => r.timestamp <= toDate);
    }

    // 按时间倒序排列
    filteredRecords.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (limit) {
      filteredRecords = filteredRecords.slice(0, limit);
    }

    return filteredRecords;
  }

  /**
   * 获取覆盖率趋势
   */
  getCoverageTrend(daysBack: number = 30): Array<{ date: Date; coverage: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const records = this.getRecords(cutoffDate);
    
    return records
      .map(r => ({ date: r.timestamp, coverage: r.coverageRate }))
      .reverse(); // 按时间顺序排列
  }

  /**
   * 获取最近的记录
   */
  getLatestRecord(): TimeSeriesRecord | null {
    if (this.records.length === 0) {
      return null;
    }
    
    return this.records[this.records.length - 1];
  }

  /**
   * 分析覆盖率变化
   */
  analyzeCoverageChange(): {
    trend: 'increasing' | 'decreasing' | 'stable';
    changeRate: number;
    isSignificant: boolean;
  } {
    if (this.records.length < 2) {
      return { trend: 'stable', changeRate: 0, isSignificant: false };
    }

    const recentRecords = this.getRecords(undefined, undefined, 5);
    if (recentRecords.length < 2) {
      return { trend: 'stable', changeRate: 0, isSignificant: false };
    }

    const first = recentRecords[0].coverageRate;
    const last = recentRecords[recentRecords.length - 1].coverageRate;
    const changeRate = ((last - first) / first) * 100;

    // 判断趋势
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (changeRate > 5) {
      trend = 'increasing';
    } else if (changeRate < -5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    // 判断变化是否显著
    const isSignificant = Math.abs(changeRate) > 10;

    return { trend, changeRate, isSignificant };
  }

  /**
   * 获取统计摘要
   */
  getStats(): {
    totalRecords: number;
    avgCoverage: number;
    minCoverage: number;
    maxCoverage: number;
    coverageStdDev: number;
  } {
    if (this.records.length === 0) {
      return {
        totalRecords: 0,
        avgCoverage: 0,
        minCoverage: 0,
        maxCoverage: 0,
        coverageStdDev: 0
      };
    }

    const coverages = this.records.map(r => r.coverageRate);
    const avgCoverage = coverages.reduce((sum, val) => sum + val, 0) / coverages.length;
    const minCoverage = Math.min(...coverages);
    const maxCoverage = Math.max(...coverages);
    
    // 计算标准差
    const variance = coverages.reduce((sum, val) => sum + Math.pow(val - avgCoverage, 2), 0) / coverages.length;
    const coverageStdDev = Math.sqrt(variance);

    return {
      totalRecords: this.records.length,
      avgCoverage: Number(avgCoverage.toFixed(2)),
      minCoverage,
      maxCoverage,
      coverageStdDev: Number(coverageStdDev.toFixed(2))
    };
  }

  /**
   * 清空所有记录
   */
  clear(): void {
    this.records = [];
    this.saveToStorage();
  }
}

export const timeSeriesService = new TimeSeriesService();