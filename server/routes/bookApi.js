/**
 * 小说模块 API - 仅使用爬虫获取数据
 * 简化逻辑，移除所有本地数据生成
 * author: kris
 * date: 2025年11月24日
 */

const Router = require("koa-router");
const kanshuhouSpider = require("../utils/kanshuhouSpider");

const router = new Router();

// 辅助函数
function SUCCESS(ctx, success, message, data = null) {
	ctx.body = {
		code: 200,
		success,
		message,
		data
	};
}

function ERROR(ctx, message) {
	ctx.body = {
		code: 500,
		success: false,
		message
	};
}

function getCategoryHref(category) {
	const categoryMap = {
		"玄幻": "1",
		"言情": "2",
		"武侠": "3",
		"都市": "5"
	};
	return categoryMap[category];
}

async function getHomepageNovels() {
	const categories = ["1", "2", "3", "5"];
	let allNovels = [];

	for (const categoryId of categories) {
		try {
			const novels = await kanshuhouSpider.getNovelsByCategory(categoryId, 1);
			if (Array.isArray(novels) && novels.length > 0) {
				allNovels = allNovels.concat(novels);
			}
		} catch (err) {
			console.log(`[小说] 分类 ${categoryId} 获取失败:`, err.message);
		}
	}

	return allNovels;
}

async function searchNovels(keyword) {
	const categories = ["1", "2", "3", "5"];
	let allNovels = [];

	for (const categoryId of categories) {
		try {
			const novels = await kanshuhouSpider.getNovelsByCategory(categoryId, 1);
			const filtered = novels.filter(novel =>
				(novel.Name && novel.Name.includes(keyword)) ||
				(novel.Author && novel.Author.includes(keyword))
			);
			if (filtered.length > 0) {
				allNovels = allNovels.concat(filtered);
			}
		} catch (err) {
			console.log(`[小说] 搜索分类 ${categoryId} 失败`);
		}
	}

	return allNovels;
}

/**
 * 获取小说分类列表
 */
router.post("/bookMicroservices/book/getCategories", async (ctx) => {
	try {
		console.log("[小说] 获取分类列表");
		
		const categories = [
			{ id: "1", name: "玄幻", href: "/sort/1/1/" },
			{ id: "2", name: "言情", href: "/sort/2/1/" },
			{ id: "3", name: "武侠", href: "/sort/3/1/" },
			{ id: "5", name: "都市", href: "/sort/5/1/" }
		];
		
		SUCCESS(ctx, true, "成功", categories);
	} catch (error) {
		console.error("[小说] 分类获取失败:", error.message);
		ERROR(ctx, "获取分类失败");
	}
});

/**
 * 获取小说列表 - 聚合多个分类或搜索
 */
router.post("/bookMicroservices/book/getBookList", async (ctx) => {
	const { current = 1, pageSize = 20, category, searchText } = ctx.request.body;

	try {
		console.log(`[小说] 获取书单 - 分类: ${category}, 搜索: ${searchText}`);
		
		let novels = [];

		if (searchText && searchText.trim()) {
			// 搜索模式
			console.log("[小说] 执行搜索");
			novels = await searchNovels(searchText);
			console.log(`[小说] 搜索结果: ${novels.length} 部小说`);
		} else if (category && category !== "所有") {
			// 分类模式
			console.log(`[小说] 获取分类 ${category}`);
			const categoryId = getCategoryHref(category);
			console.log(`[小说] 分类ID: ${categoryId}`);
			if (categoryId) {
				novels = await kanshuhouSpider.getNovelsByCategory(categoryId, current);
				console.log(`[小说] 爬虫返回: ${novels ? novels.length : 0} 部小说`);
			}
		} else {
			// 首页推荐 - 聚合多个分类
			console.log("[小说] 获取首页推荐");
			novels = await getHomepageNovels();
			console.log(`[小说] 首页推荐: ${novels.length} 部小说`);
		}

		// 分页处理
		const total = novels.length;
		const start = (current - 1) * pageSize;
		const end = start + pageSize;
		const paginated = novels.slice(start, end);

		const data = {
			data: paginated,
			total: total,
			page: current,
			pageSize: pageSize
		};

		console.log(`[小说] 返回 ${paginated.length}/${total} 部小说`);
		SUCCESS(ctx, true, "成功", data);
	} catch (error) {
		console.error("[小说] 获取书单失败:", error.message);
		console.error("[小说] 错误堆栈:", error.stack);
		ERROR(ctx, error.message || "获取书单失败");
	}
});

/**
 * 获取章节列表
 */
router.post("/bookMicroservices/book/getChapters", async (ctx) => {
	const { bookId, novelHref } = ctx.request.body;

	if (!bookId) {
		ERROR(ctx, "参数错误");
		return;
	}

	try {
		console.log(`[小说] 获取章节 - bookId: ${bookId}`);
		
		let chapters = [];

		if (novelHref) {
			// 使用novelHref获取真实章节
			chapters = await kanshuhouSpider.getNovelChapters(novelHref, 1);
		}

		if (!chapters || chapters.length === 0) {
			console.log("[小说] 章节列表为空");
			ERROR(ctx, "无法获取章节列表");
			return;
		}

		// 规范化章节数据
		const normalizedChapters = chapters.map((ch, idx) => ({
			chapterId: ch.chapterId || (idx + 1).toString(),
			chapterName: ch.chapterName || ch.name || "未知章节",
			chapterHref: ch.href || ch.chapterHref,
			updateTime: ch.updateTime || new Date().toISOString()
		}));

		const data = {
			data: normalizedChapters,
			total: normalizedChapters.length
		};

		console.log(`[小说] 返回 ${normalizedChapters.length} 个章节`);
		SUCCESS(ctx, true, "成功", data);
	} catch (error) {
		console.error("[小说] 获取章节失败:", error.message);
		ERROR(ctx, error.message || "获取章节失败");
	}
});

/**
 * 获取章节内容
 */
router.post("/bookMicroservices/book/getChapterContent", async (ctx) => {
	const { bookId, chapterId, chapterHref } = ctx.request.body;

	if (!bookId || !chapterId) {
		ERROR(ctx, "参数错误");
		return;
	}

	try {
		console.log(`[小说] 获取章节内容 - chapterId: ${chapterId}`);
		
		if (!chapterHref) {
			ERROR(ctx, "缺少章节链接");
			return;
		}

		// 获取章节内容
		const content = await kanshuhouSpider.getChapterContent(chapterHref);

		if (!content || !content.content) {
			ERROR(ctx, "无法获取章节内容");
			return;
		}

		const data = {
			title: content.title || `第${chapterId}章`,
			content: content.content
		};

		console.log(`[小说] 返回章节内容 (${content.content.length}字)`);
		SUCCESS(ctx, true, "成功", data);
	} catch (error) {
		console.error("[小说] 获取章节内容失败:", error.message);
		ERROR(ctx, error.message || "获取章节内容失败");
	}
});

module.exports = router;
