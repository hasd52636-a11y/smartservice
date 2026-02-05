import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, FileText, BookOpen, Trash2, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { aiService } from '../services/aiService';
import { ZhipuModel } from '../services/aiService';
import { KnowledgeType } from '../types';
import { knowledgeCallService } from '../services/knowledgeCallService';

interface GlobalKnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: KnowledgeType;
  embedding: number[];
  createdAt: string;
  tags?: string[];
  vectorized: boolean;
  version: number;
  category: string;
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
  const [newDocument, setNewDocument] = useState({ title: '', content: '', category: '未分类', version: 1 });
  const [message, setMessage] = useState({ type: 'info' as 'info' | 'success' | 'error', text: '' });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [vectorizationProgress, setVectorizationProgress] = useState<number | null>(null);
  const [vectorizationStatus, setVectorizationStatus] = useState<string>('');
  const [searchMode, setSearchMode] = useState<'text' | 'vector'>('text');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从localStorage加载数据
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const savedDocs = localStorage.getItem('knowledge_base_documents');
        if (savedDocs) {
          const parsedDocs = JSON.parse(savedDocs);
          setDocuments(parsedDocs);
        } else {
          // 初始化示例文档
          const sampleDocs: GlobalKnowledgeDocument[] = [
            {
              id: 'global_1',
              title: '虚拟客服系统使用指南',
              content: '本虚拟客服系统基于智谱AI技术，为用户提供智能产品服务支持。支持文字对话、语音交互、图片分析、视频客服、OCR识别等功能。',
              type: KnowledgeType.TEXT,
              embedding: Array(768).fill(0), // 占位向量
              createdAt: new Date().toISOString(),
              tags: ['系统', '使用指南'],
              vectorized: false,
              version: 1,
              category: '系统文档'
            },
            {
              id: 'global_2',
              title: '常见问题解答',
              content: 'Q: 如何扫描二维码？A: 使用手机相机或微信扫一扫功能。Q: 语音功能无法使用怎么办？A: 请检查浏览器麦克风权限设置。',
              type: KnowledgeType.TEXT,
              embedding: Array(768).fill(0), // 占位向量
              createdAt: new Date().toISOString(),
              tags: ['FAQ', '常见问题'],
              vectorized: false,
              version: 1,
              category: '用户指南'
            }
          ];
          setDocuments(sampleDocs);
          localStorage.setItem('knowledge_base_documents', JSON.stringify(sampleDocs));
        }
      } catch (error) {
        console.error('从localStorage加载数据失败:', error);
      }
    };

    loadFromLocalStorage();
  }, []);

  // 保存数据到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('knowledge_base_documents', JSON.stringify(documents));
    } catch (error) {
      console.error('保存数据到localStorage失败:', error);
    }
  }, [documents]);

  const showMessage = (type: 'info' | 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: 'info', text: '' }), 3000);
  };

  // 生成文档向量
  const createDocumentEmbedding = async (text: string): Promise<number[]> => {
    try {
      const embedding = await aiService.createEmbedding(text);
      return embedding;
    } catch (error) {
      console.error('生成向量失败:', error);
      return Array(768).fill(0);
    }
  };

  const handleAddDocument = async () => {
    if (!newDocument.title.trim() || !newDocument.content.trim()) {
      showMessage('error', '请填写标题和内容');
      return;
    }

    setIsVectorizing(true);
    setVectorizationStatus('正在向量化文档...');
    
    try {
      // 生成文档向量
      const embedding = await createDocumentEmbedding(newDocument.content);
      
      const newDoc: GlobalKnowledgeDocument = {
        id: `global_${Date.now()}`,
        title: newDocument.title,
        content: newDocument.content,
        type: KnowledgeType.TEXT,
        embedding: embedding,
        createdAt: new Date().toISOString(),
        vectorized: true,
        version: newDocument.version,
        category: newDocument.category
      };
      
      setDocuments(prev => [...prev, newDoc]);
      setNewDocument({ title: '', content: '', category: '未分类', version: 1 });
      setShowAddForm(false);
      showMessage('success', '文档添加成功，已完成向量化');
    } catch (error) {
      console.error('向量化失败:', error);
      // 即使向量化失败，也添加文档，但标记为未向量化
      const newDoc: GlobalKnowledgeDocument = {
        id: `global_${Date.now()}`,
        title: newDocument.title,
        content: newDocument.content,
        type: KnowledgeType.TEXT,
        embedding: Array(768).fill(0), // 占位向量
        createdAt: new Date().toISOString(),
        vectorized: false,
        version: newDocument.version,
        category: newDocument.category
      };
      setDocuments(prev => [...prev, newDoc]);
      setNewDocument({ title: '', content: '', category: '未分类', version: 1 });
      setShowAddForm(false);
      showMessage('success', '文档添加成功，但向量化失败');
    } finally {
      setIsVectorizing(false);
      setVectorizationStatus('');
    }
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm('确定要删除这个文档吗？')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      showMessage('success', '文档删除成功');
    }
  };

  // 计算两个向量之间的余弦相似度
  const calculateCosineSimilarity = (vec1: number[], vec2: number[]): number => {
    if (vec1.length !== vec2.length) {
      throw new Error('向量维度不一致');
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }
    
    return dotProduct / (norm1 * norm2);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const startTime = Date.now();
    try {
      if (searchMode === 'text') {
        // 文本搜索
        const results = documents.filter(doc => 
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const searchResults = results.map(doc => ({ doc, score: 1.0 }));
        setSearchResults(searchResults);
        
        // 记录知识库调用
        knowledgeCallService.recordCall(
          searchQuery,
          searchResults.map(({ doc }) => ({
            id: doc.id,
            title: doc.title,
            similarity: 1.0,
            content: doc.content
          })),
          Date.now() - startTime
        );
      } else {
        // 向量搜索
        const queryEmbedding = await createDocumentEmbedding(searchQuery);
        const results = documents
          .map(doc => {
            const similarity = calculateCosineSimilarity(queryEmbedding, doc.embedding);
            return { doc, score: similarity };
          })
          .filter(({ score }) => score > 0.3) // 过滤相似度低于0.3的结果
          .sort((a, b) => b.score - a.score); // 按相似度降序排序
        setSearchResults(results);
        
        // 记录知识库调用
        knowledgeCallService.recordCall(
          searchQuery,
          results.map(({ doc, score }) => ({
            id: doc.id,
            title: doc.title,
            similarity: score,
            content: doc.content
          })),
          Date.now() - startTime
        );
      }
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

  // AI文档摘要功能
  const handleAISummarize = async () => {
    if (documents.length === 0) {
      showMessage('error', '没有文档可以摘要');
      return;
    }

    setIsVectorizing(true);
    setVectorizationStatus('AI正在生成文档摘要...');

    try {
      // 选择最新的文档进行摘要
      const latestDoc = documents[documents.length - 1];
      
      // 调用AI服务生成摘要
      const summary = await aiService.summarizeDocument(latestDoc.content);
      
      // 显示摘要结果
      showMessage('success', `文档摘要生成成功：${summary.substring(0, 100)}...`);
      
      // 可以选择将摘要添加到文档中作为新的版本
      const updatedDoc = {
        ...latestDoc,
        content: `${latestDoc.content}\n\n# AI 摘要\n${summary}`,
        version: latestDoc.version + 1,
        vectorized: false, // 需要重新向量化
        embedding: Array(768).fill(0) // 占位向量
      };
      
      // 更新文档
      setDocuments(prev => prev.map(doc => doc.id === latestDoc.id ? updatedDoc : doc));
    } catch (error) {
      console.error('AI摘要失败:', error);
      showMessage('error', 'AI摘要失败，请重试');
    } finally {
      setIsVectorizing(false);
      setVectorizationStatus('');
    }
  };

  // AI自动分类功能
  const handleAICategorize = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    try {
      // 调用AI服务自动分类
      const defaultCategories = ['使用说明', '安装指南', '故障排查', '维护保养', '常见问题'];
      const category = await aiService.categorizeDocument(doc.content, defaultCategories);
      
      // 更新文档分类
      const updatedDoc = {
        ...doc,
        category,
        version: doc.version + 1
      };
      
      setDocuments(prev => prev.map(d => d.id === docId ? updatedDoc : d));
      showMessage('success', `文档已自动分类为：${category}`);
    } catch (error) {
      console.error('AI分类失败:', error);
      showMessage('error', 'AI分类失败，请重试');
    }
  };

  // AI关键词提取功能
  const handleAIKeywords = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    try {
      // 调用AI服务提取关键词
      const keywords = await aiService.extractKeywords(doc.content);
      
      // 更新文档标签
      const updatedDoc = {
        ...doc,
        tags: keywords,
        version: doc.version + 1
      };
      
      setDocuments(prev => prev.map(d => d.id === docId ? updatedDoc : d));
      showMessage('success', `关键词提取成功：${keywords.join(', ')}`);
    } catch (error) {
      console.error('关键词提取失败:', error);
      showMessage('error', '关键词提取失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a103d] to-[#2d1b69] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-4">全局知识库管理</h1>
          <p className="text-slate-300">管理全局知识库，为所有产品提供通用知识支持</p>

          {/* 标签页切换 */}
          <div className="flex gap-4 mt-6">
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-white text-purple-600 shadow-lg"
            >
              <BookOpen size={20} />
              文档管理
            </button>
          </div>
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
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchMode('text')}
                  className={`px-3 py-2 rounded-lg ${searchMode === 'text' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
                >
                  文本
                </button>
                <button
                  onClick={() => setSearchMode('vector')}
                  className={`px-3 py-2 rounded-lg ${searchMode === 'vector' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
                >
                  向量
                </button>
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium disabled:opacity-50"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : '搜索'}
              </button>
            </div>
            
            <div className="flex gap-3 flex-wrap">
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
              <button
                onClick={handleAISummarize}
                disabled={isVectorizing}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVectorizing ? <Loader2 size={18} className="animate-spin" /> : <BookOpen size={18} />}
                AI摘要
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">文档分类</label>
                  <select
                    value={newDocument.category}
                    onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    <option value="未分类">未分类</option>
                    <option value="系统文档">系统文档</option>
                    <option value="用户指南">用户指南</option>
                    <option value="API文档">API文档</option>
                    <option value="常见问题">常见问题</option>
                    <option value="技术博客">技术博客</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">版本号</label>
                  <input
                    type="number"
                    value={newDocument.version}
                    onChange={(e) => setNewDocument({ ...newDocument, version: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    placeholder="1"
                  />
                </div>
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
                    setNewDocument({ title: '', content: '', category: '未分类', version: 1 });
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
              {searchResults.map(({ doc, score }) => (
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
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {doc.category}
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          版本 {doc.version}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                        {searchMode === 'vector' && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                            相似度: {score.toFixed(2)}
                          </span>
                        )}
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
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <BookOpen size={12} />
                          已向量化
                        </span>
                      )}
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {doc.category}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        版本 {doc.version}
                      </span>
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

        {/* 知识图谱标签页 */}
        {/* 已移至独立页面 /admin/graph */}
      </div>
    </div>
  );
};

export default KnowledgeBase;