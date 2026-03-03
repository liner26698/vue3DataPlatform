/**
 * 热门话题爬虫 - 使用 Cheerio 爬取各平台热门话题
 * 支持平台: 百度、微博、B站
 * 
 * 安装依赖: npm install axios cheerio iconv-lite puppeteer mysql2 node-cron
 * 
 * 使用方式:
 * 1. 直接运行: node hotTopicsSpider.js
 * 2. 定时任务: 使用 node-cron 或 systemd 定时执行
 * 
 * author: kris
 * date: 2025年11月26日
 */

// Node 18 polyfill for undici compatibility
if (typeof global.File === 'undefined') {
	global.File = class File {
		constructor(bits, filename, options) {
			this.bits = bits;
			this.filename = filename;
			this.options = options;
		}
	};
}

const axios = require("axios");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const db = require("./db.js");

// 模拟浏览器 User-Agent
const USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// 爬虫配置
const SPIDER_CONFIG = {
	timeout: 10000,
	headers: {
		"User-Agent": USER_AGENT
	}
};

/**
 * 1. 爬取百度热搜 - 使用百度内部 JSON API（无需 JS 渲染）
 */
async function crawlBaiduTrending() {
	try {
		console.log("🔍 正在爬取百度热搜...");
		// 百度热搜内部 JSON API，直接返回结构化数据
		const url = "https://top.baidu.com/api/board?platform=wise&tab=realtime";

		const response = await axios.get(url, {
			timeout: 12000,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
				"Accept": "application/json, text/plain, */*",
				"Accept-Language": "zh-CN,zh;q=0.9",
				"Referer": "https://top.baidu.com/board?tab=realtime"
			}
		});

		if (response.status !== 200) {
			console.warn(`⚠️  百度返回 HTTP ${response.status}`);
			return [];
		}

		const json = response.data;
		// API 返回结构: { data: { cards: [{ content: [...] }] } }
		const cards = json?.data?.cards;
		if (!cards || !cards.length) {
			console.warn("⚠️  百度 API 返回数据结构异常");
			return [];
		}

		// 实际结构: cards[0].content[0].content 才是话题列表
		const items = cards[0]?.content?.[0]?.content || cards[0]?.content || [];
		const topics = [];

		items.forEach((item, index) => {
			if (topics.length >= 15) return;
			const title = item.word || item.query || "";
			if (!title || title.length < 2) return;

			topics.push({
				platform: "baidu",
				rank: index + 1,
				title: title,
				category: item.category || "热搜",
				heat: parseInt(item.hotScore) || (100 - index) * 100000,
				trend: "stable",
				tags: ["百度", "热搜"],
				url: `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`,
				description: item.desc || title,
				is_active: 1
			});
		});

		if (topics.length > 0) {
			console.log(`✅ 百度热搜爬取成功: ${topics.length} 条`);
			return topics;
		}

		console.warn("⚠️  百度暂无数据");
		return [];

	} catch (error) {
		console.error("❌ 百度热搜爬取失败:", error.message);
		return [];
	}
}

/**
 * 2. 爬取微博热搜 - 先尝试 Puppeteer，失败则使用 HTTP 模式
 */
async function crawlWeiboTrending() {
	// 先尝试 Puppeteer 模式
	const puppeteerResult = await crawlWeiboTrendingWithPuppeteer();
	if (puppeteerResult.length > 0) {
		return puppeteerResult;
	}
	
	// Puppeteer 失败，改用 HTTP 模式
	console.log("⚠️  Puppeteer 模式失败，尝试 HTTP 模式...");
	return await crawlWeiboTrendingWithHttp();
}

/**
 * 微博爬虫 - Puppeteer 模式
 */
