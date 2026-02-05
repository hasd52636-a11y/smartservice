const axios = require('axios');
const FormData = require('form-data');

// 检查是否在 Node.js 环境中
const isNodeEnv = typeof process !== 'undefined' && process.env;

// 仅在 Node.js 环境中导入文件系统模块
let fs, path, os;
if (isNodeEnv) {
  fs = require('fs');
  path = require('path');
  os = require('os');
}

// 获取API密钥
function getApiKey() {
  if (!isNodeEnv) {
    return '';
  }
  return process.env.ZHIPU_API_KEY || process.env.API_KEY || '';
}

module.exports = async (req, res) => {
  try {
    // 检查是否在 Node.js 环境中
    if (!isNodeEnv) {
      return res.status(500).json({ error: 'OCR service requires Node.js environment' });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(401).json({ error: 'No API key provided' });
    }

    // 检查是否有文件上传
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, file.name);

    // 保存临时文件
    fs.writeFileSync(tempFilePath, file.data);

    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempFilePath));
      formData.append('tool_type', req.body.tool_type || 'hand_write');
      formData.append('language_type', req.body.language_type || 'CHN_ENG');
      formData.append('probability', req.body.probability || 'false');

      const response = await axios({
        url: 'https://open.bigmodel.cn/api/paas/v4/files/ocr',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        },
        data: formData
      });

      res.json(response.data);
    } finally {
      // 清理临时文件
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (error) {
    console.error('OCR processing error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || error.message || 'OCR processing error'
    });
  }
};
