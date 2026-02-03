import React from 'react';
import { KnowledgeItem } from '../types';

interface QuickRepliesProps {
  knowledgeBase: KnowledgeItem[];
  onQuickReply: (text: string) => void;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ knowledgeBase, onQuickReply }) => {
  // 根据知识库生成快捷指令
  const generateQuickReplies = (): Array<{ text: string; emoji: string }> => {
    const commonQuestions = [
      { text: '如何安装', emoji: '🔧' },
      { text: '故障排查', emoji: '🔍' },
      { text: '使用说明', emoji: '📖' },
      { text: '联系客服', emoji: '📞' }
    ];

    // 基于知识库标题生成智能建议
    const knowledgeQuestions = knowledgeBase
      .slice(0, 3)
      .map(item => ({
        text: item.title.length > 8 ? item.title.substring(0, 8) + '...' : item.title,
        emoji: getEmojiForTitle(item.title)
      }));

    // 合并并去重，最多显示4个
    const allQuestions = [...knowledgeQuestions, ...commonQuestions];
    const uniqueQuestions = allQuestions.filter((item, index, self) => 
      index === self.findIndex(t => t.text === item.text)
    );

    return uniqueQuestions.slice(0, 4);
  };

  const getEmojiForTitle = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('安装') || lowerTitle.includes('install')) return '🔧';
    if (lowerTitle.includes('连接') || lowerTitle.includes('connect')) return '🔌';
    if (lowerTitle.includes('故障') || lowerTitle.includes('问题') || lowerTitle.includes('error')) return '⚠️';
    if (lowerTitle.includes('使用') || lowerTitle.includes('操作')) return '📱';
    if (lowerTitle.includes('维护') || lowerTitle.includes('保养')) return '🛠️';
    if (lowerTitle.includes('设置') || lowerTitle.includes('配置')) return '⚙️';
    return '💡';
  };

  const quickReplies = generateQuickReplies();

  if (quickReplies.length === 0) return null;

  return (
    <div className="px-4 py-2">
      <p className="text-xs text-slate-500 mb-2 font-medium">💬 猜你想问</p>
      <div className="flex flex-wrap gap-2">
        {quickReplies.map((reply, index) => (
          <button
            key={index}
            onClick={() => onQuickReply(reply.text)}
            className="inline-flex items-center gap-1 px-3 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-full text-sm font-medium transition-colors border border-violet-200 hover:border-violet-300"
          >
            <span>{reply.emoji}</span>
            <span>{reply.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickReplies;