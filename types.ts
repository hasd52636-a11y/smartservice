
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
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundColor?: string;
  backgroundGradient?: {
    from: string;
    to: string;
    direction: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-tr' | 'to-tl' | 'to-br' | 'to-bl';
  };
  backgroundImage?: string;
  backgroundOpacity?: number;
  fontFamily: 'system' | 'serif' | 'mono';
  fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  primaryColor: string;
  secondaryColor?: string;
  textColor: string;
  userMessageBg: string;
  userMessageText: string;
  aiMessageBg: string;
  aiMessageText: string;
  messageBorderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  userAvatar: {
    type: 'emoji' | 'initials' | 'image';
    value: string;
    bgColor: string;
    textColor: string;
  };
  aiAvatar: {
    type: 'emoji' | 'initials' | 'image';
    value: string;
    bgColor: string;
    textColor: string;
  };
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonText: string;
  enableAnimations: boolean;
  messageAnimation: 'none' | 'slide' | 'fade' | 'bounce';
  enableEmojis: boolean;
  enableImageUpload: boolean;
  enableVoiceMessage: boolean;
  bannerAd?: {
    enabled: boolean;
    imageUrl: string;
    height: number;
    showCloseButton: boolean;
  };
  specialStyles?: {
    messageShape?: 'default' | 'bubble' | 'ship' | 'dolphin' | 'crystal' | 'neon' | 'paper' | 'cloud' | 'vangogh';
    backgroundPattern?: 'none' | 'dots' | 'waves' | 'stars' | 'grid' | 'sakura' | 'circuit' | 'starry';
    glassEffect?: boolean;
    shadowEffect?: 'none' | 'soft' | 'hard' | 'neon' | 'paper' | 'watercolor';
    animation?: 'none' | 'float' | 'pulse' | 'glow' | 'bounce' | 'wave' | 'swirl';
  };
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
  // RAG 配置参数 - 避免硬编码阈值
  searchThreshold: number; // 相似度阈值，建议默认 0.45
  maxContextItems: number; // 最大上下文项目数，建议默认 3
  uiCustomization?: UICustomization;
  welcomeMessage?: string;
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
