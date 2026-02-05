import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductProject, KnowledgeType, KnowledgeItem, VideoGuide } from '../types';
import { 
  ArrowLeft, Save, Trash2, FileText, QrCode, 
  ShieldCheck, Video, Globe, Sparkles, Download, 
  ExternalLink, Upload, FileUp, X, CheckCircle, Check, Volume2,
  Camera, MessageSquare, Phone, Palette, Type, Image as ImageIcon,
  Smile, Settings, Monitor, Paintbrush, Brain, Database, 
  Search, RefreshCw, Loader2, Zap
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { linkService } from '../services/linkService';
import QRCodeSection from './QRCodeSection';
// import UICustomizer from './UICustomizer'; // 暂时注释掉

interface ProjectDetailProps {
  projects: ProductProject[];
  onUpdate: (updated: ProductProject) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projects, onUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = projects.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState('knowledge');
  const [localProject, setLocalProject] = useState<ProductProject | null>(
    project ? JSON.parse(JSON.stringify(project)) : null
  );
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoDescription, setVideoDescription] = useState('');
  const [videoImageFile, setVideoImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<{hasKey: boolean, checked: boolean}>({
    hasKey: false, 
    checked: false
  });

  // 个性化设置状态
  const [customizationPreview, setCustomizationPreview] = useState(false);

  // 知识库搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Deep Research状态
  const [deepResearchQuery, setDeepResearchQuery] = useState('');
  const [deepResearchResult, setDeepResearchResult] = useState('');
  const [isDeepResearching, setIsDeepResearching] = useState(false);

  // 默认UI自定义配置
  const getDefaultUICustomization = () => ({
    backgroundType: 'gradient' as const,
    backgroundColor: '#f8fafc',
    backgroundGradient: {
      from: '#f1f5f9',
      to: '#e2e8f0',
      direction: 'to-br' as const
    },
    backgroundOpacity: 100,
    fontFamily: 'system' as const,
    fontSize: 'base' as const,
    fontWeight: 'normal' as const,
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    textColor: '#1e293b',
    userMessageBg: '#3b82f6',
    userMessageText: '#ffffff',
    aiMessageBg: '#f1f5f9',
    aiMessageText: '#1e293b',
    messageBorderRadius: 'lg' as const,
    userAvatar: {
      type: 'emoji' as const,
      value: '👤',
      bgColor: '#3b82f6',
      textColor: '#ffffff'
    },
    aiAvatar: {
      type: 'emoji' as const,
      value: '🤖',
      bgColor: '#10b981',
      textColor: '#ffffff'
    },
    inputBg: '#ffffff',
    inputBorder: '#d1d5db',
    inputText: '#1f2937',
    inputPlaceholder: '#9ca3af',
    buttonPrimary: '#3b82f6',
    buttonSecondary: '#6b7280',
    buttonText: '#ffffff',
    enableAnimations: true,
    messageAnimation: 'slide' as const,
    enableEmojis: true,
    enableImageUpload: true,
    enableVoiceMessage: true
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoImageInputRef = useRef<HTMLInputElement>(null);

  // 检查API密钥状态
  useEffect(() => {
    const checkApiKey = () => {
      try {
        const hasKey = !!localStorage.getItem('zhipuApiKey');
        setApiKeyStatus({hasKey, checked: true});
      } catch (error) {
        console.error('检查API密钥状态失败:', error);
        setApiKeyStatus({hasKey: false, checked: true});
      }
    };
    
    checkApiKey();
  }, []);

  useEffect(() => {
    // 加载保存的API密钥
    const savedApiKey = localStorage.getItem('zhipuApiKey');
    if (savedApiKey) {
      aiService.setZhipuApiKey(savedApiKey);
    }
  }, []);

  // 初始化UI自定义配置
  useEffect(() => {
    if (localProject && !localProject.config.uiCustomization) {
      const updatedProject = {
        ...localProject,
        config: {
          ...localProject.config,
          uiCustomization: getDefaultUICustomization()
        }
      };
      setLocalProject(updatedProject);
      onUpdate(updatedProject);
    }
  }, [localProject?.id]);

  if (!localProject) {
    return (
      <div className="p-10 text-slate-800 font-bold text-center">
        Project not found
      </div>
    );
  }

  const handleSave = () => {
    onUpdate(localProject);
    alert('配置已同步 Configuration Synced!');
  };

  // 自动保存配置的函数
  const autoSave = (updatedProject: ProductProject) => {
    setLocalProject(updatedProject);
    onUpdate(updatedProject);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    if (!file) return;

    setUploadProgress(0);
    setUploadStatus('正在读取文件...');
    setUploadFileName(file.name);

    try {
      const content = await readFileContent(file);
      setUploadProgress(30);
      setUploadStatus('正在解析内容...');

      const fileType = file.name.endsWith('.pdf') ? KnowledgeType.PDF : KnowledgeType.TEXT;
      
      setUploadProgress(50);
      setUploadStatus('正在向量化...');

      const apiKey = localStorage.getItem('zhipuApiKey') || '';
      const vectorizeResponse = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          document: {
            id: `k_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            title: file.name,
            content: content,
            type: fileType,
            tags: ['uploaded']
          },
          projectId: localProject?.id || 'global',
          apiKey: apiKey
        })
      });

      const vectorizeResult = await vectorizeResponse.json();
      
      if (!vectorizeResult.success) {
        throw new Error(vectorizeResult.error || '向量化失败');
      }

      setUploadProgress(100);
      setUploadStatus('上传完成');

      const newItem: KnowledgeItem = {
        id: vectorizeResult.id,
        title: file.name,
        content: content,
        type: fileType,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        createdAt: new Date().toISOString(),
        embedding: []
      };

      if (localProject) {
        setLocalProject({
          ...localProject,
          knowledgeBase: [...localProject.knowledgeBase, newItem]
        });
      }

      setTimeout(() => {
        setUploadProgress(null);
        setUploadStatus('');
        setUploadFileName('');
      }, 2000);
    } catch (error) {
      console.error('文件上传失败:', error);
      setUploadStatus('上传失败');
      setTimeout(() => {
        setUploadProgress(null);
        setUploadStatus('');
        setUploadFileName('');
      }, 2000);
    }
  };

  async function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.onerror = reject;
      if (file.name.endsWith('.pdf')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleRevectorize = async (item: KnowledgeItem) => {
    if (!localProject) return;

    try {
      setUploadStatus(`正在重新向量化: ${item.title}`);
      
      const apiKey = localStorage.getItem('zhipuApiKey') || '';
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          document: item,
          projectId: localProject.id,
          apiKey: apiKey
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadStatus(`已重新向量化: ${item.title}`);
        setTimeout(() => {
          setUploadStatus('');
        }, 2000);
      } else {
        throw new Error(result.error || '向量化失败');
      }
    } catch (error) {
      console.error('重新向量化失败:', error);
      setUploadStatus('向量化失败');
      setTimeout(() => {
        setUploadStatus('');
      }, 2000);
    }
  };

  // 知识库搜索
  const handleKnowledgeSearch = async () => {
    if (!searchQuery.trim() || !localProject) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const apiKey = localStorage.getItem('zhipuApiKey') || '';
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query: searchQuery,
          projectId: localProject.id,
          apiKey: apiKey
        })
      });

      const result = await response.json();
      setSearchResults(result.results || []);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Deep Research
  const handleDeepResearch = async () => {
    if (!deepResearchQuery.trim() || !localProject) return;

    setIsDeepResearching(true);
    setDeepResearchResult('');

    try {
      const apiKey = localStorage.getItem('zhipuApiKey') || '';
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deep_research',
          query: deepResearchQuery,
          projectId: localProject.id,
          apiKey: apiKey
        })
      });

      const result = await response.json();
      if (result.result) {
        setDeepResearchResult(result.result);
      } else if (result.error) {
        setDeepResearchResult(`研究失败: ${result.error}`);
      }
    } catch (error) {
      console.error('深度研究失败:', error);
      setDeepResearchResult('深度研究失败，请稍后重试');
    } finally {
      setIsDeepResearching(false);
    }
  };

  const handleManualVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadProgress(0);
    setUploadStatus('正在上传...');

    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(progress);
        setUploadStatus(`上传中... ${progress}%`);
      }
    };
    
    reader.onload = () => {
      setUploadProgress(100);
      setUploadStatus('上传完成，处理中...');
      
      setTimeout(() => {
        const newVideo: VideoGuide = {
          id: `v_${Date.now()}`,
          title: file.name,
          url: reader.result as string,
          type: 'upload',
          status: 'ready'
        };
        if (localProject) {
          setLocalProject({
            ...localProject,
            config: {
              ...localProject.config,
              videoGuides: [...localProject.config.videoGuides, newVideo]
            }
          });
        }
        
        setTimeout(() => {
          setUploadProgress(null);
          setUploadStatus('');
          setUploadFileName('');
        }, 1000);
      }, 1500);
    };
    
    reader.onerror = () => {
      setUploadStatus('上传失败');
      setTimeout(() => {
        setUploadProgress(null);
        setUploadStatus('');
        setUploadFileName('');
      }, 2000);
    };
    
    reader.readAsDataURL(file);
  };

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    setUploadProgress(0);
    setUploadStatus('正在生成视频...');
    setUploadFileName('AI Generated Video');
    
    try {
      let prompt = `Create a video guide for ${localProject.name}`;
      if (videoDescription) {
        prompt += `: ${videoDescription}`;
      } else {
        prompt += `: Installation and usage guide`;
      }
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null || prev >= 80) {
            clearInterval(progressInterval);
            return prev || 80;
          }
          return prev + 10;
        });
      }, 300);
      
      // 模拟AI视频生成
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      setUploadProgress(90);
      setUploadStatus('正在向量化...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadProgress(100);
      setUploadStatus('已存放到多维知识库');
      
      if (localProject) {
        setLocalProject({
          ...localProject,
          config: {
            ...localProject.config,
            videoGuides: [...localProject.config.videoGuides, { 
              id: `v_${Date.now()}`, 
              title: videoDescription ? videoDescription.substring(0, 50) + (videoDescription.length > 50 ? '...' : '') : 'AI Generated Guide', 
              url: 'data:video/mp4;base64,mock-video-data', 
              type: 'ai', 
              status: 'ready'
            }]
          }
        });
      }
      
      setVideoDescription('');
      setVideoImageFile(null);
      if (videoImageInputRef.current) {
        videoImageInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setUploadProgress(null);
        setUploadStatus('');
        setUploadFileName('');
      }, 1500);
    } catch (error) {
      console.error('Video generation failed:', error);
      setUploadStatus('生成失败');
      setTimeout(() => {
        setUploadProgress(null);
        setUploadStatus('');
        setUploadFileName('');
      }, 2000);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // 使用链接服务获取下一个复杂链接
  const complexLink = linkService.getNextLinkForProject(id);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(complexLink)}&color=7c3aed&bgcolor=ffffff`;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/projects')} 
            className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center text-slate-500 hover:text-violet-600 transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {localProject.name}
            </h1>
            <p className="text-slate-600 font-medium flex items-center gap-2 mt-1">
              <Sparkles size={14} className="text-red-500" /> Zhipu GLM Cluster
            </p>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          className="purple-gradient-btn text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-3"
        >
          <Save size={20} /> 手动同步 Manual Sync
        </button>
      </div>

      <div className="flex flex-wrap gap-3 p-2 bg-slate-100 border border-slate-200 backdrop-blur-3xl rounded-[2.5rem] w-fit">
        <TabButton 
          id="knowledge" 
          labelZh="多维知识库" 
          labelEn="RAG Knowledge" 
          active={activeTab === 'knowledge'} 
          onClick={setActiveTab} 
          icon={<FileText size={20}/>} 
          number="1"
        />
        <TabButton 
          id="video" 
          labelZh="引导视频" 
          labelEn="Video Guides" 
          active={activeTab === 'video'} 
          onClick={setActiveTab} 
          icon={<Video size={20}/>} 
          number="2"
        />
        <TabButton 
          id="customize" 
          labelZh="个性化设置" 
          labelEn="UI Customization" 
          active={activeTab === 'customize'} 
          onClick={setActiveTab} 
          icon={<Sparkles size={20}/>} 
          number="3"
        />
        <TabButton 
          id="config" 
          labelZh="客服回复设置" 
          labelEn="Reply Config" 
          active={activeTab === 'config'} 
          onClick={setActiveTab} 
          icon={<MessageSquare size={20}/>} 
          number="4"
        />
        <TabButton 
          id="qr" 
          labelZh="发布部署" 
          labelEn="Deployment" 
          active={activeTab === 'qr'} 
          onClick={setActiveTab} 
          icon={<QrCode size={20}/>} 
          number="5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {activeTab === 'knowledge' && (
            <div className="space-y-8">
              {/* 统计信息卡片 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-6 rounded-[2rem] border border-violet-500/20 bg-violet-500/5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-violet-500/20 rounded-xl">
                      <FileText className="text-violet-500" size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{localProject.knowledgeBase.length}</p>
                      <p className="text-xs text-slate-500">文档总数</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-6 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <Brain className="text-emerald-500" size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">
                        {localProject.knowledgeBase.filter(k => k.vectorized).length}
                      </p>
                      <p className="text-xs text-slate-500">已向量化</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-6 rounded-[2rem] border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                      <Database className="text-amber-500" size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">
                        {Math.round(localProject.knowledgeBase.reduce((acc, k) => acc + (k.content?.length || 0) / 1000, 0))}K
                      </p>
                      <p className="text-xs text-slate-500">字符数</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 手动搜索区域 */}
              <div className="glass-card p-8 rounded-[3rem] border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Search size={20} className="text-violet-500" />
                  知识库检索
                </h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="输入关键词搜索知识库..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleKnowledgeSearch()}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={handleKnowledgeSearch}
                    disabled={!searchQuery.trim()}
                    className="px-6 py-3 bg-violet-500 text-white rounded-xl hover:bg-violet-600 disabled:opacity-50"
                  >
                    搜索
                  </button>
                </div>

                {/* 搜索结果 */}
                {searchResults.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-xs text-slate-500 mb-3">
                      找到 {searchResults.length} 条相关内容（相似度: {searchResults[0]?.score?.toFixed(2) || 0}）
                    </p>
                    {searchResults.map((result) => (
                      <div key={result.id} className="p-4 bg-violet-50 rounded-xl border border-violet-200">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{result.metadata?.title || '未知文档'}</p>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{result.content}</p>
                            <p className="text-xs text-violet-500 mt-2">相似度: {(result.score * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deep Research 功能 */}
              <div className="glass-card p-8 rounded-[3rem] border border-amber-200 bg-amber-50/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Brain className="text-amber-600" size={28} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      深度研究
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-700 text-xs rounded-full">高级</span>
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      针对复杂问题进行深度分析，自动搜索多个信息源，综合生成回答。
                    </p>
                    <div className="flex gap-3 mt-4">
                      <input
                        type="text"
                        placeholder="输入复杂研究问题..."
                        value={deepResearchQuery}
                        onChange={(e) => setDeepResearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleDeepResearch()}
                        className="flex-1 px-4 py-2 bg-white border border-amber-200 rounded-xl focus:outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={handleDeepResearch}
                        disabled={!deepResearchQuery.trim() || isDeepResearching}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isDeepResearching ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            分析中...
                          </>
                        ) : (
                          <>
                            <Zap size={16} />
                            开始研究
                          </>
                        )}
                      </button>
                    </div>
                    {deepResearchResult && (
                      <div className="mt-4 p-4 bg-white rounded-xl border border-amber-200">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{deepResearchResult}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 上传区域 */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-slate-200 hover:border-violet-500/50 bg-slate-100 p-12 rounded-[3rem] transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4"
              >
                <div className="p-5 bg-violet-500/10 text-violet-600 rounded-full group-hover:scale-110 transition-transform">
                  <FileUp size={40} />
                </div>
                <div>
                  <h4 className="text-slate-800 font-bold text-lg">点击或拖拽上传文档 Click to Upload</h4>
                  <p className="text-slate-500 text-sm mt-1">支持 PDF, TXT, DOCX. 系统将自动分片并进行 Embedding 处理。</p>
                </div>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              </div>

              {/* 文档列表 */}
              <div className="grid gap-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Database size={20} className="text-slate-400" />
                  知识库文档 ({localProject.knowledgeBase.length})
                </h4>
                {localProject.knowledgeBase.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl">
                    <Database size={48} className="mx-auto mb-4 opacity-30" />
                    <p>暂无文档，上传文档开始构建知识库</p>
                  </div>
                ) : (
                  localProject.knowledgeBase.map((item) => (
                    <div key={item.id} className="glass-card p-6 rounded-[2rem] border border-slate-200 group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                          {item.vectorized ? (
                            <Brain size={24} className="text-emerald-500" />
                          ) : (
                            <FileText size={24} className="text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input 
                            className="bg-transparent border-none outline-none font-bold text-slate-800 w-full"
                            value={item.title}
                            onChange={(e) => setLocalProject({...localProject, knowledgeBase: localProject.knowledgeBase.map(i => i.id === item.id ? {...i, title: e.target.value} : i)})}
                          />
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {item.type} • {item.fileSize || 'Manual'} • {item.content?.length || 0}字符
                            {item.vectorized && <span className="ml-2 text-emerald-500">✓ 已向量化</span>}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleRevectorize(item)}
                          className="p-2 text-slate-500 hover:text-violet-500 transition-colors"
                          title="重新向量化"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('确定删除此文档？')) {
                              setLocalProject({...localProject, knowledgeBase: localProject.knowledgeBase.filter(i => i.id !== item.id)});
                              onUpdate({...localProject, knowledgeBase: localProject.knowledgeBase.filter(i => i.id !== item.id)});
                            }
                          }} 
                          className="p-2 text-slate-500 hover:text-pink-500 transition-colors"
                          title="删除文档"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card p-8 rounded-[3rem] border border-slate-200 flex flex-col justify-between group">
                  <div>
                    <Sparkles className="text-violet-500 mb-6" size={32} />
                    <h4 className="text-xl font-bold text-slate-800">AI 智能合成 Video AI</h4>
                    <p className="text-sm text-slate-600 mt-2">基于用户提供的图片和文字生成更精确的虚拟引导视频。</p>
                    
                    <div className="mt-4">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">上传参考图片</label>
                      <input 
                        type="file" 
                        ref={videoImageInputRef}
                        onChange={(e) => setVideoImageFile(e.target.files?.[0])}
                        accept="image/*"
                        className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-xl file:border-0
                          file:text-sm file:font-medium
                          file:bg-violet-50 file:text-violet-700
                          hover:file:bg-violet-100"
                      />
                      {videoImageFile && (
                        <p className="text-xs text-slate-500 mt-2">已选择文件: {videoImageFile.name}</p>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">视频内容描述 (2000字内)</label>
                      <textarea 
                        value={videoDescription}
                        onChange={(e) => {
                          if (e.target.value.length <= 2000) {
                            setVideoDescription(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all h-32 resize-none"
                        placeholder="请详细描述视频内容，包括：
1. 视频主题和目的
2. 关键步骤和流程
3. 重点强调的内容
4. 目标受众和使用场景"
                      />
                      <div className="flex justify-end mt-1">
                        <span className={`text-xs font-bold ${videoDescription.length > 1800 ? 'text-amber-500' : 'text-slate-500'}`}>
                          {videoDescription.length}/2000
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {uploadProgress !== null && (
                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                          {uploadFileName || 'AI Generated Video'}
                        </span>
                        <span className="text-xs font-black text-amber-600">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500">
                        {uploadStatus}
                      </p>
                    </div>
                  )}
                  
                  <button 
                    disabled={isGeneratingVideo}
                    onClick={handleGenerateVideo}
                    className="mt-8 py-4 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-2xl font-black text-xs uppercase hover:bg-violet-500 hover:text-white transition-all"
                  >
                    {isGeneratingVideo ? 'Generating...' : 'Start AI Generation'}
                  </button>
                </div>

                <div className="glass-card p-8 rounded-[3rem] border border-slate-200 flex flex-col justify-between group">
                  <div>
                    <Upload className="text-amber-500 mb-6" size={32} />
                    <h4 className="text-xl font-bold text-slate-800">商家专业上传 Upload</h4>
                    <p className="text-sm text-slate-600 mt-2">上传 100% 准确的实拍安装视频（推荐）。</p>
                  </div>
                  
                  {uploadProgress !== null && (
                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                          {uploadFileName}
                        </span>
                        <span className="text-xs font-black text-amber-600">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 text-center">
                        {uploadStatus}
                      </p>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => videoInputRef.current?.click()} 
                    disabled={uploadProgress !== null}
                    className="mt-8 py-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl font-black text-xs uppercase hover:bg-amber-500 hover:text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadProgress !== null ? '上传中...' : 'Upload MP4/MOV'}
                  </button>
                  <input type="file" ref={videoInputRef} onChange={handleManualVideoUpload} accept="video/*" className="hidden" />
                </div>

                <div className={`glass-card p-8 rounded-[3rem] border ${localProject.config.visionEnabled ? 'border-slate-200' : 'border-slate-300 opacity-70'} flex flex-col justify-between group`}>
                  <div>
                    <Camera className={`${localProject.config.visionEnabled ? 'text-blue-500' : 'text-slate-400'} mb-6`} size={32} />
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xl font-bold text-slate-800">图片分析 AI</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={localProject.config.visionEnabled}
                          onChange={(e) => {
                            const updatedProject = {
                              ...localProject,
                              config: {
                                ...localProject.config,
                                visionEnabled: e.target.checked
                              }
                          };
                          autoSave(updatedProject);

                          // 清除可能存在的无效主题数据
                          if (localProject?.id) {
                            localStorage.removeItem(`project_${localProject.id}_theme`);
                          }
                        }}
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">智能分析用户上传的图片，识别安装问题并提供解决方案。</p>
                    {!localProject.config.visionEnabled && (
                      <p className="text-sm text-amber-500 mt-2 font-medium">功能已禁用</p>
                    )}
                  </div>
                  <button 
                    onClick={async () => {
                      if (!localProject.config.visionEnabled) {
                        alert('图片分析功能已禁用，请先启用该功能');
                        return;
                      }
                      alert('图片分析功能已启用，用户可以通过扫码后上传图片进行分析。');
                    }}
                    disabled={!localProject.config.visionEnabled}
                    className={`mt-8 py-4 ${localProject.config.visionEnabled ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white' : 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'} rounded-2xl font-black text-xs uppercase transition-all`}
                  >
                    {localProject.config.visionEnabled ? 'Test Vision' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* 视频列表 */}
              <div className="grid gap-6">
                {localProject.config.videoGuides.map((video) => (
                  <div key={video.id} className="glass-card p-6 rounded-[2rem] border border-slate-200 group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                        <Video size={24} className="text-blue-500"/>
                      </div>
                      <div className="flex-1">
                        <input 
                          className="bg-transparent border-none outline-none font-bold text-slate-800 w-full"
                          value={video.title}
                          onChange={(e) => {
                            const updatedVideos = localProject.config.videoGuides.map(v => 
                              v.id === video.id ? {...v, title: e.target.value} : v
                            );
                            setLocalProject({...localProject, config: {...localProject.config, videoGuides: updatedVideos}});
                          }}
                        />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{video.type} • {video.status}</p>
                      </div>
                      <button onClick={() => {
                        const updatedVideos = localProject.config.videoGuides.filter(v => v.id !== video.id);
                        setLocalProject({...localProject, config: {...localProject.config, videoGuides: updatedVideos}});
                      }} className="p-2 text-slate-500 hover:text-pink-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'customize' && (
            <div className="space-y-8">
              {/* 主标题 */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Palette className="text-purple-600" size={32} />
                  <h2 className="text-3xl font-bold text-slate-800">个性化主题</h2>
                </div>
                <p className="text-slate-600">选择您喜欢的对话界面主题，点击即可应用</p>
              </div>

              {/* 主题模板选择 - 一排五个 */}
              <div className="glass-card p-8 rounded-[3rem] border border-slate-200">
                <div className="grid grid-cols-5 gap-6">
                  {[
                    { id: 'modern', name: '现代简约', icon: '✨', colors: ['#3b82f6', '#ffffff', '#f1f5f9'] },
                    { id: 'dark', name: '深色主题', icon: '🌙', colors: ['#8b5cf6', '#1e293b', '#f8fafc'] },
                    { id: 'vibrant', name: '活力彩色', icon: '⚡', colors: ['#f59e0b', '#fef3c7', '#78350f'] },
                    { id: 'scifi', name: '科幻未来', icon: '🚀', colors: ['#22d3ee', '#0f172a', '#f0f9ff'] },
                    { id: 'crystal', name: '水晶透明', icon: '💎', colors: ['#0ea5e9', '#f0f9ff', '#0c4a6e'] },
                    { id: 'festive', name: '喜庆红火', icon: '🧧', colors: ['#dc2626', '#fef2f2', '#7f1d1d'] },
                    { id: 'ocean', name: '海滨度假', icon: '🏖️', colors: ['#0891b2', '#ecfeff', '#164e63'] },
                    { id: 'vangogh', name: '梵高印象', icon: '🎨', colors: ['#fbbf24', '#fef9c3', '#854d0e'] },
                    { id: 'dream', name: '梦境幻想', icon: '🌙', colors: ['#a855f7', '#fdf4ff', '#581c87'] },
                    { id: 'anime', name: '二次元', icon: '🌸', colors: ['#ec4899', '#fdf2f8', '#831843'] }
                  ].map((template) => {
                    // 检查当前模板是否被选中
                    const isSelected = localProject.config.uiCustomization?.selectedTheme === template.id;
                    
                    return (
                      <div
                        key={template.id}
                        className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-50 shadow-lg scale-105' 
                            : 'border-slate-200 hover:border-purple-300'
                        }`}
                        onClick={() => {
                          // 应用主题逻辑 - 静默应用，无弹窗
                          const updatedProject = {
                            ...localProject,
                            config: {
                              ...localProject.config,
                              uiCustomization: {
                                ...localProject.config.uiCustomization,
                                selectedTheme: template.id,
                                primaryColor: template.colors[0],
                                backgroundColor: template.colors[1],
                                textColor: template.colors[2],
                                backgroundType: 'gradient' as const,
                                backgroundGradient: {
                                  from: template.colors[1],
                                  to: template.colors[0],
                                  direction: 'to-br' as const
                                }
                              }
                            }
                          };
                          autoSave(updatedProject);
                        }}
                      >
                        {/* 选中标识 */}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center">
                            <Check size={14} />
                          </div>
                        )}
                        
                        {/* 主题图标 */}
                        <div className="text-center mb-4">
                          <div className="text-4xl mb-2">{template.icon}</div>
                          <h3 className={`font-bold text-sm ${isSelected ? 'text-purple-700' : 'text-slate-800'}`}>
                            {template.name}
                          </h3>
                        </div>
                        
                        {/* 颜色预览 */}
                        <div className="flex justify-center gap-1 mb-4">
                          {template.colors.map((color, index) => (
                            <div 
                              key={index}
                              className="w-4 h-4 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        
                        {/* 状态显示 */}
                        <div className="text-center">
                          {isSelected ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center gap-2 text-purple-600">
                                <Check size={16} />
                                <span className="text-xs font-medium">已选中</span>
                              </div>
                              <span className="text-[10px] text-amber-500 bg-amber-50 px-2 py-1 rounded">
                                刷新用户页面查看效果
                              </span>
                            </div>
                          ) : (
                            <button className="text-xs font-medium text-purple-600 hover:text-purple-700 px-4 py-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                              点击选择
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 实时预览控制 */}
              <div className="glass-card p-6 rounded-[3rem] border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">实时预览</h4>
                    <p className="text-slate-600 mt-1">查看主题应用后的实际效果</p>
                  </div>
                  <button
                    onClick={() => setCustomizationPreview(!customizationPreview)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      customizationPreview 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    {customizationPreview ? '隐藏预览' : '显示预览'}
                  </button>
                </div>
              </div>

              {/* 预览窗口 */}
              {customizationPreview && (
                <div className="glass-card p-6 rounded-[3rem] border border-slate-200">
                  <h4 className="text-lg font-bold text-slate-800 mb-6 text-center">用户对话界面预览</h4>
                  <div className="flex justify-center">
                    <div 
                      className="w-full max-w-sm mx-auto rounded-2xl shadow-xl overflow-hidden"
                      style={{
                        backgroundColor: localProject.config.uiCustomization?.backgroundType === 'solid' 
                          ? localProject.config.uiCustomization.backgroundColor 
                          : '#ffffff'
                      }}
                    >
                      <div 
                        className="p-4 border-b"
                        style={{
                          backgroundColor: localProject.config.uiCustomization?.primaryColor || '#6d28d9',
                          backgroundImage: localProject.config.uiCustomization?.backgroundType === 'gradient' 
                            ? `linear-gradient(${localProject.config.uiCustomization.backgroundGradient?.direction || 'to-br'}, ${localProject.config.uiCustomization.backgroundGradient?.from || '#6d28d9'}, ${localProject.config.uiCustomization.backgroundGradient?.to || '#4c1d95'})`
                            : 'none',
                          borderBottomColor: localProject.config.uiCustomization?.primaryColor || '#6d28d9'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: localProject.config.uiCustomization?.textColor || '#ffffff'
                            }}
                          >
                            <span 
                              className="font-bold text-sm"
                              style={{
                                color: localProject.config.uiCustomization?.primaryColor || '#6d28d9'
                              }}
                            >
                              AI
                            </span>
                          </div>
                          <div>
                            <h3 
                              className="font-bold text-sm"
                              style={{
                                color: localProject.config.uiCustomization?.textColor || '#ffffff'
                              }}
                            >
                              {localProject.name}
                            </h3>
                            <p 
                              className="text-xs opacity-70"
                              style={{
                                color: localProject.config.uiCustomization?.textColor || '#ffffff'
                              }}
                            >
                              智能客服
                            </p>
                          </div>
                        </div>
                      </div>
                      <div 
                        className="p-4"
                        style={{
                          backgroundColor: localProject.config.uiCustomization?.backgroundType === 'solid' 
                            ? localProject.config.uiCustomization.backgroundColor 
                            : '#ffffff'
                        }}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-start">
                            <div 
                              className="px-3 py-2 rounded-lg text-sm max-w-xs"
                              style={{
                                backgroundColor: localProject.config.uiCustomization?.backgroundType === 'solid' 
                                  ? `${localProject.config.uiCustomization.backgroundColor}80` 
                                  : '#f3f4f6',
                                color: localProject.config.uiCustomization?.textColor || '#1f2937'
                              }}
                            >
                              您好！我是智能客服助手 🤖
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <div 
                              className="px-3 py-2 rounded-lg text-sm max-w-xs"
                              style={{
                                backgroundColor: localProject.config.uiCustomization?.primaryColor || '#6d28d9',
                                color: localProject.config.uiCustomization?.backgroundType === 'solid' 
                                  ? localProject.config.uiCustomization.primaryColor 
                                  : '#ffffff'
                              }}
                            >
                              你好，我想了解产品信息
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <div 
                              className="px-3 py-2 rounded-lg text-sm max-w-xs"
                              style={{
                                backgroundColor: localProject.config.uiCustomization?.backgroundType === 'solid' 
                                  ? `${localProject.config.uiCustomization.backgroundColor}80` 
                                  : '#f3f4f6',
                                color: localProject.config.uiCustomization?.textColor || '#1f2937'
                              }}
                            >
                              好的，我来为您详细介绍产品功能
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 text-center mt-6">
                    这是用户扫码后看到的实际界面效果
                  </p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'config' && (
            <div className="space-y-8">
              {/* API 密钥配置 */}
              <div className="glass-card p-8 rounded-[3rem] border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <ShieldCheck className="text-emerald-600" size={28} />
                  API 密钥配置
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      智谱AI API密钥 (Zhipu AI API Key)
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="password"
                        placeholder="请输入您的智谱AI API密钥..."
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                        onChange={(e) => {
                          const apiKey = e.target.value;
                          if (apiKey) {
                            aiService.setZhipuApiKey(apiKey);
                            setApiKeyStatus({hasKey: true, checked: true});
                          } else {
                            localStorage.removeItem('zhipuApiKey');
                            setApiKeyStatus({hasKey: false, checked: true});
                          }
                        }}
                        defaultValue={localStorage.getItem('zhipuApiKey') || ''}
                      />
                      <button
                        onClick={async () => {
                          const result = await aiService.testZhipuConnection();
                          alert(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
                        }}
                        className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
                      >
                        测试连接
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {apiKeyStatus.checked && (
                        <>
                          {apiKeyStatus.hasKey ? (
                            <CheckCircle className="text-emerald-500" size={16} />
                          ) : (
                            <X className="text-red-500" size={16} />
                          )}
                          <span className={`text-xs font-medium ${apiKeyStatus.hasKey ? 'text-emerald-600' : 'text-red-600'}`}>
                            {apiKeyStatus.hasKey ? 'API密钥已配置' : 'API密钥未配置'}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      请在 <a href="https://bigmodel.cn/usercenter/proj-mgmt/apikeys" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">智谱AI控制台</a> 获取您的API密钥。
                      密钥将安全保存在本地浏览器中。
                    </p>
                  </div>
                </div>
              </div>

              {/* 联系信息配置 */}
              <div className="glass-card p-8 rounded-[3rem] border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <Phone className="text-blue-600" size={28} />
                  联系信息配置
                </h3>
                
                <div className="space-y-6">
                  {/* 欢迎语配置 */}
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      欢迎语 (Welcome Message)
                    </label>
                    <textarea
                      placeholder={`您好！我是 ${localProject.name} 的智能售后客服助手 🤖\n\n我可以帮您解决：\n• 产品使用问题\n• 安装指导\n• 故障排查\n• 维护保养\n\n请描述您遇到的问题，或上传相关图片，我会基于产品知识库为您提供专业解答。`}
                      value={localProject.config.welcomeMessage || ''}
                      onChange={(e) => {
                        const updatedProject = {
                          ...localProject,
                          config: {
                            ...localProject.config,
                            welcomeMessage: e.target.value
                          }
                        };
                        autoSave(updatedProject);
                      }}
                      className="w-full h-32 px-4 py-3 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      用户扫码后看到的第一条消息，留空则使用默认欢迎语
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                        公司名称
                      </label>
                      <input
                        type="text"
                        placeholder="中恒创世"
                        value={localProject.config.companyName || ''}
                        onChange={(e) => {
                          const updatedProject = {
                            ...localProject,
                            config: {
                              ...localProject.config,
                              companyName: e.target.value
                            }
                          };
                          autoSave(updatedProject);
                        }}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                        技术支持热线
                      </label>
                      <input
                        type="text"
                        placeholder="400-888-6666"
                        value={localProject.config.supportPhone || ''}
                        onChange={(e) => {
                          const updatedProject = {
                            ...localProject,
                            config: {
                              ...localProject.config,
                              supportPhone: e.target.value
                            }
                          };
                          autoSave(updatedProject);
                        }}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                        官方网站
                      </label>
                      <input
                        type="text"
                        placeholder="www.aivirtualservice.com"
                        value={localProject.config.supportWebsite || ''}
                        onChange={(e) => {
                          const updatedProject = {
                            ...localProject,
                            config: {
                              ...localProject.config,
                              supportWebsite: e.target.value
                            }
                          };
                          autoSave(updatedProject);
                        }}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                        微信公众号
                      </label>
                      <input
                        type="text"
                        placeholder="AI虚拟客服助手"
                        value={localProject.config.wechatAccount || ''}
                        onChange={(e) => {
                          const updatedProject = {
                            ...localProject,
                            config: {
                              ...localProject.config,
                              wechatAccount: e.target.value
                            }
                          };
                          autoSave(updatedProject);
                        }}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <h4 className="text-sm font-bold text-blue-800 mb-2">配置说明</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• 欢迎语是用户扫码后看到的第一条消息</li>
                    <li>• 联系信息将显示在AI回复和用户界面中</li>
                    <li>• 支持热线将在AI无法解答时提供给用户</li>
                    <li>• 官方网站链接会在错误页面和帮助信息中显示</li>
                    <li>• 微信公众号用于用户获取更多支持</li>
                  </ul>
                </div>
              </div>

              {/* AI 系统配置 */}
              <div className="glass-card p-8 rounded-[3rem] border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <Sparkles className="text-violet-600" size={28} />
                  AI 系统配置
                </h3>
                
                {/* 系统提示词配置 */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      系统提示词 (System Instruction)
                    </label>
                    <textarea
                      value={localProject.config.systemInstruction}
                      onChange={(e) => {
                        const updatedProject = {
                          ...localProject,
                          config: {
                            ...localProject.config,
                            systemInstruction: e.target.value
                          }
                        };
                        autoSave(updatedProject);
                      }}
                      placeholder="定义AI助手的身份、语气、行为规范等..."
                      className="w-full h-32 px-4 py-3 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      设置AI助手的身份定位、回复语气、专业领域和行为规范
                    </p>
                  </div>

                  {/* 图片分析提示词 */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      图片分析提示词 (Vision Prompt)
                    </label>
                    <textarea
                      value={localProject.config.visionPrompt}
                      onChange={(e) => {
                        const updatedProject = {
                          ...localProject,
                          config: {
                            ...localProject.config,
                            visionPrompt: e.target.value
                          }
                        };
                        autoSave(updatedProject);
                      }}
                      placeholder="定义AI如何分析用户上传的图片..."
                      className="w-full h-24 px-4 py-3 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      指导AI如何分析和解读用户上传的产品图片
                    </p>
                  </div>

                  {/* 语音配置 */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      语音角色 (Voice Character)
                    </label>
                    <div className="flex gap-3">
                      <select
                        value={localProject.config.voiceName}
                        onChange={(e) => {
                          const updatedProject = {
                            ...localProject,
                            config: {
                              ...localProject.config,
                              voiceName: e.target.value
                            }
                          };
                          autoSave(updatedProject);
                        }}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      >
                        <option value="tongtong">童童 (甜美女声)</option>
                        <option value="xiaoxiao">小小 (活泼女声)</option>
                        <option value="xiaochen">小陈 (专业男声)</option>
                        <option value="xiaoming">小明 (亲切男声)</option>
                        <option value="xiaoli">小丽 (温柔女声)</option>
                        <option value="xiaowang">小王 (稳重男声)</option>
                      </select>
                      <button
                        onClick={async () => {
                          if (isPlayingVoice) return;
                          
                          try {
                            setIsPlayingVoice(true);
                            
                            // 确保API密钥已设置
                            const savedApiKey = localStorage.getItem('zhipuApiKey');
                            if (savedApiKey) {
                              aiService.setZhipuApiKey(savedApiKey);
                            }
                            
                            // 根据选择的角色生成试听文本
                            const voiceDescriptions = {
                              tongtong: "您好，我是童童，很高兴为您服务！",
                              xiaoxiao: "嗨！我是小小，让我来帮助您解决问题吧！",
                              xiaochen: "您好，我是小陈，专业的技术支持为您服务。",
                              xiaoming: "您好，我是小明，很高兴能够帮助您。",
                              xiaoli: "您好，我是小丽，温柔地为您提供服务。",
                              xiaowang: "您好，我是小王，稳重可靠的技术支持。"
                            };
                            
                            const testText = voiceDescriptions[localProject.config.voiceName as keyof typeof voiceDescriptions] || "您好，这是语音试听测试。";
                            
                            // 调用TTS服务
                            const audioData = await aiService.generateSpeech(testText, localProject.config.voiceName, localProject.config.provider);
                            
                            if (audioData) {
                              const audio = new Audio(`data:audio/wav;base64,${audioData}`);
                              audio.onended = () => setIsPlayingVoice(false);
                              audio.onerror = () => setIsPlayingVoice(false);
                              await audio.play();
                            } else {
                              alert('语音试听需要配置API密钥，请先在上方配置智谱AI API密钥。');
                              setIsPlayingVoice(false);
                            }
                          } catch (error) {
                            console.error('语音试听失败:', error);
                            alert('语音试听失败，请检查API密钥配置或网络连接。');
                            setIsPlayingVoice(false);
                          }
                        }}
                        disabled={isPlayingVoice}
                        className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors ${
                          isPlayingVoice 
                            ? 'bg-violet-400 text-white cursor-not-allowed' 
                            : 'bg-violet-600 text-white hover:bg-violet-700'
                        }`}
                        title="试听当前选择的语音角色"
                      >
                        <Volume2 size={18} />
                        {isPlayingVoice ? '播放中...' : '试听'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      选择AI语音合成的音色风格，点击试听按钮可以预览音色效果
                    </p>
                  </div>
                </div>
              </div>

              {/* 功能开关配置 */}
              <div className="glass-card p-8 rounded-[3rem] border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <ShieldCheck className="text-emerald-600" size={28} />
                  功能开关
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 多模态分析 */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <h4 className="font-bold text-slate-800">多模态分析</h4>
                      <p className="text-xs text-slate-600">图片、视频内容分析</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localProject.config.multimodalEnabled}
                        onChange={(e) => {
                          const updatedProject = {
                            ...localProject,
                            config: {
                              ...localProject.config,
                              multimodalEnabled: e.target.checked
                            }
                          };
                          autoSave(updatedProject);
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>

                  {/* 视频聊天 */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <h4 className="font-bold text-slate-800">视频聊天</h4>
                      <p className="text-xs text-slate-600">实时视频交互功能</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localProject.config.videoChatEnabled}
                        onChange={(e) => {
                          const updatedProject = {
                            ...localProject,
                            config: {
                              ...localProject.config,
                              videoChatEnabled: e.target.checked
                            }
                          };
                          autoSave(updatedProject);
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>

                  {/* 虚拟人头像 */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <h4 className="font-bold text-slate-800">虚拟人头像</h4>
                      <p className="text-xs text-slate-600">3D虚拟客服形象</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localProject.config.avatarEnabled}
                        onChange={(e) => {
                          const updatedProject = {
                            ...localProject,
                            config: {
                              ...localProject.config,
                              avatarEnabled: e.target.checked
                            }
                          };
                          autoSave(updatedProject);
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>

                  {/* 智能标注 */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <h4 className="font-bold text-slate-800">智能标注</h4>
                      <p className="text-xs text-slate-600">视频标注和指导功能</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localProject.config.annotationEnabled}
                        onChange={(e) => {
                          const updatedProject = {
                            ...localProject,
                            config: {
                              ...localProject.config,
                              annotationEnabled: e.target.checked
                            }
                          };
                          autoSave(updatedProject);
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* 预设模板 */}
              <div className="glass-card p-8 rounded-[3rem] border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <FileText className="text-blue-600" size={28} />
                  配置模板
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      const updatedProject = {
                        ...localProject,
                        config: {
                          ...localProject.config,
                          systemInstruction: `你是${localProject.name}的专业售后客服助手。\n\n身份定位：\n- 专业的技术支持专家\n- 耐心、友好、专业的服务态度\n- 精通产品技术和故障排除\n\n回复原则：\n- 仅基于产品知识库回答问题\n- 不得回答知识库外的内容\n- 遇到复杂问题及时转接人工客服\n- 提供准确、实用的解决方案\n\n联系方式：\n技术支持热线：400-888-6666\n官方网站：www.aivirtualservice.com`,
                          visionPrompt: `作为${localProject.name}的技术专家，请仔细分析这张图片：\n\n1. 识别产品型号和组件\n2. 检查安装是否正确\n3. 发现潜在问题和风险\n4. 提供具体的改进建议\n\n请基于产品知识库提供专业的分析和指导。`,
                          voiceName: "tongtong"
                        }
                      };
                      autoSave(updatedProject);
                      alert('已应用专业客服模板！');
                    }}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <h4 className="font-bold text-blue-800 mb-2">专业客服</h4>
                    <p className="text-xs text-blue-600">正式、专业的技术支持风格</p>
                  </button>

                  <button
                    onClick={() => {
                      const updatedProject = {
                        ...localProject,
                        config: {
                          ...localProject.config,
                          systemInstruction: `你是${localProject.name}的贴心AI助手！😊\n\n我的特点：\n- 活泼开朗，充满活力\n- 用温暖的语言与用户交流\n- 善于用简单易懂的方式解释技术问题\n- 会适当使用表情符号增加亲和力\n\n服务承诺：\n- 基于产品知识库提供准确信息 ✅\n- 遇到不确定的问题会诚实告知 💯\n- 及时引导联系人工客服 📞\n\n让我们一起解决问题吧！🚀`,
                          visionPrompt: `让我来帮你分析这张图片！📸\n\n我会仔细查看：\n✨ 产品的安装情况\n✨ 可能存在的问题\n✨ 改进的小建议\n\n基于我们的产品知识，我会给你最贴心的指导！`,
                          voiceName: "xiaoxiao"
                        }
                      };
                      autoSave(updatedProject);
                      alert('已应用亲切助手模板！');
                    }}
                    className="p-4 bg-pink-50 border border-pink-200 rounded-xl hover:bg-pink-100 transition-colors"
                  >
                    <h4 className="font-bold text-pink-800 mb-2">亲切助手</h4>
                    <p className="text-xs text-pink-600">温暖、友好的交流风格</p>
                  </button>

                  <button
                    onClick={() => {
                      const updatedProject = {
                        ...localProject,
                        config: {
                          ...localProject.config,
                          systemInstruction: `${localProject.name} 技术支持系统\n\n功能定位：\n- 高效的问题诊断和解决\n- 基于数据的准确分析\n- 标准化的服务流程\n\n操作规范：\n- 严格按照知识库内容回答\n- 提供结构化的解决方案\n- 记录问题类型和处理结果\n- 必要时升级至人工处理\n\n系统信息：\n支持热线：400-888-6666\n在线文档：www.aivirtualservice.com/docs`,
                          visionPrompt: `系统分析模式启动\n\n图像识别流程：\n1. 产品识别与分类\n2. 安装状态评估\n3. 问题点定位\n4. 解决方案匹配\n\n输出标准化分析报告和操作建议。`,
                          voiceName: "xiaochen"
                        }
                      };
                      autoSave(updatedProject);
                      alert('已应用技术专家模板！');
                    }}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <h4 className="font-bold text-slate-800 mb-2">技术专家</h4>
                    <p className="text-xs text-slate-600">严谨、高效的技术风格</p>
                  </button>
                </div>
                
                {/* 应用配置按钮 */}
                <div className="mt-8 p-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Sparkles className="text-violet-600" size={20} />
                        应用配置到用户界面
                      </h4>
                      <p className="text-sm text-slate-600">
                        将当前的系统配置（提示词、语音设置等）应用到用户对话界面，
                        <br />确保移动端和电脑端都能看到最新的设置效果。
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // 强制更新项目配置，确保所有设置都被应用
                        const updatedProject = {
                          ...localProject,
                          config: {
                            ...localProject.config,
                            // 确保配置被标记为已更新
                            lastUpdated: new Date().toISOString(),
                            // 强制刷新标识
                            forceRefresh: Math.random().toString(36).substr(2, 9)
                          }
                        };
                        
                        // 保存到localStorage以确保立即生效
                        try {
                          const projects = JSON.parse(localStorage.getItem('projects') || '[]');
                          const projectIndex = projects.findIndex((p: any) => p.id === localProject.id);
                          if (projectIndex !== -1) {
                            projects[projectIndex] = updatedProject;
                            localStorage.setItem('projects', JSON.stringify(projects));
                          }
                        } catch (error) {
                          console.error('保存到localStorage失败:', error);
                        }
                        
                        // 更新状态
                        autoSave(updatedProject);
                        
                        // 显示成功提示
                        alert('✅ 配置已成功应用到用户界面！\n\n用户扫码后将看到最新的设置效果，包括：\n• 系统提示词\n• 欢迎消息\n• 语音设置\n• UI主题配置');
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <Save size={16} />
                      立即应用配置
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <QRCodeSection 
              projectId={id}
              projectName={localProject.name}
              complexLink={complexLink}
              qrImageUrl={qrImageUrl}
            />
          )}
        </div>

        <div className="space-y-8">
          <div className="glass-card p-8 rounded-[3rem] border border-slate-200">
            <h4 className="text-slate-800 font-bold mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-violet-600"/> RAG 运行状态
            </h4>
            <div className="space-y-5">
              <StatusRow label="Embedding Node" value="ACTIVE" color="text-emerald-600" />
              <StatusRow label="Vector Index" value={`${localProject.knowledgeBase.length} Chunks`} />
              <StatusRow label="Rerank Model" value="Enabled" />
              <StatusRow label="TTS Provider" value="Zhipu GLM" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusRow = ({ label, value, color = "text-slate-800" }: any) => (
  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
    <span className="text-slate-500">{label}</span>
    <span className={color}>{value}</span>
  </div>
);

const TabButton = ({ id, labelZh, labelEn, active, onClick, icon, number }: any) => (
  <button 
    onClick={() => onClick(id)} 
    className={`flex items-center gap-3 px-8 py-3 rounded-[2rem] font-bold text-sm transition-all duration-500 ${
      active 
        ? 'purple-gradient-btn text-white shadow-xl scale-105' 
        : 'text-slate-600 hover:text-slate-900'
    }`}
  >
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
      active ? 'bg-white/20' : 'bg-slate-200'
    }`}>
      {number}
    </div>
    {icon}
    <div className="flex flex-col items-start leading-none">
      <span className="text-[11px] font-black">{labelZh}</span>
      <span className="text-[9px] opacity-60 uppercase font-black tracking-tighter">{labelEn}</span>
    </div>
  </button>
);

export default ProjectDetail;