const superagent = require('superagent');
const cheerio = require('cheerio');

console.log('='.repeat(70));
console.log('知乎热榜爬虫 - 使用 Superagent（带浏览器渲染）');
console.log('='.repeat(70));

(async () => {
  try {
    console.log('\n📡 正在用 Superagent 请求知乎热榜...');
    
    const response = await superagent
      .get('https://www.zhihu.com/hot')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')
      .set('Accept-Language', 'zh-CN,zh;q=0.9')
      .set('Referer', 'https://www.zhihu.com/')
      .timeout({
        response: 10000,
        deadline: 15000
      });
    
    console.log(`✅ Superagent 请求成功`);
    console.log(`📊 HTTP 状态：${response.status}`);
    console.log(`📏 响应大小：${response.text.length} 字节`);
    
    // 检查是否是渲染后的页面
    console.log('\n🔍 检查响应内容...');
    const hasQuestion = response.text.includes('question') || response.text.includes('Question');
    const hasHotList = response.text.includes('热') || response.text.includes('hot');
    const hasLink = response.text.includes('href') && response.text.split('href').length > 50;
    
    console.log(`  - 包含 question 标签：${hasQuestion ? '✅' : '❌'}`);
    console.log(`  - 包含热榜信息：${hasHotList ? '✅' : '❌'}`);
    console.log(`  - 包含多个链接（>50）：${hasLink ? '✅' : '❌'}`);
    
    // 用 Cheerio 解析
    console.log('\n🧩 使用 Cheerio 解析响应...');
    const $ = cheerio.load(response.text);
    
    const selectors = {
      'h2': $('h2').length,
      'h3': $('h3').length,
      'a[href]': $('a[href]').length,
      '[role="article"]': $('[role="article"]').length,
      '[role="feed"]': $('[role="feed"]').length,
      '.question-link': $('.question-link').length,
      'title': $('title').text().substring(0, 50),
    };
    
    console.log(`结果：`);
    Object.entries(selectors).forEach(([key, value]) => {
      const isCount = typeof value === 'number';
      const status = (isCount && value === 0) ? '❌' : '✅';
      console.log(`  ${status} ${key}: ${value}`);
    });
    
    // 尝试提取热榜
    console.log('\n📋 尝试提取热榜数据...');
    const topics = [];
    $('[role="article"]').each((index, element) => {
      if (topics.length >= 5) return;
      const $item = $(element);
      const title = $item.find('h2, h3, a').first().text().trim();
      if (title && title.length > 2) {
        topics.push({
          rank: topics.length + 1,
          title: title.substring(0, 100)
        });
      }
    });
    
    if (topics.length > 0) {
      console.log(`✅ 成功提取 ${topics.length} 条热榜：`);
      topics.forEach(t => {
        console.log(`   ${t.rank}. ${t.title}`);
      });
    } else {
      console.log(`❌ 未能提取到热榜数据`);
      console.log(`\n📝 HTML 前 500 字：`);
      console.log(response.text.substring(0, 500));
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (err) {
    console.error('❌ 错误：', err.message);
    if (err.response) {
      console.error('状态码：', err.response.status);
      console.error('响应开头：', err.response.text?.substring(0, 200));
    }
  }
})();
