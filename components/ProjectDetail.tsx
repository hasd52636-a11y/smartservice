import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductProject, KnowledgeType, KnowledgeItem, VideoGuide } from '../types';
import { 
  ArrowLeft, Save, Trash2, FileText, QrCode, 
  ShieldCheck, Video, Globe, Sparkles, Download, 
  ExternalLink, Upload, FileUp, X, CheckCircle, Volume2,
  Camera, MessageSquare
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { linkService } from '../services/linkService';
import QRCodeSection from './QRCodeSection';

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
  const [apiKeyStatus, setApiKeyStatus] = useState<{hasKey: boolean, checked: boolean}>({
    hasKey: false, 
    checked: false
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: KnowledgeItem[] = (Array.from(files) as File[]).map(f => ({
      id: `k_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: f.name,
      content: `[File Context Placeholder] This file "${f.name}" has been uploaded. AI will parse its contents during inference.`,
      type: f.name.endsWith('.pdf') ? KnowledgeType.PDF : KnowledgeType.TEXT,
      fileName: f.name,
      fileSize: `${(f.size / 1024).toFixed(1)} KB`,
      createdAt: new Date().toISOString()
    }));

    if (localProject) {
      setLocalProject({
        ...localProject,
        knowledgeBase: [...localProject.knowledgeBase, ...newItems]
      });
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
        />
        <TabButton 
          id="video" 
          labelZh="引导视频" 
          labelEn="Video Guides" 
          active={activeTab === 'video'} 
          onClick={setActiveTab} 
          icon={<Video size={20}/>} 
        />
        <TabButton 
          id="qr" 
          labelZh="发布部署" 
          labelEn="Deployment" 
          active={activeTab === 'qr'} 
          onClick={setActiveTab} 
          icon={<QrCode size={20}/>} 
        />
        <TabButton 
          id="config" 
          labelZh="AI配置" 
          labelEn="AI Config" 
          active={activeTab === 'config'} 
          onClick={setActiveTab} 
          icon={<Sparkles size={20}/>} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {activeTab === 'knowledge' && (
            <div className="space-y-8">
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

              <div className="grid gap-6">
                {localProject.knowledgeBase.map((item) => (
                  <div key={item.id} className="glass-card p-6 rounded-[2rem] border border-slate-200 group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                        {item.type === KnowledgeType.PDF ? <FileText size={24} className="text-amber-500"/> : <FileText size={24}/>}
                      </div>
                      <div className="flex-1">
                        <input 
                          className="bg-transparent border-none outline-none font-bold text-slate-800 w-full"
                          value={item.title}
                          onChange={(e) => setLocalProject({...localProject, knowledgeBase: localProject.knowledgeBase.map(i => i.id === item.id ? {...i, title: e.target.value} : i)})}
                        />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{item.type} • {item.fileSize || 'Manual'}</p>
                      </div>
                      <button onClick={() => setLocalProject({...localProject, knowledgeBase: localProject.knowledgeBase.filter(i => i.id !== item.id)})} className="p-2 text-slate-500 hover:text-pink-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
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

          {activeTab === 'qr' && (
            <QRCodeSection 
              projectId={id}
              projectName={localProject.name}
              complexLink={complexLink}
              qrImageUrl={qrImageUrl}
            />
          )}

          {activeTab === 'config' && (
            <div className="space-y-8">
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
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    >
                      <option value="tongtong">童童 (甜美女声)</option>
                      <option value="xiaoxiao">小小 (活泼女声)</option>
                      <option value="xiaochen">小陈 (专业男声)</option>
                      <option value="xiaoming">小明 (亲切男声)</option>
                      <option value="xiaoli">小丽 (温柔女声)</option>
                      <option value="xiaowang">小王 (稳重男声)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      选择AI语音合成的音色风格
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
              </div>
            </div>
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

const TabButton = ({ id, labelZh, labelEn, active, onClick, icon }: any) => (
  <button 
    onClick={() => onClick(id)} 
    className={`flex items-center gap-3 px-8 py-3 rounded-[2rem] font-bold text-sm transition-all duration-500 ${
      active 
        ? 'purple-gradient-btn text-white shadow-xl scale-105' 
        : 'text-slate-600 hover:text-slate-900'
    }`}
  >
    {icon}
    <div className="flex flex-col items-start leading-none">
      <span className="text-[11px] font-black">{labelZh}</span>
      <span className="text-[9px] opacity-60 uppercase font-black tracking-tighter">{labelEn}</span>
    </div>
  </button>
);

export default ProjectDetail;