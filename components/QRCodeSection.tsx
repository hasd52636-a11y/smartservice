import React, { useState, useEffect } from 'react';
import { 
  Download, ExternalLink, CheckCircle, ArrowRight, 
  Globe, MessageSquare 
} from 'lucide-react';

interface QRCodeSectionProps {
  projectId: string;
  projectName: string;
  complexLink: string;
  qrImageUrl: string;
}

const QRCodeSection: React.FC<QRCodeSectionProps> = ({ 
  projectId, 
  projectName, 
  complexLink, 
  qrImageUrl 
}) => {
  const [apiKeyStatus, setApiKeyStatus] = useState<{hasKey: boolean, checked: boolean}>({
    hasKey: false, 
    checked: false
  });

  // 检查API密钥状态
  useEffect(() => {
    const checkApiKey = () => {
      try {
        const hasKey = !!localStorage.getItem('zhipuApiKey');
        setApiKeyStatus({hasKey, checked: true});
      } catch (error) {
        console.error('检查API密钥状态失败:', error);
        setApiKeyStatus({hasKey: false, checked: true});
      }
    };
    
    checkApiKey();
  }, []);

  const handleDownload = async () => {
    try {
      console.log('下载二维码，链接:', complexLink);
      if (!complexLink) {
        alert('链接生成失败，请刷新页面重试');
        return;
      }
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}_qrcode.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  const handlePreview = () => {
    console.log('点击预览按钮');
    console.log('complexLink:', complexLink);
    if (complexLink) {
      window.open(complexLink, '_blank');
    } else {
      alert('链接生成失败，请刷新页面重试');
    }
  };

  const handleTestLink = () => {
    console.log('=== 测试二维码链接 ===');
    console.log('项目ID:', projectId);
    console.log('生成的链接:', complexLink);
    
    if (complexLink) {
      const match = complexLink.match(/\/entry\/([^?]+)/);
      if (match) {
        const shortCode = match[1];
        console.log('提取的shortCode:', shortCode);
        
        import('../services/linkService').then(({ linkService }) => {
          const mappedProjectId = linkService.getProjectIdByShortCode(shortCode);
          console.log('映射回的项目ID:', mappedProjectId);
          
          if (mappedProjectId === projectId) {
            alert('✅ 二维码链接测试成功！\n\n链接可以正确映射到当前项目。');
          } else {
            alert('❌ 二维码链接测试失败！\n\n链接无法正确映射到当前项目。\n\n预期项目ID: ' + projectId + '\n实际项目ID: ' + mappedProjectId);
          }
        });
      } else {
        alert('❌ 链接格式错误，无法提取shortCode');
      }
    } else {
      alert('❌ 链接生成失败');
    }
  };

  const handleRegenerate = async () => {
    console.log('=== 重新生成二维码链接 ===');
    try {
      const { linkService } = await import('../services/linkService');
      const newLinks = linkService.regenerateProjectLinks(projectId);
      console.log('重新生成的链接:', newLinks);
      
      if (newLinks.length > 0) {
        alert('✅ 链接重新生成成功！\n\n请刷新页面查看新的二维码。');
        window.location.reload();
      } else {
        alert('❌ 链接重新生成失败');
      }
    } catch (error) {
      console.error('重新生成链接失败:', error);
      alert('❌ 重新生成链接时发生错误');
    }
  };

  const handleSetProductionDomain = async () => {
    const productionUrl = 'https://sora.wboke.com';
    console.log('=== 设置生产环境域名 ===');
    try {
      const { linkService } = await import('../services/linkService');
      linkService.setBaseUrl(productionUrl);
      
      alert('✅ 已设置生产环境域名！\n\n域名: ' + productionUrl + '\n\n所有链接已重新生成，请刷新页面查看。');
      window.location.reload();
    } catch (error) {
      console.error('设置域名失败:', error);
      alert('❌ 设置域名时发生错误');
    }
  };

  const handleTestChat = () => {
    console.log('=== 测试对话功能 ===');
    if (complexLink) {
      const testWindow = window.open(complexLink, '_blank', 'width=400,height=600');
      if (testWindow) {
        alert('✅ 已在新窗口中打开对话页面！\n\n请在新窗口中测试：\n1. 页面是否正常加载\n2. 发送消息是否正常\n3. AI是否能正确回复\n\n如果出现白屏，请检查API密钥配置。');
      } else {
        alert('❌ 无法打开新窗口，请检查浏览器弹窗设置');
      }
    } else {
      alert('❌ 链接生成失败，请先重新生成链接');
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-12 rounded-[4rem] border border-slate-200 flex flex-col md:flex-row items-center gap-12">
        <div className="w-64 h-64 bg-white p-4 rounded-[3rem] shadow-2xl">
          {complexLink ? (
            <img 
              src={qrImageUrl} 
              className="w-full h-full rounded-[2rem]" 
              alt="QR Code"
              onError={(e) => {
                console.error('二维码图片加载失败');
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
              }}
            />
          ) : (
            <div className="w-full h-full rounded-[2rem] bg-slate-100 flex items-center justify-center">
              <p className="text-slate-500 text-sm">生成中...</p>
            </div>
          )}
        </div>
        
        <div className="flex-1 space-y-6">
          <h3 className="text-3xl font-black text-slate-800">产品"数字身份证"</h3>
          <p className="text-slate-600 font-medium">
            该二维码直接链接到产品的 RAG 知识库与视觉 AI 节点。印刷在包装上后，用户可获得实时的精准售后支持。
          </p>
          
          {/* 主要操作按钮 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleDownload}
              className="px-6 py-3 gold-gradient-btn text-slate-900 font-black rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              <Download size={18}/> Download PNG
            </button>
            
            <button 
              onClick={handlePreview}
              className="px-6 py-3 bg-slate-100 border border-slate-200 text-slate-800 font-black rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              <ExternalLink size={18}/> Preview 预览
            </button>
          </div>
          
          {/* 高级操作按钮 */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">
              高级操作 ▼
            </summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button 
                onClick={handleTestLink}
                className="px-4 py-2 bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <CheckCircle size={16}/> 测试链接
              </button>
              
              <button 
                onClick={handleRegenerate}
                className="px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <ArrowRight size={16}/> 重新生成
              </button>
              
              <button 
                onClick={handleSetProductionDomain}
                className="px-4 py-2 bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Globe size={16}/> 设置生产域名
              </button>
              
              <button 
                onClick={handleTestChat}
                className="px-4 py-2 bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <MessageSquare size={16}/> 测试对话
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default QRCodeSection;