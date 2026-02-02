import { ProductProject } from '../types';

// 链接服务类，用于管理20个复杂长链接的生成和循环使用
export class LinkService {
  private static instance: LinkService;
  private complexLinks: Map<string, string> = new Map(); // 链接映射: shortCode -> fullLink
  private projectLinks: Map<string, string[]> = new Map(); // 项目映射: projectId -> [shortCode1, shortCode2, ...]
  private linkToProjectMap: Map<string, string> = new Map(); // 反向映射: shortCode -> projectId
  private linkUsage: Map<string, number> = new Map(); // 链接使用计数
  private linkActive: Map<string, boolean> = new Map(); // 链接活跃状态: shortCode -> isActive
  private projectCurrentIndex: Map<string, number> = new Map(); // 每个项目的当前索引
  private maxLinksPerProject = 20;
  private maxActiveLinks = 10;
  private customBaseUrl: string | null = null; // 自定义基础URL

  private constructor() {
    this.initialize();
    this.initializeStateManagement();
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
    const savedLinkToProjectMap = localStorage.getItem('linkToProjectMap');
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

    if (savedLinkToProjectMap) {
      try {
        const parsed = JSON.parse(savedLinkToProjectMap);
        this.linkToProjectMap = new Map(Object.entries(parsed));
      } catch (error) {
        console.error('Error loading link to project map:', error);
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
      localStorage.setItem('linkToProjectMap', JSON.stringify(Object.fromEntries(this.linkToProjectMap)));
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

  // 为项目生成固定的链接
  generateLinksForProject(projectId: string): string[] {
    // 检查是否已经为该项目生成过链接
    const existingShortCodes = this.projectLinks.get(projectId);
    if (existingShortCodes && existingShortCodes.length > 0) {
      return existingShortCodes.map(code => this.complexLinks.get(code) || '').filter(Boolean);
    }

    const links: string[] = [];
    const shortCodes: string[] = [];

    for (let i = 0; i < this.maxLinksPerProject; i++) {
      // 生成固定的shortCode，基于项目ID和索引，确保唯一性和稳定性
      const shortCode = this.generateFixedShortCode(projectId, i);
      const complexPart = this.generateComplexString(96); // 更复杂的随机部分
      const projectKey = this.generateProjectKey(projectId); // 基于项目ID生成固定的密钥
      const sequenceId = i.toString().padStart(3, '0'); // 序列ID，确保顺序
      
      // 智能获取基础URL，适配不同部署环境
      const baseUrl = this.getBaseUrl();
      
      // 构建链接参数
      const params = new URLSearchParams();
      params.set('seq', sequenceId);
      params.set('proj', projectKey);
      params.set('data', complexPart);
      params.set('pid', projectId); // 添加项目ID，便于调试
      params.set('v', '1.0'); // 添加版本号，便于后续升级
      
      // 对于HashRouter，需要包含#/前缀
      // 确保链接格式在不同设备上兼容
      const fullLink = `${baseUrl}/#/entry/${shortCode}?${params.toString()}`;
      
      this.complexLinks.set(shortCode, fullLink);
      shortCodes.push(shortCode);
      links.push(fullLink);
      this.linkUsage.set(shortCode, 0);
      this.linkActive.set(shortCode, false); // 初始状态为非活跃
      
      // 同时保存反向映射，便于通过链接找到项目
      this.linkToProjectMap.set(shortCode, projectId);
    }

    this.projectLinks.set(projectId, shortCodes);
    this.projectCurrentIndex.set(projectId, 0); // 初始化项目的当前索引
    this.saveToStorage();
    return links;
  }

  // 基于项目ID和索引生成固定的shortCode
  private generateFixedShortCode(projectId: string, index: number): string {
    // 使用项目ID的哈希值加上索引，确保固定性
    const hash = this.simpleHash(projectId);
    const indexStr = index.toString().padStart(3, '0');
    // 生成12位的shortCode
    return `${hash.substring(0, 8)}${indexStr}`.substring(0, 12);
  }

  // 基于项目ID生成固定的项目密钥
  private generateProjectKey(projectId: string): string {
    return this.simpleHash(`${projectId}_key`).substring(0, 32);
  }

  // 简单哈希函数，用于生成固定长度的字符串
  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    // 转换为十六进制字符串，并确保长度
    return Math.abs(hash).toString(36).padStart(12, '0');
  }

  // 智能获取基础URL，适配不同部署环境
  private getBaseUrl(): string {
    // 最高优先级：手动设置的自定义URL
    if (this.customBaseUrl) {
      return this.customBaseUrl;
    }
    
    // 优先使用Vite环境变量中的基础URL
    try {
      if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
        const env = (window as any).import.meta.env;
        if (env.VITE_APP_BASE_URL) {
          return env.VITE_APP_BASE_URL;
        }
        if (env.REACT_APP_BASE_URL) {
          return env.REACT_APP_BASE_URL;
        }
      }
    } catch (e) {
      console.error('Error accessing import.meta.env:', e);
    }
    
    // 尝试直接访问环境变量
    try {
      if ((globalThis as any).VITE_APP_BASE_URL) {
        return (globalThis as any).VITE_APP_BASE_URL;
      }
    } catch (e) {
      console.error('Error accessing globalThis:', e);
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
    
    // 从Node.js环境变量获取
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.BASE_URL) {
        return process.env.BASE_URL;
      }
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
      }
    }
    
