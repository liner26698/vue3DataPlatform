/**
 * 知乎热榜爬虫 - 调试版本
 * 目的：查看实际的 HTML 结构
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function debugZhihu() {
  let browser;
  
  try {
    console.log('启动浏览器...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0');
    
    console.log('加载知乎...');
    await page.goto('https://www.zhihu.com/hot', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    console.log('\n=== 页面结构分析 ===');
    console.log(`总大小：${html.length} 字节`);
    
    // 列出所有可能的容器
    console.log('\n容器检查：');
    console.log(`- div：${$('div').length}`);
    console.log(`- [role="feed"]：${$('[role="feed"]').length}`);
    console.log(`- [role="article"]：${$('[role="article"]').length}`);
    console.log(`- [role="list"]：${$('[role="list"]').length}`);
    console.log(`- [role="listitem"]：${$('[role="listitem"]').length}`);
    console.log(`- .QuestionItem：${$('.QuestionItem').length}`);
    console.log(`- .question-item：${$('.question-item').length}`);
    console.log(`- .Card：${$('.Card').length}`);
    console.log(`- .feed：${$('.feed').length}`);
    
    // 列出标题元素
    console.log('\n标题元素检查：');
    console.log(`- h1：${$('h1').length}`);
    console.log(`- h2：${$('h2').length}`);
    console.log(`- h3：${$('h3').length}`);
    console.log(`- h4：${$('h4').length}`);
    console.log(`- [class*="Title"]：${$('[class*="Title"]').length}`);
    console.log(`- [class*="title"]：${$('[class*="title"]').length}`);
    
    // 列出链接
    console.log('\n链接检查：');
    console.log(`- a[href]：${$('a[href]').length}`);
    console.log(`- a[href*="/question/"]：${$('a[href*="/question/"]').length}`);
    
    // 显示 HTML 片段
    console.log('\n=== HTML 片段 ===');
    console.log('前 2000 字：');
    console.log(html.substring(0, 2000));
    
    console.log('\n\n包含 "question" 的位置：');
    const idx = html.indexOf('question');
    if (idx > -1) {
      console.log(html.substring(Math.max(0, idx - 100), idx + 200));
    }
    
    // 查找所有可能包含热榜的关键元素
    console.log('\n=== 寻找热榜元素 ===');
    const possibleContainers = [
      '[data-testid="hotItem"]',
      '[class*="hot"]',
      '[class*="Hot"]',
      '[data-*="hot"]',
      'li',
      'article'
    ];
    
    possibleContainers.forEach(selector => {
      const count = $(selector).length;
      if (count > 0 && count < 50) {
        console.log(`${selector}: ${count} 个`);
        if (count <= 5) {
          $(selector).each((i, el) => {
            console.log(`  [${i}]: ${$(el).text().substring(0, 80)}`);
          });
        }
      }
    });
    
    await browser.close();
    
  } catch (err) {
    console.error('❌ 错误：', err.message);
    if (browser) await browser.close();
  }
}

debugZhihu();
