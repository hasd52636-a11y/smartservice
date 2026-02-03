// Vercel Edge Function for chat API
export const config = {
  runtime: 'edge', // 使用边缘函数，全球访问速度最快
};

export default async function handler(req) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { messages, projectId, stream = false } = await req.json();

    // 验证请求参数
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 从环境变量获取 API Key
    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 构建请求体
    const requestBody = {
      model: "glm-4", // 使用最新的 GLM-4 模型
      messages: messages,
      stream: stream,
      temperature: 0.1,
      max_tokens: 1024,
    };

    // 转发请求给智谱 AI
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zhipu API Error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'AI service temporarily unavailable',
        details: response.status === 429 ? 'Rate limit exceeded' : 'Service error'
      }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 如果是流式响应
    if (stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 非流式响应
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}