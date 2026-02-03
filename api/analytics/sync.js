// Analytics sync API for cross-device data synchronization
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { projectId, deviceId, sessionId } = req.query;
    
    // Simple validation
    if (!projectId) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Project ID is required' 
      });
    }

    if (req.method === 'GET') {
      // 获取项目的聚合分析数据
      const mockAggregatedData = {
        projectId,
        lastUpdated: new Date().toISOString(),
        metrics: {
          totalUsers: Math.floor(Math.random() * 1000) + 100,
          totalSessions: Math.floor(Math.random() * 2000) + 200,
          avgSessionDuration: Math.floor(Math.random() * 300) + 60,
          deviceBreakdown: {
            mobile: Math.floor(Math.random() * 60) + 20,
            desktop: Math.floor(Math.random() * 30) + 10,
            tablet: Math.floor(Math.random() * 20) + 5
          },
          topIssues: [
            { category: 'Installation', count: Math.floor(Math.random() * 50) + 10 },
            { category: 'WIFI Setup', count: Math.floor(Math.random() * 40) + 8 },
            { category: 'Hardware', count: Math.floor(Math.random() * 30) + 5 },
            { category: 'Others', count: Math.floor(Math.random() * 25) + 3 }
          ],
          csatAverage: (Math.random() * 2 + 3).toFixed(1),
          handoffRate: Math.floor(Math.random() * 15) + 5
        },
        recentActivity: [
          {
            timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            action: 'scan',
            deviceType: 'mobile',
            resolved: Math.random() > 0.3
          },
          {
            timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
            action: 'message',
            deviceType: 'desktop',
            resolved: Math.random() > 0.2
          }
        ]
      };

      res.status(200).json({
        success: true,
        data: mockAggregatedData,
        metadata: {
          source: 'aggregated_cross_device',
          apiVersion: '1.0',
          generatedAt: new Date().toISOString()
        }
      });

    } else if (req.method === 'POST') {
      // 接收设备上报的分析数据
      const { analyticsData, deviceInfo } = req.body;
      
      if (!analyticsData) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Analytics data is required'
        });
      }

      // 在真实实现中，这里会将数据存储到数据库
      // 现在只是模拟处理
      console.log('Received analytics data from device:', {
        projectId,
        deviceId,
        sessionId,
        dataPoints: Object.keys(analyticsData).length,
        deviceInfo
      });

      // 模拟数据处理和聚合
      const processedData = {
        received: true,
        processed: true,
        aggregated: true,
        timestamp: new Date().toISOString(),
        dataPoints: Object.keys(analyticsData).length
      };

      res.status(200).json({
        success: true,
        message: 'Analytics data received and processed',
        data: processedData,
        metadata: {
          projectId,
          deviceId,
          sessionId,
          processedAt: new Date().toISOString()
        }
      });

    } else if (req.method === 'PUT') {
      // 更新特定会话的数据
      const { sessionData, updateType } = req.body;
      
      console.log('Updating session data:', {
        projectId,
        sessionId,
        updateType,
        hasData: !!sessionData
      });

      res.status(200).json({
        success: true,
        message: 'Session data updated successfully',
        data: {
          sessionId,
          updateType,
          updatedAt: new Date().toISOString()
        }
      });

    } else {
      res.status(405).json({ 
        error: 'Method not allowed',
        allowedMethods: ['GET', 'POST', 'PUT', 'OPTIONS']
      });
    }

  } catch (error) {
    console.error('Analytics sync API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
}