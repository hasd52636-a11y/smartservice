/**
 * 图分析服务
 * 提供图论分析功能，如中心性分析、社区发现等
 */

export interface GraphNode {
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
}

export interface GraphLink {
  source: string;
  target: string;
  weight: number;
  strength?: number;
  lineStyle?: { width?: number; color?: string };
}

export interface GraphAnalysisResult {
  betweennessCentrality: Record<string, number>;
  degreeCentrality: Record<string, number>;
  clusteringCoefficient: Record<string, number>;
  communities: Array<{ id: string; nodes: string[]; size: number; density: number }>;
  keyInsights: Array<{ type: string; nodeId: string; value: number; description: string }>;
}

export class GraphAnalysisService {
  /**
   * 计算节点的度中心性
   * 度中心性衡量节点与其他节点的连接数量
   */
  calculateDegreeCentrality(nodes: GraphNode[], links: GraphLink[]): Record<string, number> {
    const centrality: Record<string, number> = {};
    
    // 初始化所有节点的度为0
    nodes.forEach(node => {
      centrality[node.id] = 0;
    });
    
    // 计算每个节点的连接数
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      
      if (centrality[sourceId] !== undefined) centrality[sourceId]++;
      if (centrality[targetId] !== undefined) centrality[targetId]++;
    });
    
    // 归一化（除以最大可能连接数）
    const maxPossibleConnections = nodes.length - 1;
    if (maxPossibleConnections > 0) {
      Object.keys(centrality).forEach(nodeId => {
        centrality[nodeId] = centrality[nodeId] / maxPossibleConnections;
      });
    }
    
    return centrality;
  }

  /**
   * 计算节点的紧密中心性
   * 紧密中心性衡量节点到达图中其他节点的平均距离
   */
  calculateClosenessCentrality(nodes: GraphNode[], links: GraphLink[]): Record<string, number> {
    const centrality: Record<string, number> = {};
    const nodeIds = nodes.map(n => n.id);
    
    // 构建邻接表
    const adjacencyList: Record<string, string[]> = {};
    nodeIds.forEach(id => {
      adjacencyList[id] = [];
    });
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      
      if (adjacencyList[sourceId] && adjacencyList[targetId]) {
        adjacencyList[sourceId].push(targetId);
        adjacencyList[targetId].push(sourceId); // 无向图
      }
    });
    
    // 对每个节点计算到其他节点的最短路径
    nodeIds.forEach(startNodeId => {
      const distances = this.bfsShortestPaths(startNodeId, adjacencyList);
      const totalDistance = Object.values(distances).reduce((sum, dist) => sum + dist, 0);
      
      // 紧密中心性 = (节点数 - 1) / 总距离
      const reachableNodes = Object.keys(distances).length - 1; // 不包括自身
      centrality[startNodeId] = reachableNodes > 0 ? reachableNodes / totalDistance : 0;
    });
    
    return centrality;
  }

  /**
   * 使用广度优先搜索计算最短路径
   */
  private bfsShortestPaths(startNodeId: string, adjacencyList: Record<string, string[]>): Record<string, number> {
    const distances: Record<string, number> = {};
    const queue: string[] = [startNodeId];
    const visited: Set<string> = new Set([startNodeId]);
    
    distances[startNodeId] = 0;
    
    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      
      for (const neighbor of adjacencyList[currentNode]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          distances[neighbor] = distances[currentNode] + 1;
          queue.push(neighbor);
        }
      }
    }
    
    return distances;
  }

  /**
   * 计算节点的聚类系数
   * 聚类系数衡量节点邻居之间相互连接的程度
   */
  calculateClusteringCoefficient(nodes: GraphNode[], links: GraphLink[]): Record<string, number> {
    const coefficient: Record<string, number> = {};
    const nodeIds = nodes.map(n => n.id);
    
    // 构建邻接集合
    const adjacencySet: Record<string, Set<string>> = {};
    nodeIds.forEach(id => {
      adjacencySet[id] = new Set();
    });
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      
      if (adjacencySet[sourceId] && adjacencySet[targetId]) {
        adjacencySet[sourceId].add(targetId);
        adjacencySet[targetId].add(sourceId);
      }
    });
    
    // 计算每个节点的聚类系数
    nodeIds.forEach(nodeId => {
      const neighbors = Array.from(adjacencySet[nodeId]);
      const numNeighbors = neighbors.length;
      
      if (numNeighbors < 2) {
        coefficient[nodeId] = 0;
        return;
      }
      
      // 计算邻居之间实际的连接数
      let connectedPairs = 0;
      for (let i = 0; i < numNeighbors; i++) {
        for (let j = i + 1; j < numNeighbors; j++) {
          if (adjacencySet[neighbors[i]].has(neighbors[j])) {
            connectedPairs++;
          }
        }
      }
      
      // 聚类系数 = 实际连接数 / 最大可能连接数
      const maxPossibleConnections = (numNeighbors * (numNeighbors - 1)) / 2;
      coefficient[nodeId] = maxPossibleConnections > 0 ? connectedPairs / maxPossibleConnections : 0;
    });
    
    return coefficient;
  }

  /**
   * 简化的介数中心性计算（使用近似算法）
   * 介数中心性衡量节点在所有最短路径中出现的频率
   */
  calculateBetweennessCentrality(nodes: GraphNode[], links: GraphLink[]): Record<string, number> {
    const centrality: Record<string, number> = {};
    const nodeIds = nodes.map(n => n.id);
    
    // 初始化
    nodeIds.forEach(id => {
      centrality[id] = 0;
    });
    
    // 对每一对节点计算最短路径，并统计经过的节点
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const paths = this.findAllShortestPaths(nodeIds[i], nodeIds[j], nodes, links);
        
        paths.forEach(path => {
          // 对路径中间的每个节点增加中介度
          for (let k = 1; k < path.length - 1; k++) {
            const nodeId = path[k];
            centrality[nodeId] += 1 / paths.length; // 按路径数量平均分配
          }
        });
      }
    }
    
    // 归一化
    const maxPossible = (nodeIds.length - 1) * (nodeIds.length - 2) / 2;
    if (maxPossible > 0) {
      nodeIds.forEach(id => {
        centrality[id] = centrality[id] / maxPossible;
      });
    }
    
    return centrality;
  }

  /**
   * 查找所有最短路径
   */
  private findAllShortestPaths(start: string, end: string, nodes: GraphNode[], links: GraphLink[]): string[][] {
    const paths: string[][] = [];
    const queue: Array<{ node: string; path: string[] }> = [{ node: start, path: [start] }];
    const visited: Record<string, boolean> = { [start]: true };
    const shortestDistances: Record<string, number> = { [start]: 0 };
    const predecessors: Record<string, string[]> = { [start]: [] };
    
    while (queue.length > 0) {
      const { node, path } = queue.shift()!;
      
      if (node === end) {
        continue; // 继续寻找其他可能的最短路径
      }
      
      const nodeLinks = links.filter(link => 
        (typeof link.source === 'string' ? link.source : (link.source as any).id) === node ||
        (typeof link.target === 'string' ? link.target : (link.target as any).id) === node
      );
      
      for (const link of nodeLinks) {
        const neighbor = (typeof link.source === 'string' ? link.source : (link.source as any).id) === node
          ? (typeof link.target === 'string' ? link.target : (link.target as any).id)
          : (typeof link.source === 'string' ? link.source : (link.source as any).id);
        
        const distance = path.length;
        
        if (!(neighbor in shortestDistances) || shortestDistances[neighbor] >= distance + 1) {
          if (shortestDistances[neighbor] === undefined || shortestDistances[neighbor] > distance + 1) {
            shortestDistances[neighbor] = distance + 1;
            predecessors[neighbor] = [node];
          } else if (shortestDistances[neighbor] === distance + 1) {
            predecessors[neighbor].push(node);
          }
          
          if (!visited[neighbor]) {
            visited[neighbor] = true;
            queue.push({ node: neighbor, path: [...path, neighbor] });
          }
        }
      }
    }
    
    // 重构路径
    if (end in predecessors) {
      paths.push(...this.reconstructPaths(end, start, predecessors));
    }
    
    return paths;
  }

  /**
   * 重构路径
   */
  private reconstructPaths(target: string, source: string, predecessors: Record<string, string[]>): string[][] {
    const paths: string[][] = [];
    const stack: Array<{ node: string; path: string[] }> = [{ node: target, path: [target] }];
    
    while (stack.length > 0) {
      const { node, path } = stack.pop()!;
      
      if (node === source) {
        paths.push([...path].reverse());
        continue;
      }
      
      for (const pred of predecessors[node] || []) {
        stack.push({ node: pred, path: [...path, pred] });
      }
    }
    
    return paths;
  }

  /**
   * 社区发现（使用简单的标签传播算法）
   */
  findCommunities(nodes: GraphNode[], links: GraphLink[]): Array<{ id: string; nodes: string[]; size: number; density: number }> {
    const nodeIds = nodes.map(n => n.id);
    const communities: Record<string, string> = {}; // nodeId -> communityId
    
    // 初始化：每个节点属于自己的社区
    nodeIds.forEach((id, idx) => {
      communities[id] = `community_${idx}`;
    });
    
    // 构建邻接表
    const adjacencyList: Record<string, string[]> = {};
    nodeIds.forEach(id => {
      adjacencyList[id] = [];
    });
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      
      if (adjacencyList[sourceId] && adjacencyList[targetId]) {
        adjacencyList[sourceId].push(targetId);
        adjacencyList[targetId].push(sourceId);
      }
    });
    
    // 执行几轮标签传播
    let currentCommunities = { ...communities };
    for (let round = 0; round < 5; round++) {
      const newCommunities: Record<string, string> = { ...currentCommunities };
      
      for (const nodeId of nodeIds) {
        // 统计邻居的社区标签
        const neighborCommunities: Record<string, number> = {};
        const neighbors = adjacencyList[nodeId] || [];
        
        for (const neighborId of neighbors) {
          const neighborCommunity = currentCommunities[neighborId];
          neighborCommunities[neighborCommunity] = (neighborCommunities[neighborCommunity] || 0) + 1;
        }
        
        // 选择最常见的社区标签
        let maxCount = 0;
        let dominantCommunity = currentCommunities[nodeId]; // 默认保持当前社区
        
        Object.entries(neighborCommunities).forEach(([community, count]) => {
          if (count > maxCount || (count === maxCount && community < dominantCommunity)) {
            maxCount = count;
            dominantCommunity = community;
          }
        });
        
        newCommunities[nodeId] = dominantCommunity;
      }
      
      currentCommunities = newCommunities;
    }
    const finalCommunities = currentCommunities;
    
    // 整合社区
    const communityMap: Record<string, string[]> = {};
    Object.entries(finalCommunities).forEach(([nodeId, communityId]) => {
      if (!communityMap[communityId]) {
        communityMap[communityId] = [];
      }
      communityMap[communityId].push(nodeId);
    });
    
    // 过滤掉只有1个节点的小社区
    const filteredCommunities = Object.entries(communityMap)
      .filter(([_, nodes]) => nodes.length > 1)
      .map(([id, nodes], idx) => {
        // 计算社区密度（内部连接数 / 最大可能连接数）
        const internalLinks = links.filter(link => {
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
          
          return nodes.includes(sourceId) && nodes.includes(targetId);
        }).length;
        
        const maxPossibleLinks = (nodes.length * (nodes.length - 1)) / 2;
        const density = maxPossibleLinks > 0 ? internalLinks / maxPossibleLinks : 0;
        
        return {
          id: `cluster_${idx}`,
          nodes,
          size: nodes.length,
          density
        };
      });
    
    return filteredCommunities;
  }

  /**
   * 执行完整的图分析
   */
  analyzeGraph(nodes: GraphNode[], links: GraphLink[]): GraphAnalysisResult {
    const degreeCentrality = this.calculateDegreeCentrality(nodes, links);
    const closenessCentrality = this.calculateClosenessCentrality(nodes, links);
    const clusteringCoefficient = this.calculateClusteringCoefficient(nodes, links);
    const betweennessCentrality = this.calculateBetweennessCentrality(nodes, links);
    const communities = this.findCommunities(nodes, links);
    
    // 生成关键洞察
    const keyInsights: Array<{ type: string; nodeId: string; value: number; description: string }> = [];
    
    // 找出度中心性最高的节点（枢纽节点）
    const highestDegree = Object.entries(degreeCentrality)
      .sort((a, b) => b[1] - a[1])[0];
    if (highestDegree) {
      const node = nodes.find(n => n.id === highestDegree[0]);
      keyInsights.push({
        type: 'hub_node',
        nodeId: highestDegree[0],
        value: highestDegree[1],
        description: `枢纽节点: "${node?.name || highestDegree[0]}" 是连接度最高的节点`
      });
    }
    
    // 找出介数中心性最高的节点（桥梁节点）
    const highestBetweenness = Object.entries(betweennessCentrality)
      .sort((a, b) => b[1] - a[1])[0];
    if (highestBetweenness) {
      const node = nodes.find(n => n.id === highestBetweenness[0]);
      keyInsights.push({
        type: 'bridge_node',
        nodeId: highestBetweenness[0],
        value: highestBetweenness[1],
        description: `桥梁节点: "${node?.name || highestBetweenness[0]}" 连接不同社区的关键节点`
      });
    }
    
    // 找出聚类系数高的节点（集群中心）
    const highestClustering = Object.entries(clusteringCoefficient)
      .sort((a, b) => b[1] - a[1])[0];
    if (highestClustering) {
      const node = nodes.find(n => n.id === highestClustering[0]);
      keyInsights.push({
        type: 'cluster_center',
        nodeId: highestClustering[0],
        value: highestClustering[1],
        description: `集群中心: "${node?.name || highestClustering[0]}" 位于紧密连接的群体中心`
      });
    }
    
    // 识别大的社区
    communities.forEach(community => {
      if (community.size > 3) {
        keyInsights.push({
          type: 'community',
          nodeId: community.id,
          value: community.size,
          description: `社区: 发现包含 ${community.size} 个节点的紧密社区`
        });
      }
    });
    
    return {
      betweennessCentrality,
      degreeCentrality,
      clusteringCoefficient,
      communities,
      keyInsights
    };
  }

  /**
   * 根据分析结果识别知识盲区
   */
  identifyKnowledgeBlindSpots(analysisResult: GraphAnalysisResult, nodes: GraphNode[]): Array<{
    nodeId: string;
    type: 'isolated' | 'bridge_gap' | 'community_gap';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }> {
    const blindSpots: Array<{
      nodeId: string;
      type: 'isolated' | 'bridge_gap' | 'community_gap';
      severity: 'low' | 'medium' | 'high';
      description: string;
    }> = [];
    
    // 检测孤立的用户节点（可能表示未覆盖的知识点）
    nodes.forEach(node => {
      if (node.source === 'user' && analysisResult.degreeCentrality[node.id] === 0) {
        blindSpots.push({
          nodeId: node.id,
          type: 'isolated',
          severity: 'high',
          description: `孤立节点: "${node.name}" 未与任何公司知识连接，可能是知识盲区`
        });
      }
    });
    
    // 检测高介数但低连接的节点（可能是知识断点）
    Object.entries(analysisResult.betweennessCentrality).forEach(([nodeId, centrality]) => {
      if (centrality > 0.1 && analysisResult.degreeCentrality[nodeId] < 0.1) {
        const node = nodes.find(n => n.id === nodeId);
        if (node && node.source === 'user') {
          blindSpots.push({
            nodeId,
            type: 'bridge_gap',
            severity: 'medium',
            description: `桥梁缺口: "${node.name}" 位于关键路径上但连接较少，可能是知识断点`
          });
        }
      }
    });
    
    // 检测社区间的连接缺失
    analysisResult.communities.forEach(community => {
      if (community.density < 0.3) { // 低密度社区可能表示知识组织不佳
        blindSpots.push({
          nodeId: community.id,
          type: 'community_gap',
          severity: 'medium',
          description: `社区缺口: 知识社区内部连接稀疏（密度 ${community.density.toFixed(2)}），组织结构待优化`
        });
      }
    });
    
    return blindSpots;
  }
}

export const graphAnalysisService = new GraphAnalysisService();