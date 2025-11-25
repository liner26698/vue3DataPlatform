/**
 * 看书猴爬虫模块 - 内容聚合爬虫
 * 网址: https://www.kanshuhou.com/
 * 此模块用于爬取看书猴的分类导航和小说数据
 */

const axios = require("axios");
const cheerio = require("cheerio");
const crawlerConfig = require("../config/crawlerConfig.js");

// 缓存系统
const cache = new Map();
const CACHE_TIME = crawlerConfig.cache.ttl; // 24小时缓存

// 请求配置
const axiosInstance = axios.create({
	timeout: 5000,
	headers: {
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
	}
});

// 请求延迟 - 礼貌爬虫
let lastRequestTime = 0;
async function delayRequest() {
	const now = Date.now();
	const timeSinceLastRequest = now - lastRequestTime;
	if (timeSinceLastRequest < 500) {
		await new Promise(resolve => setTimeout(resolve, 500 - timeSinceLastRequest));
	}
	lastRequestTime = Date.now();
}

// 带重试的请求函数
async function fetchWithRetry(url, maxRetries = 3) {
	let lastError;
	for (let i = 0; i < maxRetries; i++) {
		try {
			await delayRequest();
			console.log(`[看书猴爬虫] 请求 (尝试 ${i + 1}/${maxRetries}): ${url}`);
			const response = await axiosInstance.get(url);
			return response;
		} catch (error) {
			lastError = error;
			console.warn(`[看书猴爬虫] 第 ${i + 1} 次尝试失败: ${error.message}`);
			if (i < maxRetries - 1) {
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}
	}
	throw lastError;
}

/**
 * 获取所有分类
 * @returns {Promise<Array>} 分类列表
 */
async function getCategories() {
	try {
		console.log("[看书猴爬虫] 获取分类列表");
		
		// 检查缓存
		const cacheKey = "categories";
		if (cache.has(cacheKey)) {
			const cached = cache.get(cacheKey);
			if (Date.now() - cached.time < CACHE_TIME) {
				console.log("[看书猴爬虫] 使用缓存分类列表");
				return cached.data;
			}
		}

		const response = await fetchWithRetry("https://www.kanshuhou.com/");
		const $ = cheerio.load(response.data);

		const categories = [];
		
		// 解析导航栏中的分类
		$(".nav li a").each((index, element) => {
			const href = $(element).attr("href");
			const text = $(element).text().trim();
			
			// 过滤出分类链接 (形如 /sort/1/1/)
			if (href && href.match(/^\/sort\/\d+\/1\/$/)) {
				const categoryId = href.match(/\/sort\/(\d+)\//)[1];
				categories.push({
					id: categoryId,
					name: text,
					href: href
				});
			}
		});

		// 缓存结果
		cache.set(cacheKey, {
			data: categories,
			time: Date.now()
		});

		console.log(`[看书猴爬虫] 获取到 ${categories.length} 个分类`);
		return categories;
	} catch (error) {
		console.error("[看书猴爬虫] 获取分类失败:", error.message);
		return [];
	}
}

/**
 * 获取指定分类的小说列表
 * @param {string|number} categoryId 分类ID (如: 1, 2, 3...)
 * @param {number} page 页码 (默认1)
 * @returns {Promise<Array>} 小说列表
 */
async function getNovelsByCategory(categoryId, page = 1) {
	try {
		if (!categoryId) {
			console.log("[看书猴爬虫] 没有提供分类ID");
			return [];
		}

		console.log(`[看书猴爬虫] 获取分类 ${categoryId} 的小说列表 (第${page}页)`);

		// 检查缓存
		const cacheKey = `category_${categoryId}_page_${page}`;
		if (cache.has(cacheKey)) {
			const cached = cache.get(cacheKey);
			if (Date.now() - cached.time < CACHE_TIME) {
				console.log(`[看书猴爬虫] 使用缓存分类小说列表`);
				return cached.data;
			}
		}

		// 构建URL
		const url = `https://www.kanshuhou.com/sort/${categoryId}/${page}/`;
		const response = await fetchWithRetry(url);
		const $ = cheerio.load(response.data);

		const novels = [];
		
		// 解析小说列表
		$(".item").each((index, element) => {
			const $item = $(element);
			
			// 获取小说信息
			const href = $item.find("a").first().attr("href");
			const title = $item.find("dt a").first().text().trim();
			const author = $item.find("dt span").first().text().trim();
			const description = $item.find("dd a").first().text().trim();
			const img = $item.find("img").attr("src");

			if (href && title) {
				const novelId = href.replace(/[^0-9]/g, "") || `novel_${Date.now()}`;
				const novel = {
					Id: novelId,
					Name: title,
					Author: author || "作者不详",
					Desc: description || "暂无描述",
					Img: img || "https://via.placeholder.com/150x200",
					href: href,
					Source: "kanshuhou",
					categoryId: categoryId
				};
				
				novels.push(novel);
			}
		});

		// 缓存结果
		cache.set(cacheKey, {
			data: novels,
			time: Date.now()
		});

		console.log(`[看书猴爬虫] 获取到 ${novels.length} 部小说`);
		return novels;
	} catch (error) {
		console.error("[看书猴爬虫] 获取分类小说失败:", error.message);
		return [];
	}
}

/**
 * 获取小说详情页
 * @param {string} novelHref 小说页面链接
 * @returns {Promise<Object>} 小说详情
 */
async function getNovelDetail(novelHref) {
	try {
		if (!novelHref) {
			return { title: "获取失败", content: "没有提供小说链接" };
		}

		console.log(`[看书猴爬虫] 获取小说详情: ${novelHref}`);

		// 检查缓存
		const cacheKey = `detail_${novelHref}`;
		if (cache.has(cacheKey)) {
			const cached = cache.get(cacheKey);
			if (Date.now() - cached.time < CACHE_TIME) {
				console.log(`[看书猴爬虫] 使用缓存小说详情`);
				return cached.data;
			}
		}

		// 确保URL完整
		let url = novelHref;
		if (!url.startsWith("http")) {
			url = "https://www.kanshuhou.com" + url;
		}

		const response = await fetchWithRetry(url);
		const $ = cheerio.load(response.data);

		// 获取小说标题
		const title = $("h1").first().text().trim() || $(".title").first().text().trim() || "未知小说";
		
		// 获取小说描述
		let description = $(".description").first().text() || 
		                 $(".intro").first().text() || 
		                 $(".summary").first().text() || 
		                 "";
		
		// 清理文本
		description = description
			.replace(/<[^>]+>/g, "")
			.replace(/&nbsp;/g, " ")
			.trim();

		const result = {
			title: title,
			content: description
		};

		// 缓存结果
		cache.set(cacheKey, {
			data: result,
			time: Date.now()
		});

		console.log(`[看书猴爬虫] 小说详情获取成功`);
		return result;
	} catch (error) {
		console.error("[看书猴爬虫] 获取小说详情失败:", error.message);
		return {
			title: "获取失败",
			content: `抱歉，获取小说详情时出错: ${error.message}`
		};
	}
}

/**
 * 获取小说章节列表
 * @param {string} novelHref 小说页面链接
 * @returns {Promise<Array>} 章节列表
 */
async function getNovelChapters(novelHref, page = 1) {
	try {
		if (!novelHref) {
			console.log("[看书猴爬虫] 没有提供小说链接");
			return [];
		}

		console.log(`[看书猴爬虫] 获取章节列表: ${novelHref} (第${page}页)`);

		// 检查缓存
		const cacheKey = `chapters_${novelHref}_page_${page}`;
		if (cache.has(cacheKey)) {
			const cached = cache.get(cacheKey);
			if (Date.now() - cached.time < CACHE_TIME) {
				console.log(`[看书猴爬虫] 使用缓存章节列表`);
				return cached.data;
			}
		}

		// 确保URL完整
		let url = novelHref;
		if (!url.startsWith("http")) {
			url = "https://www.kanshuhou.com" + url;
		}
		
		// 如果有页码参数，添加到URL
		if (page > 1 && !url.includes("?")) {
			url = url + `?page=${page}`;
		}

		const response = await fetchWithRetry(url);
		const $ = cheerio.load(response.data);

		const chapters = [];
		
		// 解析章节列表 - 支持多种选择器
		// 首先尝试看书猴的正确选择器: li a[href*='/read/']
		$("li a[href*='/read/']").each((index, element) => {
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
		
		// 如果上面的选择器没有找到，尝试另一种选择器
		if (chapters.length === 0) {
			$("a[href*='/chapter/']").each((index, element) => {
				const $link = $(element);
				const chapterName = $link.text().trim();
				const chapterHref = $link.attr("href");

				if (chapterName && chapterHref && chapterHref.includes("/")) {
					chapters.push({
						chapterId: index + 1,
						chapterName: chapterName,
						href: chapterHref
					});
				}
			});
		}

		// 缓存结果
		cache.set(cacheKey, {
			data: chapters,
			time: Date.now()
		});

		console.log(`[看书猴爬虫] 获取到 ${chapters.length} 个章节`);
		return chapters;
	} catch (error) {
		console.error("[看书猴爬虫] 获取章节列表失败:", error.message);
		return [];
	}
}

/**
 * 清空缓存
 */
function clearCache() {
	cache.clear();
	console.log("[看书猴爬虫] 缓存已清空");
}

/**
 * 按关键词搜索小说 (跨分类)
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码 (默认1)
 * @returns {Promise<object>} 包含搜索结果的对象
 */
async function getNovelsByKeyword(keyword, page = 1) {
	if (!keyword || keyword.trim() === "") {
		return { novels: [], total: 0 };
	}

	const cacheKey = `search_${keyword}_${page}`;
	const cached = cache.get(cacheKey);
	
	if (cached && Date.now() - cached.time < 2 * 60 * 60 * 1000) { // 2小时缓存
		console.log(`[看书猴爬虫] 搜索缓存命中: ${keyword}`);
		return { novels: cached.data, total: cached.data.length };
	}

	try {
		console.log(`[看书猴爬虫] 开始搜索关键词: ${keyword}`);
		
		// 获取分类列表
		const categories = await getCategories();
		if (!categories || categories.length === 0) {
			console.warn("[看书猴爬虫] 无法获取分类列表");
			return { novels: [], total: 0 };
		}

		let allNovels = [];
		
		// 搜索前3个分类以加快速度
		for (let i = 0; i < Math.min(3, categories.length); i++) {
			const category = categories[i];
			console.log(`[看书猴爬虫] 在分类 "${category.name}" 中搜索...`);
			
			try {
				const result = await getNovelsByCategory(category.id, 1);
				if (result.novels) {
					// 过滤匹配关键词的小说
					const matched = result.novels.filter(novel =>
						novel.Name.includes(keyword) || 
						(novel.Author && novel.Author.includes(keyword))
					);
					
					// 添加分类信息
					matched.forEach(novel => {
						novel.categoryName = category.name;
					});
					
					allNovels = allNovels.concat(matched);
				}
			} catch (err) {
				console.warn(`[看书猴爬虫] 分类搜索失败 (${category.name}): ${err.message}`);
			}
			
			await delayRequest(); // 请求间隔
		}

		// 缓存结果
		cache.set(cacheKey, {
			data: allNovels,
			time: Date.now()
		});

		console.log(`[看书猴爬虫] 搜索完成，找到 ${allNovels.length} 本小说`);
		return { novels: allNovels, total: allNovels.length };
		
	} catch (error) {
		console.error("[看书猴爬虫] 搜索失败:", error.message);
		return { novels: [], total: 0 };
	}
}

/**
 * 获取章节内容
 * @param {string} chapterHref - 章节链接 (如: /read/24170520780/24525900251.html)
 * @returns {Promise<object>} {title, content}
 */
async function getChapterContent(chapterHref) {
	try {
		if (!chapterHref) {
			console.log("[看书猴爬虫] 没有提供章节链接");
			return { title: "", content: "" };
		}

		console.log(`[看书猴爬虫] 获取章节内容: ${chapterHref}`);

		// 检查缓存
		const cacheKey = `content_${chapterHref}`;
		if (cache.has(cacheKey)) {
			const cached = cache.get(cacheKey);
			if (Date.now() - cached.time < 24 * 60 * 60 * 1000) { // 24小时缓存
				console.log(`[看书猴爬虫] 使用缓存章节内容`);
				return cached.data;
			}
		}

		// 构建完整URL
		let url = chapterHref;
		if (!url.startsWith("http")) {
			url = "https://www.kanshuhou.com" + url;
		}

		const response = await fetchWithRetry(url);
		const $ = cheerio.load(response.data);

		// 获取章节标题
		let title = $(".title").text().trim() || 
		           $("h1").text().trim() || 
		           $(".article-title").text().trim() || 
		           "章节";

		// 获取章节内容 - 尝试多个选择器
		let content = "";
		
		// 方法1: 常见的内容容器
		const contentDiv = $(".content") || $(".article-content") || $("#content");
		if (contentDiv && contentDiv.length > 0) {
			content = contentDiv.html() || "";
		}

		// 方法2: 如果失败，尝试获取所有段落
		if (!content || content.trim().length < 50) {
			let paragraphs = [];
			$(".content p, article p, .article-content p").each((i, elem) => {
				const text = $(elem).text().trim();
				if (text && text.length > 0) {
					paragraphs.push(text);
				}
			});
			content = paragraphs.join("\n\n");
		}

		// 方法3: 最后手段，尝试body内所有段落
		if (!content || content.trim().length < 50) {
			let paragraphs = [];
			$("body p").each((i, elem) => {
				const text = $(elem).text().trim();
				// 过滤掉太短或明显是菜单的文本
				if (text && text.length > 10 && !text.includes("章节") && !text.includes("目录")) {
					paragraphs.push(text);
				}
			});
			// 只取前30个段落，避免获取过多无关内容
			content = paragraphs.slice(0, 30).join("\n\n");
		}

		// 清理HTML标签和多余空格
		content = content
			.replace(/<[^>]+>/g, "") // 移除HTML标签
			.replace(/&nbsp;/g, " ")  // 替换不换行空格
			.replace(/&quot;/g, '"')  // 替换引号
			.replace(/&amp;/g, "&")   // 替换&符号
			.trim();

		// 如果内容仍然太短，记录警告
		if (content.length < 100) {
			console.warn(`[看书猴爬虫] 章节内容过短 (${content.length}字)，可能解析失败`);
		}

		const result = { title, content };

		// 缓存结果
		cache.set(cacheKey, {
			data: result,
			time: Date.now()
		});

		console.log(`[看书猴爬虫] 成功获取章节内容 (${content.length}字)`);
		return result;

	} catch (error) {
		console.error("[看书猴爬虫] 获取章节内容失败:", error.message);
		return { title: "", content: "" };
	}
}

module.exports = {
	getCategories,
	getNovelsByCategory,
	getNovelDetail,
	getNovelChapters,
	getNovelsByKeyword,
	getChapterContent,
	clearCache
};
