import React from 'react';

const SkeletonScreen: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 欢迎消息骨架 */}
      <div className="flex justify-start">
        <div className="max-w-xs bg-slate-200 rounded-2xl rounded-bl-md p-4 space-y-2">
          <div className="h-4 bg-slate-300 rounded w-3/4"></div>
          <div className="h-4 bg-slate-300 rounded w-full"></div>
          <div className="h-4 bg-slate-300 rounded w-2/3"></div>
        </div>
      </div>
      
      {/* 快捷按钮骨架 */}
      <div className="flex flex-wrap gap-2 px-4">
        <div className="h-10 bg-slate-200 rounded-full w-24"></div>
        <div className="h-10 bg-slate-200 rounded-full w-20"></div>
        <div className="h-10 bg-slate-200 rounded-full w-28"></div>
      </div>
      
      {/* 输入框骨架 */}
      <div className="p-4">
        <div className="h-12 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>
  );
};

export default SkeletonScreen;