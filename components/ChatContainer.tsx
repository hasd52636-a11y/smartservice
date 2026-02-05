import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProductProject } from '../types';
import { Send, Image as ImageIcon, Loader2, ChevronLeft, Mic, Camera, Volume2, Video } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { mapUICustomizationToCSSVariables } from '../utils/cssVariables';
import { aiService } from '../services/aiService';
import { mobileOptimizer } from '../utils/mobileOptimizer';

interface Props {
  project: ProductProject;
  onBack?: () => void;
}

const ChatContainer: React.FC<Props> = ({ project, onBack }) => {
  // 使用自定义 hook
  const { messages, isTyping, streamingMessage, sendMessage, loadMoreMessages, isLoadingMore, hasMoreMessages, processOfflineMessages, scrollRef, messagesEndRef, scrollToBottom } = useChat({ project });
  
  // 状态管理
  const [input, setInput] = useState('');
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
      if (error instanceof Error && error.name === 'NotAllowedError') {
        alert('麦克风权限被拒绝，请在浏览器设置中允许权限后重试。\n\n步骤：\n1. 点击浏览器地址栏左侧的锁图标\n2. 在权限设置中允许麦克风\n3. 刷新页面后重试');
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        alert('未检测到麦克风设备，请确保设备已连接并正常工作。');
      } else {
        alert('无法访问麦克风：' + (error instanceof Error ? error.message : '未知错误'));
      }
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
      // 显示语音处理中状态
      setIsTyping(true);
      
      // 转换为 base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          
          // 调用语音识别服务
          console.log('Processing voice recording...');
          const recognizedText = await aiService.recognizeSpeech(base64Audio, project.config.provider);
          console.log('Voice recognition result:', recognizedText);
          
          if (recognizedText) {
            await sendMessage(recognizedText);
          } else {
            // 识别失败，添加提示消息
            setMessages(prev => [...prev, { 
              id: `system_${Date.now()}`, 
              role: 'assistant', 
              content: '语音识别失败，请尝试重新录制或直接输入文字。',
              timestamp: new Date()
            }]);
            setIsTyping(false);
          }
        } catch (error) {
          console.error('语音识别处理失败:', error);
          setMessages(prev => [...prev, { 
            id: `system_${Date.now()}`, 
            role: 'assistant', 
            content: '语音识别处理失败，请尝试重新录制或直接输入文字。',
            timestamp: new Date()
          }]);
          setIsTyping(false);
        }
      };
      reader.onerror = () => {
        console.error('文件读取失败');
        setMessages(prev => [...prev, { 
          id: `system_${Date.now()}`, 
          role: 'assistant', 
          content: '语音文件处理失败，请尝试重新录制或直接输入文字。',
          timestamp: new Date()
        }]);
        setIsTyping(false);
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('语音识别失败:', error);
      setMessages(prev => [...prev, { 
        id: `system_${Date.now()}`, 
        role: 'assistant', 
        content: '语音识别失败，请尝试重新录制或直接输入文字。',
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }
  };

  // TTS 播放功能
  const playTTS = async (text: string) => {
    try {
      console.log('Generating speech for:', text.substring(0, 50) + '...');
      const audioData = await aiService.generateSpeech(
        text, 
        project.config.voiceName || 'tongtong', 
        project.config.provider
      );
      
      if (audioData) {
        console.log('Speech generated successfully, playing...');
        const audio = new Audio(`data:audio/wav;base64,${audioData}`);
        
        audio.onplay = () => {
          console.log('TTS playback started');
        };
        
        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
        };
        
        audio.onended = () => {
          console.log('TTS playback finished');
        };
        
        audio.play().catch(playError => {
          console.error('Failed to play audio:', playError);
        });
      } else {
        console.warn('No audio data received from TTS service');
        // 可以添加用户提示，但不建议频繁弹窗
        // alert('语音播放功能暂时不可用，请检查API密钥配置。');
      }
    } catch (error) {
      console.error('TTS播放失败:', error);
      // 可以添加用户提示，但不建议频繁弹窗
      // alert('语音播放失败，请检查网络连接或API密钥配置。');
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
    
    // 根据输入内容显示/隐藏建议
    if (e.target.value.trim() === '') {
      setShowSuggestions(true);
      generateSuggestions();
    } else {
      setShowSuggestions(false);
    }
  };

  // 生成智能建议
  const generateSuggestions = () => {
    const commonQuestions = [
      "如何安装这个产品？",
      "产品出现故障怎么办？", 
      "如何进行日常维护？",
      "保修政策是什么？",
      "如何联系售后服务？"
    ];
    
    // 根据项目类型生成相关建议
    if (project.config.productType) {
      if (project.config.productType.includes('电子')) {
        commonQuestions.unshift("如何重置设备？", "设备无法开机怎么办？");
      } else if (project.config.productType.includes('机械')) {
        commonQuestions.unshift("如何更换零件？", "设备异响怎么处理？");
      }
    }
    
    setSuggestions(commonQuestions.slice(0, 4)); // 显示前4个建议
  };

  // 选择建议
  const selectSuggestion = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
    setShowSuggestions(false);
  };

  // 初始化手势支持
  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      mobileOptimizer.initGestureListener(container, {
        onSwipeRight: () => {
          // 在对话列表上向右滑动可能表示返回操作
          if (onBack) {
            onBack();
          }
        },
        onSwipeLeft: () => {
          // 向左滑动可能表示查看更多选项
          console.log('Swiped left - show more options');
        },
        onSwipeUp: () => {
          // 向上滑动通常是滚动浏览消息
          console.log('Swiped up - scroll up');
        },
        onSwipeDown: () => {
          // 向下滑动通常是滚动到最新消息
          scrollToBottom();
        },
        onTap: () => {
          // 单击可能用于聚焦输入框
          inputRef.current?.focus();
        },
        onDoubleTap: () => {
          // 双击可能用于快速滚动到最新消息
          scrollToBottom();
        }
      });
    }
  }, [onBack, scrollToBottom]);

  // 在组件挂载时生成建议
  useEffect(() => {
    generateSuggestions();
  }, [project]);

  return (
    <div 
      ref={scrollRef}
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
      <header 
        className="flex items-center px-4 py-3 border-b z-10 shrink-0"
        style={{ 
          backgroundColor: 'var(--bg-main)',
          borderColor: 'var(--input-border)'
        }}
      >
        {onBack && (
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 transition-colors"
            style={{ color: 'var(--text-color)' }}
          >
            <ChevronLeft size={28} className="sm:size-6" />
          </button>
        )}
        <div className="flex-1 text-center">
          <h1 className="font-bold truncate px-4" style={{ color: 'var(--text-color)' }}>{project.name}</h1>
          <p className="text-xs opacity-60" style={{ color: 'var(--text-color)' }}>智能客服助手</p>
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
        {/* 加载更多按钮 */}
        {hasMoreMessages && (
          <div className="flex justify-center my-4">
            <button
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className="px-4 py-2 bg-[var(--button-primary)] text-[var(--button-text)] rounded-full text-sm disabled:opacity-50 transition-opacity"
            >
              {isLoadingMore ? '加载中...' : '加载更多消息'}
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div 
              className={`max-w-[85%] ${
                msg.role === 'user' 
                  ? 'rounded-l-[var(--message-border-radius)] rounded-tr-[var(--message-border-radius)]' 
                  : 'rounded-r-[var(--message-border-radius)] rounded-tl-[var(--message-border-radius)]'
              } px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm`}
              style={{
                backgroundColor: msg.role === 'user' ? 'var(--user-message-bg)' : 'var(--ai-message-bg)',
                color: msg.role === 'user' ? 'var(--user-message-text)' : 'var(--ai-message-text)',
              }}
            >
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
                    className="flex items-center gap-1 text-xs transition-colors"
                    style={{ color: 'var(--text-color)', opacity: 0.7 }}
                  >
                    <Volume2 size={14} className="sm:size-3" />
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
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-[var(--ai-message-bg)] border border-slate-100 rounded-r-[var(--message-border-radius)] rounded-tl-[var(--message-border-radius)] px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 sm:w-2 sm:h-2 bg-[var(--primary-color)] rounded-full animate-bounce"></div>
                <div className="w-2.5 h-2.5 sm:w-2 sm:h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2.5 h-2.5 sm:w-2 sm:h-2 bg-[var(--primary-color)] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--ai-message-text)', opacity: 0.7 }}>AI正在思考...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区 - 增强移动端适配 */}
      <footer className="p-4 border-t shrink-0" style={{ 
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        backgroundColor: 'var(--bg-main)',
        borderColor: 'var(--input-border)'
      }}>
        <div 
          className="flex items-end gap-2 border rounded-2xl px-3 py-2 transition-colors"
          style={{ 
            backgroundColor: 'var(--input-bg)',
            borderColor: 'var(--input-border)'
          }}
        >
          {/* 语音录制按钮 */}
          <button 
            onMouseDown={startVoiceRecording}
            onMouseUp={stopVoiceRecording}
            onTouchStart={startVoiceRecording}
            onTouchEnd={stopVoiceRecording}
            className={`p-3 sm:p-2 transition-colors ${
              isVoiceRecording 
                ? 'bg-red-100' 
                : ''
            }`}
            style={{ 
              color: isVoiceRecording ? '#ef4444' : 'var(--input-placeholder)'
            }}
          >
            <Mic size={24} className="sm:size-5" />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ color: 'var(--input-placeholder)' }}
            className="p-3 sm:p-2 transition-colors hover:opacity-70"
          >
            <ImageIcon size={24} className="sm:size-5" />
          </button>
          <button 
            onClick={() => {
              // 导航到视频聊天页面
              window.location.href = `/video/${project.id}`;
            }}
            style={{ color: 'var(--input-placeholder)' }}
            className="p-3 sm:p-2 transition-colors hover:opacity-70"
            title="视频聊天"
          >
            <Video size={24} className="sm:size-5" />
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
            className="flex-1 py-3 sm:py-2 bg-transparent border-none focus:ring-0 text-base sm:text-sm max-h-[120px] resize-none overflow-y-auto"
            style={{ 
              minHeight: '44px',
              color: 'var(--input-text)'
            }}
          />

          {/* 发送按钮 */}
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-3 sm:p-2 rounded-xl transition-all active:scale-95 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'var(--button-primary)',
              color: 'var(--button-text)',
              opacity: (!input.trim() || isTyping) ? 0.3 : 1
            }}
          >
            <Send size={20} className="sm:size-4.5" />
          </button>
        </div>

        {/* 智能建议 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-medium" style={{ color: 'var(--text-color)', opacity: 0.7 }}>快速提问：</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => selectSuggestion(suggestion)}
                  className="px-3 py-1.5 text-xs sm:text-sm border rounded-full transition-colors min-h-[32px]"
                  style={{
                    backgroundColor: 'var(--ai-message-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--ai-message-text)',
                    ':hover': {
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)'
                    }
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <div className="text-[10px] text-center mt-2 tracking-tight" style={{ color: 'var(--text-color)', opacity: 0.5 }}>
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