/*
 * 知识相似度计算API端点
 * 提供基于向量化的语义相似度计算服务
 */

import { companyKnowledgeGraph } from '../services/companyKnowledgeGraph';
import { userKnowledgeGraph } from '../services/userKnowledgeGraph';

export const runtimeConfig = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { userQuestions, threshold = 0.8 } = await request.json();

    if (!userQuestions || !Array.isArray(userQuestions)) {
      return new Response(JSON.stringify({ error: 'userQuestions is required and must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 使用公司知识图谱服务计算相似度
    const similarityResults = await companyKnowledgeGraph.computeSimilarityWithUserQuestions(
      userQuestions,
      threshold
    );

    // 获取合并后的图谱数据
    const userData = userKnowledgeGraph.getEChartsData();
    const mergedData = await companyKnowledgeGraph.mergeWithUserGraph(userData, threshold);

    return new Response(JSON.stringify({
      success: true,
      similarityResults,
      mergedGraphData: mergedData,
      coverageRate: mergedData.overlapAnalysis.coverageRate
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in knowledge similarity API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// GET端点用于获取当前配置信息
async function getConfigHandler(request) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const companyStats = companyKnowledgeGraph.getStats();
    const userStats = userKnowledgeGraph.getStats();

    return new Response(JSON.stringify({
      success: true,
      config: {
        defaultThreshold: 0.8,
        companyKnowledgeCount: companyStats.knowledgeCount,
        userQuestionCount: userStats.totalQuestions,
        categories: [...companyStats.topCategories.map(c => c.category), ...userStats.categoryDistribution.map(c => c.category)]
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in knowledge config API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 导出主处理函数
export { handler as POST, getConfigHandler as GET };