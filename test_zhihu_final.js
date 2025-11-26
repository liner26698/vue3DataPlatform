/**
 * 知乎热榜爬虫 - 反检测版本
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function crawlZhihu() {
  let browser;
  
  try {
    console.log('启动浏览器（反检测模式）...');
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
    
    // 隐藏 webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    
    // 设置请求头
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });
    
    console.log('访问知乎热榜...');
    const startTime = Date.now();
    
    try {
      await page.goto('https://www.zhihu.com/hot', {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
    } catch (navErr) {
      console.log(`导航超时或出错（这是正常的），继续...`);
    }
    
    console.log(`加载耗时：${Date.now() - startTime}ms`);
    
    console.log('等待页面渲染...');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`最终 URL：${currentUrl}`);
    
    console.log('提取 HTML...');
    const html = await page.content();
    console.log(`HTML 大小：${(html.length / 1024).toFixed(2)} KB`);
    
    const $ = cheerio.load(html);
    
    // 快速诊断
    console.log('\n=== 诊断 ===');
    console.log(`a 标签总数：${$('a').length}`);
    console.log(`question 链接：${$('a[href*="/question/"]').length}`);
    console.log(`问题标题个数：${$('a[href*="/question/"] span, a[href*="/question/"] div').length}`);
    
    // 提取热榜
    const topics = [];
    
    $('a[href*="/question/"]').each((index, element) => {
      if (topics.length >= 15) return;
      
      const $link = $(element);
      let title = $link.text().trim();
      
      if (title && title.length > 2 && title.length < 200 && !title.includes('https')) {
        // 去重
        if (!topics.find(t => t.title === title)) {
          topics.push({
            rank: topics.length + 1,
            title: title,
            url: $link.attr('href')
          });
        }
      }
    });
    
    if (topics.length > 0) {
      console.log(`\n✅ 成功提取 ${topics.length} 条热榜数据！`);
      topics.forEach(t => {
        console.log(`${t.rank}. ${t.title.substring(0, 80)}`);
      });
    } else {
      console.log('\n❌ 未能提取数据');
      console.log('\nHTML 开头 500 字：');
      console.log(html.substring(0, 500));
    }
    
    await browser.close();
    console.log('\n完成');
    
  } catch (err) {
    console.error('❌ 错误：', err.message);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
  }
}

crawlZhihu();
