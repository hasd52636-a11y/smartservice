import { ProductProject, ProjectStatus, AIProvider, KnowledgeType } from '../types';

// 项目数据服务 - 模拟服务端数据库
class ProjectService {
  private static instance: ProjectService;
  private projects: Map<string, ProductProject> = new Map();

  private constructor() {
    this.initializeDefaultProjects();
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  // 初始化默认项目数据（模拟服务端预置数据）
  private initializeDefaultProjects() {
    // 先尝试从localStorage加载
    this.loadFromLocalStorage();
    
    // 如果没有项目数据，创建默认项目
    if (this.projects.size === 0) {
      console.log('初始化默认项目数据...');
      const defaultProjects: ProductProject[] = [
      {
        id: 'p1',
        name: '测试项目',
        description: '用于测试扫码功能的项目。',
        status: ProjectStatus.ACTIVE,
        config: {
          provider: AIProvider.ZHIPU,
          voiceName: 'tongtong',
          visionEnabled: true,
          visionPrompt: 'Check if all cables are plugged in and the LED is glowing green.',
          systemInstruction: 'You are a helpful product assistant.',
          videoGuides: [],
          multimodalEnabled: true,
          videoChatEnabled: true,
          videoChatPrompt: '您是中恒创世科技的专业技术支持专家。请仔细分析用户提供的视频内容，识别产品使用或安装过程中的具体问题，并基于产品知识库提供准确的解决方案。\n\n分析重点：\n1. 产品型号识别与规格确认\n2. 安装步骤的正确性检查\n3. 连接线路与接口状态\n4. 设备指示灯与显示状态\n5. 操作流程的规范性\n6. 潜在安全隐患识别\n\n回复要求：\n- 使用专业但易懂的语言\n- 提供具体的操作步骤\n- 标注重要的安全注意事项\n- 如需更换配件，请说明具体型号\n- 优先引用官方知识库内容\n- 必要时建议联系中恒创世技术支持热线',
          avatarEnabled: true,
          annotationEnabled: true,
          // RAG 配置参数
          searchThreshold: 0.45,
          maxContextItems: 3
        },
        knowledgeBase: [
          { 
            id: 'k1', 
            title: '使用说明', 
            type: KnowledgeType.TEXT, 
            content: '这是一个测试项目，用于验证扫码功能是否正常工作。', 
            createdAt: new Date().toISOString() 
          },
          { 
            id: 'k2', 
            title: '测试内容', 
            type: KnowledgeType.TEXT, 
            content: '扫码成功！您可以开始使用AI虚拟客服功能了。', 
            createdAt: new Date().toISOString() 
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'proj_1',
        name: 'SmartHome Pro Hub',
        description: 'Next-gen automation controller for modern homes. 下一代智能家居控制器。',
        status: ProjectStatus.ACTIVE,
        config: {
          provider: AIProvider.ZHIPU,
          voiceName: 'tongtong',
          visionEnabled: true,
          visionPrompt: 'Check if all cables are plugged in and the LED is glowing green.',
          systemInstruction: 'You are a technical support expert for SmartHome Pro products.',
          videoGuides: [],
          multimodalEnabled: true,
          videoChatEnabled: true,
          videoChatPrompt: '您是中恒创世科技SmartHome Pro系列产品的专业技术支持专家。请仔细分析用户提供的视频内容，识别智能家居设备使用或安装过程中的具体问题，并基于产品知识库提供准确的解决方案。\n\n分析重点：\n1. 设备型号识别与兼容性确认\n2. 网络连接状态与信号强度\n3. 安装位置与环境适配性\n4. 设备配对与同步状态\n5. 操作界面与功能设置\n6. 电源供应与线路安全\n\n回复要求：\n- 使用专业但易懂的语言\n- 提供具体的操作步骤\n- 标注重要的安全注意事项\n- 如需更换配件，请说明具体型号\n- 优先引用官方知识库内容\n- 必要时建议联系中恒创世技术支持热线',
          avatarEnabled: true,
          annotationEnabled: true,
          // RAG 配置参数
          searchThreshold: 0.45,
          maxContextItems: 3
        },
        knowledgeBase: [
          { 
            id: 'k1', 
            title: 'Initial Setup', 
            type: KnowledgeType.TEXT, 
            content: 'Plug in the device and wait 60 seconds.', 
            createdAt: new Date().toISOString() 
          },
          { 
            id: 'k2', 
            title: 'Connection Guide', 
            type: KnowledgeType.TEXT, 
            content: '1. Download the SmartHome app\n2. Create an account\n3. Follow the in-app setup instructions', 
            createdAt: new Date().toISOString() 
          },
          { 
            id: 'k3', 
            title: 'Troubleshooting', 
            type: KnowledgeType.TEXT, 
            content: 'If the device is not responding, try resetting it by pressing and holding the reset button for 10 seconds.', 
            createdAt: new Date().toISOString() 
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'proj_2',
        name: 'SmartThermostat',
        description: 'Intelligent temperature control system. 智能温度控制系统。',
        status: ProjectStatus.ACTIVE,
        config: {
          provider: AIProvider.ZHIPU,
          voiceName: 'tongtong',
          visionEnabled: false,
          visionPrompt: '',
          systemInstruction: 'You are a helpful assistant for SmartThermostat users.',
          videoGuides: [],
          multimodalEnabled: true,
          videoChatEnabled: true,
          videoChatPrompt: '您是中恒创世科技SmartThermostat智能温控系统的专业技术支持专家。请仔细分析用户提供的视频内容，识别温控设备使用或安装过程中的具体问题，并基于产品知识库提供准确的解决方案。\n\n分析重点：\n1. 温控器安装位置与环境条件\n2. 线路连接与电气安全\n3. 温度传感器工作状态\n4. 系统设置与程序配置\n5. 显示屏状态与用户界面\n6. 节能模式与时间设定\n\n回复要求：\n- 使用专业但易懂的语言\n- 提供具体的操作步骤\n- 特别注意电气安全提醒\n- 如需调整参数，请说明具体数值\n- 优先引用官方知识库内容\n- 必要时建议联系中恒创世技术支持热线',
          avatarEnabled: true,
          annotationEnabled: true,
          // RAG 配置参数
          searchThreshold: 0.45,
          maxContextItems: 3
        },
        knowledgeBase: [
          { 
            id: 'k1', 
            title: 'Installation', 
            type: KnowledgeType.TEXT, 
            content: 'Mount the thermostat on the wall and connect the wires according to the diagram.', 
            createdAt: new Date().toISOString() 
          },
          { 
            id: 'k2', 
            title: 'Usage Tips', 
            type: KnowledgeType.TEXT, 
            content: 'Set different temperatures for day and night to save energy.', 
            createdAt: new Date().toISOString() 
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // 将默认项目添加到内存数据库
    defaultProjects.forEach(project => {
      this.projects.set(project.id, project);
    });

    // 同步到localStorage
    this.syncToLocalStorage();
    
    // 为默认项目生成扫码链接（如果还没有的话）
    this.initializeProjectLinks();
    
    console.log(`初始化完成，共加载 ${this.projects.size} 个项目`);
    }
  }

  // 为项目初始化扫码链接
  private initializeProjectLinks() {
    // 导入linkService并为每个项目生成链接
    import('../services/linkService').then(({ linkService }) => {
      this.projects.forEach((project, projectId) => {
        // 检查项目是否已有链接
        const existingLinks = linkService.getAllLinksForProject(projectId);
        if (existingLinks.length === 0) {
          // 为项目生成100个扫码链接
          console.log(`为项目 ${project.name} (${projectId}) 生成扫码链接...`);
          linkService.generateLinksForProject(projectId);
        }
      });
    }).catch(error => {
      console.error('Failed to initialize project links:', error);
    });
  }

  // 从localStorage加载项目数据
  private loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('smartguide_projects');
      if (saved) {
        const parsed = JSON.parse(saved) as ProductProject[];
        console.log(`从localStorage加载了 ${parsed.length} 个项目`);
        parsed.forEach(project => {
          // 确保项目配置完整
          const completeProject = {
            ...project,
            config: {
              provider: AIProvider.ZHIPU,
              videoGuides: [],
              // 确保RAG配置参数存在
              searchThreshold: 0.45,
              maxContextItems: 3,
              ...project.config
            },
            knowledgeBase: (project.knowledgeBase || []).map(item => ({
              ...item,
              // 如果发现旧数据没有向量，打上标记，让 UI 提示用户需要"重新向量化"
              vectorized: !!item.embedding 
            }))
          };
          this.projects.set(project.id, completeProject);
        });
      }
    } catch (error) {
      console.error('Failed to load projects from localStorage:', error);
    }
  }

  // 从localStorage加载商家创建的项目
  private loadProjectsFromLocalStorage() {
    try {
      const saved = localStorage.getItem('smartguide_projects');
      if (saved) {
        const parsed = JSON.parse(saved) as ProductProject[];
        parsed.forEach(project => {
          // 确保项目配置完整
          const completeProject = {
            ...project,
            config: {
              provider: AIProvider.ZHIPU,
              videoGuides: [],
              ...project.config
            },
            knowledgeBase: project.knowledgeBase || []
          };
          this.projects.set(project.id, completeProject);
        });
      }
    } catch (error) {
      console.error('Failed to load projects from localStorage:', error);
    }
  }

  // 根据projectId获取项目（用户扫码时调用）
  public async getProjectById(projectId: string): Promise<ProductProject | null> {
    // 模拟异步数据库查询
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = this.projects.get(projectId);
        resolve(project || null);
      }, 100);
    });
  }

  // 获取所有项目（商家后台使用）
  public async getAllProjects(): Promise<ProductProject[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Array.from(this.projects.values()));
      }, 100);
    });
  }

  // 创建新项目（商家后台使用）
  public async createProject(project: ProductProject): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.projects.set(project.id, project);
        this.syncToLocalStorage();
        resolve(true);
      }, 100);
    });
  }

  // 更新项目（商家后台使用）
  public async updateProject(project: ProductProject): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.projects.has(project.id)) {
          this.projects.set(project.id, project);
          this.syncToLocalStorage();
          resolve(true);
        } else {
          resolve(false);
        }
      }, 100);
    });
  }

  // 删除项目（商家后台使用）
  public async deleteProject(projectId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const deleted = this.projects.delete(projectId);
        if (deleted) {
          this.syncToLocalStorage();
        }
        resolve(deleted);
      }, 100);
    });
  }

  // 验证项目ID是否有效（二维码验证）
  public async validateProjectId(projectId: string): Promise<{
    valid: boolean;
    project?: ProductProject;
    error?: string;
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = this.projects.get(projectId);
        
        if (!project) {
          resolve({
            valid: false,
            error: '项目不存在或已被删除'
          });
          return;
        }

        if (project.status !== ProjectStatus.ACTIVE) {
          resolve({
            valid: false,
            error: '项目已暂停服务'
          });
          return;
        }

        resolve({
          valid: true,
          project: project
        });
      }, 100);
    });
  }

  // 同步到localStorage（商家后台数据持久化）
  private syncToLocalStorage() {
    try {
      const projectsArray = Array.from(this.projects.values());
      const data = JSON.stringify(projectsArray);
      
      // 增加体积预警（可选）
      if (data.length > 4 * 1024 * 1024) { 
        console.warn("⚠️ 数据体积接近 LocalStorage 上限，建议清理知识库或升级数据库。");
      }
      
      localStorage.setItem('smartguide_projects', data);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('❌ 存储空间已满！向量数据太大，LocalStorage 无法保存。请考虑减少文档数量或使用 IndexedDB。');
        // 这里可以弹窗提示用户
        alert('存储空间已满！向量数据太大，请减少知识库文档数量。');
      } else {
        console.error('Failed to sync projects to localStorage:', error);
      }
    }
  }

  // 记录用户访问（可选的分析功能）
  public async logUserAccess(projectId: string, userInfo?: {
    timestamp: string;
    userAgent?: string;
    referrer?: string;
    sessionId?: string;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    action?: 'scan' | 'message' | 'ocr' | 'voice' | 'video' | 'handoff';
    metadata?: any;
  }): Promise<void> {
    try {
      // 获取现有的分析数据
      const existingData = localStorage.getItem('smartguide_analytics');
      let analyticsData = existingData ? JSON.parse(existingData) : this.initializeAnalyticsData();
      
      // 更新基础指标
      if (userInfo?.action === 'scan') {
        analyticsData.uniqueUsers = (analyticsData.uniqueUsers || 0) + 1;
        analyticsData.totalScans = (analyticsData.totalScans || 0) + 1;
      }
      
      if (userInfo?.action === 'message') {
        analyticsData.totalMessages = (analyticsData.totalMessages || 0) + 1;
        analyticsData.totalSessions = (analyticsData.totalSessions || 0) + 1;
        
        // 更新平均帮助时间（模拟）
        const sessionDuration = Math.floor(Math.random() * 300) + 30; // 30-330秒
        const currentAvg = analyticsData.avgHelpTime || 0;
        const currentCount = analyticsData.totalSessions || 1;
        analyticsData.avgHelpTime = Math.round(
          (currentAvg * (currentCount - 1) + sessionDuration) / currentCount
        );
      }
      
      // 更新设备类型统计
      if (userInfo?.deviceType) {
        if (!analyticsData.deviceTypes) {
          analyticsData.deviceTypes = [
            { name: 'Mobile', value: 0 },
            { name: 'Desktop', value: 0 },
            { name: 'Tablet', value: 0 }
          ];
        }
        
        const deviceIndex = analyticsData.deviceTypes.findIndex(
          (d: any) => d.name.toLowerCase() === userInfo.deviceType?.toLowerCase()
        );
        if (deviceIndex >= 0) {
          analyticsData.deviceTypes[deviceIndex].value += 1;
        }
      }
      
      // 更新服务类型数据（按月份）
      if (userInfo?.action === 'message') {
        const currentMonth = new Date().getMonth();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthName = monthNames[currentMonth];
        
        if (!analyticsData.serviceTypeData) {
          analyticsData.serviceTypeData = this.generateRecentMonths().map(month => ({
            name: month,
            proactive: 0,
            reactive: 0
          }));
        }
        
        const monthIndex = analyticsData.serviceTypeData.findIndex(
          (item: any) => item.name === currentMonthName
        );
        if (monthIndex >= 0) {
          // 根据用户行为判断是主动还是被动服务
          if (userInfo.metadata?.isProactive) {
            analyticsData.serviceTypeData[monthIndex].proactive += 1;
          } else {
            analyticsData.serviceTypeData[monthIndex].reactive += 1;
          }
        }
      }
      
      // 更新问题分布（基于消息内容分析）
      if (userInfo?.action === 'message' && userInfo.metadata?.messageContent) {
        const content = userInfo.metadata.messageContent.toLowerCase();
        if (!analyticsData.issueDistribution) {
          analyticsData.issueDistribution = [
            { name: 'Installation', value: 0 },
            { name: 'WIFI Setup', value: 0 },
            { name: 'Hardware', value: 0 },
            { name: 'Others', value: 0 }
          ];
        }
        
        // 简单的关键词匹配分类
        if (content.includes('安装') || content.includes('install')) {
          analyticsData.issueDistribution[0].value += 1;
        } else if (content.includes('wifi') || content.includes('网络') || content.includes('连接')) {
          analyticsData.issueDistribution[1].value += 1;
        } else if (content.includes('硬件') || content.includes('设备') || content.includes('hardware')) {
          analyticsData.issueDistribution[2].value += 1;
        } else {
          analyticsData.issueDistribution[3].value += 1;
        }
      }
      
      // 更新转人工率
      if (userInfo?.action === 'handoff') {
        analyticsData.handoffCount = (analyticsData.handoffCount || 0) + 1;
        analyticsData.totalInteractions = (analyticsData.totalInteractions || 0) + 1;
        analyticsData.handoffRate = Math.round((analyticsData.handoffCount / analyticsData.totalInteractions) * 100);
      } else if (userInfo?.action === 'message') {
        analyticsData.totalInteractions = (analyticsData.totalInteractions || 0) + 1;
        if (analyticsData.handoffCount) {
          analyticsData.handoffRate = Math.round((analyticsData.handoffCount / analyticsData.totalInteractions) * 100);
        }
      }
      
      // 更新知识库覆盖率（模拟）
      if (userInfo?.metadata?.knowledgeBaseHit !== undefined) {
        if (!analyticsData.knowledgeCoverage) {
          analyticsData.knowledgeCoverage = { hits: 0, misses: 0 };
        }
        
        if (userInfo.metadata.knowledgeBaseHit) {
          analyticsData.knowledgeCoverage.hits += 1;
        } else {
          analyticsData.knowledgeCoverage.misses += 1;
        }
        
        const total = analyticsData.knowledgeCoverage.hits + analyticsData.knowledgeCoverage.misses;
        analyticsData.knowledgeCoverageRate = Math.round((analyticsData.knowledgeCoverage.hits / total) * 100);
      }
      
      // 更新平均诊断步骤
      if (userInfo?.metadata?.conversationSteps) {
        const steps = userInfo.metadata.conversationSteps;
        const currentAvgSteps = analyticsData.avgDiagnosticSteps || 0;
        const currentSessionCount = analyticsData.totalSessions || 1;
        analyticsData.avgDiagnosticSteps = Math.round(
          (currentAvgSteps * (currentSessionCount - 1) + steps) / currentSessionCount
        );
      }
      
      // 更新CSAT评分（当用户提供反馈时）
      if (userInfo?.metadata?.csatRating) {
        const rating = userInfo.metadata.csatRating;
        if (!analyticsData.csatRatings) {
          analyticsData.csatRatings = [];
        }
        analyticsData.csatRatings.push(rating);
        
        // 计算平均CSAT
        const sum = analyticsData.csatRatings.reduce((a: number, b: number) => a + b, 0);
        analyticsData.csatScore = (sum / analyticsData.csatRatings.length).toFixed(1);
      }
      
      // 更新绕过率（用户直接联系人工的比例）
      if (userInfo?.metadata?.bypassAI) {
        analyticsData.bypassCount = (analyticsData.bypassCount || 0) + 1;
        analyticsData.totalInteractions = (analyticsData.totalInteractions || 0) + 1;
        analyticsData.bypassRate = Math.round((analyticsData.bypassCount / analyticsData.totalInteractions) * 100);
      }
      
      // 记录访问日志（用于后续分析）
      if (!analyticsData.accessLogs) {
        analyticsData.accessLogs = [];
      }
      
      // 只保留最近1000条日志，避免数据过大
      if (analyticsData.accessLogs.length >= 1000) {
        analyticsData.accessLogs = analyticsData.accessLogs.slice(-900);
      }
      
      analyticsData.accessLogs.push({
        projectId,
        timestamp: userInfo?.timestamp || new Date().toISOString(),
        action: userInfo?.action || 'unknown',
        deviceType: userInfo?.deviceType,
        userAgent: userInfo?.userAgent,
        sessionId: userInfo?.sessionId,
        metadata: userInfo?.metadata
      });
      
      // 保存更新后的数据
      localStorage.setItem('smartguide_analytics', JSON.stringify(analyticsData));
      
      console.log(`📊 Analytics updated: ${userInfo?.action} from ${userInfo?.deviceType} device`);
    } catch (error) {
      console.error('Failed to log user access:', error);
    }
  }

  // 初始化分析数据结构
  private initializeAnalyticsData() {
    const recentMonths = this.generateRecentMonths();
    return {
      uniqueUsers: 0,
      avgHelpTime: 0,
      csatScore: 0,
      bypassRate: 0,
      handoffRate: 0,
      knowledgeCoverageRate: 0,
      avgDiagnosticSteps: 0,
      totalScans: 0,
      totalMessages: 0,
      totalSessions: 0,
      totalInteractions: 0,
      handoffCount: 0,
      bypassCount: 0,
      serviceTypeData: recentMonths.map(month => ({
        name: month,
        proactive: 0,
        reactive: 0
      })),
      issueDistribution: [
        { name: 'Installation', value: 0 },
        { name: 'WIFI Setup', value: 0 },
        { name: 'Hardware', value: 0 },
        { name: 'Others', value: 0 }
      ],
      deviceTypes: [
        { name: 'Mobile', value: 0 },
        { name: 'Desktop', value: 0 },
        { name: 'Tablet', value: 0 }
      ],
      accessLogs: [],
      csatRatings: [],
      knowledgeCoverage: { hits: 0, misses: 0 }
    };
  }

  // 生成最近6个月的月份数据
  private generateRecentMonths() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Array.from({ length: 6 }, (_, index) => {
      const monthIndex = (now.getMonth() - 5 + index + 12) % 12;
      return months[monthIndex];
    });
  }

  // 获取项目统计数据
  public async getProjectStats(projectId?: string): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const analyticsData = localStorage.getItem('smartguide_analytics');
          if (analyticsData) {
            const data = JSON.parse(analyticsData);
            
            // 如果指定了项目ID，过滤该项目的数据
            if (projectId && data.accessLogs) {
              const projectLogs = data.accessLogs.filter((log: any) => log.projectId === projectId);
              
              // 基于项目日志重新计算统计数据
              const projectStats = {
                ...data,
                projectSpecific: {
                  totalAccess: projectLogs.length,
                  uniqueDevices: new Set(projectLogs.map((log: any) => log.userAgent)).size,
                  mobileAccess: projectLogs.filter((log: any) => log.deviceType === 'mobile').length,
                  desktopAccess: projectLogs.filter((log: any) => log.deviceType === 'desktop').length,
                  recentActivity: projectLogs.slice(-10)
                }
              };
              
              resolve(projectStats);
            } else {
              resolve(data);
            }
          } else {
            resolve(this.initializeAnalyticsData());
          }
        } catch (error) {
          console.error('Failed to get project stats:', error);
          resolve(this.initializeAnalyticsData());
        }
      }, 100);
    });
  }

  // 获取项目的扫码链接
  public async getProjectQRLinks(projectId: string): Promise<string[]> {
    return new Promise(async (resolve) => {
      try {
        const { linkService } = await import('../services/linkService');
        const links = linkService.getAllLinksForProject(projectId);
        resolve(links);
      } catch (error) {
        console.error('Failed to get project QR links:', error);
        resolve([]);
      }
    });
  }

  // 生成项目的下一个可用扫码链接
  public async getNextQRLink(projectId: string): Promise<string> {
    return new Promise(async (resolve) => {
      try {
        const { linkService } = await import('../services/linkService');
        const link = linkService.getNextLinkForProject(projectId);
        resolve(link);
      } catch (error) {
        console.error('Failed to get next QR link:', error);
        resolve('');
      }
    });
  }
}

// 导出单例实例
export const projectService = ProjectService.getInstance();