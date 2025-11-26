/**
 * 知乎热榜爬虫 - Puppeteer + Cheerio 方案
 * 思路：
 * 1. 用 Puppeteer 启动浏览器访问页面（渲染 JavaScript）
 * 2. 等待页面加载完成
 * 3. 获取完整的 HTML（已渲染）
 * 4. 用 Cheerio 解析提取数据
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function crawlZhihuWithPuppeteer() {
  let browser;
  
  try {
    console.log('='.repeat(70));
    console.log('知乎热榜爬虫 - Puppeteer + Cheerio 方案');
    console.log('='.repeat(70));
    
    console.log('\n🚀 第一步：启动 Puppeteer 浏览器...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    console.log('✅ 浏览器已启动');
    
    console.log('\n📄 第二步：创建新标签页...');
    const page = await browser.newPage();
    
    // 设置浏览器指纹，伪装成真用户
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('✅ 标签页已创建');
    
    console.log('\n🌐 第三步：访问知乎热榜页面...');
    await page.goto('https://www.zhihu.com/hot', {
      waitUntil: 'networkidle2',  // 等待网络空闲
      timeout: 30000
    });
    console.log('✅ 页面已加载');
    
    console.log('\n⏳ 第四步：等待热榜元素加载...');
    try {
      await page.waitForSelector('[role="feed"]', { timeout: 10000 });
      console.log('✅ 热榜元素已找到');
    } catch (e) {
      console.warn('⚠️  热榜元素等待超时，继续尝试...');
    }
    
    console.log('\n📸 第五步：获取渲染后的完整 HTML...');
    const html = await page.content();
    console.log(`✅ HTML 已获取，大小：${html.length} 字节`);
    
    // 检查是否是渲染后的真实内容
    console.log('\n🔍 第六步：验证页面内容...');
    const hasQuestions = html.includes('question');
    const hasLinks = (html.match(/href/g) || []).length > 100;
    console.log(`  - 包含问题标签：${hasQuestions ? '✅' : '❌'}`);
    console.log(`  - 包含多个链接：${hasLinks ? '✅' : '❌'}`);
    console.log(`  - 链接总数：${(html.match(/href/g) || []).length}`);
    
    console.log('\n🧩 第七步：使用 Cheerio 解析 HTML...');
    const $ = cheerio.load(html);
    
    console.log('📊 页面结构分析：');
    console.log(`  - <h2>：${$('h2').length}`);
    console.log(`  - <h3>：${$('h3').length}`);
    console.log(`  - <a href>：${$('a[href]').length}`);
    console.log(`  - [role="article"]：${$('[role="article"]').length}`);
    console.log(`  - [role="feed"]：${$('[role="feed"]').length}`);
    
    console.log('\n📋 第八步：提取热榜数据...');
    const topics = [];
    
    // 尝试多个选择器
    const selectors = [
      '[role="feed"] [role="article"]',
      'div[data-testid="hotItem"]',
      '.Card.CardBase'
    ];
    
    for (const selector of selectors) {
      if (topics.length > 0) break;
      
      $(selector).each((index, element) => {
        if (topics.length >= 15) return;
        
        const $item = $(element);
        const titleElem = $item.find('h2, h3, a').first();
        let title = titleElem.text().trim();
        const url = titleElem.attr('href') || titleElem.find('a').attr('href') || 'https://www.zhihu.com/hot';
        
        if (title && title.length > 2 && title.length < 200) {
          topics.push({
            rank: topics.length + 1,
            title: title,
            url: url,
            platform: 'zhihu'
          });
        }
      });
    }
    
    console.log(`✅ 成功提取 ${topics.length} 条热榜\n`);
    
    if (topics.length > 0) {
      console.log('🔥 知乎热榜数据：');
      topics.forEach(topic => {
        console.log(`  ${topic.rank}. ${topic.title}`);
      });
    } else {
      console.log('❌ 未能提取到热榜数据');
      console.log('\n💡 调试信息：');
      console.log('HTML 前 500 字：');
      console.log(html.substring(0, 500));
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ 爬虫完成！');
    console.log('='.repeat(70));
    
    return topics;
    
  } catch (err) {
    console.error('\n❌ 错误：', err.message);
    console.error('堆栈信息：', err.stack);
    return [];
  } finally {
    if (browser) {
      console.log('\n🛑 关闭浏览器...');
      await browser.close();
      console.log('✅ 浏览器已关闭');
    }
  }
}

// 运行爬虫
crawlZhihuWithPuppeteer().catch(console.error);
