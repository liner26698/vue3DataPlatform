const axios = require('axios');

(async () => {
  try {
    // 尝试直接访问 API
    const apiUrl = 'https://www.zhihu.com/api/v3/feed/topstory';
    
    console.log('尝试 API 接口: ' + apiUrl);
    
    const response = await axios.get(apiUrl, {
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Referer': 'https://www.zhihu.com/hot',
        'X-Requested-With': 'XMLHttpRequest',
      }
    });
    
    console.log('HTTP 状态:', response.status);
    console.log('响应大小:', JSON.stringify(response.data).length, '字节');
    console.log('是否包含问题:', typeof response.data === 'object' && response.data.data);
    
    if (response.data.data && Array.isArray(response.data.data)) {
      console.log('✅ 数据数量:', response.data.data.length);
      console.log('\n前 3 条:');
      response.data.data.slice(0, 3).forEach((item, i) => {
        console.log(`  ${i+1}. ${JSON.stringify(item).substring(0, 100)}...`);
      });
    } else {
      console.log('响应结构:', Object.keys(response.data).join(', '));
      console.log('完整响应:', JSON.stringify(response.data).substring(0, 300));
    }
    
  } catch (err) {
    console.error('❌ 错误:', err.message);
  }
})();
