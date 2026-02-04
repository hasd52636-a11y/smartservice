// 国际化(i18n)工具类
export type TranslationKey = 
  // 聊天相关
  | 'chat.send'
  | 'chat.inputPlaceholder'
  | 'chat.loading'
  | 'chat.noMessages'
  | 'chat.voiceRecord'
  | 'chat.voiceStop'
  | 'chat.imageUpload'
  | 'chat.back'
  
  // 错误消息
  | 'error.network'
  | 'error.apiKey'
  | 'error.rateLimit'
  | 'error.serviceUnavailable'
  | 'error.invalidInput'
  
  // 系统消息
  | 'system.welcome'
  | 'system.noKnowledge'
  | 'system.offlineMessage'
  
  // UI组件
  | 'ui.moreMessages'
  | 'ui.loadingMore'
  | 'ui.quickAsk'
  | 'ui.thinking';

export interface TranslationKeys {
  [key: string]: string;
}

// 支持的语言
export type Language = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

// 默认中文翻译
const zhCNTranslations: TranslationKeys = {
  'chat.send': '发送',
  'chat.inputPlaceholder': '输入您的问题...',
  'chat.loading': '加载中...',
  'chat.noMessages': '暂无消息',
  'chat.voiceRecord': '按住说话',
  'chat.voiceStop': '松开结束',
  'chat.imageUpload': '上传图片',
  'chat.back': '返回',
  'error.network': '网络连接异常，请检查网络后重试。',
  'error.apiKey': 'API密钥无效，请检查密钥是否正确。',
  'error.rateLimit': '服务繁忙，请稍后重试。',
  'error.serviceUnavailable': 'AI服务暂时不可用，请稍后重试。',
  'error.invalidInput': '输入内容不符合要求，请检查后重试。',
  'system.welcome': '您好！我是智能售后客服助手 🤖',
  'system.noKnowledge': '暂无相关知识库信息',
  'system.offlineMessage': '网络连接异常，您的消息已暂存，网络恢复后将自动发送。',
  'ui.moreMessages': '加载更多消息',
  'ui.loadingMore': '加载中...',
  'ui.quickAsk': '快速提问',
  'ui.thinking': 'AI正在思考...'
};

// 英文翻译
const enUSTranslations: TranslationKeys = {
  'chat.send': 'Send',
  'chat.inputPlaceholder': 'Enter your question...',
  'chat.loading': 'Loading...',
  'chat.noMessages': 'No messages',
  'chat.voiceRecord': 'Hold to speak',
  'chat.voiceStop': 'Release to stop',
  'chat.imageUpload': 'Upload image',
  'chat.back': 'Back',
  'error.network': 'Network error, please check your connection.',
  'error.apiKey': 'Invalid API key, please check your settings.',
  'error.rateLimit': 'Service busy, please try again later.',
  'error.serviceUnavailable': 'AI service temporarily unavailable, please try again later.',
  'error.invalidInput': 'Invalid input, please check and try again.',
  'system.welcome': 'Hello! I\'m your intelligent customer support assistant 🤖',
  'system.noKnowledge': 'No relevant knowledge base information',
  'system.offlineMessage': 'Network error, your message has been queued and will be sent automatically when network recovers.',
  'ui.moreMessages': 'Load more messages',
  'ui.loadingMore': 'Loading...',
  'ui.quickAsk': 'Quick Ask',
  'ui.thinking': 'AI is thinking...'
};

// 日文翻译
const jaJPTranslations: TranslationKeys = {
  'chat.send': '送信',
  'chat.inputPlaceholder': '質問を入力してください...',
  'chat.loading': '読み込み中...',
  'chat.noMessages': 'メッセージがありません',
  'chat.voiceRecord': '長押しで録音',
  'chat.voiceStop': '離して終了',
  'chat.imageUpload': '画像をアップロード',
  'chat.back': '戻る',
  'error.network': 'ネットワークエラーが発生しました。接続を確認してください。',
  'error.apiKey': 'APIキーが無効です。設定を確認してください。',
  'error.rateLimit': 'サービスが混雑しています。後でもう一度お試しください。',
  'error.serviceUnavailable': 'AIサービスが一時的に利用できません。後でもう一度お試しください。',
  'error.invalidInput': '入力内容が正しくありません。確認して再試行してください。',
  'system.welcome': 'こんにちは！私はインテリジェントカスタマーサポートアシスタントです 🤖',
  'system.noKnowledge': '関連する知識ベース情報がありません',
  'system.offlineMessage': 'ネットワークエラーのため、メッセージはキューに保存され、ネットワークが復元されると自動的に送信されます。',
  'ui.moreMessages': 'さらにメッセージを読み込む',
  'ui.loadingMore': '読み込み中...',
  'ui.quickAsk': 'クイック質問',
  'ui.thinking': 'AIが考えています...'
};

