// Analytics API endpoint for external data access
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { key, type = 'analytics' } = req.query;
    
    // Simple API key validation (in production, use proper authentication)
    if (!key || key !== process.env.ANALYTICS_API_KEY) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Valid API key required' 
      });
    }

    // Mock data response (in real implementation, this would fetch from database)
    const mockAnalyticsData = {
      uniqueUsers: 0,
      avgHelpTime: 0,
      csatScore: 0,
      bypassRate: 0,
      serviceTypeData: [
        { name: 'Jan', proactive: 0, reactive: 0 },
        { name: 'Feb', proactive: 0, reactive: 0 },
        { name: 'Mar', proactive: 0, reactive: 0 },
        { name: 'Apr', proactive: 0, reactive: 0 },
        { name: 'May', proactive: 0, reactive: 0 },
        { name: 'Jun', proactive: 0, reactive: 0 }
      ],
      issueDistribution: [
        { name: 'Installation', value: 0 },
        { name: 'WIFI Setup', value: 0 },
        { name: 'Hardware', value: 0 },
        { name: 'Others', value: 0 }
      ]
    };

    const response = {
      success: true,
      data: mockAnalyticsData,
      metadata: {
        dataScope: type,
        apiVersion: '1.0',
        exportedAt: new Date().toISOString(),
        requestId: Math.random().toString(36).substr(2, 9)
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
}