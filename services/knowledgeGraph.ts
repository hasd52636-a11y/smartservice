/**
 * 知识图谱服务
 * 基于标签的简单知识关联，自动建立知识点之间的关联
 */

export interface KnowledgeNode {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'doc';
  tags: string[];
  relatedIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  type: 'similar' | 'related' | 'category';
  weight: number;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  avgConnections: number;
  topTags: Array<{ tag: string; count: number }>;
}

export class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: KnowledgeEdge[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('knowledge_graph');
      if (stored) {
        const data = JSON.parse(stored);
        this.nodes = new Map(Object.entries(data.nodes || {}));
        this.edges = (data.edges || []).map((e: KnowledgeEdge) => ({
          ...e,
          source: e.source,
          target: e.target
        }));
      }
    } catch (error) {
      console.warn('Failed to load knowledge graph from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        nodes: Object.fromEntries(this.nodes),
        edges: this.edges
      };
      localStorage.setItem('knowledge_graph', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save knowledge graph:', error);
    }
  }

  addNode(node: Omit<KnowledgeNode, 'relatedIds' | 'createdAt' | 'updatedAt'>): void {
    const newNode: KnowledgeNode = {
      ...node,
      relatedIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.nodes.set(node.id, newNode);
    this.updateEdges(newNode);
    this.saveToStorage();
  }

  private updateEdges(node: KnowledgeNode): void {
    this.nodes.forEach((existingNode, existingId) => {
      if (existingId === node.id) return;

      const overlap = node.tags.filter(tag =>
        existingNode.tags.includes(tag)
      ).length;

      const similarity = overlap / Math.max(node.tags.length, existingNode.tags.length, 1);

      if (similarity > 0.2) {
        const existingEdge = this.edges.find(e =>
          (e.source === node.id && e.target === existingId) ||
          (e.source === existingId && e.target === node.id)
        );

        if (existingEdge) {
          existingEdge.weight = similarity;
        } else {
          this.edges.push({
            source: node.id,
            target: existingId,
            type: 'similar',
            weight: similarity
          });
        }

        if (!node.relatedIds.includes(existingId)) {
          node.relatedIds.push(existingId);
        }
        if (!existingNode.relatedIds.includes(node.id)) {
          existingNode.relatedIds.push(node.id);
        }
      }
    });

    this.nodes.set(node.id, node);
    this.nodes.forEach((n, id) => {
      if (id !== node.id) {
        this.nodes.set(id, n);
      }
    });
  }

  getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): KnowledgeNode[] {
    return Array.from(this.nodes.values());
  }

  getRelated(nodeId: string, limit: number = 5): KnowledgeNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const related = this.edges
      .filter(e => e.source === nodeId || e.target === nodeId)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map(e => {
        const targetId = e.source === nodeId ? e.target : e.source;
        return { node: this.nodes.get(targetId), weight: e.weight };
      })
      .filter(item => item.node !== undefined)
      .map(item => item as { node: KnowledgeNode; weight: number })
      .sort((a, b) => b.weight - a.weight)
      .map(item => item.node);

    return related.slice(0, limit);
  }

  findByTag(tag: string): KnowledgeNode[] {
    const lowerTag = tag.toLowerCase();
    return Array.from(this.nodes.values()).filter(node =>
      node.tags.some(t => t.toLowerCase().includes(lowerTag))
    );
  }

  findByContent(query: string): KnowledgeNode[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.nodes.values()).filter(node =>
      node.title.toLowerCase().includes(lowerQuery) ||
      node.content.toLowerCase().includes(lowerQuery) ||
      node.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  removeNode(id: string): boolean {
    const existed = this.nodes.delete(id);
    if (existed) {
      this.edges = this.edges.filter(e => e.source !== id && e.target !== id);
      this.nodes.forEach(node => {
        if (node.relatedIds.includes(id)) {
          node.relatedIds = node.relatedIds.filter(rid => rid !== id);
          this.nodes.set(node.id, node);
        }
      });
      this.saveToStorage();
    }
    return existed;
  }

  getStats(): GraphStats {
    const nodeCount = this.nodes.size;
    const edgeCount = this.edges.length;
    const totalConnections = Array.from(this.nodes.values())
      .reduce((sum, node) => sum + node.relatedIds.length, 0);
    const avgConnections = nodeCount > 0 ? totalConnections / nodeCount : 0;

    const tagCounts = new Map<string, number>();
    this.nodes.forEach(node => {
      node.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      nodeCount,
      edgeCount,
      avgConnections: Math.round(avgConnections * 100) / 100,
      topTags
    };
  }

  exportGraph(): { nodes: Array<{ id: string; name: string; group: string }>; links: Array<{ source: string; target: string; value: number }> } {
    return {
      nodes: Array.from(this.nodes.values()).map(node => ({
        id: node.id,
        name: node.title,
        group: node.type
      })),
      links: this.edges.map(e => ({
        source: e.source,
        target: e.target,
        value: e.weight
      }))
    };
  }

  clear(): void {
    this.nodes.clear();
    this.edges = [];
    this.saveToStorage();
  }
}

export const knowledgeGraph = new KnowledgeGraph();
