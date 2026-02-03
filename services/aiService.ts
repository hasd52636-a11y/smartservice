
import { KnowledgeItem, AIProvider } from "../types";

// 智谱AI API配置
const ZHIPU_BASE_URL = '/api/zhipu'

// 智谱模型类型 - 基于官方API文档，保持简洁
export enum ZhipuModel {
  // 主力文本模型
  GLM_4_7 = 'glm-4.7',                    // 最新旗舰模型（默认）
  GLM_4_6 = 'glm-4.6',                    // 高性价比选择
  GLM_4_5_FLASH = 'glm-4.5-flash',        // 免费模型
  
  // 视觉模型
  GLM_4_6V = 'glm-4.6v',                  // 主力视觉模型
  
  // 音频模型
  GLM_4_VOICE = 'glm-4-voice',            // 语音模型
  
  // 向量模型
  EMBEDDING_3 = 'embedding-3',            // 向量化模型
  
  // 实时模型
  GLM_REALTIME = 'glm-realtime-flash',    // 实时交互
}

// 智能路由配置 - 根据任务类型自动选择最优模型
export interface SmartRoutingConfig {
  textChat: string;           // 文本对话
  codeGeneration: string;     // 代码生成
  imageAnalysis: string;      // 图片分析
  voiceInteraction: string;   // 语音交互
  embedding: string;          // 向量化
  realtime: string;          // 实时交互
  rolePlay: string;          // 角色扮演
  thinking: string;          // 深度思考
}

// 默认智能路由配置 - 基于最新模型性能和成本优化
export const DEFAULT_SMART_ROUTING: SmartRoutingConfig = {
  textChat: ZhipuModel.GLM_4_7,              // 最新旗舰模型，最佳对话体验
  codeGeneration: ZhipuModel.GLM_4_7,        // Agentic Coding 专用优化
  imageAnalysis: ZhipuModel.GLM_4_6V,        // 最强视觉理解能力
  voiceInteraction: ZhipuModel.GLM_4_VOICE,  // 专业语音模型
  embedding: ZhipuModel.EMBEDDING_3,         // 最新向量模型
  realtime: ZhipuModel.GLM_REALTIME,         // 实时交互专用
  rolePlay: ZhipuModel.GLM_4_7,           // 使用通用模型
  thinking: ZhipuModel.GLM_4_7,             // 支持思考模式
};

// 高性价比路由配置 - 成本优化版本
export const COST_OPTIMIZED_ROUTING: SmartRoutingConfig = {
  textChat: ZhipuModel.GLM_4_5_FLASH,        // 免费高效
  codeGeneration: ZhipuModel.GLM_4_6,        // 高性价比编码
  imageAnalysis: ZhipuModel.GLM_4_6V,  // 视觉分析
  voiceInteraction: ZhipuModel.GLM_4_VOICE,  // 语音专用
  embedding: ZhipuModel.EMBEDDING_3,         // 向量化
  realtime: ZhipuModel.GLM_REALTIME,     // 实时交互
  rolePlay: ZhipuModel.GLM_4_5_FLASH,       // 通用模型
  thinking: ZhipuModel.GLM_4_6,             // 思考能力
};

// 任务类型检测
export enum TaskType {
  TEXT_CHAT = 'textChat',
  CODE_GENERATION = 'codeGeneration', 
  IMAGE_ANALYSIS = 'imageAnalysis',
  VOICE_INTERACTION = 'voiceInteraction',
  EMBEDDING = 'embedding',
  REALTIME = 'realtime',
  ROLE_PLAY = 'rolePlay',
  THINKING = 'thinking'
}
export interface FunctionTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

// 流式回调类型
export type StreamCallback = (chunk: string, isDone: boolean, finishReason?: string) => void;

// GLM-Realtime回调类型
export type RealtimeCallback = (data: any, type: 'audio' | 'video' | 'text' | 'annotation' | 'status') => void;

// 虚拟人状态接口
export interface AvatarState {
  expression: string;
  gesture: string;
  speech: string;
  mouthShape: string;
}

// 标注接口
export interface Annotation {
  id: string;
  type: 'arrow' | 'circle' | 'text' | 'highlight';
  position: { x: number; y: number; z?: number };
  size: { width: number; height: number };
  content: string;
  color: string;
  timestamp: number;
}

export class AIService {
  private realtimeWebSocket: WebSocket | null = null;
  private realtimeCallbacks: RealtimeCallback[] = [];
  private streamId: string | null = null;
  private isRealtimeConnected: boolean = false;
  private zhipuApiKey: string = '';

  // 简单的智能路由 - 根据内容自动选择模型
  private getOptimalModel(prompt: string, options?: any): string {
    // 如果用户指定了模型，优先使用
    if (options?.model) {
      return options.model;
    }
    
    const lowerPrompt = prompt.toLowerCase();
    
    // 图片分析 -> 视觉模型
    if (options?.imageUrl || options?.imageBuffer || 
        lowerPrompt.includes('图片') || lowerPrompt.includes('image')) {
      return ZhipuModel.GLM_4_6V;
    }
    
    // 语音相关 -> 语音模型
    if (options?.audioData || lowerPrompt.includes('语音') || lowerPrompt.includes('voice')) {
      return ZhipuModel.GLM_4_VOICE;
    }
    
    // 默认使用最新旗舰模型
    return ZhipuModel.GLM_4_7;
  }

