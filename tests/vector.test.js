// Simple vector math tests - standalone version

function describe(name, fn) {
  console.log(`\n📦 ${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (error) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) throw new Error(`Expected ${expected} but got ${actual}`);
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) throw new Error(`Expected ${actual} > ${expected}`);
    },
    toBeLessThan(expected) {
      if (actual >= expected) throw new Error(`Expected ${actual} < ${expected}`);
    },
    toContain(expected) {
      if (!actual.includes(expected)) throw new Error(`Expected "${actual}" to contain "${expected}"`);
    },
  };
}

describe('Vector Math', function() {
  function cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length || vec1.length === 0) return 0;
    const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  function normalizeVector(vec) {
    const magnitude = Math.sqrt(vec.reduce((sum, a) => sum + a * a, 0));
    if (magnitude === 0) return vec;
    return vec.map(a => a / magnitude);
  }

  it('should calculate cosine similarity correctly', function() {
    const vec1 = [1, 0, 0];
    const vec2 = [1, 0, 0];
    expect(cosineSimilarity(vec1, vec2)).toBe(1);
  });

  it('should return 0 for orthogonal vectors', function() {
    const vec1 = [1, 0];
    const vec2 = [0, 1];
    expect(cosineSimilarity(vec1, vec2)).toBe(0);
  });

  it('should handle negative similarity', function() {
    const vec1 = [1, 0];
    const vec2 = [-1, 0];
    expect(cosineSimilarity(vec1, vec2)).toBe(-1);
  });

  it('should normalize vectors correctly', function() {
    const vec = [3, 4];
    const normalized = normalizeVector(vec);
    const magnitude = Math.sqrt(normalized[0] ** 2 + normalized[1] ** 2);
    expect(magnitude).toBeGreaterThan(0.99);
    expect(magnitude).toBeLessThan(1.01);
  });

  it('should handle empty vectors', function() {
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it('should handle different length vectors', function() {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });
});

describe('Knowledge Retrieval', function() {
  function retrieveRelevantKnowledge(prompt, knowledge) {
    const query = prompt.toLowerCase();
    const scoredItems = knowledge.map(function(item) {
      let score = 0;
      if (item.title.toLowerCase().includes(query)) {
        score += 3.0;
      }
      if (item.content.toLowerCase().includes(query)) {
        score += 2.0;
      }
      return { item: item, score: score };
    });
    return scoredItems
      .filter(function(item) { return item.score > 0; })
      .sort(function(a, b) { return b.score - a.score; })
      .slice(0, 5)
      .map(function(item) { return item.item; });
  }

  it('should find matching documents by title', function() {
    var knowledge = [
      { title: 'Installation Guide', content: 'How to install' },
      { title: 'User Manual', content: 'How to use' }
    ];
    var results = retrieveRelevantKnowledge('installation', knowledge);
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Installation Guide');
  });

  it('should find matching documents by content', function() {
    var knowledge = [
      { title: 'Installation Guide', content: 'Step by step installation' },
      { title: 'User Manual', content: 'How to use the product' }
    ];
    var results = retrieveRelevantKnowledge('product', knowledge);
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('User Manual');
  });

  it('should return empty for no matches', function() {
    var knowledge = [
      { title: 'Installation Guide', content: 'Step by step' }
    ];
    var results = retrieveRelevantKnowledge('xyz123', knowledge);
    expect(results.length).toBe(0);
  });

  it('should prioritize title matches over content matches', function() {
    var knowledge = [
      { title: 'Product Guide', content: 'Other content' },
      { title: 'Other Guide', content: 'Product related info' }
    ];
    var results = retrieveRelevantKnowledge('product', knowledge);
    expect(results.length).toBe(2);
    expect(results[0].title).toBe('Product Guide');
  });
});

console.log('\n✅ All tests completed!\n');
