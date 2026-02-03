import React, { useState } from 'react';
import { Star, X, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback?: string, resolved?: boolean) => void;
  projectName: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, projectName }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [resolved, setResolved] = useState<boolean | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, feedback, resolved || false);
      onClose();
      // 重置状态
      setRating(0);
      setFeedback('');
      setResolved(null);
      setHoveredStar(0);
    }
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredStar(starRating);
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return '很不满意';
      case 2: return '不满意';
      case 3: return '一般';
      case 4: return '满意';
      case 5: return '非常满意';
      default: return '请选择评分';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">服务评价</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-slate-600 mb-4">
            感谢使用 {projectName} 的智能客服服务！
          </p>
          <p className="text-sm text-slate-500">
            您的反馈将帮助我们改进服务质量
          </p>
        </div>

        {/* 问题解决状态 */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3">您的问题是否得到解决？</p>
          <div className="flex gap-3">
            <button
              onClick={() => setResolved(true)}
              className={`flex-1 p-3 rounded-xl border-2 transition-colors flex items-center justify-center gap-2 ${
                resolved === true 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-slate-200 hover:border-green-300'
              }`}
            >
              <ThumbsUp size={16} />
              <span className="text-sm font-medium">已解决</span>
            </button>
            <button
              onClick={() => setResolved(false)}
              className={`flex-1 p-3 rounded-xl border-2 transition-colors flex items-center justify-center gap-2 ${
                resolved === false 
                  ? 'border-red-500 bg-red-50 text-red-700' 
                  : 'border-slate-200 hover:border-red-300'
              }`}
            >
              <ThumbsDown size={16} />
              <span className="text-sm font-medium">未解决</span>
            </button>
          </div>
        </div>

        {/* 星级评分 */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3">请为本次服务评分：</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={`${
                    star <= (hoveredStar || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-slate-600">
            {getRatingText(hoveredStar || rating)}
          </p>
        </div>

        {/* 文字反馈 */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3">
            <MessageCircle size={16} className="inline mr-1" />
            其他建议或意见（可选）：
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="请分享您的使用体验或改进建议..."
            className="w-full p-3 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
          >
            跳过
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            提交评价
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center mt-4">
          您的评价数据将用于改进服务质量，不会泄露个人信息
        </p>
      </div>
    </div>
  );
};

export default FeedbackModal;