  // 重试机制配置
  private retryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  };

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 智谱API请求 - 支持后端代理模式（兼容现有路径）
  private async zhipuFetch(endpoint: string, body: any, isBinary: boolean = false, retryCount: number = 0) {
    try {
      // 对于chat/completions，优先尝试新的代理路径，失败时回退到原路径
      if (endpoint === '/chat/completions') {
        try {
          return await this.proxyFetch(body, isBinary);
        } catch (proxyError) {
          console.warn('New proxy failed, falling back to original path:', proxyError);
          // 继续使用原有的zhipu路径
        }
      }

      // 获取API密钥
      const apiKey = this.getZhipuApiKey();
      if (!apiKey) {
        throw new Error('智谱AI API密钥未设置，请先配置API密钥');
      }

      const response = await fetch(`${ZHIPU_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = 'Zhipu API Error';
        let errorData = null;
        try {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          try {
            errorData = JSON.parse(errorText);
            errorMessage = errorData?.error?.message || errorData?.message || errorMessage;
          } catch (jsonError) {
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }

        // 检查是否需要重试
        if (this.retryConfig.retryableStatuses.includes(response.status) && retryCount < this.retryConfig.maxRetries) {
          await this.delay(this.retryConfig.retryDelay * (retryCount + 1));
          return this.zhipuFetch(endpoint, body, isBinary, retryCount + 1);
        }

        throw new Error(`${errorMessage} (${response.status})`);
      }

      return isBinary ? response.arrayBuffer() : response.json();
    } catch (error) {
      console.error('Zhipu API request failed:', error);
      
      // 网络错误重试
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('timeout')) && retryCount < this.retryConfig.maxRetries) {
        await this.delay(this.retryConfig.retryDelay * (retryCount + 1));
        return this.zhipuFetch(endpoint, body, isBinary, retryCount + 1);
      }
      
      throw error;
    }
  }

  // 后端代理请求（推荐用于生产环境）
  private async proxyFetch(body: any, isBinary: boolean = false) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: body.messages,
          projectId: body.projectId || 'default',
          stream: body.stream || false,
          model: body.model,
          temperature: body.temperature,
          max_tokens: body.max_tokens
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return isBinary ? response.arrayBuffer() : response.json();
    } catch (error) {
      console.error('Proxy API request failed:', error);
      throw error;
    }
  }

  // 智谱流式请求
  private async zhipuStreamFetch(endpoint: string, body: any, callback: StreamCallback, retryCount: number = 0) {
    try {
      // 获取API密钥
      const apiKey = this.getZhipuApiKey();
      if (!apiKey) {
        throw new Error('智谱AI API密钥未设置，请先配置API密钥');
      }

      const response = await fetch(`${ZHIPU_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = 'Zhipu API Error';
        let errorData = null;
        try {
          const errorText = await response.text();
          console.error('Stream error response text:', errorText);
          try {
            errorData = JSON.parse(errorText);
            errorMessage = errorData?.error?.message || errorData?.message || errorMessage;
          } catch (jsonError) {
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing stream error response:', parseError);
        }

        // 检查是否需要重试
        if (this.retryConfig.retryableStatuses.includes(response.status) && retryCount < this.retryConfig.maxRetries) {
          await this.delay(this.retryConfig.retryDelay * (retryCount + 1));
          return this.zhipuStreamFetch(endpoint, body, callback, retryCount + 1);
        }

        throw new Error(`${errorMessage} (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        try {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6).trim();
                if (data === '[DONE]') {
                  callback('', true, 'stop');
                } else if (data) {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content || '';
                    if (content) {
                      callback(content, false);
                    }
                    if (parsed.choices[0]?.finish_reason) {
                      callback('', true, parsed.choices[0].finish_reason);
                    }
                  } catch (error) {
                    // 忽略JSON解析错误，可能是不完整的数据块
                    console.warn('Skipping malformed SSE chunk:', data.substring(0, 100));
                  }
                }
              }
            }
          }
        } catch (streamError) {
          console.error('Stream reading error:', streamError);
          // 流式读取错误，不重试，直接通知回调
          callback('', true, 'error');
          throw streamError;
        }
      }
    } catch (error) {
      console.error('Zhipu API stream request failed:', error);
      
      // 网络错误重试
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('timeout')) && retryCount < this.retryConfig.maxRetries) {
        await this.delay(this.retryConfig.retryDelay * (retryCount + 1));
        return this.zhipuStreamFetch(endpoint, body, callback, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Enhanced RAG Logic (Retrieval Augmented Generation)
   */
  private retrieveRelevantKnowledge(prompt: string, knowledge: KnowledgeItem[]): KnowledgeItem[] {
    const query = prompt.toLowerCase();
    
    // 计算每个知识项的相关性得分
    const scoredItems = knowledge.map(item => {
      let score = 0;
      
      // 标题匹配得分（权重最高）
      if (item.title.toLowerCase().includes(query)) {
        score += 3.0;
      }
      
      // 内容匹配得分
      if (item.content.toLowerCase().includes(query)) {
        score += 2.0;
      }
      
      // 标签匹配得分
      if (item.tags && item.tags.some(t => t.toLowerCase().includes(query))) {
        score += 1.5;
      }
      
      // 关键词匹配（简单的分词匹配）
      const queryWords = query.split(/\s+/).filter(word => word.length > 1);
      const itemText = `${item.title} ${item.content}`.toLowerCase();
      
      queryWords.forEach(word => {
        if (itemText.includes(word)) {
          score += 0.5;
        }
      });
      
      return { item, score };
    });
    
    // 按得分排序并返回前5个最相关的
    return scoredItems
      .filter(item => item.score > 0) // 只返回有匹配的
      .sort((a, b) => b.score - a.score) // 按得分降序
      .slice(0, 5) // 最多返回5个
      .map(item => item.item); // 提取知识项
  }

  async getSmartResponse(prompt: string, knowledge: KnowledgeItem[], provider: AIProvider, systemInstruction: string, options?: {
    stream?: boolean;
    callback?: StreamCallback;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: FunctionTool[];
    responseFormat?: { type: 'text' | 'json_object' };
    projectConfig?: any; // 添加项目配置参数
  }) {
    // 检查API密钥是否存在
    if (!this.zhipuApiKey) {
      const mockResponse = this.generateMockResponse(prompt, knowledge, options?.projectConfig);
      
      if (options?.stream && options?.callback) {
        // 模拟流式输出
        const words = mockResponse.split('');
        let index = 0;
        const streamInterval = setInterval(() => {
          if (index < words.length) {
            options.callback!(words[index], false);
            index++;
          } else {
            options.callback!('', true, 'stop');
            clearInterval(streamInterval);
          }
        }, 50); // 每50ms输出一个字符，模拟打字效果
        return '';
      } else {
        return mockResponse;
      }
    }

    try {
      const combinedKnowledge = knowledge;
      
      // 1. 向量化用户查询
      const queryEmbedding = await this.createEmbedding(prompt, {
        model: ZhipuModel.EMBEDDING_3,
        dimensions: 768
      });
      
      // 2. 向量化知识库文档（如果尚未向量化）
      const vectorizedKnowledge = await Promise.all(
        combinedKnowledge.map(async (item) => {
          if (!item.embedding) {
            const embeddingResult = await this.createEmbedding(item.content, {
              model: ZhipuModel.EMBEDDING_3,
              dimensions: 768
            });
            const embedding = embeddingResult.data[0].embedding;
            return { ...item, embedding };
          }
          return item;
        })
      );
      
      // 3. 计算相似度并排序
      const scoredItems = vectorizedKnowledge.map(item => {
        const score = this.cosineSimilarity(
          queryEmbedding.data[0].embedding,
          item.embedding!
        );
        
        // 产品知识库优先处理
        const isProductKnowledge = true;
        const weightedScore = score * 1.2;
        
        return {
          item,
          score: weightedScore,
          isProductKnowledge
        };
      });
      
      // 4. 过滤和排序
      const relevantItems = scoredItems
        .filter(item => item.score > 0.3) // 阈值过滤
        .sort((a, b) => b.score - a.score) // 按分数排序
        .slice(0, 5) // 最多返回5个相关文档
        .map(item => ({
          ...item.item,
          source: 'product'
        }));
      
      // 5. 构建上下文
      const context = relevantItems.length > 0 
        ? relevantItems.map((item, index) => {
            const sourceLabel = item.source === 'product' ? '产品知识库' : '通用知识库';
            return `[${sourceLabel} ${index + 1}: ${item.title}]\n${item.content}`;
          }).join('\n\n')
        : "No direct match in knowledge base. When no relevant information is found, you must clearly state that you don't have specific information about the topic and suggest contacting human customer service.";

      const fullPrompt = `You are a product support AI specialized in providing accurate answers based on the provided knowledge base.\n\nIMPORTANT GUIDELINES:\n1. **Strictly use only the information provided in the context** for your answers
2. **Prioritize product-specific knowledge** over general knowledge when both are available
3. **Cite the source** of your information by referencing the knowledge item number and source
4. **If no relevant information is found**, clearly state that you don't have specific information about the topic\n5. **Be concise and direct** in your responses\n6. **Maintain a professional and helpful tone**\n\nContext:\n${context}\n\nUser Question: ${prompt}`;

      // 仅使用智谱AI实现，启用智能路由
      const optimalModel = this.getOptimalModel(prompt, options);
      
      // 根据模型类型构建不同的消息格式
      let messages;
      if (optimalModel === ZhipuModel.GLM_4_VOICE) {
        // GLM-4-Voice 需要特殊的消息格式
        messages = [
          { role: 'system', content: [{ type: 'text', text: systemInstruction }] },
          { role: 'user', content: [{ type: 'text', text: fullPrompt }] }
        ];
      } else {
        // 普通文本模型
        messages = [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: fullPrompt }
        ];
      }
      
      const requestBody = {
        model: optimalModel,
        messages: messages,
        temperature: options?.temperature || 0.1,
        max_tokens: options?.maxTokens || 1024,
        stream: options?.stream || false,
        tools: options?.tools,
        response_format: options?.responseFormat,
        projectId: options?.projectConfig?.id || 'default' // 添加项目ID用于后端代理
      };

      if (options?.stream && options?.callback) {
        await this.zhipuStreamFetch('/chat/completions', requestBody, options.callback);
        return '';
      } else {
        const data = await this.zhipuFetch('/chat/completions', requestBody);
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('向量检索失败，使用传统关键词检索:', error);
      
      // 如果API调用失败，回退到模拟响应
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('401'))) {
        const mockResponse = this.generateMockResponse(prompt, knowledge);
        
        if (options?.stream && options?.callback) {
          // 模拟流式输出
          const words = mockResponse.split('');
          let index = 0;
          const streamInterval = setInterval(() => {
            if (index < words.length) {
              options.callback!(words[index], false);
              index++;
            } else {
              options.callback!('', true, 'stop');
              clearInterval(streamInterval);
            }
          }, 50);
          return '';
        } else {
          return mockResponse;
        }
      }
      
      // 回退到传统关键词检索
      try {
        const combinedKnowledge = knowledge;
        
        const relevantItems = this.retrieveRelevantKnowledge(prompt, combinedKnowledge);
        const context = relevantItems.length > 0 
          ? relevantItems.map((item, index) => {
              const sourceLabel = '产品知识库';
              return `[${sourceLabel} ${index + 1}: ${item.title}]\n${item.content}`;
            }).join('\n\n')
          : "No direct match in knowledge base. When no relevant information is found, you must clearly state that you don't have specific information about the topic and suggest contacting human customer service.";

        const fullPrompt = `You are a product support AI specialized in providing accurate answers based on the provided knowledge base.\n\nIMPORTANT GUIDELINES:\n1. **Strictly use only the information provided in the context** for your answers
2. **Prioritize product-specific knowledge** over general knowledge when both are available
3. **Cite the source** of your information by referencing the knowledge item number and source
4. **If no relevant information is found**, clearly state that you don't have specific information about the topic\n5. **Be concise and direct** in your responses\n6. **Maintain a professional and helpful tone**\n\nContext:\n${context}\n\nUser Question: ${prompt}`;

        const optimalModel = this.getOptimalModel(prompt, options);
        
        // 根据模型类型构建不同的消息格式
        let messages;
        if (optimalModel === ZhipuModel.GLM_4_VOICE) {
          // GLM-4-Voice 需要特殊的消息格式
          messages = [
            { role: 'system', content: [{ type: 'text', text: systemInstruction }] },
            { role: 'user', content: [{ type: 'text', text: fullPrompt }] }
          ];
        } else {
          // 普通文本模型
          messages = [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: fullPrompt }
          ];
        }
        
        const requestBody = {
          model: optimalModel,
          messages: messages,
          temperature: options?.temperature || 0.1,
          max_tokens: options?.maxTokens || 1024,
          stream: options?.stream || false,
          tools: options?.tools,
          response_format: options?.responseFormat
        };

        if (options?.stream && options?.callback) {
          await this.zhipuStreamFetch('/chat/completions', requestBody, options.callback);
          return '';
        } else {
          const data = await this.zhipuFetch('/chat/completions', requestBody);
          return data.choices[0].message.content;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw error; // 抛出原始错误
      }
    }
  }

  // 智谱模型多模态分析（支持图片、视频、文件）
  async analyzeMultimodal(content: any[], provider: AIProvider, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    // 仅使用智谱AI实现
    const data = await this.zhipuFetch('/chat/completions', {
      model: options?.model || 'glm-4.6v',
      messages: [{
        role: 'user',
        content: content
      }],
      temperature: options?.temperature || 0.1,
      max_tokens: options?.maxTokens || 1024
    });
    return data.choices[0].message.content;
  }

  // 智谱模型工具调用
  async callTool(functionName: string, args: any, provider: AIProvider) {
    // 仅使用智谱AI实现
    const data = await this.zhipuFetch('/chat/completions', {
      model: 'glm-4.7',
      messages: [{
        role: 'tool',
        content: JSON.stringify(args),
        tool_call_id: `tool_${Date.now()}`
      }],
      temperature: 0.1
    });
    return data.choices[0].message.content;
  }

  // 智谱模型语音识别
  async recognizeSpeech(audioData: string, provider: AIProvider): Promise<string | undefined> {
    // 检查API密钥是否存在
    if (!this.zhipuApiKey) {
      return this.generateMockSpeechRecognition();
    }

    if (provider === AIProvider.ZHIPU) {
      try {
        const data = await this.zhipuFetch('/chat/completions', {
          model: 'glm-4-voice',
          messages: [{
            role: 'user',
            content: [
              { type: 'input_audio', input_audio: {
                data: audioData,
                format: 'wav'
              }}
            ]
          }],
          temperature: 0.1
        });
        return data.choices[0].message.content;
      } catch (e) {
        console.error("Zhipu Speech Recognition Failed", e);
        return this.generateMockSpeechRecognition();
      }
    }

    return this.generateMockSpeechRecognition();
  }

  // 测试智谱API连接
  async testZhipuConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = this.getZhipuApiKey();
      if (!apiKey) {
        return { 
          success: false, 
          message: '请先配置智谱AI API密钥' 
        };
      }

      const data = await this.zhipuFetch('/chat/completions', {
        model: 'glm-4.7',
        messages: [
          { role: 'user', content: 'ping' }
        ],
        temperature: 0.1,
        max_tokens: 10
      });
      return { 
        success: true, 
        message: `连接成功！模型: ${data.model || 'glm-4.7'}` 
      };
    } catch (error) {
      let errorMessage = '连接失败';
      if (error instanceof Error) {
        if (error.message.includes('1002')) {
          errorMessage = 'API密钥无效，请检查密钥是否正确';
        } else if (error.message.includes('1001')) {
          errorMessage = '请先配置API密钥';
        } else if (error.message.includes('404')) {
          errorMessage = 'API端点不存在，请检查网络连接';
        } else {
          errorMessage = error.message;
        }
      }
      return { 
        success: false, 
        message: errorMessage
      };
    }
  }

  async analyzeInstallation(imageBuffer: string, visionPrompt: string, provider: AIProvider) {
    // 检查API密钥是否存在
    if (!this.zhipuApiKey) {
      return this.generateMockImageAnalysis(visionPrompt);
    }

    try {
      // 仅使用智谱AI实现
      const data = await this.zhipuFetch('/chat/completions', {
        model: 'glm-4.6v',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt },
            { type: 'image_url', image_url: { url: imageBuffer } }
          ]
        }]
      });
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Image analysis failed, using mock response:', error);
      return this.generateMockImageAnalysis(visionPrompt);
    }
  }

  async generateSpeech(text: string, voiceName: string, provider: AIProvider): Promise<string | undefined> {
    // 检查API密钥是否存在
    if (!this.zhipuApiKey) {
      return undefined;
    }

    // 仅使用智谱AI实现
    try {
      const buffer = await this.zhipuFetch('/audio/speech', {
        model: 'glm-tts',
        input: text,
        voice: voiceName || 'tongtong',
        response_format: 'wav'
      }, true);
      
      const uint8 = new Uint8Array(buffer as ArrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i]);
      return window.btoa(binary);
    } catch (e) {
      console.error("Zhipu TTS Failed", e);
      return undefined;
    }
  }

  async generateVideoGuide(prompt: string, provider: AIProvider, imageUrl?: string) {
    // 检查API密钥是否存在
    const key = this.getZhipuApiKey();
    if (!key) {
      throw new Error('No Zhipu API key provided');
    }
    
    try {
      // 生成视频脚本
      const videoScript = await this.zhipuFetch('/chat/completions', {
        model: 'glm-4.7',
        messages: [
          {
            role: 'system',
            content: 'You are a professional video script writer. Create a detailed script for a product installation video based on the given prompt.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      });
      
      // 模拟视频生成过程（实际部署时替换为真实的CogVideoX-3 API调用）
      // 注意：实际的CogVideoX-3 API调用需要后端服务
      // 前端直接调用会暴露API密钥，不安全
      // 以下是后端服务的参考实现：
      /*
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/videos/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'cogvideox-3',
          prompt: prompt,
          image_url: imageUrl,
          quality: 'quality',
          with_audio: true,
          size: '1920x1080',
          fps: 30
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || 'Video generation failed');
      }
      
      const result = await response.json();
      // 轮询获取视频生成结果
      const videoResult = await this.pollVideoGeneration(result.id, key);
      return {
        url: videoResult.video_url,
        status: 'approved',
        title: prompt.substring(0, 50),
        description: prompt,
        type: 'ai',
        metadata: {
          script: videoScript.choices[0].message.content,
          duration: 60,
          resolution: '1920x1080',
          format: 'mp4'
        }
      };
      */
      
      // 返回示例视频信息（实际部署时替换为真实的视频生成服务）
      return {
        url: "https://cdn.bigmodel.cn/static/platform/videos/doc_solutions/Realtime-%E5%94%B1%E6%AD%8C.m4v",
        status: 'pending',
        title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
        description: prompt,
        type: 'ai',
        createdAt: new Date().toISOString(),
        metadata: {
          script: videoScript.choices[0].message.content,
          duration: 60,
          resolution: '1920x1080',
          format: 'mp4',
          generatedBy: 'CogVideoX-3'
        }
      };
    } catch (error) {
      console.error('Error generating video guide:', error);
      throw error;
    }
  }
  
  // 轮询视频生成结果（实际部署时使用）
  private async pollVideoGeneration(videoId: string, apiKey: string): Promise<any> {
    const pollInterval = 3000; // 每3秒轮询一次
    const maxAttempts = 30; // 最多轮询30次（90秒）
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`https://open.bigmodel.cn/api/paas/v4/videos/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to poll video generation status');
      }
      
      const result = await response.json();
      
      if (result.status === 'succeeded') {
        return result;
      } else if (result.status === 'failed') {
        throw new Error(result.error.message || 'Video generation failed');
      }
      
      // 等待下一次轮询
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('Video generation timed out');
  }

  // GLM-Realtime连接管理
  async connectToRealtime(callback: RealtimeCallback): Promise<boolean> {
    try {
      const key = this.getZhipuApiKey();
      
      // 检查API密钥是否存在
      if (!key) {
        console.error('GLM-Realtime connection failed: No API key provided');
        callback({ error: '缺少API密钥，请联系管理员' }, 'status');
        return false;
      }
      
      const endpoint = `wss://open.bigmodel.cn/api/paas/v4/realtime?model=${ZhipuModel.GLM_REALTIME}`;
      
      this.realtimeWebSocket = new WebSocket(endpoint);
      this.realtimeCallbacks.push(callback);
      
      let connectionResolved = false;
      
      return new Promise((resolve) => {
        this.realtimeWebSocket!.onopen = () => {
          // 发送认证消息
          try {
            const authMessage = JSON.stringify({
              type: 'auth',
              data: {
                token: key
              }
            });
            this.realtimeWebSocket?.send(authMessage);
          } catch (error) {
            console.error('Error sending auth message:', error);
            callback({ error: '认证消息发送失败' }, 'status');
            resolve(false);
          }
        };
        
        this.realtimeWebSocket!.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // 处理认证响应
            if (data.type === 'auth' && data.data) {
              if (data.data.status === 'success') {
                this.isRealtimeConnected = true;
                callback({ status: 'connected' }, 'status');
                if (!connectionResolved) {
                  connectionResolved = true;
                  resolve(true);
                }
              } else if (data.data.status === 'error') {
                console.error('GLM-Realtime authentication failed:', data.data.message);
                callback({ error: `认证失败: ${data.data.message}` }, 'status');
                if (!connectionResolved) {
                  connectionResolved = true;
                  resolve(false);
                }
              }
            }
            
            // 处理其他消息类型
            switch (data.type) {
              case 'audio':
                callback(data.data, 'audio');
                break;
              case 'video':
                callback(data.data, 'video');
                break;
              case 'text':
                callback(data.data, 'text');
                break;
              case 'annotation':
                callback(data.data, 'annotation');
                break;
              case 'status':
                callback(data.data, 'status');
                break;
              case 'error':
                console.error('GLM-Realtime error:', data.data);
                callback({ error: data.data }, 'status');
                break;
              case 'response.content_part.done':
                callback({ ...data, type: 'content_part_done' }, 'text');
                break;
              case 'response.function_call_arguments.done':
                callback({ ...data, type: 'function_call_done', function_name: data.name, function_arguments: data.arguments }, 'text');
                break;
              case 'response.function_call.simple_browser':
                callback(data, 'text');
                break;
              case 'response.text.delta':
                callback(data, 'text');
                break;
              case 'response.text.done':
                callback(data, 'text');
                break;
              case 'response.audio_transcript.delta':
                callback(data, 'text');
                break;
              case 'response.audio_transcript.done':
                callback(data, 'text');
                break;
              case 'response.audio.delta':
                callback(data, 'audio');
                break;
              case 'response.audio.done':
                callback(data, 'audio');
                break;
              case 'response.created':
                callback(data, 'status');
                break;
              case 'response.cancelled':
                callback(data, 'status');
                break;
              case 'response.done':
                callback(data, 'status');
                break;
              case 'rate_limits.updated':
                callback(data, 'status');
                break;
              case 'heartbeat':
                // 忽略心跳消息，避免过多日志
                break;
              default:
                break;
            }
          } catch (error) {
            console.error('Error parsing realtime message:', error);
          }
        };
        
        this.realtimeWebSocket!.onclose = (event) => {
          this.isRealtimeConnected = false;
          callback({ status: 'disconnected' }, 'status');
          if (!connectionResolved) {
            connectionResolved = true;
            resolve(false);
          }
        };
        
        this.realtimeWebSocket!.onerror = (error) => {
          console.error('GLM-Realtime WebSocket error:', error);
          callback({ error: 'WebSocket连接错误' }, 'status');
          if (!connectionResolved) {
            connectionResolved = true;
            resolve(false);
          }
        };
        
        // 设置连接超时
        setTimeout(() => {
          if (!connectionResolved) {
            connectionResolved = true;
            callback({ error: '连接超时' }, 'status');
            this.realtimeWebSocket?.close();
            resolve(false);
          }
        }, 10000); // 10秒超时
      });
    } catch (error) {
      console.error('Failed to connect to GLM-Realtime:', error);
      callback({ error: '连接失败' }, 'status');
      return false;
    }
  }

  // 发送视频帧到GLM-Realtime
  sendVideoFrame(frame: Blob | string) {
    if (!this.isRealtimeConnected || !this.realtimeWebSocket) {
      console.warn('GLM-Realtime not connected');
      return;
    }
    
    try {
      this.realtimeWebSocket.send(JSON.stringify({
        type: 'video',
        data: {
          frame: typeof frame === 'string' ? frame : frame,
          format: typeof frame === 'string' ? 'base64' : 'blob'
        }
      }));
    } catch (error) {
      console.error('Error sending video frame:', error);
    }
  }

  // 发送音频数据到GLM-Realtime
  sendAudioData(audio: Blob | string) {
    if (!this.isRealtimeConnected || !this.realtimeWebSocket) {
      console.warn('GLM-Realtime not connected');
      return;
    }
    
    try {
      this.realtimeWebSocket.send(JSON.stringify({
        type: 'audio',
        data: {
          audio: typeof audio === 'string' ? audio : audio,
          format: typeof audio === 'string' ? 'base64' : 'blob'
        }
      }));
    } catch (error) {
      console.error('Error sending audio data:', error);
    }
  }

  // 发送文本消息到GLM-Realtime
  sendTextMessage(text: string) {
    if (!this.isRealtimeConnected || !this.realtimeWebSocket) {
      console.warn('GLM-Realtime not connected');
      return;
    }
    
    try {
      this.realtimeWebSocket.send(JSON.stringify({
        type: 'text',
        data: {
          text: text
        }
      }));
    } catch (error) {
      console.error('Error sending text message:', error);
    }
  }

  // 控制虚拟人
  controlAvatar(avatarState: Partial<AvatarState>) {
    if (!this.isRealtimeConnected || !this.realtimeWebSocket) {
      console.warn('GLM-Realtime not connected');
      return;
    }
    
    try {
      this.realtimeWebSocket.send(JSON.stringify({
        type: 'avatar',
        data: avatarState
      }));
    } catch (error) {
      console.error('Error controlling avatar:', error);
    }
  }

  // 添加标注
  addAnnotation(annotation: Omit<Annotation, 'id' | 'timestamp'>) {
    if (!this.isRealtimeConnected || !this.realtimeWebSocket) {
      console.warn('GLM-Realtime not connected');
      return;
    }
    
    try {
      const fullAnnotation = {
        ...annotation,
        id: `annot_${Date.now()}`,
        timestamp: Date.now()
      };
      
      this.realtimeWebSocket.send(JSON.stringify({
        type: 'annotation',
        data: {
          action: 'add',
          annotation: fullAnnotation
        }
      }));
      
      return fullAnnotation;
    } catch (error) {
      console.error('Error adding annotation:', error);
      return null;
    }
  }

  // 更新标注
  updateAnnotation(id: string, updates: Partial<Annotation>) {
    if (!this.isRealtimeConnected || !this.realtimeWebSocket) {
      console.warn('GLM-Realtime not connected');
      return;
    }
    
    try {
      this.realtimeWebSocket.send(JSON.stringify({
        type: 'annotation',
        data: {
          action: 'update',
          id: id,
          updates: updates
        }
      }));
    } catch (error) {
      console.error('Error updating annotation:', error);
    }
  }

  // 删除标注
  deleteAnnotation(id: string) {
    if (!this.isRealtimeConnected || !this.realtimeWebSocket) {
      console.warn('GLM-Realtime not connected');
      return;
    }
    
    try {
      this.realtimeWebSocket.send(JSON.stringify({
        type: 'annotation',
        data: {
          action: 'delete',
          id: id
        }
      }));
    } catch (error) {
      console.error('Error deleting annotation:', error);
    }
  }

  // 断开GLM-Realtime连接
  disconnectFromRealtime() {
    if (this.realtimeWebSocket) {
      this.realtimeWebSocket.close();
      this.realtimeWebSocket = null;
      this.isRealtimeConnected = false;
      this.realtimeCallbacks = [];
      this.streamId = null;
    }
  }

  // 检查GLM-Realtime连接状态
  isRealtimeConnectionActive(): boolean {
    return this.isRealtimeConnected && this.realtimeWebSocket !== null;
  }

  // 向量模型：创建文本嵌入
  async createEmbedding(texts: string | string[], options?: {
    model?: string;
    dimensions?: number;
  }): Promise<any> {
    const requestBody = {
      model: options?.model || ZhipuModel.EMBEDDING_3,
      input: Array.isArray(texts) ? texts : [texts],
      dimensions: options?.dimensions
    };

    const data = await this.zhipuFetch('/embeddings', requestBody);
    return data;
  }

  // 计算向量相似度（余弦相似度）
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  // 生成模拟响应（当没有API密钥时使用）
  private generateMockResponse(prompt: string, knowledge: KnowledgeItem[], projectConfig?: any): string {
    // 确保prompt是字符串类型，处理各种可能的输入
    let promptStr = '';
    if (typeof prompt === 'string') {
      promptStr = prompt;
    } else if (prompt && typeof prompt === 'object' && 'target' in prompt) {
      // 如果是事件对象，尝试获取值
      promptStr = (prompt as any).target?.value || '';
    } else {
      promptStr = String(prompt || '');
    }
    
    const lowerPrompt = promptStr.toLowerCase();
    
    // 获取联系信息（优先使用项目配置，否则使用默认值）
    const supportPhone = projectConfig?.supportPhone || '400-888-6666';
    const supportWebsite = projectConfig?.supportWebsite || 'www.aivirtualservice.com';
    const companyName = projectConfig?.companyName || '中恒创世';
    
    // 检查是否有相关的知识库内容
    const relevantItems = this.retrieveRelevantKnowledge(promptStr, knowledge);
    
    if (relevantItems.length > 0) {
      // 如果有相关知识，基于知识库内容生成响应
      const firstItem = relevantItems[0];
      return `根据产品知识库，关于"${promptStr}"的信息：\n\n${firstItem.content.substring(0, 200)}${firstItem.content.length > 200 ? '...' : ''}\n\n如需更详细信息，请联系${companyName}技术支持：${supportPhone}`;
    }
    
    // 常见问题的模拟响应
    if (lowerPrompt.includes('安装') || lowerPrompt.includes('install')) {
      return `关于产品安装，建议您：\n\n1. 仔细阅读产品说明书\n2. 确保安装环境符合要求\n3. 按照步骤逐一操作\n4. 如遇问题请拍照发送给我分析\n\n如需专业技术支持，请联系：${supportPhone}`;
    }
    
    if (lowerPrompt.includes('故障') || lowerPrompt.includes('问题') || lowerPrompt.includes('error')) {
      return `遇到产品故障时，请：\n\n1. 描述具体故障现象\n2. 提供产品型号信息\n3. 上传故障现场照片\n4. 说明使用环境和操作步骤\n\n我会基于这些信息为您提供解决方案。如需人工客服，请拨打：${supportPhone}`;
    }
    
    if (lowerPrompt.includes('使用') || lowerPrompt.includes('操作') || lowerPrompt.includes('how')) {
      return `关于产品使用方法：\n\n1. 请先查看产品说明书\n2. 确保正确连接和设置\n3. 按照操作指南进行\n4. 注意安全事项\n\n如有具体操作问题，请详细描述或上传图片，我会为您提供指导。技术支持热线：${supportPhone}`;
    }
    
    if (lowerPrompt.includes('维护') || lowerPrompt.includes('保养') || lowerPrompt.includes('maintenance')) {
      return `产品维护保养建议：\n\n1. 定期清洁产品表面\n2. 检查连接部件是否松动\n3. 避免在恶劣环境中使用\n4. 按照保养周期进行维护\n\n具体维护方法请参考说明书，或联系技术支持：${supportPhone}`;
    }
    
    // 默认响应
    return `您好！我是智能售后客服助手。\n\n关于您的问题"${promptStr}"，我需要更多信息来为您提供准确的解答。请您：\n\n1. 详细描述问题情况\n2. 提供产品型号\n3. 上传相关图片\n\n这样我能更好地为您服务。如需人工客服，请拨打：${supportPhone}\n\n官网：${supportWebsite}`;
  }

  // 模拟图片分析（当没有API密钥时使用）
  private generateMockImageAnalysis(prompt: string, projectConfig?: any): string {
    const supportPhone = projectConfig?.supportPhone || '400-888-6666';
    const supportWebsite = projectConfig?.supportWebsite || 'www.aivirtualservice.com';
    const companyName = projectConfig?.companyName || '中恒创世';
    
    return `图片分析功能需要AI服务支持。\n\n我看到您上传了图片，但目前AI视觉分析服务需要配置。\n\n请您：\n1. 详细描述图片中的问题\n2. 说明产品型号和使用情况\n3. 联系技术支持获得专业分析\n\n${companyName}技术支持：\n📞 ${supportPhone}\n🌐 ${supportWebsite}\n\n我们的技术专家会为您提供详细的图片分析和解决方案。`;
  }

  // 模拟语音识别（当没有API密钥时使用）
  private generateMockSpeechRecognition(projectConfig?: any): string {
    const supportPhone = projectConfig?.supportPhone || '400-888-6666';
    return `语音识别功能需要AI服务支持，请使用文字输入或联系人工客服：${supportPhone}`;
  }

  // OCR服务：手写体识别
  async recognizeHandwriting(imageFile: File, options?: {
    languageType?: string;
    probability?: boolean;
  }): Promise<any> {
    const key = this.getZhipuApiKey();
    
    // 检查API密钥是否存在
    if (!key) {
      throw new Error('No Zhipu API key provided');
    }
    
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('tool_type', 'hand_write');
      formData.append('language_type', options?.languageType || 'CHN_ENG');
      formData.append('probability', String(options?.probability || false));

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'OCR API Error';
        try {
          const err = await response.json();
          errorMessage = err?.error?.message || err?.message || errorMessage;
        } catch (parseError) {
          console.error('Error parsing OCR error response:', parseError);
        }
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('OCR request failed:', error);
      throw error;
    }
  }

  // OCR服务：通用文本识别（支持印刷体）
  async recognizeOCR(imageFile: File, options?: {
    languageType?: string;
    probability?: boolean;
  }): Promise<any> {
    return this.recognizeHandwriting(imageFile, options);
  }

  // 设置智谱API密钥
  setZhipuApiKey(apiKey: string) {
    this.zhipuApiKey = apiKey;
    // 同时保存到localStorage，以便下次使用
    localStorage.setItem('zhipuApiKey', apiKey);
  }

  // 获取智谱API密钥
  getZhipuApiKey(): string {
    // 优先使用内存中的密钥
    if (this.zhipuApiKey) {
      return this.zhipuApiKey;
    }
    
    // 从Vite环境变量获取（扫码页面优先使用）
    try {
      if (typeof window !== 'undefined' && (window as any).import?.meta?.env?.VITE_ZHIPU_API_KEY) {
        this.zhipuApiKey = (window as any).import.meta.env.VITE_ZHIPU_API_KEY;
        return this.zhipuApiKey;
      }
    } catch (e) {
      console.error('Error accessing import.meta.env:', e);
    }
    
    // 尝试直接访问环境变量
    try {
      if ((globalThis as any).VITE_ZHIPU_API_KEY) {
        this.zhipuApiKey = (globalThis as any).VITE_ZHIPU_API_KEY;
        return this.zhipuApiKey;
      }
    } catch (e) {
      console.error('Error accessing globalThis:', e);
    }
    
    // 从Node.js环境变量获取
    if (typeof process !== 'undefined' && process.env?.ZHIPU_API_KEY) {
      this.zhipuApiKey = process.env.ZHIPU_API_KEY;
      return this.zhipuApiKey;
    }
    
    // 从localStorage获取（用户手动设置）
    if (typeof localStorage !== 'undefined') {
      const savedKey = localStorage.getItem('zhipuApiKey');
      if (savedKey) {
        this.zhipuApiKey = savedKey;
        return savedKey;
      }
    }
    
    // 从window全局变量获取（备用方案）
    if (typeof window !== 'undefined' && (window as any).ZHIPU_API_KEY) {
      this.zhipuApiKey = (window as any).ZHIPU_API_KEY;
      return this.zhipuApiKey;
    }
    
    // 从URL参数获取（扫码页面应急方案）
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const apiKeyParam = urlParams.get('api_key');
      if (apiKeyParam) {
        this.zhipuApiKey = apiKeyParam;
        // 保存到localStorage，避免重复获取
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('zhipuApiKey', apiKeyParam);
        }
        return apiKeyParam;
      }
    }
    
    return '';
  }
}


export const aiService = new AIService();
