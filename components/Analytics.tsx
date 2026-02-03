
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Users, Clock, ThumbsUp, Download, FileText, Database, Link, Copy, RefreshCw, ArrowUp, ArrowDown, Minus } from 'lucide-react';
// import * as AnalyticsApi from '../services/analyticsApiService';
import { projectService } from '../services/projectService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// 获取当前月份的名称
const getCurrentMonthName = (index: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[index % 12];
};

// 生成最近6个月的月份数据
const generateRecentMonths = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const monthIndex = now.getMonth() - 5 + index;
    return getCurrentMonthName(monthIndex);
  });
};

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState({
    uniqueUsers: 0,
    avgHelpTime: 0,
    csatScore: 0,
    bypassRate: 0,
    handoffRate: 0,
    knowledgeCoverageRate: 0,
    avgDiagnosticSteps: 0,
    totalScans: 0,
    totalMessages: 0,
    serviceTypeData: [],
    issueDistribution: [
      { name: 'Installation', value: 0 },
      { name: 'WIFI Setup', value: 0 },
      { name: 'Hardware', value: 0 },
      { name: 'Others', value: 0 },
    ],
    deviceTypes: [
      { name: 'Mobile', value: 0 },
      { name: 'Desktop', value: 0 },
      { name: 'Tablet', value: 0 }
    ]
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [trends, setTrends] = useState({
    uniqueUsers: 0,
    avgHelpTime: 0,
    csatScore: 0,
    bypassRate: 0
  });

  // 从projectService加载真实分析数据
  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // 获取统计数据 - 优先使用跨设备聚合数据
      let stats;
      try {
        // 暂时直接使用本地projectService数据
        stats = await projectService.getProjectStats();
        console.log('📱 使用本地数据');
      } catch (error) {
        console.log('📱 数据加载失败');
        stats = null;
      }
      
      if (stats) {
        // 计算趋势（与上次数据对比）
        const previousData = analyticsData;
        const newTrends = {
          uniqueUsers: (stats.uniqueUsers || 0) - previousData.uniqueUsers,
          avgHelpTime: (stats.avgHelpTime || 0) - previousData.avgHelpTime,
          csatScore: parseFloat(stats.csatScore || '0') - parseFloat(previousData.csatScore.toString()),
          bypassRate: (stats.bypassRate || stats.handoffRate || 0) - previousData.bypassRate
        };
        
        setTrends(newTrends);
        setAnalyticsData({
          ...stats,
          // 确保所有必需字段都存在
          handoffRate: stats.handoffRate || stats.bypassRate || 0,
          knowledgeCoverageRate: stats.knowledgeCoverageRate || 0,
          avgDiagnosticSteps: stats.avgDiagnosticSteps || 0,
          totalScans: stats.totalScans || 0,
          deviceTypes: stats.deviceTypes || [
            { name: 'Mobile', value: 0 },
            { name: 'Desktop', value: 0 },
            { name: 'Tablet', value: 0 }
          ]
        });
        setLastUpdated(new Date());
        
        // 同步本地数据到服务器（如果有项目ID的话）
        try {
          const projects = await projectService.getAllProjects();
          if (projects.length > 0) {
            const projectId = projects[0].id;
            await AnalyticsApiService.syncToServer(projectId, stats);
            console.log('📤 数据已同步到服务器');
          }
        } catch (syncError) {
          console.log('📤 数据同步失败，继续使用本地数据');
        }
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化数据加载
  useEffect(() => {
    loadAnalyticsData();
    
    // 设置定时刷新（每30秒）
    const interval = setInterval(loadAnalyticsData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // 手动刷新数据
  const refreshData = () => {
    loadAnalyticsData();
  };

  // 清零分析数据
  const resetAnalyticsData = () => {
    // 清空localStorage中的分析数据
    localStorage.removeItem('smartguide_analytics');
    
    // 重新初始化数据
    const initialData = {
      uniqueUsers: 0,
      avgHelpTime: 0,
      csatScore: 0,
      bypassRate: 0,
      handoffRate: 0,
      knowledgeCoverageRate: 0,
      avgDiagnosticSteps: 0,
      totalScans: 0,
      totalMessages: 0,
      serviceTypeData: generateRecentMonths().map(month => ({
        name: month,
        proactive: 0,
        reactive: 0
      })),
      issueDistribution: [
        { name: 'Installation', value: 0 },
        { name: 'WIFI Setup', value: 0 },
        { name: 'Hardware', value: 0 },
        { name: 'Others', value: 0 }
      ],
      deviceTypes: [
        { name: 'Mobile', value: 0 },
        { name: 'Desktop', value: 0 },
        { name: 'Tablet', value: 0 }
      ]
    };
    
    setAnalyticsData(initialData);
    setTrends({ uniqueUsers: 0, avgHelpTime: 0, csatScore: 0, bypassRate: 0 });
    localStorage.setItem('smartguide_analytics', JSON.stringify(initialData));
  };

  // 导出数据为JSON文件
  const exportDataAsJSON = () => {
    try {
      const analyticsData = localStorage.getItem('smartguide_analytics');
      const projectsData = localStorage.getItem('smartguide_projects');
      
      const exportData = {
        analytics: analyticsData ? JSON.parse(analyticsData) : {},
        projects: projectsData ? JSON.parse(projectsData) : [],
        exportedAt: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('JSON数据导出成功！');
    } catch (error) {
      alert('导出失败：' + (error as Error).message);
    }
  };

  // 导出数据为CSV文件
  const exportDataAsCSV = () => {
    try {
      const analyticsData = localStorage.getItem('smartguide_analytics');
      const data = analyticsData ? JSON.parse(analyticsData) : {};
      
      const csvData = [
        ['指标', '数值'],
        ['独立用户数', data.uniqueUsers || 0],
        ['平均帮助时间(秒)', data.avgHelpTime || 0],
        ['CSAT评分', data.csatScore || 0],
        ['转人工率(%)', data.handoffRate || 0]
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('CSV数据导出成功！');
    } catch (error) {
      alert('CSV导出失败：' + (error as Error).message);
    }
  };

  // 导出完整系统数据
  const exportCompleteData = () => {
    try {
      const analyticsData = localStorage.getItem('smartguide_analytics');
      const projectsData = localStorage.getItem('smartguide_projects');
      
      const completeData = {
        analytics: analyticsData ? JSON.parse(analyticsData) : {},
        projects: projectsData ? JSON.parse(projectsData) : [],
        systemInfo: {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`
        }
      };
      
      const dataStr = JSON.stringify(completeData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `complete-system-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('完整系统数据导出成功！');
    } catch (error) {
      alert('完整数据导出失败：' + (error as Error).message);
    }
  };

  // 生成API访问链接
  const generateApiLink = () => {
    const baseUrl = window.location.origin;
    const apiKey = localStorage.getItem('analytics_api_key') || 'demo-key';
    const apiUrl = `${baseUrl}/api/analytics?key=${apiKey}`;
    
    navigator.clipboard.writeText(apiUrl).then(() => {
      alert('API访问链接已复制到剪贴板！\n' + apiUrl);
    }).catch(() => {
      alert('API访问链接：\n' + apiUrl);
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-500">智能售后客服数据分析 - 实时跨设备同步</p>
          {lastUpdated && (
            <p className="text-xs text-slate-400 mt-1">
              最后更新: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? '刷新中...' : '刷新数据'}
          </button>
          <div className="relative group">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2">
              <Download size={16} />
              导出数据
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={exportDataAsJSON}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 border-b border-slate-100"
              >
                <FileText size={16} />
                导出为JSON
              </button>
              <button
                onClick={exportDataAsCSV}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 border-b border-slate-100"
              >
                <FileText size={16} />
                导出为CSV
              </button>
              <button
                onClick={exportCompleteData}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 border-b border-slate-100"
              >
                <Database size={16} />
                完整数据导出
              </button>
              <button
                onClick={generateApiLink}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <Link size={16} />
                生成API链接
              </button>
            </div>
          </div>
          <button
            onClick={resetAnalyticsData}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            清零数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">独立用户数</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.uniqueUsers}</p>
            </div>
            <div className="flex items-center gap-1">
              {trends.uniqueUsers > 0 ? (
                <ArrowUp size={16} className="text-green-500" />
              ) : trends.uniqueUsers < 0 ? (
                <ArrowDown size={16} className="text-red-500" />
              ) : (
                <Minus size={16} className="text-slate-400" />
              )}
              <span className={`text-xs font-medium ${
                trends.uniqueUsers > 0 ? 'text-green-500' : 
                trends.uniqueUsers < 0 ? 'text-red-500' : 'text-slate-400'
              }`}>
                {trends.uniqueUsers !== 0 ? Math.abs(trends.uniqueUsers) : '0'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">平均帮助时间</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.avgHelpTime}s</p>
            </div>
            <div className="flex items-center gap-1">
              {trends.avgHelpTime > 0 ? (
                <ArrowUp size={16} className="text-red-500" />
              ) : trends.avgHelpTime < 0 ? (
                <ArrowDown size={16} className="text-green-500" />
              ) : (
                <Minus size={16} className="text-slate-400" />
              )}
              <span className={`text-xs font-medium ${
                trends.avgHelpTime > 0 ? 'text-red-500' : 
                trends.avgHelpTime < 0 ? 'text-green-500' : 'text-slate-400'
              }`}>
                {trends.avgHelpTime !== 0 ? Math.abs(trends.avgHelpTime) : '0'}s
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">CSAT评分</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.csatScore}/5</p>
            </div>
            <div className="flex items-center gap-1">
              {trends.csatScore > 0 ? (
                <ArrowUp size={16} className="text-green-500" />
              ) : trends.csatScore < 0 ? (
                <ArrowDown size={16} className="text-red-500" />
              ) : (
                <Minus size={16} className="text-slate-400" />
              )}
              <span className={`text-xs font-medium ${
                trends.csatScore > 0 ? 'text-green-500' : 
                trends.csatScore < 0 ? 'text-red-500' : 'text-slate-400'
              }`}>
                {trends.csatScore !== 0 ? Math.abs(trends.csatScore).toFixed(1) : '0'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">转人工率</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.handoffRate || 0}%</p>
            </div>
            <div className="flex items-center gap-1">
              {trends.bypassRate > 0 ? (
                <ArrowUp size={16} className="text-red-500" />
              ) : trends.bypassRate < 0 ? (
                <ArrowDown size={16} className="text-green-500" />
              ) : (
                <Minus size={16} className="text-slate-400" />
              )}
              <span className={`text-xs font-medium ${
                trends.bypassRate > 0 ? 'text-red-500' : 
                trends.bypassRate < 0 ? 'text-green-500' : 'text-slate-400'
              }`}>
                {trends.bypassRate !== 0 ? Math.abs(trends.bypassRate) : '0'}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 新增售后专用指标 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">知识库覆盖率</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.knowledgeCoverageRate || 0}%</p>
          <p className="text-xs text-slate-400 mt-2">AI能够从知识库找到答案的比例</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">平均诊断步骤</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.avgDiagnosticSteps || 0}</p>
          <p className="text-xs text-slate-400 mt-2">从问题到解决方案的平均对话轮次</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">总扫码次数</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.totalScans || 0}</p>
          <p className="text-xs text-slate-400 mt-2">跨设备统计的二维码扫描次数</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8">服务类型分析</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.serviceTypeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="proactive" fill="#3b82f6" radius={[4, 4, 0, 0]} name="自助引导" />
                <Bar dataKey="reactive" fill="#94a3b8" radius={[4, 4, 0, 0]} name="AI聊天" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8">问题分布</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.issueDistribution}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.issueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8">设备类型分布</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.deviceTypes}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.deviceTypes.map((entry, index) => (
                    <Cell key={`device-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">数据分析说明</h3>
        <ul className="list-disc list-inside text-slate-600 space-y-2">
          <li>数据已清零，上线后将按照实际情况统计</li>
          <li>系统会自动记录用户交互数据</li>
          <li>数据存储在本地，确保隐私安全</li>
          <li>点击"清零数据"按钮可以重置所有分析数据</li>
        </ul>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">API导出功能</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">支持的导出格式</h4>
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              <li>JSON格式 - 完整的结构化数据</li>
              <li>CSV格式 - 适合Excel等表格软件</li>
              <li>完整数据导出 - 包含系统配置信息</li>
              <li>API链接生成 - 用于外部系统集成</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">数据包含内容</h4>
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              <li>用户交互统计数据</li>
              <li>服务类型使用情况</li>
              <li>问题分布分析</li>
              <li>项目和知识库数据</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>提示：</strong> 生成的API链接可用于外部系统访问数据，请妥善保管访问密钥。
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
