
export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  embedding?: number[];
  createdAt: string;
  tags?: string[];
  vectorized: boolean;
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: {
    projectId: string;
    title: string;
    type: string;
    createdAt: string;
    tags?: string[];
  };
}

export class KnowledgeService {
  private apiKey: string = '';
  private baseUrl: string = '/api/knowledge';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async request(action: string, data: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        apiKey: this.apiKey,
        ...data,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Knowledge service error');
    }

    return response.json();
  }

  async addDocument(document: Partial<KnowledgeDocument>, projectId?: string): Promise<{ id: string }> {
    const result = await this.request('upsert', { document, projectId });
    return { id: result.id };
  }

  async deleteDocument(id: string, projectId?: string): Promise<void> {
    await this.request('delete', { id, projectId });
  }

  async search(query: string, projectId?: string): Promise<SearchResult[]> {
    const result = await this.request('search', { query, projectId });
    return result.results || [];
  }

  async listDocuments(projectId?: string): Promise<KnowledgeDocument[]> {
    const result = await this.request('list', { projectId });
    return result.documents || [];
  }
}

export const knowledgeService = new KnowledgeService();
