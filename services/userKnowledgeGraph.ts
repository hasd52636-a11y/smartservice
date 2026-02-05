/**
 * 用户知识图谱服务
 * 基于用户真实问答数据构建知识图谱
 */

export interface UserQuestionNode {
  id: string;
  content: string;
  keywords: string[];
  frequency: number;
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  lastAsked: Date;
  relatedQuestions: string[];
  satisfaction?: number;
}

export interface UserGraphNode {
  id: string;
  name: string;
  type: 'question' | 'keyword' | 'category' | 'product';
  value: number;
  category?: string;
  x?: number;
  y?: number;
}

export interface UserGraphLink {
  source: string;
  target: string;
  weight: number;
  type: 'frequency' | 'similarity' | 'category';
}

export interface UserKnowledgeStats {
  totalQuestions: number;
  totalKeywords: number;
  topKeywords: Array<{ keyword: string; count: number }>;
  topQuestions: Array<{ question: string; count: number }>;
  categoryDistribution: Array<{ category: string; count: number }>;
  avgSatisfaction: number;
  negativeRate: number;
}

export class UserKnowledgeGraph {
  private questions: Map<string, UserQuestionNode> = new Map();
  private keywords: Map<string, number> = new Map();
  private categoryStats: Map<string, number> = new Map();
  private readonly STORAGE_KEY = 'user_knowledge_graph';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.questions = new Map(Object.entries(data.questions || {}));
        this.keywords = new Map(Object.entries(data.keywords || {}));
        this.categoryStats = new Map(Object.entries(data.categoryStats || {}));
      } else {
        this.initializeSampleData();
      }
    } catch (error) {
      console.warn('Failed to load user knowledge graph:', error);
      this.initializeSampleData();
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        questions: Object.fromEntries(this.questions),
        keywords: Object.fromEntries(this.keywords),
        categoryStats: Object.fromEntries(this.categoryStats)
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save user knowledge graph:', error);
    }
  }

  private initializeSampleData(): void {
    const sampleQuestions: UserQuestionNode[] = [
      {
        id: 'q1',
        content: '如何扫描二维码使用客服？',
        keywords: ['二维码', '扫描', '客服', '使用'],
        frequency: 156,
        category: '使用帮助',
        sentiment: 'neutral',
        lastAsked: new Date(),
        relatedQuestions: ['q2', 'q3']
      },
      {
        id: 'q2',
        content: '产品安装视频在哪里查看？',
        keywords: ['安装', '视频', '查看', '产品'],
        frequency: 134,
        category: '产品使用',
        sentiment: 'neutral',
        lastAsked: new Date(),
        relatedQuestions: ['q1', 'q4']
      },
      {
        id: 'q3',
        content: '怎么联系人工客服？',
        keywords: ['人工', '联系', '客服', '转人工'],
        frequency: 98,
        category: '服务咨询',
        sentiment: 'negative',
        lastAsked: new Date(),
        relatedQuestions: ['q1']
      },
      {
        id: 'q4',
        content: '产品使用方法视频教学',
        keywords: ['产品', '使用', '教学', '视频'],
        frequency: 87,
        category: '产品使用',
        sentiment: 'positive',
        lastAsked: new Date(),
        relatedQuestions: ['q2']
      },
      {
        id: 'q5',
        content: '设备连接不上怎么办？',
        keywords: ['设备', '连接', '问题', '无法'],
        frequency: 76,
        category: '故障排查',
        sentiment: 'negative',
        lastAsked: new Date(),
        relatedQuestions: ['q6']
      },
      {
        id: 'q6',
        content: 'WiFi连接不稳定怎么解决？',
        keywords: ['WiFi', '连接', '不稳定', '解决'],
        frequency: 65,
        category: '故障排查',
        sentiment: 'negative',
        lastAsked: new Date(),
        relatedQuestions: ['q5']
      }
    ];

    sampleQuestions.forEach(q => {
      this.questions.set(q.id, q);
      q.keywords.forEach(k => {
        this.keywords.set(k, (this.keywords.get(k) || 0) + q.frequency);
      });
      this.categoryStats.set(q.category, (this.categoryStats.get(q.category) || 0) + q.frequency);
    });

    this.saveToStorage();
  }

  recordQuestion(
    content: string,
    keywords: string[],
    category: string,
    sentiment: 'positive' | 'neutral' | 'negative' = 'neutral',
    satisfaction?: number
  ): string {
    const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const question: UserQuestionNode = {
      id,
      content,
      keywords,
      frequency: 1,
      category,
      sentiment,
      lastAsked: new Date(),
      relatedQuestions: [],
      satisfaction
    };

    this.questions.set(id, question);

    keywords.forEach(k => {
      this.keywords.set(k, (this.keywords.get(k) || 0) + 1);
    });

    this.categoryStats.set(category, (this.categoryStats.get(category) || 0) + 1);

    this.updateRelatedQuestions(id, keywords);
    this.saveToStorage();

    return id;
  }

  private updateRelatedQuestions(questionId: string, keywords: string[]): void {
    const question = this.questions.get(questionId);
    if (!question) return;

    const related: string[] = [];

    this.questions.forEach((q, id) => {
      if (id === questionId) return;

      const commonKeywords = q.keywords.filter(k => keywords.includes(k));
      if (commonKeywords.length >= 2) {
        related.push(id);
      }
    });

    question.relatedQuestions = related.slice(0, 5);
    this.questions.set(questionId, question);
  }

  incrementFrequency(id: string): void {
    const question = this.questions.get(id);
    if (question) {
      question.frequency++;
      question.lastAsked = new Date();
      this.questions.set(id, question);
      question.keywords.forEach(k => {
        this.keywords.set(k, (this.keywords.get(k) || 0) + 1);
      });
      this.saveToStorage();
    }
  }

  getGraphData(): { nodes: UserGraphNode[]; links: UserGraphLink[] } {
    const nodes: UserGraphNode[] = [];
    const links: UserGraphLink[] = [];

    this.questions.forEach((q, id) => {
      nodes.push({
        id,
        name: q.content.length > 20 ? q.content.substring(0, 20) + '...' : q.content,
        type: 'question',
        value: Math.min(q.frequency / 10, 30)
      });

      q.keywords.forEach(k => {
        if (!nodes.find(n => n.name === k && n.type === 'keyword')) {
          nodes.push({
            id: `kw_${k}`,
            name: k,
            type: 'keyword',
            value: Math.min((this.keywords.get(k) || 0) / 20, 25)
          });
        }

        links.push({
          source: id,
          target: `kw_${k}`,
          weight: q.frequency,
          type: 'frequency'
        });
      });
    });

    this.categoryStats.forEach((count, category) => {
      const categoryId = `cat_${category}`;
      if (!nodes.find(n => n.id === categoryId)) {
        nodes.push({
          id: categoryId,
          name: category,
          type: 'category',
          value: Math.min(count / 15, 20)
        });
      }
    });

    return { nodes, links };
  }

  getStats(): UserKnowledgeStats {
    const sortedKeywords = Array.from(this.keywords.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const sortedQuestions = Array.from(this.questions.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const sortedCategories = Array.from(this.categoryStats.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    this.questions.forEach(q => {
      if (q.satisfaction !== undefined) {
        if (q.satisfaction >= 4) sentimentCounts.positive++;
        else if (q.satisfaction >= 3) sentimentCounts.neutral++;
        else sentimentCounts.negative++;
      } else {
        sentimentCounts.neutral++;
      }
    });

    const total = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;

    const avgSatisfaction = Array.from(this.questions.values())
      .filter(q => q.satisfaction !== undefined)
      .reduce((sum, q) => sum + (q.satisfaction || 0), 0) /
      Math.max(1, Array.from(this.questions.values()).filter(q => q.satisfaction !== undefined).length);

    return {
      totalQuestions: this.questions.size,
      totalKeywords: this.keywords.size,
      topKeywords: sortedKeywords,
      topQuestions: sortedQuestions.map(q => ({ question: q.content, count: q.frequency })),
      categoryDistribution: sortedCategories,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      negativeRate: total > 0 ? Math.round((sentimentCounts.negative / total) * 100) : 0
    };
  }

  getQuestions(): UserQuestionNode[] {
    return Array.from(this.questions.values());
  }

  getCategories(): string[] {
    return Array.from(this.categoryStats.keys());
  }

  getAllKeywords(): Map<string, number> {
    return new Map(this.keywords);
  }

  getEChartsData(): {
    nodes: Array<{
      id: string;
      name: string;
      category: string;
      value: number;
      symbolSize: number;
      color: string;
      source: 'user' | 'company' | 'both';
      details?: any;
    }>;
    links: Array<{
      source: string;
      target: string;
      weight: number;
      lineStyle?: { width?: number; color?: string };
    }>;
  } {
    const nodes: any[] = [];
    const links: any[] = [];
    const nodeIds = new Set<string>();

    this.questions.forEach((q, id) => {
      nodeIds.add(id);
      nodes.push({
        id,
        name: q.content.length > 15 ? q.content.substring(0, 15) + '...' : q.content,
        category: q.category,
        value: q.frequency,
        symbolSize: 15 + Math.log2(q.frequency + 1) * 5,
        color: '#F59E0B',
        source: 'user',
        details: q
      });

      q.keywords.forEach(k => {
        const kwId = `kw_${k}`;
        if (!nodeIds.has(kwId)) {
          nodeIds.add(kwId);
          const kwCount = this.keywords.get(k) || 0;
          nodes.push({
            id: kwId,
            name: k,
            category: '关键词',
            value: kwCount,
            symbolSize: 10 + Math.log2(kwCount + 1) * 3,
            color: '#FBBF24',
            source: 'user',
            details: { keyword: k, count: kwCount }
          });
        }

        links.push({
          source: id,
          target: kwId,
          weight: q.frequency,
          lineStyle: {
            width: Math.min(q.frequency / 20, 3),
            color: 'rgba(245, 158, 11, 0.4)'
          }
        });
      });

      if (q.relatedQuestions) {
        q.relatedQuestions.forEach(relId => {
          if (nodeIds.has(relId)) {
            links.push({
              source: id,
              target: relId,
              weight: 5,
              lineStyle: {
                width: 1,
                color: 'rgba(245, 158, 11, 0.2)'
              }
            });
          }
        });
      }
    });

    return { nodes, links };
  }

  clearAll(): void {
    this.questions.clear();
    this.keywords.clear();
    this.categoryStats.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// 在 UserKnowledgeGraph 类定义之后添加相似度相关方法

export const userKnowledgeGraph = new UserKnowledgeGraph();
