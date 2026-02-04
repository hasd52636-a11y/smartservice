import { createClient } from '@supabase/supabase-js';

export const runtimeConfig = {
  runtime: 'edge',
};

interface VectorDocument {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    projectId: string;
    title: string;
    type: string;
    createdAt: string;
    tags?: string[];
  };
}

interface VectorSearchResult {
  id: string;
  score: number;
  content: string;
  metadata: VectorDocument['metadata'];
}

function getSupabaseClient(apiKey?: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = apiKey || process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    }
  });
}

function normalizeVector(vec: number[]): number[] {
  const magnitude = Math.sqrt(vec.reduce((sum, a) => sum + a * a, 0));
  if (magnitude === 0) return vec;
  return vec.map(a => a / magnitude);
}

async function createEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'embedding-3',
      input: [text],
      dimensions: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return normalizeVector(data.data[0].embedding);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, document, query, projectId, apiKey } = await req.json();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Zhipu API key required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getSupabaseClient();
    const targetProjectId = projectId || 'global';

    switch (action) {
      case 'upsert': {
        if (!document) {
          return new Response(JSON.stringify({ error: 'Document required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const embedding = await createEmbedding(document.content, apiKey);
        
        const { error } = await supabase.from('knowledge_vectors').upsert({
          id: document.id || `doc_${Date.now()}`,
          content: document.content,
          embedding: embedding,
          metadata: {
            projectId: targetProjectId,
            title: document.title || 'Untitled',
            type: document.type || 'text',
            createdAt: new Date().toISOString(),
            tags: document.tags || [],
          },
          project_id: targetProjectId,
        }, {
          onConflict: 'id'
        });

        if (error) {
          throw new Error(`Supabase upsert error: ${error.message}`);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          id: document.id || `doc_${Date.now()}`,
          message: 'Document vectorized and stored in Supabase' 
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'search': {
        if (!query) {
          return new Response(JSON.stringify({ error: 'Query required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const queryEmbedding = await createEmbedding(query, apiKey);
        
        const { data, error } = await supabase.rpc('match_knowledge', {
          query_embedding: queryEmbedding,
          match_threshold: 0.1,
          match_count: 10,
          filter_project_id: targetProjectId
        });

        if (error) {
          console.error('Supabase search error:', error);
          
          const { data: allDocs, error: fetchError } = await supabase
            .from('knowledge_vectors')
            .select('*')
            .eq('project_id', targetProjectId);

          if (fetchError) {
            throw new Error(`Supabase fetch error: ${fetchError.message}`);
          }

          const results: VectorSearchResult[] = (allDocs || [])
            .filter((doc: any) => doc.embedding)
            .map((doc: any) => ({
              id: doc.id,
              score: cosineSimilarity(queryEmbedding, doc.embedding),
              content: doc.content,
              metadata: doc.metadata,
            }))
            .filter(result => result.score > 0.1)
            .sort((a: VectorSearchResult, b: VectorSearchResult) => b.score - a.score)
            .slice(0, 10);

          return new Response(JSON.stringify({ 
            success: true, 
            results,
            message: `Found ${results.length} relevant documents (fallback mode)`
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const results: VectorSearchResult[] = (data || []).map((row: any) => ({
          id: row.id,
          score: row.similarity,
          content: row.content,
          metadata: row.metadata,
        }));

        return new Response(JSON.stringify({ 
          success: true, 
          results,
          message: `Found ${results.length} relevant documents`
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { id } = await req.json();
        if (!id) {
          return new Response(JSON.stringify({ error: 'Document ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabase
          .from('knowledge_vectors')
          .delete()
          .eq('id', id)
          .eq('project_id', targetProjectId);

        if (error) {
          throw new Error(`Supabase delete error: ${error.message}`);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Document deleted' 
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'list': {
        const { data, error } = await supabase
          .from('knowledge_vectors')
          .select('id, metadata, created_at, embedding')
          .eq('project_id', targetProjectId)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Supabase list error: ${error.message}`);
        }

        const documents = (data || []).map((doc: any) => ({
          id: doc.id,
          title: doc.metadata?.title || 'Untitled',
          type: doc.metadata?.type || 'text',
          createdAt: doc.metadata?.createdAt || doc.created_at,
          tags: doc.metadata?.tags || [],
          hasEmbedding: !!doc.embedding,
        }));

        return new Response(JSON.stringify({ 
          success: true, 
          documents,
          total: documents.length
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Knowledge API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length || vec1.length === 0) return 0;
  
  const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}
