# Analytics API 导出功能使用指南

## 🎯 功能概述

数据分析页面现已恢复完整的API导出功能，支持多种格式的数据导出和外部API访问。

## 📊 主要功能

### 1. 数据导出格式
- **JSON格式** - 完整的结构化数据，适合程序处理
- **CSV格式** - 表格数据，适合Excel等办公软件
- **完整数据导出** - 包含系统配置和所有业务数据
- **API链接生成** - 用于外部系统集成访问

### 2. 导出数据内容
- 用户交互统计（独立用户数、平均帮助时间等）
- 服务类型分析（自助引导 vs AI聊天）
- 问题分布统计
- 项目和知识库数据
- 系统配置信息

## 🚀 使用方法

### 在Analytics页面中使用
1. 进入Analytics页面
2. 点击右上角"导出数据"按钮
3. 选择需要的导出格式：
   - **导出为JSON** - 下载JSON格式文件
   - **导出为CSV** - 下载CSV格式文件  
   - **完整数据导出** - 下载包含所有信息的JSON文件
   - **生成API链接** - 复制API访问链接到剪贴板

### 程序化访问
```javascript
import { AnalyticsApiService } from '../services/analyticsApiService';

// 导出分析数据
const result = AnalyticsApiService.exportAnalyticsData();
if (result.success) {
  console.log('导出成功:', result.data);
}

// 下载为文件
AnalyticsApiService.downloadAsFile(data, 'filename', 'json');

// 生成API链接
const apiUrl = AnalyticsApiService.generateApiEndpoint('analytics');
```

## 🔧 API端点

### GET /api/analytics
获取分析数据的API端点

**参数:**
- `key` (必需) - API访问密钥
- `type` (可选) - 数据类型，默认为 'analytics'

**响应格式:**
```json
{
  "success": true,
  "data": {
    "uniqueUsers": 0,
    "avgHelpTime": 0,
    "csatScore": 0,
    "bypassRate": 0,
    "serviceTypeData": [...],
    "issueDistribution": [...]
  },
  "metadata": {
    "dataScope": "analytics",
    "apiVersion": "1.0",
    "exportedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🧪 测试功能

使用 `test-analytics-api.html` 文件测试所有导出功能：

1. 在浏览器中打开 `test-analytics-api.html`
2. 生成测试数据
3. 测试各种导出格式
4. 验证API链接生成
5. 预览当前数据

## 📁 相关文件

- `components/Analytics.tsx` - 主要的Analytics组件
- `services/analyticsApiService.ts` - API服务类
- `api/analytics.js` - 服务器端API端点
- `test-analytics-api.html` - 功能测试页面

## 🔒 安全说明

- API访问需要有效的密钥验证
- 数据存储在本地localStorage中
- 支持CORS跨域访问
- 建议在生产环境中使用更强的身份验证机制

## 💡 使用建议

1. **定期导出数据** - 建议定期备份分析数据
2. **选择合适格式** - JSON适合程序处理，CSV适合人工分析
3. **API集成** - 可以将API链接集成到其他系统中
4. **数据隐私** - 确保导出的数据符合隐私保护要求

## 🐛 故障排除

如果遇到导出问题：
1. 检查浏览器是否支持文件下载
2. 确认本地存储中有数据
3. 验证API密钥是否正确
4. 查看浏览器控制台的错误信息

---

**更新时间:** 2024年1月
**版本:** 1.0.0