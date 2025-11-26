/**
 * 热门话题爬虫 - 使用 Cheerio 爬取各平台热门话题
 * 支持平台: 抖音、百度、知乎、微博、B站
 * 
 * 安装依赖: npm install axios cheerio iconv-lite
 * 
 * 使用方式:
 * 1. 直接运行: node hotTopicsSpider.js
 * 2. 定时任务: 使用 node-cron 或 systemd 定时执行
 * 
 * author: kris
 * date: 2025年11月25日
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
const db = require("../db.js");

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
 * 1. 爬取百度热搜
 */
async function crawlBaiduTrending() {
	try {
		console.log("🔍 正在爬取百度热搜...");
		const url = "https://top.baidu.com/board?tab=realtime";

		const response = await axios.get(url, {
			timeout: 12000,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
				"Accept-Language": "zh-CN,zh;q=0.9",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				"Referer": "https://www.baidu.com/"
			}
		});

		if (response.status !== 200) {
			console.warn(`⚠️  百度返回 HTTP ${response.status}`);
			return [];
		}

		const $ = cheerio.load(response.data);
		const topics = [];

		// 从表格中提取热搜数据
		$('tbody tr').each((index, element) => {
			if (topics.length >= 15) return;

			const cells = $(element).find('td');
			if (cells.length >= 2) {
				const rankText = $(cells[0]).text().trim();
				const titleText = $(cells[1]).text().trim();
				const heatText = $(cells[2]).text().trim();

				if (titleText && titleText.length > 2 && titleText.length < 100) {
					topics.push({
						platform: "baidu",
						rank: parseInt(rankText) || topics.length + 1,
						title: titleText,
						category: "热搜",
						heat: parseInt(heatText) || (100 - topics.length) * 100000,
						trend: "stable",
						tags: ["百度", "热搜"],
						url: `https://www.baidu.com/s?wd=${encodeURIComponent(titleText)}`,
						description: titleText,
						is_active: 1
					});
				}
			}
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
 * 2. 爬取知乎热榜 - 使用 Puppeteer + Cheerio
 */
async function crawlZhihuTrending() {
	let browser;
	try {
		console.log("🔍 正在爬取知乎热榜（Puppeteer 模式）...");
		
		// 动态导入 puppeteer（只在需要时导入）
		const puppeteer = require('puppeteer');
		
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
		
		// 隐藏 webdriver 标记
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
		});
		
		console.log("   📄 访问知乎热榜页面...");
		try {
			await page.goto('https://www.zhihu.com/hot', {
				waitUntil: 'domcontentloaded',
				timeout: 45000
			});
		} catch (navErr) {
			console.log("   ⏱️  页面加载超时，继续尝试...");
		}
		
		console.log("   ⏳ 等待页面渲染...");
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		const html = await page.content();
		console.log(`   ✅ 获取 HTML: ${(html.length / 1024).toFixed(2)} KB`);
		
		const $ = cheerio.load(html);
		const topics = [];
		
		// 通过问题链接提取热榜
		$('a[href*="/question/"]').each((index, element) => {
			if (topics.length >= 15) return;
			
			const $link = $(element);
			let title = $link.text().trim();
			
			if (title && title.length > 2 && title.length < 200 && !title.includes('https')) {
				// 避免重复
				if (!topics.find(t => t.title === title)) {
					topics.push({
						platform: "zhihu",
						rank: topics.length + 1,
						title: title,
						category: "热榜",
						heat: (100 - topics.length) * 50000,
						trend: "stable",
						tags: ["知乎", "热榜"],
						url: $link.attr('href') || 'https://www.zhihu.com/hot',
						description: title,
						is_active: 1
					});
				}
			}
		});
		
		await browser.close();
		
		if (topics.length > 0) {
			console.log(`✅ 知乎热榜爬取成功: ${topics.length} 条`);
			return topics;
		}
		
		console.warn("⚠️  知乎暂无数据");
		return [];

	} catch (error) {
		if (browser) {
			try {
				await browser.close();
			} catch (e) {}
		}
		console.error("❌ 知乎热榜爬取失败:", error.message);
		return [];
	}
}

/**
 * 3. 爬取微博热搜 - 使用 Puppeteer + Cheerio
 */
async function crawlWeiboTrending() {
	let browser;
	try {
		console.log("✨ 正在爬取微博热搜（Puppeteer 模式）...");
		const puppeteer = require('puppeteer');
		
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
						rank: rankText || topics.length + 1,
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
		console.error("❌ 微博热搜爬取失败:", error.message);
		return [];
	}
}

/**
 * 4. 爬取B站热门
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
 * 5. 爬取抖音热点
 */
async function crawlDouyinTrending() {
	try {
		console.log("▶ 正在爬取抖音热点...");
		
		// 抖音防爬虫过于强大，使用 Axios + Cheerio 无法获取 JavaScript 渲染内容
		// Puppeteer 会被检测到自动化特征
		// 因此采用 "缓存 + 备用数据源" 策略
		
		const fs = require('fs');
		const path = require('path');
		const cacheFile = path.join(__dirname, '../../.cache/douyin_cache.json');
		
		// 确保缓存目录存在
		const cacheDir = path.dirname(cacheFile);
		if (!fs.existsSync(cacheDir)) {
			fs.mkdirSync(cacheDir, { recursive: true });
		}
		
		// 检查缓存是否存在且未过期（6小时）
		let cachedData = null;
		if (fs.existsSync(cacheFile)) {
			try {
				const cacheContent = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
				const cacheAge = Date.now() - cacheContent.timestamp;
				const sixHours = 6 * 60 * 60 * 1000;
				
				if (cacheAge < sixHours && cacheContent.data && cacheContent.data.length > 0) {
					console.log(`   ✅ 使用缓存数据 (${Math.round(cacheAge / 1000 / 60)} 分钟前)`);
					return cacheContent.data;
				}
			} catch (e) {
				console.log('   ℹ️  缓存文件损坏，重新爬取...');
			}
		}
		
		// 尝试从官方热榜 API（部分开放）
		try {
			console.log('   📄 尝试从热榜数据源...');
			const response = await axios.get('https://www.iesdouyin.com/web/api/v2/hotsearch/search/trending/', {
				timeout: 10000,
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
				}
			});
			
			if (response.data && Array.isArray(response.data)) {
				const topics = response.data.slice(0, 15).map((item, idx) => ({
					platform: "douyin",
					rank: idx + 1,
					title: (item.keyword || item.title || item.name || '').substring(0, 100),
					category: "热点",
					heat: (100 - idx) * 80000,
					trend: "stable",
					tags: ["抖音", "热点"],
					url: "https://www.douyin.com",
					description: (item.keyword || item.title || item.name || '').substring(0, 100),
					is_active: 1
				})).filter(t => t.title && t.title.length > 2);
				
				if (topics.length > 0) {
					// 保存到缓存
					fs.writeFileSync(cacheFile, JSON.stringify({
						timestamp: Date.now(),
						data: topics
					}), 'utf8');
					
					console.log(`✅ 抖音热点爬取成功: ${topics.length} 条`);
					return topics;
				}
			}
		} catch (apiErr) {
			console.log('   ℹ️  热榜 API 暂不可用');
		}
		
		// 若缓存过期且无法获取新数据，返回过期缓存
		if (fs.existsSync(cacheFile)) {
			try {
				const fallback = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
				if (fallback.data && fallback.data.length > 0) {
					console.log('   ⚠️  返回过期缓存数据');
					return fallback.data;
				}
			} catch (e) {}
		}
		
		// 最后兜底：返回模拟热点（不是真实数据，但保证服务可用）
		const fallbackTopics = [
			{ rank: 1, title: "抖音热搜加载中...", category: "热点" },
			{ rank: 2, title: "请稍候", category: "热点" }
		].map((item, idx) => ({
			platform: "douyin",
			rank: item.rank,
			title: item.title,
			category: item.category,
			heat: (100 - idx) * 80000,
			trend: "stable",
			tags: ["抖音", "热点"],
			url: "https://www.douyin.com",
			description: item.title,
			is_active: 1
		}));
		
		console.warn("⚠️  抖音暂无数据（反爬虫限制）");
		return fallbackTopics;

	} catch (error) {
		console.error("❌ 抖音热点爬取失败:", error.message);
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
		{ name: "知乎", fn: crawlZhihuTrending },
		{ name: "微博", fn: crawlWeiboTrending },
		{ name: "B站", fn: crawlBilibiliTrending },
		{ name: "抖音", fn: crawlDouyinTrending }
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
	crawlZhihuTrending,
	crawlWeiboTrending,
	crawlBilibiliTrending,
	crawlDouyinTrending,
	saveTopicsToDatabase
};
