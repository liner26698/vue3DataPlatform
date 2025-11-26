const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

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
    
    console.log('访问微博热搜榜...');
    try {
      await page.goto('https://s.weibo.com/top/summary', {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
    } catch (e) {
      console.log('加载提示：', e.message);
    }
    
    console.log('等待页面稳定...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const html = await page.content();
    console.log(`HTML 大小：${(html.length / 1024).toFixed(2)} KB`);
    
    const $ = cheerio.load(html);
    
    console.log('\n=== 页面结构 ===');
    console.log(`a 总数：${$('a').length}`);
    console.log(`tr 总数：${$('tr').length}`);
    console.log(`td 总数：${$('td').length}`);
    console.log(`li 总数：${$('li').length}`);
    console.log(`div：${$('div').length}`);
    
    // 检查是否有表格数据
    console.log('\n=== 表格分析 ===');
    const rows = $('tr');
    console.log(`表格行数：${rows.length}`);
    
    if (rows.length > 0) {
      console.log('\n前 10 行内容：');
      let rowCount = 0;
      rows.each((index, element) => {
        if (rowCount++ >= 10) return;
        const cells = $(element).find('td, th');
        const rowText = cells.map((i, el) => $(el).text().trim()).get().join(' | ');
        console.log(`  ${index}: ${rowText.substring(0, 100)}`);
      });
    }
    
    // 尝试提取热搜
    console.log('\n=== 提取热搜数据 ===');
    const topics = [];
    
    $('tr:not(:first-child)').each((index, element) => {
      if (topics.length >= 15) return;
      
      const $row = $(element);
      const cells = $row.find('td');
      
      if (cells.length >= 2) {
        const $link = $row.find('a').first();
        const title = $link.text().trim();
        const rankText = cells.first().text().trim();
        
        if (title && title.length > 2 && title.length < 100) {
          topics.push({
            rank: rankText || topics.length + 1,
            title: title
          });
        }
      }
    });
    
    if (topics.length > 0) {
      console.log(`✅ 成功提取 ${topics.length} 条热搜：`);
      topics.forEach(t => {
        console.log(`  ${t.rank}. ${t.title}`);
      });
    } else {
      console.log('❌ 未能提取热搜数据');
      console.log('\nHTML 开头 1000 字：');
      console.log(html.substring(0, 1000));
    }
    
    await browser.close();
    console.log('\n✅ 完成');
    
  } catch (err) {
    console.error('❌ 错误：', err.message);
    if (browser) await browser.close();
  }
  
  process.exit(0);
})();
