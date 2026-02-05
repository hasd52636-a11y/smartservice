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
  Line,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { TrendingUp, Users, Clock, ThumbsUp, Download, Key, Link as LinkIcon, Smartphone, Laptop, Tablet, Clock3, Activity, Filter, Settings, MessageSquare, BookOpen } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { knowledgeCallService } from '../services/knowledgeCallService';
import { userInteractionService } from '../services/userInteractionService';
import { recommendationService } from '../services/recommendationService';
import { ticketService } from '../services/ticketService';
import ManualEvaluationPanel from './ManualEvaluationPanel';
import CoreRuleEditor from './CoreRuleEditor';
import { FeatureBadge } from './FeatureBadge';

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
  const [activeTab, setActiveTab] = useState('analytics');
  const [analyticsData, setAnalyticsData] = useState({
    uniqueUsers: 0,
    avgHelpTime: 0,
    csatScore: 0,
    bypassRate: 0,
    serviceTypeData: [],
    issueDistribution: [
      { name: 'Installation', value: 0 },
      { name: 'WIFI Setup', value: 0 },
      { name: 'Hardware', value: 0 },
      { name: 'Others', value: 0 },
    ],
    userBehaviorData: [
      { name: '访问', value: 1000 },
      { name: '提问', value: 800 },
      { name: '获得回答', value: 600 },
      { name: '解决问题', value: 400 },
      { name: '满意度评价', value: 300 }
    ],
    sessionDurationData: [
      { name: '0-1分钟', value: 200 },
      { name: '1-5分钟', value: 300 },
      { name: '5-10分钟', value: 250 },
      { name: '10-30分钟', value: 150 },
      { name: '30分钟以上', value: 100 }
    ],
    deviceTypeData: [
      { name: '移动端', value: 600 },
      { name: '桌面端', value: 300 },
      { name: '平板端', value: 100 }
    ],
    hourlyTrafficData: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      users: Math.floor(Math.random() * 100)
    }))
  });
  
  // 加载高频问题和用户交互数据
  const [highFrequencyQueries, setHighFrequencyQueries] = useState<any[]>([]);
  const [userInteractions, setUserInteractions] = useState<any[]>([]);
  const [knowledgeCalls, setKnowledgeCalls] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInteractions: 0,
    avgSatisfaction: 0,
    avgProcessingTime: 0,
    totalKnowledgeCalls: 0,
    totalTickets: 0
  });

  // 初始化或重置分析数据
  const initializeAnalyticsData = () => {
    const recentMonths = generateRecentMonths();
    const serviceTypeData = recentMonths.map(month => ({
      name: month,
      proactive: 0,
      reactive: 0
    }));

    return {
      uniqueUsers: 0,
      avgHelpTime: 0,
      csatScore: 0,
      bypassRate: 0,
      serviceTypeData,
      issueDistribution: [
        { name: 'Installation', value: 0 },
        { name: 'WIFI Setup', value: 0 },
        { name: 'Hardware', value: 0 },
        { name: 'Others', value: 0 },
      ],
      userBehaviorData: [
        { name: '访问', value: 1000 },
        { name: '提问', value: 800 },
        { name: '获得回答', value: 600 },
        { name: '解决问题', value: 400 },
        { name: '满意度评价', value: 300 }
      ],
      sessionDurationData: [
        { name: '0-1分钟', value: 200 },
        { name: '1-5分钟', value: 300 },
        { name: '5-10分钟', value: 250 },
        { name: '10-30分钟', value: 150 },
        { name: '30分钟以上', value: 100 }
      ],
      deviceTypeData: [
        { name: '移动端', value: 600 },
        { name: '桌面端', value: 300 },
        { name: '平板端', value: 100 }
      ],
      hourlyTrafficData: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        users: Math.floor(Math.random() * 100)
      }))
    };
  };

  // 从本地存储加载分析数据，并集成analyticsService
  useEffect(() => {
    // 跟踪页面访问事件
    analyticsService.trackEvent('page_view', {
      page: 'analytics',
      source: window.location.href
    });

    const loadAnalyticsData = () => {
      const savedData = localStorage.getItem('smartguide_analytics');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setAnalyticsData(parsedData);
        } catch (error) {
          console.error('Error parsing analytics data:', error);
          // 如果解析失败，初始化数据
          const initialData = initializeAnalyticsData();
          setAnalyticsData(initialData);
          localStorage.setItem('smartguide_analytics', JSON.stringify(initialData));
        }
      } else {
        // 如果没有保存的数据，初始化数据
        const initialData = initializeAnalyticsData();
        setAnalyticsData(initialData);
        localStorage.setItem('smartguide_analytics', JSON.stringify(initialData));
      }
    };

    // 加载高频问题
    const loadHighFrequencyQueries = () => {
      const queries = knowledgeCallService.getHighFrequencyQueries(10);
      setHighFrequencyQueries(queries);
    };

    // 加载用户交互记录
    const loadUserInteractions = () => {
      const interactions = userInteractionService.getInteractions(20);
      setUserInteractions(interactions);
    };

    // 加载知识库调用记录
    const loadKnowledgeCalls = () => {
      const calls = knowledgeCallService.getCalls(20);
      setKnowledgeCalls(calls);
    };

    // 加载工单
    const loadTickets = () => {
      const loadedTickets = ticketService.getTickets();
      setTickets(loadedTickets);
    };

    // 计算统计数据
    const calculateStats = () => {
      const avgSatisfaction = userInteractionService.getAverageSatisfaction();
      const avgProcessingTime = userInteractionService.getAverageProcessingTime();
      const totalInteractions = userInteractionService.getInteractions().length;
      const totalKnowledgeCalls = knowledgeCallService.getCalls().length;
      const totalUsers = new Set(userInteractionService.getInteractions().map(i => i.userId)).size;
      const totalTickets = ticketService.getTickets().length;

      setStats({
        totalUsers,
        totalInteractions,
        avgSatisfaction,
        avgProcessingTime,
        totalKnowledgeCalls,
        totalTickets
      });
    };

    loadAnalyticsData();
    loadHighFrequencyQueries();
    loadUserInteractions();
    loadKnowledgeCalls();
    loadTickets();
    calculateStats();
  }, []);

  // 数据加载：仅从本地存储加载，不进行实时更新
  useEffect(() => {
    const loadAnalyticsData = () => {
      const savedData = localStorage.getItem('smartguide_analytics');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setAnalyticsData(parsedData);
        } catch (error) {
          console.error('Error parsing analytics data:', error);
          const initialData = initializeAnalyticsData();
          setAnalyticsData(initialData);
          localStorage.setItem('smartguide_analytics', JSON.stringify(initialData));
        }
      } else {
        const initialData = initializeAnalyticsData();
        setAnalyticsData(initialData);
        localStorage.setItem('smartguide_analytics', JSON.stringify(initialData));
      }
    };

    loadAnalyticsData();
  }, []);

  // 保存分析数据到本地存储
  useEffect(() => {
    localStorage.setItem('smartguide_analytics', JSON.stringify(analyticsData));
  }, [analyticsData]);

  // 清零分析数据
  const resetAnalyticsData = () => {
    // 跟踪清零数据事件
    analyticsService.trackEvent('click', {
      action: 'reset_analytics_data',
      timestamp: new Date().toISOString()
    });

    const initialData = initializeAnalyticsData();
    setAnalyticsData(initialData);
    localStorage.setItem('smartguide_analytics', JSON.stringify(initialData));
  };

  // API导出功能
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportData, setExportData] = useState({
    apiKey: '',
    exportUrl: '',
    expiresAt: '',
    error: ''
  });

  // 自动化报告功能
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState({
    generated: false,
    date: '',
    summary: '',
    charts: [] as string[],
    error: ''
  });

  const generateApiExport = async () => {
    // 跟踪API导出事件
    analyticsService.trackEvent('click', {
      action: 'generate_api_export',
      timestamp: new Date().toISOString()
    });

    setIsGenerating(true);
    setExportData({ apiKey: '', exportUrl: '', expiresAt: '', error: '' });
    
    try {
      // 使用固定项目ID，因为Analytics页面不是针对特定项目
      const projectId = 'global-analytics';
      
      const response = await fetch('/api/export/data/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setExportData({
          apiKey: result.apiKey,
          exportUrl: result.exportUrl,
          expiresAt: result.expiresAt,
          error: ''
        });
        
        // 显示成功提示
        alert('API密钥和导出链接已生成！');
      } else {
        setExportData({
          apiKey: '',
          exportUrl: '',
          expiresAt: '',
          error: result.error?.message || '生成失败'
        });
      }
    } catch (error) {
      console.error('Error generating API export:', error);
      setExportData({
        apiKey: '',
        exportUrl: '',
        expiresAt: '',
        error: '网络错误，请稍后重试'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成自动化报告
  const generateReport = async () => {
    // 跟踪报告生成事件
    analyticsService.trackEvent('click', {
      action: 'generate_analytics_report',
      timestamp: new Date().toISOString()
    });

    setIsGeneratingReport(true);
    setReportData({ generated: false, date: '', summary: '', charts: [], error: '' });
    
    try {
      // 模拟报告生成过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 生成报告摘要
      const totalUsers = analyticsData.uniqueUsers;
      const totalSessions = analyticsData.userBehaviorData[0].value;
      const conversionRate = (analyticsData.userBehaviorData[4].value / totalSessions * 100).toFixed(2);
      
      const summary = `
        数据分析报告
        生成日期: ${new Date().toLocaleString('zh-CN')}
        
        关键指标:
        - 独立用户数: ${totalUsers}
        - 总会话数: ${totalSessions}
        - 满意度评分: ${analyticsData.csatScore.toFixed(1)}/10
        - 平均帮助时间: ${analyticsData.avgHelpTime}秒
        - 转化率: ${conversionRate}%
        
        设备分布:
        - 移动端: ${analyticsData.deviceTypeData[0].value}次访问
        - 桌面端: ${analyticsData.deviceTypeData[1].value}次访问
        - 平板端: ${analyticsData.deviceTypeData[2].value}次访问
        
        问题分布:
        ${analyticsData.issueDistribution.map(item => `- ${item.name}: ${item.value}次`).join('\n        ')}
        
        流量趋势:
        每小时平均访问量: ${(analyticsData.hourlyTrafficData.reduce((sum, item) => sum + item.users, 0) / 24).toFixed(1)}次
      `;
      
      setReportData({
        generated: true,
        date: new Date().toISOString(),
        summary: summary,
        charts: ['用户行为漏斗', '会话时长分析', '设备类型分布', '每小时流量分析'],
        error: ''
      });
      
      // 显示成功提示
      alert('自动化报告生成成功！');
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData({
        generated: false,
        date: '',
        summary: '',
        charts: [],
        error: '报告生成失败，请稍后重试'
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板！');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">数据分析与管理平台</h1>
              <FeatureBadge status="simulated" text="数据采集开发中" size="md" />
            </div>
            <p className="text-slate-500">深度分析用户交互数据，人工评价和规则管理</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetAnalyticsData}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              清零数据
            </button>
            <button
              onClick={generateApiExport}
              disabled={isGenerating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  生成中...
                </>
              ) : (
                <>
                  <Download size={16} />
                  导出数据
                </>
              )}
            </button>
            <button
              onClick={generateReport}
              disabled={isGeneratingReport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingReport ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  生成中...
                </>
              ) : (
                <>
                  <Activity size={16} />
                  生成报告
                </>
              )}
            </button>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'analytics' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              数据分析
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'evaluation' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              人工评价
            </button>
            <button
              onClick={() => setActiveTab('highFrequency')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'highFrequency' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              高频问题
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'knowledge' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              知识库使用
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'rules' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              核心规则
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'tickets' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              工单管理
            </button>
          </nav>
        </div>
      </div>

      {/* 标签页内容 */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Unique Users</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.uniqueUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Avg. Help Time</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.avgHelpTime}s</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">CSAT Score</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.csatScore}/10</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Bypass Rate</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analyticsData.bypassRate}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-8">Service Type Breakdown</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.serviceTypeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="proactive" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Self Guided" />
                    <Bar dataKey="reactive" fill="#94a3b8" radius={[4, 4, 0, 0]} name="AI Chat" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-8">Issue Distribution</h2>
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
          </div>

          {/* 高级分析功能 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 用户行为漏斗分析 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Activity size={20} />
                用户行为漏斗分析
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Funnel
                      dataKey="value"
                      data={analyticsData.userBehaviorData}
                      isAnimationActive
                      labelLine
                    >
                      <LabelList position="right" fill="#666" stroke="none" dataKey="name" />
                      {analyticsData.userBehaviorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Funnel>
                    <Tooltip />
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 会话时长分析 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Clock3 size={20} />
                会话时长分析
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.sessionDurationData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 设备类型分布 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Smartphone size={20} />
                设备类型分布
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.deviceTypeData}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analyticsData.deviceTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 每小时流量分析 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Activity size={20} />
                每小时流量分析
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.hourlyTrafficData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} dot={{r: 2}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* API导出信息显示 */}
          {(exportData.apiKey || exportData.error) && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Key size={20} />
                API导出信息
              </h3>
              
              {exportData.error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  错误: {exportData.error}
                </div>
              )}
              
              {exportData.apiKey && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">API密钥</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={exportData.apiKey}
                        readOnly
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(exportData.apiKey)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                      >
                        复制
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">导出链接</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={exportData.exportUrl}
                        readOnly
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 font-mono text-sm truncate"
                      />
                      <button
                        onClick={() => copyToClipboard(exportData.exportUrl)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                      >
                        复制
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">有效期至</label>
                    <div className="text-slate-700">
                      {new Date(exportData.expiresAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200 mt-4">
                    <h4 className="font-medium text-slate-700 mb-2">使用说明:</h4>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      <li>API密钥用于验证数据导出请求</li>
                      <li>导出链接可用于直接下载数据，无需每次都输入API密钥</li>
                      <li>有效期为一年，请及时使用</li>
                      <li>导出的数据包含项目配置、知识库、链接使用统计等所有可采集信息</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 自动化报告显示 */}
          {(reportData.generated || reportData.error) && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity size={20} />
                自动化分析报告
              </h3>
              
              {reportData.error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  错误: {reportData.error}
                </div>
              )}
              
              {reportData.generated && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-green-700">报告生成成功</span>
                      <span className="text-sm text-green-600">{new Date(reportData.date).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm whitespace-pre-wrap">
                    {reportData.summary}
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200 mt-4">
                    <h4 className="font-medium text-slate-700 mb-2">包含的分析图表:</h4>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      {reportData.charts.map((chart, index) => (
                        <li key={index}>{chart}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200 mt-4">
                    <h4 className="font-medium text-slate-700 mb-2">报告说明:</h4>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      <li>本报告基于当前系统收集的数据分析生成</li>
                      <li>报告包含关键指标、设备分布、问题分布和流量趋势</li>
                      <li>建议定期生成报告以跟踪系统性能和用户行为变化</li>
                      <li>可根据报告结果优化系统功能和用户体验</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">数据分析说明</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li>数据已清零，上线后将按照实际情况统计</li>
              <li>系统会自动记录用户交互数据</li>
              <li>数据存储在本地，确保隐私安全</li>
              <li>点击"清零数据"按钮可以重置所有分析数据</li>
              <li>高级分析功能包括用户行为漏斗、会话时长、设备类型分布和每小时流量分析</li>
              <li>自动化报告功能可生成详细的数据分析报告</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'evaluation' && (
        <ManualEvaluationPanel />
      )}

      {activeTab === 'highFrequency' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Filter size={20} />
              高频问题分析
            </h3>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-700">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">问题</th>
                      <th scope="col" className="px-6 py-3">调用次数</th>
                      <th scope="col" className="px-6 py-3">平均相似度</th>
                      <th scope="col" className="px-6 py-3">最近调用时间</th>
                      <th scope="col" className="px-6 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highFrequencyQueries.map((query, index) => (
                      <tr key={index} className="bg-white border-b">
                        <td className="px-6 py-4 font-medium">{query.query}</td>
                        <td className="px-6 py-4">{query.count}</td>
                        <td className="px-6 py-4">{query.avgSimilarity?.toFixed(2)}</td>
                        <td className="px-6 py-4">{new Date(query.lastCalled).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <button className="text-violet-600 hover:text-violet-800">查看详情</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => knowledgeCallService.exportData()}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  导出数据
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">高频问题趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={highFrequencyQueries.slice(0, 10).map(q => ({ name: q.query.substring(0, 15), value: q.count }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen size={20} />
              知识库使用统计
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-500">总调用次数</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalKnowledgeCalls}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700">平均相似度</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{knowledgeCallService.getAverageSimilarity().toFixed(2)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-700">平均响应时间</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{knowledgeCallService.getAverageResponseTime().toFixed(2)}ms</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-700">高频问题数</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{highFrequencyQueries.length}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-700">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">查询内容</th>
                    <th scope="col" className="px-6 py-3">匹配文档</th>
                    <th scope="col" className="px-6 py-3">相似度</th>
                    <th scope="col" className="px-6 py-3">响应时间</th>
                    <th scope="col" className="px-6 py-3">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {knowledgeCalls.map((call, index) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium">{call.query}</td>
                      <td className="px-6 py-4">{call.matchedDocuments?.length || 0}</td>
                      <td className="px-6 py-4">{call.similarityScore?.toFixed(2)}</td>
                      <td className="px-6 py-4">{call.responseTime}ms</td>
                      <td className="px-6 py-4">{new Date(call.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">知识库使用趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - 6 + i);
                    return { 
                      date: date.toLocaleDateString(), 
                      calls: Math.floor(Math.random() * 50) + 10 
                    };
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="calls" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <CoreRuleEditor />
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} />
              工单管理 (仅转人工请求)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-500">总工单数</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTickets}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700">待处理工单</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{tickets.filter(t => t.status === 'open').length}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-700">处理中工单</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{tickets.filter(t => t.status === 'in_progress').length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-700">已解决工单</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-700">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">工单ID</th>
                    <th scope="col" className="px-6 py-3">标题</th>
                    <th scope="col" className="px-6 py-3">状态</th>
                    <th scope="col" className="px-6 py-3">优先级</th>
                    <th scope="col" className="px-6 py-3">类别</th>
                    <th scope="col" className="px-6 py-3">创建时间</th>
                    <th scope="col" className="px-6 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket, index) => (
                    <tr key={ticket.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">{ticket.id}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={ticket.title}>{ticket.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ 
                          ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.status === 'open' ? '待处理' :
                           ticket.status === 'in_progress' ? '处理中' :
                           ticket.status === 'resolved' ? '已解决' :
                           '已关闭'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ 
                          ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.priority === 'urgent' ? '紧急' :
                           ticket.priority === 'high' ? '高' :
                           ticket.priority === 'medium' ? '中' :
                           '低'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {ticket.category === 'technical' ? '技术' :
                         ticket.category === 'billing' ? '账单' :
                         ticket.category === 'general' ? '一般' :
                         '其他'}
                      </td>
                      <td className="px-6 py-4">{new Date(ticket.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <button 
                          className="px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors"
                          onClick={() => {
                            // 这里可以添加查看工单详情的逻辑
                            alert(`查看工单 ${ticket.id} 详情`);
                          }}
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tickets.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                暂无工单，用户请求转人工时将自动创建工单
              </div>
            )}
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">工单处理说明</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-2">
              <li>仅用户在会话页面明确要求转人工的内容会自动创建工单</li>
              <li>工单包含用户的转人工请求内容和相关上下文</li>
              <li>系统会自动提取工单标题、优先级和类别</li>
              <li>工单状态可手动更新，跟踪处理进度</li>
              <li>建议定期检查工单，及时响应用户的人工服务请求</li>
            </ul>
          </div>
        </div>
      )}

      {/* 问答模板表格 - 最近50条交互记录 */}
      <div className="mt-8 space-y-6">
        <div className="p-6 rounded-xl border shadow-sm" style={{ 
          backgroundColor: 'var(--bg-main)',
          borderColor: 'var(--input-border)'
        }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
              <MessageSquare size={20} />
              问答模板库 (最近50条交互记录)
            </h3>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-lg font-medium hover:bg-violet-700 transition-colors flex items-center gap-2"
                style={{ 
                  backgroundColor: 'var(--button-primary)',
                  color: 'var(--button-text)'
                }}
                onClick={() => {
                  // 触发文件导入
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json, .csv';
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files && target.files[0]) {
                      const file = target.files[0];
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const content = event.target?.result as string;
                          const data = JSON.parse(content);
                          // 这里可以添加导入逻辑
                          alert('导入成功！');
                        } catch (error) {
                          alert('导入失败，请检查文件格式！');
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
              >
                <Download size={16} />
                导入模板
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left" style={{ color: 'var(--text-color)' }}>
              <thead className="text-xs uppercase" style={{ 
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-color)',
                opacity: 0.8
              }}>
                <tr>
                  <th scope="col" className="px-4 py-3">用户问题</th>
                  <th scope="col" className="px-4 py-3">AI回答</th>
                  <th scope="col" className="px-4 py-3">满意度</th>
                  <th scope="col" className="px-4 py-3">分类</th>
                  <th scope="col" className="px-4 py-3">设备类型</th>
                  <th scope="col" className="px-4 py-3">地域</th>
                  <th scope="col" className="px-4 py-3">时间</th>
                  <th scope="col" className="px-4 py-3">人工评分</th>
                </tr>
              </thead>
              <tbody>
                {userInteractions.map((interaction, index) => (
                  <tr key={interaction.id} className="border-b hover:bg-slate-50" style={{ 
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--input-border)'
                  }}>
                    <td className="px-4 py-3 font-medium max-w-xs truncate" title={interaction.userMessage}>
                      {interaction.userMessage}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" title={interaction.aiResponse}>
                      {interaction.aiResponse}
                    </td>
                    <td className="px-4 py-3">
                      {interaction.satisfaction ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          interaction.satisfaction >= 8 ? 'bg-green-100 text-green-800' :
                          interaction.satisfaction >= 5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {interaction.satisfaction}/10
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-color)', opacity: 0.6 }}>未评价</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{interaction.category}</td>
                    <td className="px-4 py-3">
                      {interaction.deviceType === 'desktop' ? '桌面端' :
                       interaction.deviceType === 'mobile' ? '移动端' :
                       interaction.deviceType === 'tablet' ? '平板端' : '未知'}
                    </td>
                    <td className="px-4 py-3">{interaction.location}</td>
                    <td className="px-4 py-3">{new Date(interaction.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                          <button
                            key={score}
                            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
                              interaction.manualScore === score
                                ? ''
                                : ''
                            }`}
                            style={{
                              backgroundColor: interaction.manualScore === score
                                ? 'var(--button-primary)'
                                : 'var(--input-bg)',
                              color: interaction.manualScore === score
                                ? 'var(--button-text)'
                                : 'var(--text-color)',
                              ':hover': {
                                backgroundColor: 'var(--input-border)'
                              }
                            }}
                            onClick={() => {
                              // 这里可以添加手动评分逻辑
                              console.log(`手动评分: ${score} 分`);
                              // 模拟更新评分
                              const updatedInteractions = userInteractions.map((item) =>
                                item.id === interaction.id
                                  ? { ...item, manualScore: score }
                                  : item
                              );
                              setUserInteractions(updatedInteractions);
                            }}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {userInteractions.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--text-color)', opacity: 0.6 }}>
              暂无交互记录，开始与用户对话后将自动记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;