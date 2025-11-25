/**
 * 笔趣阁爬虫模块 - 获取真实小说数据
 * 网址: https://www.biquge.com.cn/
 * 此模块用于爬取真实的小说数据，包括小说列表、章节、内容等
 */

const axios = require("axios");
const cheerio = require("cheerio");
const novelDataManager = require("./novelDataManager.js");
const crawlerConfig = require("../config/crawlerConfig.js");

// 创建 axios 实例，支持代理
function createAxiosInstance() {
	const config = {
		timeout: crawlerConfig.sources.biquge.timeout,
		headers: crawlerConfig.sources.biquge.headers
	};

	// 如果启用代理，添加代理配置
	if (crawlerConfig.proxy.enabled && crawlerConfig.proxy.https) {
		config.httpsAgent = new (require('https').Agent)({
			rejectUnauthorized: false
		});
		config.httpAgent = new (require('http').Agent)();
		config.proxy = {
			protocol: crawlerConfig.proxy.https.split('://')[0],
			host: crawlerConfig.proxy.https.split('://')[1].split(':')[0],
			port: parseInt(crawlerConfig.proxy.https.split(':').pop())
		};
	}

	return axios.create(config);
}

const axiosInstance = createAxiosInstance();

// 缓存系统
const cache = new Map();
const CACHE_TIME = crawlerConfig.cache.ttl; // 24小时缓存

// 请求延迟 - 礼貌爬虫
let lastRequestTime = 0;
async function delayRequest() {
	const now = Date.now();
	const timeSinceLastRequest = now - lastRequestTime;
	if (timeSinceLastRequest < crawlerConfig.requestDelay) {
		await new Promise(resolve => setTimeout(resolve, crawlerConfig.requestDelay - timeSinceLastRequest));
	}
	lastRequestTime = Date.now();
}

// 带重试的请求函数
async function fetchWithRetry(url, maxRetries = crawlerConfig.retry.maxRetries) {
	let lastError;
	for (let i = 0; i < maxRetries; i++) {
		try {
			await delayRequest();
			console.log(`[爬虫] 请求 (尝试 ${i + 1}/${maxRetries}): ${url}`);
			const response = await axiosInstance.get(url);
			return response;
		} catch (error) {
			lastError = error;
			console.warn(`[爬虫] 第 ${i + 1} 次尝试失败: ${error.message}`);
			if (i < maxRetries - 1) {
				await new Promise(resolve => setTimeout(resolve, crawlerConfig.retry.retryDelay));
			}
		}
	}
	throw lastError;
}

/**
 * 搜索小说 - 从笔趣阁搜索
 * @param {string} keyword 搜索关键词
 * @returns {Promise<Array>} 小说列表
 */
async function searchNovels(keyword) {
	try {
		if (!keyword || keyword.trim() === "") {
			return [];
		}

		console.log(`[爬虫] 搜索小说: ${keyword}`);
		
		// 检查缓存
		const cacheKey = `search_${keyword}`;
		if (cache.has(cacheKey)) {
			const cached = cache.get(cacheKey);
			if (Date.now() - cached.time < CACHE_TIME) {
				console.log(`[爬虫] 使用缓存搜索结果: ${keyword}`);
				return cached.data;
			}
		}

		// 笔趣阁搜索URL
		const searchUrl = `${crawlerConfig.sources.biquge.baseUrl}${crawlerConfig.sources.biquge.searchUrl}${encodeURIComponent(keyword)}`;
		
		const response = await fetchWithRetry(searchUrl);
		const $ = cheerio.load(response.data);

		const novels = [];
		
		// 解析搜索结果
		$("tr").each((index, element) => {
			if (index === 0) return; // 跳过表头
			
			const $row = $(element);
			const nameElem = $row.find("td:nth-child(1) a");
			const authorElem = $row.find("td:nth-child(3)");
			const statusElem = $row.find("td:nth-child(4)");
			const chapterElem = $row.find("td:nth-child(2) a");

			const name = nameElem.text().trim();
			const href = nameElem.attr("href");
			const author = authorElem.text().trim();
			const status = statusElem.text().trim();
			const lastChapter = chapterElem.text().trim();

			if (name && href) {
				const novelId = href.replace(/[^0-9]/g, "") || `novel_${Date.now()}`;
				const novelObj = {
					Id: novelId,
					Name: name,
					Author: author || "未知作者",
					CName: "网络文学",
					BookStatus: status || "更新中",
					LastChapter: lastChapter || "暂无",
					Desc: `《${name}》 - ${author || "未知作者"}`,
					Img: "https://via.placeholder.com/150x200?text=" + encodeURIComponent(name),
					href: href,
					Source: "biquge"
				};
				
				// 保存小说信息到数据管理器
				novelDataManager.saveNovel(novelId, novelObj);
				
				novels.push(novelObj);
			}
		});

		// 缓存结果
		cache.set(cacheKey, {
			data: novels,
			time: Date.now()
		});

		console.log(`[爬虫] 找到 ${novels.length} 部小说`);
		return novels;
	} catch (error) {
		console.error("[爬虫] 搜索失败:", error.message);
		// 网络错误时返回空数组，让API降级到本地数据
		return [];
	}
}

