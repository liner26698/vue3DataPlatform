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
if (typeof global.File === "undefined") {
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
 * 1. 爬取百度热搜 - 多策略组合（一劳永逸方案）
 * 策略优先级：URL特征 > 固定class选择器 > 模糊class匹配
 */
async function crawlBaiduTrending() {
	try {
		console.log("🔍 正在爬取百度热搜...");
		const url = "https://top.baidu.com/board?tab=realtime";

		const response = await axios.get(url, {
			timeout: 12000,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
				"Accept-Language": "zh-CN,zh;q=0.9",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				Referer: "https://www.baidu.com/"
			}
		});

		if (response.status !== 200) {
			console.warn(`⚠️  百度返回 HTTP ${response.status}`);
			throw new Error(`HTTP ${response.status}`);
		}

		const $ = cheerio.load(response.data);
		let topics = [];

		// 策略1: 通过URL特征查找（最稳定，百度热搜链接格式固定）
		console.log("   📌 策略1: 通过URL特征查找...");
		const seenTitles = new Set();
		$("a").each((index, element) => {
			if (topics.length >= 15) return;

			const $link = $(element);
			const href = $link.attr("href") || "";
			let title = $link.text().trim();

			// 百度热搜特征: https://www.baidu.com/s?wd=关键词
			if (href.includes("baidu.com/s?wd=") && title && title.length > 5 && title.length < 100) {
				// 清理标题中的多余字符（如"热"、"新"标签）
				title = title.replace(/^\s*(热|新|爆|沸)\s*/, "").trim();

				if (!seenTitles.has(title)) {
					seenTitles.add(title);
					topics.push({
						platform: "baidu",
						rank: topics.length + 1,
						title: title,
						category: "热搜",
						heat: (100 - topics.length) * 100000,
						trend: "stable",
						tags: ["百度", "热搜"],
						url: href,
						description: title,
						is_active: 1
					});
				}
			}
		});

		if (topics.length >= 15) {
			console.log(`✅ 百度热搜爬取成功（策略1-URL特征）: ${topics.length} 条`);
			return topics.slice(0, 15);
		}

		// 策略2: 通过固定class选择器（如果策略1失败）
		console.log("   📌 策略2: 通过固定class选择器...");
		topics = [];
		seenTitles.clear();

		$(".c-single-text-ellipsis").each((index, element) => {
			if (topics.length >= 15) return;

			const title = $(element).text().trim();
			const $parent = $(element).closest("a");
			const href = $parent.attr("href") || "";

			if (title && title.length > 5 && title.length < 100 && !seenTitles.has(title)) {
				seenTitles.add(title);
				topics.push({
					platform: "baidu",
					rank: topics.length + 1,
					title: title,
					category: "热搜",
					heat: (100 - topics.length) * 100000,
					trend: "stable",
					tags: ["百度", "热搜"],
					url: href || `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`,
					description: title,
					is_active: 1
				});
			}
		});

		if (topics.length >= 15) {
			console.log(`✅ 百度热搜爬取成功（策略2-固定class）: ${topics.length} 条`);
			return topics.slice(0, 15);
		}

		// 策略3: 通过模糊class匹配（最后的备用方案）
		console.log("   📌 策略3: 通过模糊class匹配...");
		topics = [];
		seenTitles.clear();

		$("[class*=content]").each((index, element) => {
			if (topics.length >= 15) return;

			const $content = $(element);
			let title = $content.find(".c-single-text-ellipsis").first().text().trim();

			if (!title) {
				title = $content.find("[class*=title]").first().text().trim();
			}
			if (!title) {
				const allText = $content.text().trim();
				title = allText.split("\n")[0].trim();
			}

			const link = $content.find("a").attr("href") || `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`;

			if (title && title.length > 5 && title.length < 100 && !seenTitles.has(title)) {
				seenTitles.add(title);
				topics.push({
					platform: "baidu",
					rank: topics.length + 1,
					title: title,
					category: "热搜",
					heat: (100 - topics.length) * 100000,
					trend: "stable",
					tags: ["百度", "热搜"],
					url: link,
					description: title,
					is_active: 1
				});
			}
		});

		if (topics.length > 0) {
			console.log(`✅ 百度热搜爬取成功（策略3-模糊匹配）: ${topics.length} 条`);
			return topics.slice(0, 15);
		}

		console.warn("⚠️  百度热搜未找到数据（所有策略均失败）");
		throw new Error("No data from Baidu");
	} catch (error) {
		console.error(`❌ 百度热搜爬取失败: ${error.message}`);
		throw error;
	}
}

