import { useState, useEffect, useRef, useCallback } from 'react';
import { ProductProject } from '../types';
import { aiService } from '../services/aiService';

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

export const useChat = ({ project, onError }: UseChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [messageBuffer, setMessageBuffer] = useState('');
  const [bufferTimer, setBufferTimer] = useState<NodeJS.Timeout | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化欢迎消息
  useEffect(() => {
    const welcomeMessage = project.config.welcomeMessage || 
      `您好！我是 ${project.name} 的智能售后客服助手 🤖\n\n我可以帮您解决：\n• 产品使用问题\n• 安装指导\n• 故障排查\n• 维护保养\n\n请描述您遇到的问题，或上传相关图片，我会基于产品知识库为您提供专业解答。`;
    
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
    if (!text.trim() && !image) return;

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
    } catch (error) {
      console.error('AI服务调用失败:', error);
      
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
    } finally {
      setIsTyping(false);
    }
  }, [project, updateStreamingMessage, onError]);

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
    scrollRef,
    messagesEndRef,
    scrollToBottom
  };
};