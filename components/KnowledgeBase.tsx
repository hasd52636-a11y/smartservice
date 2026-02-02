import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, FileText, BookOpen, Trash2, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { aiService } from '../services/aiService';
import { ZhipuModel } from '../services/aiService';
import { KnowledgeType } from '../types';

interface GlobalKnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: KnowledgeType;
  embedding?: number[];
  createdAt: string;
  tags?: string[];
  vectorized: boolean;
}

interface SearchResult {
  doc: GlobalKnowledgeDocument;
  score: number;
}

const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<GlobalKnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newDocument, setNewDocument] = useState({ title: '', content: '' });
  const [message, setMessage] = useState({ type: 'info' as 'info' | 'success' | 'error', text: '' });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化示例文档
  useEffect(() => {
    const sampleDocs: GlobalKnowledgeDocument[] = [
      {
        id: 'global_1',
        title: '虚拟客服系统使用指南',
        content: '本虚拟客服系统基于智谱AI技术，为用户提供智能产品服务支持。支持文字对话、语音交互、图片分析、视频客服、OCR识别等功能。',
        type: KnowledgeType.TEXT,
        createdAt: new Date().toISOString(),
        tags: ['系统', '使用指南'],
        vectorized: false
      },
      {
        id: 'global_2',
        title: '常见问题解答',
        content: 'Q: 如何扫描二维码？A: 使用手机相机或微信扫一扫功能。Q: 语音功能无法使用怎么办？A: 请检查浏览器麦克风权限设置。',
        type: KnowledgeType.TEXT,
        createdAt: new Date().toISOString(),
        tags: ['FAQ', '常见问题'],
        vectorized: false
      }
    ];
    setDocuments(sampleDocs);
  }, []);

  const showMessage = (type: 'info' | 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: 'info', text: '' }), 3000);
  };

  const handleAddDocument = () => {
    if (!newDocument.title.trim() || !newDocument.content.trim()) {
      showMessage('error', '请填写标题和内容');
      return;
    }

    const newDoc: GlobalKnowledgeDocument = {
      id: `global_${Date.now()}`,
      title: newDocument.title,
      content: newDocument.content,
      type: KnowledgeType.TEXT,
      createdAt: new Date().toISOString(),
      vectorized: false
    };
    
    setDocuments(prev => [...prev, newDoc]);
    setNewDocument({ title: '', content: '' });
    setShowAddForm(false);
    showMessage('success', '文档添加成功');
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm('确定要删除这个文档吗？')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      showMessage('success', '文档删除成功');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results.map(doc => ({ doc, score: 1.0 })));
    } catch (error) {
      console.error('搜索失败:', error);
      showMessage('error', '搜索失败');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    setUploadStatus('正在读取文件...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setNewDocument({
        title: file.name,
        content: content
      });
      setShowAddForm(true);
      setUploadProgress(100);
      setUploadStatus('文件读取完成');
      
      setTimeout(() => {
        setUploadProgress(null);
        setUploadStatus('');
      }, 1000);
    };
    
    reader.onerror = () => {
      setUploadStatus('文件读取失败');
      setTimeout(() => {
        setUploadProgress(null);
        setUploadStatus('');
      }, 2000);
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a103d] to-[#2d1b69] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-4">全局知识库管理</h1>
          <p className="text-slate-300">管理全局知识库，为所有产品提供通用知识支持</p>
        </div>

        {/* 消息提示 */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
            message.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}>
            {message.type === 'success' && <CheckCircle size={20} />}
            {message.type === 'error' && <AlertCircle size={20} />}
            {message.type === 'info' && <Loader2 size={20} className="animate-spin" />}
            {message.text}
          </div>
        )}

        {/* 操作栏 */}
        <div className="glass-card p-6 rounded-[2rem] border border-slate-200 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="搜索知识库..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium disabled:opacity-50"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : '搜索'}
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <Upload size={18} />
                上传文件
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
              >
                <Plus size={18} />
                添加文档
              </button>
            </div>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.md,.json"
            className="hidden"
          />
        </div>

        {/* 上传进度 */}
        {uploadProgress !== null && (
          <div className="glass-card p-6 rounded-[2rem] border border-slate-200 mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">
                {uploadedFile?.name || '文件上传'}
              </span>
              <span className="text-sm font-medium text-violet-600">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-violet-400 to-violet-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{uploadStatus}</p>
          </div>
        )}

        {/* 添加文档表单 */}
        {showAddForm && (
          <div className="glass-card p-8 rounded-[2rem] border border-slate-200 mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">添加新文档</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">文档标题</label>
                <input
                  type="text"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  placeholder="请输入文档标题..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">文档内容</label>
                <textarea
                  value={newDocument.content}
                  onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                  className="w-full h-40 px-4 py-3 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  placeholder="请输入文档内容..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddDocument}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                >
                  保存文档
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewDocument({ title: '', content: '' });
                  }}
                  className="px-6 py-3 bg-slate-500 text-white rounded-xl hover:bg-slate-600 transition-colors font-medium"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        {searchResults.length > 0 && (
          <div className="glass-card p-8 rounded-[2rem] border border-slate-200 mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">搜索结果 ({searchResults.length})</h3>
            <div className="space-y-4">
              {searchResults.map(({ doc }) => (
                <div key={doc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800">{doc.title}</h4>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {doc.content.substring(0, 200)}...
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
                          {doc.type}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 文档列表 */}
        <div className="glass-card p-8 rounded-[2rem] border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">全局知识库文档 ({documents.length})</h3>
            <div className="text-sm text-slate-500">
              向量化: {documents.filter(d => d.vectorized).length} / {documents.length}
            </div>
          </div>
          
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-6 bg-slate-50 rounded-xl border border-slate-200 group hover:border-violet-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={20} className="text-violet-600" />
                      <h4 className="font-bold text-slate-800">{doc.title}</h4>
                      {doc.vectorized && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          已向量化
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-3">
                      {doc.content.substring(0, 300)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>类型: {doc.type}</span>
                      <span>创建: {new Date(doc.createdAt).toLocaleDateString()}</span>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex gap-1">
                          {doc.tags.map(tag => (
                            <span key={tag} className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {documents.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={48} className="text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">暂无文档，点击上方按钮添加文档</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;