/**
 * 2. 爬取今日头条热榜
 */
async function crawlToutiaoTrending() {
	try {
		console.log("📰 正在爬取今日头条热榜...");

		const response = await axios.get("https://www.toutiao.com/", {
			timeout: 10000,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "zh-CN,zh;q=0.9",
				Referer: "https://www.toutiao.com/"
			}
		});

		const $ = cheerio.load(response.data);
		const topics = [];
		const seenTitles = new Set();

		const selectors = ["a", "h3", "span", "div"];

		for (const selector of selectors) {
			$(selector).each((index, element) => {
				if (topics.length >= 15) return;

				const $el = $(element);
				let title = ($el.text() || $el.attr("title") || "").trim();
				title = title.replace(/\s+/g, " ").trim();

				if (title && title.length > 4 && title.length < 100 && !seenTitles.has(title)) {
					seenTitles.add(title);
					topics.push({
						platform: "toutiao",
						rank: topics.length + 1,
						title: title,
						category: "热榜",
						heat: (100 - topics.length) * 60000,
						trend: "stable",
						tags: ["头条", "热榜"],
						url: "https://www.toutiao.com",
						description: title,
						is_active: 1
					});
				}
			});
			if (topics.length >= 15) break;
		}

		if (topics.length > 0) {
			console.log(`✅ 头条热榜爬取成功: ${topics.length} 条`);
			return topics;
		}

		console.warn("⚠️  头条暂无数据");
		return [];
	} catch (error) {
		console.error("❌ 头条热榜爬取失败:", error.message);
		return [];
	}
}

/**
 * 3. 爬取微博热搜 - 智能降级方案（Cheerio优先，Puppeteer备用）
 */
async function crawlWeiboTrending() {
	// 策略1: 优先使用Cheerio（快速、轻量、不需要Chrome）
	try {
		console.log("🔥 正在爬取微博热搜（Cheerio 模式）...");
		const url = "https://s.weibo.com/top/summary";

		const response = await axios.get(url, {
			timeout: 12000,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
				"Accept-Language": "zh-CN,zh;q=0.9",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				Referer: "https://weibo.com/",
				Cookie: "SUB=_2AkMRPxXOf8NxqwFRmfwQyGzjZY92zwrEieKlZVSKJRMxHRl-yT-iQnW2tRB6OIa0b4QE33OjhfH4zRIe-qBE9-wTv8qL"
			}
		});

		if (response.status !== 200) {
			throw new Error(`HTTP ${response.status}`);
		}

		const $ = cheerio.load(response.data);
		const topics = [];

		// 从表格中提取热搜（跳过第一行表头）
		$("tr:not(:first-child)").each((index, element) => {
			if (topics.length >= 15) return;

			const $row = $(element);
			const $link = $row.find("a").first();
			const title = $link.text().trim();
			const href = $link.attr("href") || "";

			// 过滤掉javascript链接和过短/过长的标题
			if (title && title.length > 2 && title.length < 100 && !href.includes("javascript")) {
				topics.push({
					platform: "weibo",
					rank: topics.length + 1,
					title: title,
					category: "热搜",
					heat: (100 - topics.length) * 80000,
					trend: "stable",
					tags: ["微博", "热搜"],
					url: href.startsWith("http") ? href : `https://s.weibo.com${href}`,
					description: title,
					is_active: 1
				});
			}
		});

		if (topics.length > 0) {
			console.log(`✅ 微博热搜爬取成功（Cheerio模式）: ${topics.length} 条`);
			return topics;
		}

		throw new Error("Cheerio模式未获取到数据");
	} catch (cheerioError) {
		console.warn(`⚠️  Cheerio模式失败: ${cheerioError.message}`);

		// 策略2: 降级到Puppeteer（需要Chrome，但更稳定）
		let browser;
		try {
			console.log("   🔄 尝试降级到Puppeteer模式...");
			const puppeteer = require("puppeteer");

			browser = await puppeteer.launch({
				headless: "new",
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-blink-features=AutomationControlled",
					"--disable-dev-shm-usage"
				]
			});

			const page = await browser.newPage();
			await page.setViewport({ width: 1920, height: 1080 });
			await page.setUserAgent(
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
			);

			await page.goto("https://s.weibo.com/top/summary", {
				waitUntil: "domcontentloaded",
				timeout: 30000
			});

			await new Promise(resolve => setTimeout(resolve, 2000));

			const html = await page.content();
			await browser.close();

			const $ = cheerio.load(html);
			const topics = [];

			$("tr:not(:first-child)").each((index, element) => {
				if (topics.length >= 15) return;

				const $row = $(element);
				const $link = $row.find("a").first();
				const title = $link.text().trim();

				if (title && title.length > 2 && title.length < 100) {
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
			});

			if (topics.length > 0) {
				console.log(`✅ 微博热搜爬取成功（Puppeteer模式）: ${topics.length} 条`);
				return topics;
			}

			throw new Error("Puppeteer模式未获取到数据");
		} catch (puppeteerError) {
			if (browser) {
				try {
					await browser.close();
				} catch (e) {}
			}
			console.error(`❌ Puppeteer模式也失败: ${puppeteerError.message}`);
			console.error(`💡 提示: 如需使用Puppeteer，请在服务器运行: npx puppeteer browsers install chrome`);
			throw new Error(`微博爬取失败 - Cheerio: ${cheerioError.message}, Puppeteer: ${puppeteerError.message}`);
		}
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
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
				"Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				Referer: "https://www.bilibili.com/"
			}
		});

		const $ = cheerio.load(response.data);
		const topics = [];

		// B站热门视频 - 尝试多个选择器
		const selectors = ["h3 a, .title, [class*='title'] a, [title]", ".feed-item a", ".video-card a", "a[title]"];

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
						url: $item.attr("href")
							? ($item.attr("href").startsWith("http") ? "" : "https://www.bilibili.com") + $item.attr("href")
							: "https://www.bilibili.com",
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
/**
 * 5. 爬取小红书热榜
 */
