export interface AppConfig {
  apiKey?: string;
  productionDomain?: string;
  theme?: 'light' | 'dark';
}

const STORAGE_KEYS = {
  CONFIG: 'smartguide_config',
};

export class ConfigService {
  private static instance: ConfigService;
  private config: Partial<AppConfig> = {};

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
        if (stored) {
          this.config = JSON.parse(stored);
        }
      } catch {
        this.config = {};
      }
    }
  }

  private saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    }
  }

  setApiKey(key: string): void {
    this.config.apiKey = key;
  }

  getApiKey(): string {
    if (this.config.apiKey) {
      return this.config.apiKey;
    }
    return '';
  }

  clearApiKey(): void {
    this.config.apiKey = '';
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) {
        try {
          const config = JSON.parse(stored);
          delete config.apiKey;
          localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
        } catch {
          localStorage.removeItem(STORAGE_KEYS.CONFIG);
        }
      }
      localStorage.removeItem('zhipuApiKey');
    }
  }

  hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  setProductionDomain(domain: string): void {
    this.config.productionDomain = domain;
    this.saveToStorage();
  }

  getProductionDomain(): string {
    return this.config.productionDomain || '';
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.config.theme = theme;
    this.saveToStorage();
  }

  getTheme(): 'light' | 'dark' {
    return this.config.theme || 'light';
  }

  clearAll(): void {
    this.config = {};
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      localStorage.removeItem('zhipuApiKey');
    }
  }
}

export const configService = ConfigService.getInstance();
