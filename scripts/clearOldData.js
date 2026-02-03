/**
 * 数据清理脚本 - 清理旧的无向量知识库数据
 * 根据 xiugai.txt 的建议，需要清空旧数据重新添加
 */

// 在浏览器控制台中运行此脚本
function clearOldKnowledgeData() {
  console.log('🧹 开始清理旧的知识库数据...');
  
  // 清理localStorage中的项目数据
  const keys = Object.keys(localStorage);
  let clearedCount = 0;
  
  keys.forEach(key => {
    if (key.includes('project') || key.includes('knowledge') || key.includes('documents')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(data)) {
          // 检查是否有embedding字段
          const hasEmbedding = data.some(item => item.embedding && Array.isArray(item.embedding));
          if (!hasEmbedding && data.length > 0) {
            localStorage.removeItem(key);
            clearedCount++;
            console.log(`✅ 清理了 ${key}: ${data.length} 条记录`);
          }
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  });
  
  // 清理IndexedDB中的数据（如果存在）
  if (window.indexedDB) {
    const deleteRequest = indexedDB.deleteDatabase('SmartCustomerServiceDB');
    deleteRequest.onsuccess = () => {
      console.log('✅ 清理了 IndexedDB 数据');
    };
    deleteRequest.onerror = () => {
      console.log('ℹ️ IndexedDB 清理失败或不存在');
    };
  }
  
  console.log(`🎉 数据清理完成！清理了 ${clearedCount} 个存储项`);
  console.log('📝 请重新添加知识库文档，新版本会自动进行向量化');
  
  // 刷新页面
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

// 检查数据状态
function checkDataStatus() {
  console.log('🔍 检查当前数据状态...');
  
  const keys = Object.keys(localStorage);
  let totalItems = 0;
  let vectorizedItems = 0;
  
  keys.forEach(key => {
    if (key.includes('project') || key.includes('knowledge') || key.includes('documents')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(data)) {
          totalItems += data.length;
          const vectorized = data.filter(item => 
            item.embedding && 
            Array.isArray(item.embedding) && 
            item.embedding.length === 768
          ).length;
          vectorizedItems += vectorized;
          
          console.log(`📊 ${key}: ${data.length} 条记录，${vectorized} 条已向量化`);
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  });
  
  console.log(`📈 总计: ${totalItems} 条记录，${vectorizedItems} 条已向量化`);
  
  if (vectorizedItems === 0 && totalItems > 0) {
    console.log('⚠️ 发现旧数据！建议运行 clearOldKnowledgeData() 清理');
  } else if (vectorizedItems === totalItems && totalItems > 0) {
    console.log('✅ 所有数据都已正确向量化');
  }
  
  return {
    total: totalItems,
    vectorized: vectorizedItems,
    needsCleaning: vectorizedItems === 0 && totalItems > 0
  };
}

// 导出函数到全局作用域
window.clearOldKnowledgeData = clearOldKnowledgeData;
window.checkDataStatus = checkDataStatus;

console.log('🛠️ 数据清理工具已加载');
console.log('📋 可用命令:');
console.log('  - checkDataStatus() : 检查数据状态');
console.log('  - clearOldKnowledgeData() : 清理旧数据');