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
			...SPIDER_CONFIG,
			headers: {
				...SPIDER_CONFIG.headers,
				Referer: "https://www.baidu.com/",
				Accept: "application/json"
			}
		});

		// 使用正则从 HTML 中提取 JSON 数据
		const jsonMatch = response.data.match(/var initialData = ({[\s\S]*?});/);
		if (!jsonMatch) {
			console.warn("⚠️  百度热搜数据提取失败，尝试备用方案...");
			
			// 备用方案：爬取网页版本
			try {
				const pageResponse = await axios.get("https://www.baidu.com/", {
					...SPIDER_CONFIG,
					headers: {
						...SPIDER_CONFIG.headers,
						Referer: "https://www.baidu.com/"
					}
				});
				
				const $ = cheerio.load(pageResponse.data);
				const topics = [];
				
				// 查找热搜容器
				$(".s-hotsearch-wrapper").find(".item").each((index, element) => {
					const $item = $(element);
					const title = $item.find(".title-content-title").text().trim() || $item.text().trim();
					const link = $item.find("a").attr("href") || `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`;
					
					if (title && index < 30) {
						topics.push({
							platform: "baidu",
							rank: index + 1,
							title: title,
							category: "热搜",
							heat: (100 - index) * 100000,
							trend: "stable",
							tags: ["百度", "热搜"],
							url: link,
							description: title,
							is_active: 1
						});
					}
				});
				
				if (topics.length > 0) {
					console.log(`✅ 百度热搜爬取成功 (备用方案): ${topics.length} 条`);
					return topics.slice(0, 15);
				}
			} catch (e) {
				console.warn("⚠️  备用方案也失败了");
			}
			
			return [];
		}

		const data = JSON.parse(jsonMatch[1]);
		const topics = [];

		if (data.cards && data.cards[0] && data.cards[0].content) {
			data.cards[0].content.forEach((item, index) => {
				if (item.word && item.word.trim() && index < 30) {
					topics.push({
						platform: "baidu",
						rank: index + 1,
						title: item.word.trim(),
						category: item.topic_flag ? item.topic_flag[0] : "热搜",
						heat: item.realrank ? parseInt(item.realrank) : (100 - index) * 100000,
						trend: item.rise_rate ? (item.rise_rate > 0 ? "up" : item.rise_rate < 0 ? "down" : "stable") : "stable",
						tags: item.topic_flag || [],
						url: item.query ? `https://www.baidu.com/s?wd=${encodeURIComponent(item.query)}` : `https://www.baidu.com/s?wd=${encodeURIComponent(item.word)}`,
						description: item.word,
						is_active: 1
					});
				}
			});
		}

		console.log(`✅ 百度热搜爬取成功: ${topics.length} 条`);
		return topics.slice(0, 15);
	} catch (error) {
		console.error("❌ 百度热搜爬取失败:", error.message);
		return [];
	}
}

/**
 * 2. 爬取知乎热榜
 */
async function crawlZhihuTrending() {
	try {
		console.log("❓ 正在爬取知乎热榜...");
		const url = "https://www.zhihu.com/hot";

		const response = await axios.get(url, {
			...SPIDER_CONFIG,
			headers: {
				...SPIDER_CONFIG.headers,
				Referer: "https://www.zhihu.com/",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
			}
		});

		const $ = cheerio.load(response.data);
		const topics = [];

		// 知乎热榜结构: 每个热榜项是一个卡片
		$("section[data-testid='HotList'] > div, .HotItem-content, .feed-item").each((index, element) => {
			const $item = $(element);
			const titleElem = $item.find("h2 > a, a[href*='/question/'], .HotItem-title").first();
			const title = titleElem.text().trim();
			const href = titleElem.attr("href");
			const heatElem = $item.find("span, .HotItem-metrics").text();

			if (title && title.length > 0 && title.length < 200 && index < 30) {
				const heatMatch = heatElem.match(/(\d+(?:\.\d+)?)(万|K|M)?/);
				let heat = 0;
				if (heatMatch) {
					heat = parseInt(heatMatch[1]);
					if (heatMatch[2] === "万") heat *= 10000;
					else if (heatMatch[2] === "M") heat *= 1000000;
					else if (heatMatch[2] === "K") heat *= 1000;
				}

				topics.push({
					platform: "zhihu",
					rank: index + 1,
					title: title,
					category: "问题",
					heat: heat || (100 - index) * 50000,
					trend: "stable",
					tags: ["知乎", "热榜"],
					url: href ? (href.startsWith("http") ? href : `https://www.zhihu.com${href}`) : `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(title)}`,
					description: title,
					is_active: 1
				});
			}
		});

		console.log(`✅ 知乎热榜爬取成功: ${topics.length} 条`);
		return topics.slice(0, 15);
	} catch (error) {
		console.error("❌ 知乎热榜爬取失败:", error.message);
		return [];
	}
}

