import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProductProject } from '../types';
import { Send, Image as ImageIcon, Loader2, ChevronLeft, Mic, Camera, Volume2 } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { mapUICustomizationToCSSVariables } from '../utils/cssVariables';
import { aiService } from '../services/aiService';

interface Props {
  project: ProductProject;
  onBack?: () => void;
}

const ChatContainer: React.FC<Props> = ({ project, onBack }) => {
  // 使用自定义 hook
  const { messages, isTyping, streamingMessage, sendMessage, scrollRef, messagesEndRef, scrollToBottom } = useChat({ project });
  
  // 状态管理
  const [input, setInput] = useState('');
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 动态 CSS 变量映射
  const themeStyles = mapUICustomizationToCSSVariables(project.config.uiCustomization);

  // 移动端软键盘适配：使用 Visual Viewport API（增强版）
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      const newHeight = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(`${newHeight}px`);
      
      // 设置CSS变量，用于全局高度计算
      const vh = newHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // 键盘弹出时自动滚动到底部
      if (isAtBottom) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    };

    const handleScroll = () => {
      // 处理视觉视口滚动，确保内容不被键盘遮挡
      if (window.visualViewport && scrollRef.current) {
        const offsetTop = window.visualViewport.offsetTop;
        if (offsetTop > 0) {
          scrollRef.current.style.transform = `translateY(-${offsetTop}px)`;
        } else {
          scrollRef.current.style.transform = 'translateY(0)';
        }
      }
    };

    // 初始化设置
    handleResize();

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleScroll);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleScroll);
    };
  }, [isAtBottom, scrollToBottom]);

  // 智能滚动：检测用户是否在底部
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(isNearBottom);
  }, []);

  // 自动滚动到底部（仅当用户在底部时）
  useEffect(() => {
    if (isAtBottom && (messages.length > 0 || streamingMessage)) {
      scrollToBottom();
    }
  }, [messages, streamingMessage, isAtBottom, scrollToBottom]);

  // 语音录制功能
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceRecording(audioBlob);
        
        // 清理资源
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsVoiceRecording(true);
    } catch (error) {
      console.error('无法访问麦克风:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isVoiceRecording) {
      mediaRecorderRef.current.stop();
      setIsVoiceRecording(false);
    }
  };

  const processVoiceRecording = async (audioBlob: Blob) => {
    try {
      // 转换为 base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // 调用语音识别服务
        const recognizedText = await aiService.recognizeSpeech(base64Audio, project.config.provider);
        if (recognizedText) {
          await sendMessage(recognizedText);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('语音识别失败:', error);
    }
  };

  // TTS 播放功能
  const playTTS = async (text: string) => {
    try {
      const audioData = await aiService.generateSpeech(
        text, 
        project.config.voiceName || 'tongtong', 
        project.config.provider
      );
      
      if (audioData) {
        const audio = new Audio(`data:audio/wav;base64,${audioData}`);
        audio.play();
      }
    } catch (error) {
      console.error('TTS播放失败:', error);
    }
  };

  // 发送消息处理
  const handleSend = async (text?: string, image?: string) => {
    const msgText = text || input.trim();
    if (!msgText && !image) return;

    setInput('');
    
    // 重置输入框高度
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    await sendMessage(msgText, image);
  };

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleSend("请分析这张图片", base64);
    };
    reader.readAsDataURL(file);
  };

  // 处理输入框自动调整高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // 自动调整高度
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div 
      className="flex flex-col w-full overflow-hidden transition-all duration-300"
      style={{ 
        ...themeStyles, 
        height: viewportHeight,
        backgroundColor: 'var(--bg-main)',
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-size)',
        fontWeight: 'var(--font-weight)'
      }}
    >
      {/* 顶部导航栏 */}
      <header className="flex items-center px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 shrink-0">
        {onBack && (
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <div className="flex-1 text-center">
          <h1 className="font-bold text-slate-800 truncate px-4">{project.name}</h1>
          <p className="text-xs text-slate-500">智能客服助手</p>
        </div>
        <div className="w-10 flex justify-center">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </header>

      {/* 对话列表区 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth"
        onScroll={handleScroll}
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-[var(--user-message-bg)] text-[var(--user-message-text)] rounded-l-[var(--message-border-radius)] rounded-tr-[var(--message-border-radius)]' 
                : 'bg-[var(--ai-message-bg)] text-[var(--ai-message-text)] rounded-r-[var(--message-border-radius)] rounded-tl-[var(--message-border-radius)] border border-slate-100'
            } px-4 py-3 shadow-sm`}>
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="用户上传的图片" 
                  className="w-full max-w-xs rounded-lg mb-2"
                />
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>
              {/* AI消息添加语音播放按钮 */}
              {msg.role === 'assistant' && (
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => playTTS(msg.content)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-[var(--primary-color)] transition-colors"
                  >
                    <Volume2 size={12} />
                    播放
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 流式消息显示 */}
        {streamingMessage && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="max-w-[85%] bg-[var(--ai-message-bg)] text-[var(--ai-message-text)] rounded-r-[var(--message-border-radius)] rounded-tl-[var(--message-border-radius)] border border-slate-100 px-4 py-3 shadow-sm">
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {streamingMessage}
                <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--primary-color)] animate-pulse align-middle" />
              </div>
            </div>
          </div>
        )}

        {/* 加载指示器 */}
        {isTyping && !streamingMessage && (
          <div className="flex justify-start">
            <div className="bg-[var(--ai-message-bg)] border border-slate-100 rounded-r-[var(--message-border-radius)] rounded-tl-[var(--message-border-radius)] px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区 - 增强移动端适配 */}
      <footer className="p-4 bg-white border-t border-slate-200 shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-end gap-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl px-3 py-2 focus-within:border-[var(--primary-color)] transition-colors">
          {/* 语音录制按钮 */}
          <button 
            onMouseDown={startVoiceRecording}
            onMouseUp={stopVoiceRecording}
            onTouchStart={startVoiceRecording}
            onTouchEnd={stopVoiceRecording}
            className={`p-2 transition-colors ${
              isVoiceRecording 
                ? 'text-red-500 bg-red-50' 
                : 'text-slate-400 hover:text-[var(--primary-color)]'
            }`}
          >
            <Mic size={20} />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-[var(--primary-color)] transition-colors"
          >
            <ImageIcon size={20} />
          </button>

          {/* 输入框 */}
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入您的问题..."
            className="flex-1 py-2 bg-transparent border-none focus:ring-0 text-sm text-[var(--input-text)] max-h-[120px] resize-none overflow-y-auto placeholder-slate-400"
            style={{ minHeight: '40px' }}
          />

          {/* 发送按钮 */}
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-2 bg-[var(--button-primary)] text-[var(--button-text)] rounded-xl disabled:opacity-30 transition-all active:scale-95 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>

        {/* 底部信息 */}
        <div className="text-[10px] text-center text-slate-400 mt-2 tracking-tight">
          Powered by 中恒创世 AI 技术支持
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </footer>
    </div>
  );
};

export default ChatContainer;