    // 硬编码生产域名作为备用方案
    return 'https://sora.wboke.com';
  }

  // 链接状态管理配置
  private linkStateConfig = {
    maxActiveLinks: 15, // 增加最大活跃链接数
    linkTimeout: 3600000, // 链接活跃状态超时时间（1小时）
    cleanupInterval: 600000 // 状态清理间隔（10分钟）
  };

  // 链接状态记录
  private linkStates: Map<string, { active: boolean; lastUsed: number }> = new Map();

  // 初始化状态管理
  private initializeStateManagement() {
    // 从存储加载链接状态
    this.loadLinkStates();
    
    // 设置定期清理任务
    setInterval(() => {
      this.cleanupExpiredLinks();
    }, this.linkStateConfig.cleanupInterval);
  }

  // 加载链接状态
  private loadLinkStates() {
    try {
      const savedStates = localStorage.getItem('linkStates');
      if (savedStates) {
        const parsed = JSON.parse(savedStates);
        this.linkStates = new Map(Object.entries(parsed).map(([key, value]) => [key, value as { active: boolean; lastUsed: number }]));
      }
    } catch (error) {
      console.error('Error loading link states:', error);
    }
  }

  // 保存链接状态
  private saveLinkStates() {
    try {
      localStorage.setItem('linkStates', JSON.stringify(Object.fromEntries(this.linkStates)));
    } catch (error) {
      console.error('Error saving link states:', error);
    }
  }

  // 获取链接活跃状态
  private isLinkActive(shortCode: string): boolean {
    const state = this.linkStates.get(shortCode);
    if (!state) {
      return false;
    }
    
    // 检查是否超时
    const now = Date.now();
    if (now - state.lastUsed > this.linkStateConfig.linkTimeout) {
      this.linkStates.set(shortCode, { active: false, lastUsed: now });
      this.saveLinkStates();
      return false;
    }
    
    return state.active;
  }

  // 设置链接活跃状态
  private setLinkActive(shortCode: string, active: boolean) {
    const now = Date.now();
    this.linkStates.set(shortCode, { active, lastUsed: now });
    this.saveLinkStates();
  }

  // 清理过期链接状态
  private cleanupExpiredLinks() {
    const now = Date.now();
    const expiredShortCodes: string[] = [];
    
    for (const [shortCode, state] of this.linkStates.entries()) {
      if (now - state.lastUsed > this.linkStateConfig.linkTimeout) {
        expiredShortCodes.push(shortCode);
      }
    }
    
    for (const shortCode of expiredShortCodes) {
      this.linkStates.set(shortCode, { active: false, lastUsed: now });
    }
    
    if (expiredShortCodes.length > 0) {
      this.saveLinkStates();
    }
  }

  // 获取当前活跃链接数量
  private getActiveLinksCount(): number {
    let count = 0;
    for (const state of this.linkStates.values()) {
      if (this.isLinkActive(state as any)) {
        count++;
      }
    }
    return count;
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

    // 寻找下一个可用链接，最多尝试所有链接
    while (attempts < shortCodes.length) {
      const shortCode = shortCodes[currentIndex];
      const isActive = this.isLinkActive(shortCode);
      
      // 检查是否可以使用此链接
      if (!isActive || this.getActiveLinksCount() < this.linkStateConfig.maxActiveLinks) {
        selectedShortCode = shortCode;
        // 标记链接为活跃状态
        this.setLinkActive(shortCode, true);
        break;
      }
      
      // 移动到下一个链接
      currentIndex = (currentIndex + 1) % shortCodes.length;
      attempts++;
    }

    // 如果没有找到可用链接，强制使用一个链接
    if (!selectedShortCode && shortCodes.length > 0) {
      selectedShortCode = shortCodes[Math.floor(Math.random() * shortCodes.length)];
      this.setLinkActive(selectedShortCode, true);
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
    // 方法1: 使用反向映射快速查找
    const projectIdFromMap = this.linkToProjectMap.get(shortCode);
    if (projectIdFromMap) {
      return projectIdFromMap;
    }
    
    // 方法2: 遍历项目链接查找
    for (const [projectId, shortCodes] of this.projectLinks.entries()) {
      if (shortCodes.includes(shortCode)) {
        // 更新反向映射，提高下次查找效率
        this.linkToProjectMap.set(shortCode, projectId);
        this.saveToStorage();
        return projectId;
      }
    }
    
    return null;
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
    this.setLinkActive(shortCode, false);
    this.saveToStorage();
  }

  // 重新生成项目的所有链接（修复格式错误的链接）
  regenerateProjectLinks(projectId: string): string[] {
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
    return newLinks;
  }

  // 检查并修复所有项目的链接格式
  validateAndFixAllLinks(): void {
    for (const [projectId, shortCodes] of this.projectLinks.entries()) {
      let needsRegeneration = false;
      
      // 检查是否有格式错误的链接
      for (const shortCode of shortCodes) {
        const link = this.complexLinks.get(shortCode);
        if (!link || !link.startsWith('http')) {
          needsRegeneration = true;
          break;
        }
      }
      
      if (needsRegeneration) {
        this.regenerateProjectLinks(projectId);
      }
    }
  }
}

// 导出单例实例
export const linkService = LinkService.getInstance();
