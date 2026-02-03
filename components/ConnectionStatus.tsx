import React from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'degraded';
  onRetry?: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, onRetry }) => {
  if (status === 'connected') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'disconnected':
        return {
          icon: <WifiOff size={16} />,
          text: '连接已断开',
          bgColor: 'bg-red-500',
          textColor: 'text-white'
        };
      case 'reconnecting':
        return {
          icon: <Wifi size={16} className="animate-pulse" />,
          text: '正在重连...',
          bgColor: 'bg-yellow-500',
          textColor: 'text-white'
        };
      case 'degraded':
        return {
          icon: <AlertTriangle size={16} />,
          text: '网络不稳定，已切换到基础模式',
          bgColor: 'bg-amber-500',
          textColor: 'text-white'
        };
      default:
        return {
          icon: <WifiOff size={16} />,
          text: '网络异常',
          bgColor: 'bg-gray-500',
          textColor: 'text-white'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.bgColor} ${config.textColor} px-4 py-2 flex items-center justify-between text-sm font-medium`}>
      <div className="flex items-center gap-2">
        {config.icon}
        <span>{config.text}</span>
      </div>
      {onRetry && status === 'disconnected' && (
        <button 
          onClick={onRetry}
          className="text-white underline text-sm hover:no-underline"
        >
          重试
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;