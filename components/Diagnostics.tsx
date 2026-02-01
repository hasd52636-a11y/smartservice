import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, RefreshCw, 
  Key, Database, Globe, MessageSquare, Settings
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { linkService } from '../services/linkService';
import { projectService } from '../services/projectService';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  action?: () => void;
  actionText?: string;
}

const Diagnostics: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: DiagnosticResult[] = [];

    // 1. 检查API密钥
    diagnostics.push({
      name: 'API密钥配置',
      status: 'loading',
      message: '检查中...'
    });
    setResults([...diagnostics]);

    // 检查API密钥（localStorage 或 环境变量）
    const localApiKey = localStorage.getItem('zhipuApiKey');
    const envApiKey = aiService.getZhipuApiKey(); // 这会检查环境变量
    
    if (localApiKey || envApiKey) {
      try {
        if (localApiKey) {
          aiService.setZhipuApiKey(localApiKey);
        }
        // 如果没有localStorage密钥，aiService会自动使用环境变量
        
        const testResult = await aiService.testZhipuConnection();
        diagnostics[0] = {
          name: 'API密钥配置',
          status: testResult.success ? 'success' : 'error',
          message: testResult.success 
            ? `✅ API密钥有效，连接正常 ${localApiKey ? '(localStorage)' : '(环境变量)'}` 
            : `❌ ${testResult.message}`,
          action: !testResult.success ? () => window.open('/admin/settings', '_blank') : undefined,
          actionText: '去配置'
        };
      } catch (error) {
        diagnostics[0] = {
          name: 'API密钥配置',
          status: 'error',
          message: `❌ API连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
          action: () => window.open('/admin/settings', '_blank'),
          actionText: '去配置'
        };
      }
    } else {
      diagnostics[0] = {
        name: 'API密钥配置',
        status: 'error',
        message: '❌ 未配置智谱AI密钥（localStorage和环境变量都为空）',
        action: () => window.open('/admin/settings', '_blank'),
        actionText: '去配置'
      };
    }
    setResults([...diagnostics]);

    // 2. 检查项目数据
    diagnostics.push({
      name: '项目数据',
      status: 'loading',
      message: '检查中...'
    });
    setResults([...diagnostics]);

    try {
      const projects = await projectService.getAllProjects();
      diagnostics[1] = {
        name: '项目数据',
        status: projects.length > 0 ? 'success' : 'warning',
        message: projects.length > 0 
          ? `✅ 已加载 ${projects.length} 个项目` 
          : '⚠️ 暂无项目数据',
        action: projects.length === 0 ? () => window.open('/admin/projects', '_blank') : undefined,
        actionText: '创建项目'
      };
    } catch (error) {
      diagnostics[1] = {
        name: '项目数据',
        status: 'error',
        message: `❌ 项目数据加载失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
    setResults([...diagnostics]);

    // 3. 检查链接生成
    diagnostics.push({
      name: '链接生成服务',
      status: 'loading',
      message: '检查中...'
    });
    setResults([...diagnostics]);

    try {
      const projects = await projectService.getAllProjects();
      if (projects.length > 0) {
        const testLink = linkService.getNextLinkForProject(projects[0].id);
        if (testLink && testLink.startsWith('http')) {
          diagnostics[2] = {
            name: '链接生成服务',
            status: 'success',
            message: '✅ 链接生成正常'
          };
        } else {
          diagnostics[2] = {
            name: '链接生成服务',
            status: 'error',
            message: '❌ 链接生成异常，格式不正确'
          };
        }
      } else {
        diagnostics[2] = {
          name: '链接生成服务',
          status: 'warning',
          message: '⚠️ 无项目可测试链接生成'
        };
      }
    } catch (error) {
      diagnostics[2] = {
        name: '链接生成服务',
        status: 'error',
        message: `❌ 链接生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
    setResults([...diagnostics]);

    // 4. 检查域名配置
    diagnostics.push({
      name: '域名配置',
      status: 'loading',
      message: '检查中...'
    });
    setResults([...diagnostics]);

    const currentHost = window.location.hostname;
    if (currentHost === 'sora.wboke.com') {
      diagnostics[3] = {
        name: '域名配置',
        status: 'success',
        message: '✅ 生产环境域名配置正确'
      };
    } else if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      diagnostics[3] = {
        name: '域名配置',
        status: 'warning',
        message: '⚠️ 当前为本地开发环境'
      };
    } else {
      diagnostics[3] = {
        name: '域名配置',
        status: 'warning',
        message: `⚠️ 当前域名: ${currentHost}`
      };
    }
    setResults([...diagnostics]);

    // 5. 检查用户界面
    diagnostics.push({
      name: '用户界面测试',
      status: 'success',
      message: '✅ 可以手动测试用户对话界面',
      action: () => {
        const projects = JSON.parse(localStorage.getItem('smartguide_projects') || '[]');
        if (projects.length > 0) {
          const testLink = linkService.getNextLinkForProject(projects[0].id);
          if (testLink) {
            window.open(testLink, '_blank', 'width=400,height=600');
          } else {
            alert('链接生成失败');
          }
        } else {
          alert('请先创建项目');
        }
      },
      actionText: '测试对话'
    });
    setResults([...diagnostics]);

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'loading':
        return <RefreshCw className="text-blue-500 animate-spin" size={20} />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'loading':
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">系统诊断</h1>
          <p className="text-slate-600 mt-2 font-medium">检查系统各项功能是否正常工作</p>
        </div>
        <button 
          onClick={runDiagnostics}
          disabled={isRunning}
          className={`flex items-center gap-3 px-6 py-3 bg-blue-500 text-white rounded-2xl text-sm font-bold hover:bg-blue-600 transition-all ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw size={16} className={isRunning ? 'animate-spin' : ''} />
          {isRunning ? '检查中...' : '重新检查'}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div 
            key={index}
            className={`p-6 rounded-2xl border-2 ${getStatusColor(result.status)} transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(result.status)}
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{result.name}</h3>
                  <p className="text-sm text-slate-600">{result.message}</p>
                </div>
              </div>
              {result.action && result.actionText && (
                <button
                  onClick={result.action}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {result.actionText}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && !isRunning && (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">诊断总结</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-green-100 rounded-xl">
              <div className="text-2xl font-bold text-green-600">
                {results.filter(r => r.status === 'success').length}
              </div>
              <div className="text-sm text-green-600">正常</div>
            </div>
            <div className="p-4 bg-yellow-100 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600">
                {results.filter(r => r.status === 'warning').length}
              </div>
              <div className="text-sm text-yellow-600">警告</div>
            </div>
            <div className="p-4 bg-red-100 rounded-xl">
              <div className="text-2xl font-bold text-red-600">
                {results.filter(r => r.status === 'error').length}
              </div>
              <div className="text-sm text-red-600">错误</div>
            </div>
            <div className="p-4 bg-blue-100 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">
                {results.length}
              </div>
              <div className="text-sm text-blue-600">总计</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diagnostics;