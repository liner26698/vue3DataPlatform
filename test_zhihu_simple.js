/**
 * 知乎热榜爬虫 - Puppeteer + Cheerio 方案（快速版）
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function crawlZhihuWithPuppeteer() {
  let browser;
  
  try {
    console.log('启动 Puppeteer...');
    
    browser = await puppeteer.launch({
      headless: 'new',  // 快速模式
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0');
    
    console.log('访问知乎热榜...');
    await page.goto('https://www.zhihu.com/hot', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('获取页面内容...');
    const html = await page.content();
    
    console.log(`HTML 大小：${html.length} 字节`);
    
    // 简单检查
    console.log(`包含 href：${(html.match(/href/g) || []).length}`);
    console.log(`包含 question：${html.includes('question')}`);
    
    const $ = cheerio.load(html);
    
    console.log(`[role="article"]：${$('[role="article"]').length}`);
    console.log(`h2 标签：${$('h2').length}`);
    console.log(`h3 标签：${$('h3').length}`);
    
    // 提取数据
    const topics = [];
    $('[role="article"]').each((index, element) => {
      if (topics.length >= 10) return;
      
      const $item = $(element);
      const title = $item.find('h2, h3, a').first().text().trim();
      
      if (title && title.length > 2) {
        topics.push({
          rank: topics.length + 1,
          title: title.substring(0, 100)
        });
      }
    });
    
    console.log(`\n✅ 成功提取 ${topics.length} 条数据：`);
    topics.forEach(t => {
      console.log(`${t.rank}. ${t.title}`);
    });
    
    await browser.close();
    return topics;
    
  } catch (err) {
    console.error('❌ 错误：', err.message);
    if (browser) await browser.close();
    return [];
  }
}

crawlZhihuWithPuppeteer();
