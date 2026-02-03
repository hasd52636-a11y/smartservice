import { KnowledgeItem, AIProvider } from "../types";
import { apiKeyService } from "./apiKeyService";
import { createVectorWorker, searchVectorsWithWorker } from "./vectorWorker";

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

// 流式回调类型
export type StreamCallback = (chunk: string, isDone: boolean, finishReason?: string) => void;

export class AIService {
  private zhipuApiKey: string = '';
  private vectorWorker: Worker | null = null;

  // 重试机制配置
  private retryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  };

  constructor() {
    // 移动端优化：初始化Web Worker
    this.initializeVectorWorker();
  }

  // 移动端优化：初始化Web Worker
  private initializeVectorWorker() {
    try {
      this.vectorWorker = createVectorWorker();
      if (this.vectorWorker) {
        console.log('✅ Web Worker initialized for vector calculations');
      }
    } catch (error) {
      console.warn('Web Worker initialization failed, using main thread:', error);
    }
  }

  // 清理资源
  destroy() {
    if (this.vectorWorker) {
      this.vectorWorker.terminate();
      this.vectorWorker = null;
    }
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 移动端优化：主线程向量搜索（回退方案）
  private performMainThreadVectorSearch(
    knowledge: KnowledgeItem[], 
    queryVector: number[], 
    searchThreshold: number, 
    maxContextItems: number
  ): Array<{ item: KnowledgeItem; score: number }> {
    return knowledge
      .filter(item => item.embedding && Array.isArray(item.embedding) && item.embedding.length === 768)
      .map(item => ({
        item,
        score: this.cosineSimilarity(queryVector, item.embedding!)
      }))
      .filter(res => res.score > searchThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxContextItems);
  }

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

  // 设置智谱API密钥
  setZhipuApiKey(apiKey: string) {
    this.zhipuApiKey = apiKey;
    // 同步更新到API密钥服务
    apiKeyService.setZhipuApiKey(apiKey);
  }

  // 获取智谱API密钥 - 优化安全性和性能
  getZhipuApiKey(): string {
    // 优先使用内存中的密钥
    if (this.zhipuApiKey) {
      return this.zhipuApiKey;
    }
    
    // 使用API密钥服务获取缓存的密钥
    const cachedKey = apiKeyService.getZhipuApiKey();
    if (cachedKey) {
      this.zhipuApiKey = cachedKey;
      return cachedKey;
    }
    
    return '';
  }

  private async zhipuFetch(endpoint: string, body: any, isBinary: boolean = false, retryCount: number = 0) {
    try {
      console.log('Making Zhipu API request to:', `${ZHIPU_BASE_URL}${endpoint}`);
      console.log('Request body:', JSON.stringify(body, null, 2));

      // 生产环境不传递API密钥，依赖后端环境变量
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // 开发环境允许传递API密钥用于测试
      if (process.env.NODE_ENV === 'development') {
        const apiKey = this.getZhipuApiKey();
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const response = await fetch(`${ZHIPU_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

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
          console.log(`Retrying request (${retryCount + 1}/${this.retryConfig.maxRetries})...`);
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
        console.log(`Retrying request due to network error (${retryCount + 1}/${this.retryConfig.maxRetries})...`);
        await this.delay(this.retryConfig.retryDelay * (retryCount + 1));
        return this.zhipuFetch(endpoint, body, isBinary, retryCount + 1);
      }
      
      throw error;
    }
  }
  // 智谱流式请求 - 修复SSE解析问题
  private async zhipuStreamFetch(endpoint: string, body: any, callback: StreamCallback, retryCount: number = 0) {
    try {
      console.log('Making Zhipu API stream request to:', `${ZHIPU_BASE_URL}${endpoint}`);
      console.log('Request body:', JSON.stringify(body, null, 2));

      // 生产环境不传递API密钥，依赖后端环境变量
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // 开发环境允许传递API密钥用于测试
      if (process.env.NODE_ENV === 'development') {
        const apiKey = this.getZhipuApiKey();
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const response = await fetch(`${ZHIPU_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      console.log('Stream response status:', response.status);

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
          console.log(`Retrying stream request (${retryCount + 1}/${this.retryConfig.maxRetries})...`);
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
      let buffer = ''; // 缓冲区用于处理不完整的数据块
      let done = false;

      while (!done) {
        try {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          
          if (value) {
            // 将新数据添加到缓冲区
            const chunk = decoder.decode(value, { stream: !done });
            buffer += chunk;
            
            // 按行分割，保留最后一个可能不完整的行
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一行（可能不完整）
            
            // 处理完整的行
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue; // 跳过空行
              
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.substring(6).trim();
                
                // 处理结束标记
                if (data === '[DONE]') {
                  callback('', true, 'stop');
                  continue;
                }
                
                // 跳过空数据
                if (!data) continue;
                
                // 尝试解析JSON，增强容错性
                try {
                  const parsed = JSON.parse(data);
                  
                  // 处理内容增量
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    callback(content, false);
                  }
                  
                  // 处理完成状态
                  const finishReason = parsed.choices?.[0]?.finish_reason;
                  if (finishReason) {
                    callback('', true, finishReason);
                  }
                } catch (parseError) {
                  // 增强的错误处理：只在数据看起来像JSON时才警告
                  if (data.startsWith('{') && data.includes('"')) {
                    console.warn('Skipping potentially malformed SSE chunk:', data.substring(0, 100) + '...');
                  }
                  // 对于明显不是JSON的数据（如注释行），静默跳过
                }
              }
              // 处理其他SSE事件类型（如果需要）
              else if (trimmedLine.startsWith('event: ') || trimmedLine.startsWith('id: ')) {
                // 可以在这里处理其他SSE事件
                continue;
              }
            }
          }
          
          // 处理流结束时缓冲区中剩余的数据
          if (done && buffer.trim()) {
            const finalLine = buffer.trim();
            if (finalLine.startsWith('data: ')) {
              const data = finalLine.substring(6).trim();
              if (data && data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    callback(content, false);
                  }
                  const finishReason = parsed.choices?.[0]?.finish_reason;
                  if (finishReason) {
                    callback('', true, finishReason);
                  }
                } catch (parseError) {
                  console.warn('Skipping final malformed SSE chunk:', data.substring(0, 100));
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
        console.log(`Retrying stream request due to network error (${retryCount + 1}/${this.retryConfig.maxRetries})...`);
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

  /**
   * 修复点1：实现余弦相似度算法
   * 用于对比用户提问向量与知识库向量的匹配度
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magA === 0 || magB === 0) {
      return 0;
    }
    
    return dotProduct / (magA * magB);
  }

  /**
   * 修复点2：向量化接口 (统一维度)
   */
  async createEmbedding(text: string, options?: {
    model?: string;
    dimensions?: number;
  }): Promise<any> {
    const requestBody = {
      model: options?.model || ZhipuModel.EMBEDDING_3,
      input: text,
      dimensions: 768 // 强制统一维度，确保一致性
    };

    const data = await this.zhipuFetch('/embeddings', requestBody);
    return data;
  }
  /**
   * 核心优化：预处理知识库向量
   * 在商家上传或修改知识库时调用，而不是在用户对话时调用
   */
  async vectorizeKnowledgeItem(item: KnowledgeItem): Promise<KnowledgeItem> {
    // 如果已经有向量了，直接返回，避免重复扣费
    if (item.embedding && item.embedding.length > 0) {
      console.log(`Knowledge item "${item.title}" already vectorized, skipping`);
      return item;
    }

    try {
      console.log(`Vectorizing knowledge item: ${item.title}`);
      const response = await this.zhipuFetch('/embeddings', {
        model: ZhipuModel.EMBEDDING_3,
        input: `${item.title} ${item.content}`, // 结合标题和内容效果更好
        dimensions: 768 // 智谱支持自定义维度，768是性能与精度的平衡点
      });

      const vectorizedItem = {
        ...item,
        embedding: response.data[0].embedding,
        vectorizedAt: new Date().toISOString() // 记录向量化时间
      };

      console.log(`Successfully vectorized: ${item.title}`);
      return vectorizedItem;
    } catch (error) {
      console.error(`向量化失败 [${item.title}]:`, error);
      return item; // 返回原始项，不阻断流程
    }
  }

  /**
   * 批量处理整个项目的知识库
   */
  async vectorizeProjectKnowledge(knowledge: KnowledgeItem[]): Promise<KnowledgeItem[]> {
    console.log(`Starting batch vectorization for ${knowledge.length} items`);
    
    // 过滤出需要向量化的项目
    const itemsToVectorize = knowledge.filter(item => !item.embedding || item.embedding.length === 0);
    const alreadyVectorized = knowledge.filter(item => item.embedding && item.embedding.length > 0);
    
    if (itemsToVectorize.length === 0) {
      console.log('All knowledge items are already vectorized');
      return knowledge;
    }

    console.log(`Vectorizing ${itemsToVectorize.length} items, ${alreadyVectorized.length} already done`);

    try {
      // 批量处理，但添加延迟避免API限流
      const vectorizedItems: KnowledgeItem[] = [];
      
      for (let i = 0; i < itemsToVectorize.length; i++) {
        const item = itemsToVectorize[i];
        try {
          const vectorizedItem = await this.vectorizeKnowledgeItem(item);
          vectorizedItems.push(vectorizedItem);
          
          // 添加延迟避免API限流（每秒最多2个请求）
          if (i < itemsToVectorize.length - 1) {
            await this.delay(500);
          }
        } catch (error) {
          console.error(`Failed to vectorize item ${item.title}:`, error);
          vectorizedItems.push(item); // 保留原始项
        }
      }

      const result = [...alreadyVectorized, ...vectorizedItems];
      console.log(`Batch vectorization completed: ${result.filter(item => item.embedding).length}/${result.length} items vectorized`);
      
      return result;
    } catch (error) {
      console.error('Batch vectorization failed:', error);
      return knowledge; // 返回原始数据
    }
  }

  /**
   * 修复点3：重构后的智能对话逻辑 - 彻底解决性能问题
   * 核心逻辑："入库即计算，对话即检索"
   */
  async getSmartResponse(prompt: string, knowledge: KnowledgeItem[], provider: AIProvider, systemInstruction: string, options?: {
    stream?: boolean;
    callback?: StreamCallback;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    conversationHistory?: any[];
    searchThreshold?: number; // 可配置的相似度阈值
    maxContextItems?: number; // 可配置的最大上下文项目数
  }) {
    // A. 基础检查
    if (!this.zhipuApiKey) {
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

    try {
      // B. 修复点3: 只向量化"当前提问"，不再循环向量化知识库
      console.log('Vectorizing user query only...');
      const queryRes = await this.createEmbedding(prompt);
      const queryVector = queryRes.data[0].embedding;

      // C. 本地快速检索 - 使用可配置参数和Web Worker优化
      const searchThreshold = options?.searchThreshold || 0.45;
      const maxContextItems = options?.maxContextItems || 3;
      
      console.log(`Searching in ${knowledge.length} knowledge items with threshold ${searchThreshold}...`);
      
      let scoredItems: Array<{ item: KnowledgeItem; score: number }> = [];
      
      // 移动端优化：尝试使用Web Worker进行向量搜索
      if (this.vectorWorker) {
        try {
          const workerResults = await searchVectorsWithWorker(
            this.vectorWorker,
            queryVector,
            knowledge.filter(item => item.embedding && Array.isArray(item.embedding) && item.embedding.length === 768),
            searchThreshold,
            maxContextItems
          );
          
          scoredItems = workerResults.map(result => ({
            item: result,
            score: result.similarity
          }));
          
          console.log('✅ Vector search completed using Web Worker');
        } catch (workerError) {
          console.warn('Web Worker search failed, falling back to main thread:', workerError);
          // 回退到主线程计算
          scoredItems = this.performMainThreadVectorSearch(knowledge, queryVector, searchThreshold, maxContextItems);
        }
      } else {
        // 主线程计算
        scoredItems = this.performMainThreadVectorSearch(knowledge, queryVector, searchThreshold, maxContextItems);
      }

      console.log(`Found ${scoredItems.length} relevant items with scores:`, 
        scoredItems.map(s => ({ title: s.item.title, score: s.score.toFixed(3) })));

      // D. 容错逻辑 - 当相似度全部低于0.3时的兜底话术
      const hasHighQualityMatch = scoredItems.some(s => s.score > 0.3);
      
      let context: string;
      if (scoredItems.length > 0 && hasHighQualityMatch) {
        context = scoredItems.map((s, i) => `[参考依据${i+1}]: ${s.item.content}`).join('\n\n');
      } else {
        // 兜底话术
        context = "未找到相关产品资料。请基于通用常识回答，并引导用户拨打 400 技术支持。";
      }

      // E. 组装最终Prompt - 根据匹配质量调整提示
      const fullPrompt = hasHighQualityMatch 
        ? `你是一个专业的产品售后客服助手。请基于以下参考内容回答用户问题。

[背景资料]:
${context}

[用户提问]: ${prompt}

请注意：
1. 优先使用参考资料中的信息
2. 如果参考资料不足，请明确说明并建议联系人工客服
3. 保持专业、友好的语调`
        : `你是一个专业的产品售后客服助手。当前未找到直接相关的产品资料。

[用户提问]: ${prompt}

请注意：
1. 基于通用知识提供帮助性建议
2. 明确说明这不是基于具体产品资料的回答
3. 引导用户联系人工客服获取准确信息：400-888-6666
4. 保持专业、友好的语调`;

      // F. 发起LLM请求
      const optimalModel = this.getOptimalModel(prompt, options);
      const requestBody = {
        model: optimalModel,
        messages: [
          { role: 'system', content: systemInstruction },
          ...(options?.conversationHistory?.slice(-6) || []), // 保留最近3轮历史，防止Token溢出
          { role: 'user', content: fullPrompt }
        ],
        temperature: options?.temperature || 0.1, // 降低随机性，确保回答专业
        max_tokens: options?.maxTokens || 1024,
        stream: options?.stream || false
      };

      if (options?.stream && options?.callback) {
        await this.zhipuStreamFetch('/chat/completions', requestBody, options.callback);
        return '';
      } else {
        const data = await this.zhipuFetch('/chat/completions', requestBody);
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error("RAG检索失败，尝试降级回退...", error);
      
      // 如果向量检索全线失败，回退到关键词搜索
      const relevantItems = this.retrieveRelevantKnowledge(prompt, knowledge);
      const context = relevantItems.length > 0 
        ? relevantItems.map((item, index) => `[Knowledge Item ${index + 1}: ${item.title}]\n${item.content}`).join('\n\n')
        : "No direct match in custom knowledge base.";

      const fullPrompt = `You are a product support AI. Please answer based on the provided context.

Context:
${context}

User Question: ${prompt}`;

      const optimalModel = this.getOptimalModel(prompt, options);
      const requestBody = {
        model: optimalModel,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: fullPrompt }
        ],
        temperature: options?.temperature || 0.1,
        max_tokens: options?.maxTokens || 1024,
        stream: options?.stream || false
      };

      if (options?.stream && options?.callback) {
        await this.zhipuStreamFetch('/chat/completions', requestBody, options.callback);
        return '';
      } else {
        const data = await this.zhipuFetch('/chat/completions', requestBody);
        return data.choices[0].message.content;
      }
    }
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
      console.log('No API key available, using mock image analysis');
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

  // 生成模拟响应（当没有API密钥时使用）
  private generateMockResponse(prompt: string, knowledge: KnowledgeItem[]): string {
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
    
    // 检查是否有相关的知识库内容
    const relevantItems = this.retrieveRelevantKnowledge(promptStr, knowledge);
    
    if (relevantItems.length > 0) {
      // 如果有相关知识，基于知识库内容生成响应
      const firstItem = relevantItems[0];
      return `根据产品知识库，关于"${promptStr}"的信息：\n\n${firstItem.content.substring(0, 200)}${firstItem.content.length > 200 ? '...' : ''}\n\n如需更详细信息，请联系中恒创世技术支持：400-888-6666`;
    }
    
    // 常见问题的模拟响应
    if (lowerPrompt.includes('安装') || lowerPrompt.includes('install')) {
      return '关于产品安装，建议您：\n\n1. 仔细阅读产品说明书\n2. 确保安装环境符合要求\n3. 按照步骤逐一操作\n4. 如遇问题请拍照发送给我分析\n\n如需专业技术支持，请联系：400-888-6666';
    }
    
    if (lowerPrompt.includes('故障') || lowerPrompt.includes('问题') || lowerPrompt.includes('error')) {
      return '遇到产品故障时，请：\n\n1. 描述具体故障现象\n2. 提供产品型号信息\n3. 上传故障现场照片\n4. 说明使用环境和操作步骤\n\n我会基于这些信息为您提供解决方案。如需人工客服，请拨打：400-888-6666';
    }
    
    if (lowerPrompt.includes('使用') || lowerPrompt.includes('操作') || lowerPrompt.includes('how')) {
      return '关于产品使用方法：\n\n1. 请先查看产品说明书\n2. 确保正确连接和设置\n3. 按照操作指南进行\n4. 注意安全事项\n\n如有具体操作问题，请详细描述或上传图片，我会为您提供指导。技术支持热线：400-888-6666';
    }
    
    if (lowerPrompt.includes('维护') || lowerPrompt.includes('保养') || lowerPrompt.includes('maintenance')) {
      return '产品维护保养建议：\n\n1. 定期清洁产品表面\n2. 检查连接部件是否松动\n3. 避免在恶劣环境中使用\n4. 按照保养周期进行维护\n\n具体维护方法请参考说明书，或联系技术支持：400-888-6666';
    }
    
    // 默认响应
    return `您好！我是智能售后客服助手。\n\n关于您的问题"${promptStr}"，我需要更多信息来为您提供准确的解答。请您：\n\n1. 详细描述问题情况\n2. 提供产品型号\n3. 上传相关图片\n\n这样我能更好地为您服务。如需人工客服，请拨打：400-888-6666\n\n官网：www.aivirtualservice.com`;
  }

  // 模拟图片分析（当没有API密钥时使用）
  private generateMockImageAnalysis(prompt: string): string {
    return `图片分析功能需要AI服务支持。\n\n我看到您上传了图片，但目前AI视觉分析服务需要配置。\n\n请您：\n1. 详细描述图片中的问题\n2. 说明产品型号和使用情况\n3. 联系技术支持获得专业分析\n\n中恒创世技术支持：\n📞 400-888-6666\n🌐 www.aivirtualservice.com\n\n我们的技术专家会为您提供详细的图片分析和解决方案。`;
  }

  // 模拟语音识别（当没有API密钥时使用）
  private generateMockSpeechRecognition(): string {
    return '语音识别功能需要AI服务支持，请使用文字输入或联系人工客服：400-888-6666';
  }

  /**
   * 知识库检索能力测试 - 用于诊断页面
   * 测试向量化和检索功能是否正常工作
   */
  async testKnowledgeRetrieval(testQuery: string, knowledge: KnowledgeItem[]): Promise<{
    success: boolean;
    message: string;
    details?: {
      totalItems: number;
      vectorizedItems: number;
      queryVector?: number[];
      matchedItems: Array<{
        title: string;
        score: number;
        hasEmbedding: boolean;
      }>;
    };
  }> {
    try {
      // 1. 检查知识库状态
      const totalItems = knowledge.length;
      const vectorizedItems = knowledge.filter(item => 
        item.embedding && Array.isArray(item.embedding) && item.embedding.length === 768
      ).length;

      if (totalItems === 0) {
        return {
          success: false,
          message: '知识库为空，请先添加知识内容',
          details: { totalItems: 0, vectorizedItems: 0, matchedItems: [] }
        };
      }

      if (vectorizedItems === 0) {
        return {
          success: false,
          message: `知识库有 ${totalItems} 项内容，但都未向量化。请重新保存知识库内容以触发向量化。`,
          details: { 
            totalItems, 
            vectorizedItems: 0, 
            matchedItems: knowledge.map(item => ({
              title: item.title,
              score: 0,
              hasEmbedding: false
            }))
          }
        };
      }

      // 2. 测试查询向量化
      if (!this.zhipuApiKey) {
        return {
          success: false,
          message: '未配置API密钥，无法测试向量检索功能',
          details: { totalItems, vectorizedItems, matchedItems: [] }
        };
      }

      const queryRes = await this.createEmbedding(testQuery);
      const queryVector = queryRes.data[0].embedding;

      // 3. 执行相似度计算
      const scoredItems = knowledge
        .filter(item => item.embedding && Array.isArray(item.embedding) && item.embedding.length === 768)
        .map(item => ({
          title: item.title,
          score: this.cosineSimilarity(queryVector, item.embedding!),
          hasEmbedding: true
        }))
        .sort((a, b) => b.score - a.score);

      const highScoreItems = scoredItems.filter(item => item.score > 0.45);
      const mediumScoreItems = scoredItems.filter(item => item.score > 0.3 && item.score <= 0.45);

      let message = '';
      let success = true;

      if (highScoreItems.length > 0) {
        message = `✅ 检索功能正常！找到 ${highScoreItems.length} 个高相关度匹配项（>0.45）`;
      } else if (mediumScoreItems.length > 0) {
        message = `⚠️ 检索功能正常，但匹配度较低。找到 ${mediumScoreItems.length} 个中等相关度匹配项（0.3-0.45）`;
      } else {
        message = `❌ 未找到相关匹配项。可能需要优化知识库内容或测试查询`;
        success = false;
      }

      return {
        success,
        message,
        details: {
          totalItems,
          vectorizedItems,
          queryVector: queryVector.slice(0, 5), // 只返回前5个维度用于展示
          matchedItems: scoredItems.slice(0, 10) // 返回前10个结果
        }
      };

    } catch (error) {
      console.error('Knowledge retrieval test failed:', error);
      return {
        success: false,
        message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        details: { totalItems: knowledge.length, vectorizedItems: 0, matchedItems: [] }
      };
    }
  }

  // 实时连接相关方法（占位实现，避免组件崩溃）
  public disconnectFromRealtime(): void {
    console.log("正在断开实时连接...");
    // 如果你还没实现 WebSocket，先留空，保证不崩溃
    // if (this.socket) { this.socket.close(); }
  }

  public connectToRealtime(callback: any): Promise<boolean> {
    console.log("尝试连接实时服务...");
    // 占位实现，返回失败状态
    return Promise.resolve(false);
  }

  public addAnnotation(annotation: any): any {
    console.log("添加标注:", annotation);
    // 占位实现
    return annotation;
  }

  // 语音识别方法
  public async recognizeSpeech(audioBase64: string, provider: string): Promise<string> {
    console.log("语音识别功能需要配置");
    return "语音识别功能需要配置，请使用文字输入";
  }

  // 语音合成方法
  public async generateSpeech(text: string, voice: string, provider: string): Promise<string | null> {
    console.log("语音合成功能需要配置");
    return null;
  }

  // OCR识别方法
  public async recognizeHandwriting(file: File, options: any): Promise<any> {
    console.log("OCR识别功能需要配置");
    return {
      status: 'failed',
      message: 'OCR识别功能需要配置'
    };
  }

  // AI生成横幅广告图片
  public async generateBannerImage(prompt: string, options?: {
    width?: number;
    height?: number;
    style?: string;
  }): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      // 检查API密钥
      if (!this.zhipuApiKey) {
        return {
          success: false,
          error: 'API密钥未设置，请先在配置中设置智谱AI API密钥'
        };
      }

      // 构建图片生成请求
      const requestBody = {
        model: 'cogview-3-plus', // 智谱AI的图片生成模型
        prompt: prompt,
        size: `${options?.width || 1024}x${options?.height || 1024}`,
        quality: 'standard',
        n: 1
      };

      console.log('开始生成横幅图片:', requestBody);

      // 调用智谱AI图片生成API
      const response = await this.zhipuFetch('/images/generations', requestBody);

      if (response.data && response.data.length > 0) {
        const imageUrl = response.data[0].url;
        console.log('图片生成成功:', imageUrl);
        
        return {
          success: true,
          imageUrl: imageUrl
        };
      } else {
        return {
          success: false,
          error: '图片生成失败：API返回数据格式异常'
        };
      }
    } catch (error) {
      console.error('图片生成失败:', error);
      
      let errorMessage = '图片生成失败';
      if (error instanceof Error) {
        if (error.message.includes('余额不足')) {
          errorMessage = '账户余额不足，请充值后重试';
        } else if (error.message.includes('频率超限')) {
          errorMessage = 'API调用频率超限，请稍后重试';
        } else if (error.message.includes('无效的API密钥')) {
          errorMessage = 'API密钥无效，请检查配置';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // 生成视频指导内容
  public async generateVideoGuide(
    prompt: string, 
    provider: AIProvider, 
    imageUrl?: string,
    progressCallback?: (progress: number, status: string) => void
  ): Promise<{ title: string; url: string }> {
    try {
      // 模拟视频生成过程
      if (progressCallback) {
        progressCallback(30, '正在分析需求...');
        await this.delay(1000);
        
        progressCallback(60, '正在生成视频脚本...');
        await this.delay(1500);
        
        progressCallback(90, '正在渲染视频...');
        await this.delay(2000);
      }

      // 生成视频标题
      const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
      
      // 模拟生成的视频URL（实际应该调用视频生成API）
      const videoUrl = 'data:video/mp4;base64,mock-video-data';
      
      return {
        title: title,
        url: videoUrl
      };
    } catch (error) {
      console.error('视频生成失败:', error);
      throw new Error('视频生成失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }
}

export const aiService = new AIService();