// 韩文翻译
const koKRTranslations: TranslationKeys = {
  'chat.send': '전송',
  'chat.inputPlaceholder': '질문을 입력하세요...',
  'chat.loading': '로드 중...',
  'chat.noMessages': '메시지 없음',
  'chat.voiceRecord': '길게 눌러서 말하기',
  'chat.voiceStop': '놓아서 종료',
  'chat.imageUpload': '이미지 업로드',
  'chat.back': '뒤로',
  'error.network': '네트워크 오류가 발생했습니다. 연결을 확인해주세요.',
  'error.apiKey': 'API 키가 유효하지 않습니다. 설정을 확인해주세요.',
  'error.rateLimit': '서비스가 혼잡합니다. 나중에 다시 시도해주세요.',
  'error.serviceUnavailable': 'AI 서비스를 일시적으로 사용할 수 없습니다. 나중에 다시 시도해주세요.',
  'error.invalidInput': '입력 내용이 올바르지 않습니다. 확인 후 재시도해주세요.',
  'system.welcome': '안녕하세요! 저는 지능형 고객 지원 어시스턴트입니다 🤖',
  'system.noKnowledge': '관련 지식 베이스 정보가 없습니다',
  'system.offlineMessage': '네트워크 오류로 인해 메시지는 대기열에 저장되었으며 네트워크가 복원되면 자동으로 전송됩니다.',
  'ui.moreMessages': '더 많은 메시지 로드',
  'ui.loadingMore': '로드 중...',
  'ui.quickAsk': '빠른 질문',
  'ui.thinking': 'AI가 생각 중입니다...'
};

// 翻译包集合
const translations: Record<Language, TranslationKeys> = {
  'zh-CN': zhCNTranslations,
  'en-US': enUSTranslations,
  'ja-JP': jaJPTranslations,
  'ko-KR': koKRTranslations
};

export class I18n {
  private currentLanguage: Language = 'zh-CN';
  private fallbackLanguage: Language = 'zh-CN';

  constructor(initialLanguage?: Language) {
    if (initialLanguage && this.isSupportedLanguage(initialLanguage)) {
      this.currentLanguage = initialLanguage;
    } else {
      // 尝试从浏览器语言检测
      const browserLang = this.detectBrowserLanguage();
      if (browserLang) {
        this.currentLanguage = browserLang;
      }
    }
  }

  /**
   * 切换语言
   * @param lang 目标语言
   */
  setLanguage(lang: Language): void {
    if (this.isSupportedLanguage(lang)) {
      this.currentLanguage = lang;
      // 保存到localStorage
      localStorage.setItem('app_language', lang);
    }
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * 翻译指定键
   * @param key 翻译键
   * @param params 参数（用于插值）
   */
  t(key: TranslationKey, params?: Record<string, any>): string {
    const translation = translations[this.currentLanguage][key] || 
                       translations[this.fallbackLanguage][key] ||
                       key as string;
    
    // 如果提供了参数，则进行插值
    if (params) {
      return this.interpolate(translation, params);
    }
    
    return translation;
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): Language[] {
    return Object.keys(translations) as Language[];
  }

  /**
   * 检查语言是否受支持
   * @param lang 语言代码
   */
  private isSupportedLanguage(lang: string): lang is Language {
    return Object.hasOwnProperty.call(translations, lang);
  }

  /**
   * 从浏览器检测语言
   */
  private detectBrowserLanguage(): Language | null {
    const browserLang = navigator.language;
    
    // 尝试精确匹配
    if (this.isSupportedLanguage(browserLang as Language)) {
      return browserLang as Language;
    }
    
    // 尝试前缀匹配（例如 'en' 匹配 'en-US'）
    const langPrefix = browserLang.split('-')[0];
    for (const lang of Object.keys(translations) as Language[]) {
      if (lang.startsWith(langPrefix)) {
        return lang;
      }
    }
    
    // 尝试从localStorage获取
    const savedLang = localStorage.getItem('app_language');
    if (savedLang && this.isSupportedLanguage(savedLang)) {
      return savedLang as Language;
    }
    
    return null;
  }

  /**
   * 字符串插值
   * @param str 原始字符串
   * @param params 参数对象
   */
  private interpolate(str: string, params: Record<string, any>): string {
    let result = str;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  /**
   * 格式化数字
   * @param num 数字
   * @param options 格式化选项
   */
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLanguage, options).format(num);
  }

  /**
   * 格式化日期
   * @param date 日期
   * @param options 格式化选项
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLanguage, options).format(date);
  }
}

// 创建全局i18n实例
export const i18n = new I18n();

// React Hook for using translations
export const useTranslation = () => {
  return {
    t: i18n.t.bind(i18n),
    currentLanguage: i18n.getCurrentLanguage(),
    setLanguage: i18n.setLanguage.bind(i18n),
    getSupportedLanguages: i18n.getSupportedLanguages.bind(i18n)
  };
};