import React, { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  isRecording: boolean;
  audioLevel?: number; // 0-100
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isRecording, audioLevel = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // 清除画布
      ctx.clearRect(0, 0, width, height);
      
      // 绘制波形
      const barCount = 20;
      const barWidth = width / barCount;
      const centerY = height / 2;
      
      ctx.fillStyle = '#8b5cf6'; // violet-500
      
      for (let i = 0; i < barCount; i++) {
        // 基于音频级别和时间创建动态波形
        const time = Date.now() * 0.005;
        const baseHeight = (audioLevel / 100) * height * 0.8;
        const waveHeight = Math.sin(time + i * 0.5) * baseHeight * 0.3 + baseHeight;
        const barHeight = Math.max(2, waveHeight);
        
        const x = i * barWidth + barWidth * 0.2;
        const y = centerY - barHeight / 2;
        
        ctx.fillRect(x, y, barWidth * 0.6, barHeight);
      }
      
      if (isRecording) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, audioLevel]);

  if (!isRecording) return null;

  return (
    <div className="flex items-center justify-center p-4 bg-violet-50 rounded-2xl border border-violet-200">
      <div className="text-center">
        <canvas 
          ref={canvasRef}
          width={200}
          height={60}
          className="mb-2"
        />
        <p className="text-sm text-violet-600 font-medium">
          🎤 正在聆听...
        </p>
        <p className="text-xs text-violet-500">
          说完后停顿1.5秒自动发送
        </p>
      </div>
    </div>
  );
};

export default VoiceVisualizer;