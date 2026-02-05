import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { userKnowledgeGraph } from '../services/userKnowledgeGraph';
import { companyKnowledgeGraph } from '../services/companyKnowledgeGraph';
import { projectService } from '../services/projectService';
import { timeSeriesService } from '../services/timeSeriesService';
import { graphAnalysisService } from '../services/graphAnalysisService';
import {
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Filter,
  Maximize2,
  Minimize2,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Layers,
  Eye,
  Flame,
  Activity,
  Zap,
  Network
} from 'lucide-react';

interface GraphNode {
  id: string;
  name: string;
  category: string;
  value: number;
  size: number;
  color: string;
  source: 'user' | 'company' | 'both';
  details?: any;
}

interface GraphLink {
  source: string;
  target: string;
  weight: number;
}

interface OverlapAnalysis {
  totalNodes: number;
  userOnly: number;
  companyOnly: number;
  overlap: number;
  coverageRate: number;
}

interface CategoryFilter {
  enabled: boolean;
  categories: string[];
}

const demoData = {
  nodes: [
    { id: "C1", name: "产品安装指南", category: "使用帮助", value: 85, size: 25, color: "#00d2ff", source: "company", details: { description: "官方安装教程文档" } },
    { id: "C2", name: "保修政策说明", category: "售后服务", value: 60, size: 20, color: "#00d2ff", source: "company", details: { description: "保修条款与流程" } },
    { id: "C3", name: "API接口文档", category: "技术文档", value: 70, size: 22, color: "#00d2ff", source: "company", details: { description: "开发者接口文档" } },
    { id: "C4", name: "故障排查手册", category: "技术支持", value: 55, size: 18, color: "#00d2ff", source: "company", details: { description: "常见问题解决方案" } },
    { id: "C5", name: "功能特性介绍", category: "产品介绍", value: 45, size: 16, color: "#00d2ff", source: "company", details: { description: "产品功能说明" } },
    { id: "C6", name: "快速入门指南", category: "使用帮助", value: 50, size: 17, color: "#00d2ff", source: "company", details: { description: "新手入门教程" } },
    { id: "U1", name: "怎么安装？", category: "使用帮助", value: 156, size: 28, color: "#ffdb00", source: "user", details: { frequency: 156, sentiment: "neutral" } },
    { id: "U2", name: "快递多久到？", category: "物流配送", value: 89, size: 22, color: "#ffdb00", source: "user", details: { frequency: 89, sentiment: "neutral" } },
    { id: "U3", name: "接口调不通", category: "技术文档", value: 203, size: 32, color: "#ffdb00", source: "user", details: { frequency: 203, sentiment: "negative" } },
    { id: "U4", name: "退款多久到账？", category: "售后服务", value: 134, size: 26, color: "#ffdb00", source: "user", details: { frequency: 134, sentiment: "anxious" } },
    { id: "U5", name: "产品有质保吗？", category: "售后服务", value: 98, size: 23, color: "#ffdb00", source: "user", details: { frequency: 98, sentiment: "neutral" } },
    { id: "U6", name: "功能怎么用？", category: "使用帮助", value: 245, size: 35, color: "#ffdb00", source: "user", details: { frequency: 245, sentiment: "neutral" } },
    { id: "U7", name: "系统报错502", category: "技术支持", value: 178, size: 29, color: "#ffdb00", source: "user", details: { frequency: 178, sentiment: "negative" } },
    { id: "U8", name: "怎么绑定账号？", category: "账户相关", value: 67, size: 19, color: "#ffdb00", source: "user", details: { frequency: 67, sentiment: "neutral" } },
    { id: "O1", name: "退换货流程", category: "售后服务", value: 90, size: 24, color: "#00ff88", source: "both", details: { coverage: 90 } },
    { id: "O2", name: "安装视频教程", category: "使用帮助", value: 75, size: 21, color: "#00ff88", source: "both", details: { coverage: 75 } },
    { id: "O3", name: "账号注册登录", category: "账户相关", value: 55, size: 17, color: "#00ff88", source: "both", details: { coverage: 55 } },
    { id: "O4", name: "常见问题FAQ", category: "技术支持", value: 80, size: 22, color: "#00ff88", source: "both", details: { coverage: 80 } },
    { id: "O5", name: "产品规格参数", category: "产品介绍", value: 65, size: 19, color: "#00ff88", source: "both", details: { coverage: 65 } },
  ],
  links: [
    { source: "C1", target: "U1", weight: 3 },
    { source: "C1", target: "O2", weight: 4 },
    { source: "C2", target: "U4", weight: 2 },
    { source: "C2", target: "O1", weight: 5 },
    { source: "C3", target: "U3", weight: 4 },
    { source: "C4", target: "U7", weight: 3 },
    { source: "C4", target: "O4", weight: 4 },
    { source: "C5", target: "O5", weight: 3 },
    { source: "C6", target: "U6", weight: 2 },
    { source: "C6", target: "O2", weight: 4 },
    { source: "U1", target: "O2", weight: 3 },
    { source: "U3", target: "O4", weight: 2 },
    { source: "U4", target: "O1", weight: 4 },
    { source: "U6", target: "C1", weight: 2 },
    { source: "U7", target: "C4", weight: 3 },
    { source: "U8", target: "O3", weight: 5 },
    { source: "O1", target: "O4", weight: 2 },
    { source: "O2", target: "O5", weight: 1 },
    { source: "O3", target: "O4", weight: 2 },
  ],
  overlapAnalysis: {
    totalNodes: 19,
    userOnly: 8,
    companyOnly: 6,
    overlap: 5,
    coverageRate: 38
  }
};

