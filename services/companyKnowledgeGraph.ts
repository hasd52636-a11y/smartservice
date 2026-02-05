/**
 * 公司知识图谱服务
 * 基于公司产品和知识库文档构建，展示公司知识覆盖范围
 * 可与用户知识图谱进行对比分析
 */

import { ProductProject } from '../types';
import { KnowledgeNode, KnowledgeEdge, knowledgeGraph } from './knowledgeGraph';
import { vectorService, VectorNode } from './vectorService';
import { timeSeriesService } from './timeSeriesService';

// 定义相似度匹配结果类型
interface SimilarityMatch {
  userId: string;
  companyId: string;
  similarity: number;
}

export interface CompanyNode {
  id: string;
  type: 'product' | 'knowledge' | 'category' | 'tag';
  name: string;
  description: string;
  tags: string[];
  productId?: string;
  parentId?: string;
  children: string[];
  connections: number;
  coverage: number;
  color: string;
}

export interface CompanyEdge {
  source: string;
  target: string;
  type: 'contains' | 'related' | 'covers' | 'depends';
  weight: number;
}

export interface CompanyGraphStats {
  productCount: number;
  knowledgeCount: number;
  categoryCount: number;
  totalNodes: number;
  totalEdges: number;
  avgCoverage: number;
  topCategories: Array<{ category: string; count: number; coverage: number }>;
  productsWithLowCoverage: Array<{ name: string; coverage: number; suggestions: string[] }>;
}

