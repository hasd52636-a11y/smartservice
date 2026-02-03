/**
 * 多模态内容处理工具
 * 用于处理图片、视频等多媒体内容的格式转换和封装
 */

export interface MultimodalContent {
  type: 'text' | 'image_url' | 'video_url' | 'audio_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
  video_url?: {
    url: string;
    format?: string;
  };
  audio_url?: {
    url: string;
    format?: string;
  };
}

/**
 * 将文件转换为 Base64 格式
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 创建图片多模态内容
 */
export const createImageContent = (imageUrl: string, detail: 'low' | 'high' | 'auto' = 'auto'): MultimodalContent => {
  return {
    type: 'image_url',
    image_url: {
      url: imageUrl,
      detail
    }
  };
};

/**
 * 创建文本多模态内容
 */
export const createTextContent = (text: string): MultimodalContent => {
  return {
    type: 'text',
    text
  };
};

/**
 * 创建视频多模态内容
 */
export const createVideoContent = (videoUrl: string, format?: string): MultimodalContent => {
  return {
    type: 'video_url',
    video_url: {
      url: videoUrl,
      format
    }
  };
};

/**
 * 创建音频多模态内容
 */
export const createAudioContent = (audioUrl: string, format?: string): MultimodalContent => {
  return {
    type: 'audio_url',
    audio_url: {
      url: audioUrl,
      format
    }
  };
};

/**
 * 构建符合 GLM-4V 格式的多模态消息
 */
export const buildMultimodalMessage = (
  text: string, 
  mediaFiles?: { type: 'image' | 'video' | 'audio'; url: string }[]
): { role: 'user'; content: MultimodalContent[] } => {
  const content: MultimodalContent[] = [];
  
  // 添加文本内容
  if (text.trim()) {
    content.push(createTextContent(text));
  }
  
  // 添加媒体内容
  if (mediaFiles && mediaFiles.length > 0) {
    mediaFiles.forEach(media => {
      switch (media.type) {
        case 'image':
          content.push(createImageContent(media.url));
          break;
        case 'video':
          content.push(createVideoContent(media.url));
          break;
        case 'audio':
          content.push(createAudioContent(media.url));
          break;
      }
    });
  }
  
  return {
    role: 'user',
    content
  };
};

/**
 * 检测文件类型
 */
export const detectFileType = (file: File): 'image' | 'video' | 'audio' | 'unknown' => {
  const mimeType = file.type.toLowerCase();
  
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  
  return 'unknown';
};

/**
 * 压缩图片（用于优化传输）
 */
export const compressImage = (
  file: File, 
  maxWidth: number = 1920, 
  maxHeight: number = 1080, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 转换为 base64
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = reject;
    
    // 加载原始图片
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 验证文件大小
 */
export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * 获取文件信息
 */
export const getFileInfo = (file: File) => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    sizeFormatted: formatFileSize(file.size),
    typeCategory: detectFileType(file)
  };
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};