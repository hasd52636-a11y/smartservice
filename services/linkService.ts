import { ProductProject } from '../types';

// 链接服务类，用于管理20个复杂长链接的生成和循环使用
export class LinkService {
  private static instance: LinkService;
  private complexLinks: Map<string, string> = new Map(); // 链接映射: shortCode -> fullLink
  private projectLinks: Map<string, string[]> = new Map(); // 项目映射: projectId -> [shortCode1, shortCode2, ...]
  private linkUsage: Map<string, number> = new Map(); // 链接使用计数
  private linkActive: Map<string, boolean> = new Map(); // 链接活跃状态: shortCode -> isActive
  private projectCurrentIndex: Map<string, number> = new Map(); // 每个项目的当前索引
  private maxLinksPerProject = 20;
  private maxActiveLinks = 10;
  private customBaseUrl: string | null = null; // 自定义基础URL

  private constructor() {
    this.initialize();
  }

  public static getInstance(): LinkService {
    if (!LinkService.instance) {
      LinkService.instance = new LinkService();
    }
    return LinkService.instance;
  }

  // 设置自定义基础URL（用于生产环境部署）
  public setBaseUrl(baseUrl: string): void {
    this.customBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // 重新生成所有项目的链接
    this.regenerateAllProjectLinks();
  }

  // 重新生成所有项目的链接
  private regenerateAllProjectLinks(): void {
    const projectIds = Array.from(this.projectLinks.keys());
    
    projectIds.forEach(projectId => {
      this.regenerateProjectLinks(projectId);
    });
  }

  private initialize() {
    // 从localStorage加载保存的链接数据
    const savedLinks = localStorage.getItem('complexLinks');
    const savedProjectLinks = localStorage.getItem('projectLinks');
    const savedLinkUsage = localStorage.getItem('linkUsage');
    const savedLinkActive = localStorage.getItem('linkActive');
    const savedProjectCurrentIndex = localStorage.getItem('projectCurrentIndex');

    if (savedLinks) {
      try {
        const parsed = JSON.parse(savedLinks);
        this.complexLinks = new Map(Object.entries(parsed));
      } catch (error) {
        console.error('Error loading complex links:', error);
      }
    }

    if (savedProjectLinks) {
      try {
        const parsed = JSON.parse(savedProjectLinks);
        this.projectLinks = new Map(Object.entries(parsed));
      } catch (error) {
        console.error('Error loading project links:', error);
      }
    }

    if (savedLinkUsage) {
      try {
        const parsed = JSON.parse(savedLinkUsage);
        this.linkUsage = new Map(Object.entries(parsed));
      } catch (error) {
        console.error('Error loading link usage:', error);
      }
    }

    if (savedLinkActive) {
      try {
        const parsed = JSON.parse(savedLinkActive);
        this.linkActive = new Map(Object.entries(parsed));
      } catch (error) {
        console.error('Error loading link active status:', error);
      }
    }

    if (savedProjectCurrentIndex) {
      try {
        const parsed = JSON.parse(savedProjectCurrentIndex);
        this.projectCurrentIndex = new Map(Object.entries(parsed).map(([key, value]) => [key, Number(value)]));
      } catch (error) {
        console.error('Error loading project current index:', error);
      }
    }

    // 检查和修复链接格式
    setTimeout(() => {
      this.validateAndFixAllLinks();
    }, 1000);
  }

  private saveToStorage() {
    try {
      localStorage.setItem('complexLinks', JSON.stringify(Object.fromEntries(this.complexLinks)));
      localStorage.setItem('projectLinks', JSON.stringify(Object.fromEntries(this.projectLinks)));
      localStorage.setItem('linkUsage', JSON.stringify(Object.fromEntries(this.linkUsage)));
      localStorage.setItem('linkActive', JSON.stringify(Object.fromEntries(this.linkActive)));
      localStorage.setItem('projectCurrentIndex', JSON.stringify(Object.fromEntries(this.projectCurrentIndex)));
    } catch (error) {
      console.error('Error saving links to storage:', error);
    }
  }