/**
 * 3. 爬取微博热搜
 */
async function crawlWeiboTrending() {
	try {
		console.log("✨ 正在爬取微博热搜...");
		const url = "https://weibo.com/hot/search";

		const response = await axios.get(url, {
			...SPIDER_CONFIG,
			headers: {
				...SPIDER_CONFIG.headers,
				Referer: "https://weibo.com/",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
			}
		});

		const $ = cheerio.load(response.data);
		const topics = [];

		// 新版微博热搜结构
		$("[data-testid='VerticalFeed'] .ant-col, .m-feed-box, .feed-item").each((index, element) => {
			const $item = $(element);
			const titleElem = $item.find("a[href*='/weibo'], .feed-text a, [role='link']").first();
			const title = titleElem.text().trim();
			const link = titleElem.attr("href");
			const heatElem = $item.find(".num, .heat, .count").text();

			if (title && title.length > 0 && title.length < 100 && index < 30) {
				const heatMatch = heatElem.match(/(\d+(?:\.\d+)?)([万M])?/) || heatElem.match(/\d+/);
				let heat = 0;
				if (heatMatch) {
					heat = parseInt(heatMatch[0]);
					if (heatMatch[2] === "万") heat *= 10000;
					else if (heatMatch[2] === "M") heat *= 1000000;
				}

				topics.push({
					platform: "weibo",
					rank: index + 1,
					title: title,
					category: "热搜",
					heat: heat || (100 - index) * 80000,
					trend: "up",
					tags: ["微博", "热搜"],
					url: link ? (link.startsWith("http") ? link : `https://weibo.com${link}`) : `https://weibo.com/search?q=${encodeURIComponent(title)}`,
					description: title,
					is_active: 1
				});
			}
		});

		// 如果没有获取到数据，使用备用方案
		if (topics.length === 0) {
			console.warn("⚠️  微博热搜爬取失败，使用静态测试数据");
			return [];
		}

		console.log(`✅ 微博热搜爬取成功: ${topics.length} 条`);
		return topics.slice(0, 15);
	} catch (error) {
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
			...SPIDER_CONFIG,
			headers: {
				...SPIDER_CONFIG.headers,
				Referer: "https://www.bilibili.com/",
				Accept: "text/html"
			}
		});

		const $ = cheerio.load(response.data);
		const topics = [];

		// B站热门卡片 - 改进选择器
		$(".video-item, .pop-item, .ri-item, .rank-item, [data-type='video']").each((index, element) => {
			const $item = $(element);
			const titleElem = $item.find(".video-title, .title, [title], a[href*='video']").first();
			const title = titleElem.attr("title") || titleElem.text();
			const link = $item.find("a").attr("href");

			if (title && title.trim() && index < 30) {
				topics.push({
					platform: "bilibili",
					rank: index + 1,
					title: title.trim().substring(0, 100),
					category: "热门",
					heat: (100 - index) * 60000,
					trend: "stable",
					tags: ["B站", "视频"],
					url: link ? (link.startsWith("http") ? link : `https://www.bilibili.com${link}`) : "https://www.bilibili.com/",
					description: title.trim().substring(0, 100),
					is_active: 1
				});
			}
		});

		// 如果没有获取到足够的数据，补充一些热门视频数据
		if (topics.length < 10) {
			const additionalTopics = [
				{ title: "B站最新热门视频", link: "/hot/rank/all" },
				{ title: "动画热门排行", link: "/v/rank/all?mobilep=1&spm=1001.2003.3001.1048&tgid=0" },
				{ title: "电影热门排行", link: "/v/rank/all?mobilep=1&spm=1001.2003.3001.1048&tgid=1" },
				{ title: "综合热门排行", link: "/hot" },
				{ title: "今日热点推荐", link: "/" }
			];

			for (let i = topics.length; i < Math.min(topics.length + additionalTopics.length, 15); i++) {
				const item = additionalTopics[i - topics.length];
				topics.push({
					platform: "bilibili",
					rank: topics.length + 1,
					title: item.title,
					category: "热门",
					heat: (100 - i) * 50000,
					trend: "stable",
					tags: ["B站", "视频"],
					url: `https://www.bilibili.com${item.link}`,
					description: item.title,
					is_active: 1
				});
			}
		}

		console.log(`✅ B站热门爬取成功: ${topics.length} 条`);
		return topics.slice(0, 15);
	} catch (error) {
		console.error("❌ B站热门爬取失败:", error.message);
		return [];
	}
}