export interface ComparisonResult {
  totalUserKeywords: number;
  coveredKeywords: number;
  coverageRate: number;
  missingKeywords: string[];
  uncoveredCategories: string[];
  recommendations: Array<{
    type: 'add_knowledge' | 'update_product' | 'create_category';
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

class CompanyKnowledgeGraphService {
  private nodes: Map<string, CompanyNode> = new Map();
  private edges: CompanyEdge[] = [];
  private products: ProductProject[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('company_knowledge_graph');
      if (stored) {
        const data = JSON.parse(stored);
        this.nodes = new Map(Object.entries(data.nodes || {}));
        this.edges = data.edges || [];
        this.products = data.products || [];
      }
    } catch (error) {
      console.warn('Failed to load company knowledge graph:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        nodes: Object.fromEntries(this.nodes),
        edges: this.edges,
        products: this.products
      };
      localStorage.setItem('company_knowledge_graph', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save company knowledge graph:', error);
    }
  }

  buildFromProducts(products: ProductProject[]): void {
    this.products = products;
    this.nodes.clear();
    this.edges = [];

    const categoryMap = new Map<string, string>();
    const colorPalette = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];

    products.forEach((product, index) => {
      const productNode: CompanyNode = {
        id: product.id,
        type: 'product',
        name: product.name,
        description: product.description,
        tags: this.extractProductTags(product),
        productId: product.id,
        children: [],
        connections: product.knowledgeBase.length,
        coverage: 0,
        color: colorPalette[index % colorPalette.length]
      };
      this.nodes.set(product.id, productNode);

      product.knowledgeBase.forEach((knowledge, kIndex) => {
        const knowledgeId = `kb_${product.id}_${kIndex}`;
        const tags = knowledge.tags?.map(t => t.toLowerCase()) || [];
        const primaryCategory = this.getPrimaryCategory(tags);

        let categoryNodeId = categoryMap.get(primaryCategory);
        if (!categoryNodeId) {
          categoryNodeId = `cat_${primaryCategory.replace(/\s+/g, '_')}`;
          const existingCategory = this.nodes.get(categoryNodeId);
          if (!existingCategory) {
            this.nodes.set(categoryNodeId, {
              id: categoryNodeId,
              type: 'category',
              name: primaryCategory,
              description: `分类: ${primaryCategory}`,
              tags: [primaryCategory],
              children: [],
              connections: 0,
              coverage: 0,
              color: '#6B7280'
            });
          }
          categoryMap.set(primaryCategory, categoryNodeId);
        }

        const knowledgeNode: CompanyNode = {
          id: knowledgeId,
          type: 'knowledge',
          name: knowledge.title,
          description: knowledge.content?.substring(0, 200) || '',
          tags: tags,
          productId: product.id,
          parentId: categoryNodeId,
          children: [],
          connections: 0,
          coverage: 100,
          color: productNode.color
        };
        this.nodes.set(knowledgeId, knowledgeNode);

        this.edges.push({
          source: product.id,
          target: knowledgeId,
          type: 'contains',
          weight: 1
        });

        this.edges.push({
          source: categoryNodeId,
          target: knowledgeId,
          type: 'contains',
          weight: 0.8
        });

        const parentCategory = this.nodes.get(categoryNodeId);
        if (parentCategory) {
          parentCategory.children.push(knowledgeId);
          parentCategory.connections++;
        }

        const parentProduct = this.nodes.get(product.id);
        if (parentProduct) {
          parentProduct.children.push(knowledgeId);
        }

        tags.forEach(tag => {
          if (!categoryMap.has(tag)) {
            categoryMap.set(tag, `tag_${tag}`);
          }
        });
      });
    });

    this.updateCoverage();
    this.buildCrossReferences();
    this.saveToStorage();
  }

  private extractProductTags(product: ProductProject): string[] {
    const tags = new Set<string>();
    tags.add(product.name);
    if (product.description) {
      const words = product.description.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) tags.add(word);
      });
    }
    product.knowledgeBase.forEach(kb => {
      kb.tags?.forEach(tag => tags.add(tag.toLowerCase()));
    });
    return Array.from(tags);
  }

  private getPrimaryCategory(tags: string[]): string {
    const categoryKeywords: Record<string, string[]> = {
      '使用帮助': ['使用', '教程', '入门', '指南', 'how to', '操作', '步骤'],
      '产品使用': ['功能', '产品', '规格', '参数', '型号', '版本'],
      '故障排查': ['故障', '问题', '错误', '维修', '损坏', '解决'],
      '购买咨询': ['价格', '购买', '付款', '发货', '优惠', '规格'],
      '账户相关': ['账户', '登录', '密码', '注册', '绑定', '安全'],
      '技术参数': ['参数', '配置', '系统', '兼容性', '接口', '协议']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (tags.some(tag => keywords.some(kw => tag.includes(kw)))) {
        return category;
      }
    }
    return '其他';
  }

  private updateCoverage(): void {
    this.nodes.forEach((node, id) => {
      if (node.type === 'product') {
        const children = this.edges
          .filter(e => e.source === id)
          .map(e => e.target);
        const coveredChildren = children.filter(childId => {
          const child = this.nodes.get(childId);
          return child && child.connections > 0;
        });
        node.coverage = children.length > 0
          ? Math.round((coveredChildren.length / children.length) * 100)
          : 0;
      }
    });
  }

  private buildCrossReferences(): void {
    const knowledgeNodes = Array.from(this.nodes.values())
      .filter(n => n.type === 'knowledge');

    for (let i = 0; i < knowledgeNodes.length; i++) {
      for (let j = i + 1; j < knowledgeNodes.length; j++) {
        const nodeA = knowledgeNodes[i];
        const nodeB = knowledgeNodes[j];

        if (nodeA.productId === nodeB.productId) continue;

        const overlap = nodeA.tags.filter(tag =>
          nodeB.tags.some(t => t.includes(tag) || tag.includes(t))
        ).length;

        if (overlap > 0) {
          const weight = Math.min(overlap / Math.max(nodeA.tags.length, nodeB.tags.length, 1), 1);
          this.edges.push({
            source: nodeA.id,
            target: nodeB.id,
            type: 'related',
            weight: weight * 0.5
          });
        }
      }
    }
  }

  compareWithUserGraph(userKeywords: Map<string, number>): ComparisonResult {
    const companyKeywords = new Set<string>();
    this.nodes.forEach(node => {
      node.tags.forEach(tag => {
        companyKeywords.add(tag.toLowerCase());
      });
    });

    let coveredCount = 0;
    const missingKeywords: string[] = [];
    const coveredKeywords: string[] = [];

    userKeywords.forEach((frequency, keyword) => {
      const keywordLower = keyword.toLowerCase();
      const isCovered = Array.from(this.nodes.values()).some(node =>
        node.tags.some(tag =>
          tag.includes(keywordLower) || keywordLower.includes(tag)
        )
      );

      if (isCovered) {
        coveredCount++;
        coveredKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });

    const totalUserKeywords = userKeywords.size;
    const coverageRate = totalUserKeywords > 0
      ? Math.round((coveredCount / totalUserKeywords) * 100)
      : 0;

    const uncoveredCategories = Array.from(this.nodes.values())
      .filter(n => n.type === 'category' && n.connections === 0)
      .map(n => n.name);

    const recommendations: ComparisonResult['recommendations'] = [];

    missingKeywords.forEach(keyword => {
      const category = this.getPrimaryCategory([keyword]);
      recommendations.push({
        type: 'add_knowledge',
        description: `添加关于"${keyword}"的知识文档`,
        priority: userKeywords.get(keyword)! > 5 ? 'high' : 'medium'
      });
    });

    if (coverageRate < 50) {
      recommendations.push({
        type: 'create_category',
        description: '建议创建新的知识分类以覆盖更多用户问题',
        priority: 'high'
      });
    }

    this.nodes.forEach(node => {
      if (node.type === 'product' && node.coverage < 50) {
        recommendations.push({
          type: 'update_product',
          description: `产品"${node.name}"知识覆盖不足，建议补充${100 - node.coverage}%的知识内容`,
          priority: 'medium'
        });
      }
    });

    return {
      totalUserKeywords,
      coveredKeywords: coveredCount,
      coverageRate,
      missingKeywords,
      uncoveredCategories,
      recommendations
    };
  }

  getGraphData(): {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      color: string;
      size: number;
    }>;
    links: Array<{
      source: string;
      target: string;
      type: string;
      value: number;
    }>;
  } {
    const nodes = Array.from(this.nodes.values()).map(node => ({
      id: node.id,
      label: node.name,
      type: node.type,
      color: node.color,
      size: node.type === 'product' ? 30 : node.type === 'category' ? 20 : 12
    }));

    const links = this.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type,
      value: edge.weight
    }));

    return { nodes, links };
  }

  getStats(): CompanyGraphStats {
    let productCount = 0;
    let knowledgeCount = 0;
    let categoryCount = 0;
    let totalCoverage = 0;
    const topCategories: Array<{ category: string; count: number; coverage: number }> = [];
    const productsWithLowCoverage: Array<{ name: string; coverage: number; suggestions: string[] }> = [];

    const categoryStats = new Map<string, { count: number; coverage: number }>();

    this.nodes.forEach(node => {
      switch (node.type) {
        case 'product':
          productCount++;
          totalCoverage += node.coverage;
          if (node.coverage < 50) {
            productsWithLowCoverage.push({
              name: node.name,
              coverage: node.coverage,
              suggestions: this.generateSuggestions(node)
            });
          }
          break;
        case 'knowledge':
          knowledgeCount++;
          break;
        case 'category':
          categoryCount++;
          categoryStats.set(node.name, {
            count: node.connections,
            coverage: node.coverage
          });
          break;
      }
    });

    categoryStats.forEach((stats, category) => {
      topCategories.push({
        category,
        count: stats.count,
        coverage: stats.coverage
      });
    });

    topCategories.sort((a, b) => b.count - a.count);

    return {
      productCount,
      knowledgeCount,
      categoryCount,
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      avgCoverage: productCount > 0 ? Math.round(totalCoverage / productCount) : 0,
      topCategories: topCategories.slice(0, 10),
      productsWithLowCoverage: productsWithLowCoverage.slice(0, 5)
    };
  }

  private generateSuggestions(node: CompanyNode): string[] {
    const suggestions: string[] = [];

    if (node.coverage < 30) {
      suggestions.push('建议添加基础使用教程');
      suggestions.push('添加常见问题解答(FAQ)');
    } else if (node.coverage < 50) {
      suggestions.push('补充高级功能说明');
      suggestions.push('添加故障排查指南');
    } else {
      suggestions.push('完善细节文档');
      suggestions.push('添加视频教程');
    }

    return suggestions;
  }

  getNode(id: string): CompanyNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): CompanyNode[] {
    return Array.from(this.nodes.values());
  }

  getProducts(): ProductProject[] {
    return this.products;
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

    this.nodes.forEach((node, id) => {
      nodeIds.add(id);
      let color = node.color || '#3B82F6';
      let source: 'user' | 'company' | 'both' = 'company';

      if (node.type === 'product') {
        nodes.push({
          id,
          name: node.name,
          category: '产品',
          value: node.coverage,
          symbolSize: 35 + node.coverage * 0.3,
          color: color,
          source,
          details: node
        });
      } else if (node.type === 'category') {
        nodes.push({
          id,
          name: node.name,
          category: '分类',
          value: node.connections,
          symbolSize: 20 + Math.log2(node.connections + 1) * 5,
          color: '#6366F1',
          source,
          details: node
        });
      } else {
        nodes.push({
          id,
          name: node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name,
          category: '知识',
          value: 1,
          symbolSize: 12,
          color: '#60A5FA',
          source,
          details: node
        });
      }
    });

    this.edges.forEach(edge => {
      links.push({
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        lineStyle: {
          width: edge.weight * 3,
          color: 'rgba(59, 130, 246, 0.3)'
        }
      });
    });

    return { nodes, links };
  }

  
  clear(): void {
    this.nodes.clear();
    this.edges = [];
    this.products = [];
    this.saveToStorage();
  }

  /**
   * 计算与用户问题的相似度
   */
  async computeSimilarityWithUserQuestions(
    userQuestions: Array<{ id: string; content: string; keywords: string[] }>, 
    threshold: number = 0.8
  ): Promise<SimilarityMatch[]> {
    const results: SimilarityMatch[] = [];

    // 为公司知识库中的每个知识点创建向量
    const companyTexts: string[] = [];
    const companyMetadata: any[] = [];
    const companyNodeIds: string[] = [];

    this.nodes.forEach((node, id) => {
      if (node.type === 'knowledge') {
        const content = `${node.name} ${node.description} ${node.tags.join(' ')}`;
        companyTexts.push(content);
        companyMetadata.push({ ...node });
        companyNodeIds.push(id);
      }
    });

    // 批量添加公司知识到向量服务
    await vectorService.batchAddVectors(
      companyTexts.map((text, idx) => ({
        text,
        metadata: companyMetadata[idx],
        type: 'company' as const
      }))
    );

    // 为每个用户问题查找最相似的公司知识
    for (const userQ of userQuestions) {
      const userContent = `${userQ.content} ${userQ.keywords.join(' ')}`;
      
      const matches = await vectorService.findMostSimilar(
        userContent, 
        threshold, 
        'company',
        1 // 只取最相似的一个
      );
      
      if (matches.length > 0) {
        const bestMatch = matches[0];
        results.push({
          userId: userQ.id,
          companyId: bestMatch.node.id,
          similarity: bestMatch.similarity
        });
      }
    }
    
    return results;
  }

  /**
   * 扩展合并方法，支持动态相似度计算
   */
  async mergeWithUserGraph(
    userData: ReturnType<typeof import('./userKnowledgeGraph').userKnowledgeGraph.getEChartsData>, 
    threshold: number = 0.8
  ): Promise<{
    nodes: Array<{
      id: string;
      name: string;
      category: string;
      value: number;
      symbolSize: number;
      color: string;
      source: 'user' | 'company' | 'both';
      details?: any;
      overlapScore?: number;
      matchedId?: string;
      threshold?: number;
    }>,
    links: Array<{
      source: string;
      target: string;
      weight: number;
      strength?: number;
      lineStyle?: { width?: number; color?: string };
    }>,
    overlapAnalysis: {
      totalNodes: number;
      userOnly: number;
      companyOnly: number;
      overlap: number;
      coverageRate: number;
    }
  }> {
    // 从userData中提取用户问题信息
    const userQuestions = userData.nodes.map(node => ({
      id: node.id,
      content: node.name,
      keywords: node.details?.keywords || []
    }));
    
    // 计算相似度匹配
    const similarityMatches = await this.computeSimilarityWithUserQuestions(userQuestions, threshold);
    
    // 构建合并后的数据
    const companyData = this.getEChartsData();
    const mergedNodes: any[] = [];
    const mergedLinks: any[] = [...userData.links, ...companyData.links];

    // 处理公司节点
    companyData.nodes.forEach(node => {
      mergedNodes.push({ 
        ...node,
        threshold // 添加当前阈值信息
      });
    });

    // 处理用户节点
    userData.nodes.forEach((userNode, index) => {
      const userQuestion = userQuestions[index];
      
      if (userQuestion) {
        const match = similarityMatches.find(m => m.userId === userQuestion.id);
        
        if (match) {
          // 匹配成功，创建重叠节点
          const companyNode = this.getNode(match.companyId);
          mergedNodes.push({
            id: userNode.id,
            name: userNode.name,
            category: userNode.category,
            value: userNode.value,
            symbolSize: Math.max(userNode.symbolSize, 20), // 确保重叠节点不会太小
            color: '#00ff88', // 绿色表示重叠
            source: 'both',
            overlapScore: match.similarity,
            matchedId: match.companyId,
            threshold,
            details: { 
              user: userNode.details, 
              company: companyNode,
              similarity: match.similarity
            }
          });
          
          // 添加连接线
          mergedLinks.push({
            source: userNode.id,
            target: match.companyId,
            weight: match.similarity,
            strength: match.similarity,
            lineStyle: {
              width: match.similarity * 5,
              color: `rgba(0, 255, 136, ${match.similarity})`
            }
          });
        } else {
          // 未匹配，保持用户节点原样
          mergedNodes.push({
            ...userNode,
            color: '#ffdb00', // 黄色表示未覆盖
            source: 'user',
            overlapScore: 0,
            threshold
          });
        }
      } else {
        // 如果找不到对应的用户问题，按原方式处理
        mergedNodes.push({ 
          ...userNode,
          threshold
        });
      }
    });

    // 计算重叠分析
    const userOnly = userData.nodes.filter((_, index) => 
      !similarityMatches.some(match => match.userId === userQuestions[index]?.id)
    ).length;
    
    const overlap = similarityMatches.length;
    const totalNodes = userData.nodes.length + companyData.nodes.length - overlap;
    const coverageRate = userData.nodes.length > 0 
      ? Math.round((overlap / userData.nodes.length) * 100) 
      : 0;
    
    // 准备时间序列记录
    const timeSeriesRecord = {
      coverageRate,
      totalUserNodes: userData.nodes.length,
      coveredNodes: overlap,
      uncoveredNodes: userOnly,
      thresholdUsed: threshold
    };
    
    // 添加到时间序列服务
    timeSeriesService.addRecord(timeSeriesRecord);
    
    return {
      nodes: mergedNodes,
      links: mergedLinks,
      overlapAnalysis: {
        totalNodes,
        userOnly,
        companyOnly: companyData.nodes.length,
        overlap,
        coverageRate
      }
    };
  }
}

export const companyKnowledgeGraph = new CompanyKnowledgeGraphService();
