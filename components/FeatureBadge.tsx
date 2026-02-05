import React from 'react';
import { AlertTriangle, CheckCircle, Construction } from 'lucide-react';

export type FeatureStatus = 'real' | 'simulated' | 'coming-soon';

interface FeatureBadgeProps {
  status: FeatureStatus;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({
  status,
  text,
  size = 'sm'
}) => {
  const config = {
    real: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      label: '已实现',
      iconColor: 'text-green-600'
    },
    simulated: {
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      label: '模拟数据',
      iconColor: 'text-amber-600'
    },
    'coming-soon': {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Construction,
      label: '开发中',
      iconColor: 'text-blue-600'
    }
  };

  const { color, icon: Icon, label, iconColor } = config[status];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${color} ${sizeClasses[size]}`}>
      <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} className={iconColor} />
      <span className="font-medium">{text || label}</span>
    </span>
  );
};

export default FeatureBadge;
