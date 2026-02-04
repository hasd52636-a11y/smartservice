import { useState, useEffect, useRef, useCallback } from 'react';
import { ProductProject } from '../types';
import { aiService } from '../services/aiService';
import { offlineQueue } from '../utils/errorHandler';
import { InputValidator } from '../utils/inputValidator';
import { logger } from '../utils/logger';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: number;
}

interface UseChatOptions {
  project: ProductProject;
  onError?: (error: Error) => void;
}

// 消息分页常量
const MESSAGES_PAGE_SIZE = 20;

export const useChat = ({ project, onError }: UseChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [messageBuffer, setMessageBuffer] = useState('');
  const [bufferTimer, setBufferTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化欢迎消息
  useEffect(() => {
    const welcomeMessage = project.config.welcomeMessage || 
      `您好！我是 ${project.name} 的智能售后客服助手 🤖

我可以帮您解决：
• 产品使用问题
• 安装指导
• 故障排查
• 维护保养

请描述您遇到的问题，或上传相关图片，我会基于产品知识库为您提供专业解答。`;
    
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: Date.now()
    }]);
  }, [project]);

  // SSE 缓冲区平滑处理
  const updateStreamingMessage = useCallback((chunk: string, isDone: boolean) => {
    if (isDone) {
      if (bufferTimer) {
        clearTimeout(bufferTimer);
        setBufferTimer(null);
      }
      
      // 完成时立即更新
      setMessageBuffer(prevBuffer => {
        const finalMessage = prevBuffer + chunk;
        if (finalMessage) {
          setMessages(prev => [...prev, {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: finalMessage,
            timestamp: Date.now()
          }]);
        }
        return '';
      });
      
      setStreamingMessage('');
      setIsTyping(false);
      return;
    }

    // 累积消息到缓冲区
    setMessageBuffer(prev => prev + chunk);

    // 设置缓冲更新定时器（30ms 间隔）
    if (bufferTimer) {
      clearTimeout(bufferTimer);
    }

    const timer = setTimeout(() => {
      setMessageBuffer(currentBuffer => {
        setStreamingMessage(currentBuffer + chunk);
        return currentBuffer;
      });
    }, 30);
    
    setBufferTimer(timer);
  }, [bufferTimer]);

  // 发送消息
  const sendMessage = useCallback(async (text: string, image?: string) => {
    const startTime = Date.now();
    
    // 验证输入
    if (!text.trim() && !image) return;

    // 如果是文本消息，验证文本输入
    if (text.trim()) {
      const validation = InputValidator.validateTextInput(text);
      if (!validation.isValid) {
        setMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: `输入验证失败: ${validation.error || '无效输入'}`,
          timestamp: Date.now()
        }]);
        logger.warn(`Input validation failed: ${validation.error}`, { inputLength: text.length }, undefined, undefined, project.id);
        return;
      }
      
      text = validation.sanitized;
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      image,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // 确保API密钥已设置
      const savedApiKey = localStorage.getItem('zhipuApiKey');
      if (savedApiKey) {
        aiService.setZhipuApiKey(savedApiKey);
      }

      if (image) {
        // 图片分析
        if (!project.config.multimodalEnabled) {
          setMessages(prev => [...prev, {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: "多模态分析功能已禁用，无法分析图片内容。",
            timestamp: Date.now()
          }]);
          setIsTyping(false);
          logger.info('Multimodal analysis disabled', { projectId: project.id });
          return;
        }

        const response = await aiService.analyzeInstallation(
          image, 
          project.config.visionPrompt, 
          project.config.provider
        );
        
        setMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        }]);
      } else {
        // 文本消息 - 使用流式输出
        await aiService.getSmartResponse(
          text,
          project.knowledgeBase || [],
          project.config.provider,
          project.config.systemInstruction,
          {
            stream: true,
            callback: updateStreamingMessage,
            projectConfig: project.config
          }
        );
      }
      
      // 记录成功的对话指标
      logger.recordConversation(1, Date.now() - startTime, undefined, undefined, project.id);
    } catch (error) {
      console.error('AI服务调用失败:', error);
      
      // 记录失败的对话指标
      logger.recordConversation(0, Date.now() - startTime, undefined, undefined, project.id);
      
      // 检查是否为网络错误，如果是则将消息添加到离线队列
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) {
        console.log('Network error detected, queuing message for later');
        const offlineId = offlineQueue.addMessage(text);
        
        setMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: "网络连接异常，您的消息已暂存，网络恢复后将自动发送。",
          timestamp: Date.now()
        }]);
        logger.warn('Network error, message queued for later', { error: error.message, messageId: offlineId }, undefined, undefined, project.id);
      } else {
        // 其他错误处理
        let errorMessage = "抱歉，AI服务暂时不可用。";
        if (error instanceof Error) {
          if (error.message.includes('429')) {
            errorMessage = "服务繁忙，请稍后重试。";
          } else if (error.message.includes('network')) {
            errorMessage = "网络连接异常，请检查网络后重试。";
          }
        }
        
        setMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: errorMessage,
          timestamp: Date.now()
        }]);

        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    } finally {
      setIsTyping(false);
    }
  }, [project, updateStreamingMessage, onError]);

  // 加载更多历史消息
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    try {
      // 这里应该是从服务器加载更多历史消息的逻辑
      // 模拟加载更多消息
      const nextPage = currentPage + 1;
      
      // 在实际应用中，这里应该调用API获取历史消息
      // const moreMessages = await fetchMoreMessages(project.id, nextPage, MESSAGES_PAGE_SIZE);
      
      // 暂时模拟实现
      if (nextPage >= 3) { // 模拟只有3页数据
        setHasMoreMessages(false);
      } else {
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('加载更多消息失败:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMoreMessages, isLoadingMore, project.id]);

  // 尝试发送离线消息
  const processOfflineMessages = useCallback(async () => {
    const pendingMessages = offlineQueue.getPendingMessages();
    if (pendingMessages.length === 0) return;

    console.log(`Processing ${pendingMessages.length} offline messages`);
    
    for (const { id, message } of pendingMessages) {
      try {
        // 尝试发送离线消息
        await aiService.getSmartResponse(
          message,
          project.knowledgeBase || [],
          project.config.provider,
          project.config.systemInstruction,
          {
            stream: false, // 离线消息使用非流式响应
            projectConfig: project.config
          }
        );
        
        // 标记消息为已发送
        offlineQueue.markAsSent(id);
        console.log(`Successfully sent offline message: ${id}`);
      } catch (error) {
        console.error(`Failed to send offline message: ${id}`, error);
        // 标记为发送失败，后续可重试
        offlineQueue.markAsFailed(id);
      }
    }
  }, [project]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  return {
    messages,
    isTyping,
    streamingMessage,
    sendMessage,
    loadMoreMessages,
    isLoadingMore,
    hasMoreMessages,
    processOfflineMessages,
    scrollRef,
    messagesEndRef,
    scrollToBottom
  };
};