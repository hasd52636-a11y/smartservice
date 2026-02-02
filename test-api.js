import fetch from 'node-fetch';

async function testZhipuAPI() {
  try {
    const response = await fetch('http://localhost:3003/api/zhipu/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer a75d46768b0f45dc90a5969077ffc8d9.dT0t2tku3hZGfYkk'
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages: [
          {
            role: 'user',
            content: 'ping'
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error testing Zhipu API:', error);
  }
}

testZhipuAPI();
