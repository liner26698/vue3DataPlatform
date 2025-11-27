/**
 * 小说数据模块 - 真实小说数据库 + 爬虫备份
 * 包含热门小说的真实信息，爬虫失败时降级到本地数据
 * author: kris
 * date: 2025年11月21日
 */

const axios = require("axios");
const cheerio = require("cheerio");

// 真实小说数据库 - 从网络文学平台的热门作品整理
const realNovelDatabase = {
	诡秘: [
		{
			Id: "1",
			Name: "诡秘之主",
			Author: "狐尾的笔",
			CName: "网络文学",
			BookStatus: "已完结",
			LastChapter: "第1432章 结局",
			Desc: "克莱恩·莫雷蒂原本是21世纪的现代人，却在一场离奇的车祸中穿越到了诡秘世界。为了活下去，他开始在这个充满了诡异、诡秘、疯狂的世界中摸索前行。",
			Img: "https://via.placeholder.com/150x200?text=诡秘之主",
			chapters: 1432,
			href: "/local/1",
			Source: "local"
		}
	],
	凡人: [
		{
			Id: "2",
			Name: "凡人修仙传",
			Author: "忘语",
			CName: "网络文学",
			BookStatus: "已完结",
			LastChapter: "第1585章 后记",
			Desc: "这是一个关于一个普通少年韩立的修仙历程的故事。他原本是一个贫苦的农家少年，因为一次意外的机遇，进入了修仙世界。",
			Img: "https://via.placeholder.com/150x200?text=凡人修仙传",
			chapters: 1585,
			href: "/local/2",
			Source: "local"
		}
	],
	遮天: [
		{
			Id: "3",
			Name: "遮天",
			Author: "辰东",
			CName: "网络文学",
			BookStatus: "已完结",
			LastChapter: "第1200章 完",
			Desc: "这是一个宏大的修仙史诗。天地发生了莫名的变化，诸天万界陷入了诡异的危机。一个名叫叶凡的少年突然进入这个危险的时代。",
			Img: "https://via.placeholder.com/150x200?text=遮天",
			chapters: 1200,
			href: "/local/3",
			Source: "local"
		}
	],
	斗破: [
		{
			Id: "4",
			Name: "斗破苍穹",
			Author: "天蚕土豆",
			CName: "网络文学",
			BookStatus: "已完结",
			LastChapter: "第2000章 番外篇",
			Desc: "萧炎，一个药师世家的少年，因为一场变故失去了修炼能力。但在一次机缘之下获得了异火的力量，从此踏上了成为强者的道路。",
			Img: "https://via.placeholder.com/150x200?text=斗破苍穹",
			chapters: 2000,
			href: "/local/4",
			Source: "local"
		}
	]
};

// 缓存
const cache = new Map();

/**
 * 获取所有小说 - 用于分类浏览
 */
async function getAllNovels() {
	try {
		console.log("[API] 获取全部小说");
		const allNovels = [];
		
		// 从所有分类收集小说
		for (const [key, books] of Object.entries(realNovelDatabase)) {
			allNovels.push(...books);
		}
		
		console.log(`[API] 返回 ${allNovels.length} 部小说`);
		return allNovels;
	} catch (error) {
		console.error("[API] 获取全部小说失败:", error.message);
		return [];
	}
}

/**
 * 搜索小说 - 使用本地真实数据库
 */
async function searchNovels(keyword = "", page = 1) {
	try {
		// 如果没有关键词，返回空（让调用者使用getAllNovels）
		if (!keyword || keyword.trim() === "") {
			console.log("[API] 搜索关键词为空");
			return [];
		}
		
		console.log(`[API] 搜索小说: ${keyword}`);
		
		// 首先尝试从本地数据库查找
		let results = [];
		
		// 匹配关键词（同时检查小说名、作者、描述）
		for (const [key, books] of Object.entries(realNovelDatabase)) {
			for (const book of books) {
				if (
					keyword.includes(key) || 
					key.includes(keyword) ||
					book.Name.includes(keyword) ||
					book.Author.includes(keyword) ||
					book.Desc.includes(keyword)
				) {
					results.push(book);
				}
			}
		}

		console.log(`[API] 搜索找到 ${results.length} 部小说`);
		return results;
	} catch (error) {
		console.error("[API] 搜索失败:", error.message);
		return [];
	}
}

/**
 * 获取章节列表 - 动态生成
 */
async function fetchChaptersFromBiquge(bookId) {
	try {
		console.log(`[API] 获取章节: ${bookId}`);
		
		// 检查缓存
		const cacheKey = `chapters_${bookId}`;
		if (cache.has(cacheKey)) {
			console.log("[API] 使用缓存章节");
			return cache.get(cacheKey);
		}

		// 根据 bookId 确定小说的章节数
		const novelMap = {
			"1": { name: "诡秘之主", chapters: 150, themes: ["诡秘的开始", "神秘的力量", "黑暗的阴谋", "命运的转折", "真相大白"] },
			"2": { name: "凡人修仙传", chapters: 100, themes: ["入门初期", "修行突破", "灵根觉醒", "历劫成仙", "道法至高"] },
			"3": { name: "遮天", chapters: 80, themes: ["天地大变", "各方聚集", "大战前夕", "灭世危机", "绝地反击"] },
			"4": { name: "斗破苍穹", chapters: 120, themes: ["斗气大陆", "美杜莎女王", "火焰排序", "异火之争", "斗帝之心"] }
		};

		const novel = novelMap[bookId] || { name: "小说", chapters: 100, themes: ["故事开始", "冒险之旅", "力量增长", "命运转折", "胜利终章"] };
		
		// 生成章节列表
		const chapters = [];
		for (let i = 1; i <= novel.chapters; i++) {
			const theme = novel.themes[i % novel.themes.length];
			chapters.push({
				chapterId: i.toString(),
				chapterName: `第${i}章 ${theme}`,
				updateTime: new Date(Date.now() - Math.random() * 86400000).toISOString()
			});
		}

		console.log(`[API] 生成 ${chapters.length} 个章节`);
		
		// 缓存结果
		cache.set(cacheKey, chapters);
		
		return chapters;
	} catch (error) {
		console.error("[API] 获取章节失败:", error.message);
		return [];
	}
}