  // 生成复杂的随机字符串
  private generateComplexString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 为项目生成20个复杂长链接
  generateLinksForProject(projectId: string): string[] {
    const links: string[] = [];
    const shortCodes: string[] = [];

    for (let i = 0; i < this.maxLinksPerProject; i++) {
      const shortCode = this.generateComplexString(12); // 更长的 shortCode
      const complexPart = this.generateComplexString(96); // 更复杂的随机部分
      const projectKey = this.generateComplexString(32); // 项目特定的密钥
      const sequenceId = i.toString().padStart(3, '0'); // 序列ID，确保顺序
      
      // 智能获取基础URL，适配不同部署环境
      const baseUrl = this.getBaseUrl();
      // 对于HashRouter，需要包含#/前缀
      const fullLink = `${baseUrl}/#/entry/${shortCode}?seq=${sequenceId}&proj=${projectKey}&data=${complexPart}`;
      
      this.complexLinks.set(shortCode, fullLink);
      shortCodes.push(shortCode);
      links.push(fullLink);
      this.linkUsage.set(shortCode, 0);
      this.linkActive.set(shortCode, false); // 初始状态为非活跃
    }

    this.projectLinks.set(projectId, shortCodes);
    this.projectCurrentIndex.set(projectId, 0); // 初始化项目的当前索引
    this.saveToStorage();
    return links;
  }

  // 智能获取基础URL，适配不同部署环境
  private getBaseUrl(): string {
    // 最高优先级：手动设置的自定义URL
    if (this.customBaseUrl) {
      return this.customBaseUrl;
    }
    
    // 优先使用环境变量中的基础URL（生产环境）
    // 在 Vite 中，环境变量通过 import.meta.env 访问
    if (import.meta.env.REACT_APP_BASE_URL) {
      return import.meta.env.REACT_APP_BASE_URL;
    }
    
    // 检查是否在浏览器环境中
    if (typeof window !== 'undefined' && window.location) {
      const { protocol, hostname, port } = window.location;
      
      // 处理不同的部署场景
      let baseUrl = `${protocol}//${hostname}`;
      
      // 只在非标准端口时添加端口号
      if (port && 
          !((protocol === 'http:' && port === '80') || 
            (protocol === 'https:' && port === '443'))) {
        baseUrl += `:${port}`;
      }
      
      return baseUrl;
    }
    
    // 后备方案（服务端渲染或其他环境）
    return 'http://localhost:3001';
  }

  // 获取项目的下一个可用链接（循环使用）
  getNextLinkForProject(projectId: string): string {
    let shortCodes = this.projectLinks.get(projectId);
    
    // 如果项目还没有生成链接，生成20个
    if (!shortCodes || shortCodes.length === 0) {
      this.generateLinksForProject(projectId);
      shortCodes = this.projectLinks.get(projectId) || [];
    }

    // 获取项目当前索引
    let currentIndex = this.projectCurrentIndex.get(projectId) || 0;
    let attempts = 0;
    let selectedShortCode = '';

    // 寻找下一个可用链接，最多尝试20次
    while (attempts < shortCodes.length) {
      const shortCode = shortCodes[currentIndex];
      const isActive = this.linkActive.get(shortCode) || false;
      
      // 检查是否可以使用此链接
      if (!isActive || this.getActiveLinksCount() < this.maxActiveLinks) {
        selectedShortCode = shortCode;
        // 标记链接为活跃状态
        this.linkActive.set(shortCode, true);
        break;
      }
      
      // 移动到下一个链接
      currentIndex = (currentIndex + 1) % shortCodes.length;
      attempts++;
    }

    // 如果没有找到可用链接（理论上不应该发生），使用第一个链接
    if (!selectedShortCode && shortCodes.length > 0) {
      selectedShortCode = shortCodes[0];
      this.linkActive.set(selectedShortCode, true);
    }

    // 更新项目当前索引
    this.projectCurrentIndex.set(projectId, (currentIndex + 1) % shortCodes.length);

    // 增加使用计数
    if (selectedShortCode) {
      const currentUsage = this.linkUsage.get(selectedShortCode) || 0;
      this.linkUsage.set(selectedShortCode, currentUsage + 1);
      this.saveToStorage();
    }

    const fullLink = this.complexLinks.get(selectedShortCode) || '';
    return fullLink;
  }

  // 获取项目的所有链接
  getAllLinksForProject(projectId: string): string[] {
    const shortCodes = this.projectLinks.get(projectId) || [];
    return shortCodes.map(code => this.complexLinks.get(code) || '').filter(Boolean);
  }

