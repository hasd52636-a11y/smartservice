/**
 * 向量化服务
 * 基于智谱AI embedding模型实现语义向量化和相似度计算
 */

import { v4 as uuidv4 } from 'uuid';

interface VectorNode {
  id: string;
  text: string;
  vector: number[];
  metadata: any;
  type: 'company' | 'user'; // 区分公司知识还是用户问题
}

export class VectorService {
  private vectors: VectorNode[] = [];
  private apiKey: string;

  constructor() {
    // 从环境变量获取API密钥
    this.apiKey = '';
    
    // 检查是否在Node.js或Vercel环境
    if (typeof process !== 'undefined' && process.env) {
      this.apiKey = process.env.ZHIPU_API_KEY || '';
    }
    
    if (!this.apiKey) {
      console.warn('ZHIPU_API_KEY未配置，将使用模拟向量化功能');
    }
  }

  // 通过智谱AI API获取embedding
  private async getEmbeddingFromApi(text: string): Promise<number[]> {
    if (!this.apiKey) {
      return this.mockEmbedding(text);
    }

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'embedding-3',
          input: text,
          dimensions: 768
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('获取embedding失败:', error);
      return this.mockEmbedding(text);
    }
  }

  /**
   * 获取文本的向量表示
   * @param text 输入文本
   * @returns 向量数组
   */
  async getEmbedding(text: string): Promise<number[]> {
    // 使用API调用获取embedding
    return this.getEmbeddingFromApi(text);
  }

  /**
   * 模拟向量化函数（用于演示和测试）
   * @param text 输入文本
   * @returns 模拟的向量
   */
  private mockEmbedding(text: string): number[] {
    // 创建一个简单的哈希向量作为模拟
    const hash = this.simpleHash(text);
    const vector: number[] = [];
    
    // 生成一个固定长度的向量
    for (let i = 0; i < 128; i++) {
      // 使用文本哈希和位置来生成向量值
      vector.push(Math.sin(hash * (i + 1)) * 0.5 + 0.5);
    }
    
    return vector;
  }

  /**
   * 简单的文本哈希函数
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  /**
   * 计算两个向量的余弦相似度
   * @param vec1 向量1
   * @param vec2 向量2
   * @returns 相似度值 (0-1之间)
   */
  calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('向量维度不匹配');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0; // 如果任一向量为零向量，则相似度为0
    }

    const similarity = dotProduct / (magnitude1 * magnitude2);
    
    // 确保结果在0-1范围内（由于浮点运算误差，可能会略微超出范围）
    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * 添加向量到索引
   * @param text 文本内容
   * @param metadata 元数据
   * @param type 节点类型
   * @returns 创建的节点
   */
  async addVector(text: string, metadata: any, type: 'company' | 'user'): Promise<VectorNode> {
    const vector = await this.getEmbedding(text);
    const node: VectorNode = {
      id: `${type}_${uuidv4()}`,
      text,
      vector,
      metadata,
      type
    };
    
    this.vectors.push(node);
    return node;
  }

  /**
   * 批量添加向量到索引
   */
  async batchAddVectors(items: Array<{ text: string; metadata: any; type: 'company' | 'user' }>): Promise<VectorNode[]> {
    const nodes: VectorNode[] = [];
    
    for (const item of items) {
      const node = await this.addVector(item.text, item.metadata, item.type);
      nodes.push(node);
    }
    
    return nodes;
  }

  /**
   * 查找与给定文本最相似的节点
   * @param text 查询文本
   * @param threshold 相似度阈值
   * @param type 可选的节点类型过滤
   * @param limit 返回结果数量限制
   * @returns 匹配的节点及其相似度
   */
  async findMostSimilar(
    text: string, 
    threshold: number = 0.8, 
    type?: 'company' | 'user',
    limit: number = 5
  ): Promise<Array<{ node: VectorNode; similarity: number }>> {
    const queryVector = await this.getEmbedding(text);
    
    let candidates = this.vectors;
    if (type) {
      candidates = candidates.filter(v => v.type === type);
    }
    
    const similarities = candidates
      .map(node => ({
        node,
        similarity: this.calculateCosineSimilarity(queryVector, node.vector)
      }))
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return similarities;
  }

  /**
   * 获取指定类型的向量数量
   */
  getCountByType(type: 'company' | 'user'): number {
    return this.vectors.filter(v => v.type === type).length;
  }

  /**
   * 清空向量索引
   */
  clear(): void {
    this.vectors = [];
  }

  /**
   * 获取所有向量
   */
  getAllVectors(): VectorNode[] {
    return [...this.vectors];
  }

  /**
   * 根据ID查找节点
   */
  findById(id: string): VectorNode | undefined {
    return this.vectors.find(v => v.id === id);
  }

  /**
   * 删除指定ID的向量
   */
  removeById(id: string): boolean {
    const initialLength = this.vectors.length;
    this.vectors = this.vectors.filter(v => v.id !== id);
    return this.vectors.length !== initialLength;
  }
}

// 创建全局实例
export const vectorService = new VectorService();

// 导出类型定义
export type { VectorNode };