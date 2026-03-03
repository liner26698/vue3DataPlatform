/**
 * AI工具爬虫 - 数据来源: ai-bot.cn
 * 抓取15个分类的AI工具列表，存入 ai_info 表
 * 使用 Axios + Cheerio（无需 Puppeteer）
 */

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Referer': 'https://ai-bot.cn/'
};

// 分类配置：中文名 → favorites URL
const CATEGORIES = [
  { name: 'AI聊天助手',  url: 'https://ai-bot.cn/favorites/ai-chatbots/' },
  { name: 'AI写作工具',  url: 'https://ai-bot.cn/favorites/ai-writing-tools/' },
  { name: 'AI图像工具',  url: 'https://ai-bot.cn/favorites/ai-image-tools/' },
  { name: 'AI视频工具',  url: 'https://ai-bot.cn/favorites/ai-video-tools/' },
  { name: 'AI办公工具',  url: 'https://ai-bot.cn/favorites/ai-office-tools/' },
  { name: 'AI编程工具',  url: 'https://ai-bot.cn/favorites/ai-programming-tools/' },
  { name: 'AI设计工具',  url: 'https://ai-bot.cn/favorites/ai-design-tools/' },
  { name: 'AI音频工具',  url: 'https://ai-bot.cn/favorites/ai-audio-tools/' },
  { name: 'AI搜索引擎',  url: 'https://ai-bot.cn/favorites/ai-search-engines/' },
  { name: 'AI智能体',    url: 'https://ai-bot.cn/favorites/ai-agent/' },
  { name: 'AI训练模型',  url: 'https://ai-bot.cn/favorites/ai-models/' },
  { name: 'AI开发平台',  url: 'https://ai-bot.cn/favorites/ai-frameworks/' },
  { name: 'AI提示指令',  url: 'https://ai-bot.cn/favorites/ai-prompt-tools/' },
  { name: 'AI内容检测',  url: 'https://ai-bot.cn/favorites/ai-content-detection-and-optimization-tools/' },
  { name: 'AI学习网站',  url: 'https://ai-bot.cn/favorites/websites-to-learn-ai/' }
];

/**
 * 抓取单个分类页面，返回工具列表
 */
async function crawlCategoryPage(categoryName, pageUrl) {
  try {
    const resp = await axios.get(pageUrl, {
      headers: HEADERS,
      timeout: 20000
    });

    const $ = cheerio.load(resp.data);
    const tools = [];

    $('.url-card').each((_, el) => {
      const $el = $(el);

      // 工具实际 URL
      const anchor = $el.find('a[data-url]').first();
      const toolUrl = anchor.attr('data-url') || anchor.attr('href') || '';
      if (!toolUrl || toolUrl.includes('ai-bot.cn/sites/')) return;

      // 工具名称（img alt）
      const img = $el.find('img').first();
      const name = img.attr('alt') || '';
      if (!name) return;

      // 描述（a title）
      const description = anchor.attr('title') || '';

      // 图标（data-src 是懒加载，src 是占位图）
      let iconUrl = img.attr('data-src') || img.attr('src') || '';
      if (iconUrl && !iconUrl.startsWith('http')) {
        iconUrl = 'https://ai-bot.cn' + iconUrl;
      }

      tools.push({
        name: name.trim(),
        category: categoryName,
        description: description.trim(),
        url: toolUrl.replace(/&amp;/g, '&'),
        img: iconUrl,
        tags: JSON.stringify([categoryName]),
        is_free: 1
      });
    });

    console.log(`  [AiSpider] ${categoryName}: 解析到 ${tools.length} 个工具`);
    return tools;
  } catch (err) {
    console.error(`  [AiSpider] 抓取失败 ${categoryName}:`, err.message);
    return [];
  }
}

/**
 * 确保 ai_info 有唯一索引（按工具名去重）
 */
async function ensureUniqueKey() {
  try {
    const rows = await db.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.statistics
       WHERE table_schema = DATABASE() AND table_name = 'ai_info'
         AND index_name = 'uq_ai_name'`
    );
    if (rows[0].cnt === 0) {
      await db.query(`ALTER TABLE ai_info ADD UNIQUE KEY uq_ai_name (name(200))`);
      console.log('  [AiSpider] 已添加唯一索引');
    }
  } catch (err) {
    console.warn('  [AiSpider] 索引处理:', err.message);
  }
}

/**
 * 批量写入数据库（UPSERT）
 */
async function saveToolsToDB(tools) {
  if (!tools.length) return 0;
  let saved = 0;

  for (const tool of tools) {
    try {
      await db.query(
        `INSERT INTO ai_info (name, category, description, url, img, tags, is_free)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           category    = VALUES(category),
           description = VALUES(description),
           url         = VALUES(url),
           img         = VALUES(img),
           tags        = VALUES(tags)`,
        [tool.name, tool.category, tool.description, tool.url, tool.img, tool.tags, tool.is_free]
      );
      saved++;
    } catch (err) {
      console.error(`  [AiSpider] 保存失败 "${tool.name}":`, err.message);
    }
  }
  return saved;
}

/**
 * 主入口：爬取所有分类
 */
async function runAiSpider() {
  console.log('\n========== AI工具爬虫开始 ==========\n');
  await ensureUniqueKey();

  let totalSaved = 0;

  for (const cat of CATEGORIES) {
    const tools = await crawlCategoryPage(cat.name, cat.url);
    const saved = await saveToolsToDB(tools);
    totalSaved += saved;
    console.log(`  ${cat.name}: 入库 ${saved} 条`);
    // 请求间隔，防止被封
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n========== AI工具爬虫完成，共入库 ${totalSaved} 条 ==========\n`);
  return totalSaved;
}

module.exports = { runAiSpider };
