// 移动端优化工具类
export class MobileOptimizer {
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchEndX: number = 0;
  private touchEndY: number = 0;
  private lastTouchTime: number = 0;
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  /**
   * 检测是否为移动设备
   */
  static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * 检测触摸事件支持
   */
  static supportsTouchEvents(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * 初始化手势监听器
   * @param element 要监听手势的元素
   * @param callbacks 手势回调函数
   */
  initGestureListener(
    element: HTMLElement,
    callbacks: {
      onSwipeLeft?: () => void;
      onSwipeRight?: () => void;
      onSwipeUp?: () => void;
      onSwipeDown?: () => void;
      onTap?: () => void;
      onDoubleTap?: () => void;
    }
  ): void {
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    });

    element.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) return; // 忽略多点触控
      this.touchEndX = e.touches[0].clientX;
      this.touchEndY = e.touches[0].clientY;
    });

    element.addEventListener('touchend', (e) => {
      const now = Date.now();
      const deltaX = this.touchEndX - this.touchStartX;
      const deltaY = this.touchEndY - this.touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const deltaTime = now - this.lastTouchTime;

      // 检测双击
      if (deltaTime < 300 && absDeltaX < 10 && absDeltaY < 10) {
        callbacks.onDoubleTap?.();
      } else if (absDeltaX > 50 || absDeltaY > 50) {
        // 检测滑动手势
        if (absDeltaX > absDeltaY) {
          // 水平滑动
          if (deltaX > 0) {
            callbacks.onSwipeRight?.();
          } else {
            callbacks.onSwipeLeft?.();
          }
        } else {
          // 垂直滑动
          if (deltaY > 0) {
            callbacks.onSwipeDown?.();
          } else {
            callbacks.onSwipeUp?.();
          }
        }
      } else {
        // 单击
        callbacks.onTap?.();
      }

      this.lastTouchTime = now;
    });

    // Mouse events for desktop testing
    let tapTimeout: NodeJS.Timeout | null = null;
    element.addEventListener('mousedown', (e) => {
      this.touchStartX = e.clientX;
      this.touchStartY = e.clientY;
    });

    element.addEventListener('mouseup', (e) => {
      this.touchEndX = e.clientX;
      this.touchEndY = e.clientY;

      const deltaX = this.touchEndX - this.touchStartX;
      const deltaY = this.touchEndY - this.touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > 50 || absDeltaY > 50) {
        // 检测滑动手势
        if (absDeltaX > absDeltaY) {
          if (deltaX > 0) {
            callbacks.onSwipeRight?.();
          } else {
            callbacks.onSwipeLeft?.();
          }
        } else {
          if (deltaY > 0) {
            callbacks.onSwipeDown?.();
          } else {
            callbacks.onSwipeUp?.();
          }
        }
      } else {
        // 单击
        if (tapTimeout) {
          clearTimeout(tapTimeout);
          tapTimeout = null;
          callbacks.onDoubleTap?.(); // 双击
        } else {
          tapTimeout = setTimeout(() => {
            callbacks.onTap?.(); // 单击
            tapTimeout = null;
          }, 300);
        }
      }
    });
  }

  /**
   * 开始内存使用监控
   * @param callback 内存使用率回调
   * @param interval 检查间隔（毫秒）
   */
  startMemoryMonitoring(callback: (usage: { used: number; total: number; percentage: number }) => void, interval: number = 5000): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

    this.memoryCheckInterval = setInterval(() => {
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        if (memoryInfo) {
          const usage = {
            used: memoryInfo.usedJSHeapSize,
            total: memoryInfo.totalJSHeapSize,
            percentage: (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100
          };
          callback(usage);
        }
      } else {
        // 对于不支持memory API的浏览器，使用近似方法
        // 这里只是占位符，实际实现可能需要更复杂的内存估算
        callback({
          used: 0,
          total: 0,
          percentage: 0
        });
      }
    }, interval);
  }

  /**
   * 停止内存监控
   */
  stopMemoryMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  /**
   * 优化图片加载（移动端）
   * @param imgElement 图片元素
   * @param src 原始图片源
   * @param mobileSrc 移动端优化后的图片源
   */
  optimizeImageForMobile(imgElement: HTMLImageElement, src: string, mobileSrc?: string): void {
    if (MobileOptimizer.isMobileDevice()) {
      if (mobileSrc) {
        imgElement.src = mobileSrc;
      } else {
        // 对于移动端，可以使用压缩后的图片
        const optimizedSrc = this.getOptimizedImageUrl(src, 80); // 压缩到80%质量
        imgElement.src = optimizedSrc;
      }
    } else {
      imgElement.src = src;
    }
  }

  /**
   * 获取优化后的图片URL
   * @param url 原始URL
   * @param quality 质量百分比
   */
  private getOptimizedImageUrl(url: string, quality: number): string {
    // 这是一个简化的实现
    // 在实际项目中，这可能需要调用专门的图片优化服务
    if (url.includes('?')) {
      return `${url}&quality=${quality}`;
    }
    return `${url}?quality=${quality}`;
  }

  /**
   * 节流函数（移动端优化）
   * @param func 要节流的函数
   * @param limit 节流限制时间（毫秒）
   */
  throttle(func: (...args: any[]) => void, limit: number): (...args: any[]) => void {
    let inThrottle: boolean;
    return function (...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * 防抖函数（移动端优化）
   * @param func 要防抖的函数
   * @param delay 防抖延迟时间（毫秒）
   */
  debounce(func: (...args: any[]) => void, delay: number): (...args: any[]) => void {
    let timeoutId: NodeJS.Timeout;
    return function (...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }
}

// 创建全局移动端优化实例
export const mobileOptimizer = new MobileOptimizer();