async function crawlXiaohongshuTrending() {
	try {
		console.log("❤️  正在爬取小红书热榜...");

		const response = await axios.get("https://www.xiaohongshu.com/homefeed_recommend", {
			timeout: 10000,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "zh-CN,zh;q=0.9",
				Referer: "https://www.xiaohongshu.com/"
			}
		});

		const $ = cheerio.load(response.data);
		const topics = [];
		const seenTitles = new Set();

		const selectors = ["a", "h3", "span", "div"];

		for (const selector of selectors) {
			$(selector).each((index, element) => {
				if (topics.length >= 15) return;

				const $el = $(element);
				let title = ($el.text() || $el.attr("title") || "").trim();
				title = title.replace(/\s+/g, " ").trim();

				if (title && title.length > 4 && title.length < 100 && !seenTitles.has(title)) {
					seenTitles.add(title);
					topics.push({
						platform: "xiaohongshu",
						rank: topics.length + 1,
						title: title,
						category: "热榜",
						heat: (100 - topics.length) * 70000,
						trend: "stable",
						tags: ["小红书", "热榜"],
						url: "https://www.xiaohongshu.com",
						description: title,
						is_active: 1
					});
				}
			});
			if (topics.length >= 15) break;
		}

		if (topics.length > 0) {
			console.log(`✅ 小红书热榜爬取成功: ${topics.length} 条`);
			return topics;
		}

		console.warn("⚠️  小红书暂无数据");
		return [];
	} catch (error) {
		console.error("❌ 小红书热榜爬取失败:", error.message);
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
		// 清空前一天及更早的数据，只保留当天数据
		const deleteSql = `DELETE FROM hot_topics WHERE DATE(created_at) < CURDATE()`;
		const deleteResult = await db.query(deleteSql);
		if (deleteResult.affectedRows && deleteResult.affectedRows > 0) {
			console.log(`🗑️  已清空 ${deleteResult.affectedRows} 条前一天的热点数据`);
		}

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

			if (topics && topics.length > 0) {
				allTopics.push(...topics);
				await logCrawlerTask(platform.name.toLowerCase(), "success", topics.length, null, duration);
			}

			// 延迟以避免请求过于频繁
			await new Promise(resolve => setTimeout(resolve, 2000));
		} catch (error) {
			const duration = Date.now() - platformStartTime;
			console.error(`❌ ${platform.name}爬虫错误:`, error.message);
			await logCrawlerTask(platform.name.toLowerCase(), "failed", 0, error.message, duration);
			// 继续执行下一个平台，不中断整个流程
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
	fetchAllTrending: runAllSpiders, // 别名，用于 API 调用
	crawlBaiduTrending,
	crawlToutiaoTrending,
	crawlWeiboTrending,
	crawlBilibiliTrending,
	crawlXiaohongshuTrending,
	saveTopicsToDatabase
};