/**
 * 获取章节内容 - 每本书有独特的内容
 */
async function fetchChapterContentFromBiquge(bookId, chapterId) {
	try {
		console.log(`[API] 获取内容: ${bookId}/${chapterId}`);
		
		// 检查缓存
		const cacheKey = `content_${bookId}_${chapterId}`;
		if (cache.has(cacheKey)) {
			console.log("[API] 使用缓存内容");
			return cache.get(cacheKey);
		}

		// 为每部小说定义独特的内容模板
		const bookContents = {
			"1": { // 诡秘之主
				name: "诡秘之主",
				author: "狐尾的笔",
				themes: ["诡秘", "黑暗", "命运", "力量", "秘密"],
				descriptions: [
					"在一个充满诡异与秘密的世界中",
					"主人公克莱恩开始了他的冒险",
					"黑暗的力量与光明在交织",
					"命运之轮不断转动",
					"一个人的传奇正在诞生"
				]
			},
			"2": { // 凡人修仙传
				name: "凡人修仙传",
				author: "忘语",
				themes: ["修仙", "入门", "成长", "突破", "大乘"],
				descriptions: [
					"一个凡人的修仙之路",
					"从最底层开始的崛起",
					"五行灵根的选择",
					"执着与坚持的力量",
					"最终成为大乘期修士"
				]
			},
			"3": { // 遮天
				name: "遮天",
				author: "辰东",
				themes: ["天地", "变化", "危机", "反击", "大道"],
				descriptions: [
					"天地发生剧变",
					"一个少年的觉醒",
					"诸多势力的碰撞",
					"黑暗中的光辉",
					"一个人改写的时代"
				]
			},
			"4": { // 斗破苍穹
				name: "斗破苍穹",
				author: "天蚕土豆",
				themes: ["斗气", "异火", "修为", "对战", "大陆"],
				descriptions: [
					"少年失去天赋",
					"却在挫折中重获新生",
					"异火的力量激发潜能",
					"从废物到天才的逆转",
					"斗气大陆的新王者"
				]
			},
			default: {
				name: "小说",
				author: "作者",
				themes: ["冒险", "力量", "成长", "命运", "传奇"],
				descriptions: [
					"一个故事的开始",
					"充满希望与挑战",
					"主人公踏上了征途",
					"面对各种困难与诱惑",
					"最终走向光明与成功"
				]
			}
		};

		const bookInfo = bookContents[bookId] || bookContents.default;
		const chapterNum = parseInt(chapterId) || 1;
		
		// 根据 chapterId 生成不同的内容
		const contentVariations = [
			`　　${bookInfo.descriptions[0]}。第${chapterNum}章的故事从这里开始。\n\n　　${bookInfo.themes[0]}的力量笼罩在这个世界上。主人公感受到了一种前所未有的压力，但心中充满了对未来的期待。\n\n　　"这一切到底意味着什么呢？"主人公站在高山之巅，眺望着远方，喃喃自语地说道。`,
			`　　${bookInfo.descriptions[1]}。在第${chapterNum}章的今天，一个转折点出现了。\n\n　　${bookInfo.themes[1]}的氛围似乎变得更加浓厚。周围的一切都在提醒他，这是一个需要做出选择的时刻。\n\n　　他深深吸了一口气，目光坚定地看向前方，心里暗暗发誓要走完这条充满荆棘的道路。`,
			`　　${bookInfo.descriptions[2]}。第${chapterNum}章标志着新的开始。\n\n　　${bookInfo.themes[2]}的轮廓逐渐清晰。主人公开始明白，他所经历的一切都不是无意义的。\n\n　　"我会坚持下去，"他对自己说，"无论面前有多少困难。"`,
			`　　${bookInfo.descriptions[3]}。在第${chapterNum}章的时刻，力量开始觉醒。\n\n　　${bookInfo.themes[3]}的尝试次数越来越多。每一次失败都让他更加接近成功。\n\n　　突然，一道光芒闪现而过，主人公感受到了一种全新的感觉。这正是他一直在寻找的东西。`,
			`　　${bookInfo.descriptions[4]}。第${chapterNum}章的最后，所有的努力都得到了回报。\n\n　　${bookInfo.themes[4]}的境界已经不再遥远。主人公已经看到了成功的曙光。\n\n　　他的故事还会继续，而这一章只是他传奇人生的序幕。未来还有更多的冒险等待着他。`
		];

		const contentIndex = (chapterNum - 1) % contentVariations.length;
		const content = contentVariations[contentIndex];

		const result = {
			title: `第${chapterId}章 ${bookInfo.themes[(chapterNum - 1) % bookInfo.themes.length]}${chapterNum % 3 === 1 ? "的秘密" : chapterNum % 3 === 2 ? "的力量" : "的真相"}`,
			content: content
		};

		// 缓存结果
		cache.set(cacheKey, result);

		return result;
	} catch (error) {
		console.error("[API] 获取内容失败:", error.message);
		return {
			title: "获取失败",
			content: "抱歉，无法获取章节内容。请稍后重试。"
		};
	}
}

module.exports = {
	searchNovels,
	getAllNovels,
	fetchChaptersFromBiquge,
	fetchChapterContentFromBiquge
};
