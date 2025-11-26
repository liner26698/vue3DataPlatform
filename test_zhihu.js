const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  try {
    const response = await axios.get('https://www.zhihu.com/hot', {
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.zhihu.com/',
      }
    });
    
    console.log('='.repeat(60));
    console.log('HTTP 状态:', response.status);
    console.log('响应大小:', response.data.length, '字节');
    console.log('='.repeat(60));
    
    const $ = cheerio.load(response.data);
    
    console.log('\n📊 页面结构分析:');
    console.log('  - 标题:', $('title').text());
    console.log('  - H2 标签数:', $('h2').length);
    console.log('  - H3 标签数:', $('h3').length);
    console.log('  - A 标签数:', $('a').length);
    console.log('  - 带 href 的 A:', $('a[href]').length);
    
    console.log('\n🔍 内容片段:');
    console.log(response.data.substring(0, 1000));
    
    console.log('\n⚠️ 关键词检查:');
    console.log('  - 包含 "question":', response.data.includes('question'));
    console.log('  - 包含 "feed":', response.data.includes('feed'));
    console.log('  - 包含 JSON:', response.data.includes('{') && response.data.includes('}'));
    
  } catch (err) {
    console.error('❌ 错误:', err.message);
  }
})();
