const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

(async () => {
  let browser;
  try {
    console.log('启动浏览器...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage'
      ]
    });
    
    const page = await browser.newPage();
    
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    
    console.log('访问知乎...');
    try {
      await page.goto('https://www.zhihu.com/hot', {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
    } catch (e) {
      console.log('页面加载提示：', e.message);
    }
    
    console.log('等待渲染...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const html = await page.content();
    
    // 保存 HTML 用于查看
    fs.writeFileSync('/tmp/zhihu_page.html', html);
    console.log(`HTML 已保存到 /tmp/zhihu_page.html (${(html.length / 1024).toFixed(2)} KB)`);
    
    const $ = cheerio.load(html);
    
    console.log('\n=== 结构分析 ===');
    console.log(`a 总数：${$('a').length}`);
    console.log(`/question/ 链接：${$('a[href*="/question/"]').length}`);
    console.log(`div：${$('div').length}`);
    console.log(`li：${$('li').length}`);
    
    // 检查特定的容器和内容
    console.log('\n=== 内容检查 ===');
    
    // 打印所有 a 标签及其 href
    console.log('\n前 30 个 a 标签：');
    let aCount = 0;
    $('a').each((index, element) => {
      if (aCount++ >= 30) return;
      const href = $(element).attr('href');
      const text = $(element).text().trim().substring(0, 50);
      if (href || text) {
        console.log(`  [${index}] href="${href}" text="${text}"`);
      }
    });
    
    // 检查是否包含 question
    const hasQuestion = html.includes('question');
    const qCount = (html.match(/question/g) || []).length;
    console.log(`\n"question" 出现次数：${qCount}`);
    
    // 查找所有 href 包含的关键字
    console.log('\n=== href 模式分析 ===');
    const hrefMatches = html.match(/href="[^"]*"/g) || [];
    const hrefPatterns = {};
    hrefMatches.slice(0, 50).forEach(match => {
      const type = match.substring(6, Math.min(30, match.length));
      hrefPatterns[type] = (hrefPatterns[type] || 0) + 1;
    });
    
    Object.entries(hrefPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([pattern, count]) => {
        console.log(`  ${pattern}... (${count})`);
      });
    
    await browser.close();
    console.log('\n✅ 调试完成');
    
  } catch (err) {
    console.error('❌ 错误：', err.message);
    if (browser) await browser.close();
  }
  
  process.exit(0);
})();
