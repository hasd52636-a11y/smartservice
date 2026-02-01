const axios = require('axios');

// 智谱AI API配置
const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

// 获取API密钥
function getApiKey() {
  return process.env.ZHIPU_API_KEY || process.env.API_KEY || '';
}

// 处理SSE流式响应
function handleStreamingResponse(response, res) {
  const contentType = response.headers['content-type'];
  
  if (contentType && contentType.includes('text/event-stream')) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    // 流式传输响应
    response.data.on('data', (chunk) => {
      res.write(chunk);
    });
    
    response.data.on('end', () => {
      res.end();
    });
    
    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).json({ error: 'Stream error' });
    });
  } else {
    // 非流式响应
    return response.data.then((data) => {
      res.json(data);
    }).catch((error) => {
      console.error('Response data error:', error);
      res.status(500).json({ error: 'Response processing error' });
    });
  }
}

module.exports = async (req, res) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(401).json({ 
        error: {
          code: '1001',
          message: 'Header 中未收到 Authentication 参数，无法进行身份验证。请设置 ZHIPU_API_KEY 环境变量。'
        }
      });
    }

    const { endpoint } = req.query;
    const endpointPath = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;
    
    // 构建智谱AI API URL
    const url = `${ZHIPU_BASE_URL}/${endpointPath}`;
    
    console.log('Proxying request to Zhipu AI:', url);
    console.log('Request method:', req.method);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // 设置请求头 - 按照智谱AI API规范
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SmartService/1.0'
    };

    // 处理不同的HTTP方法
    const axiosConfig = {
      url,
      method: req.method || 'POST',
      headers,
      data: req.body,
      timeout: 60000, // 60秒超时
      responseType: req.body?.stream ? 'stream' : 'json'
    };

    const response = await axios(axiosConfig);

    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // 处理流式或非流式响应
    if (req.body?.stream && response.headers['content-type']?.includes('text/event-stream')) {
      await handleStreamingResponse(response, res);
    } else {
      res.json(response.data);
    }

  } catch (error) {
    console.error('Zhipu AI API proxy error:', error.message);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    let errorResponse = {
      error: {
        code: '500',
        message: 'API request failed'
      }
    };

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      console.error('Zhipu AI API response error:', {
        status: status,
        data: data,
        headers: error.response.headers
      });

      // 根据智谱AI API错误码规范处理错误
      if (data && data.error) {
        errorResponse = data;
      } else {
        // 根据HTTP状态码映射智谱AI错误码
        switch (status) {
          case 401:
            errorResponse.error.code = '1002';
            errorResponse.error.message = 'Authorization Token非法，请确认Authorization Token正确传递。';
            break;
          case 429:
            errorResponse.error.code = '1302';
            errorResponse.error.message = '您当前使用该 API 的并发数过高，请降低并发，或联系客服增加限额';
            break;
          case 404:
            errorResponse.error.code = '1222';
            errorResponse.error.message = `API ${endpointPath} 不存在`;
            break;
          default:
            errorResponse.error.message = data?.message || error.response.statusText || 'API request failed';
        }
      }
      
      res.status(status).json(errorResponse);
    } else if (error.request) {
      console.error('No response received from Zhipu AI:', error.request);
      errorResponse.error.code = '1234';
      errorResponse.error.message = '网络错误，请联系客服';
      res.status(503).json(errorResponse);
    } else {
      console.error('Request setup error:', error.message);
      errorResponse.error.message = error.message;
      res.status(500).json(errorResponse);
    }
  }
};
