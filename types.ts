
export enum ProjectStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  DISABLED = 'disabled'
}

export enum KnowledgeType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
  DOC = 'doc'
}

export enum AIProvider {
  ZHIPU = 'zhipu'    // China
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: KnowledgeType;
  fileName?: string;
  fileSize?: string;
  createdAt: string;
  tags?: string[];
  embedding?: number[];
}

export interface VideoGuide {
  id: string;
  title: string;
  url: string;
  type: 'ai' | 'upload';
  status: 'generating' | 'ready' | 'failed';
}

export interface UICustomization {
  // 背景设置
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundColor: string;
  backgroundGradient: {
    from: string;
    to: string;
    direction: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-br' | 'to-bl' | 'to-tr' | 'to-tl';
  };
  backgroundImage?: string;
  backgroundOpacity: number;
  
  // 字体设置
  fontFamily: 'system' | 'serif' | 'mono' | 'custom';
  customFontUrl?: string;
  fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  
  // 颜色主题
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  
  // 对话框样式
  userMessageBg: string;
  userMessageText: string;
  aiMessageBg: string;
  aiMessageText: string;
  messageBorderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  // 头像设置
  userAvatar: {
    type: 'default' | 'emoji' | 'image' | 'initials';
    value: string; // emoji字符、图片URL或姓名首字母
    bgColor: string;
    textColor: string;
  };
  aiAvatar: {
    type: 'default' | 'emoji' | 'image' | 'initials';
    value: string;
    bgColor: string;
    textColor: string;
  };
  
  // 输入框样式
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  
  // 按钮样式
  buttonPrimary: string;
  buttonSecondary: string;
  buttonText: string;
  
  // 动画效果
  enableAnimations: boolean;
  messageAnimation: 'none' | 'fade' | 'slide' | 'bounce';
  
  // 表情和媒体支持
  enableEmojis: boolean;
  enableImageUpload: boolean;
  enableVoiceMessage: boolean;
}

export interface ProjectConfig {
  provider: AIProvider;
  voiceName: string;
  visionEnabled: boolean;
  visionPrompt: string;
  systemInstruction: string;
  videoGuides: VideoGuide[];
  multimodalEnabled: boolean;
  videoChatEnabled: boolean;
  videoChatPrompt: string;
  avatarEnabled: boolean;
  annotationEnabled: boolean;
  // 联系信息配置
  supportPhone?: string;
  supportWebsite?: string;
  companyName?: string;
  wechatAccount?: string;
  // 欢迎语配置
  welcomeMessage?: string;
  // UI自定义配置
  uiCustomization?: UICustomization;
}

export interface ProductProject {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  config: ProjectConfig;
  knowledgeBase: KnowledgeItem[];
  createdAt: string;
  updatedAt: string;
}
