import React, { useState } from 'react';
import { ProductProject, UICustomization } from '../types';
import { Monitor, Eye, EyeOff, Palette, Sparkles, Moon, Sun, Zap, Check, Wand2, Upload, Loader2 } from 'lucide-react';
import { aiService } from '../services/aiService';

interface UICustomizerProps {
  project: ProductProject;
  onUpdate: (project: ProductProject) => void;
}

const UICustomizer: React.FC<UICustomizerProps> = ({ project, onUpdate }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  
  // AI生图相关状态
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [bannerPrompt, setBannerPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // 添加CSS动画样式
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes glow {
        from { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
        to { box-shadow: 0 0 30px rgba(0, 255, 255, 0.8), 0 0 40px rgba(0, 255, 255, 0.3); }
      }
      @keyframes wave {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(1deg); }
        75% { transform: rotate(-1deg); }
      }
      @keyframes swirl {
        0% { transform: rotate(0deg) scale(1); }
        25% { transform: rotate(2deg) scale(1.02); }
        50% { transform: rotate(0deg) scale(1); }
        75% { transform: rotate(-2deg) scale(0.98); }
        100% { transform: rotate(0deg) scale(1); }
      }
      .message-ship {
        position: relative;
      }
      .message-ship::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid currentColor;
        opacity: 0.7;
      }
      .message-cloud::before {
        content: '';
        position: absolute;
        top: -8px;
        left: 10px;
        width: 15px;
        height: 15px;
        background: currentColor;
        border-radius: 50%;
        opacity: 0.3;
      }
      .message-cloud::after {
        content: '';
        position: absolute;
        top: -5px;
        left: 20px;
        width: 10px;
        height: 10px;
        background: currentColor;
        border-radius: 50%;
        opacity: 0.2;
      }
      .message-vangogh::before {
        content: '';
        position: absolute;
        top: -3px;
        right: -3px;
        width: 8px;
        height: 8px;
        background: radial-gradient(circle, #fbbf24, transparent);
        border-radius: 50%;
        opacity: 0.6;
        animation: swirl 4s ease-in-out infinite;
      }
      .message-vangogh::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: -2px;
        width: 6px;
        height: 6px;
        background: radial-gradient(circle, #1e40af, transparent);
        border-radius: 50%;
        opacity: 0.4;
        animation: swirl 3s ease-in-out infinite reverse;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 多组默认配置模板 - 增强版
  const defaultTemplates: { [key: string]: { 
    name: string; 
    description: string; 
    icon: React.ReactNode; 
    config: Partial<UICustomization> & {
      // 扩展属性用于特殊样式
      specialStyles?: {
        messageShape?: 'default' | 'bubble' | 'ship' | 'dolphin' | 'crystal' | 'neon' | 'paper' | 'cloud';
        backgroundPattern?: 'none' | 'dots' | 'waves' | 'stars' | 'grid' | 'sakura' | 'circuit';
        glassEffect?: boolean;
        shadowEffect?: 'none' | 'soft' | 'hard' | 'neon' | 'paper';
        animation?: 'none' | 'float' | 'pulse' | 'glow' | 'bounce' | 'wave';
      }
    }
  } } = {
    modern: {
      name: '现代简约',
      description: '毛玻璃质感的现代设计',
      icon: <Sparkles size={16} />,
      config: {
        backgroundType: 'gradient',
        backgroundGradient: {
          from: '#f8fafc',
          to: '#e2e8f0',
          direction: 'to-br'
        },
        fontFamily: 'system',
        fontSize: 'base',
        fontWeight: 'normal',
        primaryColor: '#3b82f6',
        textColor: '#1e293b',
        userMessageBg: '#3b82f6',
        userMessageText: '#ffffff',
        aiMessageBg: 'rgba(241, 245, 249, 0.8)',
        aiMessageText: '#1e293b',
        messageBorderRadius: 'lg',
        userAvatar: { type: 'emoji', value: '👤', bgColor: '#3b82f6', textColor: '#ffffff' },
        aiAvatar: { type: 'emoji', value: '🤖', bgColor: '#8b5cf6', textColor: '#ffffff' },
        inputBg: 'rgba(248, 250, 252, 0.8)',
        inputBorder: '#d1d5db',
        buttonPrimary: '#3b82f6',
        enableAnimations: true,
        messageAnimation: 'slide',
        specialStyles: {
          messageShape: 'bubble',
          glassEffect: true,
          shadowEffect: 'soft',
          animation: 'float'
        }
      }
    },
    dark: {
      name: '深色主题',
      description: '霓虹发光的暗黑风格',
      icon: <Moon size={16} />,
      config: {
        backgroundType: 'gradient',
        backgroundGradient: {
          from: '#0f172a',
          to: '#1e293b',
          direction: 'to-br'
        },
        fontFamily: 'system',
        fontSize: 'base',
        fontWeight: 'normal',
        primaryColor: '#8b5cf6',
        textColor: '#f1f5f9',
        userMessageBg: '#8b5cf6',
        userMessageText: '#ffffff',
        aiMessageBg: '#1e293b',
        aiMessageText: '#f1f5f9',
        messageBorderRadius: 'xl',
        userAvatar: { type: 'emoji', value: '😊', bgColor: '#8b5cf6', textColor: '#ffffff' },
        aiAvatar: { type: 'emoji', value: '✨', bgColor: '#06b6d4', textColor: '#ffffff' },
        inputBg: '#1e293b',
        inputBorder: '#8b5cf6',
        buttonPrimary: '#8b5cf6',
        enableAnimations: true,
        messageAnimation: 'fade',
        specialStyles: {
          messageShape: 'neon',
          backgroundPattern: 'grid',
          shadowEffect: 'neon',
          animation: 'glow'
        }
      }
    },
    vibrant: {
      name: '活力彩色',
      description: '气泡形状的活力设计',
      icon: <Zap size={16} />,
      config: {
        backgroundType: 'gradient',
        backgroundGradient: {
          from: '#fef3c7',
          to: '#fde68a',
          direction: 'to-br'
        },
        fontFamily: 'system',
        fontSize: 'base',
        fontWeight: 'medium',
        primaryColor: '#f59e0b',
        textColor: '#92400e',
        userMessageBg: '#f59e0b',
        userMessageText: '#ffffff',
        aiMessageBg: '#ffffff',
        aiMessageText: '#92400e',
        messageBorderRadius: 'full',
        userAvatar: { type: 'emoji', value: '🌟', bgColor: '#f59e0b', textColor: '#ffffff' },
        aiAvatar: { type: 'emoji', value: '🎨', bgColor: '#ef4444', textColor: '#ffffff' },
        inputBg: '#ffffff',
        inputBorder: '#f59e0b',
        buttonPrimary: '#ef4444',
        enableAnimations: true,
        messageAnimation: 'bounce',
        specialStyles: {
          messageShape: 'bubble',
          backgroundPattern: 'dots',
          shadowEffect: 'soft',
          animation: 'bounce'
        }
      }
    },
    scifi: {
      name: '科幻未来',
      description: '电路板背景的赛博朋克',
      icon: '🚀',
      config: {
        backgroundType: 'gradient',
        backgroundGradient: {
          from: '#0c0c0c',
          to: '#1a0033',
          direction: 'to-br'
        },
        fontFamily: 'mono',
        fontSize: 'sm',
        fontWeight: 'medium',
        primaryColor: '#00ffff',
        textColor: '#00ffff',
        userMessageBg: 'linear-gradient(135deg, #00ffff, #0080ff)',
        userMessageText: '#000000',
        aiMessageBg: 'rgba(26, 0, 51, 0.8)',
        aiMessageText: '#00ffff',
        messageBorderRadius: 'none',
        userAvatar: { type: 'emoji', value: '🦾', bgColor: '#00ffff', textColor: '#000000' },
        aiAvatar: { type: 'emoji', value: '🤖', bgColor: '#ff00ff', textColor: '#000000' },
        inputBg: 'rgba(12, 12, 12, 0.8)',
        inputBorder: '#00ffff',
        buttonPrimary: '#ff00ff',
        enableAnimations: true,
        messageAnimation: 'fade',
        specialStyles: {
          messageShape: 'neon',
          backgroundPattern: 'circuit',
          shadowEffect: 'neon',
          animation: 'glow'
        }
      }
    },
    crystal: {
      name: '水晶透明',
      description: '钻石切面的水晶质感',
      icon: '💎',
      config: {
        backgroundType: 'gradient',
        backgroundGradient: {
          from: '#f0f9ff',
          to: '#e0f2fe',
          direction: 'to-br'
        },
        fontFamily: 'system',
        fontSize: 'base',
        fontWeight: 'normal',
        primaryColor: '#0ea5e9',
        textColor: '#0c4a6e',
        userMessageBg: 'rgba(14, 165, 233, 0.2)',
        userMessageText: '#0c4a6e',
        aiMessageBg: 'rgba(255, 255, 255, 0.3)',
        aiMessageText: '#0c4a6e',
        messageBorderRadius: 'xl',
        userAvatar: { type: 'emoji', value: '💎', bgColor: '#0ea5e9', textColor: '#ffffff' },
        aiAvatar: { type: 'emoji', value: '🔮', bgColor: '#38bdf8', textColor: '#ffffff' },
        inputBg: 'rgba(255, 255, 255, 0.4)',
        inputBorder: '#0ea5e9',
        buttonPrimary: '#0ea5e9',
        enableAnimations: true,
        messageAnimation: 'slide',
        specialStyles: {
          messageShape: 'crystal',
          glassEffect: true,
          shadowEffect: 'soft',
          animation: 'float'
        }
      }
    },
    festive: {
      name: '喜庆红火',
      description: '纸质质感的中国风',
      icon: '🧧',
      config: {
        backgroundType: 'gradient',
        backgroundGradient: {
          from: '#fef2f2',
          to: '#fecaca',
          direction: 'to-br'
        },
        fontFamily: 'serif',
        fontSize: 'lg',
        fontWeight: 'bold',
        primaryColor: '#dc2626',
        textColor: '#7f1d1d',
        userMessageBg: '#dc2626',
        userMessageText: '#ffffff',
        aiMessageBg: 'rgba(254, 242, 242, 0.9)',
        aiMessageText: '#7f1d1d',
        messageBorderRadius: 'lg',
        userAvatar: { type: 'emoji', value: '福', bgColor: '#dc2626', textColor: '#ffffff' },
        aiAvatar: { type: 'emoji', value: '🏮', bgColor: '#dc2626', textColor: '#ffffff' },
        inputBg: '#fef2f2',
        inputBorder: '#dc2626',
        buttonPrimary: '#dc2626',
        enableAnimations: true,
        messageAnimation: 'bounce',
        specialStyles: {
          messageShape: 'paper',
          backgroundPattern: 'sakura',
          shadowEffect: 'paper',
          animation: 'float'
        }
      }
    },
    ocean: {
      name: '海滨度假',
      description: '船形对话框的海洋风',
      icon: '🏖️',
      config: {
        backgroundType: 'gradient',
        backgroundGradient: {
          from: '#f0fdfa',
          to: '#ccfbf1',
          direction: 'to-br'
        },
        fontFamily: 'system',
        fontSize: 'base',
        fontWeight: 'normal',
        primaryColor: '#0891b2',
        textColor: '#164e63',
        userMessageBg: 'linear-gradient(135deg, #0891b2, #06b6d4)',
        userMessageText: '#ffffff',
        aiMessageBg: 'rgba(255, 255, 255, 0.8)',
        aiMessageText: '#164e63',
        messageBorderRadius: 'full',
        userAvatar: { type: 'emoji', value: '🐚', bgColor: '#0891b2', textColor: '#ffffff' },
        aiAvatar: { type: 'emoji', value: '🐬', bgColor: '#06b6d4', textColor: '#ffffff' },
        inputBg: 'rgba(255, 255, 255, 0.8)',
        inputBorder: '#0891b2',
        buttonPrimary: '#0891b2',
        enableAnimations: true,
        messageAnimation: 'slide',
        specialStyles: {
          messageShape: 'ship',
          backgroundPattern: 'waves',
          shadowEffect: 'soft',
          animation: 'wave'
        }
      }
    },
    vangogh: {
      name: '梵高印象',
      description: '星空螺旋的水彩画风格',
      icon: '🎨',
      config: {
        backgroundType: 'gradient',
        backgroundGradient: {
          from: '#1e3a8a',
          to: '#fbbf24',
          direction: 'to-br'
        },
        fontFamily: 'serif',
        fontSize: 'lg',
        fontWeight: 'medium',
        primaryColor: '#fbbf24',
        textColor: '#1e3a8a',
        userMessageBg: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
        userMessageText: '#1e3a8a',
        aiMessageBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8, #1e40af)',
        aiMessageText: '#fbbf24',
        messageBorderRadius: 'lg',
        userAvatar: { type: 'emoji', value: '🌻', bgColor: '#fbbf24', textColor: '#1e3a8a' },
        aiAvatar: { type: 'emoji', value: '⭐', bgColor: '#1e40af', textColor: '#fbbf24' },
        inputBg: 'rgba(251, 191, 36, 0.1)',
        inputBorder: '#fbbf24',
        buttonPrimary: '#fbbf24',
        enableAnimations: true,
        messageAnimation: 'fade',
        specialStyles: {
          messageShape: 'cloud',
          backgroundPattern: 'stars',
          shadowEffect: 'soft',
          animation: 'float'
        }
      }
    },
    dream: {
      name: '梦境幻想',
      description: '云朵形状的梦幻设计',
      icon: '🌙',
      config: {
        backgroundType: 'gradient',
        backgroundGradient: {
          from: '#fdf4ff',
          to: '#f3e8ff',
          direction: 'to-br'
        },
        fontFamily: 'system',
        fontSize: 'base',
        fontWeight: 'normal',
        primaryColor: '#a855f7',
        textColor: '#581c87',
        userMessageBg: 'linear-gradient(135deg, #a855f7, #ec4899)',
        userMessageText: '#ffffff',
        aiMessageBg: 'rgba(243, 232, 255, 0.6)',
        aiMessageText: '#581c87',
        messageBorderRadius: 'full',
        userAvatar: { type: 'emoji', value: '🌙', bgColor: '#a855f7', textColor: '#ffffff' },
        aiAvatar: { type: 'emoji', value: '✨', bgColor: '#ec4899', textColor: '#ffffff' },
        inputBg: 'rgba(253, 244, 255, 0.8)',
        inputBorder: '#a855f7',
        buttonPrimary: '#a855f7',
        enableAnimations: true,
        messageAnimation: 'bounce',
        specialStyles: {
          messageShape: 'cloud',
          backgroundPattern: 'stars',
          shadowEffect: 'soft',
          animation: 'float'
        }
      }
    },
    anime: {
      name: '二次元',
      description: '樱花飘落的动漫风格',
      icon: '🌸',
      config: {
        backgroundType: 'gradient',
        backgroundGradient: {
          from: '#fef7ff',
          to: '#fce7f3',
          direction: 'to-br'
        },
        fontFamily: 'system',
        fontSize: 'base',
        fontWeight: 'medium',
        primaryColor: '#ec4899',
        textColor: '#831843',
        userMessageBg: 'linear-gradient(135deg, #ec4899, #f97316)',
        userMessageText: '#ffffff',
        aiMessageBg: 'rgba(252, 231, 243, 0.8)',
        aiMessageText: '#831843',
        messageBorderRadius: 'full',
        userAvatar: { type: 'emoji', value: '🌸', bgColor: '#ec4899', textColor: '#ffffff' },
        aiAvatar: { type: 'emoji', value: '🎀', bgColor: '#8b5cf6', textColor: '#ffffff' },
        inputBg: 'rgba(254, 247, 255, 0.8)',
        inputBorder: '#ec4899',
        buttonPrimary: '#ec4899',
        enableAnimations: true,
        messageAnimation: 'bounce',
        specialStyles: {
          messageShape: 'bubble',
          backgroundPattern: 'sakura',
          shadowEffect: 'soft',
          animation: 'float'
        }
      }
    }
  };

  // 应用模板配置
  const applyTemplate = async (templateKey: string) => {
    setIsApplying(true);
    setSelectedTemplate(templateKey);
    
    const template = defaultTemplates[templateKey];
    const updatedProject = {
      ...project,
      config: {
        ...project.config,
        uiCustomization: {
          ...project.config.uiCustomization,
          ...template.config
        }
      }
    };
    
    // 模拟应用过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onUpdate(updatedProject);
    setIsApplying(false);
    
    // 显示成功提示
    setTimeout(() => setSelectedTemplate(null), 2000);
  };

  // 自动保存配置的函数
  const autoSave = (updatedProject: ProductProject) => {
    onUpdate(updatedProject);
  };

  // AI生成横幅广告
  const generateBannerWithAI = async () => {
    if (!bannerPrompt.trim()) {
      alert('请输入横幅广告的描述');
      return;
    }

    setIsGeneratingBanner(true);
    try {
      // 确保API密钥已设置
      const savedApiKey = localStorage.getItem('zhipuApiKey');
      if (savedApiKey) {
        aiService.setZhipuApiKey(savedApiKey);
      }

      console.log('开始生成横幅广告...');
      console.log('提示词:', bannerPrompt);

      const result = await aiService.generateBannerImage(bannerPrompt, {
        width: 800,
        height: 200,
        style: 'realistic'
      });

      console.log('生成结果:', result);

      if (result.success && result.imageUrl) {
        setGeneratedImages(prev => [result.imageUrl!, ...prev]);
        console.log('图片生成成功:', result.imageUrl);
      } else {
        console.error('生成失败:', result.error);
        alert(result.error || '图片生成失败，请重试');
      }
    } catch (error) {
      console.error('AI生图失败:', error);
      alert('图片生成失败，请检查网络连接或API配置');
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  // 测试API连接
  const testApiConnection = async () => {
    const savedApiKey = localStorage.getItem('zhipuApiKey');
    if (!savedApiKey) {
      alert('请先设置智谱AI API密钥');
      return;
    }

    try {
      aiService.setZhipuApiKey(savedApiKey);
      const testResult = await aiService.testZhipuConnection();
      
      if (testResult.success) {
        alert(`API连接测试成功！${testResult.message}`);
      } else {
        alert(`API连接测试失败：${testResult.message}`);
      }
    } catch (error) {
      console.error('API测试失败:', error);
      alert('API连接测试失败，请检查密钥配置');
    }
  };

  // 使用生成的图片
  const useBannerImage = (imageUrl: string) => {
    const updatedProject = {
      ...project,
      config: {
        ...project.config,
        uiCustomization: {
          ...project.config.uiCustomization,
          bannerAd: {
            ...project.config.uiCustomization?.bannerAd,
            enabled: true,
            imageUrl: imageUrl,
            height: project.config.uiCustomization?.bannerAd?.height || 80,
            showCloseButton: project.config.uiCustomization?.bannerAd?.showCloseButton ?? true
          }
        }
      }
    };
    autoSave(updatedProject);
  };

  // 预览组件
  const PreviewChat = () => {
    const ui = project.config.uiCustomization;
    if (!ui) return null;

    // 获取特殊消息框样式
    const getSpecialMessageStyle = (isUser: boolean, specialStyles: any) => {
      const baseStyle: any = {};
      
      // 基础背景色
      if (isUser) {
        if (ui.userMessageBg?.includes('linear-gradient')) {
          baseStyle.background = ui.userMessageBg;
        } else {
          baseStyle.backgroundColor = ui.userMessageBg;
        }
        baseStyle.color = ui.userMessageText;
      } else {
        if (ui.aiMessageBg?.includes('linear-gradient')) {
          baseStyle.background = ui.aiMessageBg;
        } else {
          baseStyle.backgroundColor = ui.aiMessageBg;
        }
        baseStyle.color = ui.aiMessageText;
      }

      // 特殊形状样式
      switch (specialStyles?.messageShape) {
        case 'ship':
          baseStyle.clipPath = isUser 
            ? 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%, 15% 50%)'
            : 'polygon(15% 0%, 100% 0%, 85% 50%, 100% 100%, 15% 100%, 0% 50%)';
          baseStyle.padding = '12px 20px';
          break;
        case 'crystal':
          baseStyle.clipPath = 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)';
          baseStyle.backdropFilter = 'blur(10px)';
          baseStyle.border = '1px solid rgba(255, 255, 255, 0.2)';
          break;
        case 'neon':
          baseStyle.border = `2px solid ${isUser ? ui.userMessageBg : ui.primaryColor}`;
          baseStyle.boxShadow = `0 0 10px ${isUser ? ui.userMessageBg : ui.primaryColor}40`;
          break;
        case 'paper':
          baseStyle.boxShadow = '3px 3px 6px rgba(0,0,0,0.1)';
          baseStyle.border = '1px solid rgba(0,0,0,0.1)';
          break;
        case 'cloud':
          baseStyle.borderRadius = '25px';
          break;
        case 'vangogh':
          // 梵高风格：不规则边缘，水彩画效果
          baseStyle.borderRadius = '15px 25px 20px 18px';
          baseStyle.border = '2px solid rgba(251, 191, 36, 0.3)';
          baseStyle.position = 'relative';
          baseStyle.overflow = 'visible';
          break;
        case 'bubble':
        default:
          if (specialStyles?.glassEffect) {
            baseStyle.backdropFilter = 'blur(10px)';
            baseStyle.border = '1px solid rgba(255, 255, 255, 0.2)';
          }
          break;
      }

      // 阴影效果
      switch (specialStyles?.shadowEffect) {
        case 'neon':
          baseStyle.boxShadow = `0 0 20px ${isUser ? ui.userMessageBg : ui.primaryColor}60`;
          break;
        case 'paper':
          baseStyle.boxShadow = '2px 2px 4px rgba(0,0,0,0.1)';
          break;
        case 'watercolor':
          // 梵高水彩画阴影效果
          baseStyle.boxShadow = `
            0 4px 8px rgba(30, 58, 138, 0.2),
            0 2px 4px rgba(251, 191, 36, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `;
          baseStyle.filter = 'drop-shadow(1px 1px 2px rgba(30, 58, 138, 0.3))';
          break;
        case 'soft':
        default:
          baseStyle.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          break;
      }

      return baseStyle;
    };

    // 获取背景图案样式
    const getBackgroundPatternStyle = (specialStyles: any) => {
      const patternStyle: any = {};
      
      switch (specialStyles?.backgroundPattern) {
        case 'dots':
          patternStyle.backgroundImage = 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)';
          patternStyle.backgroundSize = '20px 20px';
          break;
        case 'waves':
          patternStyle.backgroundImage = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
          break;
        case 'stars':
          patternStyle.backgroundImage = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpolygon points='20 1 22 18 39 20 22 22 20 39 18 22 1 20 18 18'/%3E%3C/g%3E%3C/svg%3E")`;
          patternStyle.backgroundSize = '40px 40px';
          break;
        case 'sakura':
          patternStyle.backgroundImage = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ff69b4' fill-opacity='0.1'%3E%3Cpath d='M30 30m-8 0a8 8 0 1 1 16 0a8 8 0 1 1 -16 0'/%3E%3C/g%3E%3C/svg%3E")`;
          patternStyle.backgroundSize = '60px 60px';
          break;
        case 'circuit':
          patternStyle.backgroundImage = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2300ffff' fill-opacity='0.1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5z'/%3E%3C/g%3E%3C/svg%3E")`;
          patternStyle.backgroundSize = '40px 40px';
          break;
        case 'starry':
          // 梵高星空图案：螺旋星星和月亮
          patternStyle.backgroundImage = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.3'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3Ccircle cx='60' cy='15' r='1.5'/%3E%3Ccircle cx='45' cy='35' r='1'/%3E%3Ccircle cx='15' cy='50' r='1.5'/%3E%3Ccircle cx='65' cy='55' r='2'/%3E%3Ccircle cx='35' cy='65' r='1'/%3E%3Cpath d='M40 10 Q45 15 40 20 Q35 15 40 10' fill='%23fbbf24' fill-opacity='0.2'/%3E%3Cpath d='M70 40 Q75 45 70 50 Q65 45 70 40' fill='%23fbbf24' fill-opacity='0.2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
          patternStyle.backgroundSize = '80px 80px';
          patternStyle.backgroundPosition = '0 0, 40px 40px';
          break;
      }
      
      return patternStyle;
    };

    // 获取个性化样式
    const getCustomStyles = () => {
      const styles: any = {};

      // 背景样式
      if (ui.backgroundType === 'color') {
        styles.backgroundColor = ui.backgroundColor;
      } else if (ui.backgroundType === 'gradient') {
        styles.background = `linear-gradient(${ui.backgroundGradient.direction}, ${ui.backgroundGradient.from}, ${ui.backgroundGradient.to})`;
      } else if (ui.backgroundType === 'image' && ui.backgroundImage) {
        styles.backgroundImage = `url(${ui.backgroundImage})`;
        styles.backgroundSize = 'cover';
        styles.backgroundPosition = 'center';
      }

      return styles;
    };

    // 获取字体样式类名
    const getFontClasses = () => {
      const classes = [];
      
      // 字体大小
      switch (ui.fontSize) {
        case 'xs': classes.push('text-xs'); break;
        case 'sm': classes.push('text-sm'); break;
        case 'base': classes.push('text-base'); break;
        case 'lg': classes.push('text-lg'); break;
        case 'xl': classes.push('text-xl'); break;
      }

      // 字体粗细
      switch (ui.fontWeight) {
        case 'normal': classes.push('font-normal'); break;
        case 'medium': classes.push('font-medium'); break;
        case 'semibold': classes.push('font-semibold'); break;
        case 'bold': classes.push('font-bold'); break;
      }

      return classes.join(' ');
    };

    // 获取消息框圆角类名
    const getMessageBorderRadius = () => {
      switch (ui.messageBorderRadius) {
        case 'none': return 'rounded-none';
        case 'sm': return 'rounded-sm';
        case 'md': return 'rounded-md';
        case 'lg': return 'rounded-lg';
        case 'xl': return 'rounded-xl';
        case 'full': return 'rounded-full';
        default: return 'rounded-lg';
      }
    };

    // 渲染头像
    const renderAvatar = (isUser: boolean) => {
      const avatar = isUser ? ui.userAvatar : ui.aiAvatar;
      
      if (avatar.type === 'emoji') {
        return (
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: avatar.bgColor }}
          >
            {avatar.value}
          </div>
        );
      } else if (avatar.type === 'initials') {
        return (
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ 
              backgroundColor: avatar.bgColor,
              color: avatar.textColor 
            }}
          >
            {avatar.value}
          </div>
        );
      } else if (avatar.type === 'image') {
        return (
          <img 
            src={avatar.value} 
            alt={isUser ? 'User' : 'AI'} 
            className="w-8 h-8 rounded-full object-cover"
            onError={(e) => {
              // 图片加载失败时显示默认头像
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        );
      }

      return (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
          {isUser ? '👤' : '🤖'}
        </div>
      );
    };

    const sampleMessages = [
      { role: 'assistant' as const, text: project.config.welcomeMessage || `您好！我是 ${project.name} 的智能售后客服助手 🤖\n\n我可以帮您解决产品使用问题、安装指导等。` },
      { role: 'user' as const, text: '你好，我想了解一下产品的安装步骤' },
      { role: 'assistant' as const, text: '好的，我来为您详细介绍产品的安装步骤。首先请确认您已经准备好所有必要的工具和配件。' }
    ];

    return (
      <div 
        className={`w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden ${getFontClasses()} ${
          ui.specialStyles?.animation === 'float' ? 'animate-pulse' : ''
        } ${
          ui.specialStyles?.animation === 'glow' ? 'animate-pulse' : ''
        }`}
        style={{
          ...getCustomStyles(),
          ...getBackgroundPatternStyle(ui.specialStyles),
          color: ui.textColor || '#1e293b',
          animation: ui.specialStyles?.animation === 'float' ? 'float 3s ease-in-out infinite' : 
                    ui.specialStyles?.animation === 'glow' ? 'glow 2s ease-in-out infinite alternate' : 'none'
        }}
      >
        {/* 预览头部 */}
        <div className="bg-black/10 backdrop-blur-sm p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <div>
              <h3 className="font-bold text-sm">{project.name}</h3>
              <p className="text-xs opacity-70">智能客服助手</p>
            </div>
          </div>
        </div>

        {/* 消息区域 */}
        <div className="p-4 space-y-4 h-80 overflow-y-auto">
          {sampleMessages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* 头像 */}
                <div className="flex-shrink-0">
                  {renderAvatar(message.role === 'user')}
                </div>
                
                {/* 消息内容 */}
                <div 
                  className={`px-4 py-3 text-sm ${getMessageBorderRadius()} ${
                    message.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'
                  } ${ui.enableAnimations && ui.messageAnimation === 'bounce' ? 'animate-bounce' : ''} ${
                    ui.enableAnimations && ui.messageAnimation === 'fade' ? 'animate-pulse' : ''
                  }`}
                  style={{
                    ...getSpecialMessageStyle(message.role === 'user', ui.specialStyles)
                  }}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  
                  {/* 特殊形状装饰 */}
                  {ui.specialStyles?.messageShape === 'cloud' && (
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-current rounded-full opacity-30"></div>
                  )}
                  {ui.specialStyles?.messageShape === 'paper' && (
                    <div className="absolute top-0 right-0 w-0 h-0 border-l-4 border-b-4 border-l-transparent border-b-gray-200"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 输入区域 */}
        <div className="p-4 border-t border-white/10">
          <div className="relative">
            <input
              type="text"
              placeholder="输入消息..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: ui.inputBg || '#f8fafc',
                border: `1px solid ${ui.inputBorder || '#d1d5db'}`,
                color: ui.inputText || '#1f2937'
              }}
              disabled
            />
            <button 
              className="absolute right-2 top-2 p-2 rounded-lg text-white"
              style={{
                backgroundColor: ui.buttonPrimary || '#3b82f6'
              }}
              disabled
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 桌面端预览组件
  const DesktopPreviewChat = () => {
    const ui = project.config.uiCustomization;
    if (!ui) return null;

    // 获取特殊消息框样式（桌面端）
    const getSpecialMessageStyle = (isUser: boolean, specialStyles: any) => {
      const baseStyle: any = {};
      
      // 基础背景色
      if (isUser) {
        if (ui.userMessageBg?.includes('linear-gradient')) {
          baseStyle.background = ui.userMessageBg;
        } else {
          baseStyle.backgroundColor = ui.userMessageBg;
        }
        baseStyle.color = ui.userMessageText;
      } else {
        if (ui.aiMessageBg?.includes('linear-gradient')) {
          baseStyle.background = ui.aiMessageBg;
        } else {
          baseStyle.backgroundColor = ui.aiMessageBg;
        }
        baseStyle.color = ui.aiMessageText;
      }

      // 特殊形状样式
      switch (specialStyles?.messageShape) {
        case 'ship':
          baseStyle.clipPath = isUser 
            ? 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%, 15% 50%)'
            : 'polygon(15% 0%, 100% 0%, 85% 50%, 100% 100%, 15% 100%, 0% 50%)';
          baseStyle.padding = '16px 24px';
          break;
        case 'crystal':
          baseStyle.clipPath = 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)';
          baseStyle.backdropFilter = 'blur(10px)';
          baseStyle.border = '1px solid rgba(255, 255, 255, 0.2)';
          break;
        case 'neon':
          baseStyle.border = `2px solid ${isUser ? ui.userMessageBg : ui.primaryColor}`;
          baseStyle.boxShadow = `0 0 15px ${isUser ? ui.userMessageBg : ui.primaryColor}40`;
          break;
        case 'paper':
          baseStyle.boxShadow = '4px 4px 8px rgba(0,0,0,0.1)';
          baseStyle.border = '1px solid rgba(0,0,0,0.1)';
          break;
        case 'cloud':
          baseStyle.borderRadius = '30px';
          break;
        case 'vangogh':
          // 梵高风格：不规则边缘，水彩画效果
          baseStyle.borderRadius = '20px 30px 25px 22px';
          baseStyle.border = '2px solid rgba(251, 191, 36, 0.3)';
          baseStyle.position = 'relative';
          baseStyle.overflow = 'visible';
          break;
        case 'bubble':
        default:
          if (specialStyles?.glassEffect) {
            baseStyle.backdropFilter = 'blur(10px)';
            baseStyle.border = '1px solid rgba(255, 255, 255, 0.2)';
          }
          break;
      }

      // 阴影效果
      switch (specialStyles?.shadowEffect) {
        case 'neon':
          baseStyle.boxShadow = `0 0 25px ${isUser ? ui.userMessageBg : ui.primaryColor}60`;
          break;
        case 'paper':
          baseStyle.boxShadow = '3px 3px 6px rgba(0,0,0,0.1)';
          break;
        case 'watercolor':
          // 梵高水彩画阴影效果
          baseStyle.boxShadow = `
            0 6px 12px rgba(30, 58, 138, 0.2),
            0 3px 6px rgba(251, 191, 36, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `;
          baseStyle.filter = 'drop-shadow(2px 2px 4px rgba(30, 58, 138, 0.3))';
          break;
        case 'soft':
        default:
          baseStyle.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          break;
      }

      return baseStyle;
    };

    // 获取背景图案样式
    const getBackgroundPatternStyle = (specialStyles: any) => {
      const patternStyle: any = {};
      
      switch (specialStyles?.backgroundPattern) {
        case 'dots':
          patternStyle.backgroundImage = 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)';
          patternStyle.backgroundSize = '20px 20px';
          break;
        case 'waves':
          patternStyle.backgroundImage = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
          break;
        case 'stars':
          patternStyle.backgroundImage = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpolygon points='20 1 22 18 39 20 22 22 20 39 18 22 1 20 18 18'/%3E%3C/g%3E%3C/svg%3E")`;
          patternStyle.backgroundSize = '40px 40px';
          break;
        case 'sakura':
          patternStyle.backgroundImage = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ff69b4' fill-opacity='0.1'%3E%3Cpath d='M30 30m-8 0a8 8 0 1 1 16 0a8 8 0 1 1 -16 0'/%3E%3C/g%3E%3C/svg%3E")`;
          patternStyle.backgroundSize = '60px 60px';
          break;
        case 'circuit':
          patternStyle.backgroundImage = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2300ffff' fill-opacity='0.1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5z'/%3E%3C/g%3E%3C/svg%3E")`;
          patternStyle.backgroundSize = '40px 40px';
          break;
        case 'grid':
          patternStyle.backgroundImage = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v1H0V0zm0 39h40v1H0v-1zM1 0v40h1V0H1zm38 0v40h1V0h-1z'/%3E%3C/g%3E%3C/svg%3E")`;
          patternStyle.backgroundSize = '40px 40px';
          break;
        case 'starry':
          // 梵高星空图案：螺旋星星和月亮
          patternStyle.backgroundImage = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.3'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3Ccircle cx='60' cy='15' r='1.5'/%3E%3Ccircle cx='45' cy='35' r='1'/%3E%3Ccircle cx='15' cy='50' r='1.5'/%3E%3Ccircle cx='65' cy='55' r='2'/%3E%3Ccircle cx='35' cy='65' r='1'/%3E%3Cpath d='M40 10 Q45 15 40 20 Q35 15 40 10' fill='%23fbbf24' fill-opacity='0.2'/%3E%3Cpath d='M70 40 Q75 45 70 50 Q65 45 70 40' fill='%23fbbf24' fill-opacity='0.2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
          patternStyle.backgroundSize = '80px 80px';
          patternStyle.backgroundPosition = '0 0, 40px 40px';
          break;
      }
      
      return patternStyle;
    };

    // 获取个性化样式
    const getCustomStyles = () => {
      const styles: any = {};

      // 背景样式
      if (ui.backgroundType === 'color') {
        styles.backgroundColor = ui.backgroundColor;
      } else if (ui.backgroundType === 'gradient') {
        styles.background = `linear-gradient(${ui.backgroundGradient.direction}, ${ui.backgroundGradient.from}, ${ui.backgroundGradient.to})`;
      } else if (ui.backgroundType === 'image' && ui.backgroundImage) {
        styles.backgroundImage = `url(${ui.backgroundImage})`;
        styles.backgroundSize = 'cover';
        styles.backgroundPosition = 'center';
      }

      return styles;
    };

    // 获取字体样式类名
    const getFontClasses = () => {
      const classes = [];
      
      // 字体大小
      switch (ui.fontSize) {
        case 'xs': classes.push('text-xs'); break;
        case 'sm': classes.push('text-sm'); break;
        case 'base': classes.push('text-base'); break;
        case 'lg': classes.push('text-lg'); break;
        case 'xl': classes.push('text-xl'); break;
      }

      // 字体粗细
      switch (ui.fontWeight) {
        case 'normal': classes.push('font-normal'); break;
        case 'medium': classes.push('font-medium'); break;
        case 'semibold': classes.push('font-semibold'); break;
        case 'bold': classes.push('font-bold'); break;
      }

      return classes.join(' ');
    };

    // 获取消息框圆角类名
    const getMessageBorderRadius = () => {
      switch (ui.messageBorderRadius) {
        case 'none': return 'rounded-none';
        case 'sm': return 'rounded-sm';
        case 'md': return 'rounded-md';
        case 'lg': return 'rounded-lg';
        case 'xl': return 'rounded-xl';
        case 'full': return 'rounded-full';
        default: return 'rounded-lg';
      }
    };

    // 渲染头像
    const renderAvatar = (isUser: boolean) => {
      const avatar = isUser ? ui.userAvatar : ui.aiAvatar;
      
      if (avatar.type === 'emoji') {
        return (
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: avatar.bgColor }}
          >
            {avatar.value}
          </div>
        );
      } else if (avatar.type === 'initials') {
        return (
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ 
              backgroundColor: avatar.bgColor,
              color: avatar.textColor 
            }}
          >
            {avatar.value}
          </div>
        );
      } else if (avatar.type === 'image') {
        return (
          <img 
            src={avatar.value} 
            alt={isUser ? 'User' : 'AI'} 
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        );
      }

      return (
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
          {isUser ? '👤' : '🤖'}
        </div>
      );
    };

    const sampleMessages = [
      { role: 'assistant' as const, text: project.config.welcomeMessage || `您好！我是 ${project.name} 的智能售后客服助手 🤖\n\n我可以帮您解决产品使用问题、安装指导等。` },
      { role: 'user' as const, text: '你好，我想了解一下产品的安装步骤' },
      { role: 'assistant' as const, text: '好的，我来为您详细介绍产品的安装步骤。首先请确认您已经准备好所有必要的工具和配件。' },
      { role: 'user' as const, text: '我需要什么工具？' },
      { role: 'assistant' as const, text: '您需要准备：螺丝刀、扳手、水平仪。如果您有任何疑问，随时可以联系我们的技术支持。' }
    ];

    return (
      <div 
        className={`w-full bg-white rounded-3xl shadow-2xl overflow-hidden ${getFontClasses()}`}
        style={{
          ...getCustomStyles(),
          ...getBackgroundPatternStyle(ui.specialStyles),
          color: ui.textColor || '#1e293b',
          height: '500px'
        }}
      >
        {/* 桌面端头部 */}
        <div className="bg-black/10 backdrop-blur-sm p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">{project.name}</h3>
                <p className="text-sm opacity-70">智能客服助手 - 桌面版</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">在线</span>
            </div>
          </div>
        </div>

        {/* 桌面端消息区域 */}
        <div className="flex h-96">
          {/* 消息列表 */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {sampleMessages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-3 max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* 头像 */}
                  <div className="flex-shrink-0">
                    {renderAvatar(message.role === 'user')}
                  </div>
                  
                  {/* 消息内容 */}
                  <div 
                    className={`px-5 py-4 text-sm ${getMessageBorderRadius()} ${
                      message.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'
                    } ${ui.enableAnimations && ui.messageAnimation === 'bounce' ? 'animate-bounce' : ''} ${
                      ui.enableAnimations && ui.messageAnimation === 'fade' ? 'animate-pulse' : ''
                    } ${ui.specialStyles?.messageShape === 'ship' ? 'message-ship' : ''} ${
                      ui.specialStyles?.messageShape === 'cloud' ? 'message-cloud' : ''
                    } ${ui.specialStyles?.messageShape === 'vangogh' ? 'message-vangogh' : ''}`}
                    style={{
                      ...getSpecialMessageStyle(message.role === 'user', ui.specialStyles)
                    }}
                  >
                    <p className="whitespace-pre-line">{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 桌面端输入区域 */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="输入消息..."
                className="w-full px-6 py-4 rounded-2xl text-sm outline-none"
                style={{
                  backgroundColor: ui.inputBg || '#f8fafc',
                  border: `2px solid ${ui.inputBorder || '#d1d5db'}`,
                  color: ui.inputText || '#1f2937'
                }}
                disabled
              />
            </div>
            <button 
              className="px-6 py-4 rounded-2xl text-white font-medium"
              style={{
                backgroundColor: ui.buttonPrimary || '#3b82f6'
              }}
              disabled
            >
              发送
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* 模板选择区域 */}
      <div className="glass-card p-6 rounded-[3rem] border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="text-purple-600" size={24} />
          <div>
            <h4 className="text-xl font-bold text-slate-800">快速模板</h4>
            <p className="text-slate-600 mt-1">选择预设的设计模板，一键应用个性化配置</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Object.entries(defaultTemplates).map(([key, template]) => (
            <div
              key={key}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedTemplate === key && isApplying
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-200 hover:border-purple-300 hover:shadow-lg'
              }`}
              onClick={() => !isApplying && applyTemplate(key)}
            >
              <div className="flex flex-col items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg text-lg ${
                  key === 'modern' ? 'bg-blue-100 text-blue-600' :
                  key === 'dark' ? 'bg-gray-100 text-gray-600' :
                  key === 'vibrant' ? 'bg-orange-100 text-orange-600' :
                  key === 'scifi' ? 'bg-purple-100 text-purple-600' :
                  key === 'crystal' ? 'bg-cyan-100 text-cyan-600' :
                  key === 'festive' ? 'bg-red-100 text-red-600' :
                  key === 'ocean' ? 'bg-teal-100 text-teal-600' :
                  key === 'vangogh' ? 'bg-yellow-100 text-yellow-600' :
                  key === 'dream' ? 'bg-pink-100 text-pink-600' :
                  'bg-rose-100 text-rose-600'
                }`}>
                  {typeof template.icon === 'string' ? template.icon : template.icon}
                </div>
                <h5 className="font-bold text-slate-800 text-sm text-center">{template.name}</h5>
              </div>
              <p className="text-xs text-slate-600 mb-3 text-center leading-tight">{template.description}</p>
              
              {/* 模板预览色块 */}
              <div className="flex justify-center gap-1 mb-3">
                <div 
                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: template.config.primaryColor }}
                />
                <div 
                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: template.config.userMessageBg }}
                />
                <div 
                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: template.config.aiMessageBg }}
                />
              </div>
              
              {/* 应用状态 */}
              <div className="text-center">
                {selectedTemplate === key && isApplying ? (
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">应用中</span>
                  </div>
                ) : selectedTemplate === key ? (
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <Check size={12} />
                    <span className="text-xs font-medium">已应用</span>
                  </div>
                ) : (
                  <button className="text-xs font-medium text-purple-600 hover:text-purple-700">
                    点击应用
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 横幅广告配置 */}
      <div className="glass-card p-6 rounded-[3rem] border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
            <span className="text-white text-lg">📢</span>
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-800">横幅广告</h4>
            <p className="text-slate-600 mt-1">在对话页面顶部显示自定义横幅广告，用户发送消息后自动隐藏</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 启用横幅广告 */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-slate-700">启用横幅广告</label>
              <p className="text-xs text-slate-500 mt-1">在对话页面顶部显示横幅广告</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={project.config.uiCustomization?.bannerAd?.enabled || false}
                onChange={(e) => {
                  const updatedProject = {
                    ...project,
                    config: {
                      ...project.config,
                      uiCustomization: {
                        ...project.config.uiCustomization,
                        bannerAd: {
                          ...project.config.uiCustomization?.bannerAd,
                          enabled: e.target.checked,
                          imageUrl: project.config.uiCustomization?.bannerAd?.imageUrl || '',
                          height: project.config.uiCustomization?.bannerAd?.height || 80,
                          showCloseButton: project.config.uiCustomization?.bannerAd?.showCloseButton ?? true
                        }
                      }
                    }
                  };
                  autoSave(updatedProject);
                }}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {project.config.uiCustomization?.bannerAd?.enabled && (
            <>
              {/* AI生成横幅广告 */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Wand2 size={16} className="text-white" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800">AI智能生成</h5>
                    <p className="text-xs text-slate-600">使用智谱GLM-Image模型生成专业横幅广告</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* 提示词输入 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">广告描述</label>
                    <textarea
                      placeholder="例如：为智能家居产品设计一个现代简约风格的横幅广告，包含产品名称'SmartHome Pro'和'限时优惠8折'文字，使用蓝色和白色配色，添加科技感图标"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                      value={bannerPrompt}
                      onChange={(e) => setBannerPrompt(e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">详细描述您想要的横幅广告样式、内容和风格，AI将生成高质量的专业横幅</p>
                  </div>

                  {/* 生成按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={generateBannerWithAI}
                      disabled={isGeneratingBanner || !bannerPrompt.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                      {isGeneratingBanner ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          生成中...（约20秒）
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          AI生成横幅
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={testApiConnection}
                      className="px-4 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-medium"
                      title="测试API连接"
                    >
                      测试连接
                    </button>
                  </div>

                  {/* 生成的图片展示 */}
                  {generatedImages.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                        <label className="text-lg font-bold text-green-800">AI生成成功！</label>
                      </div>
                      
                      <div className="space-y-4">
                        {generatedImages.map((imageUrl, index) => (
                          <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            {/* 预览标题 */}
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="font-semibold text-slate-800">预览 #{index + 1}</h6>
                              <div className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                                AI生成 • 高清质量
                              </div>
                            </div>
                            
                            {/* 图片预览区域 */}
                            <div className="relative border-2 border-slate-300 rounded-2xl overflow-hidden shadow-lg bg-white mb-4">
                              {/* 立体边缘效果 */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-2xl"></div>
                              <div className="absolute inset-0 shadow-inner rounded-2xl pointer-events-none"></div>
                              
                              <img
                                src={imageUrl}
                                alt={`AI生成的横幅广告预览 ${index + 1}`}
                                className="w-full h-32 object-cover rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                onClick={() => window.open(imageUrl, '_blank')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden w-full h-32 bg-slate-100 flex items-center justify-center text-slate-500 rounded-2xl">
                                <div className="text-center">
                                  <div className="text-2xl mb-2">⚠️</div>
                                  <div>图片加载失败</div>
                                </div>
                              </div>
                              
                              {/* 点击提示 */}
                              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                                点击查看大图
                              </div>
                            </div>
                            
                            {/* 操作按钮区域 */}
                            <div className="flex gap-3">
                              <button
                                onClick={() => useBannerImage(imageUrl)}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2"
                              >
                                <span className="text-lg">✓</span>
                                确认使用此图片
                              </button>
                              <button
                                onClick={() => window.open(imageUrl, '_blank')}
                                className="px-4 py-3 bg-blue-100 text-blue-700 font-medium rounded-xl hover:bg-blue-200 transition-colors"
                              >
                                预览大图
                              </button>
                              <button
                                onClick={() => {
                                  setGeneratedImages(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="px-4 py-3 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-colors"
                              >
                                删除
                              </button>
                            </div>
                            
                            {/* 图片信息 */}
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="text-xs text-blue-700 space-y-1">
                                <div className="flex justify-between">
                                  <span>生成时间:</span>
                                  <span>{new Date().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>有效期:</span>
                                  <span>30天</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>质量:</span>
                                  <span>高清 (HD)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* 批量操作 */}
                      {generatedImages.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="flex gap-3">
                            <button
                              onClick={() => setGeneratedImages([])}
                              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              清空所有
                            </button>
                            <div className="text-xs text-slate-500 flex items-center">
                              共生成 {generatedImages.length} 张图片
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 手动输入图片URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">或手动输入图片URL</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="url"
                      placeholder="https://example.com/banner.jpg"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={project.config.uiCustomization?.bannerAd?.imageUrl || ''}
                      onChange={(e) => {
                        const updatedProject = {
                          ...project,
                          config: {
                            ...project.config,
                            uiCustomization: {
                              ...project.config.uiCustomization,
                              bannerAd: {
                                ...project.config.uiCustomization?.bannerAd,
                                enabled: project.config.uiCustomization?.bannerAd?.enabled || false,
                                imageUrl: e.target.value,
                                height: project.config.uiCustomization?.bannerAd?.height || 80,
                                showCloseButton: project.config.uiCustomization?.bannerAd?.showCloseButton ?? true
                              }
                            }
                          }
                        };
                        autoSave(updatedProject);
                      }}
                    />
                    <p className="text-xs text-slate-500 mt-1">推荐尺寸：1728x960像素（横幅比例）或1280x1280像素（正方形）</p>
                  </div>
                  
                  {/* 右侧预览和确认按钮 - 始终显示 */}
                  <div className="w-48 flex flex-col gap-2">
                    {/* 预览图区域 */}
                    <div className="relative border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-xl"></div>
                      
                      {project.config.uiCustomization?.bannerAd?.imageUrl ? (
                        <>
                          <img
                            src={project.config.uiCustomization.bannerAd.imageUrl}
                            alt="横幅预览"
                            className="w-full h-16 object-cover rounded-xl"
                            style={{ height: `${Math.min((project.config.uiCustomization.bannerAd.height || 80) * 0.6, 64)}px` }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-16 bg-slate-100 flex items-center justify-center text-slate-500 rounded-xl text-xs">
                            图片加载失败
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-16 bg-slate-50 flex items-center justify-center text-slate-400 rounded-xl">
                          <div className="text-center">
                            <div className="text-2xl mb-1">🖼️</div>
                            <div className="text-xs">输入URL预览</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 确认按钮 */}
                    <button
                      onClick={() => {
                        if (project.config.uiCustomization?.bannerAd?.imageUrl) {
                          // 图片URL已经通过onChange自动保存，显示确认提示
                          const notification = document.createElement('div');
                          notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                          notification.textContent = '横幅图片已应用';
                          document.body.appendChild(notification);
                          setTimeout(() => document.body.removeChild(notification), 2000);
                        } else {
                          // 没有图片URL时的提示
                          const notification = document.createElement('div');
                          notification.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                          notification.textContent = '请先输入图片URL';
                          document.body.appendChild(notification);
                          setTimeout(() => document.body.removeChild(notification), 2000);
                        }
                      }}
                      disabled={!project.config.uiCustomization?.bannerAd?.imageUrl}
                      className={`px-4 py-2 font-semibold rounded-lg transition-all text-sm ${
                        project.config.uiCustomization?.bannerAd?.imageUrl
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      ✓ 确认使用
                    </button>
                  </div>
                </div>
              </div>

              {/* 点击链接URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">点击链接URL（可选）</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="url"
                      placeholder="https://example.com/landing-page"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={project.config.uiCustomization?.bannerAd?.linkUrl || ''}
                      onChange={(e) => {
                        const updatedProject = {
                          ...project,
                          config: {
                            ...project.config,
                            uiCustomization: {
                              ...project.config.uiCustomization,
                              bannerAd: {
                                ...project.config.uiCustomization?.bannerAd,
                                enabled: project.config.uiCustomization?.bannerAd?.enabled || false,
                                imageUrl: project.config.uiCustomization?.bannerAd?.imageUrl || '',
                                linkUrl: e.target.value,
                                height: project.config.uiCustomization?.bannerAd?.height || 80,
                                showCloseButton: project.config.uiCustomization?.bannerAd?.showCloseButton ?? true
                              }
                            }
                          }
                        };
                        autoSave(updatedProject);
                      }}
                    />
                    <p className="text-xs text-slate-500 mt-1">用户点击横幅时跳转的链接</p>
                  </div>
                  
                  {/* 右侧链接预览和测试按钮 - 始终显示 */}
                  <div className="w-48 flex flex-col gap-2">
                    {/* 链接预览卡片 */}
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="text-xs text-blue-700 mb-2">链接预览:</div>
                      {project.config.uiCustomization?.bannerAd?.linkUrl ? (
                        <div className="text-xs text-blue-600 truncate" title={project.config.uiCustomization.bannerAd.linkUrl}>
                          {project.config.uiCustomization.bannerAd.linkUrl}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">
                          未设置链接
                        </div>
                      )}
                    </div>
                    
                    {/* 测试链接按钮 */}
                    <button
                      onClick={() => {
                        if (project.config.uiCustomization?.bannerAd?.linkUrl) {
                          window.open(project.config.uiCustomization.bannerAd.linkUrl, '_blank');
                        } else {
                          const notification = document.createElement('div');
                          notification.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                          notification.textContent = '请先输入链接URL';
                          document.body.appendChild(notification);
                          setTimeout(() => document.body.removeChild(notification), 2000);
                        }
                      }}
                      disabled={!project.config.uiCustomization?.bannerAd?.linkUrl}
                      className={`px-4 py-2 font-medium rounded-lg transition-colors text-sm ${
                        project.config.uiCustomization?.bannerAd?.linkUrl
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      🔗 测试链接
                    </button>
                  </div>
                </div>
              </div>

              {/* 横幅高度 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">横幅高度</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="60"
                    max="150"
                    step="10"
                    className="flex-1"
                    value={project.config.uiCustomization?.bannerAd?.height || 80}
                    onChange={(e) => {
                      const updatedProject = {
                        ...project,
                        config: {
                          ...project.config,
                          uiCustomization: {
                            ...project.config.uiCustomization,
                            bannerAd: {
                              ...project.config.uiCustomization?.bannerAd,
                              enabled: project.config.uiCustomization?.bannerAd?.enabled || false,
                              imageUrl: project.config.uiCustomization?.bannerAd?.imageUrl || '',
                              linkUrl: project.config.uiCustomization?.bannerAd?.linkUrl,
                              height: parseInt(e.target.value),
                              showCloseButton: project.config.uiCustomization?.bannerAd?.showCloseButton ?? true
                            }
                          }
                        }
                      };
                      autoSave(updatedProject);
                    }}
                  />
                  <span className="text-sm font-medium text-slate-600 min-w-[60px]">
                    {project.config.uiCustomization?.bannerAd?.height || 80}px
                  </span>
                </div>
              </div>

              {/* 显示关闭按钮 */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-700">显示关闭按钮</label>
                  <p className="text-xs text-slate-500 mt-1">允许用户手动关闭横幅广告</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={project.config.uiCustomization?.bannerAd?.showCloseButton ?? true}
                    onChange={(e) => {
                      const updatedProject = {
                        ...project,
                        config: {
                          ...project.config,
                          uiCustomization: {
                            ...project.config.uiCustomization,
                            bannerAd: {
                              ...project.config.uiCustomization?.bannerAd,
                              enabled: project.config.uiCustomization?.bannerAd?.enabled || false,
                              imageUrl: project.config.uiCustomization?.bannerAd?.imageUrl || '',
                              linkUrl: project.config.uiCustomization?.bannerAd?.linkUrl,
                              height: project.config.uiCustomization?.bannerAd?.height || 80,
                              showCloseButton: e.target.checked
                            }
                          }
                        }
                      };
                      autoSave(updatedProject);
                    }}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* 预览横幅 */}
              {project.config.uiCustomization?.bannerAd?.imageUrl && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">横幅预览</label>
                  <div className="relative border border-slate-200 rounded-2xl overflow-hidden shadow-lg bg-white">
                    {/* 立体边缘效果 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-2xl"></div>
                    <div className="absolute inset-0 shadow-inner rounded-2xl pointer-events-none"></div>
                    
                    <img
                      src={project.config.uiCustomization.bannerAd.imageUrl}
                      alt="横幅广告预览"
                      className="w-full object-cover rounded-2xl"
                      style={{ height: `${project.config.uiCustomization.bannerAd.height || 80}px` }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full bg-slate-100 flex items-center justify-center text-slate-500 rounded-2xl">
                      图片加载失败
                    </div>
                    {project.config.uiCustomization.bannerAd.showCloseButton && (
                      <button className="absolute top-3 right-3 w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-sm hover:bg-black/80 transition-all shadow-lg border border-white/20">
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 预览控制 */}
      <div className="glass-card p-6 rounded-[3rem] border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <Monitor className="text-purple-600" size={24} />
              实时预览
            </h4>
            <p className="text-slate-600 mt-1">查看个性化设置的实际效果</p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              showPreview 
                ? 'bg-purple-600 text-white' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
            {showPreview ? '隐藏预览' : '显示预览'}
          </button>
        </div>
      </div>

      {/* 预览窗口 */}
      {showPreview && (
        <div className="glass-card p-8 rounded-[3rem] border border-slate-200">
          <h4 className="text-lg font-bold text-slate-800 mb-6 text-center">用户对话界面预览</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 移动端预览 */}
            <div className="flex flex-col items-center">
              <h5 className="text-sm font-semibold text-slate-600 mb-4">移动端效果</h5>
              <div className="transform scale-90">
                <PreviewChat />
              </div>
            </div>
            
            {/* 桌面端预览 */}
            <div className="flex flex-col items-center">
              <h5 className="text-sm font-semibold text-slate-600 mb-4">桌面端效果</h5>
              <div className="transform scale-75 w-full max-w-2xl">
                <DesktopPreviewChat />
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center mt-6">
            这是用户扫码后看到的实际界面效果，所有个性化设置都会实时应用
          </p>
        </div>
      )}
    </div>
  );
};

export default UICustomizer;