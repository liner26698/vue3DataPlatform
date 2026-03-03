/**
 * 游戏信息爬虫 - 游民星空发售表
 * 数据来源: https://ku.gamersky.com/release/{type}_{yyyyMM}/
 * 支持类型: ps5, pc
 * 使用 Axios + Cheerio (无需 Puppeteer)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db');

const GAME_TYPES = ['ps5', 'pc'];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Referer: 'https://ku.gamersky.com/',
  Connection: 'keep-alive'
};

/**
 * 获取当前及下一个月的 yyyyMM 字符串列表
 */
function getTargetMonths() {
  const now = new Date();
  const months = [];
  for (let offset = -1; offset <= 2; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${yyyy}${mm}`);
  }
  return months;
}

/**
 * 解析单个游戏条目
 */
function parseGameItem($, el, targetGameType) {
  const $el = $(el);

  // 标题 + 链接
  const titleEl = $el.find('.tit a');
  const title = titleEl.text().trim();
  const url = titleEl.attr('href') || '';

  // 封面图
  const imgEl = $el.find('.PF_1 .img a img');
  let img = imgEl.attr('src') || imgEl.attr('data-src') || '';
  // 补全协议
  if (img.startsWith('//')) img = 'https:' + img;

  // 解析多个 .txt 字段
  let releaseDate = '';
  let gameType = '';
  let production = '';

  $el.find('.PF_1 .txt').each((_, txtEl) => {
    const text = $(txtEl).text().trim();
    if (text.includes('发行日期')) {
      releaseDate = text.replace(/^.*发行日期[：:]/, '').trim();
    } else if (text.includes('游戏类型')) {
      // 优先取 a 标签文字
      const aText = $(txtEl).find('a').map((_, a) => $(a).text().trim()).get().join(',');
      gameType = aText || text.replace(/^.*游戏类型[：:]/, '').trim();
    } else if (text.includes('制作发行') || text.includes('制作') || text.includes('发行')) {
      production = text.replace(/^.*(制作发行|制作|发行)[：:]/, '').trim();
    }
  });

  // 简介
  const introduction = $el.find('.PF_1 .Intr p').text().trim() || $el.find('.Intr').text().trim();

  // 玩家评分（未发售游戏可能没有）
  const ratingText = $el.find('.wjnum .num').text().trim();
  const playerRating = ratingText ? parseFloat(ratingText) : null;

  // 评分人数
  const playerNumText = $el.find('.wjnum').text().replace(ratingText, '').trim();
  const playerNum = parseInt(playerNumText) || 0;

  // 期待值
  const expectedText = $el.find('.qdnum .num').text().trim();
  const expectedValue = parseInt(expectedText) || 0;

  if (!title) return null;

  return {
    title,
    url,
    img,
    time: releaseDate,
    game_type: gameType,
    production,
    introduction,
    targetgametype: targetGameType.toUpperCase(),
    player_rating: isNaN(playerRating) ? null : playerRating,
    player_num: playerNum,
    expected_value: expectedValue
  };
}

/**
 * 爬取指定游戏类型的指定月份数据
 */
async function crawlGamePage(gameType, yyyyMM) {
  const url = `https://ku.gamersky.com/release/${gameType}_${yyyyMM}/`;
  console.log(`  [GameSpider] 抓取: ${url}`);

  try {
    const resp = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000
    });

    const html = resp.data;

    const $ = cheerio.load(html);
    const items = [];

    $('ul.PF li').each((_, el) => {
      const item = parseGameItem($, el, gameType);
      if (item) items.push(item);
    });

    console.log(`  [GameSpider] ${gameType.toUpperCase()} ${yyyyMM}: 解析到 ${items.length} 条`);
    return items;
  } catch (err) {
    console.error(`  [GameSpider] 抓取失败 ${url}:`, err.message);
    return [];
  }
}

/**
 * 将游戏数据写入数据库（UPSERT：按 title + targetgametype 去重）
 */
async function saveGamesToDB(games) {
  if (!games.length) return 0;
  let saved = 0;

  for (const game of games) {
    try {
      const sql = `
        INSERT INTO game_info
          (title, url, img, time, game_type, production, introduction,
           targetgametype, player_rating, player_num, expected_value, update_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          url = VALUES(url),
          img = VALUES(img),
          time = VALUES(time),
          game_type = VALUES(game_type),
          production = VALUES(production),
          introduction = VALUES(introduction),
          player_rating = VALUES(player_rating),
          player_num = VALUES(player_num),
          expected_value = VALUES(expected_value),
          update_time = NOW()
      `;
      const params = [
        game.title,
        game.url,
        game.img,
        game.time,
        game.game_type,
        game.production,
        game.introduction,
        game.targetgametype,
        game.player_rating,
        game.player_num,
        game.expected_value
      ];
      await db.query(sql, params);
      saved++;
    } catch (err) {
      console.error(`  [GameSpider] 保存失败 "${game.title}":`, err.message);
    }
  }
  return saved;
}

/**
 * 确保 game_info 有 UNIQUE KEY 用于 UPSERT
 * 避免重复执行时报错（如果已存在则跳过）
 */
async function ensureUniqueKey() {
  try {
    const rows = await db.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.statistics
       WHERE table_schema = DATABASE() AND table_name = 'game_info'
         AND index_name = 'uq_game_title_type'`
    );
    if (rows[0].cnt === 0) {
      await db.query(`
        ALTER TABLE game_info
        ADD UNIQUE KEY uq_game_title_type (title(200), targetgametype(10))
      `);
      console.log('  [GameSpider] 已添加唯一索引');
    }
  } catch (err) {
    console.warn('  [GameSpider] 唯一索引处理:', err.message);
  }
}

/**
 * 主入口：爬取所有游戏类型的近期发售表
 */
async function runGameSpiders() {
  console.log('\n========== 游戏爬虫开始 ==========\n');

  await ensureUniqueKey();

  const months = getTargetMonths();
  console.log(`  目标月份: ${months.join(', ')}\n`);

  let totalSaved = 0;

  for (const gameType of GAME_TYPES) {
    console.log(`\n--- 类型: ${gameType.toUpperCase()} ---`);
    let allItems = [];

    for (const month of months) {
      const items = await crawlGamePage(gameType, month);
      allItems = allItems.concat(items);
      // 防止请求过快
      await new Promise(r => setTimeout(r, 1200));
    }

    console.log(`  ${gameType.toUpperCase()} 共解析 ${allItems.length} 条，开始入库...`);
    const saved = await saveGamesToDB(allItems);
    console.log(`  ${gameType.toUpperCase()} 入库 ${saved} 条`);
    totalSaved += saved;
  }

  console.log(`\n========== 游戏爬虫完成，共入库 ${totalSaved} 条 ==========\n`);
  return totalSaved;
}

module.exports = { runGameSpiders };
