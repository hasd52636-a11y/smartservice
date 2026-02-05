/**
 * 数据库连接模块
 * 支持Vercel KV/Redis和本地存储降级
 */

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  config: Record<string, unknown>;
  knowledgeBase: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'smartguide_projects';

const isServerSide = typeof window === 'undefined';

export const db = {
  /**
   * 初始化数据库连接
   */
  async init(): Promise<void> {
    if (!isServerSide) {
      console.info('[DB] Running in client-side mode, using localStorage');
    }
  },

  /**
   * 获取项目
   */
  async getProject(id: string): Promise<Project | null> {
    try {
      if (isServerSide) {
        const kvUrl = process.env.KV_URL;
        if (kvUrl) {
          const response = await fetch(`${kvUrl}/get/${STORAGE_KEY}_${id}`);
          if (response.ok) {
            const data = await response.json();
            return data as Project;
          }
        }
      }

      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const projects: Project[] = JSON.parse(stored);
          return projects.find(p => p.id === id) || null;
        }
      }

      return null;
    } catch (error) {
      console.error('[DB] Error getting project:', id, error);
      return null;
    }
  },

  /**
   * 获取所有项目
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      if (isServerSide) {
        const kvUrl = process.env.KV_URL;
        if (kvUrl) {
          const response = await fetch(`${kvUrl}/keys/${STORAGE_KEY}_*`);
          if (response.ok) {
            const keys: string[] = await response.json();
            const projects: Project[] = [];
            for (const key of keys.slice(0, 20)) {
              const projResponse = await fetch(`${kvUrl}/get/${key}`);
              if (projResponse.ok) {
                projects.push(await projResponse.json());
              }
            }
            return projects;
          }
        }
      }

      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const projects: Project[] = JSON.parse(stored);
          return projects.slice(0, 20);
        }
      }

      return [];
    } catch (error) {
      console.error('[DB] Error getting all projects:', error);
      return [];
    }
  },

  /**
   * 保存项目
   */
  async saveProject(project: Project): Promise<boolean> {
    try {
      if (isServerSide) {
        const kvUrl = process.env.KV_URL;
        if (kvUrl) {
          const response = await fetch(`${kvUrl}/set/${STORAGE_KEY}_${project.id}`, {
            method: 'POST',
            body: JSON.stringify(project)
          });
          if (!response.ok) {
            console.warn('[DB] KV save failed, falling back to localStorage');
          }
        }
      }

      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        const projects: Project[] = stored ? JSON.parse(stored) : [];
        const index = projects.findIndex(p => p.id === project.id);

        if (index >= 0) {
          projects[index] = project;
        } else {
          projects.push(project);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 20)));
      }

      return true;
    } catch (error) {
      console.error('[DB] Error saving project:', project.id, error);
      return false;
    }
  },

  /**
   * 删除项目
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      if (isServerSide) {
        const kvUrl = process.env.KV_URL;
        if (kvUrl) {
          await fetch(`${kvUrl}/del/${STORAGE_KEY}_${id}`, { method: 'DELETE' });
        }
      }

      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const projects: Project[] = JSON.parse(stored);
          const filtered = projects.filter(p => p.id !== id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }
      }

      return true;
    } catch (error) {
      console.error('[DB] Error deleting project:', id, error);
      return false;
    }
  },

  /**
   * 验证项目是否存在且有效
   */
  async validateProject(id: string): Promise<{ valid: boolean; error?: string }> {
    const project = await this.getProject(id);

    if (!project) {
      return { valid: false, error: '项目不存在' };
    }

    if (project.status !== 'active') {
      return { valid: false, error: '项目已停用' };
    }

    return { valid: true };
  }
};

export default db;
