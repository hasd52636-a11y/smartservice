// Vercel Edge Function for project API
export const config = {
  runtime: 'edge',
};

import { db } from '../db';

// 智谱AI API配置
const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  if (req.method === 'GET') {
    try {
      const project = await db.getProject(id || '');

      if (!project || project.status !== 'active') {
        return new Response(JSON.stringify({
          error: project ? 'Project is not active' : 'Project not found',
          valid: false
        }), {
          status: project ? 403 : 404,
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