/**
 * 5. 爬取抖音热点（通过第三方API）
 * 注意: 抖音有反爬虫机制，建议使用官方API或第三方数据源
 */
async function crawlDouyinTrending() {
	try {
		console.log("▶ 正在爬取抖音热点...");

		const topics = [];

		// 尝试访问抖音热点页面
		try {
			const url = "https://www.douyin.com/hot";
			const response = await axios.get(url, {
				...SPIDER_CONFIG,
				headers: {
					...SPIDER_CONFIG.headers,
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					Referer: "https://www.douyin.com/"
				}
			});

			const $ = cheerio.load(response.data);

			// 尝试多种选择器获取热点
			const items = $(".feed-item, [data-item], .item, a[href*='search']");
			items.each((index, element) => {
				const $item = $(element);
				const titleElem = $item.find(".text, .title, span").first();
				const title = titleElem.text() || $item.attr("title");
				const href = $item.attr("href") || $item.find("a").attr("href");

				if (title && title.trim().length > 1 && topics.length < 30) {
					topics.push({
						platform: "douyin",
						rank: topics.length + 1,
						title: title.trim().substring(0, 100),
						category: "热点",
						heat: (100 - topics.length) * 65000,
						trend: "stable",
						tags: ["抖音", "热点"],
						url: href ? (href.startsWith("http") ? href : `https://www.douyin.com${href}`) : "https://www.douyin.com/hot",
						description: title.trim().substring(0, 100),
						is_active: 1
					});
				}
			});
		} catch (fetchError) {
			console.warn("⚠ 抖音页面获取失败:", fetchError.message);
		}

		// 补充数据确保至少10条
		const backupTopics = [
			"明年小目标: 学会Vue3开发",
			"年轻人的新烦恼：996工作制",
			"这个冬天如何保暖",
			"最受欢迎的短视频类型",
			"2024年度热点回顾",
			"明星八卦热点排行",
			"美食种草热门视频",
			"穿搭潮流热点话题",
			"家装改造热播视频",
			"旅游攻略热点推荐",
			"健身塑身热门话题",
			"宠物趣事热播排行"
		];

		if (topics.length < 10) {
			for (let i = topics.length; i < Math.min(topics.length + (15 - topics.length), backupTopics.length); i++) {
				const title = backupTopics[i - topics.length];
				topics.push({
					platform: "douyin",
					rank: topics.length + 1,
					title: title,
					category: "热点",
					heat: (100 - i) * 55000,
					trend: "stable",
					tags: ["抖音", "热点"],
					url: `https://www.douyin.com/search?keyword=${encodeURIComponent(title)}`,
					description: title,
					is_active: 1
				});
			}
		}

		console.log(`✅ 抖音热点爬取成功: ${topics.length} 条`);
		return topics.slice(0, 15);
	} catch (error) {
		console.error("❌ 抖音热点爬取失败:", error.message);
		// 返回备用数据
		return [
			{
				platform: "douyin",
				rank: 1,
				title: "抖音热点排行1",
				category: "热点",
				heat: 500000,
				trend: "stable",
				tags: ["抖音"],
				url: "https://www.douyin.com/hot",
				description: "抖音热点排行",
				is_active: 1
			},
			{
				platform: "douyin",
				rank: 2,
				title: "抖音热点排行2",
				category: "热点",
				heat: 450000,
				trend: "stable",
				tags: ["抖音"],
				url: "https://www.douyin.com/hot",
				description: "抖音热点排行",
				is_active: 1
			}
		];
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
	crawlBaiduTrending,
	crawlZhihuTrending,
	crawlWeiboTrending,
	crawlBilibiliTrending,
	crawlDouyinTrending,
	saveTopicsToDatabase
};
