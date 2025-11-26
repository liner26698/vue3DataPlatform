const superagent = require('superagent');
const cheerio = require('cheerio');

console.log('='.repeat(70));
console.log('知乎热榜爬虫 - Superagent + 浏览器引擎渲染');
console.log('='.repeat(70));

(async () => {
  try {
    console.log('\n📡 使用浏览器模式请求知乎...');
    
    // 尝试使用 superagent 的浏览器模式
    const response = await superagent
      .get('https://www.zhihu.com/hot')
      .query({ _t: Date.now() })  // 避免缓存
      .redirects(5)
      .set('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36')
      .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8')
      .set('Accept-Language', 'zh-CN,zh;q=0.9')
      .set('Accept-Encoding', 'gzip, deflate, br')
      .set('Cache-Control', 'max-age=0')
      .set('Upgrade-Insecure-Requests', '1')
      .set('Referer', 'https://www.zhihu.com/')
      .set('Sec-Fetch-Dest', 'document')
      .set('Sec-Fetch-Mode', 'navigate')
      .set('Sec-Fetch-Site', 'same-origin')
      .timeout({
        response: 15000,
        deadline: 20000
      });
    
    console.log(`✅ 请求成功`);
    console.log(`📊 状态码：${response.status}`);
    console.log(`📏 大小：${response.text.length} 字节`);
    
    // 检查内容
    const text = response.text;
    console.log('\n🔍 内容分析：');
    console.log(`  - 包含 <script>：${text.includes('<script') ? '✅' : '❌'}`);
    console.log(`  - 包含 JSON.parse：${text.includes('JSON.parse') ? '✅' : '❌'}`);
    console.log(`  - 包含 __INITIAL_STATE__：${text.includes('__INITIAL_STATE__') ? '✅' : '❌'}`);
    console.log(`  - 包含 questions：${text.includes('questions') ? '✅' : '❌'}`);
    console.log(`  - 包含 href：${(text.match(/href/g) || []).length} 个`);
    
    // 检查是否是渲染后的页面
    if (text.includes('__INITIAL_STATE__')) {
      console.log('\n✅ 检测到渲染后的页面内容！');
      
      // 尝试提取 JSON 数据
      const match = text.match(/<script[^>]*id="__INITIAL_STATE__"[^>]*>(.*?)<\/script>/s);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          console.log('✅ 成功解析 JSON 数据');
          console.log('数据结构：', Object.keys(data).slice(0, 5).join(', '));
        } catch (e) {
          console.log('❌ JSON 解析失败');
        }
      }
    } else {
      console.log('\n❌ 返回的仍然是加密页面');
    }
    
    // 尝试用 cheerio 解析
    console.log('\n🧩 Cheerio 解析结果：');
    const $ = cheerio.load(text);
    console.log(`  - <h2>：${$('h2').length}`);
    console.log(`  - <h3>：${$('h3').length}`);
    console.log(`  - [role="article"]：${$('[role="article"]').length}`);
    console.log(`  - <a href>：${$('a[href]').length}`);
    
  } catch (err) {
    console.error('❌ 错误：', err.message);
  }
})();
