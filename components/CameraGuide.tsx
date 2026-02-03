import React from 'react';
import { Camera, X } from 'lucide-react';

interface CameraGuideProps {
  isVisible: boolean;
  onClose: () => void;
  onCapture: () => void;
}

const CameraGuide: React.FC<CameraGuideProps> = ({ isVisible, onClose, onCapture }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="relative w-full h-full">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white"
        >
          <X size={24} />
        </button>

        {/* 拍照引导框 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* 半透明遮罩 */}
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            
            {/* 中央透明区域 */}
            <div className="w-80 h-60 border-2 border-white border-dashed rounded-lg bg-transparent relative">
              {/* 四个角的装饰 */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-violet-400 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-violet-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-violet-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-violet-400 rounded-br-lg"></div>
              
              {/* 中央提示 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera size={32} className="mx-auto mb-2 text-violet-400" />
                  <p className="text-sm font-medium">请将产品名牌放入框内</p>
                  <p className="text-xs opacity-75 mt-1">确保文字清晰可见</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部拍照按钮 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={onCapture}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
          </button>
        </div>

        {/* 顶部提示 */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2">
            <p className="text-white text-sm font-medium">📱 拍摄产品铭牌或说明书</p>
            <p className="text-white text-xs opacity-75">AI将自动识别文字内容</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraGuide;