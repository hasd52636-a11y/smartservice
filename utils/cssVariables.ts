/**
 * CSS 变量动态映射工具
 * 用于将 UICustomization 配置转换为 CSS 变量
 */

import { UICustomization } from '../types';

/**
 * 将 UICustomization 转换为 CSS 变量对象
 */
export const mapUICustomizationToCSSVariables = (uiCustomization?: UICustomization): React.CSSProperties => {
  if (!uiCustomization) {
    return getDefaultCSSVariables();
  }

  const cssVars: Record<string, string> = {
    // 主色调
    '--primary-color': uiCustomization.primaryColor || '#f59e0b',
    '--secondary-color': uiCustomization.secondaryColor || '#6366f1',
    '--text-color': uiCustomization.textColor || '#1e293b',

    // 背景设置
    '--bg-main': uiCustomization.backgroundColor || '#f8fafc',
    '--bg-opacity': uiCustomization.backgroundOpacity?.toString() || '1',

    // 对话框样式
    '--user-message-bg': uiCustomization.userMessageBg || '#f59e0b',
    '--user-message-text': uiCustomization.userMessageText || '#ffffff',
    '--ai-message-bg': uiCustomization.aiMessageBg || '#ffffff',
    '--ai-message-text': uiCustomization.aiMessageText || '#1e293b',
    '--message-border-radius': getBorderRadiusValue(uiCustomization.messageBorderRadius),

    // 输入框样式
    '--input-bg': uiCustomization.inputBg || '#f1f5f9',
    '--input-border': uiCustomization.inputBorder || '#e2e8f0',
    '--input-text': uiCustomization.inputText || '#1e293b',
    '--input-placeholder': uiCustomization.inputPlaceholder || '#64748b',

    // 按钮样式
    '--button-primary': uiCustomization.buttonPrimary || '#f59e0b',
    '--button-secondary': uiCustomization.buttonSecondary || '#6b7280',
    '--button-text': uiCustomization.buttonText || '#ffffff',

    // 字体设置
    '--font-family': getFontFamilyValue(uiCustomization.fontFamily, uiCustomization.customFontUrl),
    '--font-size': getFontSizeValue(uiCustomization.fontSize),
    '--font-weight': uiCustomization.fontWeight || 'normal',

    // 头像设置
    '--user-avatar-bg': uiCustomization.userAvatar?.bgColor || '#f59e0b',
    '--user-avatar-text': uiCustomization.userAvatar?.textColor || '#ffffff',
    '--ai-avatar-bg': uiCustomization.aiAvatar?.bgColor || '#6366f1',
    '--ai-avatar-text': uiCustomization.aiAvatar?.textColor || '#ffffff',
  };

  // 处理背景渐变
  if (uiCustomization.backgroundType === 'gradient') {
    const gradient = uiCustomization.backgroundGradient;
    cssVars['--bg-gradient'] = `linear-gradient(${gradient.direction}, ${gradient.from}, ${gradient.to})`;
  }

  // 处理背景图片
  if (uiCustomization.backgroundType === 'image' && uiCustomization.backgroundImage) {
    cssVars['--bg-image'] = `url(${uiCustomization.backgroundImage})`;
  }

  return cssVars as React.CSSProperties;
};

/**
 * 获取默认 CSS 变量
 */
export const getDefaultCSSVariables = (): React.CSSProperties => {
  return {
    '--primary-color': '#f59e0b',
    '--secondary-color': '#6366f1',
    '--text-color': '#1e293b',
    '--bg-main': '#f8fafc',
    '--user-message-bg': '#f59e0b',
    '--user-message-text': '#ffffff',
    '--ai-message-bg': '#ffffff',
    '--ai-message-text': '#1e293b',
    '--message-border-radius': '12px',
    '--input-bg': '#f1f5f9',
    '--input-border': '#e2e8f0',
    '--input-text': '#1e293b',
    '--input-placeholder': '#64748b',
    '--button-primary': '#f59e0b',
    '--button-secondary': '#6b7280',
    '--button-text': '#ffffff',
    '--font-family': 'system-ui, -apple-system, sans-serif',
    '--font-size': '14px',
    '--font-weight': 'normal',
  } as React.CSSProperties;
};

/**
 * 获取边框圆角值
 */
const getBorderRadiusValue = (borderRadius?: string): string => {
  const radiusMap: Record<string, string> = {
    'none': '0px',
    'sm': '4px',
    'md': '8px',
    'lg': '12px',
    'xl': '16px',
    'full': '24px'
  };
  
  return radiusMap[borderRadius || 'md'] || '12px';
};

/**
 * 获取字体族值
 */
const getFontFamilyValue = (fontFamily?: string, customFontUrl?: string): string => {
  if (fontFamily === 'custom' && customFontUrl) {
    return `"CustomFont", system-ui, -apple-system, sans-serif`;
  }
  
  const fontMap: Record<string, string> = {
    'system': 'system-ui, -apple-system, sans-serif',
    'serif': 'Georgia, "Times New Roman", serif',
    'mono': '"SF Mono", Monaco, "Cascadia Code", monospace'
  };
  
  return fontMap[fontFamily || 'system'] || 'system-ui, -apple-system, sans-serif';
};

/**
 * 获取字体大小值
 */
const getFontSizeValue = (fontSize?: string): string => {
  const sizeMap: Record<string, string> = {
    'xs': '12px',
    'sm': '14px',
    'base': '16px',
    'lg': '18px',
    'xl': '20px'
  };
  
  return sizeMap[fontSize || 'sm'] || '14px';
};

/**
 * 应用 CSS 变量到文档根元素
 */
export const applyCSSVariablesToRoot = (variables: React.CSSProperties): void => {
  const root = document.documentElement;
  
  Object.entries(variables).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(key, value);
    }
  });
};

/**
 * 移除文档根元素的 CSS 变量
 */
export const removeCSSVariablesFromRoot = (variableNames: string[]): void => {
  const root = document.documentElement;
  
  variableNames.forEach(name => {
    root.style.removeProperty(name);
  });
};