  // 根据shortCode获取对应的项目ID
  getProjectIdByShortCode(shortCode: string): string | null {
    for (const [projectId, shortCodes] of this.projectLinks.entries()) {
      if (shortCodes.includes(shortCode)) {
        return projectId;
      }
    }
    
    return null;
  }

  // 计算当前活跃的链接数量
  getActiveLinksCount(): number {
    let count = 0;
    for (const isActive of this.linkActive.values()) {
      if (isActive) {
        count++;
      }
    }
    return count;
  }

  // 重置所有链接的使用计数
  resetLinkUsage() {
    for (const shortCode of this.complexLinks.keys()) {
      this.linkUsage.set(shortCode, 0);
    }
    this.saveToStorage();
  }

  // 获取链接使用统计
  getLinkUsageStats(): { total: number; byProject: Map<string, number> } {
    let total = 0;
    const byProject = new Map<string, number>();

    for (const [shortCode, usage] of this.linkUsage.entries()) {
      total += usage;
      const projectId = this.getProjectIdByShortCode(shortCode);
      if (projectId) {
        const current = byProject.get(projectId) || 0;
        byProject.set(projectId, current + usage);
      }
    }

    return { total, byProject };
  }

  // 标记链接为非活跃状态
  deactivateLink(shortCode: string): void {
    this.linkActive.set(shortCode, false);
    this.saveToStorage();
  }

  // 清理过期链接
  cleanupExpiredLinks() {
    const now = Date.now();
    const expiredShortCodes: string[] = [];

    for (const [shortCode, link] of this.complexLinks.entries()) {
      // 检查链接是否包含过期时间戳
      const match = link.match(/&t=(\d+)/);
      if (match) {
        const timestamp = parseInt(match[1]);
        // 如果链接超过30天未使用，标记为过期
        if (now - timestamp > 30 * 24 * 60 * 60 * 1000) {
          expiredShortCodes.push(shortCode);
        }
      }
    }

    // 删除过期链接
    for (const shortCode of expiredShortCodes) {
      this.complexLinks.delete(shortCode);
      this.linkUsage.delete(shortCode);
      this.linkActive.delete(shortCode);
      
      // 从项目链接中移除
      for (const [projectId, shortCodes] of this.projectLinks.entries()) {
        const updatedShortCodes = shortCodes.filter(code => code !== shortCode);
        if (updatedShortCodes.length !== shortCodes.length) {
          this.projectLinks.set(projectId, updatedShortCodes);
        }
      }
    }

    this.saveToStorage();
  }

  // 重新生成项目的所有链接（修复格式错误的链接）
  regenerateProjectLinks(projectId: string): string[] {
    console.log(`重新生成项目 ${projectId} 的链接...`);
    
    // 清除旧链接
    const oldShortCodes = this.projectLinks.get(projectId) || [];
    oldShortCodes.forEach(shortCode => {
      this.complexLinks.delete(shortCode);
      this.linkUsage.delete(shortCode);
      this.linkActive.delete(shortCode);
    });
    
    // 清除项目映射
    this.projectLinks.delete(projectId);
    this.projectCurrentIndex.delete(projectId);
    
    // 生成新链接
    const newLinks = this.generateLinksForProject(projectId);
    console.log(`为项目 ${projectId} 重新生成了 ${newLinks.length} 个链接`);
    
    return newLinks;
  }

  // 检查并修复所有项目的链接格式
  validateAndFixAllLinks(): void {
    console.log('开始检查和修复所有项目的链接格式...');
    
    for (const [projectId, shortCodes] of this.projectLinks.entries()) {
      let needsRegeneration = false;
      
      // 检查是否有格式错误的链接
      for (const shortCode of shortCodes) {
        const link = this.complexLinks.get(shortCode);
        if (!link || !link.startsWith('http')) {
          console.log(`发现格式错误的链接，项目: ${projectId}, shortCode: ${shortCode}, link: ${link}`);
          needsRegeneration = true;
          break;
        }
      }
      
      if (needsRegeneration) {
        this.regenerateProjectLinks(projectId);
      }
    }
    
    console.log('链接格式检查和修复完成');
  }
}

// 导出单例实例
export const linkService = LinkService.getInstance();
