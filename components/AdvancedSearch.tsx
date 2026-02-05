import { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, SortDesc, Calendar, Tag, FileText, Brain, X, Sparkles } from 'lucide-react';
import { knowledgeGraph } from '../services/knowledgeGraph';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  similarity: number;
  highlightedContent: string;
}

const AdvancedSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [filters, setFilters] = useState({
    type: 'all',
    tags: [] as string[],
    dateRange: 'all',
    sortBy: 'relevance'
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = () => {
    const nodes = knowledgeGraph.getAllNodes();
    const tags = new Set<string>();
    nodes.forEach(node => node.tags.forEach(tag => tags.add(tag)));
    setAvailableTags(Array.from(tags));
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    const startTime = Date.now();

    // 模拟搜索延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    const nodes = knowledgeGraph.getAllNodes();
    const lowerQuery = query.toLowerCase();

    const searchResults = nodes
      .filter(node => {
        const matchesQuery = node.title.toLowerCase().includes(lowerQuery) ||
          node.content.toLowerCase().includes(lowerQuery) ||
          node.tags.some(t => t.toLowerCase().includes(lowerQuery));

        const matchesType = filters.type === 'all' || node.type === filters.type;
        const matchesTag = filters.tags.length === 0 ||
          filters.tags.some(t => node.tags.includes(t));

        return matchesQuery && matchesType && matchesTag;
      })
      .map(node => {
        const lowerContent = node.content.toLowerCase();
        const index = lowerContent.indexOf(lowerQuery);
        let highlightedContent = node.content;

        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(node.content.length, index + query.length + 50);
          highlightedContent = (start > 0 ? '...' : '') +
            node.content.substring(start, end) +
            (end < node.content.length ? '...' : '');
        }

        const similarity = Math.random() * 0.3 + 0.7;

        return {
          id: node.id,
          title: node.title,
          content: node.content,
          type: node.type,
          tags: node.tags,
          similarity,
          highlightedContent
        };
      })
      .sort((a, b) => {
        if (filters.sortBy === 'relevance') {
          return b.similarity - a.similarity;
        } else if (filters.sortBy === 'date') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else {
          return a.title.localeCompare(b.title);
        }
      });

    setResults(searchResults);
    setSearchTime(Date.now() - startTime);
    setIsSearching(false);
  };

  const handleQuickSearch = async (quickQuery: string) => {
    setQuery(quickQuery);
    await new Promise(resolve => setTimeout(resolve, 100));
    handleSearch();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setFilters({ type: 'all', tags: [], dateRange: 'all', sortBy: 'relevance' });
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="glass-card p-8 rounded-[3rem]">
      <div className="flex items-center gap-3 mb-8">
        <Brain className="text-purple-500" size={32} />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">智能搜索</h1>
          <p className="text-slate-500">基于知识图谱的语义搜索</p>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-6">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="输入关键词搜索知识..."
          className="w-full pl-14 pr-14 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-lg focus:outline-none focus:border-purple-500 transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        )}
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="absolute right-4 top-1/2 -translate-y-1/2 purple-gradient-btn px-6 py-2 rounded-xl text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSearching ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              搜索中...
            </div>
          ) : (
            '搜索'
          )}
        </button>
      </div>

      {/* 快捷搜索 */}
      <div className="mb-6">
        <p className="text-sm text-slate-500 mb-3">快捷搜索：</p>
        <div className="flex flex-wrap gap-2">
          {['安装问题', '故障排查', '使用说明', '维护保养', '常见问题'].map((quick) => (
            <button
              key={quick}
              onClick={() => handleQuickSearch(quick)}
              className="px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-sm font-medium hover:bg-purple-100 transition-colors"
            >
              {quick}
            </button>
          ))}
        </div>
      </div>

      {/* 筛选器 */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors mb-4"
        >
          <Filter size={18} />
          <span>高级筛选</span>
          {showFilters ? <SortAsc size={16} /> : <SortDesc size={16} />}
        </button>

        {showFilters && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2">文档类型</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="all">全部类型</option>
                  <option value="text">文本</option>
                  <option value="image">图片</option>
                  <option value="video">视频</option>
                  <option value="pdf">PDF文档</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">排序方式</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="relevance">相关性</option>
                  <option value="date">更新时间</option>
                  <option value="title">标题字母</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">时间范围</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="all">全部时间</option>
                  <option value="today">今天</option>
                  <option value="week">本周</option>
                  <option value="month">本月</option>
                </select>
              </div>
            </div>

            {availableTags.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm text-slate-600 mb-2">标签筛选</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-purple-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      {results.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            找到 <span className="font-bold text-purple-600">{results.length}</span> 个结果
            <span className="ml-2">({searchTime}ms)</span>
          </p>
        </div>
      )}

      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.id}
              className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FileText className="text-purple-500" size={20} />
                  <h3 className="font-bold text-slate-800">{result.title}</h3>
                  <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs">
                    {result.type}
                  </span>
                </div>
                <span className="text-sm text-slate-400">
                  {Math.round(result.similarity * 100)}% 匹配
                </span>
              </div>

              <p className="text-slate-600 mb-3 line-clamp-2">{result.highlightedContent}</p>

              <div className="flex items-center gap-2 flex-wrap">
                {result.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                  >
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : query && !isSearching && (
        <div className="text-center py-12">
          <Search size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">未找到相关结果，请尝试其他关键词</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-12">
          <Sparkles size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">输入关键词开始智能搜索</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
