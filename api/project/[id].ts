// Vercel Edge Function for project API
export const config = {
  runtime: 'edge',
};

// 模拟的项目数据存储（生产环境中应该连接真实数据库）
const mockProjects = new Map([
  ['p1', {
    id: 'p1',
    name: '测试项目',
    description: '用于测试扫码功能的项目。',
    status: 'active',
    config: {
      provider: 'zhipu',
      voiceName: 'tongtong',
      visionEnabled: true,
      visionPrompt: 'Check if all cables are plugged in and the LED is glowing green.',
      systemInstruction: 'You are a helpful product assistant.',
      videoGuides: [],
      multimodalEnabled: true,
      videoChatEnabled: true,
      avatarEnabled: true,
      annotationEnabled: true,
      companyName: '中恒创世',
      supportPhone: '400-888-6666',
      supportWebsite: 'www.aivirtualservice.com',
      wechatAccount: 'AI虚拟客服助手',
      welcomeMessage: '您好！我是智能售后客服助手 🤖\n\n我可以帮您解决：\n• 产品使用问题\n• 安装指导\n• 故障排查\n• 维护保养\n\n请描述您遇到的问题，或上传相关图片，我会基于产品知识库为您提供专业解答。'
    },
    knowledgeBase: [
      { 
        id: 'k1', 
        title: '使用说明', 
        type: 'text', 
        content: '这是一个测试项目，用于验证扫码功能是否正常工作。', 
        createdAt: new Date().toISOString() 
      },
      { 
        id: 'k2', 
        title: '测试内容', 
        type: 'text', 
        content: '扫码成功！您可以开始使用AI虚拟客服功能了。', 
        createdAt: new Date().toISOString() 
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }],
  ['proj_1', {
    id: 'proj_1',
    name: 'SmartHome Pro Hub',
    description: 'Next-gen automation controller for modern homes.',
    status: 'active',
    config: {
      provider: 'zhipu',
      voiceName: 'tongtong',
      visionEnabled: true,
      visionPrompt: 'Check if all cables are plugged in and the LED is glowing green.',
      systemInstruction: 'You are a technical support expert for SmartHome Pro products.',
      videoGuides: [],
      multimodalEnabled: true,
      videoChatEnabled: true,
      avatarEnabled: true,
      annotationEnabled: true,
      companyName: '中恒创世',
      supportPhone: '400-888-6666',
      supportWebsite: 'www.aivirtualservice.com',
      wechatAccount: 'AI虚拟客服助手'
    },
    knowledgeBase: [
      { 
        id: 'k1', 
        title: 'Initial Setup', 
        type: 'text', 
        content: 'Plug in the device and wait 60 seconds.', 
        createdAt: new Date().toISOString() 
      },
      { 
        id: 'k2', 
        title: 'Connection Guide', 
        type: 'text', 
        content: '1. Download the SmartHome app\n2. Create an account\n3. Follow the in-app setup instructions', 
        createdAt: new Date().toISOString() 
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }]
]);

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  if (req.method === 'GET') {
    try {
      // 从模拟数据库获取项目
      const project = mockProjects.get(id || '');
      
      if (!project) {
        return new Response(JSON.stringify({ 
          error: 'Project not found',
          valid: false 
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 验证项目状态
      if (project.status !== 'active') {
        return new Response(JSON.stringify({ 
          error: 'Project is not active',
          valid: false 
        }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        valid: true,
        project: project
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Project API Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        valid: false 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}