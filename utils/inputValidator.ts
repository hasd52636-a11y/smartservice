// 输入验证工具类
export class InputValidator {
  /**
   * 验证文本输入的安全性
   * @param input 用户输入的文本
   * @returns 验证结果
   */
  static validateTextInput(input: string): { isValid: boolean; sanitized: string; error?: string } {
    if (!input || typeof input !== 'string') {
      return { isValid: false, sanitized: '', error: '输入不能为空' };
    }

    // 检查长度
    if (input.length > 2000) {
      return { isValid: false, sanitized: input.substring(0, 2000), error: '输入内容过长' };
    }

    // 检查潜在的恶意内容
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // JavaScript标签
      /javascript:/gi, // JavaScript协议
      /vbscript:/gi, // VBScript协议
      /on\w+\s*=/gi, // 事件处理器
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, // iframe标签
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, // object标签
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, // embed标签
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        return { isValid: false, sanitized: this.sanitizeInput(input), error: '输入包含不安全的内容' };
      }
    }

    return { isValid: true, sanitized: this.sanitizeInput(input) };
  }

  /**
   * 验证API密钥格式
   * @param apiKey API密钥
   * @returns 是否为有效的API密钥格式
   */
  static validateApiKey(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    // 智谱AI API密钥通常以特定前缀开头，长度约为32-64个字符
    // 更严格的正则表达式验证
    const apiKeyRegex = /^[a-zA-Z0-9_-]{32,64}$/;
    return apiKeyRegex.test(apiKey);
  }

  /**
   * 验证URL安全性
   * @param url 待验证的URL
   * @returns 验证结果
   */
  static validateUrl(url: string): { isValid: boolean; error?: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL不能为空' };
    }

    try {
      const parsedUrl = new URL(url);
      // 只允许HTTPS和HTTP协议
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        return { isValid: false, error: '只允许HTTP和HTTPS协议' };
      }
      return { isValid: true };
    } catch (e) {
      return { isValid: false, error: 'URL格式不正确' };
    }
  }

  /**
   * 验证文件类型
   * @param fileName 文件名
   * @param allowedTypes 允许的文件类型数组
   * @returns 验证结果
   */
  static validateFileType(fileName: string, allowedTypes: string[]): { isValid: boolean; error?: string } {
    if (!fileName || typeof fileName !== 'string') {
      return { isValid: false, error: '文件名不能为空' };
    }

    const extension = fileName.toLowerCase().split('.').pop();
    if (!extension) {
      return { isValid: false, error: '文件没有扩展名' };
    }

    if (!allowedTypes.some(type => type.toLowerCase() === extension)) {
      return { isValid: false, error: `不允许的文件类型: ${extension}. 允许的类型: ${allowedTypes.join(', ')}` };
    }

    return { isValid: true };
  }

  /**
   * 验证文件大小
   * @param fileSize 文件大小（字节）
   * @param maxSize 最大大小（字节）
   * @returns 验证结果
   */
  static validateFileSize(fileSize: number, maxSize: number): { isValid: boolean; error?: string } {
    if (fileSize <= 0) {
      return { isValid: false, error: '文件大小必须大于0' };
    }

    if (fileSize > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return { isValid: false, error: `文件过大，最大允许 ${maxSizeMB.toFixed(2)} MB` };
    }

    return { isValid: true };
  }

  /**
   * 清理输入内容（移除潜在危险字符）
   * @param input 输入内容
   * @returns 清理后的内容
   */
  private static sanitizeInput(input: string): string {
    if (!input) return input;

    // 移除潜在的危险字符序列
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  }

  /**
   * 验证JSON格式
   * @param jsonString JSON字符串
   * @returns 验证结果
   */
  static validateJson(jsonString: string): { isValid: boolean; parsed?: any; error?: string } {
    if (!jsonString || typeof jsonString !== 'string') {
      return { isValid: false, error: 'JSON字符串不能为空' };
    }

    try {
      const parsed = JSON.parse(jsonString);
      return { isValid: true, parsed };
    } catch (e) {
      return { isValid: false, error: `JSON格式错误: ${(e as Error).message}` };
    }
  }

  /**
   * 验证邮箱格式
   * @param email 邮箱地址
   * @returns 验证结果
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: '邮箱不能为空' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: '邮箱格式不正确' };
    }

    return { isValid: true };
  }
}