const DualGraphComparison: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    links: GraphLink[];
    overlapAnalysis: OverlapAnalysis;
  } | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [companyStats, setCompanyStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter>({
    enabled: false,
    categories: []
  });
  const [dataMode, setDataMode] = useState<'demo' | 'real'>('demo');
  const [hasRealData, setHasRealData] = useState(false);
  const [threshold, setThreshold] = useState<number>(0.8);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [showTimeline, setShowTimeline] = useState(false);
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);

  const loadDemoData = useCallback(() => {
    setIsLoading(true);
    setDataMode('demo');

    setTimeout(() => {
      const allCategories = Array.from(new Set(demoData.nodes.map(n => n.category)));

      setGraphData({
        nodes: demoData.nodes,
        links: demoData.links,
        overlapAnalysis: demoData.overlapAnalysis
      });

      setCategoryFilters({
        enabled: false,
        categories: allCategories
      });

      setUserStats({
        totalQuestions: 8,
        totalKeywords: 24,
        avgSatisfaction: 3.8,
        negativeRate: 25,
        topKeywords: [
          { keyword: "安装", count: 156 },
          { keyword: "接口", count: 203 },
          { keyword: "功能", count: 245 },
          { keyword: "报错", count: 178 },
          { keyword: "退款", count: 134 }
        ]
      });

      setCompanyStats({
        productCount: 6,
        knowledgeCount: 18,
        avgCoverage: 38,
        topCategories: [
          { category: "使用帮助", count: 3 },
          { category: "售后服务", count: 2 },
          { category: "技术文档", count: 3 }
        ]
      });

      setIsLoading(false);
    }, 500);
  }, []);

  const loadRealData = useCallback(async () => {
    setIsLoading(true);
    try {
      setDataMode('real');

      await projectService.getAllProjects();
      companyKnowledgeGraph.buildFromProducts(await projectService.getAllProjects());

      const userData = userKnowledgeGraph.getEChartsData();
      const merged = await companyKnowledgeGraph.mergeWithUserGraph(userData, threshold); // 传递阈值参数

      const nodes: GraphNode[] = merged.nodes.map(n => ({
        ...n,
        size: n.source === 'user' ? 8 + Math.log2(n.value + 1) * 4 :
               n.source === 'both' ? 12 + n.value * 0.2 :
               8 + Math.log2(n.value + 1) * 3
      }));

      const links: GraphLink[] = merged.links.map(l => ({
        source: (l as any).source.id || l.source,
        target: (l as any).target.id || l.target,
        weight: l.weight
      }));

      const allCategories = Array.from(new Set(nodes.map(n => n.category)));
      const hasData = nodes.length > 0 || links.length > 0;
      setHasRealData(hasData);

      if (!hasData) {
        loadDemoData();
        return;
      }

      setGraphData({
        nodes,
        links,
        overlapAnalysis: merged.overlapAnalysis
      });

      setCategoryFilters(prev => ({
        ...prev,
        categories: allCategories
      }));

      setUserStats(userKnowledgeGraph.getStats());
      setCompanyStats(companyKnowledgeGraph.getStats());
    } catch (error) {
      console.error('Failed to load real data:', error);
      loadDemoData();
    } finally {
      setIsLoading(false);
    }
  }, [loadDemoData, threshold]); // 添加阈值到依赖数组

  const refreshData = useCallback(() => {
    setSelectedNode(null);
    if (dataMode === 'real' || hasRealData) {
      loadRealData();
    } else {
      loadDemoData();
    }
  }, [dataMode, hasRealData, loadRealData, loadDemoData, threshold]);

  useEffect(() => {
    loadDemoData();
  }, [loadDemoData]);

  useEffect(() => {
    if (!graphData || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 700;
    const svg = d3.select(svgRef.current);

    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .style('background', 'radial-gradient(ellipse at center, #0a1628 0%, #050a0f 100%)');

    const defs = svg.append('defs');

    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const colors = {
      company: '#00d2ff',
      user: '#ffdb00',
      overlap: '#00ff88'
    };

    let filteredNodes = graphData.nodes;
    let filteredLinks = graphData.links;

    if (categoryFilters.enabled && selectedCategories.length > 0) {
      filteredNodes = graphData.nodes.filter(n => selectedCategories.includes(n.category));
      const filteredIds = new Set(filteredNodes.map(n => n.id));
      filteredLinks = graphData.links.filter(
        l => filteredIds.has(typeof l.source === 'string' ? l.source : (l.source as any).id) &&
             filteredIds.has(typeof l.target === 'string' ? l.target : (l.target as any).id)
      );
    }

    const nodesWithId = filteredNodes.map(n => ({ ...n }));
    const linksWithId = filteredLinks.map(l => ({
      ...l,
      source: typeof l.source === 'string' ? l.source : (l.source as any).id,
      target: typeof l.target === 'string' ? l.target : (l.target as any).id
    }));

    const simulation = d3.forceSimulation(nodesWithId as any)
      .force('link', d3.forceLink(linksWithId).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 15))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    simulationRef.current = simulation as any;

    const linkGroup = svg.append('g').attr('class', 'links');
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    const link = linkGroup.selectAll('line')
      .data(linksWithId)
      .join('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.08)')
      .attr('stroke-width', (d: any) => Math.max(1, d.weight * 1.5))
      .attr('stroke-linecap', 'round');

    const node = nodeGroup.selectAll('.node')
      .data(nodesWithId)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(drag(simulation) as any)
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        setSelectedNode(d);
        highlightNeighbors(d);
      });

    node.append('circle')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any) => colors[d.source])
      .style('filter', 'url(#glow)')
      .style('transition', 'all 0.3s ease');

    if (showLabels) {
      node.append('text')
        .text((d: any) => d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name)
        .attr('x', (d: any) => d.size + 8)
        .attr('y', 4)
        .attr('fill', '#ffffff')
        .style('font-size', '11px')
        .style('pointer-events', 'none')
        .style('text-shadow', '0 0 8px rgba(0,0,0,0.9)')
        .style('opacity', 0.9);
    }

    node.append('title')
      .text((d: any) => `${d.name}\n类型: ${d.category}\n来源: ${d.source === 'both' ? '已覆盖' : d.source === 'company' ? '公司知识库' : '用户问答'}\n热度: ${d.value.toFixed(0)}`);

    function highlightNeighbors(d: any) {
      const neighbors = new Set<string>();
      linksWithId.forEach((l: any) => {
        if (l.source === d.id) neighbors.add(l.target);
        if (l.target === d.id) neighbors.add(l.source);
      });

      node.style('opacity', (n: any) => n.id === d.id || neighbors.has(n.id) ? 1 : 0.15);
      link.style('opacity', (l: any) => l.source === d.id || l.target === d.id ? 1 : 0.05)
          .attr('stroke', (l: any) => {
            if (l.source === d.id || l.target === d.id) {
              const nodeColor = colors[(d as any).source];
              return nodeColor;
            }
            return 'rgba(255, 255, 255, 0.08)';
          })
          .attr('stroke-width', (l: any) => {
            if (l.source === d.id || l.target === d.id) {
              return Math.max(2, l.weight * 2);
            }
            return Math.max(1, l.weight);
          });
    }

    svg.on('click', () => {
      setSelectedNode(null);
      node.style('opacity', 1);
      link.style('opacity', 1)
          .attr('stroke', 'rgba(255, 255, 255, 0.08)')
          .attr('stroke-width', (d: any) => Math.max(1, d.weight * 1.5));
    });

    function drag(simulation: any) {
      return d3.drag()
        .on('start', (event: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on('drag', (event: any) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on('end', (event: any) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        });
    }

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        nodeGroup.attr('transform', event.transform);
        linkGroup.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    return () => {
      simulation.stop();
    };
  }, [graphData, showLabels, categoryFilters, selectedCategories]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!svgRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    const scale = direction === 'in' ? 1.3 : 0.7;
    svg.transition().duration(300).call(
      (d3.zoom() as any).scaleBy,
      scale
    );
  };

  const handleReset = () => {
    if (!svgRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      (d3.zoom() as any).transform,
      d3.zoomIdentity
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">加载知识图谱数据...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">知识图谱分析</h2>
          <p className="text-sm text-gray-500 mt-1">双色交织力导向网络图 · 节点越大热度越高</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={loadDemoData}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dataMode === 'demo' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 演示数据
            </button>
            <button
              onClick={loadRealData}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dataMode === 'real' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📈 实际数据
            </button>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">总节点</p>
                <p className="text-xl font-bold text-gray-800">{graphData?.overlapAnalysis.totalNodes || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">用户独有</p>
                <p className="text-xl font-bold text-gray-800">{graphData?.overlapAnalysis.userOnly || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">重叠覆盖</p>
                <p className="text-xl font-bold text-gray-800">{graphData?.overlapAnalysis.overlap || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">覆盖率</p>
                <p className="text-xl font-bold text-gray-800">{graphData?.overlapAnalysis.coverageRate || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              图例说明
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ background: '#00d2ff', boxShadow: '0 0 8px #00d2ff' }} />
                <span className="text-sm text-gray-600">公司知识库</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ background: '#ffdb00', boxShadow: '0 0 8px #ffdb00' }} />
                <span className="text-sm text-gray-600">用户问答 (热度)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
                <span className="text-sm text-gray-600">重叠覆盖</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">💡 提示: 黄色节点越大表示用户问得越多</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              数据统计
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">用户问题</span>
                <span className="font-medium">{userStats?.totalQuestions || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">公司产品</span>
                <span className="font-medium">{companyStats?.productCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">知识文档</span>
                <span className="font-medium">{companyStats?.knowledgeCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">平均覆盖率</span>
                <span className="font-medium text-green-600">{companyStats?.avgCoverage || 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              相似度阈值
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">当前: {(threshold * 100).toFixed(0)}%</span>
                <span className="text-gray-600">{threshold < 0.7 ? '宽松' : threshold < 0.9 ? '适中' : '严格'}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.99"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.1 (低)</span>
                <span>0.99 (高)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Maximize2 className="w-4 h-4 mr-2" />
              显示选项
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">显示标签</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTimeline}
                  onChange={(e) => setShowTimeline(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">显示时间轴</span>
              </label>
            </div>
          </div>

          {showTimeline && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                覆盖率趋势
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(['week', 'month', 'quarter'] as const).map(range => (
                    <button
                      key={range}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        timeRange === range 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => setTimeRange(range)}
                    >
                      {range === 'week' && '本周'}
                      {range === 'month' && '本月'}
                      {range === 'quarter' && '本季度'}
                    </button>
                  ))}
                </div>
                <div className="h-24 bg-gray-50 rounded-lg p-2">
                  {/* 趋势图占位符 */}
                  <div className="w-full h-full flex items-end gap-1">
                    {timeSeriesService.getCoverageTrend(timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90)
                      .slice(-10) // 只显示最近10个数据点
                      .map((point, idx, arr) => {
                        const maxCoverage = Math.max(...arr.map(p => p.coverage), 100);
                        const heightPercentage = (point.coverage / maxCoverage) * 100;
                        return (
                          <div 
                            key={idx}
                            className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                            style={{ height: `${heightPercentage}%` }}
                            title={`${point.coverage}% - ${point.date.toLocaleDateString()}`}
                          />
                        );
                      })
                    }
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {timeSeriesService.getStats().totalRecords > 0 ? (
                    <>
                      平均覆盖率: <span className="font-medium text-blue-600">{timeSeriesService.getStats().avgCoverage}%</span>
                      <br />
                      最新: <span className="font-medium text-green-600">{timeSeriesService.getLatestRecord()?.coverageRate}%</span>
                    </>
                  ) : '暂无历史数据'}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Network className="w-4 h-4 mr-2" />
              图分析
            </h3>
            <div className="space-y-3">
              <button
                className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                onClick={() => {
                  if (graphData) {
                    const analysis = graphAnalysisService.analyzeGraph(graphData.nodes, graphData.links);
                    console.log('Graph Analysis Results:', analysis);
                    
                    // 识别知识盲区
                    const blindSpots = graphAnalysisService.identifyKnowledgeBlindSpots(analysis, graphData.nodes);
                    console.log('Knowledge Blind Spots:', blindSpots);
                    
                    alert(`分析完成！发现 ${blindSpots.length} 个潜在知识盲区。详情请查看控制台。`);
                  }
                }}
              >
                执行图分析
              </button>
              <div className="text-xs text-gray-500">
                识别枢纽节点、桥梁节点和知识盲区
              </div>
            </div>
          </div>

          {categoryFilters.categories.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                分类筛选
              </h3>
              <div className="space-y-2">
                {categoryFilters.categories.slice(0, 8).map((cat, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600 truncate">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-9">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoom('in')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="放大"
                >
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleZoom('out')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="缩小"
                >
                  <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="重置视图"
                >
                  <Minimize2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <span className="text-xs text-gray-500">
                💡 提示: 拖拽节点可移动，点击节点显示关联
              </span>
            </div>
            <div
              ref={containerRef}
              style={{
                height: 700,
                background: 'radial-gradient(ellipse at center, #0a1628 0%, #050a0f 100%)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <svg
                ref={svgRef}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block'
                }}
              />

              {selectedNode && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    background: 'rgba(0, 0, 0, 0.85)',
                    padding: '16px',
                    border: `1px solid ${selectedNode.source === 'both' ? '#00ff88' : selectedNode.source === 'company' ? '#00d2ff' : '#ffdb00'}`,
                    borderRadius: '8px',
                    color: '#fff',
                    minWidth: '200px',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>节点详情</h4>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>名称: </span>
                    {selectedNode.name}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>类型: </span>
                    {selectedNode.category}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>来源: </span>
                    <span style={{
                      color: selectedNode.source === 'both' ? '#00ff88' :
                             selectedNode.source === 'company' ? '#00d2ff' : '#ffdb00'
                    }}>
                      {selectedNode.source === 'both' ? '✅ 已覆盖' :
                       selectedNode.source === 'company' ? '🏢 公司知识库' : '👤 用户问答'}
                    </span>
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>热度: </span>
                    {selectedNode.value.toFixed(0)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {graphData?.overlapAnalysis.coverageRate !== undefined && graphData.overlapAnalysis.coverageRate < 50 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800">覆盖率较低</h4>
            <p className="text-sm text-amber-700 mt-1">
              当前知识覆盖率为 {graphData.overlapAnalysis.coverageRate}%，建议优先补充以下内容：
            </p>
            <ul className="text-sm text-amber-700 mt-2 list-disc list-inside">
              <li>关注图中<strong style={{ color: '#ffdb00' }}>大黄色节点</strong> - 这些是用户高频问题但尚未覆盖</li>
              <li>建立问题与公司知识的关联映射</li>
              <li>增加与用户痛点相关的知识文档</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DualGraphComparison;
