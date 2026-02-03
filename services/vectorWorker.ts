// 移动端优化：Web Worker for vector calculations
// 这个文件将被用于创建Web Worker来处理向量计算，避免阻塞主线程

export const createVectorWorker = (): Worker | null => {
  try {
    // 创建Web Worker的代码字符串
    const workerCode = `
      // 余弦相似度计算
      function cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) {
          return 0;
        }
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
          dotProduct += vecA[i] * vecB[i];
          normA += vecA[i] * vecA[i];
          normB += vecB[i] * vecB[i];
        }
        
        const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
      }
      
      // 处理向量搜索
      self.onmessage = function(e) {
        const { type, data } = e.data;
        
        if (type === 'SEARCH_VECTORS') {
          const { queryVector, knowledgeBase, threshold, maxResults } = data;
          
          const results = [];
          
          for (let i = 0; i < knowledgeBase.length; i++) {
            const item = knowledgeBase[i];
            if (item.embedding && Array.isArray(item.embedding)) {
              const similarity = cosineSimilarity(queryVector, item.embedding);
              if (similarity >= threshold) {
                results.push({
                  ...item,
                  similarity
                });
              }
            }
          }
          
          // 按相似度排序并限制结果数量
          results.sort((a, b) => b.similarity - a.similarity);
          const limitedResults = results.slice(0, maxResults);
          
          self.postMessage({
            type: 'SEARCH_COMPLETE',
            results: limitedResults
          });
        }
      };
    `;
    
    // 创建Blob和Worker
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    
    // 清理URL对象
    worker.addEventListener('error', () => {
      URL.revokeObjectURL(workerUrl);
    });
    
    return worker;
  } catch (error) {
    console.warn('Web Worker创建失败，将使用主线程计算:', error);
    return null;
  }
};

// 使用Web Worker进行向量搜索的辅助函数
export const searchVectorsWithWorker = (
  worker: Worker,
  queryVector: number[],
  knowledgeBase: any[],
  threshold: number = 0.45,
  maxResults: number = 5
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('向量搜索超时'));
    }, 5000);
    
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'SEARCH_COMPLETE') {
        clearTimeout(timeout);
        worker.removeEventListener('message', handleMessage);
        resolve(e.data.results);
      }
    };
    
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', (error) => {
      clearTimeout(timeout);
      worker.removeEventListener('message', handleMessage);
      reject(error);
    });
    
    worker.postMessage({
      type: 'SEARCH_VECTORS',
      data: {
        queryVector,
        knowledgeBase,
        threshold,
        maxResults
      }
    });
  });
};