async function crawlWeiboTrendingWithPuppeteer() {
	let browser;
	try {
		console.log("✨ 正在爬取微博热搜（Puppeteer 模式）...");
		const puppeteer = require('puppeteer');
		
		// 使用系统已安装的 Chromium (CentOS 位置)
		const executablePath = '/usr/lib64/chromium-browser/chromium-browser';
		
		browser = await puppeteer.launch({
			executablePath: executablePath,
			headless: 'new',
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-blink-features=AutomationControlled',
				'--disable-dev-shm-usage',
				'--disable-gpu',
				'--disable-software-rasterizer'
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
		
		await page.setExtraHTTPHeaders({
			'Accept-Language': 'zh-CN,zh;q=0.9',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			'Referer': 'https://s.weibo.com/'
		});
		
		console.log("   📄 访问微博热搜榜...");
		try {
			await page.goto('https://s.weibo.com/top/summary', {
				waitUntil: 'domcontentloaded',
				timeout: 45000
			});
		} catch (navErr) {
			console.log("   ⏱️  页面加载超时，继续尝试...");
		}
		
		console.log("   ⏳ 等待页面稳定...");
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		const html = await page.content();
		console.log(`   ✅ 获取 HTML: ${(html.length / 1024).toFixed(2)} KB`);
		
		const $ = cheerio.load(html);
		const topics = [];
		
		// 从表格中提取热搜
		$('tr:not(:first-child)').each((index, element) => {
			if (topics.length >= 15) return;
			
			const $row = $(element);
			const cells = $row.find('td');
			
			if (cells.length >= 2) {
				const $link = $row.find('a').first();
				const title = $link.text().trim();
				const rankText = cells.first().text().trim();
				
				if (title && title.length > 2 && title.length < 100 && !title.includes('javascript')) {
					topics.push({
						platform: "weibo",
						rank: topics.length + 1,
						title: title,
						category: "热搜",
						heat: (100 - topics.length) * 100000,
						trend: "stable",
						tags: ["微博", "热搜"],
						url: `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
						description: title,
						is_active: 1
					});
				}
			}
		});
		
		await browser.close();
		
		if (topics.length > 0) {
			console.log(`✅ 微博热搜爬取成功: ${topics.length} 条`);
			return topics;
		}
		
		console.warn("⚠️  微博暂无数据");
		return [];

	} catch (error) {
		if (browser) {
			try {
				await browser.close();
			} catch (e) {}
		}
		console.warn("⚠️  Puppeteer 模式失败:", error.message);
		return [];
	}
}

/**
 * 微博爬虫 - HTTP 备选模式，使用微博 AJAX API（无需登录）
 */
async function crawlWeiboTrendingWithHttp() {
	try {
		console.log("🌐 正在爬取微博热搜（AJAX API 模式）...");

		// 微博公开热搜 AJAX 接口，无需登录
		const response = await axios.get('https://weibo.com/ajax/side/hotSearch', {
			timeout: 10000,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
				'Accept': 'application/json, text/plain, */*',
				'Accept-Language': 'zh-CN,zh;q=0.9',
				'Referer': 'https://weibo.com/',
				'X-Requested-With': 'XMLHttpRequest'
			}
		});

		if (response.status !== 200 || !response.data) {
			console.warn("⚠️  微博 API 返回异常");
			return [];
		}

		// 返回结构: { data: { realtime: [ { word, num, category, ... } ] } }
		const realtime = response.data?.data?.realtime;
		if (!realtime || !realtime.length) {
			console.warn("⚠️  微博 API 数据结构异常");
			return [];
		}

		const topics = [];
		realtime.forEach((item, index) => {
			if (topics.length >= 20) return;
			const title = item.word || item.query || "";
			if (!title || title.length < 2) return;

			// num 是热度数字（万为单位），转换成整数
			const heatRaw = item.num || "";
			const heat = heatRaw
				? Math.round(parseFloat(String(heatRaw).replace(/[^0-9.]/g, "")) * 10000)
				: (100 - index) * 100000;

			topics.push({
				platform: "weibo",
				rank: index + 1,
				title: title,
				category: item.category || "热搜",
				heat: heat,
				trend: "stable",
				tags: ["微博", "热搜"],
				url: `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
				description: item.note || title,
				is_active: 1
			});
		});

		if (topics.length > 0) {
			console.log(`✅ 微博热搜爬取成功: ${topics.length} 条（AJAX API）`);
			return topics;
		}

		console.warn("⚠️  微博暂无数据");
		return [];
		
	} catch (error) {
		console.error("❌ 微博热搜爬取异常:", error.message);
		return [];
	}
}

/**
 * 3. 爬取B站热门
 */
async function crawlBilibiliTrending() {
	try {
		console.log("▶ 正在爬取B站热门...");
		const url = "https://www.bilibili.com/";

		const response = await axios.get(url, {
			timeout: 10000,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
				"Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				"Referer": "https://www.bilibili.com/"
			}
		});

		const $ = cheerio.load(response.data);
		const topics = [];

		// B站热门视频 - 尝试多个选择器
		const selectors = [
			"h3 a, .title, [class*='title'] a, [title]",
			".feed-item a",
			".video-card a",
			"a[title]"
		];

		for (const selector of selectors) {
			$(selector).each((index, element) => {
				if (topics.length >= 15) return;

				const $item = $(element);
				const title = ($item.text() || $item.attr("title") || "").trim();

				if (title && title.length > 2 && title.length < 120 && !topics.some(t => t.title === title)) {
					topics.push({
						platform: "bilibili",
						rank: topics.length + 1,
						title: title.substring(0, 100),
						category: "热门",
						heat: (100 - topics.length) * 60000,
						trend: "stable",
						tags: ["B站", "视频"],
						url: $item.attr("href") ? (($item.attr("href").startsWith("http") ? "" : "https://www.bilibili.com") + $item.attr("href")) : "https://www.bilibili.com",
						description: title.substring(0, 100),
						is_active: 1
					});
				}
			});

			if (topics.length >= 15) break;
		}

		if (topics.length > 0) {
			console.log(`✅ B站热门爬取成功: ${topics.length} 条`);
			return topics;
		}

		console.warn("⚠️  B站热门爬取失败");
		return [];
	} catch (error) {
		console.error("❌ B站热门爬取失败:", error.message);
		return [];
	}
}

/**
 * 保存话题到数据库
 */
async function saveTopicsToDatabase(topics) {
	if (!topics || topics.length === 0) {
		console.log("⚠️  没有话题数据需要保存");
		return;
	}

	try {
		for (const topic of topics) {
			// 检查是否已存在相同的话题
			const checkSql = `
				SELECT id FROM hot_topics 
				WHERE platform = ? AND title = ? 
				AND DATE(updated_at) = CURDATE()
				LIMIT 1
			`;

			const existing = await db.query(checkSql, [topic.platform, topic.title]);

			if (existing && existing.length > 0) {
				// 更新现有记录
				const updateSql = `
					UPDATE hot_topics 
					SET \`rank\` = ?, heat = ?, trend = ?, tags = ?, 
					    category = ?, url = ?, description = ?, updated_at = NOW()
					WHERE id = ?
				`;

				await db.query(updateSql, [
					topic.rank,
					topic.heat,
					topic.trend,
					JSON.stringify(topic.tags || []),
					topic.category,
					topic.url,
					topic.description,
					existing[0].id
				]);
			} else {
				// 插入新记录
				const insertSql = `
					INSERT INTO hot_topics 
					(\`platform\`, \`rank\`, \`title\`, \`category\`, \`heat\`, \`trend\`, \`tags\`, \`url\`, \`description\`, \`is_active\`)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`;

				await db.query(insertSql, [
					topic.platform,
					topic.rank,
					topic.title,
					topic.category,
					topic.heat,
					topic.trend,
					JSON.stringify(topic.tags || []),
					topic.url,
					topic.description,
					1
				]);
			}
		}

		console.log(`💾 成功保存 ${topics.length} 条话题到数据库`);
	} catch (error) {
		console.error("❌ 保存数据库失败:", error.message);
	}
}

/**
 * 记录爬虫日志
 */
async function logCrawlerTask(platform, status, totalCount, errorMessage = null, duration = 0) {
	try {
		const sql = `
			INSERT INTO crawler_logs 
			(spider_type, platform, status, total_count, error_message, duration_ms)
			VALUES (?, ?, ?, ?, ?, ?)
		`;

		await db.query(sql, ["hot_topics", platform, status, totalCount, errorMessage, duration]);
	} catch (error) {
		console.error("❌ 记录爬虫日志失败:", error.message);
	}
}

/**
 * 主函数 - 执行所有爬虫
 */
async function runAllSpiders() {
	console.log("\n========== 热门话题爬虫开始 ==========");
	console.log(`⏰ 开始时间: ${new Date().toLocaleString()}\n`);

	const startTime = Date.now();
	const allTopics = [];

	const platforms = [
		{ name: "百度", fn: crawlBaiduTrending },
		{ name: "微博", fn: crawlWeiboTrending },
		{ name: "B站", fn: crawlBilibiliTrending }
	];

	for (const platform of platforms) {
		const platformStartTime = Date.now();
		try {
			const topics = await platform.fn();
			const duration = Date.now() - platformStartTime;

			allTopics.push(...topics);
			await logCrawlerTask(platform.name.toLowerCase(), "success", topics.length, null, duration);

			// 延迟以避免请求过于频繁
			await new Promise(resolve => setTimeout(resolve, 2000));
		} catch (error) {
			const duration = Date.now() - platformStartTime;
			console.error(`❌ ${platform.name}爬虫错误:`, error.message);
			await logCrawlerTask(platform.name.toLowerCase(), "failed", 0, error.message, duration);
		}
	}

	// 批量保存所有话题
	await saveTopicsToDatabase(allTopics);

	const totalTime = Date.now() - startTime;
	console.log(`\n========== 爬虫执行完成 ==========`);
	console.log(`⏰ 结束时间: ${new Date().toLocaleString()}`);
	console.log(`⌛ 总耗时: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
	console.log(`📊 共爬取: ${allTopics.length} 条话题\n`);

	return allTopics;
}

// 如果直接运行此文件
if (require.main === module) {
	runAllSpiders()
		.then(() => {
			console.log("✅ 爬虫任务完成");
			process.exit(0);
		})
		.catch(error => {
			console.error("❌ 爬虫任务失败:", error);
			process.exit(1);
		});
}

module.exports = {
	runAllSpiders,
	fetchAllTrending: runAllSpiders,  // 别名，用于 API 调用
	crawlBaiduTrending,
	crawlWeiboTrending,
	crawlBilibiliTrending,
	saveTopicsToDatabase
};
