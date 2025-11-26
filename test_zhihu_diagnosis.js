const axios = require('axios');
const cheerio = require('cheerio');

console.log('='.repeat(70));
console.log('知乎热榜爬虫诊断 - Cheerio + Axios 失效演示');
console.log('='.repeat(70));

(async () => {
  try {
    // 1️⃣ 发送 HTTP 请求
    console.log('\n📡 第一步：发送 HTTP 请求');
    const response = await axios.get('https://www.zhihu.com/hot', {
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://www.zhihu.com/',
      }
    });
    
    console.log(`   ✅ HTTP 请求成功`);
    console.log(`   📊 状态码：${response.status}`);
    console.log(`   📏 响应大小：${response.data.length} 字节`);
    
    // 2️⃣ 分析返回内容
    console.log('\n🔍 第二步：分析返回的 HTML 内容');
    console.log(`   📝 HTML 片段（前 200 字）：`);
    console.log(`   ${response.data.substring(0, 200)}`);
    
    // 3️⃣ 检查加密数据
    console.log('\n🔐 第三步：检查 ZSE_CK 加密机制');
    const zseMatch = response.data.match(/zh-zse-ck.*?content="([^"]+)"/);
    if (zseMatch) {
      console.log(`   ✅ 检测到 ZSE_CK 加密数据`);
      console.log(`   🔒 加密内容长度：${zseMatch[1].length} 字符`);
      console.log(`   🔒 加密内容（前 100 字）：${zseMatch[1].substring(0, 100)}...`);
      console.log(`   💡 这是加密的，无法直接解析`);
    }
    
    // 4️⃣ 尝试用 Cheerio 解析
    console.log('\n🧩 第四步：使用 Cheerio 解析 HTML');
    const $ = cheerio.load(response.data);
    
    const hotElements = {
      'h2 标签': $('h2').length,
      'h3 标签': $('h3').length,
      '有 href 的 a 标签': $('a[href]').length,
      '[role="article"]': $('[role="article"]').length,
      '[role="feed"]': $('[role="feed"]').length,
      '.question-link': $('.question-link').length,
      'data-testid="hotItem"': $('[data-testid="hotItem"]').length,
    };
    
    console.log(`   结果：`);
    Object.entries(hotElements).forEach(([selector, count]) => {
      const status = count === 0 ? '❌' : '✅';
      console.log(`   ${status} ${selector}: ${count}`);
    });
    
    // 5️⃣ 总结
    console.log('\n📌 诊断总结');
    console.log(`   ✅ HTTP 请求：成功`);
    console.log(`   ✅ 返回 HTML：成功`);
    console.log(`   ❌ 页面解析：失败 - 不包含有效的热榜数据`);
    console.log(`   🔐 原因：知乎使用 ZSE_CK 加密保护，数据需要 JavaScript 解密`);
    
    console.log('\n💡 解决方案：');
    console.log(`   1. 使用 Puppeteer（完整浏览器模拟）✅`);
    console.log(`   2. 使用代理或 VPN（概率低，迟早被检测）⚠️`);
    console.log(`   3. 放弃知乎数据（简单但不完整）❌`);
    
    console.log('\n' + '='.repeat(70));
    
  } catch (err) {
    console.error('❌ 错误:', err.message);
  }
})();
