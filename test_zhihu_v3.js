/**
 * 知乎热榜爬虫 - Puppeteer + Cheerio 改进版
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function crawlZhihu() {
  let browser;
  
  try {
    console.log('启动浏览器...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    
    console.log('访问知乎热榜...');
    await page.goto('https://www.zhihu.com/hot', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });
    
    console.log('等待页面稳定...');
    await page.waitForTimeout(3000);
    
    // 获取当前 URL
    const currentUrl = page.url();
    console.log(`当前 URL：${currentUrl}`);
    
    console.log('获取页面内容...');
    const html = await page.content();
    
    console.log(`HTML 大小：${(html.length / 1024).toFixed(2)} KB`);
    
    const $ = cheerio.load(html);
    
    // 检查基本元素
    console.log('\n=== 页面结构 ===');
    console.log(`h1：${$('h1').length}`);
    console.log(`h2：${$('h2').length}`);
    console.log(`h3：${$('h3').length}`);
    console.log(`a[href]：${$('a[href]').length}`);
    console.log(`a[href*="/question/"]：${$('a[href*="/question/"]').length}`);
    console.log(`li：${$('li').length}`);
    
    // 尝试找到热榜容器
    console.log('\n=== 寻找容器 ===');
    
    // 保存前 2KB HTML 用于调试
    const snippet = html.substring(0, 3000);
    const lines = snippet.split('\n');
    console.log(`前 20 行 HTML：`);
    lines.slice(0, 20).forEach((line, i) => {
      if (line.trim()) console.log(`${i}: ${line.substring(0, 100)}`);
    });
    
    // 检查是否有真实数据
    if (html.includes('question')) {
      console.log('\n✅ 页面包含 question 标签');
      
      // 尝试多种选择器
      const topics = [];
      
      // 方法 1: 通过链接
      $('a[href*="/question/"]').each((index, element) => {
        if (topics.length >= 10) return;
        const title = $(element).text().trim();
        if (title && title.length > 2 && title.length < 200) {
          topics.push({
            rank: topics.length + 1,
            title: title.substring(0, 100)
          });
        }
      });
      
      if (topics.length > 0) {
        console.log(`\n✅ 成功提取 ${topics.length} 条数据：`);
        topics.forEach(t => {
          console.log(`${t.rank}. ${t.title}`);
        });
      } else {
        console.log('\n❌ 虽然页面有 question 但无法提取数据');
        
        // 打印所有包含 question 的标签
        console.log('\n所有包含 question 的 a 标签：');
        let count = 0;
        $('a').each((index, element) => {
          const href = $(element).attr('href');
          const text = $(element).text().trim();
          if ((href && href.includes('question')) || text.includes('question')) {
            console.log(`  href=${href}, text=${text.substring(0, 50)}`);
            count++;
            if (count >= 5) return false;
          }
        });
      }
    } else {
      console.log('\n❌ 页面不包含 question，可能被反爬虫拦截');
    }
    
    await browser.close();
    
  } catch (err) {
    console.error('❌ 错误：', err.message);
    if (browser) await browser.close();
  }
}

crawlZhihu();