/**
 * 获取小说章节列表
 * @param {string} novelHref 小说页面链接
 * @returns {Promise<Array>} 章节列表
 */
async function fetchChapters(novelHref) {
	try {
		if (!novelHref) {
			console.log("[爬虫] 没有提供小说链接");
			return [];
		}

		console.log(`[爬虫] 获取章节列表: ${novelHref}`);

		// 检查缓存
		const cacheKey = `chapters_${novelHref}`;
		if (cache.has(cacheKey)) {
			const cached = cache.get(cacheKey);
			if (Date.now() - cached.time < CACHE_TIME) {
				console.log(`[爬虫] 使用缓存章节列表`);
				return cached.data;
			}
		}

		// 确保URL完整
		let url = novelHref;
		if (!url.startsWith("http")) {
			url = "https://www.biquge.com.cn" + url;
		}

		const response = await fetchWithRetry(url);
		const $ = cheerio.load(response.data);

		const chapters = [];
		
		// 解析章节列表
		$("#list dl dt:nth-of-type(3) ~ dd a").each((index, element) => {
			const $link = $(element);
			const chapterName = $link.text().trim();
			const chapterHref = $link.attr("href");

			if (chapterName && chapterHref) {
				chapters.push({
					chapterId: index + 1,
					chapterName: chapterName,
					href: chapterHref
				});
			}
		});

		// 缓存结果
		cache.set(cacheKey, {
			data: chapters,
			time: Date.now()
		});

		console.log(`[爬虫] 获取到 ${chapters.length} 个章节`);
		return chapters;
	} catch (error) {
		console.error("[爬虫] 获取章节失败:", error.message);
		return [];
	}
}

/**
 * 获取章节内容
 * @param {string} chapterHref 章节页面链接
 * @returns {Promise<Object>} 章节内容
 */
async function fetchChapterContent(chapterHref) {
	try {
		if (!chapterHref) {
			return {
				title: "获取失败",
				content: "没有提供章节链接"
			};
		}

		console.log(`[爬虫] 获取章节内容: ${chapterHref}`);

		// 检查缓存
		const cacheKey = `content_${chapterHref}`;
		if (cache.has(cacheKey)) {
			const cached = cache.get(cacheKey);
			if (Date.now() - cached.time < CACHE_TIME) {
				console.log(`[爬虫] 使用缓存章节内容`);
				return cached.data;
			}
		}

		// 确保URL完整
		let url = chapterHref;
		if (!url.startsWith("http")) {
			url = "https://www.biquge.com.cn" + url;
		}

		const response = await fetchWithRetry(url);
		const $ = cheerio.load(response.data);

		// 获取章节标题
		const title = $(".bookname h1").text().trim() || $("h1").first().text().trim() || "未知章节";
		
		// 获取章节内容
		let content = $("#content").html() || $(".showtxt").html() || "";
		
		// 清理HTML标签，只保留文本和换行
		content = content
			.replace(/<br\/>/g, "\n")
			.replace(/<[^>]+>/g, "")
			.replace(/&nbsp;/g, " ")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.trim();

		// 如果内容为空，返回提示
		if (!content) {
			content = "抱歉，无法获取章节内容，请检查链接是否有效。";
		}

		const result = {
			title: title,
			content: content
		};

		// 缓存结果
		cache.set(cacheKey, {
			data: result,
			time: Date.now()
		});

		console.log(`[爬虫] 章节内容获取成功，长度: ${content.length} 字符`);
		return result;
	} catch (error) {
		console.error("[爬虫] 获取内容失败:", error.message);
		return {
			title: "获取失败",
			content: `抱歉，获取章节内容时出错: ${error.message}`
		};
	}
}

/**
 * 获取热门小说列表
 * @returns {Promise<Array>} 热门小说列表
 */
async function fetchHotNovels() {
	try {
		console.log("[爬虫] 获取热门小说");

		// 检查缓存
		const cacheKey = "hot_novels";
		if (cache.has(cacheKey)) {
			const cached = cache.get(cacheKey);
			if (Date.now() - cached.time < CACHE_TIME) {
				console.log("[爬虫] 使用缓存热门小说");
				return cached.data;
			}
		}

		const url = "https://www.biquge.com.cn/";
		
		const response = await fetchWithRetry(url);
		const $ = cheerio.load(response.data);

		const novels = [];
		
		// 解析热门小说
		$("div.booksort a").slice(0, 20).each((index, element) => {
			const $link = $(element);
			const name = $link.text().trim();
			const href = $link.attr("href");

			if (name && href && !name.includes("分类")) {
				novels.push({
					Name: name,
					href: href
				});
			}
		});

		// 缓存结果
		cache.set(cacheKey, {
			data: novels,
			time: Date.now()
		});

		console.log(`[爬虫] 获取到 ${novels.length} 部热门小说`);
		return novels;
	} catch (error) {
		console.error("[爬虫] 获取热门小说失败:", error.message);
		return [];
	}
}

/**
 * 清空缓存
 */
function clearCache() {
	cache.clear();
	console.log("[爬虫] 缓存已清空");
}

module.exports = {
	searchNovels,
	fetchChapters,
	fetchChapterContent,
	fetchHotNovels,
	clearCache
};
