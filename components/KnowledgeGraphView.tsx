import { useState, useEffect, useRef } from 'react';
import { knowledgeGraph, KnowledgeNode } from '../services/knowledgeGraph';
import { Brain, ZoomIn, ZoomOut, RefreshCw, Trash2, Database, Info } from 'lucide-react';

interface GraphNode {
  id: string;
  name: string;
  group: string;
  x: number;
  y: number;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

const KnowledgeGraphView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({ nodeCount: 0, edgeCount: 0, avgConnections: 0, topTags: [] });

  useEffect(() => {
    loadGraphData();
  }, []);

  // 添加模拟数据
  const addMockData = () => {
    // 清除现有数据
    knowledgeGraph.clear();
    
    // 添加模拟知识节点
    const mockNodes = [
      {
        id: 'mock_1',
        title: '产品安装指南',
        content: '详细的产品安装步骤和注意事项',
        type: 'text',
        tags: ['安装', '指南', '步骤']
      },
      {
        id: 'mock_2',
        title: '常见故障排查',
        content: '产品使用过程中常见故障的解决方法',
        type: 'text',
        tags: ['故障', '排查', '解决']
      },
      {
        id: 'mock_3',
        title: '产品功能介绍',
        content: '产品的主要功能和使用方法',
        type: 'text',
        tags: ['功能', '介绍', '使用']
      },
      {
        id: 'mock_4',
        title: '维护保养建议',
        content: '产品的日常维护和保养方法',
        type: 'text',
        tags: ['维护', '保养', '建议']
      },
      {
        id: 'mock_5',
        title: '安全使用规范',
        content: '产品使用过程中的安全注意事项',
        type: 'text',
        tags: ['安全', '规范', '注意事项']
      },
      {
        id: 'mock_6',
        title: '技术参数说明',
        content: '产品的详细技术参数和规格',
        type: 'text',
        tags: ['技术', '参数', '规格']
      },
      {
        id: 'mock_7',
        title: '用户常见问题',
        content: '用户使用过程中经常遇到的问题及解答',
        type: 'text',
        tags: ['问题', '解答', '用户']
      },
      {
        id: 'mock_8',
        title: '产品升级指南',
        content: '产品固件和软件升级的方法和步骤',
        type: 'text',
        tags: ['升级', '指南', '固件']
      }
    ];

    // 添加节点到知识图谱
    mockNodes.forEach(node => {
      knowledgeGraph.addNode(node);
    });

    // 重新加载数据
    loadGraphData();
  };

  // 清除所有数据
  const clearAllData = () => {
    knowledgeGraph.clear();
    loadGraphData();
    setSelectedNode(null);
  };

  const loadGraphData = () => {
    const graphData = knowledgeGraph.exportGraph();
    const allNodes = knowledgeGraph.getAllNodes();

    // 如果没有数据，使用模拟数据
    if (allNodes.length === 0) {
      addMockData();
      return;
    }

    const graphNodes: GraphNode[] = allNodes.map((node, index) => ({
      id: node.id,
      name: node.title.length > 15 ? node.title.substring(0, 15) + '...' : node.title,
      group: node.type,
      x: 200 + Math.cos((index / allNodes.length) * 2 * Math.PI) * 150,
      y: 200 + Math.sin((index / allNodes.length) * 2 * Math.PI) * 150
    }));

    const graphLinks: GraphLink[] = graphData.links.map(link => ({
      source: link.source,
      target: link.target,
      value: link.value
    }));

    setNodes(graphNodes);
    setLinks(graphLinks);
    setStats(knowledgeGraph.getStats());
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
    ctx.scale(zoom, zoom);

    // 绘制连线
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(139, 92, 246, ${Math.min(link.value * 2, 1)})`;
        ctx.lineWidth = Math.max(link.value * 3, 1);
        ctx.stroke();
      }
    });

    // 绘制节点
    nodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected ? 25 : 18, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? '#8b5cf6' : '#a78bfa';
      ctx.fill();
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 节点标签
      ctx.fillStyle = '#1e293b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + 35);
    });

    ctx.restore();
  };

  useEffect(() => {
    drawGraph();
  }, [nodes, links, selectedNode, zoom, offset]);

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleNodeClick = (node: GraphNode) => {
    const fullNode = knowledgeGraph.getNode(node.id);
    setSelectedNode(fullNode || null);
  };

  return (
    <div className="glass-card p-8 rounded-[3rem]">
      <div className="flex flex-col gap-6">
        {/* 头部区域 */}
        <div className="flex flex-col gap-4">
          {/* 标题和操作按钮 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Brain className="text-purple-500" size={28} />
              <div>
                <h2 className="text-xl font-bold text-slate-800">知识图谱可视化</h2>
                <p className="text-sm text-slate-500">展示知识点的关联关系</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* 数据操作按钮 */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={addMockData}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Database size={16} />
                  <span>添加模拟数据</span>
                </button>
                <button 
                  onClick={clearAllData}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>清零数据</span>
                </button>
              </div>

              {/* 缩放控制 */}
              <div className="flex items-center gap-2">
                <button onClick={handleZoomIn} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200">
                  <ZoomIn size={18} />
                </button>
                <button onClick={handleZoomOut} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200">
                  <ZoomOut size={18} />
                </button>
                <button onClick={handleReset} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="px-3 py-1 bg-purple-100 rounded-full">节点: {stats.nodeCount}</span>
            <span className="px-3 py-1 bg-blue-100 rounded-full">连线: {stats.edgeCount}</span>
            <span className="px-3 py-1 bg-green-100 rounded-full">平均连接: {stats.avgConnections}</span>
          </div>
        </div>

        {/* 图谱说明 */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-800 mb-2">图谱说明</h3>
              <p className="text-sm text-blue-700 mb-3">
                知识图谱展示了知识点之间的关联关系，帮助您快速了解知识体系的结构和连接。
              </p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• <strong>节点</strong>：代表一个个独立的知识点</li>
                <li>• <strong>连线</strong>：表示知识点之间的关联强度</li>
                <li>• <strong>颜色深度</strong>：连线颜色越深表示关联越强</li>
                <li>• <strong>点击节点</strong>：查看知识点详细信息</li>
                <li>• <strong>使用方法</strong>：上线后点击「清零数据」按钮，即可对接实际业务数据</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 图谱画布 */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl border border-slate-200"
          />

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Brain size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">暂无知识数据，请先添加模拟数据</p>
                <button 
                  onClick={addMockData}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  添加模拟数据
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 选中节点详情 */}
        {selectedNode && (
          <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-2">{selectedNode.title}</h3>
            <p className="text-sm text-purple-700 mb-2">
              类型: {selectedNode.type} | 标签: {selectedNode.tags.join(', ')}
            </p>
            <p className="text-sm text-purple-600 line-clamp-2">
              {selectedNode.content}
            </p>
            <div className="mt-2 text-xs text-purple-500">
              关联知识: {selectedNode.relatedIds.length} 个
            </div>
          </div>
        )}

        {/* 标签云 */}
        <div className="mt-4">
          <h3 className="text-sm font-bold text-slate-700 mb-2">热门标签</h3>
          <div className="flex flex-wrap gap-2">
            {(stats.topTags || []).slice(0, 8).map((tag, index) => (
              <span
                key={tag.tag}
                className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs"
                style={{ opacity: 0.6 + (index * 0.08) }}
              >
                {tag.tag} ({tag.count})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphView;
